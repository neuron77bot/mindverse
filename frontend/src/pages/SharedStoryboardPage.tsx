import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';

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
  frames: Frame[];
}

export default function SharedStoryboardPage() {
  const { id } = useParams<{ id: string }>();
  const [storyboard, setStoryboard] = useState<Storyboard | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStoryboard = async () => {
      try {
        const response = await fetch(`/api/storyboards/shared/${id}`);
        if (!response.ok) {
          throw new Error('Storyboard no encontrado o no es público');
        }
        const data = await response.json();
        setStoryboard(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error al cargar storyboard');
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchStoryboard();
    }
  }, [id]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!storyboard) return;

      switch (e.key) {
        case 'ArrowLeft':
          setCurrentIndex((prev) => (prev === 0 ? storyboard.frames.length - 1 : prev - 1));
          break;
        case 'ArrowRight':
          setCurrentIndex((prev) => (prev === storyboard.frames.length - 1 ? 0 : prev + 1));
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [storyboard]);

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black flex items-center justify-center">
        <div className="text-white text-lg">Cargando...</div>
      </div>
    );
  }

  if (error || !storyboard) {
    return (
      <div className="fixed inset-0 bg-black flex items-center justify-center">
        <div className="text-center">
          <div className="text-white text-xl mb-4">⚠️ {error || 'Storyboard no encontrado'}</div>
          <p className="text-slate-400">Este storyboard no está disponible públicamente</p>
        </div>
      </div>
    );
  }

  const totalFrames = storyboard.frames.length;
  const currentFrame = storyboard.frames[currentIndex];

  const goToPrevious = () => {
    setCurrentIndex((prev) => (prev === 0 ? totalFrames - 1 : prev - 1));
  };

  const goToNext = () => {
    setCurrentIndex((prev) => (prev === totalFrames - 1 ? 0 : prev + 1));
  };

  return (
    <div className="fixed inset-0 bg-black flex flex-col">
      {/* Top Bar */}
      <div className="absolute top-4 left-4 right-4 z-10 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="text-white font-bold text-xl">{storyboard.title}</div>
          {storyboard.genre && (
            <span className="px-3 py-1 rounded-full bg-white/10 backdrop-blur text-white text-sm">
              {storyboard.genre}
            </span>
          )}
        </div>
        <div className="text-white text-sm font-medium bg-black/50 backdrop-blur px-3 py-1.5 rounded-full">
          {currentIndex + 1} / {totalFrames}
        </div>
      </div>

      {/* Main Image Area */}
      <div className="flex-1 relative min-h-0 flex items-center justify-center p-4 pb-0">
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

      {/* Info Footer */}
      <div className="shrink-0 bg-gradient-to-t from-black/80 to-transparent p-6 space-y-3">
        {currentFrame.dialogue && (
          <div className="max-w-2xl mx-auto bg-white/10 backdrop-blur rounded-lg p-4 border-l-4 border-white/30">
            <p className="text-white text-base italic text-center">
              &ldquo;{currentFrame.dialogue}&rdquo;
            </p>
          </div>
        )}
        <h3 className="text-white font-semibold text-lg text-center">{currentFrame.scene}</h3>
      </div>

      {/* Powered by watermark */}
      <div className="absolute bottom-4 right-4 text-slate-400 text-xs opacity-50">
        Powered by Mindverse
      </div>
    </div>
  );
}
