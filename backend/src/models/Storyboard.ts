import mongoose, { Schema, Document } from 'mongoose';

export interface IFrame {
  frame: number;
  scene: string;
  visualDescription: string;
  dialogue?: string;
  imageUrl?: string;
  imagePrompt?: string;
  imageAspectRatio?: string; // '16:9', '9:16', '1:1', etc.
  videoUrl?: string;
  movementPrompt?: string;
  videoAspectRatio?: string; // aspect ratio del video generado
  generatedAt?: Date;
}

export interface IStoryboard extends Document {
  userId: string;
  title: string;
  description?: string;
  genre?: string;
  originalText: string;
  inputMode: 'voice' | 'text';
  frames: IFrame[];
  mermaidDiagram?: string;
  allowCinema: boolean;
  compiledVideoUrl?: string;
  musicYoutubeUrl?: string;
  musicStartTime?: number;
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
    imageAspectRatio: { type: String },
    videoUrl: { type: String },
    movementPrompt: { type: String },
    videoAspectRatio: { type: String },
    generatedAt: { type: Date },
  },
  { _id: false }
);

const StoryboardSchema = new Schema<IStoryboard>(
  {
    userId: { type: String, required: true, index: true },
    title: { type: String, required: true },
    description: { type: String },
    genre: { type: String },
    originalText: { type: String, required: true },
    inputMode: { type: String, enum: ['voice', 'text'], required: true },
    frames: { type: [FrameSchema], required: true },
    mermaidDiagram: { type: String },
    allowCinema: { type: Boolean, default: false },
    compiledVideoUrl: { type: String },
    musicYoutubeUrl: { type: String },
    musicStartTime: { type: Number, default: 0 },
  },
  {
    timestamps: true,
  }
);

export const Storyboard = mongoose.model<IStoryboard>('Storyboard', StoryboardSchema);
