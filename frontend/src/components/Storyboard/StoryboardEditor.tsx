import { lazy, Suspense, useState, useRef, useEffect } from 'react';
import type { EditorTabType } from './editor/types';
import { useStoryboardEditor } from './editor/useStoryboardEditor';
import Breadcrumb from '../UI/Breadcrumb';
import EditorHeader from './editor/EditorHeader';
import StoryboardFrameGrid from './editor/StoryboardFrameGrid';
import BatchImageGeneration from './editor/BatchImageGeneration';
import ImageGenerationModal from './editor/ImageGenerationModal';
import VideoGenerationModal from './editor/VideoGenerationModal';
import LightboxModal from './editor/LightboxModal';
import { toast } from 'sonner';
import { authHeaders } from '../../services/authHeaders';

const MermaidDiagram = lazy(() => import('../UI/MermaidDiagram'));

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:3001';

export default function StoryboardEditor() {
  const editor = useStoryboardEditor();
  const [activeTab, setActiveTab] = useState<EditorTabType>('frames');
  const [isEditingOriginalText, setIsEditingOriginalText] = useState(false);
  const originalTextRef = useRef<HTMLTextAreaElement>(null);

  // Video compilation state
  const [isCompiling, setIsCompiling] = useState(false);
  const [compiledVideoUrl, setCompiledVideoUrl] = useState<string | null>(null);

  // Cargar compiledVideoUrl desde el storyboard cuando se carga
  useEffect(() => {
    if (editor.id && !compiledVideoUrl) {
      // Cargar storyboard completo para obtener compiledVideoUrl
      fetch(`${API_BASE}/storyboards/${editor.id}`, {
        headers: authHeaders(),
      })
        .then((res) => res.json())
        .then((data) => {
          if (data.success && data.storyboard?.compiledVideoUrl) {
            setCompiledVideoUrl(data.storyboard.compiledVideoUrl);
          }
        })
        .catch((err) => console.error('Error cargando compiledVideoUrl:', err));
    }
  }, [editor.id, compiledVideoUrl]);

  useEffect(() => {
    if (isEditingOriginalText && originalTextRef.current) {
      originalTextRef.current.focus();
      originalTextRef.current.setSelectionRange(0, 0);
    }
  }, [isEditingOriginalText]);

  const hasStoryboard = editor.storyboard && editor.storyboard.length > 0;
  const framesWithVideo = editor.storyboard?.filter((f) => f.videoUrl) || [];

  // Check if all frames have video
  const allFramesHaveVideo = editor.storyboard?.every((f) => f.videoUrl) || false;

  // Handle video compilation
  const handleCompileVideos = async () => {
    if (!editor.id || !editor.storyboard) return;

    setIsCompiling(true);

    try {
      const videoUrls = editor.storyboard.map((f) => f.videoUrl).filter(Boolean) as string[];

      const res = await fetch(`${API_BASE}/videos/compile`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({
          storyboardId: editor.id,
          videoUrls,
        }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || 'Error compilando videos');
      }

      const data = await res.json();
      setCompiledVideoUrl(data.videoUrl);
      toast.success('Video compilado generado exitosamente');
    } catch (err: any) {
      toast.error('Error al compilar videos: ' + err.message);
    } finally {
      setIsCompiling(false);
    }
  };

  const tabs: Array<{ id: EditorTabType; label: string; icon: string; show: boolean }> = [
    { id: 'historia', label: 'Historia', icon: '📖', show: true },
    { id: 'frames', label: 'Frames', icon: '🎬', show: true },
    { id: 'video', label: 'Video', icon: '🎞️', show: framesWithVideo.length > 0 },
    { id: 'diagrama', label: 'Diagrama', icon: '📊', show: !!editor.mermaidDiagram },
  ];

  if (editor.isLoading) {
    return (
      <div className="flex-1 overflow-y-auto px-4 py-6 lg:px-8">
        <div className="max-w-2xl mx-auto flex items-center justify-center py-20">
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
            <p className="text-slate-400">Cargando storyboard...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-full bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950">
      {/* Breadcrumb */}
      {editor.storyboardTitle && (
        <Breadcrumb
          items={[
            { label: 'Storyboards', path: '/storyboards' },
            { label: editor.storyboardTitle, path: `/storyboard/detail/${editor.id}` },
            { label: 'Editar' },
          ]}
          onBack={() => editor.navigate(`/storyboard/detail/${editor.id}`)}
        />
      )}

      <EditorHeader
        isEditMode={true}
        storyboardTitle={editor.storyboardTitle}
        setStoryboardTitle={editor.setStoryboardTitle}
        storyboard={editor.storyboard}
        inputMode={editor.inputMode}
        isSaving={editor.isSaving}
        saveStoryboard={editor.saveStoryboard}
      />

      {/* ── Navigation Tabs ── */}
      {hasStoryboard && (
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

      {/* ── Tab Content ── */}
      {hasStoryboard && (
        <div className="max-w-7xl mx-auto p-6">
          {/* Error (always visible above tab content) */}
          {editor.error && (
            <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm">
              {editor.error}
            </div>
          )}

          {/* ── Historia Tab ── */}
          {activeTab === 'historia' && (
            <div className="max-w-4xl mx-auto space-y-6">
              {/* Original story */}
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
                      {editor.inputMode === 'voice' ? 'Narrado por voz' : 'Escrito como texto'}
                    </p>
                  </div>
                </div>
                <div className="prose prose-invert max-w-none">
                  {isEditingOriginalText ? (
                    <textarea
                      ref={originalTextRef}
                      value={editor.originalText}
                      onChange={(e) => editor.setOriginalText(e.target.value)}
                      onBlur={() => setIsEditingOriginalText(false)}
                      onKeyDown={(e) => {
                        if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
                          setIsEditingOriginalText(false);
                        }
                        if (e.key === 'Escape') {
                          setIsEditingOriginalText(false);
                        }
                      }}
                      className="w-full px-4 py-3 bg-slate-800 text-white rounded-lg border-2 border-violet-500 focus:outline-none focus:ring-2 focus:ring-violet-500/20 text-lg leading-relaxed resize"
                      style={{ resize: 'vertical', minHeight: '200px' }}
                      placeholder="Escribe la historia original..."
                    />
                  ) : (
                    <p
                      onDoubleClick={() => setIsEditingOriginalText(true)}
                      className="text-slate-200 whitespace-pre-wrap leading-relaxed text-lg cursor-text hover:bg-slate-800/30 rounded-lg p-3 -mx-3 transition-colors min-h-[200px]"
                      title="Doble clic para editar"
                    >
                      {editor.originalText || 'Sin historia'}
                    </p>
                  )}
                </div>
              </section>

              {/* Info section */}
              <section className="p-6 bg-slate-900/50 backdrop-blur rounded-xl border border-slate-700/50">
                <h3 className="text-white font-semibold text-lg mb-4">Información</h3>
                <dl className="space-y-3">
                  <div className="flex justify-between">
                    <dt className="text-slate-400">Modo de entrada:</dt>
                    <dd className="text-white font-medium">
                      {editor.inputMode === 'voice' ? '🎙️ Voz' : '📝 Texto'}
                    </dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-slate-400">Total de frames:</dt>
                    <dd className="text-white font-medium">{editor.storyboard!.length}</dd>
                  </div>
                  {editor.mermaidDiagram && (
                    <div className="flex justify-between">
                      <dt className="text-slate-400">Diagrama:</dt>
                      <dd className="text-green-400 font-medium">✓ Disponible</dd>
                    </div>
                  )}
                </dl>
              </section>
            </div>
          )}

          {/* ── Frames Tab ── */}
          {activeTab === 'frames' && (
            <div className="space-y-6">
              <BatchImageGeneration
                onGenerate={editor.handleBatchGenerate}
                isGenerating={editor.isBatchGenerating}
                hasFrames={editor.storyboard !== null && editor.storyboard.length > 0}
              />

              <StoryboardFrameGrid
                storyboard={editor.storyboard!}
                frameImages={editor.frameImages}
                frameVideos={editor.frameVideos}
                generatingFrame={editor.generatingFrame}
                generatingVideoFrame={editor.generatingVideoFrame}
                isEditMode={true}
                openImageModal={editor.openImageModal}
                openVideoModal={editor.openVideoModal}
                setLightboxImage={editor.setLightboxImage}
                updateFrame={editor.updateFrame}
                activeFrameTabs={editor.activeFrameTabs}
                videoPrompts={editor.videoPrompts}
                setFrameTab={editor.setFrameTab}
                setVideoPrompt={editor.setVideoPrompt}
              />
            </div>
          )}

          {/* ── Video Tab ── */}
          {activeTab === 'video' && (
            <div className="max-w-4xl mx-auto">
              <section className="p-8 bg-gradient-to-br from-slate-900/80 to-slate-800/80 backdrop-blur rounded-2xl border border-slate-700/50 shadow-2xl">
                {/* Header */}
                <div className="mb-8 text-center">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center shadow-lg shadow-green-500/20">
                    <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M8 5v14l11-7z" />
                    </svg>
                  </div>
                  <h2 className="text-2xl font-bold text-white mb-2">Video Compilado</h2>
                  <p className="text-slate-400">
                    {allFramesHaveVideo
                      ? compiledVideoUrl
                        ? 'Video compilado disponible'
                        : 'Genera el video compilado de todos los frames'
                      : `${framesWithVideo.length} de ${editor.storyboard?.length || 0} frames tienen video`}
                  </p>
                </div>

                {/* Preview del video compilado si existe */}
                {compiledVideoUrl ? (
                  <div className="mb-6">
                    <video
                      src={compiledVideoUrl}
                      controls
                      className="w-full rounded-lg border-2 border-green-700 shadow-2xl mb-4"
                    />
                    <div className="flex gap-3">
                      <a
                        href={compiledVideoUrl}
                        download="storyboard-compilado.mp4"
                        className="flex-1 py-3 bg-green-600 hover:bg-green-500 text-white text-center rounded-lg font-semibold transition-all shadow-lg flex items-center justify-center gap-2"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                        </svg>
                        Descargar Video
                      </a>
                      <button
                        onClick={() => {
                          setCompiledVideoUrl(null);
                          toast.info('Video compilado removido de la vista');
                        }}
                        className="px-6 py-3 bg-slate-700 hover:bg-slate-600 text-white rounded-lg font-semibold transition-all"
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                ) : null}

                {/* Botón de compilar (solo si todos los frames tienen video) */}
                {allFramesHaveVideo ? (
                  <div className={compiledVideoUrl ? 'border-t border-slate-700 pt-6' : ''}>
                    <button
                      onClick={handleCompileVideos}
                      disabled={isCompiling}
                      className="w-full px-8 py-4 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg font-bold text-lg shadow-xl transition-all flex items-center justify-center gap-3"
                    >
                      {isCompiling ? (
                        <>
                          <svg className="w-6 h-6 animate-spin" fill="none" viewBox="0 0 24 24">
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
                          Compilando videos...
                        </>
                      ) : compiledVideoUrl ? (
                        <>🔄 Regenerar Video Compilado</>
                      ) : (
                        <>🎬 Generar Video Compilado</>
                      )}
                    </button>
                    <p className="text-slate-400 text-sm mt-2 text-center">
                      {compiledVideoUrl
                        ? 'Regenera el video con los frames actuales'
                        : 'Combina todos los videos en un único archivo MP4'}
                    </p>
                  </div>
                ) : (
                  <div className="text-center py-8 px-6 bg-slate-800/50 rounded-lg border border-slate-700">
                    <svg
                      className="w-12 h-12 mx-auto mb-4 text-slate-500"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
                      />
                    </svg>
                    <p className="text-slate-400 text-lg mb-2">
                      Faltan videos por generar
                    </p>
                    <p className="text-slate-500 text-sm">
                      Genera videos para todos los frames en el tab Frames antes de compilar.
                    </p>
                  </div>
                )}
              </section>
            </div>
          )}

          {/* ── Diagrama Tab ── */}
          {activeTab === 'diagrama' && editor.mermaidDiagram && (
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
                    <MermaidDiagram chart={editor.mermaidDiagram} />
                  </Suspense>
                </div>
              </section>
            </div>
          )}
        </div>
      )}

      {/* Image generation modal */}
      {editor.isImageModalOpen && editor.selectedFrameForImage && (
        <ImageGenerationModal
          selectedFrame={editor.selectedFrameForImage}
          generatingFrame={editor.generatingFrame}
          imageMode={editor.imageMode}
          setImageMode={editor.setImageMode}
          imagePrompt={editor.imagePrompt}
          setImagePrompt={editor.setImagePrompt}
          imageUrlInput={editor.imageUrlInput}
          setImageUrlInput={editor.setImageUrlInput}
          refImageFiles={editor.refImageFiles}
          setRefImageFiles={editor.setRefImageFiles}
          refImagePreviews={editor.refImagePreviews}
          setRefImagePreviews={editor.setRefImagePreviews}
          imageError={editor.imageError}
          setImageError={editor.setImageError}
          galleryTags={editor.galleryTags}
          selectedGalleryTags={editor.selectedGalleryTags}
          setSelectedGalleryTags={editor.setSelectedGalleryTags}
          storyboardFrames={editor.storyboard || []}
          selectedFrameRef={editor.selectedFrameRef}
          setSelectedFrameRef={editor.setSelectedFrameRef}
          availableStyleTags={editor.availableStyleTags}
          selectedStyleTagIds={editor.selectedStyleTagIds}
          setSelectedStyleTagIds={editor.setSelectedStyleTagIds}
          fileInputRef={editor.fileInputRef}
          onClose={editor.closeImageModal}
          onGenerate={editor.handleGenerateFrameImage}
          onFileChange={editor.handleFileChange}
          onRemoveRefImage={editor.removeRefImage}
        />
      )}

      {/* Video generation modal */}
      {editor.isVideoModalOpen && editor.selectedFrameForVideo && (
        <VideoGenerationModal
          selectedFrame={editor.selectedFrameForVideo}
          imageUrl={editor.frameImages.get(editor.selectedFrameForVideo.frame) || ''}
          generatingVideoFrame={editor.generatingVideoFrame}
          videoPrompt={editor.videoPrompts.get(editor.selectedFrameForVideo.frame)}
          onClose={editor.closeVideoModal}
          onGenerate={editor.generateFrameVideo}
        />
      )}

      {/* Lightbox */}
      {editor.lightboxImage && (
        <LightboxModal
          lightboxImage={editor.lightboxImage}
          onClose={() => editor.setLightboxImage(null)}
        />
      )}
    </div>
  );
}
