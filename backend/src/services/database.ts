import mongoose from 'mongoose';

const MONGO_URI = process.env.MONGO_URI || 'mongodb://mindverse:mindverse@localhost:27017/mindverse?authSource=admin';

export async function connectDatabase(): Promise<typeof mongoose> {
  const conn = await mongoose.connect(MONGO_URI);
  console.log(`✅ MongoDB conectado: ${conn.connection.host}:${conn.connection.port}/${conn.connection.name}`);
  return conn;
}

export { mongoose };
