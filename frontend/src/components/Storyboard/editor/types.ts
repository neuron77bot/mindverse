export type RecordingState = 'idle' | 'recording' | 'paused' | 'processing';
export type InputMode = 'voice' | 'text';
export type EditorMode = 'edit' | 'create';

export interface StoryboardFrame {
  frame: number;
  scene: string;
  visualDescription: string;
  dialogue?: string;
  imageUrl?: string;
  imagePrompt?: string;
  videoUrl?: string;
}

export interface LightboxImage {
  url: string;
  title: string;
}

export type ImageMode = 'text' | 'img2img' | 'url' | 'gallery' | 'frame';

export type EditorTabType = 'historia' | 'frames' | 'diagrama';
