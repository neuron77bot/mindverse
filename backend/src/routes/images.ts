import type { FastifyInstance } from 'fastify';
import { fal } from '@fal-ai/client';
import { GeneratedImage } from '../models/GeneratedImage';

const TEXT_TO_IMAGE_MODEL  = 'fal-ai/nano-banana';
const IMAGE_TO_IMAGE_MODEL = 'fal-ai/nano-banana/edit';

// ── Node info (enviado opcionalmente desde el frontend) ───────────────────────
interface NodeInfo {
  nodeId: string;
  nodeContent: string;
  nodeCategory?: string;
  nodeTemporalState?: string;
  nodeEmotionalLevel?: string;
}

// ── Text-to-Image ─────────────────────────────────────────────────────────────
interface TextToImageBody {
  prompt: string;
  num_images?: number;
  aspect_ratio?: '21:9' | '16:9' | '3:2' | '4:3' | '5:4' | '1:1' | '4:5' | '3:4' | '2:3' | '9:16';
  output_format?: 'jpeg' | 'png' | 'webp';
  node?: NodeInfo;
}

// ── Image-to-Image ────────────────────────────────────────────────────────────
interface ImageToImageBody {
  prompt: string;
  image_urls: string[];           // una o más URLs de imágenes base
  num_images?: number;
  aspect_ratio?: 'auto' | '21:9' | '16:9' | '3:2' | '4:3' | '5:4' | '1:1' | '4:5' | '3:4' | '2:3' | '9:16';
  output_format?: 'jpeg' | 'png' | 'webp';
  node?: NodeInfo;
}

export async function imageRoutes(app: FastifyInstance) {

  /**
   * POST /images/upload
   * Recibe un dataUrl base64 y lo sube a fal.ai storage.
   * Retorna: { url: string }
   */
  app.post<{ Body: { dataUrl: string } }>('/upload', {
    schema: {
      tags: ['images'],
      summary: 'Subir imagen a fal.ai storage (base64 dataUrl)',
      body: {
        type: 'object',
        required: ['dataUrl'],
        properties: { dataUrl: { type: 'string', description: 'Imagen en formato base64 data URL' } },
      },
    },
  }, async (request, reply) => {
    const { dataUrl } = request.body;
    if (!dataUrl) return reply.status(400).send({ error: '"dataUrl" es requerido.' });

    try {
      const [header, base64Data] = dataUrl.split(',');
      const mimeMatch = header.match(/data:([^;]+);/);
      const mimeType  = mimeMatch?.[1] ?? 'image/jpeg';
      const buffer    = Buffer.from(base64Data, 'base64');
      const blob      = new Blob([buffer], { type: mimeType });
      const url       = await fal.storage.upload(blob);
      return reply.send({ url });
    } catch (err: any) {
      app.log.error(err);
      return reply.status(500).send({ error: 'Error al subir imagen.', detail: err?.message });
    }
  });

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
  app.post<{ Body: TextToImageBody }>('/text-to-image', {
    schema: {
      tags: ['images'],
      summary: 'Generar imagen desde texto (fal-ai/nano-banana)',
      body: {
        type: 'object',
        required: ['prompt'],
        properties: {
          prompt:        { type: 'string' },
          num_images:    { type: 'number', default: 1 },
          aspect_ratio:  { type: 'string', enum: ['21:9','16:9','3:2','4:3','5:4','1:1','4:5','3:4','2:3','9:16'], default: '1:1' },
          output_format: { type: 'string', enum: ['jpeg','png','webp'], default: 'png' },
          node:          { type: 'object', properties: { nodeId: { type: 'string' }, nodeContent: { type: 'string' } } },
        },
      },
    },
  }, async (request, reply) => {
    const {
      prompt,
      num_images = 1,
      aspect_ratio = '1:1',
      output_format = 'png',
      node,
    } = request.body;

    if (!prompt?.trim()) {
      return reply.status(400).send({ error: '"prompt" es requerido.' });
    }

    try {
      const result = await fal.subscribe(TEXT_TO_IMAGE_MODEL, {
        input: { prompt, num_images, aspect_ratio, output_format },
      });

      const images = (result.data as any)?.images ?? [];

      if (node?.nodeId && images.length > 0) {
        await GeneratedImage.create({
          nodeId:             node.nodeId,
          nodeContent:        node.nodeContent,
          nodeCategory:       node.nodeCategory,
          nodeTemporalState:  node.nodeTemporalState,
          nodeEmotionalLevel: node.nodeEmotionalLevel,
          prompt,
          mode:     'text-to-image',
          model:    TEXT_TO_IMAGE_MODEL,
          imageUrl: images[0].url,
        });
      }

      return reply.send({
        success: true,
        mode: 'text-to-image',
        model: TEXT_TO_IMAGE_MODEL,
        images,
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
  app.post<{ Body: ImageToImageBody }>('/image-to-image', {
    schema: {
      tags: ['images'],
      summary: 'Editar imagen con prompt (fal-ai/nano-banana/edit)',
      body: {
        type: 'object',
        required: ['prompt', 'image_urls'],
        properties: {
          prompt:        { type: 'string' },
          image_urls:    { type: 'array', items: { type: 'string' }, description: 'Una o más URLs de imágenes base' },
          num_images:    { type: 'number', default: 1 },
          aspect_ratio:  { type: 'string', enum: ['auto','21:9','16:9','3:2','4:3','5:4','1:1','4:5','3:4','2:3','9:16'], default: 'auto' },
          output_format: { type: 'string', enum: ['jpeg','png','webp'], default: 'png' },
          node:          { type: 'object', properties: { nodeId: { type: 'string' }, nodeContent: { type: 'string' } } },
        },
      },
    },
  }, async (request, reply) => {
    const {
      prompt,
      image_urls,
      num_images = 1,
      aspect_ratio = 'auto',
      output_format = 'png',
      node,
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

      const images = (result.data as any)?.images ?? [];

      if (node?.nodeId && images.length > 0) {
        await GeneratedImage.create({
          nodeId:             node.nodeId,
          nodeContent:        node.nodeContent,
          nodeCategory:       node.nodeCategory,
          nodeTemporalState:  node.nodeTemporalState,
          nodeEmotionalLevel: node.nodeEmotionalLevel,
          prompt,
          mode:         'image-to-image',
          model:        IMAGE_TO_IMAGE_MODEL,
          imageUrl:     images[0].url,
          sourceImages: image_urls,
        });
      }

      return reply.send({
        success: true,
        mode: 'image-to-image',
        model: IMAGE_TO_IMAGE_MODEL,
        images,
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
