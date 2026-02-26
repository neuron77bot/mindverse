import type { InputMode, RecordingState } from './types';

interface InputModeSelectorProps {
  inputMode: InputMode;
  recordingState: RecordingState;
  handleModeChange: (mode: InputMode) => void;
}

export default function InputModeSelector({
  inputMode,
  recordingState,
  handleModeChange,
}: InputModeSelectorProps) {
  return (
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
          <path
            fillRule="evenodd"
            d="M7 4a3 3 0 016 0v4a3 3 0 11-6 0V4zm4 10.93A7.001 7.001 0 0017 8a1 1 0 10-2 0A5 5 0 015 8a1 1 0 00-2 0 7.001 7.001 0 006 6.93V17H6a1 1 0 100 2h8a1 1 0 100-2h-3v-2.07z"
            clipRule="evenodd"
          />
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
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
          />
        </svg>
        Entrada de Texto
      </button>
    </div>
  );
}
