import type { RecordingState } from './types';

interface VoiceRecorderProps {
  recordingState: RecordingState;
  hasMediaDevices: boolean;
  duration: number;
  transcription: string;
  formatDuration: (seconds: number) => string;
  startRecording: () => void;
  stopRecording: () => void;
  pauseRecording: () => void;
  resumeRecording: () => void;
  newRecording: () => void;
}

export default function VoiceRecorder({
  recordingState,
  hasMediaDevices,
  duration,
  transcription,
  formatDuration,
  startRecording,
  stopRecording,
  pauseRecording,
  resumeRecording,
  newRecording,
}: VoiceRecorderProps) {
  return (
    <div className="mb-6 p-8 bg-gradient-to-br from-slate-900/80 to-slate-800/80 backdrop-blur rounded-2xl border border-slate-700/50 shadow-2xl">
      {/* Status Bar */}
      <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-700/50">
        <div className="flex items-center gap-4">
          <div className="relative">
            {recordingState === 'recording' && (
              <>
                <div className="w-6 h-6 bg-red-500 rounded-full animate-pulse" />
                <div className="absolute inset-0 w-6 h-6 bg-red-500 rounded-full animate-ping opacity-75" />
              </>
            )}
            {recordingState === 'paused' && (
              <div className="w-6 h-6 bg-yellow-500 rounded-full shadow-lg shadow-yellow-500/50" />
            )}
            {recordingState === 'processing' && (
              <div className="w-6 h-6 bg-blue-500 rounded-full animate-spin border-2 border-white border-t-transparent" />
            )}
            {recordingState === 'idle' && (
              <div className="w-6 h-6 bg-emerald-500 rounded-full shadow-lg shadow-emerald-500/50" />
            )}
          </div>

          <div>
            <span className="text-white font-semibold text-lg block">
              {recordingState === 'idle' && '🎤 Listo para grabar'}
              {recordingState === 'recording' && '🔴 Grabando...'}
              {recordingState === 'paused' && '⏸️ Pausado'}
              {recordingState === 'processing' && '⚙️ Procesando audio...'}
            </span>
            <span className="text-slate-400 text-sm">
              {recordingState === 'idle' && 'Presioná el botón rojo para comenzar'}
              {recordingState === 'recording' && 'La grabación está en curso'}
              {recordingState === 'paused' && 'Pausado - presioná reanudar para continuar'}
              {recordingState === 'processing' && 'Transcribiendo tu audio...'}
            </span>
          </div>
        </div>

        <div className="text-right">
          <span className="text-white font-mono text-3xl font-bold block">
            {formatDuration(duration)}
          </span>
          <span className="text-slate-500 text-xs uppercase tracking-wider">Duración</span>
        </div>
      </div>

      {/* Controls */}
      <div className="flex gap-4">
        {recordingState === 'idle' && (
          <>
            <button
              onClick={startRecording}
              disabled={!hasMediaDevices}
              className="flex-1 py-4 px-8 bg-gradient-to-r from-red-600 to-red-500 hover:from-red-500 hover:to-red-400 text-white rounded-xl font-semibold transition-all flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed shadow-xl shadow-red-500/30 hover:shadow-2xl hover:shadow-red-500/40 hover:scale-105 active:scale-95"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M7 4a3 3 0 016 0v4a3 3 0 11-6 0V4zm4 10.93A7.001 7.001 0 0017 8a1 1 0 10-2 0A5 5 0 015 8a1 1 0 00-2 0 7.001 7.001 0 006 6.93V17H6a1 1 0 100 2h8a1 1 0 100-2h-3v-2.07z"
                  clipRule="evenodd"
                />
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
              className="flex-1 py-4 px-8 bg-gradient-to-r from-yellow-600 to-amber-600 hover:from-yellow-500 hover:to-amber-500 text-white rounded-xl font-semibold transition-all flex items-center justify-center gap-3 shadow-xl shadow-yellow-500/20 hover:scale-105 active:scale-95"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM7 8a1 1 0 012 0v4a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1z"
                  clipRule="evenodd"
                />
              </svg>
              Pausar
            </button>
            <button
              onClick={stopRecording}
              className="flex-1 py-4 px-8 bg-gradient-to-r from-slate-700 to-slate-600 hover:from-slate-600 hover:to-slate-500 text-white rounded-xl font-semibold transition-all flex items-center justify-center gap-3 shadow-xl shadow-slate-500/10 hover:scale-105 active:scale-95"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zM8 7a1 1 0 00-1 1v4a1 1 0 001 1h4a1 1 0 001-1V8a1 1 0 00-1-1H8z"
                  clipRule="evenodd"
                />
              </svg>
              Detener
            </button>
          </>
        )}

        {recordingState === 'paused' && (
          <>
            <button
              onClick={resumeRecording}
              className="flex-1 py-4 px-8 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 text-white rounded-xl font-semibold transition-all flex items-center justify-center gap-3 shadow-xl shadow-green-500/20 hover:scale-105 active:scale-95"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z"
                  clipRule="evenodd"
                />
              </svg>
              Reanudar
            </button>
            <button
              onClick={stopRecording}
              className="flex-1 py-4 px-8 bg-gradient-to-r from-slate-700 to-slate-600 hover:from-slate-600 hover:to-slate-500 text-white rounded-xl font-semibold transition-all flex items-center justify-center gap-3 shadow-xl shadow-slate-500/10 hover:scale-105 active:scale-95"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zM8 7a1 1 0 00-1 1v4a1 1 0 001 1h4a1 1 0 001-1V8a1 1 0 00-1-1H8z"
                  clipRule="evenodd"
                />
              </svg>
              Detener
            </button>
          </>
        )}
      </div>
    </div>
  );
}
