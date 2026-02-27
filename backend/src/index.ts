import 'dotenv/config';
import Fastify from 'fastify';
import cors from '@fastify/cors';
import multipart from '@fastify/multipart';
import swagger from '@fastify/swagger';
import swaggerUi from '@fastify/swagger-ui';
import { fal } from '@fal-ai/client';
import { imageRoutes } from './routes/images';
import { authRoutes } from './routes/auth';
import { userRoutes } from './routes/users';
import { transcriptionRoutes } from './routes/transcription';
import { storyboardRoutes } from './routes/storyboards';
import { galleryRoutes } from './routes/gallery';
import { promptStyleRoutes } from './routes/promptStyles';
import { cinemaRoutes } from './routes/cinema';
import { connectDatabase } from './services/database';
import { authMiddleware } from './middleware/auth';

const FAL_KEY = process.env.FAL_KEY;
const PORT = Number(process.env.PORT) || 3001;

if (!FAL_KEY) {
  console.error('❌ Falta FAL_KEY en el archivo .env');
  process.exit(1);
}

// Configurar fal.ai con la API key
fal.config({ credentials: FAL_KEY });

async function main() {
  const app = Fastify({ logger: true, bodyLimit: 50 * 1024 * 1024 }); // 50MB

  // CORS
  await app.register(cors, {
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
  });

  // Multipart para upload de archivos
  await app.register(multipart, {
    limits: {
      fileSize: 50 * 1024 * 1024, // 50MB
    },
  });

  // Swagger / OpenAPI
  await app.register(swagger, {
    openapi: {
      info: {
        title: 'Mindverse API',
        description: 'Backend de Mindverse — gestión de pensamientos e imágenes IA',
        version: '1.0.0',
      },
      servers: [
        {
          url: '/mindverse/dev/api',
          description: 'Dev API (testing)',
        },
      ],
      tags: [
        { name: 'auth', description: 'Autenticación con Google OAuth' },
        { name: 'users', description: 'CRUD de perfiles de usuario' },
        { name: 'images', description: 'Generación de imágenes con IA (fal.ai)' },
        { name: 'gallery', description: 'Galería personal de imágenes de referencia' },
        { name: 'transcription', description: 'Transcripción de audio con Whisper' },
        { name: 'storyboards', description: 'CRUD de storyboards generados' },
        { name: 'prompt-styles', description: 'Tags de estilo para prompts de IA' },
        { name: 'cinema', description: 'Cinema Mode - Vista pública de storyboards' },
        { name: 'health', description: 'Estado del servicio' },
      ],
    },
  });

  await app.register(swaggerUi, {
    routePrefix: '/docs',
    uiConfig: { docExpansion: 'list', deepLinking: true },
  });

  // Auth middleware global (JWT) — excluye /auth, /health, /docs
  app.addHook('preHandler', authMiddleware);

  // Rutas de autenticación
  await app.register(authRoutes, { prefix: '/auth' });

  // Rutas de usuarios (CRUD perfil)
  await app.register(userRoutes, { prefix: '/users' });

  // Rutas de imágenes
  await app.register(imageRoutes, { prefix: '/images' });

  // Rutas de galería
  await app.register(galleryRoutes, { prefix: '/gallery' });

  // Rutas de transcripción (audio → texto)
  await app.register(transcriptionRoutes, { prefix: '/transcription' });

  // Rutas de storyboards
  await app.register(storyboardRoutes, { prefix: '/storyboards' });

  // Rutas de tags de estilo de prompt
  await app.register(promptStyleRoutes, { prefix: '/prompt-styles' });

  // Rutas de Cinema Mode (pública)
  await app.register(cinemaRoutes, { prefix: '/cinema' });

  // Health check
  app.get(
    '/health',
    {
      schema: {
        tags: ['health'],
        summary: 'Estado del servicio',
        response: {
          200: {
            type: 'object',
            properties: { status: { type: 'string' }, service: { type: 'string' } },
          },
        },
      },
    },
    async () => ({ status: 'ok', service: 'mindverse-backend' })
  );

  try {
    await connectDatabase();
    await app.listen({ port: PORT, host: '0.0.0.0' });
    console.log(`🚀 Backend corriendo en http://localhost:${PORT}`);
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
}

main();
