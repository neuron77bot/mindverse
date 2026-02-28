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

export interface IDefaultConfig {
  galleryTags?: string[];
  styleTagIds?: string[];
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
  defaultConfig?: IDefaultConfig;
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

const DefaultConfigSchema = new Schema<IDefaultConfig>(
  {
    galleryTags: { type: [String] },
    styleTagIds: { type: [String] },
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
    defaultConfig: { type: DefaultConfigSchema },
  },
  {
    timestamps: true,
  }
);

export const Storyboard = mongoose.model<IStoryboard>('Storyboard', StoryboardSchema);
