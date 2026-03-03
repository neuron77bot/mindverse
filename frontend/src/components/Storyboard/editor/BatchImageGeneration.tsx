import { useState, useEffect } from 'react';
import { authHeaders } from '../../../services/authHeaders';

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:3001';

interface BatchImageGenerationProps {
  onGenerate: (galleryTags: string[], styleTagIds: string[], aspectRatio: string) => void;
  isGenerating: boolean;
  hasFrames: boolean;
}

export default function BatchImageGeneration({
  onGenerate,
  isGenerating,
  hasFrames,
}: BatchImageGenerationProps) {
  const [galleryTags, setGalleryTags] = useState<string[]>([]);
  const [selectedGalleryTags, setSelectedGalleryTags] = useState<string[]>([]);
  const [styleTags, setStyleTags] = useState<any[]>([]);
  const [selectedStyleTagIds, setSelectedStyleTagIds] = useState<string[]>([]);
  const [aspectRatio, setAspectRatio] = useState<string>('16:9');
  const [expanded, setExpanded] = useState(false);

  const loadTags = async () => {
    try {
      const [galleryRes, styleRes] = await Promise.all([
        fetch(`${API_BASE}/gallery/tags`, { headers: authHeaders() }),
        fetch(`${API_BASE}/prompt-styles`, { headers: authHeaders() }),
      ]);

      if (galleryRes.ok) {
        const data = await galleryRes.json();
        setGalleryTags(data.tags || []);
      }

      if (styleRes.ok) {
        const data = await styleRes.json();
        setStyleTags(data.tags || []);
      }
    } catch (err) {
      console.error('Error loading tags:', err);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadTags();
  }, []);

  const handleGenerate = () => {
    if (!hasFrames) return;
    onGenerate(selectedGalleryTags, selectedStyleTagIds, aspectRatio);
  };

  const hasSelection = selectedGalleryTags.length > 0 || selectedStyleTagIds.length > 0;

  return (
    <div className="bg-gradient-to-br from-slate-800/80 to-slate-900/80 backdrop-blur rounded-xl border border-slate-700/50 p-6 mb-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center">
            <svg
              className="w-6 h-6 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
          </div>
          <div>
            <h3 className="text-white font-semibold text-lg">Generación Masiva de Imágenes</h3>
            <p className="text-slate-400 text-sm">
              Configura referencias y estilos para generar todas las imágenes
            </p>
          </div>
        </div>
        <button
          onClick={() => setExpanded(!expanded)}
          className="p-2 rounded-lg bg-slate-700/50 hover:bg-slate-700 text-slate-300 transition-colors"
        >
          <svg
            className={`w-5 h-5 transition-transform ${expanded ? 'rotate-180' : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
      </div>

      {expanded && (
        <div className="space-y-4 pt-4 border-t border-slate-700/50">
          {/* Gallery Tags */}
          {galleryTags.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Imágenes de Referencia (Galería)
              </label>
              <div className="flex flex-wrap gap-2">
                {galleryTags.map((tag) => (
                  <button
                    key={tag}
                    onClick={() =>
                      setSelectedGalleryTags((prev) =>
                        prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
                      )
                    }
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                      selectedGalleryTags.includes(tag)
                        ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg'
                        : 'bg-slate-700 text-slate-300 hover:bg-slate-600 border border-slate-600'
                    }`}
                  >
                    📸 {tag}
                  </button>
                ))}
              </div>
              {selectedGalleryTags.length > 0 && (
                <p className="text-xs text-slate-500 mt-2">
                  {selectedGalleryTags.length} tag(s) seleccionado(s)
                </p>
              )}
            </div>
          )}

          {/* Style Tags */}
          {styleTags.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Estilos de Prompt
              </label>
              <div className="flex flex-wrap gap-2">
                {styleTags.map((tag) => (
                  <button
                    key={tag._id}
                    onClick={() =>
                      setSelectedStyleTagIds((prev) =>
                        prev.includes(tag._id)
                          ? prev.filter((id) => id !== tag._id)
                          : [...prev, tag._id]
                      )
                    }
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                      selectedStyleTagIds.includes(tag._id)
                        ? 'bg-gradient-to-r from-green-600 to-emerald-600 text-white shadow-lg'
                        : 'bg-slate-700 text-slate-300 hover:bg-slate-600 border border-slate-600'
                    }`}
                    title={tag.description || tag.promptText}
                  >
                    🎨 {tag.name}
                  </button>
                ))}
              </div>
              {selectedStyleTagIds.length > 0 && (
                <p className="text-xs text-slate-500 mt-2">
                  {selectedStyleTagIds.length} estilo(s) seleccionado(s)
                </p>
              )}
            </div>
          )}

          {/* Aspect Ratio Selector */}
          {(galleryTags.length > 0 || styleTags.length > 0) && (
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Aspect Ratio
              </label>
              <div className="flex flex-wrap gap-2">
                {['16:9', '9:16', '1:1', '4:3', '3:2'].map((ratio) => (
                  <button
                    key={ratio}
                    onClick={() => setAspectRatio(ratio)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                      aspectRatio === ratio
                        ? 'bg-gradient-to-r from-blue-600 to-cyan-600 text-white shadow-lg'
                        : 'bg-slate-700 text-slate-300 hover:bg-slate-600 border border-slate-600'
                    }`}
                  >
                    📐 {ratio}
                  </button>
                ))}
              </div>
              <p className="text-xs text-slate-500 mt-2">
                Todas las imágenes se generarán con aspect ratio: {aspectRatio}
              </p>
            </div>
          )}

          {/* No tags available */}
          {galleryTags.length === 0 && styleTags.length === 0 && (
            <div className="text-center py-8 text-slate-400">
              <p className="mb-2">No hay tags disponibles</p>
              <div className="flex gap-3 justify-center">
                <a
                  href="/gallery"
                  target="_blank"
                  className="text-indigo-400 hover:text-indigo-300 underline text-sm"
                >
                  Subir imágenes a galería
                </a>
                <span className="text-slate-600">•</span>
                <a
                  href="/prompt-styles"
                  target="_blank"
                  className="text-green-400 hover:text-green-300 underline text-sm"
                >
                  Crear estilos de prompt
                </a>
              </div>
            </div>
          )}

          {/* Generate Button */}
          <button
            onClick={handleGenerate}
            disabled={isGenerating || !hasFrames || !hasSelection}
            className="w-full py-3 px-6 rounded-lg font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500 text-white shadow-lg shadow-violet-500/20"
          >
            {isGenerating ? (
              <>
                <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Generando imágenes...
              </>
            ) : (
              <>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 10V3L4 14h7v7l9-11h-7z"
                  />
                </svg>
                Generar todas las imágenes
              </>
            )}
          </button>

          {!hasSelection && hasFrames && (
            <p className="text-center text-xs text-amber-400">
              Selecciona al menos un tag de referencia o estilo para continuar
            </p>
          )}
        </div>
      )}
    </div>
  );
}
