import type { FastifyInstance } from 'fastify';
import { Thought } from '../models/Thought';

export async function thoughtRoutes(app: FastifyInstance) {

  // ── GET /thoughts — listar todos ─────────────────────────────────────────
  app.get('/', async (_req, reply) => {
    try {
      const thoughts = await Thought.find().sort({ createdAt: -1 });
      return reply.send({ success: true, data: thoughts });
    } catch (err: any) {
      return reply.status(500).send({ success: false, error: err.message });
    }
  });

  // ── GET /thoughts/:id — obtener uno ──────────────────────────────────────
  app.get<{ Params: { id: string } }>('/:id', async (req, reply) => {
    try {
      const thought = await Thought.findOne({ frontendId: req.params.id });
      if (!thought) return reply.status(404).send({ success: false, error: 'Pensamiento no encontrado' });
      return reply.send({ success: true, data: thought });
    } catch (err: any) {
      return reply.status(500).send({ success: false, error: err.message });
    }
  });

  // ── POST /thoughts — crear ────────────────────────────────────────────────
  app.post<{ Body: Record<string, any> }>('/', async (req, reply) => {
    try {
      const { frontendId, content, description, category, temporalState, emotionalLevel,
              positionX, positionY, color, isRoot, imageUrl, connections } = req.body;

      if (!frontendId || !content || !category || !temporalState || !emotionalLevel) {
        return reply.status(400).send({ success: false, error: 'Faltan campos requeridos: frontendId, content, category, temporalState, emotionalLevel' });
      }

      const thought = new Thought({
        frontendId, content, description, category, temporalState, emotionalLevel,
        positionX, positionY, color, isRoot, imageUrl, connections,
      });

      await thought.save();
      return reply.status(201).send({ success: true, data: thought });
    } catch (err: any) {
      if (err.code === 11000) {
        return reply.status(409).send({ success: false, error: 'Ya existe un pensamiento con ese frontendId' });
      }
      return reply.status(500).send({ success: false, error: err.message });
    }
  });

  // ── PUT /thoughts/:id — reemplazar ────────────────────────────────────────
  app.put<{ Params: { id: string }; Body: Record<string, any> }>('/:id', async (req, reply) => {
    try {
      const { content, description, category, temporalState, emotionalLevel,
              positionX, positionY, color, isRoot, imageUrl, connections } = req.body;

      const thought = await Thought.findOneAndUpdate(
        { frontendId: req.params.id },
        { content, description, category, temporalState, emotionalLevel,
          positionX, positionY, color, isRoot, imageUrl, connections },
        { new: true, runValidators: true }
      );

      if (!thought) return reply.status(404).send({ success: false, error: 'Pensamiento no encontrado' });
      return reply.send({ success: true, data: thought });
    } catch (err: any) {
      return reply.status(500).send({ success: false, error: err.message });
    }
  });

  // ── PATCH /thoughts/:id — actualización parcial ───────────────────────────
  app.patch<{ Params: { id: string }; Body: Record<string, any> }>('/:id', async (req, reply) => {
    try {
      const thought = await Thought.findOneAndUpdate(
        { frontendId: req.params.id },
        { $set: req.body },
        { new: true, runValidators: true }
      );

      if (!thought) return reply.status(404).send({ success: false, error: 'Pensamiento no encontrado' });
      return reply.send({ success: true, data: thought });
    } catch (err: any) {
      return reply.status(500).send({ success: false, error: err.message });
    }
  });

  // ── DELETE /thoughts/:id — eliminar ──────────────────────────────────────
  app.delete<{ Params: { id: string } }>('/:id', async (req, reply) => {
    try {
      const thought = await Thought.findOneAndDelete({ frontendId: req.params.id });
      if (!thought) return reply.status(404).send({ success: false, error: 'Pensamiento no encontrado' });
      return reply.send({ success: true, message: 'Pensamiento eliminado', data: thought });
    } catch (err: any) {
      return reply.status(500).send({ success: false, error: err.message });
    }
  });

  // ── DELETE /thoughts — eliminar todos ─────────────────────────────────────
  app.delete('/', async (_req, reply) => {
    try {
      const result = await Thought.deleteMany({});
      return reply.send({ success: true, message: `${result.deletedCount} pensamientos eliminados` });
    } catch (err: any) {
      return reply.status(500).send({ success: false, error: err.message });
    }
  });

  // ── POST /thoughts/bulk — upsert masivo (sync desde frontend) ─────────────
  app.post<{ Body: { thoughts: Record<string, any>[] } }>('/bulk', async (req, reply) => {
    try {
      const { thoughts } = req.body;
      if (!Array.isArray(thoughts)) {
        return reply.status(400).send({ success: false, error: 'Se esperaba un array en "thoughts"' });
      }

      const ops = thoughts.map((t) => ({
        updateOne: {
          filter: { frontendId: t.frontendId },
          update: { $set: t },
          upsert: true,
        },
      }));

      const result = await Thought.bulkWrite(ops);
      return reply.send({
        success: true,
        upserted: result.upsertedCount,
        modified: result.modifiedCount,
      });
    } catch (err: any) {
      return reply.status(500).send({ success: false, error: err.message });
    }
  });
}
