import mongoose, { Schema, Document } from 'mongoose';

export interface IFrame {
  frame: number;
  scene: string;
  visualDescription: string;
  dialogue?: string;
  imageUrl?: string;
  imagePrompt?: string;
  generatedAt?: Date;
}

export interface IStoryboard extends Document {
  userId: string;
  title: string;
  originalText: string;
  inputMode: 'voice' | 'text';
  frames: IFrame[];
  comicPageUrl?: string;
  comicPagePrompt?: string;
  mermaidDiagram?: string;
  createdAt: Date;
  updatedAt: Date;
}

const FrameSchema = new Schema<IFrame>(
  {
    frame: { type: Number, required: true },
    scene: { type: String, required: true },
    visualDescription: { type: String, required: true },
    dialogue: { type: String },
    imageUrl: { type: String },
    imagePrompt: { type: String },
    generatedAt: { type: Date },
  },
  { _id: false }
);

const StoryboardSchema = new Schema<IStoryboard>(
  {
    userId: { type: String, required: true, index: true },
    title: { type: String, required: true },
    originalText: { type: String, required: true },
    inputMode: { type: String, enum: ['voice', 'text'], required: true },
    frames: { type: [FrameSchema], required: true },
    comicPageUrl: { type: String },
    comicPagePrompt: { type: String },
    mermaidDiagram: { type: String },
  },
  {
    timestamps: true,
  }
);

export const Storyboard = mongoose.model<IStoryboard>('Storyboard', StoryboardSchema);
