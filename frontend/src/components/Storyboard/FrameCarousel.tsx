import { useState } from 'react';

interface Frame {
  frame: number;
  scene: string;
  visualDescription: string;
  dialogue?: string;
  imageUrl?: string;
}

interface FrameCarouselProps {
  frames: Frame[];
  onImageClick?: (url: string, title: string) => void;
}

export default function FrameCarousel({ frames, onImageClick }: FrameCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0);

  // Filter frames that have images
  const framesWithImages = frames.filter((f) => f.imageUrl);

  if (framesWithImages.length === 0) {
    return null; // Don't render carousel if no images
  }

  const currentFrame = framesWithImages[currentIndex];
  const totalFrames = framesWithImages.length;

  const goToPrevious = () => {
    setCurrentIndex((prev) => (prev === 0 ? totalFrames - 1 : prev - 1));
  };

  const goToNext = () => {
    setCurrentIndex((prev) => (prev === totalFrames - 1 ? 0 : prev + 1));
  };

  const goToFrame = (index: number) => {
    setCurrentIndex(index);
  };

  return (
    <div className="mb-8 animate-slide-up">
      {/* Carousel Container */}
      <div className="relative bg-slate-900/50 backdrop-blur rounded-2xl border border-slate-700/50 overflow-hidden">
        {/* Main Image Display */}
        <div className="relative aspect-video bg-slate-950/50">
          {currentFrame.imageUrl && (
            <>
              <img
                src={currentFrame.imageUrl}
                alt={`Frame ${currentFrame.frame}: ${currentFrame.scene}`}
                className="w-full h-full object-contain animate-fade-in"
                style={{ animationDuration: '200ms' }}
              />

              {/* Frame Number Badge */}
              <div className="absolute top-4 left-4">
                <span className="inline-block px-3 py-1.5 rounded-full bg-black/70 backdrop-blur text-white text-sm font-bold shadow-lg">
                  Frame #{currentFrame.frame}
                </span>
              </div>

              {/* Expand Icon */}
              {onImageClick && (
                <button
                  onClick={() =>
                    onImageClick(
                      currentFrame.imageUrl!,
                      `Frame #${currentFrame.frame}: ${currentFrame.scene}`
                    )
                  }
                  className="absolute top-4 right-4 p-2 rounded-full bg-black/70 backdrop-blur text-white hover:bg-black/90 transition-colors"
                  title="Ver en pantalla completa"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7"
                    />
                  </svg>
                </button>
              )}
            </>
          )}

          {/* Navigation Buttons */}
          {totalFrames > 1 && (
            <>
              {/* Previous Button */}
              <button
                onClick={goToPrevious}
                className="btn-press-scale absolute left-4 top-1/2 -translate-y-1/2 p-3 rounded-full bg-black/70 backdrop-blur text-white hover:bg-black/90 transition-all shadow-lg"
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

              {/* Next Button */}
              <button
                onClick={goToNext}
                className="btn-press-scale absolute right-4 top-1/2 -translate-y-1/2 p-3 rounded-full bg-black/70 backdrop-blur text-white hover:bg-black/90 transition-all shadow-lg"
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

        {/* Frame Info & Thumbnails */}
        <div className="p-6 space-y-4">
          {/* Frame Title and Counter */}
          <div className="flex items-center justify-between">
            <h3 className="text-white font-semibold text-lg flex-1">{currentFrame.scene}</h3>
            <div className="text-slate-400 text-sm font-medium ml-4">
              {currentIndex + 1} / {totalFrames}
            </div>
          </div>

          {/* Frame Description */}
          {currentFrame.visualDescription && (
            <p className="text-slate-300 text-sm leading-relaxed">
              {currentFrame.visualDescription}
            </p>
          )}

          {/* Dialogue */}
          {currentFrame.dialogue && (
            <div className="bg-slate-800/50 rounded-lg p-3 border-l-4 border-indigo-500">
              <p className="text-slate-200 text-sm italic">&ldquo;{currentFrame.dialogue}&rdquo;</p>
            </div>
          )}

          {/* Thumbnail Navigation */}
          {totalFrames > 1 && (
            <div className="pt-4 border-t border-slate-700/50">
              <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                {framesWithImages.map((frame, index) => (
                  <button
                    key={frame.frame}
                    onClick={() => goToFrame(index)}
                    className={`interactive shrink-0 relative rounded-lg overflow-hidden transition-all ${
                      index === currentIndex
                        ? 'ring-2 ring-indigo-500 ring-offset-2 ring-offset-slate-900'
                        : 'opacity-60 hover:opacity-100'
                    }`}
                    style={{ width: '80px', height: '60px' }}
                  >
                    {frame.imageUrl && (
                      <>
                        <img
                          src={frame.imageUrl}
                          alt={`Frame ${frame.frame}`}
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                        <span className="absolute bottom-1 left-1 text-white text-xs font-bold">
                          #{frame.frame}
                        </span>
                      </>
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
