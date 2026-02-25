import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { authHeadersOnly } from '../../services/authHeaders';

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:3001';

interface StoryboardFrame {
  frame: number;
  scene: string;
  visualDescription: string;
  dialogue?: string;
  imageUrl?: string;
}

interface Storyboard {
  _id: string;
  title: string;
  originalText: string;
  inputMode: 'voice' | 'text';
  frames: StoryboardFrame[];
  comicPageUrl?: string;
  createdAt: string;
}

export default function StoryboardsView() {
  const navigate = useNavigate();
  const [storyboards, setStoryboards] = useState<Storyboard[]>([]);
  const [selectedStoryboard, setSelectedStoryboard] = useState<Storyboard | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchStoryboards();
  }, []);

  const fetchStoryboards = async () => {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`${API_BASE}/storyboards`, {
        headers: authHeadersOnly(),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || 'Error cargando storyboards');
      }

      const data = await res.json();
      
      // Filtrar storyboards válidos (con frames)
      const validStoryboards = (data.storyboards || []).filter(
        (s: Storyboard) => s.frames && Array.isArray(s.frames) && s.frames.length > 0
      );
      setStoryboards(validStoryboards);
    } catch (err: any) {
      console.error('Error fetching storyboards:', err);
      setError(err.message);
      setStoryboards([]);
    } finally {
      setLoading(false);
    }
  };

  const deleteStoryboard = async (id: string) => {
    if (!confirm('¿Estás seguro de eliminar este storyboard?')) return;

    try {
      const res = await fetch(`${API_BASE}/storyboards/${id}`, {
        method: 'DELETE',
        headers: authHeadersOnly(),
      });

      if (!res.ok) {
        throw new Error('Error eliminando storyboard');
      }

      setStoryboards(storyboards.filter((s) => s._id !== id));
      if (selectedStoryboard?._id === id) {
        setSelectedStoryboard(null);
      }
      alert('✅ Storyboard eliminado');
    } catch (err: any) {
      alert('Error: ' + err.message);
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center bg-slate-900">
        <div className="text-center">
          <svg
            className="w-12 h-12 text-slate-600 mx-auto mb-3 animate-spin"
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
          <p className="text-slate-400">Cargando storyboards...</p>
        </div>
      </div>
    );
  }

  // Vista detalle
  if (selectedStoryboard) {
    return (
      <div className="flex-1 overflow-y-auto bg-slate-900">
        <div className="max-w-4xl mx-auto">
          {/* Header sticky */}
          <div className="sticky top-0 z-10 bg-slate-900/95 backdrop-blur border-b border-slate-700 px-4 py-3 flex items-center justify-between">
            <button
              onClick={() => setSelectedStoryboard(null)}
              className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 19l-7-7 7-7"
                />
              </svg>
              <span className="text-sm font-medium">Volver</span>
            </button>
            <button
              onClick={() => deleteStoryboard(selectedStoryboard._id)}
              className="flex items-center gap-2 text-red-400 hover:text-red-300 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                />
              </svg>
              <span className="text-sm font-medium">Eliminar</span>
            </button>
          </div>

          <div className="px-4 py-6">
            {/* Título */}
            <h1 className="text-2xl md:text-3xl font-bold text-white mb-3">
              {selectedStoryboard.title}
            </h1>

            {/* Metadata */}
            <div className="flex flex-wrap items-center gap-3 mb-6">
              <span className="text-xs px-3 py-1.5 rounded-full bg-blue-600/20 text-blue-400 border border-blue-600/30 font-medium">
                {selectedStoryboard.inputMode === 'voice' ? '🎙️ Voz' : '📝 Texto'}
              </span>
              <span className="text-sm text-slate-400">
                {new Date(selectedStoryboard.createdAt).toLocaleDateString('es-AR', {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric',
                })}
              </span>
              <span className="text-sm text-slate-500">
                📚 {selectedStoryboard.frames.length} viñetas
              </span>
            </div>

            {/* Historia original */}
            <div className="mb-6 p-4 bg-slate-800/50 rounded-xl border border-slate-700/50">
              <h3 className="text-white font-semibold mb-2 text-sm uppercase tracking-wide">
                Historia Original
              </h3>
              <p className="text-slate-300 text-sm md:text-base leading-relaxed">
                {selectedStoryboard.originalText}
              </p>
            </div>

            {/* Página de cómic completa */}
            {selectedStoryboard.comicPageUrl && (
              <div className="mb-6 bg-gradient-to-br from-slate-800 to-slate-900 rounded-xl border-2 border-slate-700 overflow-hidden">
                <div className="p-4 border-b border-slate-700">
                  <h3 className="text-white font-semibold text-sm uppercase tracking-wide">
                    Página de Cómic Completa
                  </h3>
                </div>
                <div className="p-4">
                  <img
                    src={selectedStoryboard.comicPageUrl}
                    alt="Página de cómic"
                    className="w-full rounded-lg"
                  />
                </div>
                <div className="p-4 border-t border-slate-700">
                  <a
                    href={selectedStoryboard.comicPageUrl}
                    download="comic-page.png"
                    className="block w-full py-3 px-4 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-sm font-medium text-center transition-colors"
                  >
                    Descargar Página Completa
                  </a>
                </div>
              </div>
            )}

            {/* Viñetas individuales */}
            <h3 className="text-white font-semibold mb-4 text-sm uppercase tracking-wide">
              Viñetas ({selectedStoryboard.frames.length})
            </h3>

            <div className="space-y-4">
              {selectedStoryboard.frames.map((frame) => (
                <div
                  key={frame.frame}
                  className="bg-slate-800/80 rounded-xl border border-slate-700 overflow-hidden"
                >
                  {/* Header del frame */}
                  <div className="bg-slate-700/50 px-4 py-3 border-b border-slate-600 flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white text-sm font-bold">
                      {frame.frame}
                    </div>
                    <h4 className="text-white font-medium text-base flex-1">{frame.scene}</h4>
                  </div>

                  {/* Contenido */}
                  <div className="p-4 space-y-4">
                    {/* Imagen */}
                    {frame.imageUrl && (
                      <div className="rounded-lg overflow-hidden bg-slate-900/50">
                        <img
                          src={frame.imageUrl}
                          alt={`Viñeta ${frame.frame}`}
                          className="w-full"
                        />
                      </div>
                    )}

                    {/* Descripción visual */}
                    <div>
                      <h5 className="text-slate-400 text-xs font-semibold mb-2 uppercase tracking-wider">
                        Descripción Visual
                      </h5>
                      <p className="text-slate-300 text-sm leading-relaxed">
                        {frame.visualDescription}
                      </p>
                    </div>

                    {/* Diálogo */}
                    {frame.dialogue && (
                      <div className="pt-3 border-t border-slate-700/50">
                        <h5 className="text-slate-400 text-xs font-semibold mb-2 uppercase tracking-wider">
                          Diálogo
                        </h5>
                        <p className="text-slate-200 text-sm italic bg-slate-900/30 p-3 rounded-lg border-l-4 border-blue-500">
                          "{frame.dialogue}"
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Vista lista
  return (
    <div className="flex-1 overflow-y-auto bg-slate-900 px-4 py-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <h1 className="text-2xl md:text-3xl font-bold text-white mb-2">Mis Storyboards</h1>
        <p className="text-slate-400 text-sm mb-6">
          {storyboards.length} storyboard{storyboards.length !== 1 ? 's' : ''} guardado
          {storyboards.length !== 1 ? 's' : ''}
        </p>

        {/* Status banner */}
        {error && (
          <div className="mb-6 p-4 bg-yellow-900/20 border border-yellow-500/30 rounded-lg">
            <div className="flex items-start gap-3">
              <span className="text-yellow-400 text-lg">⚠️</span>
              <div>
                <p className="text-yellow-300 text-sm font-medium mb-1">
                  Mostrando datos de prueba
                </p>
                <p className="text-yellow-400/80 text-xs">Error conectando al backend: {error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Empty state o Grid de cards */}
        {storyboards.length === 0 ? (
          <div className="text-center py-20">
            <svg
              className="w-20 h-20 text-slate-600 mx-auto mb-6"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z"
                clipRule="evenodd"
              />
            </svg>
            <p className="text-slate-400 text-xl font-medium mb-2">No hay storyboards guardados</p>
            <p className="text-slate-600 text-sm">
              Generá y guardá tu primer storyboard desde la sección de grabación
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {storyboards.map((storyboard) => (
              <div
                key={storyboard._id}
                onClick={() => navigate(`/storyboard/detail/${storyboard._id}`)}
                className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden hover:border-slate-600 hover:shadow-lg hover:shadow-blue-500/10 transition-all cursor-pointer active:scale-[0.98]"
              >
                {/* Thumbnail */}
                {storyboard.comicPageUrl && (
                  <div className="aspect-video bg-slate-900 overflow-hidden">
                    <img
                      src={storyboard.comicPageUrl}
                      alt={storyboard.title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}

                {/* Info */}
                <div className="p-4">
                  {/* Badge */}
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-xs px-2 py-1 rounded bg-blue-600/20 text-blue-400 border border-blue-600/30">
                      {storyboard.inputMode === 'voice' ? '🎙️ Voz' : '📝 Texto'}
                    </span>
                  </div>

                  {/* Título */}
                  <h3 className="text-white font-semibold mb-2 text-base line-clamp-2">
                    {storyboard.title}
                  </h3>

                  {/* Preview */}
                  <p className="text-slate-400 text-sm mb-3 line-clamp-2">
                    {storyboard.originalText}
                  </p>

                  {/* Footer */}
                  <div className="flex items-center justify-between text-xs text-slate-500 pt-3 border-t border-slate-700">
                    <span className="flex items-center gap-1">
                      <span>📚</span>
                      <span>{storyboard.frames.length} viñetas</span>
                    </span>
                    <span>
                      {new Date(storyboard.createdAt).toLocaleDateString('es-AR', {
                        day: 'numeric',
                        month: 'short',
                      })}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Floating Action Button - Generar Storyboard */}
      <button
        onClick={() => navigate('/storyboard/create')}
        className="fixed bottom-6 right-6 w-14 h-14 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full shadow-lg shadow-indigo-500/50 hover:shadow-indigo-500/75 hover:scale-110 transition-all flex items-center justify-center group"
        aria-label="Generar nuevo storyboard"
      >
        <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
        </svg>

        {/* Tooltip */}
        <span className="absolute right-16 whitespace-nowrap px-3 py-2 bg-slate-800 text-white text-sm rounded-lg shadow-lg border border-slate-700 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
          Generar Storyboard
        </span>
      </button>
    </div>
  );
}
