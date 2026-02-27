interface StoryboardCardProps {
  storyboard: {
    _id: string;
    title: string;
    thumbnailUrl: string | null;
    frameCount: number;
    duration: string;
  };
  onClick: () => void;
}

export default function StoryboardCard({ storyboard, onClick }: StoryboardCardProps) {
  return (
    <div
      onClick={onClick}
      className="group relative flex-shrink-0 w-64 cursor-pointer transition-all duration-300 hover:scale-105"
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

        {/* Overlay on hover */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-4">
          <p className="text-white text-sm font-medium mb-1">{storyboard.title}</p>
          <div className="flex items-center gap-2 text-slate-300 text-xs">
            <span>{storyboard.frameCount} frames</span>
            <span>•</span>
            <span>{storyboard.duration}</span>
          </div>
        </div>
      </div>

      {/* Title below (visible on desktop) */}
      <h3 className="mt-2 text-sm font-medium text-slate-300 line-clamp-1 hidden sm:block">
        {storyboard.title}
      </h3>
    </div>
  );
}
