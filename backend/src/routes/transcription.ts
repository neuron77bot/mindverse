import type { FastifyInstance } from 'fastify';
import { transcribeAudio, analyzeThought } from '../services/transcription';

const errorShape = {
  type: 'object',
  properties: { success: { type: 'boolean' }, error: { type: 'string' } },
};

export async function transcriptionRoutes(app: FastifyInstance) {
  // POST /transcription - Transcribir audio con Whisper (fal.ai)
  app.post('/', {
    schema: {
      tags: ['transcription'],
      summary: 'Transcribir audio usando Whisper de fal.ai',
      consumes: ['multipart/form-data'],
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            text: { type: 'string' },
            duration: { type: 'number' },
          },
        },
        400: errorShape,
        401: errorShape,
        500: errorShape,
      },
    },
  }, async (req, reply) => {
    try {
      const userId = req.jwtUser?.sub;
      if (!userId) return reply.status(401).send({ success: false, error: 'No autorizado' });

      // Recibir archivo de audio
      const data = await req.file();
      if (!data) {
        return reply.status(400).send({ success: false, error: 'No se recibió archivo de audio' });
      }

      const audioBuffer = await data.toBuffer();
      const mimeType = data.mimetype || 'audio/ogg';

      // Transcribir audio usando fal.ai
      const result = await transcribeAudio(audioBuffer, mimeType);

      return reply.send({
        success: true,
        text: result.text,
        duration: result.duration,
      });
    } catch (err: any) {
      console.error('Error en transcription:', err);
      return reply.status(500).send({ success: false, error: err.message });
    }
  });

  // POST /transcription/analyze - Analizar pensamiento con LLM
  app.post<{ Body: { text: string } }>('/analyze', {
    schema: {
      tags: ['transcription'],
      summary: 'Analizar pensamiento transcrito con LLM para obtener pasos y acciones',
      body: {
        type: 'object',
        required: ['text'],
        properties: {
          text: { type: 'string', description: 'Texto del pensamiento a analizar' },
        },
      },
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            steps: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  step: { type: 'string' },
                  actions: { type: 'array', items: { type: 'string' } },
                },
              },
            },
            duration: { type: 'number' },
          },
        },
        400: errorShape,
        401: errorShape,
        500: errorShape,
      },
    },
  }, async (req, reply) => {
    try {
      const userId = req.jwtUser?.sub;
      if (!userId) return reply.status(401).send({ success: false, error: 'No autorizado' });

      const { text } = req.body;
      if (!text?.trim()) {
        return reply.status(400).send({ success: false, error: 'El texto es requerido' });
      }

      // Analizar pensamiento con LLM
      const result = await analyzeThought(text);

      return reply.send({
        success: true,
        steps: result.steps,
        duration: result.duration,
      });
    } catch (err: any) {
      console.error('Error en análisis:', err);
      return reply.status(500).send({ success: false, error: err.message });
    }
  });
}
