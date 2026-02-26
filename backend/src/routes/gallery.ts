import type { FastifyInstance } from 'fastify';
import { fal } from '@fal-ai/client';
import { GalleryImage } from '../models/GalleryImage';

export async function galleryRoutes(app: FastifyInstance) {
  /**
   * POST /gallery/upload
   * Sube una imagen a la galería del usuario con un tag
   *
   * Body: { dataUrl: string, tag: string, filename?: string }
   * Returns: { id: string, imageUrl: string, tag: string }
   */
  app.post<{ Body: { dataUrl: string; tag: string; filename?: string } }>(
    '/upload',
    {
      schema: {
        tags: ['gallery'],
        summary: 'Subir imagen a galería personal con tag',
        body: {
          type: 'object',
          required: ['dataUrl', 'tag'],
          properties: {
            dataUrl: { type: 'string', description: 'Imagen en formato base64 data URL' },
            tag: { type: 'string', description: 'Tag de referencia (ej: @personaje-principal)' },
            filename: { type: 'string', description: 'Nombre original del archivo (opcional)' },
          },
        },
      },
    },
    async (request, reply) => {
      const { dataUrl, tag, filename } = request.body;
      const userId = request.jwtUser?.sub; // Del middleware de auth

      if (!dataUrl || !tag) {
        return reply.status(400).send({ error: '"dataUrl" y "tag" son requeridos.' });
      }

      if (!userId) {
        return reply.status(401).send({ error: 'Usuario no autenticado.' });
      }

      try {
        // Subir imagen a fal.ai storage
        const [header, base64Data] = dataUrl.split(',');
        const mimeMatch = header.match(/data:([^;]+);/);
        const mimeType = mimeMatch?.[1] ?? 'image/jpeg';
        const buffer = Buffer.from(base64Data, 'base64');
        const blob = new Blob([buffer], { type: mimeType });
        const imageUrl = await fal.storage.upload(blob);

        // Guardar en la DB
        const galleryImage = await GalleryImage.create({
          userId,
          imageUrl,
          tag: tag.startsWith('@') ? tag : `@${tag}`, // Asegurar que empiece con @
          filename,
        });

        return reply.send({
          id: galleryImage._id.toString(),
          imageUrl: galleryImage.imageUrl,
          tag: galleryImage.tag,
          filename: galleryImage.filename,
          createdAt: galleryImage.createdAt,
        });
      } catch (err: any) {
        app.log.error(err);
        return reply.status(500).send({
          error: 'Error al subir imagen a galería.',
          detail: err?.message,
        });
      }
    }
  );

  /**
   * GET /gallery
   * Lista todas las imágenes de la galería del usuario
   *
   * Returns: Array de { id, imageUrl, tag, filename, createdAt }
   */
  app.get(
    '/',
    {
      schema: {
        tags: ['gallery'],
        summary: 'Listar todas las imágenes de la galería del usuario',
      },
    },
    async (request, reply) => {
      const userId = request.jwtUser?.sub;

      if (!userId) {
        return reply.status(401).send({ error: 'Usuario no autenticado.' });
      }

      try {
        const images = await GalleryImage.find({ userId })
          .sort({ createdAt: -1 }) // Más recientes primero
          .select('_id imageUrl tag filename createdAt')
          .lean();

        return reply.send({
          images: images.map((img) => ({
            id: img._id.toString(),
            imageUrl: img.imageUrl,
            tag: img.tag,
            filename: img.filename,
            createdAt: img.createdAt,
          })),
        });
      } catch (err: any) {
        app.log.error(err);
        return reply.status(500).send({
          error: 'Error al listar imágenes de galería.',
          detail: err?.message,
        });
      }
    }
  );

  /**
   * GET /gallery/tags
   * Lista todos los tags únicos del usuario
   *
   * Returns: { tags: string[] }
   */
  app.get(
    '/tags',
    {
      schema: {
        tags: ['gallery'],
        summary: 'Listar tags únicos de la galería del usuario',
      },
    },
    async (request, reply) => {
      const userId = request.jwtUser?.sub;

      if (!userId) {
        return reply.status(401).send({ error: 'Usuario no autenticado.' });
      }

      try {
        const tags = await GalleryImage.distinct('tag', { userId });

        return reply.send({
          tags: tags.sort(), // Orden alfabético
        });
      } catch (err: any) {
        app.log.error(err);
        return reply.status(500).send({
          error: 'Error al listar tags.',
          detail: err?.message,
        });
      }
    }
  );

  /**
   * DELETE /gallery/:id
   * Elimina una imagen específica de la galería
   *
   * Params: { id: string }
   * Returns: { success: true }
   */
  app.delete<{ Params: { id: string } }>(
    '/:id',
    {
      schema: {
        tags: ['gallery'],
        summary: 'Eliminar imagen de la galería',
        params: {
          type: 'object',
          required: ['id'],
          properties: {
            id: { type: 'string', description: 'ID de la imagen' },
          },
        },
      },
    },
    async (request, reply) => {
      const { id } = request.params;
      const userId = request.jwtUser?.sub;

      if (!userId) {
        return reply.status(401).send({ error: 'Usuario no autenticado.' });
      }

      try {
        const result = await GalleryImage.findOneAndDelete({
          _id: id,
          userId, // Solo puede eliminar sus propias imágenes
        });

        if (!result) {
          return reply.status(404).send({ error: 'Imagen no encontrada.' });
        }

        return reply.send({ success: true });
      } catch (err: any) {
        app.log.error(err);
        return reply.status(500).send({
          error: 'Error al eliminar imagen.',
          detail: err?.message,
        });
      }
    }
  );
}
