import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import MermaidDiagram from '../UI/MermaidDiagram';
import { authHeadersOnly } from '../../services/authHeaders';

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:3001';

type InputMode = 'voice' | 'text';

interface StoryboardFrame {
  frame: number;
  scene: string;
  visualDescription: string;
  dialogue?: string;
  imageUrl?: string;
}

interface StoryboardDetail {
  title?: string;
  originalText?: string;
  inputMode?: InputMode;
  frames?: StoryboardFrame[];
  mermaidDiagram?: string | null;
  comicPageUrl?: string | null;
  createdAt?: string;
}

export default function StoryboardDetailView() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();

  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [storyboard, setStoryboard] = useState<StoryboardDetail | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<boolean>(false);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);

  useEffect(() => {
    const loadStoryboard = async () => {
      if (!id) {
        setError('No se encontró el storyboard solicitado.');
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        const res = await fetch(`${API_BASE}/storyboards/${id}`, {
          headers: authHeadersOnly(),
        });

        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData.error || 'Error cargando storyboard');
        }

        const data = await res.json();
        setStoryboard(data.storyboard ?? null);
      } catch (err: any) {
        setError(err.message || 'No se pudo cargar el storyboard.');
      } finally {
        setIsLoading(false);
      }
    };

    loadStoryboard();
  }, [id]);

  const handleDelete = async () => {
    if (!id) return;
    setIsDeleting(true);

    try {
      const res = await fetch(`${API_BASE}/storyboards/${id}`, {
        method: 'DELETE',
        headers: authHeadersOnly(),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || 'Error eliminando storyboard');
      }

      navigate('/storyboards');
    } catch (err: any) {
      alert(err.message || 'No se pudo eliminar el storyboard.');
    } finally {
      setIsDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  const frames = storyboard?.frames ?? [];
  const originalText = storyboard?.originalText ?? '';
  const inputMode = storyboard?.inputMode ?? 'text';
  const createdAt = storyboard?.createdAt;

  // Format date
  const formatDate = (dateStr?: string) => {
    if (!dateStr) return null;
    const date = new Date(dateStr);
    return date.toLocaleDateString('es-AR', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  return (
    <div className="min-h-full bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950">
      {/* Hero Header */}
      <div className="bg-gradient-to-r from-indigo-900/20 via-purple-900/20 to-pink-900/20 border-b border-slate-700/50">
        <div className="max-w-7xl mx-auto p-6">
          {/* Action Bar */}
          <div className="flex items-center justify-between mb-6">
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

            <div className="flex gap-3">
              <button
                onClick={() => navigate(`/storyboard/edit/${id}`)}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white transition-all duration-200 shadow-lg shadow-indigo-500/20"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                  />
                </svg>
                Editar
              </button>

              <button
                onClick={() => setShowDeleteConfirm(true)}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-red-600 hover:bg-red-500 text-white transition-all duration-200 shadow-lg shadow-red-500/20"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                  />
                </svg>
                Eliminar
              </button>
            </div>
          </div>

          {/* Loading State */}
          {isLoading && (
            <div className="space-y-4 animate-pulse">
              <div className="h-12 bg-slate-800 rounded-lg w-2/3"></div>
              <div className="flex gap-2">
                <div className="h-6 bg-slate-800 rounded-full w-24"></div>
                <div className="h-6 bg-slate-800 rounded-full w-24"></div>
                <div className="h-6 bg-slate-800 rounded-full w-32"></div>
              </div>
            </div>
          )}

          {/* Error State */}
          {!isLoading && error && (
            <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 flex items-center gap-3">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              {error}
            </div>
          )}

          {/* Hero Content */}
          {!isLoading && !error && storyboard && (
            <div className="space-y-4">
              <h1 className="text-4xl md:text-5xl font-bold text-white">
                {storyboard.title || 'Storyboard'}
              </h1>

              {/* Metadata Badges */}
              <div className="flex flex-wrap gap-2">
                {/* Frames count */}
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-indigo-500/20 border border-indigo-500/30 text-indigo-300 text-sm font-medium">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M7 4v16M17 4v16M3 8h4m10 0h4M3 12h18M3 16h4m10 0h4M4 20h16a1 1 0 001-1V5a1 1 0 00-1-1H4a1 1 0 00-1 1v14a1 1 0 001 1z"
                    />
                  </svg>
                  {frames.length} frames
                </span>

                {/* Input mode */}
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-purple-500/20 border border-purple-500/30 text-purple-300 text-sm font-medium">
                  {inputMode === 'voice' ? (
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
                          d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"
                        />
                      </svg>
                      Entrada: Voz
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
                          d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                        />
                      </svg>
                      Entrada: Texto
                    </>
                  )}
                </span>

                {/* Created date */}
                {createdAt && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-700/50 border border-slate-600 text-slate-300 text-sm font-medium">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                      />
                    </svg>
                    {formatDate(createdAt)}
                  </span>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Main Content */}
      {!isLoading && !error && storyboard && (
        <div className="max-w-7xl mx-auto p-6">
          <div className="lg:grid lg:grid-cols-12 lg:gap-6">
            {/* Sidebar (Left) */}
            <aside className="lg:col-span-4 space-y-6 mb-6 lg:mb-0">
              {/* Original Story */}
              {originalText && (
                <section className="p-6 bg-slate-900/50 backdrop-blur rounded-xl border border-slate-700/50 shadow-xl">
                  <div className="flex items-center gap-2 mb-4">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
                      <svg
                        className="w-4 h-4 text-white"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                        />
                      </svg>
                    </div>
                    <h2 className="text-white font-semibold text-lg">Historia original</h2>
                  </div>
                  <p className="text-slate-300 whitespace-pre-wrap leading-relaxed text-sm">
                    {originalText}
                  </p>
                </section>
              )}

              {/* Timeline */}
              {storyboard.mermaidDiagram && (
                <section className="p-6 bg-slate-900/50 backdrop-blur rounded-xl border border-slate-700/50 shadow-xl">
                  <div className="flex items-center gap-2 mb-4">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-pink-500 to-orange-600 flex items-center justify-center">
                      <svg
                        className="w-4 h-4 text-white"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M13 10V3L4 14h7v7l9-11h-7z"
                        />
                      </svg>
                    </div>
                    <h2 className="text-white font-semibold text-lg">Timeline</h2>
                  </div>
                  <div className="p-4 rounded-lg bg-slate-800/50 border border-slate-700">
                    <MermaidDiagram chart={storyboard.mermaidDiagram} />
                  </div>
                </section>
              )}

              {/* Comic Page */}
              {storyboard.comicPageUrl && (
                <section className="p-6 bg-slate-900/50 backdrop-blur rounded-xl border border-slate-700/50 shadow-xl">
                  <div className="flex items-center gap-2 mb-4">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center">
                      <svg
                        className="w-4 h-4 text-white"
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
                    <h2 className="text-white font-semibold text-lg">Página de cómic</h2>
                  </div>
                  <div className="group relative rounded-lg border border-slate-700 overflow-hidden mb-3">
                    <img
                      src={storyboard.comicPageUrl}
                      alt="Página de cómic"
                      className="w-full h-auto transition-transform duration-300 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end justify-center p-4">
                      <a
                        href={storyboard.comicPageUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-4 py-2 bg-white text-slate-900 rounded-lg font-medium text-sm hover:bg-slate-100 transition-colors"
                      >
                        Ver imagen completa
                      </a>
                    </div>
                  </div>
                </section>
              )}
            </aside>

            {/* Main Content (Right) */}
            <main className="lg:col-span-8">
              <section>
                <div className="flex items-center gap-2 mb-6">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-600 flex items-center justify-center">
                    <svg
                      className="w-5 h-5 text-white"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M7 4v16M17 4v16M3 8h4m10 0h4M3 12h18M3 16h4m10 0h4M4 20h16a1 1 0 001-1V5a1 1 0 00-1-1H4a1 1 0 00-1 1v14a1 1 0 001 1z"
                      />
                    </svg>
                  </div>
                  <h2 className="text-white font-bold text-2xl">Frames del Storyboard</h2>
                </div>

                {frames.length === 0 ? (
                  <div className="p-12 text-center bg-slate-900/50 backdrop-blur rounded-xl border border-slate-700/50">
                    <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-slate-800 flex items-center justify-center">
                      <svg
                        className="w-8 h-8 text-slate-600"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
                        />
                      </svg>
                    </div>
                    <p className="text-slate-400 text-lg">No hay frames en este storyboard</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {frames.map((frame) => (
                      <article
                        key={frame.frame}
                        className="group bg-slate-900/50 backdrop-blur rounded-xl border border-slate-700/50 overflow-hidden hover:border-indigo-500/50 transition-all duration-300 hover:shadow-xl hover:shadow-indigo-500/10 hover:-translate-y-1"
                      >
                        {/* Frame Image */}
                        {frame.imageUrl && (
                          <div className="relative aspect-square overflow-hidden">
                            <img
                              src={frame.imageUrl}
                              alt={`Frame ${frame.frame}`}
                              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                            />
                            <div className="absolute top-2 left-2">
                              <span className="inline-block px-2.5 py-1 rounded-full bg-black/70 backdrop-blur text-white text-xs font-bold">
                                #{frame.frame}
                              </span>
                            </div>
                          </div>
                        )}

                        {/* Frame Content */}
                        <div className="p-4 space-y-3">
                          {/* Scene Title */}
                          <div>
                            <h3 className="text-white font-semibold text-lg group-hover:text-indigo-300 transition-colors">
                              {frame.scene}
                            </h3>
                          </div>

                          {/* Visual Description */}
                          <div>
                            <p className="text-xs uppercase tracking-wider text-slate-500 mb-1.5 font-medium">
                              Descripción visual
                            </p>
                            <p className="text-slate-300 text-sm leading-relaxed">
                              {frame.visualDescription}
                            </p>
                          </div>

                          {/* Dialogue */}
                          {frame.dialogue && (
                            <div className="pt-2 border-t border-slate-700/50">
                              <p className="text-xs uppercase tracking-wider text-slate-500 mb-1.5 font-medium">
                                Diálogo
                              </p>
                              <p className="text-slate-200 text-sm italic leading-relaxed">
                                "{frame.dialogue}"
                              </p>
                            </div>
                          )}

                          {/* No Image Placeholder */}
                          {!frame.imageUrl && (
                            <div className="aspect-square rounded-lg border-2 border-dashed border-slate-700 flex items-center justify-center bg-slate-800/30">
                              <div className="text-center p-4">
                                <svg
                                  className="w-8 h-8 mx-auto mb-2 text-slate-600"
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
                                <p className="text-slate-500 text-xs">Sin imagen</p>
                              </div>
                            </div>
                          )}
                        </div>
                      </article>
                    ))}
                  </div>
                )}
              </section>
            </main>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-slate-900 rounded-xl border border-slate-700 p-6 max-w-md w-full shadow-2xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-full bg-red-500/20 flex items-center justify-center">
                <svg
                  className="w-6 h-6 text-red-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                  />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-white">¿Eliminar storyboard?</h3>
            </div>

            <p className="text-slate-300 mb-6">
              Esta acción no se puede deshacer. El storyboard y todos sus frames se eliminarán
              permanentemente.
            </p>

            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                disabled={isDeleting}
                className="flex-1 px-4 py-2.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-white border border-slate-600 transition-colors disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                onClick={handleDelete}
                disabled={isDeleting}
                className="flex-1 px-4 py-2.5 rounded-lg bg-red-600 hover:bg-red-500 text-white transition-colors disabled:opacity-50 font-medium"
              >
                {isDeleting ? 'Eliminando...' : 'Eliminar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
