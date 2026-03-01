import { useEffect } from 'react';

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
  genre?: string;
  thumbnailUrl: string | null;
  frameCount: number;
  duration: string;
  createdAt: string;
  frames: Frame[];
  compiledVideoUrl?: string;
}

interface HeroSectionProps {
  storyboard: Storyboard;
  onPlayVideo?: (videoUrl: string) => void;
  onOpenCarousel?: () => void;
}

export default function HeroSection({ storyboard, onPlayVideo, onOpenCarousel }: HeroSectionProps) {
  // Future: Auto-rotate through frames carousel
  useEffect(() => {
    // Placeholder for future carousel implementation
  }, []);

  const handleClick = () => {
    // Prioridad 1: Video compilado
    if (storyboard.compiledVideoUrl && onPlayVideo) {
      onPlayVideo(storyboard.compiledVideoUrl);
    } 
    // Prioridad 2: Carrusel (fallback)
    else if (onOpenCarousel) {
      onOpenCarousel();
    }
  };

  return (
    <div className="relative h-[70vh] sm:h-[80vh] mb-8 overflow-hidden">
      {/* Background Image */}
      <div className="absolute inset-0">
        {storyboard.thumbnailUrl ? (
          <img
            src={storyboard.thumbnailUrl}
            alt={storyboard.title}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full bg-slate-900" />
        )}
      </div>

      {/* Gradient Overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black via-black/60 to-transparent" />
      <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-transparent to-transparent" />

      {/* Content */}
      <div className="relative h-full flex items-end sm:items-center px-4 sm:px-8 pb-20 sm:pb-0">
        <div className="max-w-2xl space-y-4">
          <h1 className="text-4xl sm:text-5xl md:text-7xl font-bold text-white leading-tight">
            {storyboard.title}
          </h1>

          {storyboard.description && (
            <p className="text-base sm:text-lg text-slate-300 line-clamp-3">
              {storyboard.description}
            </p>
          )}

          <div className="flex items-center gap-4 text-sm text-slate-300">
            <span className="flex items-center gap-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M7 4v16M17 4v16M3 8h4m10 0h4M3 12h18M3 16h4m10 0h4M4 20h16a1 1 0 001-1V5a1 1 0 00-1-1H4a1 1 0 00-1 1v14a1 1 0 001 1z"
                />
              </svg>
              {storyboard.frameCount} frames
            </span>
            <span>•</span>
            <span className="flex items-center gap-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              {storyboard.duration}
            </span>
          </div>

          <button
            onClick={handleClick}
            className="mt-6 px-8 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-semibold rounded-lg transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-105 flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            {storyboard.compiledVideoUrl ? 'Ver Video' : 'Ver Storyboard'}
          </button>
        </div>
      </div>
    </div>
  );
}
