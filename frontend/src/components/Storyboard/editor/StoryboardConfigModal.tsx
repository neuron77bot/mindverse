import { useState, useEffect } from 'react';
import { authHeaders } from '../../../services/authHeaders';

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:3001';

interface StoryboardConfigModalProps {
  onConfirm: (config: { galleryTags: string[]; styleTagIds: string[] }) => void;
  onSkip: () => void;
  onClose: () => void;
}

export default function StoryboardConfigModal({
  onConfirm,
  onSkip,
  onClose,
}: StoryboardConfigModalProps) {
  const [galleryTags, setGalleryTags] = useState<string[]>([]);
  const [selectedGalleryTags, setSelectedGalleryTags] = useState<string[]>([]);
  const [styleTags, setStyleTags] = useState<any[]>([]);
  const [selectedStyleTagIds, setSelectedStyleTagIds] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadTags();
  }, []);

  const loadTags = async () => {
    setIsLoading(true);
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
    } finally {
      setIsLoading(false);
    }
  };

  const handleConfirm = () => {
    onConfirm({
      galleryTags: selectedGalleryTags,
      styleTagIds: selectedStyleTagIds,
    });
  };

  const hasSelection = selectedGalleryTags.length > 0 || selectedStyleTagIds.length > 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl border border-slate-700 shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-gradient-to-r from-slate-900/95 to-slate-800/95 backdrop-blur border-b border-slate-700 p-6">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-2xl font-bold text-white mb-2">
                🎨 Configuración del Storyboard
              </h2>
              <p className="text-slate-400 text-sm">
                Selecciona protagonistas y estilos para aplicar a todos los frames
              </p>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-lg bg-slate-700/50 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors flex items-center justify-center shrink-0"
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
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                <p className="text-slate-400">Cargando opciones...</p>
              </div>
            </div>
          ) : (
            <>
              {/* Gallery Tags (Protagonistas) */}
              <div className="bg-slate-800/50 rounded-xl p-5 border border-slate-700/50">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
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
                        d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                      />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-white font-semibold text-lg">
                      Protagonistas (Referencias de Galería)
                    </h3>
                    <p className="text-slate-400 text-sm">
                      Selecciona personajes o elementos de tu galería
                    </p>
                  </div>
                </div>

                {galleryTags.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {galleryTags.map((tag) => (
                      <button
                        key={tag}
                        onClick={() =>
                          setSelectedGalleryTags((prev) =>
                            prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
                          )
                        }
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                          selectedGalleryTags.includes(tag)
                            ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg scale-105'
                            : 'bg-slate-700 text-slate-300 hover:bg-slate-600 hover:text-white border border-slate-600'
                        }`}
                      >
                        📸 {tag}
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-slate-400">
                    <p className="mb-2">No hay imágenes en tu galería</p>
                    <a
                      href="/gallery"
                      target="_blank"
                      className="text-indigo-400 hover:text-indigo-300 underline text-sm"
                    >
                      Subir imágenes a la galería
                    </a>
                  </div>
                )}

                {selectedGalleryTags.length > 0 && (
                  <p className="text-xs text-indigo-400 mt-3">
                    ✓ {selectedGalleryTags.length} protagonista(s) seleccionado(s)
                  </p>
                )}
              </div>

              {/* Style Tags */}
              <div className="bg-slate-800/50 rounded-xl p-5 border border-slate-700/50">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center">
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
                        d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01"
                      />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-white font-semibold text-lg">Estilos Visuales</h3>
                    <p className="text-slate-400 text-sm">Define el estilo artístico general</p>
                  </div>
                </div>

                {styleTags.length > 0 ? (
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
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                          selectedStyleTagIds.includes(tag._id)
                            ? 'bg-gradient-to-r from-green-600 to-emerald-600 text-white shadow-lg scale-105'
                            : 'bg-slate-700 text-slate-300 hover:bg-slate-600 hover:text-white border border-slate-600'
                        }`}
                        title={tag.description || tag.promptText}
                      >
                        🎨 {tag.name}
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-slate-400">
                    <p className="mb-2">No hay estilos de prompt configurados</p>
                    <a
                      href="/prompt-styles"
                      target="_blank"
                      className="text-green-400 hover:text-green-300 underline text-sm"
                    >
                      Crear estilos de prompt
                    </a>
                  </div>
                )}

                {selectedStyleTagIds.length > 0 && (
                  <p className="text-xs text-green-400 mt-3">
                    ✓ {selectedStyleTagIds.length} estilo(s) seleccionado(s)
                  </p>
                )}
              </div>

              {/* Info box */}
              <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
                <div className="flex gap-3">
                  <svg
                    className="w-5 h-5 text-blue-400 shrink-0 mt-0.5"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <div className="text-sm">
                    <p className="text-blue-300 font-medium mb-1">
                      Esta configuración se aplicará a todos los frames
                    </p>
                    <p className="text-blue-200/80 text-xs">
                      Podrás modificarla frame por frame en el editor después de guardar
                    </p>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-gradient-to-r from-slate-900/95 to-slate-800/95 backdrop-blur border-t border-slate-700 p-6">
          <div className="flex gap-3">
            <button
              onClick={onSkip}
              className="flex-1 py-3 px-6 rounded-lg font-semibold transition-all bg-slate-700 hover:bg-slate-600 text-white border border-slate-600"
            >
              Saltear (sin configurar)
            </button>
            <button
              onClick={handleConfirm}
              disabled={!hasSelection}
              className="flex-1 py-3 px-6 rounded-lg font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white shadow-lg shadow-indigo-500/20 flex items-center justify-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
              Continuar con esta configuración
            </button>
          </div>
          {!hasSelection && (
            <p className="text-center text-xs text-amber-400 mt-3">
              Selecciona al menos un protagonista o estilo para continuar
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
