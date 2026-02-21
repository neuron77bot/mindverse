import { fal } from '@fal-ai/client';

const WHISPER_MODEL = 'fal-ai/whisper';
const LLM_MODEL = 'fal-ai/meta-llama/llama-3.3-70b-instruct'; // Modelo de chat para análisis

export interface TranscriptionResult {
  text: string;
  duration: number;
}

export interface ThoughtStep {
  step: string;
  actions: string[];
}

export interface AnalysisResult {
  steps: ThoughtStep[];
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

/**
 * Analiza un pensamiento transcrito y devuelve pasos y acciones
 */
export async function analyzeThought(thoughtText: string): Promise<AnalysisResult> {
  const startTime = Date.now();

  const systemPrompt = `Eres un asistente experto en análisis de objetivos y planificación. 
Tu tarea es analizar pensamientos o ideas y descomponerlos en pasos concretos y accionables.

Responde SIEMPRE en formato JSON válido con la siguiente estructura:
{
  "steps": [
    {
      "step": "Descripción del paso",
      "actions": ["Acción específica 1", "Acción específica 2"]
    }
  ]
}

Características de tu análisis:
- Identifica el objetivo principal del pensamiento
- Descompone en pasos lógicos y secuenciales
- Cada paso debe tener acciones concretas y medibles
- Usa lenguaje claro y directo
- Prioriza pasos por orden de ejecución
- Responde en español`;

  const userPrompt = `Analiza el siguiente pensamiento y devuelve los pasos necesarios para cumplir con el objetivo, incluyendo acciones específicas:

"${thoughtText}"

Responde en formato JSON.`;

  try {
    const result = await fal.subscribe(LLM_MODEL, {
      input: {
        prompt: `${systemPrompt}\n\n${userPrompt}`,
        max_tokens: 2000,
        temperature: 0.7,
      },
    });

    // La respuesta puede estar en diferentes formatos dependiendo del modelo
    let responseText = '';
    if ((result.data as any)?.output) {
      responseText = (result.data as any).output;
    } else if ((result.data as any)?.text) {
      responseText = (result.data as any).text;
    } else if (typeof result.data === 'string') {
      responseText = result.data;
    } else {
      console.error('Formato de respuesta desconocido:', result.data);
      responseText = JSON.stringify(result.data);
    }

    const duration = Date.now() - startTime;

    // Parsear respuesta JSON
    let steps: ThoughtStep[] = [];
    try {
      // Intentar extraer JSON del texto (por si viene con markdown o texto adicional)
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        steps = parsed.steps || [];
      } else {
        throw new Error('No se encontró JSON válido en la respuesta');
      }
    } catch (parseError) {
      console.error('Error parseando respuesta del LLM:', parseError);
      console.error('Respuesta completa:', responseText);
      // Fallback: crear un paso genérico
      steps = [{
        step: 'Análisis del pensamiento',
        actions: [responseText || 'No se pudo analizar el pensamiento'],
      }];
    }

    return {
      steps,
      duration,
    };
  } catch (error: any) {
    throw new Error(`Error en análisis: ${error.message}`);
  }
}
