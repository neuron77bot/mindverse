import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import HeroSection from '../components/Cinema/HeroSection';
import StoryboardRow from '../components/Cinema/StoryboardRow';
import StoryboardModal from '../components/Cinema/StoryboardModal';

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:3001';

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

interface CinemaData {
  user: {
    name: string;
    picture: string | null;
  };
  storyboards: Storyboard[];
}

export default function CinemaPage() {
  const [searchParams] = useSearchParams();
  const [data, setData] = useState<CinemaData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedStoryboard, setSelectedStoryboard] = useState<Storyboard | null>(null);
  const [playingVideo, setPlayingVideo] = useState<string | null>(null);

  // Handler para reproducir video compilado
  const handlePlayVideo = (videoUrl: string) => {
    setPlayingVideo(videoUrl);
    setSelectedStoryboard(null); // Asegurar que carrusel esté cerrado
  };

  // Handler para abrir carrusel
  const handleOpenCarousel = (storyboard: Storyboard) => {
    setSelectedStoryboard(storyboard);
    setPlayingVideo(null); // Asegurar que video esté cerrado
  };

  // Cerrar modal de video con ESC
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (playingVideo) {
          setPlayingVideo(null);
        }
        if (selectedStoryboard) {
          setSelectedStoryboard(null);
        }
      }
    };
    
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [playingVideo, selectedStoryboard]);

  useEffect(() => {
    const fetchCinema = async () => {
      const token = searchParams.get('token');

      try {
        let response;
        
        if (token) {
          // Acceso público con token
          response = await fetch(`${API_BASE}/cinema/${token}`);
        } else {
          // Acceso autenticado
          const authToken = localStorage.getItem('token');
          if (!authToken) {
            throw new Error('No autenticado');
          }
          
          response = await fetch(`${API_BASE}/cinema/me`, {
            headers: {
              'Authorization': `Bearer ${authToken}`,
            },
          });
        }

        if (!response.ok) {
          const errData = await response.json().catch(() => ({}));
          throw new Error(errData.error || 'Error al cargar cinema');
        }
        
        const result = await response.json();
        setData(result.data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error al cargar cinema');
      } finally {
        setLoading(false);
      }
    };

    fetchCinema();
  }, [searchParams]);

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 mx-auto border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-white text-lg">Cargando cinema...</p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="fixed inset-0 bg-black flex items-center justify-center">
        <div className="text-center px-4">
          <div className="text-6xl mb-4">🎬</div>
          <h1 className="text-white text-2xl font-bold mb-2">Cinema no disponible</h1>
          <p className="text-slate-400 mb-6">
            {error || 'No se pudo cargar el contenido. Verifica el enlace.'}
          </p>
          <a
            href="/"
            className="inline-block px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg transition-colors"
          >
            Ir al inicio
          </a>
        </div>
      </div>
    );
  }

  if (data.storyboards.length === 0) {
    return (
      <div className="fixed inset-0 bg-black flex items-center justify-center">
        <div className="text-center px-4">
          <div className="text-6xl mb-4">📽️</div>
          <h1 className="text-white text-2xl font-bold mb-2">Cinema de {data.user.name}</h1>
          <p className="text-slate-400 mb-6">Aún no hay storyboards publicados. ¡Vuelve pronto!</p>
        </div>
      </div>
    );
  }

  // Group storyboards by category (for now, just recent and all)
  const recentStoryboards = data.storyboards.slice(0, 6);
  const allStoryboards = data.storyboards;

  return (
    <div className="min-h-screen bg-black">
      {/* Header */}
      <header className="absolute top-0 left-0 right-0 z-10 p-4 sm:p-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          {data.user.picture && (
            <img
              src={data.user.picture}
              alt={data.user.name}
              className="w-10 h-10 rounded-full border-2 border-white/20"
            />
          )}
          <div>
            <h1 className="text-white font-bold text-lg sm:text-xl">Cinema de {data.user.name}</h1>
            <p className="text-slate-400 text-xs sm:text-sm">
              {data.storyboards.length}{' '}
              {data.storyboards.length === 1 ? 'storyboard' : 'storyboards'}
            </p>
          </div>
        </div>
        <div className="text-slate-400 text-xs hidden sm:block">Powered by Mindverse</div>
      </header>

      {/* Hero Section */}
      <HeroSection
        storyboard={data.storyboards[0]}
        onPlayVideo={handlePlayVideo}
        onOpenCarousel={() => handleOpenCarousel(data.storyboards[0])}
      />

      {/* Storyboard Rows */}
      <div className="w-full space-y-8 pb-12 overflow-x-hidden">
        {recentStoryboards.length > 1 && (
          <StoryboardRow
            title="Proyectos Recientes"
            storyboards={recentStoryboards.slice(1)}
            onPlayVideo={handlePlayVideo}
            onOpenCarousel={handleOpenCarousel}
          />
        )}

        {allStoryboards.length > 6 && (
          <StoryboardRow
            title="Todos los Storyboards"
            storyboards={allStoryboards}
            onPlayVideo={handlePlayVideo}
            onOpenCarousel={handleOpenCarousel}
          />
        )}
      </div>

      {/* Footer */}
      <footer className="py-8 text-center text-slate-500 text-sm border-t border-slate-900">
        <p>Creado con Mindverse • Cinema Experience</p>
      </footer>

      {/* Modal */}
      {selectedStoryboard && (
        <StoryboardModal storyboard={selectedStoryboard} onClose={() => setSelectedStoryboard(null)} />
      )}

      {/* Modal de reproducción de video compilado */}
      {playingVideo && (
        <div 
          className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center p-4 md:p-8"
          onClick={(e) => {
            // Cerrar al hacer click en el fondo
            if (e.target === e.currentTarget) {
              setPlayingVideo(null);
            }
          }}
        >
          <div className="max-w-6xl w-full space-y-4">
            {/* Video player */}
            <video
              src={playingVideo}
              controls
              autoPlay
              className="w-full rounded-lg shadow-2xl"
              onEnded={() => {
                // Opcional: cerrar al terminar
                // setPlayingVideo(null);
              }}
            />
            
            {/* Botón cerrar */}
            <button
              onClick={() => setPlayingVideo(null)}
              className="w-full px-6 py-4 bg-slate-700 hover:bg-slate-600 text-white rounded-lg font-semibold transition-all text-lg flex items-center justify-center gap-2"
            >
              <span>✕</span>
              <span>Cerrar</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
