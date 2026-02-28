import { useEffect, useState, lazy, Suspense } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { authHeadersOnly } from '../../services/authHeaders';
import Breadcrumb from '../UI/Breadcrumb';
import FrameCarousel from './FrameCarousel';

// Lazy load heavy Mermaid component
const MermaidDiagram = lazy(() => import('../UI/MermaidDiagram'));

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:3001';

type InputMode = 'voice' | 'text';
type TabType = 'historia' | 'frames' | 'diagrama';

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
  createdAt?: string;
  allowCinema?: boolean;
}

interface StoryboardDetailViewProps {
  id?: string;
}

export default function StoryboardDetailView({ id }: StoryboardDetailViewProps) {
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState<TabType>('frames');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [storyboard, setStoryboard] = useState<StoryboardDetail | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<boolean>(false);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);
  const [lightboxImage, setLightboxImage] = useState<{ url: string; title: string } | null>(null);
  const [showActionsMenu, setShowActionsMenu] = useState<boolean>(false);
  const [isTogglingCinema, setIsTogglingCinema] = useState<boolean>(false);

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
    setShowDeleteConfirm(false);

    toast.promise(
      async () => {
        const res = await fetch(`${API_BASE}/storyboards/${id}`, {
          method: 'DELETE',
          headers: authHeadersOnly(),
        });

        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData.error || 'Error eliminando storyboard');
        }

        navigate('/storyboards');
      },
      {
        loading: 'Eliminando storyboard...',
        success: 'Storyboard eliminado exitosamente',
        error: (err) => err.message || 'No se pudo eliminar el storyboard',
        finally: () => setIsDeleting(false),
      }
    );
  };

  const handleToggleCinema = async () => {
    if (!id) return;
    const newValue = !storyboard?.allowCinema;
    setIsTogglingCinema(true);

    toast.promise(
      async () => {
        const res = await fetch(`${API_BASE}/storyboards/${id}/cinema-visibility`, {
          method: 'PATCH',
          headers: {
            ...authHeadersOnly(),
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ allowCinema: newValue }),
        });

        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData.error || 'Error actualizando visibilidad en Cinema');
        }

        const data = await res.json();
        setStoryboard(data.storyboard);

        return newValue
          ? 'Storyboard visible en Cinema Mode'
          : 'Storyboard oculto de Cinema Mode';
      },
      {
        loading: 'Actualizando visibilidad...',
        success: (msg) => msg,
        error: (err) => err.message || 'No se pudo actualizar la visibilidad',
        finally: () => setIsTogglingCinema(false),
      }
    );
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
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Tabs configuration
  const tabs: Array<{ id: TabType; label: string; icon: string; show: boolean }> = [
    { id: 'historia', label: 'Historia', icon: '📖', show: true },
    { id: 'frames', label: 'Frames', icon: '🎬', show: true },
    { id: 'diagrama', label: 'Diagrama', icon: '📊', show: !!storyboard?.mermaidDiagram },
  ];

  return (
    <div className="min-h-full bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950">
      {/* Breadcrumb */}
      {!isLoading && !error && storyboard && (
        <Breadcrumb
          items={[
            { label: 'Storyboards', path: '/storyboards' },
            { label: storyboard.title || 'Storyboard' },
          ]}
          onBack={() => navigate('/storyboards')}
        />
      )}

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

            <div className="relative">
              <button
                onClick={() => setShowActionsMenu(!showActionsMenu)}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-600 transition-all duration-200"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z"
                  />
                </svg>
                Acciones
              </button>

              {showActionsMenu && (
                <>
                  {/* Overlay to close menu when clicking outside */}
                  <div className="fixed inset-0 z-10" onClick={() => setShowActionsMenu(false)} />

                  {/* Dropdown menu */}
                  <div className="absolute right-0 mt-2 w-56 bg-slate-800 rounded-lg shadow-xl border border-slate-700 overflow-hidden z-20">
                    <button
                      onClick={() => {
                        setShowActionsMenu(false);
                        navigate(`/storyboard/edit/${id}`);
                      }}
                      className="w-full flex items-center gap-3 px-4 py-3 text-left text-white hover:bg-indigo-600/20 transition-colors"
                    >
                      <svg
                        className="w-5 h-5 text-indigo-400"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                        />
                      </svg>
                      <span>Editar</span>
                    </button>

                    <button
                      onClick={() => {
                        setShowActionsMenu(false);
                        handleToggleCinema();
                      }}
                      disabled={isTogglingCinema}
                      className="w-full flex items-center gap-3 px-4 py-3 text-left text-white hover:bg-purple-600/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <svg
                        className="w-5 h-5 text-purple-400"
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
                      <span>
                        {isTogglingCinema
                          ? 'Actualizando...'
                          : storyboard?.allowCinema
                          ? '🎬 Ocultar de Cinema'
                          : '🎬 Mostrar en Cinema'}
                      </span>
                    </button>

                    <div className="border-t border-slate-700" />

                    <button
                      onClick={() => {
                        setShowActionsMenu(false);
                        setShowDeleteConfirm(true);
                      }}
                      className="w-full flex items-center gap-3 px-4 py-3 text-left text-white hover:bg-red-600/20 transition-colors"
                    >
                      <svg
                        className="w-5 h-5 text-red-400"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                        />
                      </svg>
                      <span>Eliminar</span>
                    </button>
                  </div>
                </>
              )}
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
                {storyboard.allowCinema && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-purple-500/20 border border-purple-500/30 text-purple-300 text-sm font-medium">
                    🎬 Visible en Cinema
                  </span>
                )}

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

      {/* Navigation Tabs */}
      {!isLoading && !error && storyboard && (
        <div className="border-b border-slate-700/50 bg-slate-900/50 backdrop-blur sticky top-0 z-10">
          <div className="max-w-7xl mx-auto px-6">
            <nav className="flex gap-1 overflow-x-auto scrollbar-hide" aria-label="Tabs">
              {tabs
                .filter((tab) => tab.show)
                .map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`
                    flex items-center gap-2 px-6 py-4 text-sm font-medium border-b-2 transition-all whitespace-nowrap
                    ${
                      activeTab === tab.id
                        ? 'border-indigo-500 text-white bg-indigo-500/10'
                        : 'border-transparent text-slate-400 hover:text-white hover:border-slate-600'
                    }
                  `}
                  >
                    <span className="text-lg">{tab.icon}</span>
                    <span>{tab.label}</span>
                  </button>
                ))}
            </nav>
          </div>
        </div>
      )}

      {/* Tab Content */}
      {!isLoading && !error && storyboard && (
        <div className="max-w-7xl mx-auto p-6">
          {/* Historia Tab */}
          {activeTab === 'historia' && (
            <div className="max-w-4xl mx-auto space-y-6">
              {/* Original Text */}
              {originalText && (
                <section className="p-8 bg-gradient-to-br from-slate-900/80 to-slate-800/80 backdrop-blur rounded-2xl border border-slate-700/50 shadow-2xl">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/20">
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
                          d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                        />
                      </svg>
                    </div>
                    <div>
                      <h2 className="text-white font-bold text-2xl">Historia Original</h2>
                      <p className="text-slate-400 text-sm">
                        {inputMode === 'voice' ? 'Narrado por voz' : 'Escrito como texto'}
                      </p>
                    </div>
                  </div>
                  <div className="prose prose-invert max-w-none">
                    <p className="text-slate-200 whitespace-pre-wrap leading-relaxed text-lg">
                      {originalText}
                    </p>
                  </div>
                </section>
              )}

              {/* Metadata */}
              <section className="p-6 bg-slate-900/50 backdrop-blur rounded-xl border border-slate-700/50">
                <h3 className="text-white font-semibold text-lg mb-4">Información</h3>
                <dl className="space-y-3">
                  <div className="flex justify-between">
                    <dt className="text-slate-400">Modo de entrada:</dt>
                    <dd className="text-white font-medium">
                      {inputMode === 'voice' ? '🎙️ Voz' : '📝 Texto'}
                    </dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-slate-400">Total de frames:</dt>
                    <dd className="text-white font-medium">{frames.length}</dd>
                  </div>
                  {createdAt && (
                    <div className="flex justify-between">
                      <dt className="text-slate-400">Creado:</dt>
                      <dd className="text-white font-medium">{formatDate(createdAt)}</dd>
                    </div>
                  )}
                  {storyboard.mermaidDiagram && (
                    <div className="flex justify-between">
                      <dt className="text-slate-400">Diagrama:</dt>
                      <dd className="text-green-400 font-medium">✓ Disponible</dd>
                    </div>
                  )}
                </dl>
              </section>
            </div>
          )}

          {/* Frames Tab */}
          {activeTab === 'frames' && (
            <div className="space-y-8">
              {/* Frame Carousel */}
              {frames.length > 0 && (
                <FrameCarousel
                  frames={frames}
                  onImageClick={(url, title) => setLightboxImage({ url, title })}
                />
              )}
            </div>
          )}

          {/* Diagrama Tab */}
          {activeTab === 'diagrama' && storyboard.mermaidDiagram && (
            <div className="max-w-5xl mx-auto">
              <section className="p-8 bg-gradient-to-br from-slate-900/80 to-slate-800/80 backdrop-blur rounded-2xl border border-slate-700/50 shadow-2xl">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-pink-500 to-orange-600 flex items-center justify-center shadow-lg shadow-pink-500/20">
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
                        d="M13 10V3L4 14h7v7l9-11h-7z"
                      />
                    </svg>
                  </div>
                  <div>
                    <h2 className="text-white font-bold text-2xl">Diagrama de Flujo</h2>
                    <p className="text-slate-400 text-sm">Representación visual del storyboard</p>
                  </div>
                </div>
                <div className="p-6 rounded-xl bg-white/5 border border-slate-700">
                  <Suspense
                    fallback={
                      <div className="flex items-center justify-center py-12">
                        <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
                      </div>
                    }
                  >
                    <MermaidDiagram chart={storyboard.mermaidDiagram} />
                  </Suspense>
                </div>
              </section>
            </div>
          )}
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

      {/* Lightbox Modal */}
      {lightboxImage && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-sm"
          onClick={() => setLightboxImage(null)}
        >
          <div className="relative max-w-7xl w-full h-[90vh] flex flex-col">
            <div className="flex items-center justify-between mb-4 px-4 shrink-0">
              <h3 className="text-white font-semibold text-lg">{lightboxImage.title}</h3>
              <button
                onClick={() => setLightboxImage(null)}
                className="w-10 h-10 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors flex items-center justify-center"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            <div
              className="flex-1 flex items-center justify-center overflow-hidden min-h-0"
              onClick={(e) => e.stopPropagation()}
            >
              <img
                src={lightboxImage.url}
                alt={lightboxImage.title}
                className="max-w-full max-h-full w-auto h-auto object-contain rounded-xl shadow-2xl"
              />
            </div>

            <div className="flex justify-center mt-4 shrink-0">
              <a
                href={lightboxImage.url}
                target="_blank"
                rel="noopener noreferrer"
                className="px-6 py-3 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors flex items-center gap-2 font-medium"
                onClick={(e) => e.stopPropagation()}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                  />
                </svg>
                Abrir en nueva pestaña
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
