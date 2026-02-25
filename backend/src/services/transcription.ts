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

export interface StoryboardFrame {
  frame: number;
  scene: string;
  visualDescription: string;
  dialogue?: string;
}

export interface AnalysisResult {
  frames: StoryboardFrame[];
  mermaid: string;
  duration: number;
}

export interface StepRefinement {
  explanation: string;
  substeps: {
    substep: string;
    details: string[];
  }[];
}

export interface RefinementResult {
  refinement: StepRefinement;
  duration: number;
}

/**
 * Genera un diagrama Mermaid timeline a partir de los frames del storyboard
 */
function generateMermaidDiagram(frames: StoryboardFrame[]): string {
  const lines: string[] = ['flowchart LR'];
  lines.push('  Start([🎬 Inicio])');

  frames.forEach((frame, idx) => {
    const frameId = `Frame${frame.frame}`;
    const sceneLabel = frame.scene.replace(/"/g, '\\"').substring(0, 40);
    lines.push(`  ${frameId}["📷 Frame ${frame.frame}<br/>${sceneLabel}..."]`);

    // Conectar frames secuencialmente
    if (idx === 0) {
      lines.push(`  Start --> ${frameId}`);
    } else {
      lines.push(`  Frame${frames[idx - 1].frame} --> ${frameId}`);
    }

    // Aplicar estilos a los frames (escala de grises para storyboard B&N)
    const fillColor = idx % 2 === 0 ? '#e5e7eb' : '#d1d5db';
    const strokeColor = '#6b7280';
    lines.push(
      `  style ${frameId} fill:${fillColor},stroke:${strokeColor},stroke-width:3px,color:#000000`
    );
  });

  // Agregar nodo final
  lines.push('  End([🎬 Fin])');
  lines.push(`  Frame${frames[frames.length - 1].frame} --> End`);

  // Estilos para inicio y fin
  lines.push('  style Start fill:#fbbf24,stroke:#f59e0b,stroke-width:3px,color:#000000');
  lines.push('  style End fill:#10b981,stroke:#059669,stroke-width:3px,color:#000000');

  return lines.join('\n');
}

/**
 * Transcribe audio usando fal.ai Whisper
 */
export async function transcribeAudio(
  audioBuffer: Buffer,
  mimeType: string
): Promise<TranscriptionResult> {
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

  const systemPrompt = `Eres un guionista experto en crear storyboards para cómics en blanco y negro.
Tu tarea es transformar ideas, historias o conceptos en un storyboard visual de 6 a 8 escenas/viñetas.

Responde SIEMPRE en formato JSON válido con la siguiente estructura:
{
  "frames": [
    {
      "frame": 1,
      "scene": "Descripción breve de la escena",
      "visualDescription": "Descripción detallada de lo que se ve en la viñeta (composición, ángulos, elementos visuales). Estilo cómic blanco y negro.",
      "dialogue": "Diálogo o texto opcional de la viñeta"
    }
  ]
}

Características de tu storyboard:
- Genera exactamente 6 a 8 frames/viñetas
- Estilo cómic en blanco y negro (sin color, alto contraste)
- Cada frame debe tener descripción visual muy detallada y específica
- Piensa en composición, planos (close-up, wide shot, etc.), iluminación, sombras
- Crea una narrativa visual coherente y fluida
- El diálogo es opcional, solo cuando enriquece la escena
- Responde en español`;

  const userPrompt = `Crea un storyboard en blanco y negro basado en la siguiente historia o idea:

"${thoughtText}"

Responde únicamente con el JSON, sin texto adicional.`;

  try {
    const model = genAI.getGenerativeModel({
      model: 'gemini-2.5-flash',
      systemInstruction: systemPrompt,
    });

    const result = await model.generateContent(userPrompt);
    const response = result.response;
    const responseText = response.text();
    const duration = Date.now() - startTime;

    // Parsear respuesta JSON
    let frames: StoryboardFrame[] = [];
    try {
      // Limpiar markdown code blocks si existen
      let cleanedText = responseText.trim();
      if (cleanedText.startsWith('```json')) {
        cleanedText = cleanedText
          .replace(/```json\n?/g, '')
          .replace(/```$/g, '')
          .trim();
      } else if (cleanedText.startsWith('```')) {
        cleanedText = cleanedText
          .replace(/```\n?/g, '')
          .replace(/```$/g, '')
          .trim();
      }

      const jsonMatch = cleanedText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        frames = parsed.frames || [];
      } else {
        throw new Error('No se encontró JSON válido en la respuesta');
      }
    } catch (parseError) {
      console.error('Error parseando respuesta de Gemini:', parseError);
      console.error('Respuesta completa:', responseText);
      frames = [
        {
          frame: 1,
          scene: 'Error al generar storyboard',
          visualDescription: responseText || 'No se pudo generar el storyboard',
        },
      ];
    }

    const mermaid = generateMermaidDiagram(frames);
    return { frames, mermaid, duration };
  } catch (error: any) {
    throw new Error(`Error en análisis con Gemini: ${error.message}`);
  }
}

/**
 * Analiza un pensamiento con fal.ai LLM
 */
async function analyzeWithFal(thoughtText: string): Promise<AnalysisResult> {
  const startTime = Date.now();

  const systemPrompt = `Eres un guionista experto en crear storyboards para cómics en blanco y negro.
Tu tarea es transformar ideas, historias o conceptos en un storyboard visual de 6 a 8 escenas/viñetas.

Responde SIEMPRE en formato JSON válido con la siguiente estructura:
{
  "frames": [
    {
      "frame": 1,
      "scene": "Descripción breve de la escena",
      "visualDescription": "Descripción detallada de lo que se ve en la viñeta (composición, ángulos, elementos visuales). Estilo cómic blanco y negro.",
      "dialogue": "Diálogo o texto opcional de la viñeta"
    }
  ]
}

Características de tu storyboard:
- Genera exactamente 6 a 8 frames/viñetas
- Estilo cómic en blanco y negro (sin color, alto contraste)
- Cada frame debe tener descripción visual muy detallada y específica
- Piensa en composición, planos (close-up, wide shot, etc.), iluminación, sombras
- Crea una narrativa visual coherente y fluida
- El diálogo es opcional, solo cuando enriquece la escena
- Responde en español`;

  const userPrompt = `Crea un storyboard en blanco y negro basado en la siguiente historia o idea:

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

    let frames: StoryboardFrame[] = [];
    try {
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        frames = parsed.frames || [];
      } else {
        throw new Error('No se encontró JSON válido en la respuesta');
      }
    } catch (parseError) {
      console.error('Error parseando respuesta del LLM:', parseError);
      console.error('Respuesta completa:', responseText);
      frames = [
        {
          frame: 1,
          scene: 'Error al generar storyboard',
          visualDescription: responseText || 'No se pudo generar el storyboard',
        },
      ];
    }

    const mermaid = generateMermaidDiagram(frames);
    return { frames, mermaid, duration };
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

/**
 * Refina un paso específico para obtener más detalle y sub-pasos
 */
async function refineStepWithGemini(
  step: string,
  actions: string[],
  context?: string
): Promise<RefinementResult> {
  if (!genAI) {
    throw new Error('Gemini no está configurado. Falta GEMINI_API_KEY.');
  }

  const startTime = Date.now();

  const systemPrompt = `Eres un asistente experto en planificación y desglose de tareas complejas.
Tu trabajo es tomar un paso de un plan y desglosarlo en sub-pasos más específicos y detallados.

Responde SIEMPRE en formato JSON válido con la siguiente estructura:
{
  "explanation": "Por qué este paso requiere estos sub-pasos",
  "substeps": [
    {
      "substep": "Descripción del sub-paso",
      "details": ["Detalle específico 1", "Detalle específico 2"]
    }
  ]
}

Características de tu refinamiento:
- Desglosa el paso en 3-5 sub-pasos concretos
- Cada sub-paso debe tener 2-4 detalles específicos
- Mantiene la coherencia con las acciones originales
- Agrega información que faltaba en el análisis inicial
- Usa lenguaje claro y directo
- Responde en español`;

  const actionsText =
    actions.length > 0
      ? `\nAcciones actuales:\n${actions.map((a, i) => `${i + 1}. ${a}`).join('\n')}`
      : '';
  const contextText = context ? `\n\nContexto adicional: ${context}` : '';

  const userPrompt = `Refina y desglosa el siguiente paso en sub-pasos más detallados:

"${step}"${actionsText}${contextText}

Responde únicamente con el JSON, sin texto adicional.`;

  try {
    const model = genAI.getGenerativeModel({
      model: 'gemini-2.5-flash',
      systemInstruction: systemPrompt,
    });

    const result = await model.generateContent(userPrompt);
    const response = result.response;
    const responseText = response.text();
    const duration = Date.now() - startTime;

    // Parsear respuesta JSON
    let refinement: StepRefinement = {
      explanation: '',
      substeps: [],
    };

    try {
      let cleanedText = responseText.trim();
      if (cleanedText.startsWith('```json')) {
        cleanedText = cleanedText
          .replace(/```json\n?/g, '')
          .replace(/```$/g, '')
          .trim();
      } else if (cleanedText.startsWith('```')) {
        cleanedText = cleanedText
          .replace(/```\n?/g, '')
          .replace(/```$/g, '')
          .trim();
      }

      const jsonMatch = cleanedText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        refinement = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('No se encontró JSON válido en la respuesta');
      }
    } catch (parseError) {
      console.error('Error parseando respuesta de Gemini:', parseError);
      console.error('Respuesta completa:', responseText);
      refinement = {
        explanation: 'No se pudo refinar el paso automáticamente',
        substeps: [
          {
            substep: step,
            details: actions.length > 0 ? actions : [responseText || 'Sin detalles disponibles'],
          },
        ],
      };
    }

    return { refinement, duration };
  } catch (error: any) {
    throw new Error(`Error en refinamiento con Gemini: ${error.message}`);
  }
}

async function refineStepWithFal(
  step: string,
  actions: string[],
  context?: string
): Promise<RefinementResult> {
  const startTime = Date.now();

  const systemPrompt = `Eres un asistente experto en planificación y desglose de tareas complejas.
Tu trabajo es tomar un paso de un plan y desglosarlo en sub-pasos más específicos y detallados.

Responde SIEMPRE en formato JSON válido con la siguiente estructura:
{
  "explanation": "Por qué este paso requiere estos sub-pasos",
  "substeps": [
    {
      "substep": "Descripción del sub-paso",
      "details": ["Detalle específico 1", "Detalle específico 2"]
    }
  ]
}`;

  const actionsText =
    actions.length > 0
      ? `\nAcciones actuales:\n${actions.map((a, i) => `${i + 1}. ${a}`).join('\n')}`
      : '';
  const contextText = context ? `\n\nContexto adicional: ${context}` : '';

  const userPrompt = `Refina y desglosa el siguiente paso:

"${step}"${actionsText}${contextText}

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
      responseText = JSON.stringify(result.data);
    }

    const duration = Date.now() - startTime;

    let refinement: StepRefinement = {
      explanation: '',
      substeps: [],
    };

    try {
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        refinement = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('No se encontró JSON válido');
      }
    } catch (parseError) {
      console.error('Error parseando respuesta:', parseError);
      refinement = {
        explanation: 'No se pudo refinar el paso',
        substeps: [
          {
            substep: step,
            details: actions.length > 0 ? actions : [responseText],
          },
        ],
      };
    }

    return { refinement, duration };
  } catch (error: any) {
    throw new Error(`Error en refinamiento con fal.ai: ${error.message}`);
  }
}

/**
 * Refina un paso específico del análisis
 * Usa el provider configurado (Gemini por defecto, fal.ai como alternativa)
 */
export async function refineStep(
  step: string,
  actions: string[],
  context?: string
): Promise<RefinementResult> {
  console.log(`[LLM] Refinando paso con provider: ${LLM_PROVIDER}`);

  if (LLM_PROVIDER === 'gemini') {
    return refineStepWithGemini(step, actions, context);
  } else {
    return refineStepWithFal(step, actions, context);
  }
}

/**
 * Genera una imagen de página de cómic completa con todas las viñetas del storyboard
 */
export async function generateComicPage(
  frames: StoryboardFrame[]
): Promise<{ imageUrl: string; duration: number }> {
  const startTime = Date.now();

  // Construir prompt detallado para la página de cómic
  const frameDescriptions = frames
    .map((frame) => {
      let desc = `Panel ${frame.frame}: ${frame.visualDescription}`;
      if (frame.dialogue) {
        desc += ` Texto/diálogo: "${frame.dialogue}"`;
      }
      return desc;
    })
    .join('\n\n');

  const prompt = `Create a single black and white comic book page layout with ${frames.length} panels arranged in a traditional comic grid format.

Style: 
- High contrast black and white ink drawing
- Clean panel borders
- Professional comic book page composition
- Each panel clearly separated and numbered

Layout:
- ${frames.length} total panels on one page
- Traditional comic grid layout (2-3 columns)
- Panels flow left to right, top to bottom

Panel contents:
${frameDescriptions}

Important:
- All panels must be on ONE single page
- Black and white only (no color, no grayscale)
- Comic book ink style
- Clear panel separation
- Professional comic page layout`;

  try {
    console.log('[FAL] Generando página de cómic con nano-banana...');
    console.log(`[FAL] Número de panels: ${frames.length}`);

    const result = await fal.subscribe('fal-ai/nano-banana', {
      input: {
        prompt,
        num_images: 1,
        aspect_ratio: '2:3', // Formato vertical para página de cómic
        output_format: 'png',
      },
    });

    const imageUrl = (result.data as any)?.images?.[0]?.url || '';
    const duration = Date.now() - startTime;

    console.log(`[FAL] Imagen generada: ${imageUrl}`);
    console.log(`[FAL] Duración: ${duration}ms`);

    return { imageUrl, duration };
  } catch (error: any) {
    throw new Error(`Error generando página de cómic: ${error.message}`);
  }
}

/**
 * Genera una imagen individual para una viñeta del storyboard
 */
export async function generateFrameImage(
  frame: StoryboardFrame
): Promise<{ imageUrl: string; duration: number }> {
  const startTime = Date.now();

  // Construir prompt detallado para la viñeta individual
  let prompt = `Black and white comic book panel, high contrast ink drawing style.

Panel ${frame.frame}: ${frame.visualDescription}`;

  if (frame.dialogue) {
    prompt += `\n\nDialogue/text: "${frame.dialogue}"`;
  }

  prompt += `\n\nStyle: Professional comic book art, black and white only, clean ink lines, dynamic composition.`;

  try {
    console.log(`[FAL] Generando imagen para frame ${frame.frame} con nano-banana...`);

    const result = await fal.subscribe('fal-ai/nano-banana', {
      input: {
        prompt,
        num_images: 1,
        aspect_ratio: '16:9', // Formato horizontal para viñeta individual
        output_format: 'png',
      },
    });

    const imageUrl = (result.data as any)?.images?.[0]?.url || '';
    const duration = Date.now() - startTime;

    console.log(`[FAL] Imagen frame ${frame.frame} generada: ${imageUrl}`);
    console.log(`[FAL] Duración: ${duration}ms`);

    return { imageUrl, duration };
  } catch (error: any) {
    throw new Error(`Error generando imagen de frame ${frame.frame}: ${error.message}`);
  }
}
