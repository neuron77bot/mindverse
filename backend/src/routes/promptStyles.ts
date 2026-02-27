import type { FastifyInstance } from 'fastify';
import { PromptStyleTag } from '../models/PromptStyleTag';
import { fal } from '@fal-ai/client';
import { GalleryImage } from '../models/GalleryImage';

const errorShape = {
  type: 'object',
  properties: { success: { type: 'boolean' }, error: { type: 'string' } },
};

export async function promptStyleRoutes(app: FastifyInstance) {
  // GET /prompt-styles - Listar tags del usuario
  app.get(
    '/',
    {
      schema: {
        tags: ['prompt-styles'],
        summary: 'Listar tags de estilo de prompt del usuario',
        response: {
          200: {
            type: 'object',
            properties: {
              success: { type: 'boolean' },
              tags: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    _id: { type: 'string' },
                    name: { type: 'string' },
                    description: { type: 'string' },
                    promptText: { type: 'string' },
                    previewImageUrl: { type: 'string' },
                    createdAt: { type: 'string' },
                    updatedAt: { type: 'string' },
                  },
                },
              },
            },
          },
          401: errorShape,
          500: errorShape,
        },
      },
    },
    async (req, reply) => {
      try {
        const userId = req.jwtUser?.sub;
        if (!userId) return reply.status(401).send({ success: false, error: 'No autorizado' });

        const tags = await PromptStyleTag.find({ userId }).sort({ name: 1 }).lean();

        return reply.send({ success: true, tags });
      } catch (err: any) {
        app.log.error(err);
        return reply.status(500).send({ success: false, error: err.message });
      }
    }
  );

  // POST /prompt-styles - Crear nuevo tag
  app.post<{
    Body: {
      name: string;
      description?: string;
      promptText: string;
    };
  }>(
    '/',
    {
      schema: {
        tags: ['prompt-styles'],
        summary: 'Crear nuevo tag de estilo',
        body: {
          type: 'object',
          required: ['name', 'promptText'],
          properties: {
            name: { type: 'string' },
            description: { type: 'string' },
            promptText: { type: 'string' },
          },
        },
        response: {
          200: {
            type: 'object',
            properties: {
              success: { type: 'boolean' },
              tag: { type: 'object' },
            },
          },
          400: errorShape,
          401: errorShape,
          500: errorShape,
        },
      },
    },
    async (req, reply) => {
      try {
        const userId = req.jwtUser?.sub;
        if (!userId) return reply.status(401).send({ success: false, error: 'No autorizado' });

        const { name, description, promptText } = req.body;

        if (!name?.trim() || !promptText?.trim()) {
          return reply
            .status(400)
            .send({ success: false, error: 'name y promptText son requeridos' });
        }

        const tag = await PromptStyleTag.create({
          userId,
          name: name.trim(),
          description: description?.trim(),
          promptText: promptText.trim(),
        });

        return reply.send({ success: true, tag });
      } catch (err: any) {
        app.log.error(err);
        return reply.status(500).send({ success: false, error: err.message });
      }
    }
  );

  // PATCH /prompt-styles/:id - Actualizar tag
  app.patch<{
    Params: { id: string };
    Body: {
      name?: string;
      description?: string;
      promptText?: string;
      previewImageUrl?: string;
    };
  }>(
    '/:id',
    {
      schema: {
        tags: ['prompt-styles'],
        summary: 'Actualizar tag de estilo',
        params: {
          type: 'object',
          required: ['id'],
          properties: { id: { type: 'string' } },
        },
        body: {
          type: 'object',
          properties: {
            name: { type: 'string' },
            description: { type: 'string' },
            promptText: { type: 'string' },
            previewImageUrl: { type: 'string' },
          },
        },
        response: {
          200: {
            type: 'object',
            properties: {
              success: { type: 'boolean' },
              tag: { type: 'object' },
            },
          },
          401: errorShape,
          404: errorShape,
          500: errorShape,
        },
      },
    },
    async (req, reply) => {
      try {
        const userId = req.jwtUser?.sub;
        if (!userId) return reply.status(401).send({ success: false, error: 'No autorizado' });

        const { id } = req.params;

        const tag = await PromptStyleTag.findOneAndUpdate(
          { _id: id, userId } as any,
          { $set: req.body as any },
          { new: true }
        ).lean();

        if (!tag) {
          return reply.status(404).send({ success: false, error: 'Tag no encontrado' });
        }

        return reply.send({ success: true, tag });
      } catch (err: any) {
        app.log.error(err);
        return reply.status(500).send({ success: false, error: err.message });
      }
    }
  );

  // DELETE /prompt-styles/:id - Eliminar tag
  app.delete<{ Params: { id: string } }>(
    '/:id',
    {
      schema: {
        tags: ['prompt-styles'],
        summary: 'Eliminar tag de estilo',
        params: {
          type: 'object',
          required: ['id'],
          properties: { id: { type: 'string' } },
        },
        response: {
          200: {
            type: 'object',
            properties: {
              success: { type: 'boolean' },
              message: { type: 'string' },
            },
          },
          401: errorShape,
          404: errorShape,
          500: errorShape,
        },
      },
    },
    async (req, reply) => {
      try {
        const userId = req.jwtUser?.sub;
        if (!userId) return reply.status(401).send({ success: false, error: 'No autorizado' });

        const { id } = req.params;
        const result = await PromptStyleTag.findOneAndDelete({ _id: id, userId } as any);

        if (!result) {
          return reply.status(404).send({ success: false, error: 'Tag no encontrado' });
        }

        return reply.send({ success: true, message: 'Tag eliminado' });
      } catch (err: any) {
        app.log.error(err);
        return reply.status(500).send({ success: false, error: err.message });
      }
    }
  );

  // POST /prompt-styles/:id/generate-preview - Generar imagen preview del estilo
  app.post<{
    Params: { id: string };
    Body: { galleryTags?: string[] };
  }>(
    '/:id/generate-preview',
    {
      schema: {
        tags: ['prompt-styles'],
        summary: 'Generar imagen preview para un estilo de prompt',
        params: {
          type: 'object',
          required: ['id'],
          properties: { id: { type: 'string' } },
        },
        body: {
          type: 'object',
          properties: {
            galleryTags: {
              type: 'array',
              items: { type: 'string' },
              description: 'Tags de galería para usar como base (opcional)',
            },
          },
        },
        response: {
          200: {
            type: 'object',
            properties: {
              success: { type: 'boolean' },
              previewImageUrl: { type: 'string' },
              message: { type: 'string' },
            },
          },
          401: errorShape,
          404: errorShape,
          500: errorShape,
        },
      },
    },
    async (req, reply) => {
      try {
        const userId = req.jwtUser?.sub;
        if (!userId) return reply.status(401).send({ success: false, error: 'No autorizado' });

        const { id } = req.params;
        const { galleryTags } = req.body;

        // Buscar el style tag
        const style = await PromptStyleTag.findOne({ _id: id, userId } as any);
        if (!style) {
          return reply.status(404).send({ success: false, error: 'Estilo no encontrado' });
        }

        const prompt = style.promptText;
        let previewImageUrl: string;

        // Opción 1: Generar con gallery tags (image-to-image)
        if (galleryTags && galleryTags.length > 0) {
          // Obtener imágenes de galería
          const galleryImages = await GalleryImage.find({
            userId,
            tag: { $in: galleryTags },
          })
            .select('imageUrl')
            .limit(5)
            .lean();

          if (galleryImages.length === 0) {
            return reply.status(400).send({
              success: false,
              error: `No se encontraron imágenes con los tags: ${galleryTags.join(', ')}`,
            });
          }

          const imageUrls = galleryImages.map((img) => img.imageUrl);

          // Generar con image-to-image
          const result = await fal.subscribe('fal-ai/nano-banana/edit', {
            input: {
              prompt,
              image_urls: imageUrls,
              num_images: 1,
              aspect_ratio: '1:1',
              output_format: 'png',
            },
          });

          const images = (result.data as any)?.images ?? [];
          if (images.length === 0) {
            throw new Error('No se generó ninguna imagen');
          }

          previewImageUrl = images[0].url;
        } else {
          // Opción 2: Generar con text-to-image
          const result = await fal.subscribe('fal-ai/nano-banana', {
            input: {
              prompt,
              num_images: 1,
              aspect_ratio: '1:1',
              output_format: 'png',
            },
          });

          const images = (result.data as any)?.images ?? [];
          if (images.length === 0) {
            throw new Error('No se generó ninguna imagen');
          }

          previewImageUrl = images[0].url;
        }

        // Actualizar el documento con la URL del preview
        style.previewImageUrl = previewImageUrl;
        await style.save();

        return reply.send({
          success: true,
          previewImageUrl,
          message: 'Preview generado exitosamente',
        });
      } catch (err: any) {
        app.log.error(err);
        return reply.status(500).send({
          success: false,
          error: err.message || 'Error generando preview',
        });
      }
    }
  );

  // DELETE /prompt-styles/:id/preview - Eliminar imagen preview del estilo
  app.delete<{ Params: { id: string } }>(
    '/:id/preview',
    {
      schema: {
        tags: ['prompt-styles'],
        summary: 'Eliminar imagen preview de un estilo de prompt',
        params: {
          type: 'object',
          required: ['id'],
          properties: { id: { type: 'string' } },
        },
        response: {
          200: {
            type: 'object',
            properties: {
              success: { type: 'boolean' },
              message: { type: 'string' },
            },
          },
          401: errorShape,
          404: errorShape,
          500: errorShape,
        },
      },
    },
    async (req, reply) => {
      try {
        const userId = req.jwtUser?.sub;
        if (!userId) return reply.status(401).send({ success: false, error: 'No autorizado' });

        const { id } = req.params;
        
        const style = await PromptStyleTag.findOne({ _id: id, userId } as any);
        if (!style) {
          return reply.status(404).send({ success: false, error: 'Estilo no encontrado' });
        }

        style.previewImageUrl = undefined;
        await style.save();

        return reply.send({ success: true, message: 'Preview eliminado' });
      } catch (err: any) {
        app.log.error(err);
        return reply.status(500).send({ success: false, error: err.message });
      }
    }
  );
}
