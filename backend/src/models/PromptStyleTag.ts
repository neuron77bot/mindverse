import mongoose, { Schema, Document } from 'mongoose';

export interface IPromptStyleTag extends Document {
  userId: string;
  name: string;
  description?: string;
  promptText: string;
  createdAt: Date;
  updatedAt: Date;
}

const PromptStyleTagSchema = new Schema<IPromptStyleTag>(
  {
    userId: { type: String, required: true, index: true },
    name: { type: String, required: true },
    description: { type: String },
    promptText: { type: String, required: true },
  },
  {
    timestamps: true,
  }
);

// Index compuesto para búsquedas eficientes
PromptStyleTagSchema.index({ userId: 1, name: 1 });

export const PromptStyleTag = mongoose.model<IPromptStyleTag>(
  'PromptStyleTag',
  PromptStyleTagSchema
);
