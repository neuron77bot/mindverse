import { useState, useRef } from 'react';
import { authHeadersOnly } from '../../services/authHeaders';

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:3001';

type RecordingState = 'idle' | 'recording' | 'paused' | 'processing';

export default function RecordingView() {
  const [recordingState, setRecordingState] = useState<RecordingState>('idle');
  const [transcription, setTranscription] = useState<string>('');
  const [duration, setDuration] = useState<number>(0);
  const [error, setError] = useState<string | null>(null);

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
    setDuration(0);
    setError(null);
    chunksRef.current = [];
    timerRef.current = 0;
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const isSecureContext = window.isSecureContext;
  const hasMediaDevices = !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia);

  return (
    <div className="flex-1 overflow-y-auto px-4 py-6 lg:px-8">
      <div className="max-w-2xl mx-auto">
        <h2 className="text-2xl font-bold text-white mb-6">Agregar Planificación</h2>

        {/* Advertencia de contexto no seguro */}
        {!isSecureContext && (
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

        {/* Estado de grabación */}
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

        {/* Error */}
        {error && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm">
            {error}
          </div>
        )}

        {/* Transcripción */}
        {transcription && (
          <div className="mb-6 p-6 bg-slate-800 rounded-xl border border-slate-700">
            <h3 className="text-white font-semibold mb-3">Transcripción:</h3>
            <p className="text-slate-300 leading-relaxed whitespace-pre-wrap">{transcription}</p>
          </div>
        )}
      </div>
    </div>
  );
}
