import type { FastifyInstance } from 'fastify';
import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs/promises';
import path from 'path';
import crypto from 'crypto';

const execAsync = promisify(exec);

const errorShape = {
  type: 'object',
  properties: { success: { type: 'boolean' }, error: { type: 'string' } },
};

export async function transcriptionRoutes(app: FastifyInstance) {
  // POST /transcription - Transcribir audio con whisper local
  app.post('/', {
    schema: {
      tags: ['transcription'],
      summary: 'Transcribir audio usando whisper local',
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

      const startTime = Date.now();
      
      // Generar nombre de archivo temporal
      const tempId = crypto.randomBytes(8).toString('hex');
      const tempPath = `/tmp/mindverse-audio-${tempId}.ogg`;
      
      // Guardar archivo temporal
      await fs.writeFile(tempPath, await data.toBuffer());

      try {
        // Ejecutar transcripción con whisper local
        const { stdout, stderr } = await execAsync(`/usr/local/bin/transcribe-audio.sh "${tempPath}"`);
        
        if (stderr && !stdout) {
          console.error('Whisper stderr:', stderr);
          return reply.status(500).send({ success: false, error: 'Error en transcripción' });
        }

        const text = stdout.trim();
        const duration = Date.now() - startTime;

        return reply.send({
          success: true,
          text,
          duration,
        });
      } finally {
        // Limpiar archivo temporal
        await fs.unlink(tempPath).catch(() => {});
      }
    } catch (err: any) {
      console.error('Error en transcription:', err);
      return reply.status(500).send({ success: false, error: err.message });
    }
  });
}
