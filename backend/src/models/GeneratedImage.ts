import { Schema, model } from 'mongoose';

const generatedImageSchema = new Schema(
  {
    nodeId: { type: String, required: true, index: true },
    nodeContent: { type: String, required: true },
    nodeCategory: { type: String },
    nodeTemporalState: { type: String },
    nodeEmotionalLevel: { type: String },

    prompt: { type: String, required: true },
    mode: { type: String, enum: ['text-to-image', 'image-to-image'], required: true },
    model: { type: String, required: true },
    imageUrl: { type: String, required: true },
    sourceImages: { type: [String], default: [] },
  },
  {
    timestamps: true,
  }
);

export const GeneratedImage = model('GeneratedImage', generatedImageSchema);
