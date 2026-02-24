import { useState, useRef } from 'react';
import { authHeaders, authHeadersOnly } from '../../services/authHeaders';
import MermaidDiagram from '../UI/MermaidDiagram';

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:3001';

type RecordingState = 'idle' | 'recording' | 'paused' | 'processing';
type InputMode = 'voice' | 'text';

interface StoryboardFrame {
  frame: number;
  scene: string;
  visualDescription: string;
  dialogue?: string;
}

export default function RecordingView() {
  const [inputMode, setInputMode] = useState<InputMode>('voice');
  const [recordingState, setRecordingState] = useState<RecordingState>('idle');
  const [transcription, setTranscription] = useState<string>('');
  const [textInput, setTextInput] = useState<string>('');
  const [duration, setDuration] = useState<number>(0);
  const [error, setError] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [storyboard, setStoryboard] = useState<StoryboardFrame[] | null>(null);
  const [mermaidDiagram, setMermaidDiagram] = useState<string | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<number>(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const startRecording = async () => {
    try {
      setError(null);
      
      // Verificar soporte para MediaDevices
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Tu navegador no soporta grabación de audio. Necesitas usar HTTPS o un navegador compatible.');
      }
      
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus',
      });
      
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];
      timerRef.current = 0;
      setDuration(0);

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        stream.getTracks().forEach((track) => track.stop());
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
          intervalRef.current = null;
        }
        
        // Enviar audio al backend
        await processRecording();
      };

      mediaRecorder.start();
      setRecordingState('recording');

      // Timer
      intervalRef.current = setInterval(() => {
        timerRef.current += 1;
        setDuration(timerRef.current);
      }, 1000);
    } catch (err: any) {
      console.error('Error al iniciar grabación:', err);
      setError('Error al acceder al micrófono: ' + err.message);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
      setRecordingState('processing');
    }
  };

  const pauseRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.pause();
      setRecordingState('paused');
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }
  };

  const resumeRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'paused') {
      mediaRecorderRef.current.resume();
      setRecordingState('recording');
      intervalRef.current = setInterval(() => {
        timerRef.current += 1;
        setDuration(timerRef.current);
      }, 1000);
    }
  };

  const processRecording = async () => {
    try {
      const blob = new Blob(chunksRef.current, { type: 'audio/webm;codecs=opus' });
      
      const formData = new FormData();
      formData.append('file', blob, 'recording.webm');

      const res = await fetch(`${API_BASE}/transcription`, {
        method: 'POST',
        headers: authHeadersOnly(), // Solo Authorization, sin Content-Type
        body: formData,
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || 'Error en transcripción');
      }

      const data = await res.json();
      setTranscription(data.text || '');
      setRecordingState('idle');
    } catch (err: any) {
      console.error('Error al procesar grabación:', err);
      setError('Error al transcribir: ' + err.message);
      setRecordingState('idle');
    }
  };

  const newRecording = () => {
    setTranscription('');
    setTextInput('');
    setDuration(0);
    setError(null);
    setStoryboard(null);
    setMermaidDiagram(null);
    chunksRef.current = [];
    timerRef.current = 0;
  };

  const analyzeWithAI = async () => {
    const textToAnalyze = inputMode === 'voice' ? transcription : textInput;
    if (!textToAnalyze.trim()) return;

    setIsAnalyzing(true);
    setError(null);

    try {
      const res = await fetch(`${API_BASE}/transcription/analyze`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({ text: textToAnalyze }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || 'Error en análisis');
      }

      const data = await res.json();
      setStoryboard(data.frames || []);
      setMermaidDiagram(data.mermaid || null);
    } catch (err: any) {
      console.error('Error al analizar:', err);
      setError('Error al analizar: ' + err.message);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleModeChange = (mode: InputMode) => {
    if (recordingState !== 'idle') return; // No cambiar modo durante grabación
    setInputMode(mode);
    setError(null);
    setStoryboard(null);
    setMermaidDiagram(null);
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const isSecureContext = window.isSecureContext;
  const hasMediaDevices = !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia);

  const hasContent = inputMode === 'voice' ? transcription : textInput;

  return (
    <div className="flex-1 overflow-y-auto px-4 py-6 lg:px-8">
      <div className="max-w-2xl mx-auto">
        <h2 className="text-2xl font-bold text-white mb-6">Agregar Planificación</h2>

        {/* Selector de modo: Voice / Text */}
        <div className="mb-6 flex gap-2 p-1 bg-slate-800 rounded-lg border border-slate-700">
          <button
            onClick={() => handleModeChange('voice')}
            disabled={recordingState !== 'idle'}
            className={`flex-1 py-3 px-4 rounded-md font-medium transition-all flex items-center justify-center gap-2 ${
              inputMode === 'voice'
                ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-lg'
                : 'text-slate-400 hover:text-white hover:bg-slate-700'
            } disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M7 4a3 3 0 016 0v4a3 3 0 11-6 0V4zm4 10.93A7.001 7.001 0 0017 8a1 1 0 10-2 0A5 5 0 015 8a1 1 0 00-2 0 7.001 7.001 0 006 6.93V17H6a1 1 0 100 2h8a1 1 0 100-2h-3v-2.07z" clipRule="evenodd" />
            </svg>
            Entrada de Voz
          </button>
          <button
            onClick={() => handleModeChange('text')}
            disabled={recordingState !== 'idle'}
            className={`flex-1 py-3 px-4 rounded-md font-medium transition-all flex items-center justify-center gap-2 ${
              inputMode === 'text'
                ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-lg'
                : 'text-slate-400 hover:text-white hover:bg-slate-700'
            } disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
            Entrada de Texto
          </button>
        </div>

        {/* Advertencia de contexto no seguro (solo en modo voz) */}
        {inputMode === 'voice' && !isSecureContext && (
          <div className="mb-6 p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
            <div className="flex items-start gap-3">
              <svg className="w-5 h-5 text-yellow-500 shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              <div>
                <p className="text-yellow-400 font-medium text-sm mb-1">Conexión no segura (HTTP)</p>
                <p className="text-yellow-300/80 text-xs">
                  La grabación de audio requiere HTTPS. Accedé desde <code className="bg-black/30 px-1 py-0.5 rounded">https://</code> para habilitar el micrófono.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Modo VOZ: Estado de grabación */}
        {inputMode === 'voice' && (
          <div className="mb-6 p-6 bg-slate-800 rounded-xl border border-slate-700">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              {recordingState === 'recording' && (
                <div className="w-4 h-4 bg-red-500 rounded-full animate-pulse" />
              )}
              {recordingState === 'paused' && (
                <div className="w-4 h-4 bg-yellow-500 rounded-full" />
              )}
              {recordingState === 'processing' && (
                <div className="w-4 h-4 bg-blue-500 rounded-full animate-spin border-2 border-white border-t-transparent" />
              )}
              <span className="text-white font-medium">
                {recordingState === 'idle' && 'Listo para grabar'}
                {recordingState === 'recording' && 'Grabando...'}
                {recordingState === 'paused' && 'Pausado'}
                {recordingState === 'processing' && 'Procesando...'}
              </span>
            </div>
            <span className="text-slate-400 font-mono text-lg">
              {formatDuration(duration)}
            </span>
          </div>

          {/* Controles */}
          <div className="flex gap-3">
            {recordingState === 'idle' && (
              <>
                <button
                  onClick={startRecording}
                  disabled={!hasMediaDevices}
                  className="flex-1 py-3 px-6 bg-red-600 hover:bg-red-500 text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M7 4a3 3 0 016 0v4a3 3 0 11-6 0V4zm4 10.93A7.001 7.001 0 0017 8a1 1 0 10-2 0A5 5 0 015 8a1 1 0 00-2 0 7.001 7.001 0 006 6.93V17H6a1 1 0 100 2h8a1 1 0 100-2h-3v-2.07z" clipRule="evenodd" />
                  </svg>
                  {hasMediaDevices ? 'Iniciar Grabación' : 'Micrófono no disponible'}
                </button>
                {transcription && (
                  <button
                    onClick={newRecording}
                    className="py-3 px-6 bg-slate-700 hover:bg-slate-600 text-white rounded-lg font-medium transition-colors"
                  >
                    Nueva Grabación
                  </button>
                )}
              </>
            )}

            {recordingState === 'recording' && (
              <>
                <button
                  onClick={pauseRecording}
                  className="flex-1 py-3 px-6 bg-yellow-600 hover:bg-yellow-500 text-white rounded-lg font-medium transition-colors"
                >
                  Pausar
                </button>
                <button
                  onClick={stopRecording}
                  className="flex-1 py-3 px-6 bg-slate-700 hover:bg-slate-600 text-white rounded-lg font-medium transition-colors"
                >
                  Detener
                </button>
              </>
            )}

            {recordingState === 'paused' && (
              <>
                <button
                  onClick={resumeRecording}
                  className="flex-1 py-3 px-6 bg-green-600 hover:bg-green-500 text-white rounded-lg font-medium transition-colors"
                >
                  Reanudar
                </button>
                <button
                  onClick={stopRecording}
                  className="flex-1 py-3 px-6 bg-slate-700 hover:bg-slate-600 text-white rounded-lg font-medium transition-colors"
                >
                  Detener
                </button>
              </>
            )}
          </div>
        </div>
        )}

        {/* Modo TEXTO: Editor de texto */}
        {inputMode === 'text' && (
          <div className="mb-6 p-6 bg-slate-800 rounded-xl border border-slate-700">
            <h3 className="text-white font-semibold mb-3">Describe tu pensamiento u objetivo:</h3>
            <textarea
              value={textInput}
              onChange={(e) => setTextInput(e.target.value)}
              placeholder="Escribe aquí tu pensamiento, objetivo o idea que quieras analizar y convertir en un plan de acción..."
              className="w-full min-h-[200px] p-4 bg-slate-900 border border-slate-700 rounded-lg text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-y"
              disabled={isAnalyzing}
            />
            <div className="mt-3 flex items-center justify-between text-sm">
              <span className="text-slate-400">
                {textInput.length} caracteres
              </span>
              {textInput.trim() && (
                <button
                  onClick={() => setTextInput('')}
                  className="text-slate-400 hover:text-white transition-colors"
                >
                  Limpiar
                </button>
              )}
            </div>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm">
            {error}
          </div>
        )}

        {/* Transcripción (solo modo voz) */}
        {inputMode === 'voice' && transcription && (
          <div className="mb-6 p-6 bg-slate-800 rounded-xl border border-slate-700">
            <h3 className="text-white font-semibold mb-3">Transcripción:</h3>
            <p className="text-slate-300 leading-relaxed whitespace-pre-wrap">{transcription}</p>
          </div>
        )}

        {/* Botón de generación de storyboard */}
        {hasContent && !storyboard && (
          <div className="mb-6">
            <button
              onClick={analyzeWithAI}
              disabled={isAnalyzing}
              className="w-full py-3 px-6 bg-gradient-to-r from-slate-700 to-slate-800 hover:from-slate-600 hover:to-slate-700 text-white rounded-lg font-medium transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed border border-slate-600"
            >
              {isAnalyzing ? (
                <>
                  <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Generando storyboard...
                </>
              ) : (
                <>
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
                  </svg>
                  Generar Storyboard (6-8 viñetas)
                </>
              )}
            </button>
          </div>
        )}

        {/* Storyboard generado */}
        {storyboard && storyboard.length > 0 && (
          <div className="mb-6 p-6 bg-gradient-to-br from-slate-900 to-slate-800 rounded-xl border-2 border-slate-700">
            {/* Historia original */}
            <div className="mb-4 p-4 bg-slate-800/50 rounded-lg border border-slate-700/50">
              <h4 className="text-slate-400 text-sm font-medium mb-2">
                {inputMode === 'voice' ? '🎙️ Historia original:' : '📝 Historia original:'}
              </h4>
              <p className="text-slate-300 text-sm leading-relaxed whitespace-pre-wrap">
                {inputMode === 'voice' ? transcription : textInput}
              </p>
            </div>

            <div className="flex items-center justify-between mb-4">
              <h3 className="text-white font-semibold flex items-center gap-2">
                <svg className="w-5 h-5 text-slate-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
                </svg>
                Storyboard ({storyboard.length} viñetas)
              </h3>
              <button
                onClick={() => {
                  setStoryboard(null);
                  setMermaidDiagram(null);
                }}
                className="text-slate-400 hover:text-white transition-colors"
                title="Cerrar storyboard"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Grid de viñetas del storyboard */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              {storyboard.map((frame) => (
                <div key={frame.frame} className="bg-slate-800/80 rounded-lg border-2 border-slate-600 overflow-hidden hover:border-slate-500 transition-colors">
                  {/* Header de la viñeta */}
                  <div className="bg-slate-700/50 px-3 py-2 border-b border-slate-600 flex items-center gap-2">
                    <div className="w-7 h-7 rounded bg-slate-600 flex items-center justify-center text-white text-sm font-bold">
                      {frame.frame}
                    </div>
                    <h4 className="text-white font-medium text-sm flex-1">{frame.scene}</h4>
                  </div>

                  {/* Contenido de la viñeta */}
                  <div className="p-4 space-y-3">
                    {/* Descripción visual */}
                    <div>
                      <h5 className="text-slate-400 text-xs font-semibold mb-1 uppercase tracking-wide">Descripción Visual</h5>
                      <p className="text-slate-300 text-sm leading-relaxed">{frame.visualDescription}</p>
                    </div>

                    {/* Diálogo (si existe) */}
                    {frame.dialogue && (
                      <div className="pt-2 border-t border-slate-700/50">
                        <h5 className="text-slate-400 text-xs font-semibold mb-1 uppercase tracking-wide">Diálogo</h5>
                        <p className="text-slate-200 text-sm italic">"{frame.dialogue}"</p>
                      </div>
                    )}

                    {/* Placeholder para imagen (futuro) */}
                    <div className="aspect-video bg-slate-900/50 rounded border-2 border-dashed border-slate-700 flex items-center justify-center">
                      <div className="text-center">
                        <svg className="w-12 h-12 text-slate-600 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        <p className="text-slate-600 text-xs">Imagen pendiente</p>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Timeline Mermaid */}
            {mermaidDiagram && (
              <div>
                <h4 className="text-white font-medium mb-3 flex items-center gap-2">
                  <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                  Timeline de la historia
                </h4>
                <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700/50">
                  <MermaidDiagram chart={mermaidDiagram} />
                </div>
              </div>
            )}

            <button
              onClick={analyzeWithAI}
              disabled={isAnalyzing}
              className="mt-4 w-full py-2 px-4 bg-slate-700 hover:bg-slate-600 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
            >
              Volver a analizar
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
