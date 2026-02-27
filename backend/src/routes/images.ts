import type { FastifyInstance } from 'fastify';
import { fal } from '@fal-ai/client';
import { GeneratedImage } from '../models/GeneratedImage';
import { GalleryImage } from '../models/GalleryImage';
import { PromptStyleTag } from '../models/PromptStyleTag';

const TEXT_TO_IMAGE_MODEL = 'fal-ai/nano-banana';
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
  styleTagIds?: string[]; // IDs de tags de estilo para concatenar al prompt
  num_images?: number;
  aspect_ratio?: '21:9' | '16:9' | '3:2' | '4:3' | '5:4' | '1:1' | '4:5' | '3:4' | '2:3' | '9:16';
  output_format?: 'jpeg' | 'png' | 'webp';
  node?: NodeInfo;
}

// ── Image-to-Image ────────────────────────────────────────────────────────────
interface ImageToImageBody {
  prompt: string;
  styleTagIds?: string[]; // IDs de tags de estilo para concatenar al prompt
  image_urls?: string[]; // URLs manuales de imágenes base (opcional si se usa gallery_tags)
  gallery_tags?: string[]; // Tags de galería para obtener imágenes (opcional si se usa image_urls)
  num_images?: number;
  aspect_ratio?:
    | 'auto'
    | '21:9'
    | '16:9'
    | '3:2'
    | '4:3'
    | '5:4'
    | '1:1'
    | '4:5'
    | '3:4'
    | '2:3'
    | '9:16';
  output_format?: 'jpeg' | 'png' | 'webp';
  node?: NodeInfo;
}

export async function imageRoutes(app: FastifyInstance) {
  /**
   * POST /images/upload
   * Recibe un dataUrl base64 y lo sube a fal.ai storage.
   * Retorna: { url: string }
   */
  app.post<{ Body: { dataUrl: string } }>(
    '/upload',
    {
      schema: {
        tags: ['images'],
        summary: 'Subir imagen a fal.ai storage (base64 dataUrl)',
        body: {
          type: 'object',
          required: ['dataUrl'],
          properties: {
            dataUrl: { type: 'string', description: 'Imagen en formato base64 data URL' },
          },
        },
      },
    },
    async (request, reply) => {
      const { dataUrl } = request.body;
      if (!dataUrl) return reply.status(400).send({ error: '"dataUrl" es requerido.' });

      try {
        const [header, base64Data] = dataUrl.split(',');
        const mimeMatch = header.match(/data:([^;]+);/);
        const mimeType = mimeMatch?.[1] ?? 'image/jpeg';
        const buffer = Buffer.from(base64Data, 'base64');
        const blob = new Blob([buffer], { type: mimeType });
        const url = await fal.storage.upload(blob);
        return reply.send({ url });
      } catch (err: any) {
        app.log.error(err);
        return reply.status(500).send({ error: 'Error al subir imagen.', detail: err?.message });
      }
    }
  );

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
  app.post<{ Body: TextToImageBody }>(
    '/text-to-image',
    {
      schema: {
        tags: ['images'],
        summary: 'Generar imagen desde texto (fal-ai/nano-banana)',
        body: {
          type: 'object',
          required: ['prompt'],
          properties: {
            prompt: { type: 'string' },
            num_images: { type: 'number', default: 1 },
            aspect_ratio: {
              type: 'string',
              enum: ['21:9', '16:9', '3:2', '4:3', '5:4', '1:1', '4:5', '3:4', '2:3', '9:16'],
              default: '1:1',
            },
            output_format: { type: 'string', enum: ['jpeg', 'png', 'webp'], default: 'png' },
            node: {
              type: 'object',
              properties: { nodeId: { type: 'string' }, nodeContent: { type: 'string' } },
            },
          },
        },
      },
    },
    async (request, reply) => {
      const {
        prompt,
        styleTagIds,
        num_images = 1,
        aspect_ratio = '1:1',
        output_format = 'png',
        node,
      } = request.body;

      if (!prompt?.trim()) {
        return reply.status(400).send({ error: '"prompt" es requerido.' });
      }

      try {
        // Procesar style tags si existen
        let finalPrompt = prompt;
        if (styleTagIds && styleTagIds.length > 0) {
          const userId = request.jwtUser?.sub;
          if (userId) {
            const tags = await PromptStyleTag.find({
              _id: { $in: styleTagIds },
              userId,
            }).lean();

            if (tags.length > 0) {
              const styleTexts = tags.map((t) => t.promptText).join(', ');
              finalPrompt = `${prompt}\n\nStyle: ${styleTexts}`;
            }
          }
        }

        const result = await fal.subscribe(TEXT_TO_IMAGE_MODEL, {
          input: { prompt: finalPrompt, num_images, aspect_ratio, output_format },
        });

        const images = (result.data as any)?.images ?? [];

        if (node?.nodeId && images.length > 0) {
          await GeneratedImage.create({
            nodeId: node.nodeId,
            nodeContent: node.nodeContent,
            nodeCategory: node.nodeCategory,
            nodeTemporalState: node.nodeTemporalState,
            nodeEmotionalLevel: node.nodeEmotionalLevel,
            prompt: finalPrompt,
            mode: 'text-to-image',
            model: TEXT_TO_IMAGE_MODEL,
            imageUrl: images[0].url,
          });
        }

        return reply.send({
          success: true,
          mode: 'text-to-image',
          model: TEXT_TO_IMAGE_MODEL,
          images,
          prompt: finalPrompt,
        });
      } catch (err: any) {
        app.log.error(err);
        return reply.status(500).send({
          error: 'Error generando imagen.',
          detail: err?.message ?? 'Unknown error',
        });
      }
    }
  );

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
  app.post<{ Body: ImageToImageBody }>(
    '/image-to-image',
    {
      schema: {
        tags: ['images'],
        summary: 'Editar imagen con prompt (fal-ai/nano-banana/edit)',
        body: {
          type: 'object',
          required: ['prompt'],
          properties: {
            prompt: { type: 'string' },
            image_urls: {
              type: 'array',
              items: { type: 'string' },
              description: 'URLs manuales de imágenes base (opcional si se usa gallery_tags)',
            },
            gallery_tags: {
              type: 'array',
              items: { type: 'string' },
              description:
                'Tags de galería para obtener imágenes de referencia (opcional si se usa image_urls)',
            },
            num_images: { type: 'number', default: 1 },
            aspect_ratio: {
              type: 'string',
              enum: [
                'auto',
                '21:9',
                '16:9',
                '3:2',
                '4:3',
                '5:4',
                '1:1',
                '4:5',
                '3:4',
                '2:3',
                '9:16',
              ],
              default: 'auto',
            },
            output_format: { type: 'string', enum: ['jpeg', 'png', 'webp'], default: 'png' },
            node: {
              type: 'object',
              properties: { nodeId: { type: 'string' }, nodeContent: { type: 'string' } },
            },
          },
        },
      },
    },
    async (request, reply) => {
      const {
        prompt,
        styleTagIds,
        image_urls,
        gallery_tags,
        num_images = 1,
        aspect_ratio = 'auto',
        output_format = 'png',
        node,
      } = request.body;

      if (!prompt?.trim()) {
        return reply.status(400).send({ error: '"prompt" es requerido.' });
      }

      // Procesar style tags si existen
      let finalPrompt = prompt;
      const userId = request.jwtUser?.sub;

      if (styleTagIds && styleTagIds.length > 0 && userId) {
        const tags = await PromptStyleTag.find({
          _id: { $in: styleTagIds },
          userId,
        }).lean();

        if (tags.length > 0) {
          const styleTexts = tags.map((t) => t.promptText).join(', ');
          finalPrompt = `${prompt}\n\nStyle: ${styleTexts}`;
        }
      }

      // Resolver image_urls desde gallery_tags si es necesario
      let finalImageUrls: string[] = [];

      if (gallery_tags && Array.isArray(gallery_tags) && gallery_tags.length > 0) {
        // Modo Gallery: obtener imágenes desde la galería del usuario
        const userId = request.jwtUser?.sub;
        if (!userId) {
          return reply.status(401).send({ error: 'Usuario no autenticado.' });
        }

        try {
          const galleryImages = await GalleryImage.find({
            userId,
            tag: { $in: gallery_tags },
          })
            .select('imageUrl')
            .lean();

          finalImageUrls = galleryImages.map((img) => img.imageUrl);

          if (finalImageUrls.length === 0) {
            return reply.status(400).send({
              error: `No se encontraron imágenes en la galería con los tags: ${gallery_tags.join(', ')}`,
            });
          }
        } catch (err: any) {
          app.log.error(err);
          return reply.status(500).send({
            error: 'Error al obtener imágenes de galería.',
            detail: err?.message,
          });
        }
      } else if (image_urls && Array.isArray(image_urls) && image_urls.length > 0) {
        // Modo Manual: usar las URLs proporcionadas directamente
        finalImageUrls = image_urls;
      } else {
        return reply.status(400).send({
          error: 'Debes proporcionar "image_urls" o "gallery_tags".',
        });
      }

      try {
        const result = await fal.subscribe(IMAGE_TO_IMAGE_MODEL, {
          input: {
            prompt: finalPrompt,
            image_urls: finalImageUrls,
            num_images,
            aspect_ratio,
            output_format,
          },
        });

        const images = (result.data as any)?.images ?? [];

        if (node?.nodeId && images.length > 0) {
          await GeneratedImage.create({
            nodeId: node.nodeId,
            nodeContent: node.nodeContent,
            nodeCategory: node.nodeCategory,
            nodeTemporalState: node.nodeTemporalState,
            nodeEmotionalLevel: node.nodeEmotionalLevel,
            prompt: finalPrompt,
            mode: 'image-to-image',
            model: IMAGE_TO_IMAGE_MODEL,
            imageUrl: images[0].url,
            sourceImages: finalImageUrls,
          });
        }

        return reply.send({
          success: true,
          mode: 'image-to-image',
          model: IMAGE_TO_IMAGE_MODEL,
          images,
          description: (result.data as any)?.description ?? '',
          prompt: finalPrompt,
          source_images: finalImageUrls,
        });
      } catch (err: any) {
        app.log.error(err);
        return reply.status(500).send({
          error: 'Error procesando imagen.',
          detail: err?.message ?? 'Unknown error',
        });
      }
    }
  );
}
