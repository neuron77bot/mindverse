import { useState, useEffect } from 'react';
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
  mermaidDiagram?: string;
  createdAt: string;
  updatedAt: string;
}

export default function StoryboardsView() {
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
        throw new Error('Error cargando storyboards');
      }

      const data = await res.json();
      setStoryboards(data.storyboards || []);
    } catch (err: any) {
      console.error('Error:', err);
      setError(err.message);
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

      setStoryboards(storyboards.filter(s => s._id !== id));
      if (selectedStoryboard?._id === id) {
        setSelectedStoryboard(null);
      }
      alert('Storyboard eliminado');
    } catch (err: any) {
      alert('Error: ' + err.message);
    }
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <svg className="w-12 h-12 text-slate-600 mx-auto mb-3 animate-spin" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          <p className="text-slate-400">Cargando storyboards...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-400">Error: {error}</p>
          <button onClick={fetchStoryboards} className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg">
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  if (selectedStoryboard) {
    return (
      <div className="flex-1 overflow-y-auto px-4 py-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="mb-6 flex items-center justify-between">
            <button
              onClick={() => setSelectedStoryboard(null)}
              className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Volver
            </button>
            <button
              onClick={() => deleteStoryboard(selectedStoryboard._id)}
              className="text-red-400 hover:text-red-300 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          </div>

          {/* Título */}
          <h1 className="text-3xl font-bold text-white mb-2">{selectedStoryboard.title}</h1>
          <p className="text-slate-400 text-sm mb-2">
            Creado: {new Date(selectedStoryboard.createdAt).toLocaleString('es-AR')}
          </p>
          <p className="text-slate-500 text-xs mb-6">
            Modo: {selectedStoryboard.inputMode === 'voice' ? '🎙️ Voz' : '📝 Texto'}
          </p>

          {/* Historia original */}
          <div className="mb-6 p-4 bg-slate-800/50 rounded-lg border border-slate-700/50">
            <h3 className="text-white font-semibold mb-2">Historia Original:</h3>
            <p className="text-slate-300 text-sm leading-relaxed whitespace-pre-wrap">
              {selectedStoryboard.originalText}
            </p>
          </div>

          {/* Página de cómic */}
          {selectedStoryboard.comicPageUrl && (
            <div className="mb-6 p-4 bg-gradient-to-br from-slate-900 to-black rounded-xl border-2 border-slate-700">
              <h3 className="text-white font-semibold mb-3">Página de Cómic Completa</h3>
              <img
                src={selectedStoryboard.comicPageUrl}
                alt="Página de cómic"
                className="w-full rounded-lg"
              />
              <a
                href={selectedStoryboard.comicPageUrl}
                download="comic-page.png"
                className="mt-3 w-full block py-2 px-4 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-sm font-medium text-center transition-colors"
              >
                Descargar Página Completa
              </a>
            </div>
          )}

          {/* Frames */}
          <h3 className="text-white font-semibold mb-4">Viñetas ({selectedStoryboard.frames.length})</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {selectedStoryboard.frames.map((frame) => (
              <div key={frame.frame} className="bg-slate-800/80 rounded-lg border-2 border-slate-600 overflow-hidden">
                {/* Header */}
                <div className="bg-slate-700/50 px-3 py-2 border-b border-slate-600 flex items-center gap-2">
                  <div className="w-7 h-7 rounded bg-slate-600 flex items-center justify-center text-white text-sm font-bold">
                    {frame.frame}
                  </div>
                  <h4 className="text-white font-medium text-sm flex-1">{frame.scene}</h4>
                </div>

                {/* Content */}
                <div className="p-4 space-y-3">
                  {/* Imagen */}
                  {frame.imageUrl && (
                    <div className="aspect-video bg-slate-900/50 rounded overflow-hidden">
                      <img
                        src={frame.imageUrl}
                        alt={`Viñeta ${frame.frame}`}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}

                  {/* Descripción visual */}
                  <div>
                    <h5 className="text-slate-400 text-xs font-semibold mb-1 uppercase tracking-wide">
                      Descripción Visual
                    </h5>
                    <p className="text-slate-300 text-sm leading-relaxed">{frame.visualDescription}</p>
                  </div>

                  {/* Diálogo */}
                  {frame.dialogue && (
                    <div className="pt-2 border-t border-slate-700/50">
                      <h5 className="text-slate-400 text-xs font-semibold mb-1 uppercase tracking-wide">
                        Diálogo
                      </h5>
                      <p className="text-slate-200 text-sm italic">"{frame.dialogue}"</p>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto px-4 py-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold text-white mb-6">Mis Storyboards</h1>

        {storyboards.length === 0 ? (
          <div className="text-center py-12">
            <svg className="w-16 h-16 text-slate-600 mx-auto mb-4" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
            </svg>
            <p className="text-slate-400 text-lg mb-2">No hay storyboards guardados</p>
            <p className="text-slate-600 text-sm">Generá y guardá tu primer storyboard</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {storyboards.map((storyboard) => (
              <div
                key={storyboard._id}
                className="bg-slate-800 rounded-lg border border-slate-700 overflow-hidden hover:border-slate-600 transition-colors cursor-pointer"
                onClick={() => setSelectedStoryboard(storyboard)}
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
                  <h3 className="text-white font-semibold mb-2 truncate">{storyboard.title}</h3>
                  <p className="text-slate-400 text-sm mb-2 line-clamp-2">
                    {storyboard.originalText}
                  </p>
                  <div className="flex items-center justify-between text-xs text-slate-500">
                    <span>{storyboard.frames.length} viñetas</span>
                    <span>{new Date(storyboard.createdAt).toLocaleDateString('es-AR')}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
