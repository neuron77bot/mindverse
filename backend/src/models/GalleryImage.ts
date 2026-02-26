import { Schema, model } from 'mongoose';

const galleryImageSchema = new Schema(
  {
    userId: { type: String, required: true, index: true },
    imageUrl: { type: String, required: true },
    tag: { type: String, required: true, index: true },
    filename: { type: String },
  },
  {
    timestamps: true,
  }
);

// Índice compuesto para búsquedas eficientes por usuario y tag
galleryImageSchema.index({ userId: 1, tag: 1 });

export const GalleryImage = model('GalleryImage', galleryImageSchema);
