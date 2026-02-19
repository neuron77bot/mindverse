import { Schema, model } from 'mongoose';

const userSchema = new Schema({
  googleId:  { type: String, required: true, unique: true, index: true },
  name:      { type: String, required: true },
  email:     { type: String, required: true, unique: true },
  picture:   { type: String, default: null },
  // Campos de perfil extendido
  bio:       { type: String, default: '' },
  location:  { type: String, default: '' },
  lastLogin: { type: Date, default: Date.now },
}, {
  timestamps: true,
});

export const User = model('User', userSchema);
