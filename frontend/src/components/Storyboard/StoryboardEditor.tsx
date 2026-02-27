import { lazy, Suspense, useState } from 'react';
import type { EditorMode, EditorTabType } from './editor/types';
import { useStoryboardEditor } from './editor/useStoryboardEditor';
import EditorHeader from './editor/EditorHeader';
import InputModeSelector from './editor/InputModeSelector';
import VoiceRecorder from './editor/VoiceRecorder';
import TextInputPanel from './editor/TextInputPanel';
import StoryboardFrameGrid from './editor/StoryboardFrameGrid';
import BatchImageGeneration from './editor/BatchImageGeneration';
import ImageGenerationModal from './editor/ImageGenerationModal';
import LightboxModal from './editor/LightboxModal';

const MermaidDiagram = lazy(() => import('../UI/MermaidDiagram'));

interface StoryboardEditorProps {
  mode: EditorMode;
}

export default function StoryboardEditor({ mode }: StoryboardEditorProps) {
  const editor = useStoryboardEditor(mode);
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
      <EditorHeader
        navigate={editor.navigate}
        isEditMode={editor.isEditMode}
        id={editor.id}
        storyboardTitle={editor.storyboardTitle}
        setStoryboardTitle={editor.setStoryboardTitle}
        storyboard={editor.storyboard}
        inputMode={editor.inputMode}
        isSaving={editor.isSaving}
        saveStoryboard={editor.saveStoryboard}
      />

      {/* ── Pre-storyboard: input area (create mode only) ── */}
      {!editor.isEditMode && !hasStoryboard && (
        <div className="max-w-7xl mx-auto p-6">
          <InputModeSelector
            inputMode={editor.inputMode}
            recordingState={editor.recordingState}
            handleModeChange={editor.handleModeChange}
          />

          {/* Insecure context warning */}
          {editor.inputMode === 'voice' && !editor.isSecureContext && (
            <div className="mb-6 p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
              <div className="flex items-start gap-3">
                <svg
                  className="w-5 h-5 text-yellow-500 shrink-0 mt-0.5"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                    clipRule="evenodd"
                  />
                </svg>
                <div>
                  <p className="text-yellow-400 font-medium text-sm mb-1">
                    Conexión no segura (HTTP)
                  </p>
                  <p className="text-yellow-300/80 text-xs">
                    La grabación de audio requiere HTTPS. Accedé desde{' '}
                    <code className="bg-black/30 px-1 py-0.5 rounded">https://</code> para habilitar
                    el micrófono.
                  </p>
                </div>
              </div>
            </div>
          )}

          {editor.inputMode === 'voice' && (
            <VoiceRecorder
              recordingState={editor.recordingState}
              hasMediaDevices={editor.hasMediaDevices}
              duration={editor.duration}
              transcription={editor.transcription}
              formatDuration={editor.formatDuration}
              startRecording={editor.startRecording}
              stopRecording={editor.stopRecording}
              pauseRecording={editor.pauseRecording}
              resumeRecording={editor.resumeRecording}
              newRecording={editor.newRecording}
            />
          )}

          {editor.inputMode === 'text' && (
            <TextInputPanel
              textInput={editor.textInput}
              setTextInput={editor.setTextInput}
              isAnalyzing={editor.isAnalyzing}
            />
          )}

          {editor.error && (
            <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm">
              {editor.error}
            </div>
          )}

          {editor.inputMode === 'voice' && editor.transcription && (
            <div className="mb-6 p-6 bg-slate-800 rounded-xl border border-slate-700">
              <h3 className="text-white font-semibold mb-3">Transcripción:</h3>
              <p className="text-slate-300 leading-relaxed whitespace-pre-wrap">
                {editor.transcription}
              </p>
            </div>
          )}

          {editor.hasContent && (
            <div className="mb-6">
              <button
                onClick={editor.analyzeWithAI}
                disabled={editor.isAnalyzing}
                className="w-full py-3 px-6 bg-gradient-to-r from-slate-700 to-slate-800 hover:from-slate-600 hover:to-slate-700 text-white rounded-lg font-medium transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed border border-slate-600"
              >
                {editor.isAnalyzing ? (
                  <>
                    <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
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
                    Generando storyboard...
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                      <path
                        fillRule="evenodd"
                        d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z"
                        clipRule="evenodd"
                      />
                    </svg>
                    Generar Storyboard (6-8 viñetas)
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      )}

      {/* ── Navigation Tabs (once storyboard exists) ── */}
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
                    {editor.inputMode === 'voice' ? editor.transcription : editor.textInput}
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

              {/* Re-analyze (create only) */}
              {!editor.isEditMode && (
                <button
                  onClick={editor.analyzeWithAI}
                  disabled={editor.isAnalyzing}
                  className="w-full py-3 px-6 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white rounded-lg font-semibold transition-all shadow-lg shadow-indigo-500/20 disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                    />
                  </svg>
                  Volver a analizar
                </button>
              )}

              {/* Save (create only) */}
              {!editor.isEditMode && (
                <div className="p-4 bg-gradient-to-br from-blue-900/20 to-purple-900/20 rounded-lg border border-blue-500/30">
                  <h4 className="text-white font-medium mb-3">Guardar Storyboard</h4>
                  <input
                    type="text"
                    value={editor.storyboardTitle}
                    onChange={(e) => editor.setStoryboardTitle(e.target.value)}
                    placeholder="Título del storyboard..."
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 mb-3"
                  />
                  <button
                    onClick={editor.saveStoryboard}
                    disabled={editor.isSaving || !editor.storyboardTitle.trim()}
                    className="w-full py-2 px-4 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {editor.isSaving ? (
                      <>
                        <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
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
                        Guardando...
                      </>
                    ) : (
                      <>
                        <svg
                          className="w-5 h-5"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4"
                          />
                        </svg>
                        Guardar Storyboard
                      </>
                    )}
                  </button>
                </div>
              )}
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
                isEditMode={editor.isEditMode}
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
