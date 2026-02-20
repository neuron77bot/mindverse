import 'dotenv/config';
import { connectDatabase } from '../services/database.js';
import { Thought } from '../models/Thought.js';
import { User } from '../models/User.js';

async function migrate() {
  try {
    await connectDatabase();
    
    // Buscar el primer usuario (debería ser el único actualmente)
    const user = await User.findOne();
    
    if (!user) {
      console.error('❌ No hay usuarios en la base de datos');
      process.exit(1);
    }

    console.log(`✅ Usuario encontrado: ${user.email} (${user.googleId})`);

    // Actualizar todos los thoughts que no tienen userId
    const result = await Thought.updateMany(
      { userId: { $exists: false } },
      { $set: { userId: user.googleId } }
    );

    console.log(`✅ ${result.modifiedCount} pensamientos actualizados con userId`);
    process.exit(0);
  } catch (err) {
    console.error('❌ Error en migración:', err);
    process.exit(1);
  }
}

migrate();
