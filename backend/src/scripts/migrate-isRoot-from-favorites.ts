import 'dotenv/config';
import { connectDatabase } from '../services/database.js';
import { Thought } from '../models/Thought.js';

async function migrate() {
  try {
    await connectDatabase();
    
    console.log('🔄 Migrando: isRoot = true donde isFavorite = true...');

    // Actualizar todos los pensamientos favoritos para marcarlos como raíz
    const result = await Thought.updateMany(
      { isFavorite: true },
      { $set: { isRoot: true } }
    );

    console.log(`✅ ${result.modifiedCount} pensamientos marcados como raíz`);
    process.exit(0);
  } catch (err) {
    console.error('❌ Error en migración:', err);
    process.exit(1);
  }
}

migrate();
