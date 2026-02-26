import { useState, useEffect, useRef } from 'react';

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
  const [isFullscreen, setIsFullscreen] = useState(false);
  const thumbnailContainerRef = useRef<HTMLDivElement>(null);

  const totalFrames = frames.length;

  const goToPrevious = () => {
    setCurrentIndex((prev) => (prev === 0 ? totalFrames - 1 : prev - 1));
  };

  const goToNext = () => {
    setCurrentIndex((prev) => (prev === totalFrames - 1 ? 0 : prev + 1));
  };

  const goToFrame = (index: number) => {
    setCurrentIndex(index);
  };

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  // Handle keyboard navigation in fullscreen
  useEffect(() => {
    if (!isFullscreen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'ArrowLeft':
          goToPrevious();
          break;
        case 'ArrowRight':
          goToNext();
          break;
        case 'Escape':
          setIsFullscreen(false);
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isFullscreen, currentIndex, goToPrevious, goToNext]);

  // Lock body scroll when fullscreen
  useEffect(() => {
    if (isFullscreen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isFullscreen]);

  // Auto-scroll thumbnail into view in fullscreen
  useEffect(() => {
    if (!isFullscreen || !thumbnailContainerRef.current) return;

    const container = thumbnailContainerRef.current;
    const thumbnails = container.children;
    if (thumbnails[currentIndex]) {
      const thumbnail = thumbnails[currentIndex] as HTMLElement;
      thumbnail.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
    }
  }, [currentIndex, isFullscreen]);

  // Show all frames, not just those with images
  if (frames.length === 0) {
    return null; // Don't render carousel if no frames
  }

  const currentFrame = frames[currentIndex];

  return (
    <>
      {/* Normal Carousel */}
      <div className={`mb-8 animate-slide-up ${isFullscreen ? 'hidden' : ''}`}>
        <div className="relative bg-slate-900/50 backdrop-blur rounded-2xl border border-slate-700/50 overflow-hidden">
          {/* Main Image Display */}
          <div className="relative aspect-video bg-slate-950/50">
            {currentFrame.imageUrl ? (
              <>
                <img
                  src={currentFrame.imageUrl}
                  alt={`Frame ${currentFrame.frame}: ${currentFrame.scene}`}
                  className="w-full h-full object-contain animate-fade-in"
                  style={{ animationDuration: '200ms' }}
                />

                {/* Fullscreen & Expand Buttons */}
                <div className="absolute top-4 right-4 flex gap-2">
                  {/* Fullscreen Button */}
                  <button
                    onClick={toggleFullscreen}
                    className="p-2 rounded-full bg-black/70 backdrop-blur text-white hover:bg-black/90 transition-colors"
                    title="Modo pantalla completa"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4"
                      />
                    </svg>
                  </button>

                  {/* Expand Icon */}
                  {onImageClick && (
                    <button
                      onClick={() =>
                        onImageClick(
                          currentFrame.imageUrl!,
                          `Frame #${currentFrame.frame}: ${currentFrame.scene}`
                        )
                      }
                      className="p-2 rounded-full bg-black/70 backdrop-blur text-white hover:bg-black/90 transition-colors"
                      title="Ver en pantalla completa"
                    >
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
                          d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7"
                        />
                      </svg>
                    </button>
                  )}
                </div>
              </>
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center text-slate-400">
                <svg
                  className="w-16 h-16 mb-3"
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
                <p className="text-sm">Sin imagen generada</p>
              </div>
            )}

            {/* Frame Number Badge */}
            <div className="absolute top-4 left-4">
              <span className="inline-block px-3 py-1.5 rounded-full bg-black/70 backdrop-blur text-white text-sm font-bold shadow-lg">
                Frame #{currentFrame.frame}
              </span>
            </div>

            {/* Navigation Buttons */}
            {totalFrames > 1 && (
              <>
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
            <div className="flex items-center justify-between">
              <h3 className="text-white font-semibold text-lg flex-1">{currentFrame.scene}</h3>
              <div className="text-slate-400 text-sm font-medium ml-4">
                {currentIndex + 1} / {totalFrames}
              </div>
            </div>

            {currentFrame.dialogue && (
              <div className="bg-slate-800/50 rounded-lg p-3 border-l-4 border-indigo-500">
                <p className="text-slate-200 text-sm italic">
                  &ldquo;{currentFrame.dialogue}&rdquo;
                </p>
              </div>
            )}

            {currentFrame.visualDescription && (
              <p className="text-slate-300 text-sm leading-relaxed">
                {currentFrame.visualDescription}
              </p>
            )}

            {totalFrames > 1 && (
              <div className="pt-4 border-t border-slate-700/50">
                <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                  {frames.map((frame, index) => (
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
                      {frame.imageUrl ? (
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
                      ) : (
                        <div className="w-full h-full bg-slate-800 flex items-center justify-center">
                          <svg
                            className="w-6 h-6 text-slate-600"
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
                          <span className="absolute bottom-1 left-1 text-white text-xs font-bold">
                            #{frame.frame}
                          </span>
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Fullscreen Mode */}
      {isFullscreen && (
        <div className="fixed inset-0 z-50 bg-black flex flex-col">
          {/* Header Bar */}
          <div className="shrink-0 bg-gradient-to-b from-black/80 to-transparent p-4 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <h3 className="text-white font-semibold text-lg">{currentFrame.scene}</h3>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-white text-sm font-medium">
                {currentIndex + 1} / {totalFrames}
              </div>
              <button
                onClick={toggleFullscreen}
                className="p-2 rounded-full bg-white/10 backdrop-blur text-white hover:bg-white/20 transition-colors"
                title="Salir de pantalla completa (ESC)"
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
          </div>

          {/* Main Image Area */}
          <div className="flex-1 relative min-h-0 flex items-center justify-center p-4">
            {currentFrame.imageUrl ? (
              <img
                src={currentFrame.imageUrl}
                alt={`Frame ${currentFrame.frame}: ${currentFrame.scene}`}
                className="max-w-full max-h-full object-contain animate-fade-in"
                style={{ animationDuration: '200ms' }}
              />
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
                  onClick={goToPrevious}
                  className="btn-press-scale absolute left-2 sm:left-8 top-1/2 -translate-y-1/2 p-3 sm:p-4 rounded-full bg-white/10 backdrop-blur text-white hover:bg-white/20 transition-all shadow-2xl"
                  aria-label="Frame anterior"
                >
                  <svg
                    className="w-6 h-6 sm:w-8 sm:h-8"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 19l-7-7 7-7"
                    />
                  </svg>
                </button>

                <button
                  onClick={goToNext}
                  className="btn-press-scale absolute right-2 sm:right-8 top-1/2 -translate-y-1/2 p-3 sm:p-4 rounded-full bg-white/10 backdrop-blur text-white hover:bg-white/20 transition-all shadow-2xl"
                  aria-label="Frame siguiente"
                >
                  <svg
                    className="w-6 h-6 sm:w-8 sm:h-8"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
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

          {/* Thumbnail Navigation */}
          {totalFrames > 1 && (
            <div className="shrink-0 bg-gradient-to-t from-black/80 to-transparent p-4">
              <div
                ref={thumbnailContainerRef}
                className="flex gap-3 overflow-x-auto pb-2"
                style={{
                  scrollbarWidth: 'thin',
                  scrollbarColor: 'rgba(255,255,255,0.3) transparent',
                }}
              >
                {frames.map((frame, index) => (
                  <button
                    key={frame.frame}
                    onClick={() => goToFrame(index)}
                    className={`interactive shrink-0 relative rounded-lg overflow-hidden transition-all ${
                      index === currentIndex
                        ? 'ring-2 ring-white ring-offset-2 ring-offset-black'
                        : 'opacity-50 hover:opacity-100'
                    }`}
                    style={{ width: '120px', height: '90px' }}
                  >
                    {frame.imageUrl ? (
                      <>
                        <img
                          src={frame.imageUrl}
                          alt={`Frame ${frame.frame}`}
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                        <span className="absolute bottom-2 left-2 text-white text-sm font-bold">
                          #{frame.frame}
                        </span>
                      </>
                    ) : (
                      <div className="w-full h-full bg-slate-800 flex items-center justify-center">
                        <svg
                          className="w-8 h-8 text-slate-600"
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
                        <span className="absolute bottom-2 left-2 text-white text-sm font-bold">
                          #{frame.frame}
                        </span>
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </>
  );
}
