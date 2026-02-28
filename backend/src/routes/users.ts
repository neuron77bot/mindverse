import type { FastifyInstance } from 'fastify';
import { User } from '../models/User';

const userShape = {
  type: 'object',
  properties: {
    _id: { type: 'string' },
    googleId: { type: 'string' },
    name: { type: 'string' },
    email: { type: 'string' },
    picture: { type: 'string', nullable: true },
    bio: { type: 'string' },
    location: { type: 'string' },
    lastLogin: { type: 'string' },
    createdAt: { type: 'string' },
    updatedAt: { type: 'string' },
  },
};

const errorShape = {
  type: 'object',
  properties: { success: { type: 'boolean' }, error: { type: 'string' } },
};

export async function userRoutes(app: FastifyInstance) {
  // ── GET /users — listar todos ─────────────────────────────────────────────
  app.get(
    '/',
    {
      schema: {
        tags: ['users'],
        summary: 'Listar todos los usuarios',
        response: {
          200: {
            type: 'object',
            properties: { success: { type: 'boolean' }, data: { type: 'array', items: userShape } },
          },
        },
      },
    },
    async (_req, reply) => {
      try {
        const users = await User.find().sort({ createdAt: -1 });
        return reply.send({ success: true, data: users });
      } catch (err: any) {
        return (reply as any).code(500).send({ success: false, error: err.message });
      }
    }
  );

  // ── GET /users/:googleId — obtener por googleId ───────────────────────────
  app.get<{ Params: { googleId: string } }>(
    '/:googleId',
    {
      schema: {
        tags: ['users'],
        summary: 'Obtener usuario por googleId',
        params: { type: 'object', properties: { googleId: { type: 'string' } } },
        response: {
          200: { type: 'object', properties: { success: { type: 'boolean' }, data: userShape } },
          404: errorShape,
        },
      },
    },
    async (req, reply) => {
      try {
        const user = await User.findOne({ googleId: req.params.googleId });
        if (!user)
          return reply.status(404).send({ success: false, error: 'Usuario no encontrado' });
        return reply.send({ success: true, data: user });
      } catch (err: any) {
        return (reply as any).code(500).send({ success: false, error: err.message });
      }
    }
  );

  // ── PATCH /users/:googleId — actualizar perfil ────────────────────────────
  app.patch<{ Params: { googleId: string }; Body: Record<string, any> }>(
    '/:googleId',
    {
      schema: {
        tags: ['users'],
        summary: 'Actualizar perfil de usuario',
        params: { type: 'object', properties: { googleId: { type: 'string' } } },
        body: {
          type: 'object',
          properties: {
            name: { type: 'string' },
            picture: { type: 'string' },
            bio: { type: 'string' },
            location: { type: 'string' },
          },
        },
        response: {
          200: { type: 'object', properties: { success: { type: 'boolean' }, data: userShape } },
          404: errorShape,
        },
      },
    },
    async (req, reply) => {
      try {
        // Solo permite actualizar campos de perfil (no googleId ni email)
        const { name, picture, bio, location } = req.body;
        const allowed: Record<string, any> = {};
        if (name !== undefined) allowed.name = name;
        if (picture !== undefined) allowed.picture = picture;
        if (bio !== undefined) allowed.bio = bio;
        if (location !== undefined) allowed.location = location;

        const user = await User.findOneAndUpdate(
          { googleId: req.params.googleId },
          { $set: allowed },
          { new: true, runValidators: true }
        );
        if (!user)
          return reply.status(404).send({ success: false, error: 'Usuario no encontrado' });
        return reply.send({ success: true, data: user });
      } catch (err: any) {
        return (reply as any).code(500).send({ success: false, error: err.message });
      }
    }
  );

  // ── DELETE /users/:googleId — eliminar ────────────────────────────────────
  app.delete<{ Params: { googleId: string } }>(
    '/:googleId',
    {
      schema: {
        tags: ['users'],
        summary: 'Eliminar usuario',
        params: { type: 'object', properties: { googleId: { type: 'string' } } },
        response: {
          200: {
            type: 'object',
            properties: { success: { type: 'boolean' }, message: { type: 'string' } },
          },
          404: errorShape,
        },
      },
    },
    async (req, reply) => {
      try {
        const user = await User.findOneAndDelete({ googleId: req.params.googleId });
        if (!user)
          return reply.status(404).send({ success: false, error: 'Usuario no encontrado' });
        return reply.send({ success: true, message: 'Usuario eliminado' });
      } catch (err: any) {
        return (reply as any).code(500).send({ success: false, error: err.message });
      }
    }
  );

  // ── GET /users/me/cinema-token — obtener cinema token ─────────────────────
  app.get(
    '/me/cinema-token',
    {
      schema: {
        tags: ['users'],
        summary: 'Obtener cinema token del usuario autenticado',
        response: {
          200: {
            type: 'object',
            properties: {
              success: { type: 'boolean' },
              data: {
                type: 'object',
                properties: {
                  cinemaToken: { type: 'string' },
                  cinemaUrl: { type: 'string' },
                },
              },
            },
          },
          401: errorShape,
          404: errorShape,
        },
      },
    },
    async (req, reply) => {
      try {
        if (!req.jwtUser) {
          return reply.status(401).send({ success: false, error: 'No autorizado' });
        }

        const user = await User.findOne({ googleId: req.jwtUser.sub });
        if (!user) {
          return reply.status(404).send({ success: false, error: 'Usuario no encontrado' });
        }

        return reply.send({
          success: true,
          data: {
            cinemaToken: user.cinemaToken,
          },
        });
      } catch (err: any) {
        return (reply as any).code(500).send({ success: false, error: err.message });
      }
    }
  );

  // ── POST /users/me/cinema-token/regenerate — regenerar token ──────────────
  app.post(
    '/me/cinema-token/regenerate',
    {
      schema: {
        tags: ['users'],
        summary: 'Regenerar cinema token del usuario autenticado',
        response: {
          200: {
            type: 'object',
            properties: {
              success: { type: 'boolean' },
              data: {
                type: 'object',
                properties: {
                  cinemaToken: { type: 'string' },
                  cinemaUrl: { type: 'string' },
                },
              },
            },
          },
          401: errorShape,
          404: errorShape,
        },
      },
    },
    async (req, reply) => {
      try {
        if (!req.jwtUser) {
          return reply.status(401).send({ success: false, error: 'No autorizado' });
        }

        const { randomUUID } = await import('crypto');
        const newToken = randomUUID();

        const user = await User.findOneAndUpdate(
          { googleId: req.jwtUser.sub },
          { $set: { cinemaToken: newToken } },
          { new: true }
        );

        if (!user) {
          return reply.status(404).send({ success: false, error: 'Usuario no encontrado' });
        }

        return reply.send({
          success: true,
          data: {
            cinemaToken: user.cinemaToken,
          },
        });
      } catch (err: any) {
        return (reply as any).code(500).send({ success: false, error: err.message });
      }
    }
  );
}
