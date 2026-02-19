import 'dotenv/config';
import Fastify from 'fastify';
import cors from '@fastify/cors';
import { fal } from '@fal-ai/client';
import { imageRoutes } from './routes/images';

const FAL_KEY = process.env.FAL_KEY;
const PORT    = Number(process.env.PORT) || 3001;

if (!FAL_KEY) {
  console.error('❌ Falta FAL_KEY en el archivo .env');
  process.exit(1);
}

// Configurar fal.ai con la API key
fal.config({ credentials: FAL_KEY });

async function main() {
  const app = Fastify({ logger: true });

  // CORS
  await app.register(cors, {
    origin: '*',
    methods: ['GET', 'POST'],
  });

  // Rutas de imágenes
  await app.register(imageRoutes, { prefix: '/images' });

  // Health check
  app.get('/health', async () => ({ status: 'ok', service: 'mindverse-backend' }));

  try {
    await app.listen({ port: PORT, host: '0.0.0.0' });
    console.log(`🚀 Backend corriendo en http://localhost:${PORT}`);
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
}

main();
