interface StoryboardCardProps {
  storyboard: {
    _id: string;
    title: string;
    thumbnailUrl: string | null;
    frameCount: number;
    duration: string;
    compiledVideoUrl?: string;
  };
  onPlayVideo?: (videoUrl: string) => void;
  onOpenCarousel?: () => void;
}

export default function StoryboardCard({ storyboard, onPlayVideo, onOpenCarousel }: StoryboardCardProps) {
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
    <div
      onClick={handleClick}
      className="group relative flex-shrink-0 w-64 cursor-pointer transition-all duration-300 hover:scale-105 select-none"
    >
      {/* Thumbnail */}
      <div className="relative aspect-video rounded-lg overflow-hidden bg-slate-900 border border-slate-800">
        {storyboard.thumbnailUrl ? (
          <img
            src={storyboard.thumbnailUrl}
            alt={storyboard.title}
            loading="lazy"
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-slate-600">
            <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
          </div>
        )}

        {/* Overlay con Play si hay video compilado */}
        {storyboard.compiledVideoUrl && (
          <div className="absolute inset-0 bg-black/40 flex items-center justify-center group-hover:bg-black/50 transition-all">
            {/* Botón Play */}
            <button className="w-16 h-16 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center group-hover:bg-white/30 group-hover:scale-110 transition-all">
              <svg 
                className="w-8 h-8 text-white ml-1" 
                fill="currentColor" 
                viewBox="0 0 24 24"
              >
                <path d="M8 5v14l11-7z" />
              </svg>
            </button>
            
            {/* Badge indicador */}
            <div className="absolute top-2 right-2 bg-gradient-to-r from-green-500 to-emerald-500 text-white px-2 py-1 rounded-full text-xs font-bold shadow-lg flex items-center gap-1">
              <span>🎬</span>
              <span>VIDEO</span>
            </div>
          </div>
        )}

        {/* Overlay on hover (solo si NO hay video compilado) */}
        {!storyboard.compiledVideoUrl && (
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-4">
            <p className="text-white text-sm font-medium mb-1">{storyboard.title}</p>
            <div className="flex items-center gap-2 text-slate-300 text-xs">
              <span>{storyboard.frameCount} frames</span>
              <span>•</span>
              <span>{storyboard.duration}</span>
            </div>
          </div>
        )}
      </div>

      {/* Title below (visible on desktop) */}
      <h3 className="mt-2 text-sm font-medium text-slate-300 line-clamp-1 hidden sm:block">
        {storyboard.title}
      </h3>
    </div>
  );
}
