import type { StoryboardFrame, LightboxImage } from './types';

interface StoryboardFrameGridProps {
  storyboard: StoryboardFrame[];
  frameImages: Map<number, string>;
  generatingFrame: number | null;
  isEditMode: boolean;
  openImageModal: (frame: StoryboardFrame) => void;
  setLightboxImage: (img: LightboxImage | null) => void;
  updateFrame: (frameNumber: number, updates: Partial<StoryboardFrame>) => void;
}

export default function StoryboardFrameGrid({
  storyboard,
  frameImages,
  generatingFrame,
  isEditMode,
  openImageModal,
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
          isGenerating={generatingFrame === frame.frame}
          isEditMode={isEditMode}
          onGenerateImage={() => openImageModal(frame)}
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
  isGenerating: boolean;
  isEditMode: boolean;
  onGenerateImage: () => void;
  onViewImage: () => void;
  updateFrame: (frameNumber: number, updates: Partial<StoryboardFrame>) => void;
}

function FrameCard({
  frame,
  imageUrl,
  isGenerating,
  isEditMode,
  onGenerateImage,
  onViewImage,
  updateFrame,
}: FrameCardProps) {
  return (
    <div className="group bg-gradient-to-br from-slate-900/80 to-slate-800/80 backdrop-blur rounded-2xl border border-slate-700/50 overflow-hidden hover:border-indigo-500/50 transition-all duration-300 hover:shadow-2xl hover:shadow-indigo-500/10 hover:-translate-y-1">
      {/* Header */}
      <div className="bg-gradient-to-r from-slate-800/80 to-slate-700/80 px-4 py-3 border-b border-slate-700/50 flex items-center gap-3">
        <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center text-white text-sm font-bold shadow-lg">
          #{frame.frame}
        </div>
        <div className="flex-1">
          <label className="block text-slate-400 text-xs mb-1">Escena/Título</label>
          <input
            type="text"
            value={frame.scene}
            onChange={(e) => updateFrame(frame.frame, { scene: e.target.value })}
            className="w-full px-2 py-1 bg-slate-800 text-white rounded border border-slate-700 focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 outline-none transition-all text-sm font-semibold"
            placeholder="Título de la escena"
          />
        </div>
      </div>

      {/* Content */}
      <div className="p-4 space-y-3">
        <div>
          <label className="block text-sm text-slate-400 mb-2">Descripción Visual</label>
          <textarea
            value={frame.visualDescription}
            onChange={(e) => updateFrame(frame.frame, { visualDescription: e.target.value })}
            rows={4}
            className="w-full px-3 py-2 bg-slate-800 text-white rounded-lg border border-slate-700 focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 outline-none transition-all resize-y text-sm leading-relaxed"
            placeholder="Descripción visual del frame para generar imagen..."
          />
        </div>

        <div className="pt-2 border-t border-slate-700/50">
          <label className="block text-sm text-slate-400 mb-2">Diálogo (opcional)</label>
          <textarea
            value={frame.dialogue || ''}
            onChange={(e) => updateFrame(frame.frame, { dialogue: e.target.value })}
            rows={2}
            className="w-full px-3 py-2 bg-slate-800 text-white rounded-lg border border-slate-700 focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 outline-none transition-all resize-y text-sm italic"
            placeholder="Diálogo del personaje (opcional)..."
          />
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
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onGenerateImage();
                }}
                disabled={isGenerating}
                className="mt-3 w-full py-2.5 px-4 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white rounded-lg font-semibold text-sm transition-all shadow-lg shadow-indigo-500/20 disabled:opacity-50 flex items-center justify-center gap-2"
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
