import { lazy, Suspense } from 'react';
import type { EditorMode } from './editor/types';
import { useStoryboardEditor } from './editor/useStoryboardEditor';
import EditorHeader from './editor/EditorHeader';
import InputModeSelector from './editor/InputModeSelector';
import VoiceRecorder from './editor/VoiceRecorder';
import TextInputPanel from './editor/TextInputPanel';
import StoryboardFrameGrid from './editor/StoryboardFrameGrid';
import ComicPageSection from './editor/ComicPageSection';
import ImageGenerationModal from './editor/ImageGenerationModal';
import LightboxModal from './editor/LightboxModal';

const MermaidDiagram = lazy(() => import('../UI/MermaidDiagram'));

interface StoryboardEditorProps {
  mode: EditorMode;
}

export default function StoryboardEditor({ mode }: StoryboardEditorProps) {
  const editor = useStoryboardEditor(mode);

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
        storyboard={editor.storyboard}
        inputMode={editor.inputMode}
        isSaving={editor.isSaving}
        saveStoryboard={editor.saveStoryboard}
      />

      <div className="max-w-7xl mx-auto p-6">
        {/* Input mode selector (create only) */}
        {!editor.isEditMode && (
          <InputModeSelector
            inputMode={editor.inputMode}
            recordingState={editor.recordingState}
            handleModeChange={editor.handleModeChange}
          />
        )}

        {/* Insecure context warning (voice + create) */}
        {!editor.isEditMode && editor.inputMode === 'voice' && !editor.isSecureContext && (
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

        {/* Voice recorder (create + voice mode) */}
        {!editor.isEditMode && editor.inputMode === 'voice' && (
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

        {/* Text input (create + text mode) */}
        {!editor.isEditMode && editor.inputMode === 'text' && (
          <TextInputPanel
            textInput={editor.textInput}
            setTextInput={editor.setTextInput}
            isAnalyzing={editor.isAnalyzing}
          />
        )}

        {/* Error */}
        {editor.error && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm">
            {editor.error}
          </div>
        )}

        {/* Transcription (voice mode) */}
        {editor.inputMode === 'voice' && editor.transcription && (
          <div className="mb-6 p-6 bg-slate-800 rounded-xl border border-slate-700">
            <h3 className="text-white font-semibold mb-3">Transcripción:</h3>
            <p className="text-slate-300 leading-relaxed whitespace-pre-wrap">
              {editor.transcription}
            </p>
          </div>
        )}

        {/* Generate storyboard button (create only) */}
        {!editor.isEditMode && editor.hasContent && !editor.storyboard && (
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

        {/* Storyboard results */}
        {editor.storyboard && editor.storyboard.length > 0 && (
          <div className="mb-6 p-6 bg-gradient-to-br from-slate-900 to-slate-800 rounded-xl border-2 border-slate-700">
            {/* Original story */}
            <div className="mb-4 p-4 bg-slate-800/50 rounded-lg border border-slate-700/50">
              <h4 className="text-slate-400 text-sm font-medium mb-2">
                {editor.inputMode === 'voice' ? '🎙️ Historia original:' : '📝 Historia original:'}
              </h4>
              <p className="text-slate-300 text-sm leading-relaxed whitespace-pre-wrap">
                {editor.inputMode === 'voice' ? editor.transcription : editor.textInput}
              </p>
            </div>

            <div className="flex items-center justify-between mb-4">
              <h3 className="text-white font-semibold flex items-center gap-2">
                <svg className="w-5 h-5 text-slate-400" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z"
                    clipRule="evenodd"
                  />
                </svg>
                Storyboard ({editor.storyboard.length} viñetas)
              </h3>
              {!editor.isEditMode && (
                <button
                  onClick={() => {
                    editor.setStoryboard(null);
                    editor.setMermaidDiagram(null);
                  }}
                  className="text-slate-400 hover:text-white transition-colors"
                  title="Cerrar storyboard"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              )}
            </div>

            <StoryboardFrameGrid
              storyboard={editor.storyboard}
              frameImages={editor.frameImages}
              generatingFrame={editor.generatingFrame}
              isEditMode={editor.isEditMode}
              openImageModal={editor.openImageModal}
              setLightboxImage={editor.setLightboxImage}
            />

            <ComicPageSection
              storyboard={editor.storyboard}
              comicPageUrl={editor.comicPageUrl}
              isGeneratingComic={editor.isGeneratingComic}
              generateComicPage={editor.generateComicPage}
              setComicPageUrl={editor.setComicPageUrl}
            />

            {/* Mermaid timeline */}
            {editor.mermaidDiagram && (
              <div>
                <h4 className="text-white font-medium mb-3 flex items-center gap-2">
                  <svg
                    className="w-5 h-5 text-slate-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                    />
                  </svg>
                  Timeline de la historia
                </h4>
                <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700/50">
                  <Suspense
                    fallback={
                      <div className="flex items-center justify-center py-12">
                        <div className="icon-spin w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full" />
                      </div>
                    }
                  >
                    <MermaidDiagram chart={editor.mermaidDiagram} />
                  </Suspense>
                </div>
              </div>
            )}

            {/* Save section (create only) */}
            {!editor.isEditMode && (
              <div className="mt-6 p-4 bg-gradient-to-br from-blue-900/20 to-purple-900/20 rounded-lg border border-blue-500/30">
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

            {/* Re-analyze button (create only) */}
            {!editor.isEditMode && (
              <button
                onClick={editor.analyzeWithAI}
                disabled={editor.isAnalyzing}
                className="mt-4 w-full py-3 px-6 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white rounded-lg font-semibold transition-all shadow-lg shadow-indigo-500/20 disabled:opacity-50 flex items-center justify-center gap-2"
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
          </div>
        )}
      </div>

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
