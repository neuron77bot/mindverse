import type { FastifyInstance } from 'fastify';
import { agenda, getJobsCollection } from '../services/job-queue';
import type { JobWithState } from 'agenda';
import { ObjectId } from 'mongodb';

const errorShape = {
  type: 'object',
  properties: { success: { type: 'boolean' }, error: { type: 'string' } },
};

// Schema completo para un job serializado
const jobSchema = {
  type: 'object',
  properties: {
    jobId: { type: ['string', 'null'] },
    name: { type: ['string', 'null'] },
    data: { 
      type: 'object',
      additionalProperties: true,
      description: 'Datos específicos del job (userId, storyboardId, etc.)'
    },
    priority: { type: ['number', 'null'] },
    progress: { type: 'number' },
    nextRunAt: { type: ['string', 'null'], description: 'Fecha ISO del próximo run' },
    lastRunAt: { type: ['string', 'null'], description: 'Fecha ISO del último run' },
    lastFinishedAt: { type: ['string', 'null'], description: 'Fecha ISO de finalización' },
    failedAt: { type: ['string', 'null'], description: 'Fecha ISO de fallo' },
    failReason: { type: ['string', 'null'], description: 'Razón del fallo si existe' },
    lockedAt: { type: ['string', 'null'], description: 'Fecha ISO de bloqueo (running)' },
    state: { type: ['string', 'null'], description: 'Estado interno de Agenda' },
    status: { type: 'string', enum: ['pending', 'running', 'completed', 'failed'], description: 'Estado normalizado' },
  },
};

// Helper para serializar jobs con información útil
function serializeJob(job: JobWithState) {
  // En Agenda 6, los jobs pueden venir con attrs o directamente
  const attrs = (job as any).attrs || job;
  return {
    jobId: attrs._id?.toString(),
    name: attrs.name,
    data: attrs.data,
    priority: attrs.priority,
    progress: attrs.progress || 0,
    nextRunAt: attrs.nextRunAt,
    lastRunAt: attrs.lastRunAt,
    lastFinishedAt: attrs.lastFinishedAt,
    failedAt: attrs.failedAt,
    failReason: attrs.failReason,
    lockedAt: attrs.lockedAt,
    state: attrs.state || (job as any).state,
    status: mapStateToStatus(attrs.state || (job as any).state),
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

// Helper para determinar el estado de un job desde el documento de MongoDB
function determineJobState(jobDoc: any): string {
  if (jobDoc.failedAt) return 'failed';
  if (jobDoc.lastFinishedAt) return 'completed';
  if (jobDoc.lockedAt) return 'running';
  if (jobDoc.nextRunAt) return 'queued';
  return 'unknown';
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
              jobs: { type: 'array', items: jobSchema },
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

        app.log.info({ msg: 'Listando jobs', userId, status, limit });

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

        app.log.info({ msg: 'Jobs obtenidos de Agenda', count: jobsResult.jobs?.length || 0 });

        // Filtrar por userId en los datos con defensive checks
        // En Agenda 6, los jobs pueden venir con attrs o directamente
        const jobs = jobsResult.jobs.filter((j: JobWithState) => {
          const attrs = (j as any).attrs || j;
          if (!attrs) {
            app.log.warn({ msg: 'Job sin attrs ni propiedades directas', job: j });
            return false;
          }
          if (!attrs.data) {
            app.log.warn({ msg: 'Job sin data', jobId: attrs._id });
            return false;
          }
          const hasUserId = attrs.data.userId === userId;
          if (!hasUserId) {
            app.log.debug({
              msg: 'Job filtrado - userId no coincide',
              jobId: attrs._id,
              jobUserId: attrs.data.userId,
              requestUserId: userId,
            });
          }
          return hasUserId;
        });

        app.log.info({ msg: 'Jobs filtrados por userId', count: jobs.length });

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
              job: jobSchema,
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

        app.log.info({ msg: 'Consultando job', jobId, userId });

        // Validar ObjectId
        if (!ObjectId.isValid(jobId)) {
          app.log.warn({ msg: 'JobId inválido', jobId });
          return reply.status(400).send({ success: false, error: 'ID de job inválido' });
        }

        // Consultar directamente desde MongoDB
        const collection = await getJobsCollection();
        const jobDoc = await collection.findOne({ _id: new ObjectId(jobId) });

        if (!jobDoc) {
          app.log.warn({ msg: 'Job no encontrado en MongoDB', jobId });
          return reply.status(404).send({ success: false, error: 'Job no encontrado' });
        }

        // Verificar pertenencia al usuario
        if (!jobDoc.data || jobDoc.data.userId !== userId) {
          app.log.warn({
            msg: 'Job no pertenece al usuario',
            jobId,
            jobUserId: jobDoc.data?.userId,
            requestUserId: userId,
          });
          return reply.status(404).send({ success: false, error: 'Job no encontrado' });
        }

        // Serializar el documento de MongoDB
        const state = determineJobState(jobDoc);
        const serialized = {
          jobId: jobDoc._id.toString(),
          name: jobDoc.name,
          data: jobDoc.data,
          priority: jobDoc.priority,
          progress: jobDoc.progress || 0,
          nextRunAt: jobDoc.nextRunAt,
          lastRunAt: jobDoc.lastRunAt,
          lastFinishedAt: jobDoc.lastFinishedAt,
          failedAt: jobDoc.failedAt,
          failReason: jobDoc.failReason,
          lockedAt: jobDoc.lockedAt,
          state,
          status: mapStateToStatus(state),
        };

        app.log.info({
          msg: 'Job encontrado',
          jobId,
          status: serialized.status,
          progress: serialized.progress,
          state: serialized.state,
        });

        return reply.send({ success: true, job: serialized });
      } catch (err: any) {
        app.log.error({
          msg: 'Error consultando job',
          jobId: req.params.jobId,
          error: err.message,
          stack: err.stack,
        });
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

        app.log.info({ msg: 'Intentando cancelar job', jobId, userId });

        // Verificar que el job pertenece al usuario
        const jobsResult = await agenda.queryJobs({ id: jobId });
        const jobs = jobsResult.jobs.filter((j: JobWithState) => {
          const attrs = (j as any).attrs || j;
          if (!attrs || !attrs.data) return false;
          return attrs.data.userId === userId;
        });

        if (jobs.length === 0) {
          app.log.warn({ msg: 'Job no encontrado para cancelar', jobId, userId });
          return reply.status(404).send({ success: false, error: 'Job no encontrado' });
        }

        const job = jobs[0];
        const jobAttrs = (job as any).attrs || job;

        // Verificar que no esté completado
        if (jobAttrs.state === 'completed') {
          return reply
            .status(400)
            .send({ success: false, error: 'No se puede cancelar un job completado' });
        }

        // Cancelar job usando el método del backend
        await agenda.db.removeJobs({ id: jobId });

        app.log.info({ msg: 'Job cancelado', jobId, userId });

        return reply.send({ success: true, message: 'Job cancelado exitosamente' });
      } catch (err: any) {
        app.log.error({ msg: 'Error cancelando job', jobId: req.params.jobId, error: err.message });
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
            galleryTags: {
              type: 'array',
              items: { type: 'string' },
              description: 'Tags de galería para image-to-image',
            },
            styleTagIds: {
              type: 'array',
              items: { type: 'string' },
              description: 'IDs de estilos a aplicar',
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

        const body = req.body as any;
        const {
          storyboardId,
          frameIndices,
          aspectRatio = '1:1',
          galleryTags = [],
          styleTagIds = [],
        } = body;

        if (!frameIndices || frameIndices.length === 0) {
          return reply
            .status(400)
            .send({ success: false, error: 'frameIndices no puede estar vacío' });
        }

        app.log.info({
          msg: 'Creando job de batch generation',
          userId,
          storyboardId,
          frameCount: frameIndices.length,
          aspectRatio,
        });

        // Crear job
        const job = await agenda.now('batch-generate-images', {
          userId,
          storyboardId,
          frameIndices,
          aspectRatio,
          galleryTags,
          styleTagIds,
        });

        const jobId = (job as any).attrs._id?.toString();

        if (!jobId) {
          app.log.error({ msg: 'Job creado pero sin ID', job: job });
          throw new Error('Job creado pero no se pudo obtener el ID');
        }

        app.log.info({
          msg: 'Job de batch generation creado',
          jobId,
          userId,
          storyboardId,
          frameCount: frameIndices.length,
          jobState: (job as any).attrs.state,
        });

        // Verificar que el job se puede consultar inmediatamente
        const verifyResult = await agenda.queryJobs({ id: jobId });
        if (verifyResult.jobs.length === 0) {
          app.log.warn({ msg: 'Job creado pero no se puede consultar inmediatamente', jobId });
        } else {
          app.log.info({ msg: 'Job verificado después de creación', jobId });
        }

        return reply.send({
          success: true,
          jobId,
          message: `Job creado para generar ${frameIndices.length} imágenes`,
        });
      } catch (err: any) {
        app.log.error({
          msg: 'Error creando job de batch generation',
          error: err.message,
          stack: err.stack,
        });
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
          return reply
            .status(400)
            .send({ success: false, error: 'videoUrls no puede estar vacío' });
        }

        // Crear job
        const job = await agenda.now('compile-video', {
          userId,
          storyboardId,
          videoUrls,
          youtubeUrl,
          audioStartTime,
        });

        const jobId = (job as any).attrs._id?.toString();

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
