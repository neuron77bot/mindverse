import type { FastifyInstance } from 'fastify';
import { fal } from '@fal-ai/client';

const TEXT_TO_IMAGE_MODEL  = 'fal-ai/nano-banana';
const IMAGE_TO_IMAGE_MODEL = 'fal-ai/nano-banana/edit';

// ── Text-to-Image ─────────────────────────────────────────────────────────────
interface TextToImageBody {
  prompt: string;
  num_images?: number;
  aspect_ratio?: '21:9' | '16:9' | '3:2' | '4:3' | '5:4' | '1:1' | '4:5' | '3:4' | '2:3' | '9:16';
  output_format?: 'jpeg' | 'png' | 'webp';
}

// ── Image-to-Image ────────────────────────────────────────────────────────────
interface ImageToImageBody {
  prompt: string;
  image_urls: string[];           // una o más URLs de imágenes base
  num_images?: number;
  aspect_ratio?: 'auto' | '21:9' | '16:9' | '3:2' | '4:3' | '5:4' | '1:1' | '4:5' | '3:4' | '2:3' | '9:16';
  output_format?: 'jpeg' | 'png' | 'webp';
}

export async function imageRoutes(app: FastifyInstance) {

  /**
   * POST /images/text-to-image
   * Genera una imagen a partir de un texto.
   *
   * Body:
   *   prompt       — descripción de la imagen (requerido)
   *   num_images   — cantidad de imágenes (default: 1)
   *   aspect_ratio — relación de aspecto, ej: "1:1", "16:9" (default: "1:1")
   *   output_format — "jpeg" | "png" | "webp" (default: "png")
   */
  app.post<{ Body: TextToImageBody }>('/text-to-image', async (request, reply) => {
    const {
      prompt,
      num_images = 1,
      aspect_ratio = '1:1',
      output_format = 'png',
    } = request.body;

    if (!prompt?.trim()) {
      return reply.status(400).send({ error: '"prompt" es requerido.' });
    }

    try {
      const result = await fal.subscribe(TEXT_TO_IMAGE_MODEL, {
        input: { prompt, num_images, aspect_ratio, output_format },
      });

      return reply.send({
        success: true,
        mode: 'text-to-image',
        model: TEXT_TO_IMAGE_MODEL,
        images: (result.data as any)?.images ?? [],
        prompt,
      });
    } catch (err: any) {
      app.log.error(err);
      return reply.status(500).send({
        error: 'Error generando imagen.',
        detail: err?.message ?? 'Unknown error',
      });
    }
  });

  /**
   * POST /images/image-to-image
   * Edita una o más imágenes usando un prompt (fal-ai/nano-banana/edit).
   *
   * Body:
   *   prompt        — instrucción de edición (requerido)
   *   image_urls    — array de URLs de las imágenes base (requerido, al menos 1)
   *   num_images    — cantidad de imágenes resultado (default: 1)
   *   aspect_ratio  — "auto" | "1:1" | "16:9" etc. (default: "auto")
   *   output_format — "jpeg" | "png" | "webp" (default: "png")
   */
  app.post<{ Body: ImageToImageBody }>('/image-to-image', async (request, reply) => {
    const {
      prompt,
      image_urls,
      num_images = 1,
      aspect_ratio = 'auto',
      output_format = 'png',
    } = request.body;

    if (!prompt?.trim()) {
      return reply.status(400).send({ error: '"prompt" es requerido.' });
    }
    if (!Array.isArray(image_urls) || image_urls.length === 0) {
      return reply.status(400).send({ error: '"image_urls" debe ser un array con al menos una URL.' });
    }

    try {
      const result = await fal.subscribe(IMAGE_TO_IMAGE_MODEL, {
        input: { prompt, image_urls, num_images, aspect_ratio, output_format },
      });

      return reply.send({
        success: true,
        mode: 'image-to-image',
        model: IMAGE_TO_IMAGE_MODEL,
        images: (result.data as any)?.images ?? [],
        description: (result.data as any)?.description ?? '',
        prompt,
        source_images: image_urls,
      });
    } catch (err: any) {
      app.log.error(err);
      return reply.status(500).send({
        error: 'Error procesando imagen.',
        detail: err?.message ?? 'Unknown error',
      });
    }
  });
}
