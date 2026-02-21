import { fal } from '@fal-ai/client';

const WHISPER_MODEL = 'fal-ai/whisper';

export interface TranscriptionResult {
  text: string;
  duration: number;
}

/**
 * Transcribe audio usando fal.ai Whisper
 */
export async function transcribeAudio(audioBuffer: Buffer, mimeType: string): Promise<TranscriptionResult> {
  const startTime = Date.now();

  try {
    // Subir audio a fal.ai storage
    const blob = new Blob([new Uint8Array(audioBuffer)], { type: mimeType });
    const audioUrl = await fal.storage.upload(blob);

    // Llamar al modelo Whisper
    const result = await fal.subscribe(WHISPER_MODEL, {
      input: {
        audio_url: audioUrl,
        task: 'transcribe',
        language: 'es', // español
        chunk_level: 'segment',
      },
    });

    const text = (result.data as any)?.text || '';
    const duration = Date.now() - startTime;

    return {
      text: text.trim(),
      duration,
    };
  } catch (error: any) {
    throw new Error(`Error en transcripción: ${error.message}`);
  }
}
