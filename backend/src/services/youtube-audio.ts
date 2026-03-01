import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs/promises';
import { existsSync } from 'fs';

const execAsync = promisify(exec);

const TEMP_DIR = '/tmp/youtube-audio';

export interface DownloadAudioOptions {
  youtubeUrl: string;
  startTime?: number; // segundos
  duration?: number; // duración esperada del video a mezclar
}

export interface AudioResult {
  path: string;
  duration: number;
}

/**
 * Valida que la URL sea de YouTube
 */
export function isValidYoutubeUrl(url: string): boolean {
  const youtubeRegex = /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)\/.+$/;
  return youtubeRegex.test(url);
}

/**
 * Descarga audio de YouTube usando yt-dlp y lo extrae desde startTime
 * @param options - Opciones de descarga
 * @returns Ruta del archivo de audio procesado
 */
export async function downloadYoutubeAudio(options: DownloadAudioOptions): Promise<AudioResult> {
  const { youtubeUrl, startTime = 0, duration } = options;

  if (!isValidYoutubeUrl(youtubeUrl)) {
    throw new Error('URL de YouTube inválida');
  }

  // Crear directorio temporal
  await fs.mkdir(TEMP_DIR, { recursive: true });

  const timestamp = Date.now();
  const rawAudioPath = `${TEMP_DIR}/raw_${timestamp}.m4a`;
  const processedAudioPath = `${TEMP_DIR}/processed_${timestamp}.m4a`;

  try {
    // 1. Descargar audio con yt-dlp
    console.log(`[youtube-audio] Descargando audio de: ${youtubeUrl}`);
    await execAsync(
      `yt-dlp -f bestaudio -x --audio-format m4a -o "${rawAudioPath}" "${youtubeUrl}"`
    );

    if (!existsSync(rawAudioPath)) {
      throw new Error('No se pudo descargar el audio de YouTube');
    }

    // 2. Obtener duración del audio descargado
    const { stdout: durationOutput } = await execAsync(
      `ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "${rawAudioPath}"`
    );
    const totalDuration = parseFloat(durationOutput.trim());

    console.log(`[youtube-audio] Duración total: ${totalDuration}s`);

    // 3. Validar que hay suficiente audio desde startTime
    if (startTime >= totalDuration) {
      throw new Error(
        `El startTime (${startTime}s) excede la duración del audio (${totalDuration}s)`
      );
    }

    // 4. Extraer segmento de audio si se especifica startTime o duration
    let finalAudioPath = rawAudioPath;
    let audioDuration = totalDuration - startTime;

    if (startTime > 0 || duration) {
      const cutDuration = duration || totalDuration - startTime;
      console.log(
        `[youtube-audio] Extrayendo desde ${startTime}s, duración: ${cutDuration}s`
      );

      const ffmpegCmd = [
        'ffmpeg',
        '-y',
        `-ss ${startTime}`,
        duration ? `-t ${duration}` : '',
        `-i "${rawAudioPath}"`,
        '-c copy',
        `"${processedAudioPath}"`,
      ]
        .filter(Boolean)
        .join(' ');

      await execAsync(ffmpegCmd);

      // Limpiar audio raw
      await fs.unlink(rawAudioPath).catch(() => {});

      finalAudioPath = processedAudioPath;
      audioDuration = cutDuration;
    }

    console.log(`[youtube-audio] Audio procesado: ${finalAudioPath}`);

    return {
      path: finalAudioPath,
      duration: audioDuration,
    };
  } catch (error: any) {
    // Limpiar archivos en caso de error
    await fs.unlink(rawAudioPath).catch(() => {});
    await fs.unlink(processedAudioPath).catch(() => {});

    console.error('[youtube-audio] Error:', error.message);
    throw new Error(`Error descargando audio de YouTube: ${error.message}`);
  }
}

/**
 * Limpia archivos temporales de audio
 */
export async function cleanupAudioFile(path: string): Promise<void> {
  try {
    if (existsSync(path)) {
      await fs.unlink(path);
      console.log(`[youtube-audio] Limpiado: ${path}`);
    }
  } catch (error: any) {
    console.warn(`[youtube-audio] No se pudo limpiar ${path}:`, error.message);
  }
}
