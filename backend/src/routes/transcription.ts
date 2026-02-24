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

  // POST /transcription/analyze - Generar storyboard con LLM
  app.post<{ Body: { text: string } }>('/analyze', {
    schema: {
      tags: ['transcription'],
      summary: 'Generar storyboard de 6-8 frames estilo cómic blanco y negro',
      body: {
        type: 'object',
        required: ['text'],
        properties: {
          text: { type: 'string', description: 'Historia o idea para convertir en storyboard' },
        },
      },
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            frames: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  frame: { type: 'number' },
                  scene: { type: 'string' },
                  visualDescription: { type: 'string' },
                  dialogue: { type: 'string' },
                },
              },
            },
            mermaid: { type: 'string' },
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

      // Generar storyboard con LLM
      const result = await analyzeThought(text);

      return reply.send({
        success: true,
        frames: result.frames,
        mermaid: result.mermaid,
        duration: result.duration,
      });
    } catch (err: any) {
      console.error('Error en análisis:', err);
      return reply.status(500).send({ success: false, error: err.message });
    }
  });

  // POST /transcription/refine-step - Refinar/expandir un paso específico
  app.post<{ Body: { step: string; actions: string[]; context?: string } }>('/refine-step', {
    schema: {
      tags: ['transcription'],
      summary: 'Refinar un paso del análisis para obtener más detalle',
      body: {
        type: 'object',
        required: ['step', 'actions'],
        properties: {
          step: { type: 'string', description: 'Descripción del paso a refinar' },
          actions: { type: 'array', items: { type: 'string' }, description: 'Acciones actuales del paso' },
          context: { type: 'string', description: 'Contexto adicional (opcional)' },
        },
      },
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            refinement: {
              type: 'object',
              properties: {
                explanation: { type: 'string' },
                substeps: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      substep: { type: 'string' },
                      details: { type: 'array', items: { type: 'string' } },
                    },
                  },
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

      const { step, actions, context } = req.body;
      if (!step?.trim()) {
        return reply.status(400).send({ success: false, error: 'El paso es requerido' });
      }

      // Importar función de refinamiento
      const { refineStep } = await import('../services/transcription');
      const result = await refineStep(step, actions, context);

      return reply.send({
        success: true,
        refinement: result.refinement,
        duration: result.duration,
      });
    } catch (err: any) {
      console.error('Error en refinamiento:', err);
      return reply.status(500).send({ success: false, error: err.message });
    }
  });

  // POST /transcription/generate-comic-page - Generar imagen de página de cómic completa
  app.post<{ Body: { frames: any[] } }>('/generate-comic-page', {
    schema: {
      tags: ['transcription'],
      summary: 'Generar imagen de página de cómic con todas las viñetas del storyboard',
      body: {
        type: 'object',
        required: ['frames'],
        properties: {
          frames: {
            type: 'array',
            description: 'Array de frames del storyboard',
            items: {
              type: 'object',
              properties: {
                frame: { type: 'number' },
                scene: { type: 'string' },
                visualDescription: { type: 'string' },
                dialogue: { type: 'string' },
              },
            },
          },
        },
      },
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            imageUrl: { type: 'string' },
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

      const { frames } = req.body;
      if (!frames || frames.length === 0) {
        return reply.status(400).send({ success: false, error: 'Frames son requeridos' });
      }

      // Importar función de generación de página de cómic
      const { generateComicPage } = await import('../services/transcription');
      const result = await generateComicPage(frames);

      return reply.send({
        success: true,
        imageUrl: result.imageUrl,
        duration: result.duration,
      });
    } catch (err: any) {
      console.error('Error generando página de cómic:', err);
      return reply.status(500).send({ success: false, error: err.message });
    }
  });

  // POST /transcription/generate-frame-image - Generar imagen de una viñeta individual
  app.post<{ Body: { frame: any } }>('/generate-frame-image', {
    schema: {
      tags: ['transcription'],
      summary: 'Generar imagen para una viñeta individual del storyboard',
      body: {
        type: 'object',
        required: ['frame'],
        properties: {
          frame: {
            type: 'object',
            description: 'Frame del storyboard para generar imagen',
            properties: {
              frame: { type: 'number' },
              scene: { type: 'string' },
              visualDescription: { type: 'string' },
              dialogue: { type: 'string' },
            },
          },
        },
      },
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            imageUrl: { type: 'string' },
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

      const { frame } = req.body;
      if (!frame) {
        return reply.status(400).send({ success: false, error: 'Frame es requerido' });
      }

      // Importar función de generación de frame individual
      const { generateFrameImage } = await import('../services/transcription');
      const result = await generateFrameImage(frame);

      return reply.send({
        success: true,
        imageUrl: result.imageUrl,
        duration: result.duration,
      });
    } catch (err: any) {
      console.error('Error generando imagen de frame:', err);
      return reply.status(500).send({ success: false, error: err.message });
    }
  });
}
