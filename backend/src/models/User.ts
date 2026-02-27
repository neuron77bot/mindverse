import { Schema, model } from 'mongoose';
import { randomUUID } from 'crypto';

const userSchema = new Schema(
  {
    googleId: { type: String, required: true, unique: true, index: true },
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    picture: { type: String, default: null },
    // Campos de perfil extendido
    bio: { type: String, default: '' },
    location: { type: String, default: '' },
    lastLogin: { type: Date, default: Date.now },
    // Cinema token único para compartir vista pública
    cinemaToken: {
      type: String,
      required: true,
      unique: true,
      index: true,
      default: () => randomUUID(),
    },
  },
  {
    timestamps: true,
  }
);

export const User = model('User', userSchema);
