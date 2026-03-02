import type { FastifyInstance } from 'fastify';
import { fal } from '@fal-ai/client';
import { agenda } from '../services/job-queue';
import { isValidYoutubeUrl } from '../services/youtube-audio';

const KLING_VIDEO_MODEL = 'fal-ai/kling-video/v2.5-turbo/standard/image-to-video';

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
   * Crea un job para compilar múltiples videos en un único MP4.
   * Retorna el jobId que se puede usar para consultar el progreso.
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
        summary: 'Crear job para compilar videos en background',
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
        response: {
          200: {
            type: 'object',
            properties: {
              success: { type: 'boolean' },
              jobId: { type: 'string' },
              message: { type: 'string' },
            },
          },
          400: {
            type: 'object',
            properties: { error: { type: 'string' } },
          },
          401: {
            type: 'object',
            properties: { error: { type: 'string' } },
          },
          500: {
            type: 'object',
            properties: { error: { type: 'string' } },
          },
        },
      },
    },
    async (request, reply) => {
      const userId = request.jwtUser?.sub;
      if (!userId) {
        return reply.status(401).send({ error: 'No autorizado' });
      }

      const { storyboardId, videoUrls, youtubeUrl, audioStartTime = 0 } = request.body;

      if (!videoUrls || videoUrls.length === 0) {
        return reply.status(400).send({ error: 'videoUrls no puede estar vacío' });
      }

      // Validar URL de YouTube si se proporciona
      if (youtubeUrl && !isValidYoutubeUrl(youtubeUrl)) {
        return reply.status(400).send({ error: 'URL de YouTube inválida' });
      }

      try {
        // Crear job para compilación en background
        const job = await agenda.now('compile-video', {
          userId,
          storyboardId,
          videoUrls,
          youtubeUrl,
          audioStartTime,
        });

        const jobId = job.attrs._id?.toString();

        app.log.info({
          msg: 'Job de compilación creado',
          jobId,
          userId,
          storyboardId,
          videoCount: videoUrls.length,
          withMusic: !!youtubeUrl,
        });

        return reply.send({
          success: true,
          jobId,
          message: `Job creado para compilar ${videoUrls.length} videos. Usa /jobs/${jobId} para consultar el progreso.`,
        });
      } catch (err: any) {
        app.log.error({
          msg: 'Error creando job de compilación',
          error: err?.message,
          stack: err?.stack,
        });

        return reply.status(500).send({
          error: 'Error creando job de compilación',
          detail: err?.message ?? 'Unknown error',
        });
      }
    }
  );
}
