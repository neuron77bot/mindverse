import type { FastifyInstance } from 'fastify';
import { fal } from '@fal-ai/client';
import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs/promises';
import { Storyboard } from '../models/Storyboard';
import {
  downloadYoutubeAudio,
  cleanupAudioFile,
  isValidYoutubeUrl,
} from '../services/youtube-audio';

const execAsync = promisify(exec);

const KLING_VIDEO_MODEL = 'fal-ai/kling-video/v2.5-turbo/standard/image-to-video';
const STORAGE_DIR = '/var/www/mindverse_dev/storage/compiled-videos';
const PUBLIC_URL_BASE = 'https://devalliance.com.ar/storage/compiled-videos';

// ── Video Generation Body ─────────────────────────────────────────────────────
interface VideoGenerationBody {
  imageUrl: string;
  prompt: string;
  duration?: number; // 5 o 10 segundos
  aspectRatio?: string; // aspect_ratio, default "1:1"
}

// ── Video Compilation Body ────────────────────────────────────────────────────
interface VideoCompilationBody {
  storyboardId: string;
  videoUrls: string[];
  youtubeUrl?: string;
  audioStartTime?: number;
}

export async function videoRoutes(app: FastifyInstance) {
  /**
   * POST /videos/generate
   * Genera un video a partir de una imagen usando Kling AI.
   *
   * Body:
   *   imageUrl     — URL de la imagen base (requerido)
   *   prompt       — descripción del movimiento/acción (requerido)
   *   duration     — duración en segundos: 5 o 10 (default: 5)
   *   aspectRatio  — relación de aspecto, ej: "1:1", "16:9" (default: "1:1")
   */
  app.post<{ Body: VideoGenerationBody }>(
    '/generate',
    {
      schema: {
        tags: ['videos'],
        summary: 'Generar video desde imagen (Kling AI via fal.ai)',
        body: {
          type: 'object',
          required: ['imageUrl', 'prompt'],
          properties: {
            imageUrl: { type: 'string', description: 'URL de la imagen base' },
            prompt: { type: 'string', description: 'Prompt describiendo el movimiento del video' },
            duration: {
              type: 'number',
              description: 'Duración del video en segundos (5 o 10)',
            },
            aspectRatio: {
              type: 'string',
              default: '1:1',
              description: 'Aspect ratio del video',
            },
          },
        },
      },
    },
    async (request, reply) => {
      const { imageUrl, prompt, duration = 5, aspectRatio = '1:1' } = request.body;

      if (!imageUrl?.trim()) {
        return reply.status(400).send({ error: '"imageUrl" es requerido.' });
      }

      if (!prompt?.trim()) {
        return reply.status(400).send({ error: '"prompt" es requerido.' });
      }

      if (duration !== 5 && duration !== 10) {
        return reply.status(400).send({ error: '"duration" debe ser 5 o 10 segundos.' });
      }

      try {
        app.log.info({
          msg: 'Iniciando generación de video con Kling AI',
          imageUrl,
          prompt,
          duration,
          aspectRatio,
        });

        const result = await fal.subscribe(KLING_VIDEO_MODEL, {
          input: {
            prompt,
            image_url: imageUrl,
            duration: String(duration) as '5' | '10',
          },
          logs: true,
          onQueueUpdate: (update) => {
            if (update.status === 'IN_PROGRESS') {
              app.log.info({
                msg: 'Video en progreso',
                logs: update.logs?.map((l) => l.message).join('\n'),
              });
            }
          },
        });

        const videoData = result.data as any;

        if (!videoData?.video?.url) {
          app.log.error({ msg: 'Respuesta de fal.ai sin URL de video', data: videoData });
          return reply.status(500).send({
            error: 'La generación de video no retornó una URL válida.',
          });
        }

        const videoUrl = videoData.video.url;
        const contentType = videoData.video.content_type || 'video/mp4';
        const fileSize = videoData.video.file_size || null;

        app.log.info({
          msg: 'Video generado exitosamente',
          videoUrl,
          contentType,
          fileSize,
        });

        return reply.send({
          success: true,
          videoUrl,
          contentType,
          fileSize,
          model: KLING_VIDEO_MODEL,
          prompt,
          duration,
          aspectRatio,
        });
      } catch (err: any) {
        app.log.error({
          msg: 'Error generando video',
          error: err?.message,
          stack: err?.stack,
        });

        return reply.status(500).send({
          error: 'Error generando video.',
          detail: err?.message ?? 'Unknown error',
        });
      }
    }
  );

  /**
   * POST /videos/compile
   * Compila múltiples videos en un único MP4 usando ffmpeg.
   * Opcionalmente agrega música de fondo desde YouTube.
   *
   * Body:
   *   storyboardId   — ID del storyboard (requerido)
   *   videoUrls      — Array de URLs de videos a compilar (requerido)
   *   youtubeUrl     — URL de YouTube para música de fondo (opcional)
   *   audioStartTime — Tiempo de inicio en segundos para el audio (opcional, default: 0)
   */
  app.post<{ Body: VideoCompilationBody }>(
    '/compile',
    {
      schema: {
        tags: ['videos'],
        summary: 'Compilar videos de frames en un único MP4',
        body: {
          type: 'object',
          required: ['storyboardId', 'videoUrls'],
          properties: {
            storyboardId: { type: 'string' },
            videoUrls: { type: 'array', items: { type: 'string' } },
            youtubeUrl: { type: 'string', description: 'URL de YouTube para música de fondo' },
            audioStartTime: {
              type: 'number',
              description: 'Tiempo de inicio del audio en segundos',
              default: 0,
            },
          },
        },
      },
    },
    async (request, reply) => {
      const { storyboardId, videoUrls, youtubeUrl, audioStartTime = 0 } = request.body;

      if (!videoUrls || videoUrls.length === 0) {
        return reply.status(400).send({ error: 'No videos to compile' });
      }

      // Validar URL de YouTube si se proporciona
      if (youtubeUrl && !isValidYoutubeUrl(youtubeUrl)) {
        return reply.status(400).send({ error: 'URL de YouTube inválida' });
      }

      let audioPath: string | null = null;

      try {
        app.log.info({
          msg: 'Iniciando compilación de videos',
          storyboardId,
          videoCount: videoUrls.length,
          withMusic: !!youtubeUrl,
        });

        // 1. Crear directorio de storage
        await fs.mkdir(STORAGE_DIR, { recursive: true });

        // 2. Descargar videos a /tmp
        const tempFiles: string[] = [];
        for (const [index, url] of videoUrls.entries()) {
          app.log.info({ msg: `Descargando video ${index + 1}/${videoUrls.length}`, url });
          const response = await fetch(url);
          if (!response.ok) {
            throw new Error(`Error descargando video ${index + 1}: ${response.statusText}`);
          }
          const buffer = await response.arrayBuffer();
          const tempPath = `/tmp/video_${index}_${Date.now()}.mp4`;
          await fs.writeFile(tempPath, Buffer.from(buffer));
          tempFiles.push(tempPath);
        }

        // 3. Crear lista de concatenación para ffmpeg
        const listPath = `/tmp/concat_${Date.now()}.txt`;
        const listContent = tempFiles.map((f) => `file '${f}'`).join('\n');
        await fs.writeFile(listPath, listContent);

        // 4. Compilar videos base (sin música aún)
        const baseVideoPath = `/tmp/base_${storyboardId}_${Date.now()}.mp4`;
        app.log.info({ msg: 'Concatenando videos base' });

        await execAsync(`ffmpeg -y -f concat -safe 0 -i ${listPath} -c copy ${baseVideoPath}`);

        // 5. Obtener duración del video compilado
        const { stdout: durationOutput } = await execAsync(
          `ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "${baseVideoPath}"`
        );
        const videoDuration = parseFloat(durationOutput.trim());
        app.log.info({ msg: 'Duración del video', duration: videoDuration });

        // 6. Si hay música de YouTube, descargarla y mezclarla
        const outputPath = `${STORAGE_DIR}/${storyboardId}.mp4`;

        if (youtubeUrl) {
          app.log.info({ msg: 'Descargando audio de YouTube', youtubeUrl, audioStartTime });

          const audioResult = await downloadYoutubeAudio({
            youtubeUrl,
            startTime: audioStartTime,
            duration: videoDuration,
          });

          audioPath = audioResult.path;

          app.log.info({
            msg: 'Mezclando audio con video',
            audioDuration: audioResult.duration,
            videoDuration,
          });

          // Mezclar video + audio con volumen balanceado
          // Video audio: 70%, Music: 30%
          const ffmpegMixCmd = [
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

          await execAsync(ffmpegMixCmd);

          // Limpiar video base
          await fs.unlink(baseVideoPath).catch(() => {});
        } else {
          // Sin música, solo mover el video base al output final
          await execAsync(`mv "${baseVideoPath}" "${outputPath}"`);
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
          app.log.info({ msg: 'Video compilado guardado en DB', publicUrl });
        } else {
          app.log.warn({ msg: 'Storyboard no encontrado en DB', storyboardId });
        }

        // 9. Limpiar archivos temporales
        await Promise.all([
          ...tempFiles.map((f) => fs.unlink(f).catch(() => {})),
          fs.unlink(listPath).catch(() => {}),
        ]);

        if (audioPath) {
          await cleanupAudioFile(audioPath);
        }

        app.log.info({ msg: 'Compilación exitosa', videoUrl: publicUrl });

        return reply.send({ success: true, videoUrl: publicUrl });
      } catch (err: any) {
        app.log.error({
          msg: 'Error compilando videos',
          error: err?.message,
          stack: err?.stack,
        });

        // Limpiar audio en caso de error
        if (audioPath) {
          await cleanupAudioFile(audioPath);
        }

        return reply.status(500).send({
          error: 'Error compilando videos',
          detail: err?.message ?? 'Unknown error',
        });
      }
    }
  );
}
