import { useState, useRef, useEffect } from 'react';
import type { StoryboardFrame, LightboxImage } from './types';

interface StoryboardFrameGridProps {
  storyboard: StoryboardFrame[];
  frameImages: Map<number, string>;
  frameVideos: Map<number, string>;
  generatingFrame: number | null;
  generatingVideoFrame: number | null;
  isEditMode: boolean;
  openImageModal: (frame: StoryboardFrame) => void;
  openVideoModal: (frame: StoryboardFrame) => void;
  setLightboxImage: (img: LightboxImage | null) => void;
  updateFrame: (frameNumber: number, updates: Partial<StoryboardFrame>) => void;
}

export default function StoryboardFrameGrid({
  storyboard,
  frameImages,
  frameVideos,
  generatingFrame,
  generatingVideoFrame,
  isEditMode,
  openImageModal,
  openVideoModal,
  setLightboxImage,
  updateFrame,
}: StoryboardFrameGridProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
      {storyboard.map((frame) => (
        <FrameCard
          key={frame.frame}
          frame={frame}
          imageUrl={frameImages.get(frame.frame)}
          videoUrl={frameVideos.get(frame.frame)}
          isGenerating={generatingFrame === frame.frame}
          isGeneratingVideo={generatingVideoFrame === frame.frame}
          isEditMode={isEditMode}
          onGenerateImage={() => openImageModal(frame)}
          onGenerateVideo={() => openVideoModal(frame)}
          onViewImage={() =>
            setLightboxImage({
              url: frameImages.get(frame.frame)!,
              title: `Frame #${frame.frame}: ${frame.scene}`,
            })
          }
          updateFrame={updateFrame}
        />
      ))}
    </div>
  );
}

interface FrameCardProps {
  frame: StoryboardFrame;
  imageUrl: string | undefined;
  videoUrl: string | undefined;
  isGenerating: boolean;
  isGeneratingVideo: boolean;
  isEditMode: boolean;
  onGenerateImage: () => void;
  onGenerateVideo: () => void;
  onViewImage: () => void;
  updateFrame: (frameNumber: number, updates: Partial<StoryboardFrame>) => void;
}

function FrameCard({
  frame,
  imageUrl,
  videoUrl,
  isGenerating,
  isGeneratingVideo,
  isEditMode,
  onGenerateImage,
  onGenerateVideo,
  onViewImage,
  updateFrame,
}: FrameCardProps) {
  const [editingField, setEditingField] = useState<'scene' | 'visual' | 'dialogue' | null>(null);
  const sceneInputRef = useRef<HTMLInputElement>(null);
  const visualTextareaRef = useRef<HTMLTextAreaElement>(null);
  const dialogueTextareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-focus cuando un campo entra en modo edición
  useEffect(() => {
    if (editingField === 'scene' && sceneInputRef.current) {
      sceneInputRef.current.focus();
      // Posicionar cursor al inicio
      sceneInputRef.current.setSelectionRange(0, 0);
    } else if (editingField === 'visual' && visualTextareaRef.current) {
      visualTextareaRef.current.focus();
      // Posicionar cursor al inicio
      visualTextareaRef.current.setSelectionRange(0, 0);
    } else if (editingField === 'dialogue' && dialogueTextareaRef.current) {
      dialogueTextareaRef.current.focus();
      // Posicionar cursor al inicio
      dialogueTextareaRef.current.setSelectionRange(0, 0);
    }
  }, [editingField]);

  const handleBlur = () => {
    setEditingField(null);
  };

  const handleKeyDown = (e: React.KeyboardEvent, field: 'scene' | 'visual' | 'dialogue') => {
    if (e.key === 'Enter' && (field === 'scene' || e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      setEditingField(null);
    } else if (e.key === 'Escape') {
      setEditingField(null);
    }
  };

  return (
    <div className="group bg-gradient-to-br from-slate-900/80 to-slate-800/80 backdrop-blur rounded-2xl border border-slate-700/50 overflow-hidden hover:border-indigo-500/50 transition-all duration-300 hover:shadow-2xl hover:shadow-indigo-500/10 hover:-translate-y-1">
      {/* Header */}
      <div className="bg-gradient-to-r from-slate-800/80 to-slate-700/80 px-4 py-3 border-b border-slate-700/50 flex items-center gap-3">
        <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center text-white text-sm font-bold shadow-lg">
          #{frame.frame}
        </div>
        <div className="flex-1">
          <label className="block text-slate-400 text-xs mb-1">Escena/Título</label>
          {editingField === 'scene' ? (
            <input
              ref={sceneInputRef}
              type="text"
              value={frame.scene}
              onChange={(e) => updateFrame(frame.frame, { scene: e.target.value })}
              onBlur={handleBlur}
              onKeyDown={(e) => handleKeyDown(e, 'scene')}
              className="w-full px-2 py-1 bg-slate-800 text-white rounded border border-slate-700 focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 outline-none transition-all text-sm font-semibold"
              placeholder="Título de la escena"
            />
          ) : (
            <div
              onDoubleClick={() => setEditingField('scene')}
              className="w-full px-2 py-1 text-white text-sm font-semibold cursor-text hover:bg-slate-800/50 rounded transition-colors min-h-[28px]"
              title="Doble clic para editar"
            >
              {frame.scene || 'Sin título'}
            </div>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="p-4 space-y-3">
        <div>
          <label className="block text-sm text-slate-400 mb-2">Descripción Visual</label>
          {editingField === 'visual' ? (
            <textarea
              ref={visualTextareaRef}
              value={frame.visualDescription}
              onChange={(e) => updateFrame(frame.frame, { visualDescription: e.target.value })}
              onBlur={handleBlur}
              onKeyDown={(e) => handleKeyDown(e, 'visual')}
              rows={4}
              className="w-full px-3 py-2 bg-slate-800 text-white rounded-lg border border-slate-700 focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 outline-none transition-all resize text-sm leading-relaxed"
              style={{ resize: 'vertical', minHeight: '100px' }}
              placeholder="Descripción visual del frame para generar imagen..."
            />
          ) : (
            <div
              onDoubleClick={() => setEditingField('visual')}
              className="w-full px-3 py-2 text-white text-sm leading-relaxed cursor-text hover:bg-slate-800/50 rounded-lg transition-colors min-h-[100px] whitespace-pre-wrap"
              title="Doble clic para editar"
            >
              {frame.visualDescription || 'Sin descripción'}
            </div>
          )}
        </div>

        <div className="pt-2 border-t border-slate-700/50">
          <label className="block text-sm text-slate-400 mb-2">Diálogo (opcional)</label>
          {editingField === 'dialogue' ? (
            <textarea
              ref={dialogueTextareaRef}
              value={frame.dialogue || ''}
              onChange={(e) => updateFrame(frame.frame, { dialogue: e.target.value })}
              onBlur={handleBlur}
              onKeyDown={(e) => handleKeyDown(e, 'dialogue')}
              rows={2}
              className="w-full px-3 py-2 bg-slate-800 text-white rounded-lg border border-slate-700 focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 outline-none transition-all resize text-sm italic"
              style={{ resize: 'vertical', minHeight: '52px' }}
              placeholder="Diálogo del personaje (opcional)..."
            />
          ) : (
            <div
              onDoubleClick={() => setEditingField('dialogue')}
              className="w-full px-3 py-2 text-white text-sm italic cursor-text hover:bg-slate-800/50 rounded-lg transition-colors min-h-[52px] whitespace-pre-wrap"
              title="Doble clic para editar"
            >
              {frame.dialogue || 'Sin diálogo'}
            </div>
          )}
        </div>

        {imageUrl ? (
          <>
            <div
              className="relative aspect-video bg-slate-900/50 rounded border-2 border-slate-700 overflow-hidden cursor-pointer group"
              onClick={onViewImage}
            >
              <img
                src={imageUrl}
                alt={`Viñeta ${frame.frame}`}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-all duration-300 flex items-center justify-center opacity-0 group-hover:opacity-100">
                <svg
                  className="w-12 h-12 text-white drop-shadow-lg"
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
              </div>
            </div>
            {isEditMode && (
              <div className="mt-3 space-y-2">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onGenerateImage();
                  }}
                  disabled={isGenerating}
                  className="w-full py-2.5 px-4 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white rounded-lg font-semibold text-sm transition-all shadow-lg shadow-indigo-500/20 disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                    />
                  </svg>
                  Regenerar Imagen
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onGenerateVideo();
                  }}
                  disabled={isGeneratingVideo}
                  className="w-full py-2.5 px-4 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white rounded-lg font-semibold text-sm transition-all shadow-lg shadow-blue-500/20 disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {isGeneratingVideo ? (
                    <>
                      <svg
                        className="animate-spin h-4 w-4"
                        xmlns="http://www.w3.org/2000/svg"
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
                      Generando...
                    </>
                  ) : (
                    <>
                      🎬 Generar Video
                    </>
                  )}
                </button>
              </div>
            )}
            {videoUrl && (
              <div className="mt-3">
                <video
                  src={videoUrl}
                  controls
                  className="w-full rounded-lg border-2 border-slate-700"
                />
                <a
                  href={videoUrl}
                  download={`frame-${frame.frame}-video.mp4`}
                  className="mt-2 w-full py-2 px-4 bg-slate-700 hover:bg-slate-600 text-white rounded-lg font-medium text-sm transition-all flex items-center justify-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                    />
                  </svg>
                  Descargar Video
                </a>
              </div>
            )}
          </>
        ) : (
          <div className="aspect-video bg-slate-900/50 rounded border-2 border-slate-700 flex items-center justify-center overflow-hidden">
            <button
              onClick={onGenerateImage}
              disabled={isGenerating}
              className="w-full h-full flex flex-col items-center justify-center hover:bg-slate-800/50 transition-colors disabled:opacity-70"
            >
              {isGenerating ? (
                <>
                  <svg
                    className="w-10 h-10 text-slate-500 mb-2 animate-spin"
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
                  <p className="text-slate-500 text-xs">Generando...</p>
                </>
              ) : (
                <>
                  <svg
                    className="w-10 h-10 text-slate-500 mb-2"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <p className="text-slate-400 text-xs font-medium">Generar Imagen</p>
                  <p className="text-slate-600 text-xs mt-1">Click para crear</p>
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
