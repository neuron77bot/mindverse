import { lazy, Suspense, useState } from 'react';
import type { EditorTabType } from './editor/types';
import { useStoryboardEditor } from './editor/useStoryboardEditor';
import Breadcrumb from '../UI/Breadcrumb';
import EditorHeader from './editor/EditorHeader';
import StoryboardFrameGrid from './editor/StoryboardFrameGrid';
import BatchImageGeneration from './editor/BatchImageGeneration';
import ImageGenerationModal from './editor/ImageGenerationModal';
import LightboxModal from './editor/LightboxModal';

const MermaidDiagram = lazy(() => import('../UI/MermaidDiagram'));

export default function StoryboardEditor() {
  const editor = useStoryboardEditor();
  const [activeTab, setActiveTab] = useState<EditorTabType>('frames');

  const hasStoryboard = editor.storyboard && editor.storyboard.length > 0;

  const tabs: Array<{ id: EditorTabType; label: string; icon: string; show: boolean }> = [
    { id: 'historia', label: 'Historia', icon: '📖', show: true },
    { id: 'frames', label: 'Frames', icon: '🎬', show: true },
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
        navigate={editor.navigate}
        isEditMode={true}
        id={editor.id}
        storyboardTitle={editor.storyboardTitle}
        setStoryboardTitle={editor.setStoryboardTitle}
        storyboard={editor.storyboard}
        inputMode={editor.inputMode}
        isSaving={editor.isSaving}
        saveStoryboard={editor.saveStoryboard}
        allowCinema={editor.allowCinema}
        onCinemaToggle={editor.setAllowCinema}
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
                  <p className="text-slate-200 whitespace-pre-wrap leading-relaxed text-lg">
                    {editor.originalText}
                  </p>
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
                generatingFrame={editor.generatingFrame}
                isEditMode={true}
                openImageModal={editor.openImageModal}
                setLightboxImage={editor.setLightboxImage}
              />
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
