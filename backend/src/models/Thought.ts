import { Schema, model } from 'mongoose';

const thoughtSchema = new Schema({
  // Identificador del frontend (uuid v4)
  frontendId: { type: String, required: true, unique: true, index: true },

  content:        { type: String, required: true },
  description:    { type: String, default: '' },
  category:       {
    type: String,
    enum: ['HEALTH','WORK','LOVE','FAMILY','FINANCES','PERSONAL_GROWTH','LEISURE','SPIRITUALITY','SOCIAL'],
    required: true,
  },
  temporalState:  { type: String, enum: ['PAST','PRESENT','FUTURE'], required: true },
  emotionalLevel: {
    type: String,
    enum: ['SHAME','GUILT','APATHY','GRIEF','FEAR','DESIRE','ANGER','PRIDE','COURAGE',
           'NEUTRALITY','WILLINGNESS','ACCEPTANCE','REASON','LOVE','JOY','PEACE','ENLIGHTENMENT'],
    required: true,
  },
  positionX: { type: Number, default: 0 },
  positionY: { type: Number, default: 0 },
  color:     { type: String, default: '#6366f1' },
  isRoot:    { type: Boolean, default: false },
  imageUrl:  { type: String, default: null },

  // Tags y favoritos
  tags:       { type: [String], default: [] },
  isFavorite: { type: Boolean, default: false },

  // Conexiones (ids frontendId de otros pensamientos)
  connections: {
    type: [{ source: String, target: String, connectionId: String }],
    default: [],
  },
}, {
  timestamps: true,
});

export const Thought = model('Thought', thoughtSchema);
