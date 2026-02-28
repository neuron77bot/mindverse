import type { FastifyInstance } from 'fastify';
import { fal } from '@fal-ai/client';

const KLING_VIDEO_MODEL = 'fal-ai/kling-video/v2.5-turbo/standard/image-to-video';

// ── Video Generation Body ─────────────────────────────────────────────────────
interface VideoGenerationBody {
  imageUrl: string;
  prompt: string;
  duration?: number; // 5 o 10 segundos
  aspectRatio?: string; // aspect_ratio, default "1:1"
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
}
