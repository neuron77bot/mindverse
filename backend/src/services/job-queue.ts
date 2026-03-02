import Agenda, { Job } from 'agenda';
import { fal } from '@fal-ai/client';
import { Storyboard } from '../models/Storyboard';
import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs/promises';
import {
  downloadYoutubeAudio,
  cleanupAudioFile,
  isValidYoutubeUrl,
} from './youtube-audio';

const execAsync = promisify(exec);

const MONGO_URI =
  process.env.MONGO_URI ||
  'mongodb://mindverse:mindverse@localhost:27017/mindverse?authSource=admin';

const TEXT_TO_IMAGE_MODEL = 'fal-ai/nano-banana';
const KLING_VIDEO_MODEL = 'fal-ai/kling-video/v2.5-turbo/standard/image-to-video';
const STORAGE_DIR = '/var/www/mindverse_dev/storage/compiled-videos';
const PUBLIC_URL_BASE = 'https://devalliance.com.ar/storage/compiled-videos';

// ── Interfaces ────────────────────────────────────────────────────────────────
interface BatchGenerateImagesData {
  userId: string;
  storyboardId: string;
  frameIndices: number[]; // índices de los frames a generar
  aspectRatio?: string;
}

interface CompileVideoData {
  userId: string;
  storyboardId: string;
  videoUrls: string[];
  youtubeUrl?: string;
  audioStartTime?: number;
}

// ── Agenda Instance ───────────────────────────────────────────────────────────
const agenda = new Agenda({
  db: { address: MONGO_URI, collection: 'jobs' },
  processEvery: '5 seconds',
  maxConcurrency: 5,
  defaultConcurrency: 2,
  defaultLockLifetime: 10 * 60 * 1000, // 10 minutos
});

// ── Job: Batch Generate Images ───────────────────────────────────────────────
agenda.define<BatchGenerateImagesData>(
  'batch-generate-images',
  { concurrency: 3 },
  async (job: Job<BatchGenerateImagesData>) => {
    const { userId, storyboardId, frameIndices, aspectRatio = '1:1' } = job.attrs.data;

    console.log(
      `[Job ${job.attrs._id}] Iniciando batch generation para storyboard ${storyboardId}`
    );

    try {
      const storyboard = await Storyboard.findOne({ _id: storyboardId, userId });
      if (!storyboard) {
        throw new Error(`Storyboard ${storyboardId} no encontrado para el usuario ${userId}`);
      }

      const total = frameIndices.length;
      let completed = 0;

      for (const frameIndex of frameIndices) {
        const frame = storyboard.frames[frameIndex];
        if (!frame) {
          console.warn(`[Job ${job.attrs._id}] Frame ${frameIndex} no existe, saltando...`);
          continue;
        }

        // Generar prompt desde visualDescription
        const prompt = frame.visualDescription;

        console.log(
          `[Job ${job.attrs._id}] Generando imagen para frame ${frameIndex + 1}/${total}: ${prompt.substring(0, 50)}...`
        );

        try {
          const result = await fal.subscribe(TEXT_TO_IMAGE_MODEL, {
            input: {
              prompt,
              num_images: 1,
              aspect_ratio: aspectRatio,
              output_format: 'png',
            },
          });

          const images = (result.data as any)?.images ?? [];
          if (images.length > 0) {
            frame.imageUrl = images[0].url;
            frame.imagePrompt = prompt;
            frame.imageAspectRatio = aspectRatio;
            frame.generatedAt = new Date();

            console.log(
              `[Job ${job.attrs._id}] ✅ Imagen generada para frame ${frameIndex}: ${frame.imageUrl}`
            );
          } else {
            console.warn(`[Job ${job.attrs._id}] ⚠️ No se generó imagen para frame ${frameIndex}`);
          }
        } catch (err: any) {
          console.error(
            `[Job ${job.attrs._id}] ❌ Error generando imagen para frame ${frameIndex}:`,
            err.message
          );
          // Continuar con el siguiente frame en vez de fallar todo
        }

        completed++;
        const progress = Math.round((completed / total) * 100);
        await job.progress(progress);
      }

      // Guardar storyboard con las imágenes generadas
      await storyboard.save();

      console.log(
        `[Job ${job.attrs._id}] ✅ Batch generation completado: ${completed}/${total} frames`
      );
    } catch (err: any) {
      console.error(`[Job ${job.attrs._id}] ❌ Error en batch generation:`, err.message);
      throw err;
    }
  }
);

// ── Job: Compile Video ────────────────────────────────────────────────────────
agenda.define<CompileVideoData>(
  'compile-video',
  { concurrency: 2 }, // Máximo 2 compilaciones simultáneas
  async (job: Job<CompileVideoData>) => {
    const { userId, storyboardId, videoUrls, youtubeUrl, audioStartTime = 0 } = job.attrs.data;

    console.log(`[Job ${job.attrs._id}] Iniciando compilación de video para ${storyboardId}`);

    let audioPath: string | null = null;

    try {
      await job.progress(5);

      // Validar URL de YouTube si se proporciona
      if (youtubeUrl && !isValidYoutubeUrl(youtubeUrl)) {
        throw new Error('URL de YouTube inválida');
      }

      // 1. Crear directorio de storage
      await fs.mkdir(STORAGE_DIR, { recursive: true });
      await job.progress(10);

      // 2. Descargar videos a /tmp
      const tempFiles: string[] = [];
      const total = videoUrls.length;

      for (const [index, url] of videoUrls.entries()) {
        console.log(
          `[Job ${job.attrs._id}] Descargando video ${index + 1}/${total}: ${url.substring(0, 50)}...`
        );

        const response = await fetch(url);
        if (!response.ok) {
          throw new Error(`Error descargando video ${index + 1}: ${response.statusText}`);
        }

        const buffer = await response.arrayBuffer();
        const tempPath = `/tmp/video_${index}_${Date.now()}.mp4`;
        await fs.writeFile(tempPath, Buffer.from(buffer));
        tempFiles.push(tempPath);

        const progress = 10 + Math.round((index / total) * 30);
        await job.progress(progress);
      }

      // 3. Crear lista de concatenación para ffmpeg
      const listPath = `/tmp/concat_${Date.now()}.txt`;
      const listContent = tempFiles.map((f) => `file '${f}'`).join('\n');
      await fs.writeFile(listPath, listContent);
      await job.progress(45);

      // 4. Compilar videos base
      const baseVideoPath = `/tmp/base_${storyboardId}_${Date.now()}.mp4`;
      console.log(`[Job ${job.attrs._id}] Concatenando videos...`);

      await execAsync(`ffmpeg -y -f concat -safe 0 -i ${listPath} -c copy ${baseVideoPath}`);
      await job.progress(60);

      // 5. Obtener duración del video compilado
      const { stdout: durationOutput } = await execAsync(
        `ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "${baseVideoPath}"`
      );
      const videoDuration = parseFloat(durationOutput.trim());
      console.log(`[Job ${job.attrs._id}] Duración del video: ${videoDuration}s`);
      await job.progress(65);

      // 6. Procesar audio si existe YouTube URL
      const outputPath = `${STORAGE_DIR}/${storyboardId}.mp4`;

      if (youtubeUrl) {
        console.log(`[Job ${job.attrs._id}] Descargando audio de YouTube...`);

        const audioResult = await downloadYoutubeAudio({
          youtubeUrl,
          startTime: audioStartTime,
          duration: videoDuration,
        });
        audioPath = audioResult.path;
        await job.progress(75);

        // Detectar si el video base tiene audio
        let hasAudio = false;
        try {
          const { stdout: audioCheck } = await execAsync(
            `ffprobe -v error -select_streams a -show_entries stream=codec_type -of default=noprint_wrappers=1:nokey=1 "${baseVideoPath}"`
          );
          hasAudio = audioCheck.trim() === 'audio';
        } catch {
          hasAudio = false;
        }

        console.log(`[Job ${job.attrs._id}] Mezclando audio con video (hasAudio: ${hasAudio})...`);

        let ffmpegMixCmd: string;

        if (hasAudio) {
          // Video tiene audio → mezclar ambos (70% video, 30% música)
          ffmpegMixCmd = [
            'ffmpeg -y',
            `-i "${baseVideoPath}"`,
            `-i "${audioPath}"`,
            '-filter_complex',
            '"[0:a]volume=0.7[a0];[1:a]volume=0.3[a1];[a0][a1]amix=inputs=2:duration=first[aout]"',
            '-map 0:v',
            '-map "[aout]"',
            '-c:v copy',
            '-c:a aac',
            '-shortest',
            `"${outputPath}"`,
          ].join(' ');
        } else {
          // Video NO tiene audio → agregar audio directo
          ffmpegMixCmd = [
            'ffmpeg -y',
            `-i "${baseVideoPath}"`,
            `-i "${audioPath}"`,
            '-map 0:v',
            '-map 1:a',
            '-c:v copy',
            '-c:a aac',
            '-shortest',
            `"${outputPath}"`,
          ].join(' ');
        }

        await execAsync(ffmpegMixCmd);
        await job.progress(90);

        // Limpiar video base
        await fs.unlink(baseVideoPath).catch(() => {});
      } else {
        // Sin música, mover video base al output final
        await execAsync(`mv "${baseVideoPath}" "${outputPath}"`);
        await job.progress(90);
      }

      // 7. Generar URL pública
      const publicUrl = `${PUBLIC_URL_BASE}/${storyboardId}.mp4`;

      // 8. Guardar en DB
      const storyboard = await Storyboard.findById(storyboardId);
      if (storyboard) {
        storyboard.compiledVideoUrl = publicUrl;
        if (youtubeUrl) {
          storyboard.musicYoutubeUrl = youtubeUrl;
          storyboard.musicStartTime = audioStartTime;
        }
        await storyboard.save();
        console.log(`[Job ${job.attrs._id}] Video compilado guardado en DB: ${publicUrl}`);
      } else {
        console.warn(`[Job ${job.attrs._id}] Storyboard no encontrado en DB`);
      }

      // 9. Limpiar archivos temporales
      await Promise.all([
        ...tempFiles.map((f) => fs.unlink(f).catch(() => {})),
        fs.unlink(listPath).catch(() => {}),
      ]);

      if (audioPath) {
        await cleanupAudioFile(audioPath);
      }

      await job.progress(100);
      console.log(`[Job ${job.attrs._id}] ✅ Compilación exitosa: ${publicUrl}`);
    } catch (err: any) {
      console.error(`[Job ${job.attrs._id}] ❌ Error en compilación:`, err.message);

      // Limpiar audio en caso de error
      if (audioPath) {
        await cleanupAudioFile(audioPath);
      }

      throw err;
    }
  }
);

// ── Cleanup Job (eliminar jobs completados >24h) ──────────────────────────────
agenda.define('cleanup-old-jobs', async () => {
  const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000); // 24 horas atrás
  const result = await agenda.cancel({
    lastFinishedAt: { $lt: cutoff },
    $or: [{ lastRunAt: { $exists: true } }, { failedAt: { $exists: true } }],
  });
  console.log(`[Cleanup] Eliminados ${result} jobs completados hace >24h`);
});

// ── Event Handlers ────────────────────────────────────────────────────────────
agenda.on('ready', () => {
  console.log('✅ Agenda ready - Job queue iniciado');
});

agenda.on('error', (error) => {
  console.error('❌ Agenda error:', error);
});

agenda.on('start', (job) => {
  console.log(`[Agenda] Job iniciado: ${job.attrs.name} (${job.attrs._id})`);
});

agenda.on('complete', (job) => {
  console.log(`[Agenda] Job completado: ${job.attrs.name} (${job.attrs._id})`);
});

agenda.on('fail', (err, job) => {
  console.error(`[Agenda] Job falló: ${job.attrs.name} (${job.attrs._id})`, err.message);
});

// ── Export ────────────────────────────────────────────────────────────────────
export { agenda };

export async function startAgenda() {
  await agenda.start();

  // Programar cleanup diario a las 3 AM
  await agenda.every('0 3 * * *', 'cleanup-old-jobs');

  console.log('🚀 Agenda iniciado con jobs definidos');
}

export async function stopAgenda() {
  await agenda.stop();
  console.log('🛑 Agenda detenido');
}
