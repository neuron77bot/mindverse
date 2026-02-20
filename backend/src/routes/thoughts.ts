import type { FastifyInstance } from 'fastify';
import { Thought } from '../models/Thought';

// ── Schemas reutilizables ─────────────────────────────────────────────────────
const CATEGORIES = ['HEALTH','WORK','LOVE','FAMILY','FINANCES','PERSONAL_GROWTH','LEISURE','SPIRITUALITY','SOCIAL'];
const TEMPORAL   = ['PAST','PRESENT','FUTURE'];
const EMOTIONAL  = ['SHAME','GUILT','APATHY','GRIEF','FEAR','DESIRE','ANGER','PRIDE','COURAGE',
                    'NEUTRALITY','WILLINGNESS','ACCEPTANCE','REASON','LOVE','JOY','PEACE','ENLIGHTENMENT'];

const thoughtShape = {
  type: 'object',
  properties: {
    _id:            { type: 'string' },
    frontendId:     { type: 'string' },
    content:        { type: 'string' },
    description:    { type: 'string' },
    category:       { type: 'string', enum: CATEGORIES },
    temporalState:  { type: 'string', enum: TEMPORAL },
    emotionalLevel: { type: 'string', enum: EMOTIONAL },
    positionX:      { type: 'number' },
    positionY:      { type: 'number' },
    color:          { type: 'string' },
    isRoot:         { type: 'boolean' },
    imageUrl:       { type: 'string', nullable: true },
    tags:           { type: 'array', items: { type: 'string' } },
    isFavorite:     { type: 'boolean' },
    connections:    {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          source:       { type: 'string' },
          target:       { type: 'string' },
          connectionId: { type: 'string' },
        },
      },
    },
    createdAt: { type: 'string' },
    updatedAt: { type: 'string' },
  },
};

const bodyShape = {
  type: 'object',
  required: ['frontendId','content','category','temporalState','emotionalLevel'],
  properties: {
    frontendId:     { type: 'string', description: 'UUID generado por el frontend' },
    content:        { type: 'string' },
    description:    { type: 'string' },
    category:       { type: 'string', enum: CATEGORIES },
    temporalState:  { type: 'string', enum: TEMPORAL },
    emotionalLevel: { type: 'string', enum: EMOTIONAL },
    positionX:      { type: 'number' },
    positionY:      { type: 'number' },
    color:          { type: 'string' },
    isRoot:         { type: 'boolean' },
    imageUrl:       { type: 'string', nullable: true },
    tags:           { type: 'array', items: { type: 'string' } },
    isFavorite:     { type: 'boolean' },
    connections:    {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          source:       { type: 'string' },
          target:       { type: 'string' },
          connectionId: { type: 'string' },
        },
      },
    },
  },
};

const errorShape = {
  type: 'object',
  properties: { success: { type: 'boolean' }, error: { type: 'string' } },
};

// ── Plugin de rutas ───────────────────────────────────────────────────────────
export async function thoughtRoutes(app: FastifyInstance) {

  // GET /thoughts
  app.get('/', {
    schema: {
      tags: ['thoughts'],
      summary: 'Listar todos los pensamientos',
      response: {
        200: {
          type: 'object',
          properties: { success: { type: 'boolean' }, data: { type: 'array', items: thoughtShape } },
        },
        401: errorShape,
      },
    },
  }, async (req, reply) => {
    try {
      const userId = req.jwtUser?.sub;
      if (!userId) return (reply as any).status(401).send({ success: false, error: 'No autorizado' });
      
      const thoughts = await Thought.find({ userId }).sort({ createdAt: -1 });
      return reply.send({ success: true, data: thoughts });
    } catch (err: any) {
      return (reply as any).code(500).send({ success: false, error: err.message });
    }
  });

  // GET /thoughts/:id
  app.get<{ Params: { id: string } }>('/:id', {
    schema: {
      tags: ['thoughts'],
      summary: 'Obtener un pensamiento por frontendId',
      params: { type: 'object', properties: { id: { type: 'string' } } },
      response: {
        200: { type: 'object', properties: { success: { type: 'boolean' }, data: thoughtShape } },
        404: errorShape,
      },
    },
  }, async (req, reply) => {
    try {
      const userId = req.jwtUser?.sub;
      if (!userId) return reply.status(401).send({ success: false, error: 'No autorizado' });
      
      const thought = await Thought.findOne({ frontendId: req.params.id, userId });
      if (!thought) return reply.status(404).send({ success: false, error: 'Pensamiento no encontrado' });
      return reply.send({ success: true, data: thought });
    } catch (err: any) {
      return (reply as any).code(500).send({ success: false, error: err.message });
    }
  });

  // POST /thoughts
  app.post<{ Body: Record<string, any> }>('/', {
    schema: {
      tags: ['thoughts'],
      summary: 'Crear un nuevo pensamiento',
      body: bodyShape,
      response: {
        201: { type: 'object', properties: { success: { type: 'boolean' }, data: thoughtShape } },
        400: errorShape,
        409: errorShape,
      },
    },
  }, async (req, reply) => {
    try {
      const userId = req.jwtUser?.sub;
      if (!userId) return reply.status(401).send({ success: false, error: 'No autorizado' });
      
      const { frontendId, content, description, category, temporalState, emotionalLevel,
              positionX, positionY, color, isRoot, imageUrl, tags, isFavorite, connections } = req.body;

      if (!frontendId || !content || !category || !temporalState || !emotionalLevel) {
        return reply.status(400).send({ success: false, error: 'Faltan campos requeridos' });
      }

      const thought = new Thought({
        userId,
        frontendId, content, description, category, temporalState, emotionalLevel,
        positionX, positionY, color, isRoot, imageUrl, tags, isFavorite, connections,
      });
      await thought.save();
      return reply.status(201).send({ success: true, data: thought });
    } catch (err: any) {
      if (err.code === 11000) return reply.status(409).send({ success: false, error: 'Ya existe un pensamiento con ese frontendId' });
      return (reply as any).code(500).send({ success: false, error: err.message });
    }
  });

  // PUT /thoughts/:id
  app.put<{ Params: { id: string }; Body: Record<string, any> }>('/:id', {
    schema: {
      tags: ['thoughts'],
      summary: 'Reemplazar un pensamiento completo',
      params: { type: 'object', properties: { id: { type: 'string' } } },
      body: {
        type: 'object',
        properties: bodyShape.properties,
      },
      response: {
        200: { type: 'object', properties: { success: { type: 'boolean' }, data: thoughtShape } },
        404: errorShape,
      },
    },
  }, async (req, reply) => {
    try {
      const userId = req.jwtUser?.sub;
      if (!userId) return reply.status(401).send({ success: false, error: 'No autorizado' });
      
      const { content, description, category, temporalState, emotionalLevel,
              positionX, positionY, color, isRoot, imageUrl, tags, isFavorite, connections } = req.body;

      const thought = await Thought.findOneAndUpdate(
        { frontendId: req.params.id, userId },
        { content, description, category, temporalState, emotionalLevel,
          positionX, positionY, color, isRoot, imageUrl, tags, isFavorite, connections },
        { new: true, runValidators: true }
      );
      if (!thought) return reply.status(404).send({ success: false, error: 'Pensamiento no encontrado' });
      return reply.send({ success: true, data: thought });
    } catch (err: any) {
      return (reply as any).code(500).send({ success: false, error: err.message });
    }
  });

  // PATCH /thoughts/:id
  app.patch<{ Params: { id: string }; Body: Record<string, any> }>('/:id', {
    schema: {
      tags: ['thoughts'],
      summary: 'Actualización parcial de un pensamiento',
      params: { type: 'object', properties: { id: { type: 'string' } } },
      body: { type: 'object', properties: bodyShape.properties },
      response: {
        200: { type: 'object', properties: { success: { type: 'boolean' }, data: thoughtShape } },
        404: errorShape,
      },
    },
  }, async (req, reply) => {
    try {
      const userId = req.jwtUser?.sub;
      if (!userId) return reply.status(401).send({ success: false, error: 'No autorizado' });
      
      const thought = await Thought.findOneAndUpdate(
        { frontendId: req.params.id, userId },
        { $set: req.body },
        { new: true, runValidators: true }
      );
      if (!thought) return reply.status(404).send({ success: false, error: 'Pensamiento no encontrado' });
      return reply.send({ success: true, data: thought });
    } catch (err: any) {
      return (reply as any).code(500).send({ success: false, error: err.message });
    }
  });

  // DELETE /thoughts/:id
  app.delete<{ Params: { id: string } }>('/:id', {
    schema: {
      tags: ['thoughts'],
      summary: 'Eliminar un pensamiento',
      params: { type: 'object', properties: { id: { type: 'string' } } },
      response: {
        200: { type: 'object', properties: { success: { type: 'boolean' }, message: { type: 'string' } } },
        404: errorShape,
      },
    },
  }, async (req, reply) => {
    try {
      const userId = req.jwtUser?.sub;
      if (!userId) return reply.status(401).send({ success: false, error: 'No autorizado' });
      
      const thought = await Thought.findOneAndDelete({ frontendId: req.params.id, userId });
      if (!thought) return reply.status(404).send({ success: false, error: 'Pensamiento no encontrado' });
      return reply.send({ success: true, message: 'Pensamiento eliminado', data: thought });
    } catch (err: any) {
      return (reply as any).code(500).send({ success: false, error: err.message });
    }
  });

  // DELETE /thoughts
  app.delete('/', {
    schema: {
      tags: ['thoughts'],
      summary: 'Eliminar todos los pensamientos',
      response: {
        200: { type: 'object', properties: { success: { type: 'boolean' }, message: { type: 'string' } } },
        401: errorShape,
      },
    },
  }, async (req, reply) => {
    try {
      const userId = req.jwtUser?.sub;
      if (!userId) return (reply as any).status(401).send({ success: false, error: 'No autorizado' });
      
      const result = await Thought.deleteMany({ userId });
      return reply.send({ success: true, message: `${result.deletedCount} pensamientos eliminados` });
    } catch (err: any) {
      return (reply as any).code(500).send({ success: false, error: err.message });
    }
  });

  // POST /thoughts/bulk
  app.post<{ Body: { thoughts: Record<string, any>[] } }>('/bulk', {
    schema: {
      tags: ['thoughts'],
      summary: 'Upsert masivo — sincronización desde el frontend',
      body: {
        type: 'object',
        required: ['thoughts'],
        properties: {
          thoughts: { type: 'array', items: { type: 'object' } },
        },
      },
      response: {
        200: {
          type: 'object',
          properties: {
            success:  { type: 'boolean' },
            upserted: { type: 'number' },
            modified: { type: 'number' },
          },
        },
        400: errorShape,
        401: errorShape,
      },
    },
  }, async (req, reply) => {
    try {
      const userId = req.jwtUser?.sub;
      if (!userId) return (reply as any).status(401).send({ success: false, error: 'No autorizado' });
      
      const { thoughts } = req.body;
      if (!Array.isArray(thoughts)) {
        return reply.status(400).send({ success: false, error: 'Se esperaba un array en "thoughts"' });
      }

      const ops = thoughts.map((t) => ({
        updateOne: {
          filter: { frontendId: t.frontendId, userId },
          update: { $set: { ...t, userId } },
          upsert: true,
        },
      }));

      const result = await Thought.bulkWrite(ops);
      return reply.send({ success: true, upserted: result.upsertedCount, modified: result.modifiedCount });
    } catch (err: any) {
      return (reply as any).code(500).send({ success: false, error: err.message });
    }
  });
}
