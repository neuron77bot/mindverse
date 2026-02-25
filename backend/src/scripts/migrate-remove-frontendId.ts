import 'dotenv/config';
import { connectDatabase } from '../services/database.js';
import { Thought } from '../models/Thought.js';

async function migrate() {
  try {
    await connectDatabase();

    console.log('🔄 Eliminando campo frontendId...');

    // Eliminar campo frontendId de todos los documentos
    const result = await Thought.updateMany(
      { frontendId: { $exists: true } },
      { $unset: { frontendId: '' } }
    );

    console.log(`✅ ${result.modifiedCount} documentos actualizados`);
    process.exit(0);
  } catch (err) {
    console.error('❌ Error en migración:', err);
    process.exit(1);
  }
}

migrate();
