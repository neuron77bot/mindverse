// Script para eliminar storyboards inválidos (sin frames o frames vacío)
import 'dotenv/config';
import { connectDatabase } from '../services/database';
import { Storyboard } from '../models/Storyboard';

async function cleanInvalidStoryboards() {
  try {
    await connectDatabase();
    console.log('✅ Conectado a MongoDB');

    // Buscar storyboards sin frames o con frames vacío
    const invalidStoryboards = await Storyboard.find({
      $or: [{ frames: { $exists: false } }, { frames: { $size: 0 } }, { frames: null }],
    });

    console.log(`📊 Encontrados ${invalidStoryboards.length} storyboards inválidos`);

    if (invalidStoryboards.length > 0) {
      // Mostrar los inválidos
      invalidStoryboards.forEach((sb) => {
        console.log(`  - ID: ${sb._id}, Título: ${sb.title}, Frames: ${sb.frames?.length || 0}`);
      });

      // Eliminar
      const result = await Storyboard.deleteMany({
        $or: [{ frames: { $exists: false } }, { frames: { $size: 0 } }, { frames: null }],
      });

      console.log(`🗑️  Eliminados ${result.deletedCount} storyboards inválidos`);
    } else {
      console.log('✅ No hay storyboards inválidos');
    }

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

cleanInvalidStoryboards();
