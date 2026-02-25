import type { FastifyInstance } from 'fastify';
import { Storyboard } from '../models/Storyboard';

const errorShape = {
  type: 'object',
  properties: { success: { type: 'boolean' }, error: { type: 'string' } },
};

export async function storyboardRoutes(app: FastifyInstance) {
  // GET /storyboards - Listar todos los storyboards del usuario
  app.get(
    '/',
    {
      schema: {
        tags: ['storyboards'],
        summary: 'Listar storyboards del usuario',
        response: {
          200: {
            type: 'object',
            properties: {
              success: { type: 'boolean' },
              storyboards: { type: 'array', items: { type: 'object' } },
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

        const storyboards = await Storyboard.find({ userId }).sort({ createdAt: -1 }).lean();

        return reply.send({ success: true, storyboards });
      } catch (err: any) {
        app.log.error(err);
        return reply.status(500).send({ success: false, error: err.message });
      }
    }
  );

  // GET /storyboards/:id - Obtener un storyboard específico
  app.get<{ Params: { id: string } }>(
    '/:id',
    {
      schema: {
        tags: ['storyboards'],
        summary: 'Obtener un storyboard por ID',
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
              storyboard: { type: 'object' },
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
        const storyboard = await Storyboard.findOne({ _id: id, userId } as any).lean();

        if (!storyboard) {
          return reply.status(404).send({ success: false, error: 'Storyboard no encontrado' });
        }

        return reply.send({ success: true, storyboard });
      } catch (err: any) {
        app.log.error(err);
        return reply.status(500).send({ success: false, error: err.message });
      }
    }
  );

  // POST /storyboards - Crear nuevo storyboard
  app.post<{
    Body: {
      title: string;
      originalText: string;
      inputMode: string;
      frames: any[];
      mermaidDiagram?: string;
    };
  }>(
    '/',
    {
      schema: {
        tags: ['storyboards'],
        summary: 'Crear nuevo storyboard',
        body: {
          type: 'object',
          required: ['title', 'originalText', 'inputMode', 'frames'],
          properties: {
            title: { type: 'string' },
            originalText: { type: 'string' },
            inputMode: { type: 'string', enum: ['voice', 'text'] },
            frames: { type: 'array', items: { type: 'object' } },
            mermaidDiagram: { type: 'string' },
          },
        },
        response: {
          200: {
            type: 'object',
            properties: {
              success: { type: 'boolean' },
              storyboard: { type: 'object' },
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

        const { title, originalText, inputMode, frames, mermaidDiagram } = req.body;

        const storyboard = await Storyboard.create({
          userId,
          title,
          originalText,
          inputMode,
          frames,
          mermaidDiagram,
        });

        return reply.send({ success: true, storyboard });
      } catch (err: any) {
        app.log.error(err);
        return reply.status(500).send({ success: false, error: err.message });
      }
    }
  );

  // PATCH /storyboards/:id - Actualizar storyboard
  app.patch<{
    Params: { id: string };
    Body: { title?: string; frames?: any[]; comicPageUrl?: string; comicPagePrompt?: string };
  }>(
    '/:id',
    {
      schema: {
        tags: ['storyboards'],
        summary: 'Actualizar storyboard',
        params: {
          type: 'object',
          required: ['id'],
          properties: { id: { type: 'string' } },
        },
        body: {
          type: 'object',
          properties: {
            title: { type: 'string' },
            frames: { type: 'array', items: { type: 'object' } },
            comicPageUrl: { type: 'string' },
            comicPagePrompt: { type: 'string' },
          },
        },
        response: {
          200: {
            type: 'object',
            properties: {
              success: { type: 'boolean' },
              storyboard: { type: 'object' },
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
        const storyboard = await Storyboard.findOneAndUpdate(
          { _id: id, userId } as any,
          { $set: req.body as any },
          { new: true }
        ).lean();

        if (!storyboard) {
          return reply.status(404).send({ success: false, error: 'Storyboard no encontrado' });
        }

        return reply.send({ success: true, storyboard });
      } catch (err: any) {
        app.log.error(err);
        return reply.status(500).send({ success: false, error: err.message });
      }
    }
  );

  // DELETE /storyboards/:id - Eliminar storyboard
  app.delete<{ Params: { id: string } }>(
    '/:id',
    {
      schema: {
        tags: ['storyboards'],
        summary: 'Eliminar storyboard',
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
        const result = await Storyboard.findOneAndDelete({ _id: id, userId } as any);

        if (!result) {
          return reply.status(404).send({ success: false, error: 'Storyboard no encontrado' });
        }

        return reply.send({ success: true, message: 'Storyboard eliminado' });
      } catch (err: any) {
        app.log.error(err);
        return reply.status(500).send({ success: false, error: err.message });
      }
    }
  );
}
