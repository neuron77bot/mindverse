import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import type { PromptStyleTag } from '../../types/promptStyle';
import { authHeadersOnly } from '../../services/authHeaders';
import GalleryTagPicker from '../shared/GalleryTagPicker';

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:3001';

interface PromptStyleModalProps {
  tag: PromptStyleTag | null;
  onClose: () => void;
  onSave: (data: { name: string; description?: string; promptText: string }) => void;
}

export default function PromptStyleModal({ tag, onClose, onSave }: PromptStyleModalProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [promptText, setPromptText] = useState('');
  const [previewImageUrl, setPreviewImageUrl] = useState<string | undefined>(undefined);
  const [isGeneratingPreview, setIsGeneratingPreview] = useState(false);
  
  // Gallery tags state (same as ImageGenerationModal)
  const [galleryTags, setGalleryTags] = useState<string[]>([]);
  const [selectedGalleryTags, setSelectedGalleryTags] = useState<string[]>([]);
  const [loadingGalleryTags, setLoadingGalleryTags] = useState(false);

  useEffect(() => {
    if (!tag) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setName(tag.name);
    setDescription(tag.description || '');
    setPromptText(tag.promptText);
    setPreviewImageUrl(tag.previewImageUrl);
  }, [tag]);

  // Load gallery tags when modal opens in edit mode
  useEffect(() => {
    if (!tag) return;
    
    const fetchGalleryTags = async () => {
      setLoadingGalleryTags(true);
      try {
        const res = await fetch(`${API_BASE}/gallery/tags`, {
          headers: authHeadersOnly(),
        });

        if (!res.ok) throw new Error('Error cargando tags de galería');

        const data = await res.json();
        setGalleryTags(data.tags || []);
      } catch (err: any) {
        console.error('Error fetching gallery tags:', err);
        // No mostrar error toast para no molestar al usuario - preview es opcional
      } finally {
        setLoadingGalleryTags(false);
      }
    };

    fetchGalleryTags();
  }, [tag]);

  const handleGeneratePreview = async () => {
    if (!tag) {
      toast.error('Guarda el estilo primero antes de generar un preview');
      return;
    }

    setIsGeneratingPreview(true);

    try {
      const res = await fetch(`${API_BASE}/prompt-styles/${tag._id}/generate-preview`, {
        method: 'POST',
        headers: {
          ...authHeadersOnly(),
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          galleryTags: selectedGalleryTags.length > 0 ? selectedGalleryTags : undefined 
        }),
      });

      if (!res.ok) throw new Error('Error generando preview');

      const data = await res.json();
      setPreviewImageUrl(data.previewImageUrl);
      toast.success('Preview generado exitosamente');
    } catch (err: any) {
      toast.error(err.message || 'Error al generar preview');
    } finally {
      setIsGeneratingPreview(false);
    }
  };

  const handleDeletePreview = async () => {
    if (!tag || !previewImageUrl) return;

    if (!confirm('¿Eliminar el preview de este estilo?')) return;

    try {
      const res = await fetch(`${API_BASE}/prompt-styles/${tag._id}/preview`, {
        method: 'DELETE',
        headers: authHeadersOnly(),
      });

      if (!res.ok) throw new Error('Error eliminando preview');

      setPreviewImageUrl(undefined);
      toast.success('Preview eliminado');
    } catch (err: any) {
      toast.error(err.message || 'Error al eliminar preview');
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !promptText.trim()) return;

    onSave({
      name: name.trim(),
      description: description.trim() || undefined,
      promptText: promptText.trim(),
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="bg-slate-900 rounded-xl border border-slate-700 p-6 max-w-2xl w-full shadow-2xl max-h-[90vh] overflow-y-auto">
        <h2 className="text-2xl font-bold text-white mb-6">
          {tag ? 'Editar Tag de Estilo' : 'Crear Tag de Estilo'}
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Name */}
          <div>
            <label className="block text-slate-300 text-sm font-medium mb-2">
              Nombre <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="ej: cyberpunk, watercolor, vintage"
              className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              required
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-slate-300 text-sm font-medium mb-2">
              Descripción (opcional)
            </label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Breve descripción del estilo"
              className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* Prompt Text */}
          <div>
            <label className="block text-slate-300 text-sm font-medium mb-2">
              Texto del Prompt <span className="text-red-400">*</span>
            </label>
            <textarea
              value={promptText}
              onChange={(e) => setPromptText(e.target.value)}
              placeholder="ej: futuristic neon city, cyberpunk aesthetic, high contrast"
              rows={4}
              className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono text-sm"
              required
            />
            <p className="text-slate-500 text-xs mt-1">
              Este texto se concatenará automáticamente a tus prompts de generación
            </p>
          </div>

          {/* Preview Section (only when editing) */}
          {tag && (
            <div className="border-t border-slate-700 pt-4 mt-6">
              <label className="block text-slate-300 text-sm font-medium mb-3">
                Preview del Estilo
              </label>

              {previewImageUrl ? (
                <div className="space-y-3">
                  {/* Preview Image */}
                  <div className="relative group">
                    <img
                      src={previewImageUrl}
                      alt="Preview del estilo"
                      className="w-full max-w-sm rounded-lg border border-slate-600 shadow-lg"
                    />
                    {/* Overlay con acciones */}
                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 rounded-lg">
                      <button
                        type="button"
                        onClick={handleDeletePreview}
                        className="px-3 py-2 bg-red-600 hover:bg-red-500 text-white text-sm rounded-lg transition-colors"
                      >
                        🗑️ Eliminar
                      </button>
                    </div>
                  </div>
                  
                  {/* Regenerar con nuevos tags */}
                  <div className="space-y-2">
                    <p className="text-slate-400 text-sm">Regenerar con diferentes referencias:</p>
                    {loadingGalleryTags ? (
                      <div className="flex justify-center py-4">
                        <div className="w-6 h-6 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
                      </div>
                    ) : (
                      <GalleryTagPicker
                        galleryTags={galleryTags}
                        selectedGalleryTags={selectedGalleryTags}
                        setSelectedGalleryTags={setSelectedGalleryTags}
                      />
                    )}
                    <button
                      type="button"
                      onClick={handleGeneratePreview}
                      disabled={isGeneratingPreview}
                      className="w-full py-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed font-medium shadow-lg inline-flex items-center justify-center gap-2"
                    >
                      {isGeneratingPreview ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          Generando...
                        </>
                      ) : (
                        <>
                          <svg
                            className="w-4 h-4"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                            />
                          </svg>
                          {selectedGalleryTags.length > 0 ? 'Regenerar con Referencias' : 'Regenerar Preview'}
                        </>
                      )}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="bg-slate-900/50 border border-slate-700 rounded-lg p-6 text-center">
                    <svg
                      className="w-16 h-16 text-slate-600 mx-auto mb-3"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1.5}
                        d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                      />
                    </svg>
                    <p className="text-slate-400 mb-2">No hay preview generado</p>
                    <p className="text-slate-500 text-sm">
                      Seleccioná tags de tu galería para generar con referencias, o dejá vacío para usar solo el prompt
                    </p>
                  </div>

                  {/* Gallery Tag Picker - Inline selector (same as ImageGenerationModal) */}
                  {loadingGalleryTags ? (
                    <div className="flex justify-center py-4">
                      <div className="w-6 h-6 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
                    </div>
                  ) : (
                    <GalleryTagPicker
                      galleryTags={galleryTags}
                      selectedGalleryTags={selectedGalleryTags}
                      setSelectedGalleryTags={setSelectedGalleryTags}
                    />
                  )}

                  {/* Generate Button */}
                  <button
                    type="button"
                    onClick={handleGeneratePreview}
                    disabled={isGeneratingPreview}
                    className="w-full py-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed font-medium shadow-lg inline-flex items-center justify-center gap-2"
                  >
                    {isGeneratingPreview ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        Generando...
                      </>
                    ) : (
                      <>
                        <svg
                          className="w-4 h-4"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z"
                          />
                        </svg>
                        {selectedGalleryTags.length > 0 ? 'Generar con Referencias' : 'Generar Preview'}
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Buttons */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-white border border-slate-600 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={!name.trim() || !promptText.trim()}
              className="flex-1 px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
            >
              {tag ? 'Guardar Cambios' : 'Crear Tag'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
