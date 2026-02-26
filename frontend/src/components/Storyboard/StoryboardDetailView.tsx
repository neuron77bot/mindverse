import { useEffect, useState, lazy, Suspense } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'sonner';
import { authHeadersOnly } from '../../services/authHeaders';
import FrameCarousel from './FrameCarousel';

// Lazy load heavy Mermaid component
const MermaidDiagram = lazy(() => import('../UI/MermaidDiagram'));

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:3001';

type InputMode = 'voice' | 'text';
type TabType = 'historia' | 'frames' | 'diagrama' | 'comic';

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

  const [activeTab, setActiveTab] = useState<TabType>('frames');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [storyboard, setStoryboard] = useState<StoryboardDetail | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<boolean>(false);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);
  const [lightboxImage, setLightboxImage] = useState<{ url: string; title: string } | null>(null);
  const [isGeneratingShare, setIsGeneratingShare] = useState<boolean>(false);

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

  const handleShare = async () => {
    if (!id) return;
    setIsGeneratingShare(true);

    toast.promise(
      async () => {
        const res = await fetch(`${API_BASE}/storyboards/${id}/share`, {
          method: 'POST',
          headers: authHeadersOnly(),
        });

        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData.error || 'Error generando link de compartir');
        }

        const data = await res.json();
        const shareUrl = `${window.location.origin}/mindverse${data.shareUrl}`;
        
        await navigator.clipboard.writeText(shareUrl);
        return `Link copiado (válido por ${data.expiresIn})`;
      },
      {
        loading: 'Generando link de compartir...',
        success: (msg) => msg,
        error: (err) => err.message || 'No se pudo generar el link',
        finally: () => setIsGeneratingShare(false),
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
    { id: 'comic', label: 'Cómic', icon: '🎨', show: !!storyboard?.comicPageUrl },
  ];

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
                onClick={handleShare}
                disabled={isGeneratingShare}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg bg-green-600 hover:bg-green-500 text-white transition-all duration-200 shadow-lg shadow-green-500/20 ${
                  isGeneratingShare ? 'opacity-50 cursor-not-allowed' : ''
                }`}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"
                  />
                </svg>
                Compartir
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
                  {storyboard.comicPageUrl && (
                    <div className="flex justify-between">
                      <dt className="text-slate-400">Página de cómic:</dt>
                      <dd className="text-green-400 font-medium">✓ Generada</dd>
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

          {/* Cómic Tab */}
          {activeTab === 'comic' && storyboard.comicPageUrl && (
            <div className="max-w-5xl mx-auto">
              <section className="p-8 bg-gradient-to-br from-slate-900/80 to-slate-800/80 backdrop-blur rounded-2xl border border-slate-700/50 shadow-2xl">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center shadow-lg shadow-green-500/20">
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
                    <h2 className="text-white font-bold text-2xl">Página de Cómic</h2>
                    <p className="text-slate-400 text-sm">Composición visual completa</p>
                  </div>
                </div>
                <div
                  className="group relative rounded-xl border-2 border-slate-700 overflow-hidden cursor-pointer bg-slate-900/50"
                  onClick={() =>
                    setLightboxImage({
                      url: storyboard.comicPageUrl!,
                      title: 'Página de cómic completa',
                    })
                  }
                >
                  <img
                    src={storyboard.comicPageUrl}
                    alt="Página de cómic"
                    className="w-full h-auto transition-transform duration-300 group-hover:scale-[1.02]"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                    <div className="text-center">
                      <svg
                        className="w-16 h-16 text-white drop-shadow-lg mx-auto mb-3"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7"
                        />
                      </svg>
                      <span className="text-white font-semibold text-lg drop-shadow-lg">
                        Click para ampliar
                      </span>
                    </div>
                  </div>
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
