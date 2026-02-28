import type { StoryboardFrame } from './types';

interface FrameReferenceSelectorProps {
  frames: StoryboardFrame[];
  currentFrameNumber: number;
  selectedFrameNumber: number | null;
  onSelectFrame: (frameNumber: number) => void;
}

export default function FrameReferenceSelector({
  frames,
  currentFrameNumber,
  selectedFrameNumber,
  onSelectFrame,
}: FrameReferenceSelectorProps) {
  // Filter frames with images, excluding the current frame
  const availableFrames = frames.filter(
    (frame) => frame.imageUrl && frame.frame !== currentFrameNumber
  );

  if (availableFrames.length === 0) {
    return (
      <div className="p-8 bg-slate-800/50 rounded-lg border border-slate-700 text-center">
        <div className="text-4xl mb-3">📷</div>
        <p className="text-slate-400 text-sm">
          No hay frames con imágenes generadas.
        </p>
        <p className="text-slate-500 text-xs mt-1">
          Genera al menos una imagen primero.
        </p>
      </div>
    );
  }

  return (
    <div>
      <label className="block text-sm text-slate-400 mb-3">
        Selecciona un frame como referencia
      </label>
      <div className="grid grid-cols-3 gap-3 max-h-60 overflow-y-auto pr-2">
        {availableFrames.map((frame) => {
          const isSelected = selectedFrameNumber === frame.frame;
          const isCurrentFrame = frame.frame === currentFrameNumber;

          return (
            <button
              key={frame.frame}
              onClick={() => !isCurrentFrame && onSelectFrame(frame.frame)}
              disabled={isCurrentFrame}
              className={`relative rounded-lg overflow-hidden border-2 transition-all ${
                isSelected
                  ? 'border-violet-500 shadow-lg shadow-violet-500/30 scale-105'
                  : isCurrentFrame
                  ? 'border-slate-700 opacity-50 cursor-not-allowed'
                  : 'border-slate-700 hover:border-slate-500'
              }`}
              title={
                isCurrentFrame
                  ? 'No puedes seleccionar el frame actual'
                  : `Frame #${frame.frame}: ${frame.scene}`
              }
            >
              {/* Thumbnail */}
              <div className="aspect-square relative">
                <img
                  src={frame.imageUrl}
                  alt={`Frame ${frame.frame}`}
                  className="w-full h-full object-cover"
                />
                {/* Frame number badge */}
                <div
                  className={`absolute top-2 left-2 px-2 py-1 rounded text-xs font-bold ${
                    isSelected
                      ? 'bg-violet-600 text-white'
                      : 'bg-black/70 text-white'
                  }`}
                >
                  #{frame.frame}
                </div>
                {/* Selected indicator */}
                {isSelected && (
                  <div className="absolute inset-0 bg-violet-600/20 flex items-center justify-center">
                    <div className="w-10 h-10 bg-violet-600 rounded-full flex items-center justify-center">
                      <svg
                        className="w-6 h-6 text-white"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={3}
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                    </div>
                  </div>
                )}
                {/* Disabled overlay */}
                {isCurrentFrame && (
                  <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                    <span className="text-white text-xs font-semibold">
                      Frame actual
                    </span>
                  </div>
                )}
              </div>
              {/* Scene title */}
              <div className="p-2 bg-slate-800/80 text-xs text-slate-300 line-clamp-2">
                {frame.scene}
              </div>
            </button>
          );
        })}
      </div>
      {selectedFrameNumber && (
        <p className="text-xs text-violet-400 mt-3">
          Frame #{selectedFrameNumber} seleccionado como referencia
        </p>
      )}
    </div>
  );
}
