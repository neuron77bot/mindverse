import { useEffect, useState } from 'react';

interface Frame {
  frame: number;
  scene: string;
  visualDescription: string;
  dialogue?: string;
  imageUrl?: string;
}

interface Storyboard {
  _id: string;
  title: string;
  description?: string;
  frames: Frame[];
}

interface StoryboardModalProps {
  storyboard: Storyboard;
  onClose: () => void;
}

export default function StoryboardModal({ storyboard, onClose }: StoryboardModalProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [imageLoading, setImageLoading] = useState(false);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!storyboard) return;

      switch (e.key) {
        case 'ArrowLeft':
          setCurrentIndex((prev) => Math.max(0, prev - 1));
          break;
        case 'ArrowRight':
          setCurrentIndex((prev) => Math.min(storyboard.frames.length - 1, prev + 1));
          break;
        case 'Escape':
          onClose();
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [storyboard, onClose]);

  // Reset image loading on frame change
  useEffect(() => {
    setImageLoading(true);
  }, [currentIndex]);

  const currentFrame = storyboard.frames[currentIndex];
  const totalFrames = storyboard.frames.length;

  return (
    <div
      className="fixed inset-0 z-50 bg-black/95 backdrop-blur-sm flex flex-col"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      {/* Close Button */}
      <button
        onClick={onClose}
        className="absolute top-4 right-4 z-10 p-2 rounded-full bg-white/10 backdrop-blur text-white hover:bg-white/20 transition-all"
        aria-label="Cerrar"
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

      {/* Header */}
      <div className="absolute top-4 left-4 right-16 z-10">
        <h2 className="text-white font-bold text-xl sm:text-2xl">{storyboard.title}</h2>
        <div className="text-white text-sm mt-1 bg-black/50 backdrop-blur px-3 py-1 rounded-full inline-block">
          {currentIndex + 1} / {totalFrames}
        </div>
      </div>

      {/* Main Image */}
      <div className="flex-1 flex items-center justify-center p-4 pt-20">
        {currentFrame.imageUrl ? (
          <>
            {imageLoading && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-16 h-16 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
              </div>
            )}
            <img
              src={currentFrame.imageUrl}
              alt={`Frame ${currentFrame.frame}: ${currentFrame.scene}`}
              className={`max-w-full max-h-full object-contain transition-opacity duration-200 ${
                imageLoading ? 'opacity-0' : 'opacity-100'
              }`}
              onLoad={() => setImageLoading(false)}
              onError={() => setImageLoading(false)}
            />
          </>
        ) : (
          <div className="text-center text-slate-400">
            <svg
              className="w-24 h-24 mx-auto mb-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
            <p>Sin imagen generada</p>
          </div>
        )}

        {/* Navigation Buttons */}
        {totalFrames > 1 && (
          <>
            <button
              onClick={() => setCurrentIndex((prev) => Math.max(0, prev - 1))}
              disabled={currentIndex === 0}
              className="absolute left-4 top-1/2 -translate-y-1/2 p-3 rounded-full bg-white/10 backdrop-blur text-white hover:bg-white/20 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
              aria-label="Frame anterior"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 19l-7-7 7-7"
                />
              </svg>
            </button>

            <button
              onClick={() => setCurrentIndex((prev) => Math.min(totalFrames - 1, prev + 1))}
              disabled={currentIndex === totalFrames - 1}
              className="absolute right-4 top-1/2 -translate-y-1/2 p-3 rounded-full bg-white/10 backdrop-blur text-white hover:bg-white/20 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
              aria-label="Frame siguiente"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </button>
          </>
        )}
      </div>

      {/* Footer Info */}
      <div className="shrink-0 bg-gradient-to-t from-black/80 to-transparent p-6 space-y-3">
        {currentFrame.dialogue && (
          <div className="max-w-2xl mx-auto bg-white/10 backdrop-blur rounded-lg p-4 border-l-4 border-indigo-500">
            <p className="text-white text-base italic text-center">
              &ldquo;{currentFrame.dialogue}&rdquo;
            </p>
          </div>
        )}
        <h3 className="text-white font-semibold text-lg text-center">{currentFrame.scene}</h3>
        <p className="text-slate-300 text-sm text-center max-w-3xl mx-auto">
          {currentFrame.visualDescription}
        </p>
      </div>
    </div>
  );
}
