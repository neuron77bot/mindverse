import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { authHeadersOnly } from '../../services/authHeaders';

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:3001';

interface GalleryTagSelectorProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (tags: string[]) => void;
  onSkip: () => void;
}

export default function GalleryTagSelector({
  isOpen,
  onClose,
  onSelect,
  onSkip,
}: GalleryTagSelectorProps) {
  const [tags, setTags] = useState<string[]>([]);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isOpen) {
      fetchTags();
    }
  }, [isOpen]);

  const fetchTags = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/gallery/tags`, {
        headers: authHeadersOnly(),
      });

      if (!res.ok) throw new Error('Error cargando tags');

      const data = await res.json();
      setTags(data.tags || []);
    } catch (err: any) {
      toast.error(err.message || 'Error al cargar tags de galería');
    } finally {
      setLoading(false);
    }
  };

  const toggleTag = (tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const handleSelect = () => {
    if (selectedTags.length === 0) {
      toast.error('Selecciona al menos un tag');
      return;
    }
    onSelect(selectedTags);
    handleClose();
  };

  const handleSkip = () => {
    onSkip();
    handleClose();
  };

  const handleClose = () => {
    setSelectedTags([]);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-slate-800 rounded-xl border border-slate-700 max-w-md w-full max-h-[80vh] flex flex-col shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-700">
          <div>
            <h2 className="text-xl font-semibold text-white mb-1">
              Seleccionar Tags de Referencia
            </h2>
            <p className="text-slate-400 text-sm">
              Elige tags de tu galería para generar el preview con image-to-image
            </p>
          </div>
          <button
            onClick={handleClose}
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition-colors"
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

        {/* Tags List */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="flex justify-center py-8">
              <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : tags.length === 0 ? (
            <div className="text-center py-8">
              <svg
                className="w-16 h-16 text-slate-600 mx-auto mb-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"
                />
              </svg>
              <p className="text-slate-400 mb-2">No hay tags de galería disponibles</p>
              <p className="text-slate-500 text-sm">
                Sube imágenes a la galería primero para usarlas como referencia
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {tags.map((tag) => (
                <label
                  key={tag}
                  className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-all border ${
                    selectedTags.includes(tag)
                      ? 'bg-indigo-500/20 border-indigo-500/50 hover:bg-indigo-500/30'
                      : 'bg-slate-900/50 border-slate-700 hover:bg-slate-700/50'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={selectedTags.includes(tag)}
                    onChange={() => toggleTag(tag)}
                    className="w-4 h-4 rounded border-slate-600 text-indigo-600 focus:ring-indigo-500 focus:ring-offset-slate-800"
                  />
                  <span className="text-white font-medium">{tag}</span>
                </label>
              ))}
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-6 border-t border-slate-700 flex flex-col sm:flex-row gap-3">
          <button
            onClick={handleSkip}
            className="flex-1 px-4 py-2.5 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors font-medium"
          >
            Sin Tags (Text-to-Image)
          </button>
          <button
            onClick={handleSelect}
            disabled={selectedTags.length === 0}
            className="flex-1 px-4 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed font-medium shadow-lg"
          >
            Usar {selectedTags.length > 0 ? `(${selectedTags.length})` : 'Estos Tags'}
          </button>
        </div>
      </div>
    </div>
  );
}
