import 'dotenv/config';
import Fastify from 'fastify';
import cors from '@fastify/cors';
import swagger from '@fastify/swagger';
import swaggerUi from '@fastify/swagger-ui';
import { fal } from '@fal-ai/client';
import { imageRoutes } from './routes/images';
import { thoughtRoutes } from './routes/thoughts';
import { authRoutes } from './routes/auth';
import { connectDatabase } from './services/database';

const FAL_KEY = process.env.FAL_KEY;
const PORT    = Number(process.env.PORT) || 3001;

if (!FAL_KEY) {
  console.error('❌ Falta FAL_KEY en el archivo .env');
  process.exit(1);
}

// Configurar fal.ai con la API key
fal.config({ credentials: FAL_KEY });

async function main() {
  const app = Fastify({ logger: true, bodyLimit: 20 * 1024 * 1024 }); // 20MB

  // CORS
  await app.register(cors, {
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
  });

  // Swagger / OpenAPI
  await app.register(swagger, {
    openapi: {
      info: {
        title: 'Mindverse API',
        description: 'Backend de Mindverse — gestión de pensamientos e imágenes IA',
        version: '1.0.0',
      },
      tags: [
        { name: 'auth',     description: 'Autenticación con Google OAuth' },
        { name: 'thoughts', description: 'CRUD de pensamientos' },
        { name: 'images',   description: 'Generación de imágenes con IA (fal.ai)' },
        { name: 'health',   description: 'Estado del servicio' },
      ],
    },
  });
  await app.register(swaggerUi, {
    routePrefix: '/docs',
    uiConfig: { docExpansion: 'list', deepLinking: true },
  });

  // Rutas de autenticación
  await app.register(authRoutes, { prefix: '/auth' });

  // Rutas de imágenes
  await app.register(imageRoutes, { prefix: '/images' });

  // Rutas de pensamientos (CRUD)
  await app.register(thoughtRoutes, { prefix: '/thoughts' });

  // Health check
  app.get('/health', {
    schema: {
      tags: ['health'],
      summary: 'Estado del servicio',
      response: { 200: { type: 'object', properties: { status: { type: 'string' }, service: { type: 'string' } } } },
    },
  }, async () => ({ status: 'ok', service: 'mindverse-backend' }));

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
