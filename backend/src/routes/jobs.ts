import type { FastifyInstance } from 'fastify';
import { agenda } from '../services/job-queue';
import type { JobWithState } from 'agenda';

const errorShape = {
  type: 'object',
  properties: { success: { type: 'boolean' }, error: { type: 'string' } },
};

// Helper para serializar jobs con información útil
function serializeJob(job: JobWithState) {
  return {
    jobId: job._id?.toString(),
    name: job.name,
    data: job.data,
    priority: job.priority,
    progress: job.progress || 0,
    nextRunAt: job.nextRunAt,
    lastRunAt: job.lastRunAt,
    lastFinishedAt: job.lastFinishedAt,
    failedAt: job.failedAt,
    failReason: job.failReason,
    lockedAt: job.lockedAt,
    state: job.state,
    status: mapStateToStatus(job.state),
  };
}

function mapStateToStatus(state: string): string {
  switch (state) {
    case 'failed':
      return 'failed';
    case 'completed':
      return 'completed';
    case 'running':
      return 'running';
    case 'queued':
    case 'scheduled':
      return 'pending';
    default:
      return state;
  }
}

export async function jobRoutes(app: FastifyInstance) {
  // GET /jobs - Listar todos los jobs del usuario
  app.get(
    '/',
    {
      schema: {
        tags: ['jobs'],
        summary: 'Listar jobs del usuario',
        querystring: {
          type: 'object',
          properties: {
            status: {
              type: 'string',
              enum: ['pending', 'running', 'completed', 'failed'],
              description: 'Filtrar por estado',
            },
            limit: { type: 'number', default: 50, description: 'Límite de resultados' },
          },
        },
        response: {
          200: {
            type: 'object',
            properties: {
              success: { type: 'boolean' },
              jobs: { type: 'array', items: { type: 'object' } },
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

        const { status, limit = 50 } = req.query as { status?: string; limit?: number };

        // Construir opciones de query para Agenda 6
        const queryOptions: any = { limit };

        // Mapear estado de filtro
        if (status === 'failed') {
          queryOptions.state = 'failed';
        } else if (status === 'completed') {
          queryOptions.state = 'completed';
        } else if (status === 'running') {
          queryOptions.state = 'running';
        } else if (status === 'pending') {
          queryOptions.state = 'queued';
        }

        const jobsResult = await agenda.queryJobs(queryOptions);
        
        // Filtrar por userId en los datos
        const jobs = jobsResult.jobs.filter((j: JobWithState) => j.data && (j.data as any).userId === userId);

        const serialized = jobs.map(serializeJob);

        return reply.send({ success: true, jobs: serialized });
      } catch (err: any) {
        app.log.error(err);
        return reply.status(500).send({ success: false, error: err.message });
      }
    }
  );

  // GET /jobs/:jobId - Obtener estado de un job específico
  app.get<{ Params: { jobId: string } }>(
    '/:jobId',
    {
      schema: {
        tags: ['jobs'],
        summary: 'Obtener estado de un job',
        params: {
          type: 'object',
          required: ['jobId'],
          properties: { jobId: { type: 'string' } },
        },
        response: {
          200: {
            type: 'object',
            properties: {
              success: { type: 'boolean' },
              job: { type: 'object' },
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

        const { jobId } = req.params;

        const jobsResult = await agenda.queryJobs({ id: jobId });
        const jobs = jobsResult.jobs.filter((j: JobWithState) => {
          return j.data && (j.data as any).userId === userId;
        });

        if (jobs.length === 0) {
          return reply.status(404).send({ success: false, error: 'Job no encontrado' });
        }

        const job = jobs[0];
        const serialized = serializeJob(job);

        return reply.send({ success: true, job: serialized });
      } catch (err: any) {
        app.log.error(err);
        return reply.status(500).send({ success: false, error: err.message });
      }
    }
  );

  // DELETE /jobs/:jobId - Cancelar un job
  app.delete<{ Params: { jobId: string } }>(
    '/:jobId',
    {
      schema: {
        tags: ['jobs'],
        summary: 'Cancelar un job',
        params: {
          type: 'object',
          required: ['jobId'],
          properties: { jobId: { type: 'string' } },
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

        const { jobId } = req.params;

        // Verificar que el job pertenece al usuario
        const jobsResult = await agenda.queryJobs({ id: jobId });
        const jobs = jobsResult.jobs.filter((j: JobWithState) => {
          return j.data && (j.data as any).userId === userId;
        });

        if (jobs.length === 0) {
          return reply.status(404).send({ success: false, error: 'Job no encontrado' });
        }

        const job = jobs[0];

        // Verificar que no esté completado
        if (job.state === 'completed') {
          return reply
            .status(400)
            .send({ success: false, error: 'No se puede cancelar un job completado' });
        }

        // Cancelar job usando el método del backend
        await agenda.db.removeJobs({ id: jobId });

        app.log.info({ msg: 'Job cancelado', jobId, userId });

        return reply.send({ success: true, message: 'Job cancelado exitosamente' });
      } catch (err: any) {
        app.log.error(err);
        return reply.status(500).send({ success: false, error: err.message });
      }
    }
  );

  // POST /jobs/batch-generate-images - Crear job para generar imágenes en batch
  app.post<{
    Body: {
      storyboardId: string;
      frameIndices: number[];
      aspectRatio?: string;
    };
  }>(
    '/batch-generate-images',
    {
      schema: {
        tags: ['jobs'],
        summary: 'Crear job para generación masiva de imágenes',
        body: {
          type: 'object',
          required: ['storyboardId', 'frameIndices'],
          properties: {
            storyboardId: { type: 'string' },
            frameIndices: {
              type: 'array',
              items: { type: 'number' },
              description: 'Índices de frames a generar (0-based)',
            },
            aspectRatio: {
              type: 'string',
              default: '1:1',
              description: 'Aspect ratio para las imágenes',
            },
          },
        },
        response: {
          200: {
            type: 'object',
            properties: {
              success: { type: 'boolean' },
              jobId: { type: 'string' },
              message: { type: 'string' },
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

        const { storyboardId, frameIndices, aspectRatio = '1:1' } = req.body;

        if (!frameIndices || frameIndices.length === 0) {
          return reply
            .status(400)
            .send({ success: false, error: 'frameIndices no puede estar vacío' });
        }

        // Crear job
        const job = await agenda.now('batch-generate-images', {
          userId,
          storyboardId,
          frameIndices,
          aspectRatio,
        });

        const jobId = job.attrs._id?.toString();

        app.log.info({
          msg: 'Job de batch generation creado',
          jobId,
          userId,
          storyboardId,
          frameCount: frameIndices.length,
        });

        return reply.send({
          success: true,
          jobId,
          message: `Job creado para generar ${frameIndices.length} imágenes`,
        });
      } catch (err: any) {
        app.log.error(err);
        return reply.status(500).send({ success: false, error: err.message });
      }
    }
  );

  // POST /jobs/compile-video - Crear job para compilar video
  app.post<{
    Body: {
      storyboardId: string;
      videoUrls: string[];
      youtubeUrl?: string;
      audioStartTime?: number;
    };
  }>(
    '/compile-video',
    {
      schema: {
        tags: ['jobs'],
        summary: 'Crear job para compilar video',
        body: {
          type: 'object',
          required: ['storyboardId', 'videoUrls'],
          properties: {
            storyboardId: { type: 'string' },
            videoUrls: { type: 'array', items: { type: 'string' } },
            youtubeUrl: {
              type: 'string',
              description: 'URL de YouTube para música de fondo',
            },
            audioStartTime: {
              type: 'number',
              default: 0,
              description: 'Tiempo de inicio del audio en segundos',
            },
          },
        },
        response: {
          200: {
            type: 'object',
            properties: {
              success: { type: 'boolean' },
              jobId: { type: 'string' },
              message: { type: 'string' },
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

        const { storyboardId, videoUrls, youtubeUrl, audioStartTime = 0 } = req.body;

        if (!videoUrls || videoUrls.length === 0) {
          return reply.status(400).send({ success: false, error: 'videoUrls no puede estar vacío' });
        }

        // Crear job
        const job = await agenda.now('compile-video', {
          userId,
          storyboardId,
          videoUrls,
          youtubeUrl,
          audioStartTime,
        });

        const jobId = job.attrs._id?.toString();

        app.log.info({
          msg: 'Job de compilación de video creado',
          jobId,
          userId,
          storyboardId,
          videoCount: videoUrls.length,
          withMusic: !!youtubeUrl,
        });

        return reply.send({
          success: true,
          jobId,
          message: `Job creado para compilar ${videoUrls.length} videos`,
        });
      } catch (err: any) {
        app.log.error(err);
        return reply.status(500).send({ success: false, error: err.message });
      }
    }
  );
}
