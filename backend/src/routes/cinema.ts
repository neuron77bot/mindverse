import type { FastifyInstance } from 'fastify';
import { User } from '../models/User';
import { Storyboard } from '../models/Storyboard';

const errorShape = {
  type: 'object',
  properties: { success: { type: 'boolean' }, error: { type: 'string' } },
};

export async function cinemaRoutes(app: FastifyInstance) {
  // ── GET /cinema/:token — vista pública de storyboards ─────────────────────
  app.get<{ Params: { token: string } }>(
    '/:token',
    {
      schema: {
        tags: ['cinema'],
        summary: 'Vista pública de storyboards del usuario (Netflix-style)',
        params: {
          type: 'object',
          properties: { token: { type: 'string', description: 'Cinema token único del usuario' } },
        },
        response: {
          200: {
            type: 'object',
            properties: {
              success: { type: 'boolean' },
              data: {
                type: 'object',
                properties: {
                  user: {
                    type: 'object',
                    properties: {
                      name: { type: 'string' },
                      picture: { type: 'string', nullable: true },
                    },
                  },
                  storyboards: {
                    type: 'array',
                    items: {
                      type: 'object',
                      properties: {
                        _id: { type: 'string' },
                        title: { type: 'string' },
                        description: { type: 'string', nullable: true },
                        genre: { type: 'string', nullable: true },
                        thumbnailUrl: { type: 'string', nullable: true },
                        frameCount: { type: 'number' },
                        duration: { type: 'string' },
                        createdAt: { type: 'string' },
                        frames: { type: 'array' },
                      },
                    },
                  },
                },
              },
            },
          },
          404: errorShape,
        },
      },
    },
    async (req, reply) => {
      try {
        const { token } = req.params;

        // Buscar usuario por cinemaToken
        const user = await User.findOne({ cinemaToken: token });
        if (!user) {
          return reply.status(404).send({
            success: false,
            error: 'Token inválido o expirado',
          });
        }

        // Buscar storyboards del usuario (máximo 50 por performance)
        const storyboards = await Storyboard.find({ userId: user.googleId })
          .sort({ createdAt: -1 })
          .limit(50)
          .lean();

        // Mapear storyboards al formato esperado (incluir frames completos)
        const mappedStoryboards = storyboards.map((sb) => {
          const thumbnailUrl = sb.frames[0]?.imageUrl || null;
          const frameCount = sb.frames.length;
          // Estimar duración: ~30 segundos por frame
          const totalSeconds = frameCount * 30;
          const minutes = Math.floor(totalSeconds / 60);
          const seconds = totalSeconds % 60;
          const duration = `${minutes}:${seconds.toString().padStart(2, '0')}`;

          return {
            _id: sb._id.toString(),
            title: sb.title,
            description: sb.description || null,
            genre: sb.genre || null,
            thumbnailUrl,
            frameCount,
            duration,
            createdAt: sb.createdAt,
            frames: sb.frames, // Incluir frames completos para modal
          };
        });

        return reply.send({
          success: true,
          data: {
            user: {
              name: user.name,
              picture: user.picture || null,
            },
            storyboards: mappedStoryboards,
          },
        });
      } catch (err: any) {
        app.log.error(err);
        return (reply as any).code(500).send({ success: false, error: err.message });
      }
    }
  );
}
