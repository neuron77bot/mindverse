import { fal } from '@fal-ai/client';
import { GoogleGenerativeAI } from '@google/generative-ai';

const WHISPER_MODEL = 'fal-ai/whisper';
const LLM_MODEL = 'fal-ai/meta-llama/llama-3.3-70b-instruct';

const LLM_PROVIDER = process.env.LLM_PROVIDER || 'gemini'; // "gemini" | "fal"
const GEMINI_API_KEY = process.env.GEMINI_API_KEY || '';

// Inicializar cliente de Gemini si está configurado
let genAI: GoogleGenerativeAI | null = null;
if (LLM_PROVIDER === 'gemini' && GEMINI_API_KEY) {
  genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
}

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
 * Analiza un pensamiento con Gemini 2.5 Flash
 */
async function analyzeWithGemini(thoughtText: string): Promise<AnalysisResult> {
  if (!genAI) {
    throw new Error('Gemini no está configurado. Falta GEMINI_API_KEY.');
  }

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

Responde únicamente con el JSON, sin texto adicional.`;

  try {
    const model = genAI.getGenerativeModel({ 
      model: 'gemini-2.0-flash-exp',
      systemInstruction: systemPrompt,
    });

    const result = await model.generateContent(userPrompt);
    const response = result.response;
    const responseText = response.text();
    const duration = Date.now() - startTime;

    // Parsear respuesta JSON
    let steps: ThoughtStep[] = [];
    try {
      // Limpiar markdown code blocks si existen
      let cleanedText = responseText.trim();
      if (cleanedText.startsWith('```json')) {
        cleanedText = cleanedText.replace(/```json\n?/g, '').replace(/```$/g, '').trim();
      } else if (cleanedText.startsWith('```')) {
        cleanedText = cleanedText.replace(/```\n?/g, '').replace(/```$/g, '').trim();
      }

      const jsonMatch = cleanedText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        steps = parsed.steps || [];
      } else {
        throw new Error('No se encontró JSON válido en la respuesta');
      }
    } catch (parseError) {
      console.error('Error parseando respuesta de Gemini:', parseError);
      console.error('Respuesta completa:', responseText);
      steps = [{
        step: 'Análisis del pensamiento',
        actions: [responseText || 'No se pudo analizar el pensamiento'],
      }];
    }

    return { steps, duration };
  } catch (error: any) {
    throw new Error(`Error en análisis con Gemini: ${error.message}`);
  }
}

/**
 * Analiza un pensamiento con fal.ai LLM
 */
async function analyzeWithFal(thoughtText: string): Promise<AnalysisResult> {
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

    let steps: ThoughtStep[] = [];
    try {
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
      steps = [{
        step: 'Análisis del pensamiento',
        actions: [responseText || 'No se pudo analizar el pensamiento'],
      }];
    }

    return { steps, duration };
  } catch (error: any) {
    throw new Error(`Error en análisis con fal.ai: ${error.message}`);
  }
}

/**
 * Analiza un pensamiento transcrito y devuelve pasos y acciones
 * Usa el provider configurado (Gemini por defecto, fal.ai como alternativa)
 */
export async function analyzeThought(thoughtText: string): Promise<AnalysisResult> {
  console.log(`[LLM] Analizando con provider: ${LLM_PROVIDER}`);
  
  if (LLM_PROVIDER === 'gemini') {
    return analyzeWithGemini(thoughtText);
  } else {
    return analyzeWithFal(thoughtText);
  }
}
