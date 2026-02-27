import type { FastifyInstance } from 'fastify';
import { Storyboard } from '../models/Storyboard';
import { User } from '../models/User';

const errorShape = {
  type: 'object',
  properties: { success: { type: 'boolean' }, error: { type: 'string' } },
};

export async function cinemaRoutes(app: FastifyInstance) {
  // GET /cinema/:token - Obtener storyboards públicos de un usuario (Cinema Mode)
  app.get<{ Params: { token: string } }>(
    '/:token',
    {
      schema: {
        tags: ['cinema'],
        summary: 'Obtener storyboards públicos en Cinema Mode',
        params: {
          type: 'object',
          required: ['token'],
          properties: { token: { type: 'string' } },
        },
        response: {
          200: {
            type: 'object',
            properties: {
              success: { type: 'boolean' },
              storyboards: { type: 'array' },
              user: {
                type: 'object',
                properties: {
                  name: { type: 'string' },
                  picture: { type: 'string' },
                  bio: { type: 'string' },
                },
              },
            },
          },
          404: errorShape,
          500: errorShape,
        },
      },
    },
    async (req, reply) => {
      try {
        const { token } = req.params;

        // Buscar usuario por googleId (el token es el googleId)
        const user = await User.findOne({ googleId: token }).lean();

        if (!user) {
          return reply.status(404).send({
            success: false,
            error: 'Usuario no encontrado',
          });
        }

        // Obtener solo storyboards con allowCinema = true
        const storyboards = await Storyboard.find({
          userId: token,
          allowCinema: true,
        })
          .select('_id title description genre frames createdAt updatedAt')
          .sort({ createdAt: -1 })
          .lean();

        return reply.send({
          success: true,
          storyboards,
          user: {
            name: user.name,
            picture: user.picture,
            bio: user.bio,
          },
        });
      } catch (err: any) {
        app.log.error(err);
        return reply.status(500).send({ success: false, error: err.message });
      }
    }
  );
}
