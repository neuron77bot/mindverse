import type { FastifyInstance } from 'fastify';
import { User } from '../models/User';
import { ApiKey } from '../models/ApiKey';
import { randomBytes } from 'crypto';

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

  // ═══════════════════════════════════════════════════════════════════════════
  // API KEYS
  // ═══════════════════════════════════════════════════════════════════════════

  // ── POST /users/api-keys — generar nueva API Key ──────────────────────────
  app.post<{ Body: { name: string; expiresInDays?: number } }>(
    '/api-keys',
    {
      schema: {
        tags: ['users'],
        summary: 'Generar nueva API Key',
        description: 'Genera una nueva API Key para el usuario autenticado. La key se muestra UNA SOLA VEZ.',
        body: {
          type: 'object',
          required: ['name'],
          properties: {
            name: { 
              type: 'string',
              description: 'Nombre descriptivo de la API Key',
              maxLength: 100
            },
            expiresInDays: {
              type: 'number',
              description: 'Días hasta que expire la key (opcional)',
              minimum: 1
            },
          },
        },
        response: {
          200: {
            type: 'object',
            properties: {
              success: { type: 'boolean' },
              data: {
                type: 'object',
                properties: {
                  id: { type: 'string' },
                  name: { type: 'string' },
                  key: { type: 'string', description: 'API Key en texto plano - solo se muestra una vez' },
                  createdAt: { type: 'string' },
                  expiresAt: { type: 'string', nullable: true },
                },
              },
            },
          },
          401: errorShape,
          400: errorShape,
        },
      },
    },
    async (req, reply) => {
      try {
        if (!req.jwtUser) {
          return reply.status(401).send({ success: false, error: 'No autorizado' });
        }

        const { name, expiresInDays } = req.body;

        if (!name || name.trim().length === 0) {
          return reply.status(400).send({ 
            success: false, 
            error: 'El nombre es requerido' 
          });
        }

        // Buscar usuario
        const user = await User.findOne({ googleId: req.jwtUser.sub });
        if (!user) {
          return reply.status(404).send({ 
            success: false, 
            error: 'Usuario no encontrado' 
          });
        }

        // Generar API Key aleatoria (formato: sk_live_...)
        const randomPart = randomBytes(32).toString('hex');
        const plainKey = `sk_live_${randomPart}`;

        // Hashear la key
        const hashedKey = await (ApiKey as any).hashKey(plainKey);

        // Calcular fecha de expiración si se especificó
        let expiresAt: Date | null = null;
        if (expiresInDays && expiresInDays > 0) {
          expiresAt = new Date();
          expiresAt.setDate(expiresAt.getDate() + expiresInDays);
        }

        // Crear API Key en DB
        const apiKey = await ApiKey.create({
          key: hashedKey,
          userId: user._id,
          name: name.trim(),
          expiresAt,
          enabled: true,
        });

        return reply.send({
          success: true,
          data: {
            id: apiKey._id.toString(),
            name: apiKey.name,
            key: plainKey, // Solo se muestra una vez
            createdAt: apiKey.createdAt.toISOString(),
            expiresAt: apiKey.expiresAt?.toISOString() || null,
          },
        });
      } catch (err: any) {
        return reply.status(500).send({ 
          success: false, 
          error: err.message 
        });
      }
    }
  );

  // ── GET /users/api-keys — listar API Keys del usuario ─────────────────────
  app.get(
    '/api-keys',
    {
      schema: {
        tags: ['users'],
        summary: 'Listar API Keys del usuario autenticado',
        description: 'Lista todas las API Keys del usuario (sin mostrar la key completa)',
        response: {
          200: {
            type: 'object',
            properties: {
              success: { type: 'boolean' },
              data: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    id: { type: 'string' },
                    name: { type: 'string' },
                    preview: { type: 'string', description: 'Últimos 8 caracteres de la key' },
                    createdAt: { type: 'string' },
                    lastUsedAt: { type: 'string', nullable: true },
                    expiresAt: { type: 'string', nullable: true },
                    enabled: { type: 'boolean' },
                    isExpired: { type: 'boolean' },
                  },
                },
              },
            },
          },
          401: errorShape,
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
          return reply.status(404).send({ 
            success: false, 
            error: 'Usuario no encontrado' 
          });
        }

        const apiKeys = await ApiKey.find({ userId: user._id }).sort({ createdAt: -1 });

        const data = apiKeys.map((key) => ({
          id: key._id.toString(),
          name: key.name,
          preview: '••••••' + key.key.slice(-8), // Mostrar solo últimos 8 caracteres del hash
          createdAt: key.createdAt.toISOString(),
          lastUsedAt: key.lastUsedAt?.toISOString() || null,
          expiresAt: key.expiresAt?.toISOString() || null,
          enabled: key.enabled,
          isExpired: !!(key.expiresAt && key.expiresAt < new Date()),
        }));

        return reply.send({ success: true, data });
      } catch (err: any) {
        return reply.status(500).send({ 
          success: false, 
          error: err.message 
        });
      }
    }
  );

  // ── PATCH /users/api-keys/:id — habilitar/deshabilitar API Key ────────────
  app.patch<{ Params: { id: string }; Body: { enabled: boolean } }>(
    '/api-keys/:id',
    {
      schema: {
        tags: ['users'],
        summary: 'Habilitar o deshabilitar una API Key',
        params: {
          type: 'object',
          properties: {
            id: { type: 'string' },
          },
        },
        body: {
          type: 'object',
          required: ['enabled'],
          properties: {
            enabled: { type: 'boolean' },
          },
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
          403: errorShape,
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
          return reply.status(404).send({ 
            success: false, 
            error: 'Usuario no encontrado' 
          });
        }

        const apiKey = await ApiKey.findById(req.params.id);
        if (!apiKey) {
          return reply.status(404).send({ 
            success: false, 
            error: 'API Key no encontrada' 
          });
        }

        // Verificar que la key pertenece al usuario
        if (apiKey.userId.toString() !== user._id.toString()) {
          return reply.status(403).send({ 
            success: false, 
            error: 'No tienes permiso para modificar esta API Key' 
          });
        }

        apiKey.enabled = req.body.enabled;
        await apiKey.save();

        return reply.send({
          success: true,
          message: `API Key ${req.body.enabled ? 'habilitada' : 'deshabilitada'}`,
        });
      } catch (err: any) {
        return reply.status(500).send({ 
          success: false, 
          error: err.message 
        });
      }
    }
  );

  // ── DELETE /users/api-keys/:id — eliminar API Key ─────────────────────────
  app.delete<{ Params: { id: string } }>(
    '/api-keys/:id',
    {
      schema: {
        tags: ['users'],
        summary: 'Eliminar (revocar) una API Key',
        params: {
          type: 'object',
          properties: {
            id: { type: 'string' },
          },
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
          403: errorShape,
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
          return reply.status(404).send({ 
            success: false, 
            error: 'Usuario no encontrado' 
          });
        }

        const apiKey = await ApiKey.findById(req.params.id);
        if (!apiKey) {
          return reply.status(404).send({ 
            success: false, 
            error: 'API Key no encontrada' 
          });
        }

        // Verificar que la key pertenece al usuario
        if (apiKey.userId.toString() !== user._id.toString()) {
          return reply.status(403).send({ 
            success: false, 
            error: 'No tienes permiso para eliminar esta API Key' 
          });
        }

        await ApiKey.findByIdAndDelete(req.params.id);

        return reply.send({
          success: true,
          message: 'API Key eliminada',
        });
      } catch (err: any) {
        return reply.status(500).send({ 
          success: false, 
          error: err.message 
        });
      }
    }
  );
}
