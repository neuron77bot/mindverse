import 'dotenv/config';
import { randomUUID } from 'crypto';
import { connectDatabase } from '../services/database';
import { User } from '../models/User';

async function migrateCinemaToken() {
  try {
    await connectDatabase();
    console.log('🔌 Conectado a MongoDB');

    // Find users without cinemaToken
    const usersWithoutToken = await User.find({
      $or: [{ cinemaToken: { $exists: false } }, { cinemaToken: null }, { cinemaToken: '' }],
    });

    console.log(`📊 Usuarios sin cinemaToken: ${usersWithoutToken.length}`);

    if (usersWithoutToken.length === 0) {
      console.log('✅ Todos los usuarios ya tienen cinemaToken');
      process.exit(0);
    }

    // Generate token for each user
    for (const user of usersWithoutToken) {
      const token = randomUUID();
      await User.updateOne({ _id: user._id }, { $set: { cinemaToken: token } });
      console.log(`✓ Usuario ${user.email} → Token generado: ${token}`);
    }

    console.log('✅ Migración completada exitosamente');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error en migración:', error);
    process.exit(1);
  }
}

migrateCinemaToken();
