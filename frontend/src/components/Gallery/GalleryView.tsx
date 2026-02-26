import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import type { GalleryImage } from './types';
import { authHeaders } from '../../services/authHeaders';
import ImageUpload from './ImageUpload';
import GalleryImageGrid from './GalleryImageGrid';

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:3001';

export default function GalleryView() {
  const navigate = useNavigate();
  const [images, setImages] = useState<GalleryImage[]>([]);
  const [tags, setTags] = useState<string[]>([]);
  const [selectedTag, setSelectedTag] = useState<string | 'all'>('all');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadGallery = async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Cargar imágenes y tags en paralelo
      const [imagesRes, tagsRes] = await Promise.all([
        fetch(`${API_BASE}/gallery`, { headers: authHeaders() }),
        fetch(`${API_BASE}/gallery/tags`, { headers: authHeaders() }),
      ]);

      if (!imagesRes.ok || !tagsRes.ok) {
        throw new Error('Error al cargar galería');
      }

      const imagesData = await imagesRes.json();
      const tagsData = await tagsRes.json();

      setImages(imagesData.images || []);
      setTags(tagsData.tags || []);

      // Si hay tags y ninguno está seleccionado, seleccionar el primero
      if (tagsData.tags?.length > 0 && selectedTag === 'all') {
        setSelectedTag(tagsData.tags[0]);
      }
    } catch (err: any) {
      console.error('Error cargando galería:', err);
      setError(err?.message || 'Error al cargar galería');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadGallery();
  }, []);

  const filteredImages =
    selectedTag === 'all' ? images : images.filter((img) => img.tag === selectedTag);

  const imageCountByTag = (tag: string) => images.filter((img) => img.tag === tag).length;

  return (
    <div className="min-h-full bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950">
      {/* Hero Header */}
      <div className="bg-gradient-to-r from-indigo-900/20 via-purple-900/20 to-pink-900/20 border-b border-slate-700/50">
        <div className="max-w-7xl mx-auto p-6">
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={() => navigate('/storyboards')}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-600 transition-all duration-200"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 19l-7-7 7-7"
                />
              </svg>
              Volver
            </button>
          </div>

          <div className="space-y-4">
            <h1 className="text-4xl md:text-5xl font-bold text-white">Galería de Referencia</h1>
            <p className="text-slate-400 text-lg">
              Organizá tus imágenes de referencia con tags para usarlas en image-to-image
            </p>

            {/* Stats */}
            <div className="flex flex-wrap gap-4">
              <div className="px-4 py-2 rounded-lg bg-indigo-500/20 border border-indigo-500/30">
                <span className="text-indigo-300 font-semibold">{images.length}</span>
                <span className="text-indigo-300/80 text-sm ml-2">imágenes totales</span>
              </div>
              <div className="px-4 py-2 rounded-lg bg-purple-500/20 border border-purple-500/30">
                <span className="text-purple-300 font-semibold">{tags.length}</span>
                <span className="text-purple-300/80 text-sm ml-2">tags únicos</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto p-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Upload Section (Left Column) */}
          <div className="lg:col-span-1">
            <ImageUpload onUploadSuccess={loadGallery} />
          </div>

          {/* Gallery Section (Right Columns) */}
          <div className="lg:col-span-2">
            {/* Tags Tabs */}
            {tags.length > 0 && (
              <div className="mb-6 flex flex-wrap gap-2">
                <button
                  onClick={() => setSelectedTag('all')}
                  className={`px-4 py-2 rounded-lg font-medium transition-all ${
                    selectedTag === 'all'
                      ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg'
                      : 'bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700'
                  }`}
                >
                  Todas ({images.length})
                </button>
                {tags.map((tag) => (
                  <button
                    key={tag}
                    onClick={() => setSelectedTag(tag)}
                    className={`px-4 py-2 rounded-lg font-medium transition-all ${
                      selectedTag === tag
                        ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg'
                        : 'bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700'
                    }`}
                  >
                    {tag} ({imageCountByTag(tag)})
                  </button>
                ))}
              </div>
            )}

            {/* Loading State */}
            {isLoading && (
              <div className="flex items-center justify-center py-20">
                <div className="text-center">
                  <svg
                    className="animate-spin h-12 w-12 text-indigo-500 mx-auto mb-4"
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
                  <p className="text-slate-400">Cargando galería...</p>
                </div>
              </div>
            )}

            {/* Error State */}
            {error && (
              <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm">
                {error}
              </div>
            )}

            {/* Gallery Grid */}
            {!isLoading && !error && (
              <div className="bg-gradient-to-br from-slate-900/80 to-slate-800/80 rounded-2xl border border-slate-700 p-6">
                <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                  <svg
                    className="w-6 h-6 text-indigo-400"
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
                  {selectedTag === 'all' ? 'Todas las imágenes' : selectedTag}
                </h3>
                <GalleryImageGrid images={filteredImages} onImageDeleted={loadGallery} />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
