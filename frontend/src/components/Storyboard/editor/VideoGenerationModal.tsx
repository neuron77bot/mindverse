import { useState } from 'react';
import type { StoryboardFrame } from './types';

interface VideoGenerationModalProps {
  selectedFrame: StoryboardFrame;
  imageUrl: string;
  generatingVideoFrame: number | null;
  videoPrompt?: string;
  onClose: () => void;
  onGenerate: (prompt: string, duration: number, aspectRatio: string) => void;
}

export default function VideoGenerationModal({
  selectedFrame,
  imageUrl,
  generatingVideoFrame,
  videoPrompt,
  onClose,
  onGenerate,
}: VideoGenerationModalProps) {
  const [prompt, setPrompt] = useState(videoPrompt || selectedFrame.visualDescription || '');
  const [duration, setDuration] = useState<number>(5);

  const isGenerating = generatingVideoFrame === selectedFrame.frame;

  const handleGenerate = () => {
    if (!prompt.trim()) return;
    onGenerate(prompt, duration, '1:1');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="bg-slate-900 rounded-2xl border border-slate-700 max-w-2xl w-full shadow-2xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 pb-4 flex-shrink-0">
          <div>
            <h3 className="text-xl font-bold text-white">
              🎬 Generar Video - Frame #{selectedFrame.frame}
            </h3>
            <p className="text-slate-400 text-sm mt-1">{selectedFrame.scene}</p>
          </div>
          <button
            onClick={onClose}
            disabled={isGenerating}
            className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors flex items-center justify-center disabled:opacity-50"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="px-6 pb-4 flex-1 overflow-y-auto space-y-4">
          {/* Image Preview */}
          <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700">
            <p className="text-slate-300 text-sm font-medium mb-2">Imagen de Referencia</p>
            <img
              src={imageUrl}
              alt={`Frame ${selectedFrame.frame}`}
              className="w-full rounded-lg border border-slate-600"
            />
          </div>

          {/* Prompt Input */}
          <div>
            <label className="block text-slate-300 text-sm font-medium mb-2">
              Prompt de Movimiento
            </label>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              disabled={isGenerating}
              placeholder="Describe el movimiento o acción que quieres ver en el video..."
              className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all resize-none disabled:opacity-50"
              rows={4}
            />
          </div>

          {/* Duration Select */}
          <div>
            <label className="block text-slate-300 text-sm font-medium mb-2">
              Duración del Video
            </label>
            <select
              value={duration}
              onChange={(e) => setDuration(Number(e.target.value))}
              disabled={isGenerating}
              className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all disabled:opacity-50"
            >
              <option value={5}>5 segundos</option>
              <option value={10}>10 segundos</option>
            </select>
          </div>

          {/* Info Box */}
          <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 w-5 h-5 rounded-full bg-amber-500/20 flex items-center justify-center">
                <svg className="w-3 h-3 text-amber-400" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <div className="flex-1">
                <p className="text-amber-200 text-sm font-medium">Tiempo de Generación</p>
                <p className="text-amber-300/80 text-xs mt-1">
                  La generación de video puede tardar entre 2-3 minutos. Por favor, sé paciente.
                </p>
              </div>
            </div>
          </div>

          {/* Technical Info */}
          <div className="text-slate-500 text-xs space-y-1 border-t border-slate-700 pt-3">
            <p>• Modelo: Kling AI v2.5 Turbo (Image-to-Video)</p>
            <p>• Aspect Ratio: 1:1 (Square)</p>
            <p>• Formato de salida: MP4</p>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-800/50 border-t border-slate-700 flex gap-3 flex-shrink-0">
          <button
            onClick={onClose}
            disabled={isGenerating}
            className="flex-1 px-4 py-3 bg-slate-700 hover:bg-slate-600 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Cancelar
          </button>
          <button
            onClick={handleGenerate}
            disabled={isGenerating || !prompt.trim()}
            className="flex-1 px-4 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white rounded-lg font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isGenerating ? (
              <>
                <svg
                  className="animate-spin h-5 w-5"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
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
                Generando video...
              </>
            ) : (
              <>
                🎬 Generar Video
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
