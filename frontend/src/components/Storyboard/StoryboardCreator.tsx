import { useState } from 'react';
import { useStoryboardCreator } from './creator/useStoryboardCreator';
import type { InputMode } from './editor/types';
import InputModeSelector from './editor/InputModeSelector';
import VoiceRecorder from './editor/VoiceRecorder';
import TextInputPanel from './editor/TextInputPanel';

export default function StoryboardCreator() {
  const creator = useStoryboardCreator();
  const [inputMode, setInputMode] = useState<InputMode>('voice');

  const handleModeChange = (newMode: InputMode) => {
    if (creator.recordingState !== 'idle') return;
    setInputMode(newMode);
    creator.resetState();
  };

  return (
    <div className="min-h-full bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950">
      <div className="max-w-7xl mx-auto p-6">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Crear Storyboard</h1>
          <p className="text-slate-400">
            Graba tu historia o escríbela para generar un storyboard automáticamente
          </p>
        </div>

        {/* Input Mode Selector */}
        <InputModeSelector
          inputMode={inputMode}
          recordingState={creator.recordingState}
          handleModeChange={handleModeChange}
        />

        {/* Insecure context warning */}
        {inputMode === 'voice' && !creator.isSecureContext && (
          <div className="mb-6 p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
            <div className="flex items-start gap-3">
              <svg
                className="w-5 h-5 text-yellow-500 shrink-0 mt-0.5"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                  clipRule="evenodd"
                />
              </svg>
              <div>
                <p className="text-yellow-400 font-medium text-sm mb-1">
                  Conexión no segura (HTTP)
                </p>
                <p className="text-yellow-300/80 text-xs">
                  La grabación de audio requiere HTTPS. Accedé desde{' '}
                  <code className="bg-black/30 px-1 py-0.5 rounded">https://</code> para habilitar
                  el micrófono.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Voice Recorder */}
        {inputMode === 'voice' && (
          <VoiceRecorder
            recordingState={creator.recordingState}
            hasMediaDevices={creator.hasMediaDevices}
            duration={creator.duration}
            transcription={creator.transcription}
            formatDuration={creator.formatDuration}
            startRecording={creator.startRecording}
            stopRecording={creator.stopRecording}
            pauseRecording={creator.pauseRecording}
            resumeRecording={creator.resumeRecording}
            newRecording={creator.newRecording}
          />
        )}

        {/* Text Input */}
        {inputMode === 'text' && (
          <TextInputPanel
            textInput={creator.textInput}
            setTextInput={creator.setTextInput}
            isAnalyzing={creator.isAnalyzing}
          />
        )}

        {/* Error Display */}
        {creator.error && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm">
            {creator.error}
          </div>
        )}

        {/* Transcription Display */}
        {inputMode === 'voice' && creator.transcription && (
          <div className="mb-6 p-6 bg-slate-800 rounded-xl border border-slate-700">
            <h3 className="text-white font-semibold mb-3">Transcripción:</h3>
            <p className="text-slate-300 leading-relaxed whitespace-pre-wrap">
              {creator.transcription}
            </p>
          </div>
        )}

        {/* Generate Button */}
        {creator.hasContent && (
          <div className="mb-6">
            <button
              onClick={() => creator.generateAndSave(inputMode)}
              disabled={creator.isAnalyzing}
              className="w-full py-3 px-6 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white rounded-lg font-semibold transition-all shadow-lg shadow-indigo-500/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {creator.isAnalyzing ? (
                <>
                  <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                  Generando y guardando storyboard...
                </>
              ) : (
                <>
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z"
                      clipRule="evenodd"
                    />
                  </svg>
                  Generar Storyboard
                </>
              )}
            </button>
            <p className="text-slate-500 text-sm text-center mt-2">
              Se generará y guardará automáticamente
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
