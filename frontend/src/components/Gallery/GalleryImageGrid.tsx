import { useState } from 'react';
import type { GalleryImage } from './types';
import { authHeaders } from '../../services/authHeaders';

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:3001';

interface GalleryImageGridProps {
  images: GalleryImage[];
  onImageDeleted: () => void;
}

export default function GalleryImageGrid({ images, onImageDeleted }: GalleryImageGridProps) {
  const [lightboxImage, setLightboxImage] = useState<GalleryImage | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleDelete = async (id: string) => {
    if (!confirm('¿Eliminar esta imagen?')) return;

    setDeletingId(id);
    try {
      const res = await fetch(`${API_BASE}/gallery/${id}`, {
        method: 'DELETE',
        headers: authHeaders(),
      });

      if (!res.ok) {
        throw new Error('Error al eliminar imagen');
      }

      onImageDeleted();
    } catch (err) {
      console.error('Error:', err);
      alert('Error al eliminar imagen');
    } finally {
      setDeletingId(null);
    }
  };

  if (images.length === 0) {
    return (
      <div className="text-center py-16">
        <svg className="w-16 h-16 mx-auto text-slate-600 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
        <p className="text-slate-500 text-lg">No hay imágenes en este tag</p>
        <p className="text-slate-600 text-sm mt-1">Subí algunas imágenes para comenzar</p>
      </div>
    );
  }

  return (
    <>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
        {images.map((img) => (
          <div
            key={img.id}
            className="group relative aspect-square bg-slate-900/50 rounded-xl overflow-hidden border border-slate-700 hover:border-indigo-500 transition-all duration-300 hover:shadow-2xl hover:shadow-indigo-500/20"
          >
            {/* Imagen */}
            <img
              src={img.imageUrl}
              alt={img.filename || img.tag}
              className="w-full h-full object-cover cursor-pointer"
              onClick={() => setLightboxImage(img)}
            />

            {/* Hover Overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-3">
              {/* Filename */}
              {img.filename && (
                <p className="text-white text-xs font-medium truncate mb-2">
                  {img.filename}
                </p>
              )}

              {/* Actions */}
              <div className="flex gap-2">
                <button
                  onClick={() => setLightboxImage(img)}
                  className="flex-1 py-2 px-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-medium transition-colors flex items-center justify-center gap-1"
                >
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
                  </svg>
                  Ver
                </button>
                <button
                  onClick={() => handleDelete(img.id)}
                  disabled={deletingId === img.id}
                  className="py-2 px-3 bg-red-600 hover:bg-red-500 text-white rounded-lg text-xs font-medium transition-colors disabled:opacity-50 flex items-center justify-center"
                >
                  {deletingId === img.id ? (
                    <svg className="w-3 h-3 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                  ) : (
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  )}
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Lightbox Modal */}
      {lightboxImage && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-sm"
          onClick={() => setLightboxImage(null)}
        >
          <div className="relative max-w-7xl w-full h-[90vh] flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between mb-4 px-4 shrink-0">
              <div>
                <h3 className="text-white font-semibold text-lg">{lightboxImage.tag}</h3>
                {lightboxImage.filename && (
                  <p className="text-slate-400 text-sm">{lightboxImage.filename}</p>
                )}
              </div>
              <button
                onClick={() => setLightboxImage(null)}
                className="w-10 h-10 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors flex items-center justify-center"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Image Container */}
            <div
              className="flex-1 flex items-center justify-center overflow-hidden min-h-0"
              onClick={(e) => e.stopPropagation()}
            >
              <img
                src={lightboxImage.imageUrl}
                alt={lightboxImage.filename || lightboxImage.tag}
                className="max-w-full max-h-full w-auto h-auto object-contain rounded-xl shadow-2xl"
              />
            </div>

            {/* Download button */}
            <div className="flex justify-center mt-4 shrink-0">
              <a
                href={lightboxImage.imageUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="px-6 py-3 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors flex items-center gap-2 font-medium"
                onClick={(e) => e.stopPropagation()}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
                Abrir en nueva pestaña
              </a>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
