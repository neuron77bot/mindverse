import type { FastifyInstance } from 'fastify';
import { Storyboard } from '../models/Storyboard';

const errorShape = {
  type: 'object',
  properties: { success: { type: 'boolean' }, error: { type: 'string' } },
};

export async function storyboardRoutes(app: FastifyInstance) {
  // GET /storyboards/debug - Endpoint temporal sin schema validation
  app.get('/debug', async (req, reply) => {
    try {
      const userId = req.jwtUser?.sub;
      if (!userId) return reply.status(401).send({ success: false, error: 'No autorizado' });

      const storyboards = await Storyboard.find({ userId }).sort({ createdAt: -1 }).lean();

      app.log.info({
        msg: 'GET /storyboards/debug',
        userId,
        count: storyboards.length,
        firstKeys: storyboards[0] ? Object.keys(storyboards[0]) : [],
      });

      // Sin schema validation - devuelve todo
      return reply.type('application/json').send({ success: true, storyboards });
    } catch (err: any) {
      app.log.error(err);
      return reply.status(500).send({ success: false, error: err.message });
    }
  });

  // GET /storyboards - Listar todos los storyboards del usuario
  app.get(
    '/',
    {
      // Schema removido para evitar filtrado de campos
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
      // Schema removido para evitar filtrado de campos
    },
    async (req, reply) => {
      try {
        const userId = req.jwtUser?.sub;
        if (!userId) return reply.status(401).send({ success: false, error: 'No autorizado' });

        const { id } = req.params;
        const storyboard = await Storyboard.findOne({ _id: id, userId } as any).lean();

        app.log.info(`Storyboard encontrado: ${!!storyboard}`);
        if (storyboard) {
          app.log.info(`Campos: ${Object.keys(storyboard).join(', ')}`);
          app.log.info(`Frames: ${storyboard.frames?.length || 0}`);
        }

        if (!storyboard) {
          return reply.status(404).send({ success: false, error: 'Storyboard no encontrado' });
        }

        // Forzar serialización manual para evitar stripping
        reply.type('application/json');
        return reply.send(JSON.stringify({ success: true, storyboard }));
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
              storyboard: {
                type: 'object',
                properties: {
                  _id: { type: 'string' },
                },
                additionalProperties: true,
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

        const { title, originalText, inputMode, frames, mermaidDiagram } = req.body;

        // Validar que frames no esté vacío
        if (!frames || !Array.isArray(frames) || frames.length === 0) {
          return reply
            .status(400)
            .send({ success: false, error: 'Frames es requerido y no puede estar vacío' });
        }

        app.log.info({
          msg: 'Creating storyboard',
          userId,
          title,
          framesCount: frames.length,
          inputMode,
        });

        const storyboard = await Storyboard.create({
          userId,
          title,
          originalText,
          inputMode,
          frames,
          mermaidDiagram,
        });

        app.log.info({ msg: 'Storyboard created', storyboardId: storyboard._id });

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
    Body: {
      title?: string;
      description?: string;
      genre?: string;
      frames?: any[];
    };
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
            description: { type: 'string' },
            genre: { type: 'string' },
            frames: { type: 'array', items: { type: 'object' } },
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

  // PATCH /storyboards/:id/cinema-visibility - Toggle visibilidad en Cinema Mode
  app.patch<{
    Params: { id: string };
    Body: { allowCinema: boolean };
  }>(
    '/:id/cinema-visibility',
    {
      schema: {
        tags: ['storyboards'],
        summary: 'Toggle visibilidad del storyboard en Cinema Mode',
        params: {
          type: 'object',
          required: ['id'],
          properties: { id: { type: 'string' } },
        },
        body: {
          type: 'object',
          required: ['allowCinema'],
          properties: {
            allowCinema: { type: 'boolean' },
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
        const { allowCinema } = req.body;

        // Solo el propietario puede modificar la visibilidad
        const storyboard = await Storyboard.findOneAndUpdate(
          { _id: id, userId } as any,
          { $set: { allowCinema } },
          { new: true }
        ).lean();

        if (!storyboard) {
          return reply.status(404).send({
            success: false,
            error: 'Storyboard no encontrado',
          });
        }

        return reply.send({ success: true, storyboard });
      } catch (err: any) {
        app.log.error(err);
        return reply.status(500).send({ success: false, error: err.message });
      }
    }
  );
}
