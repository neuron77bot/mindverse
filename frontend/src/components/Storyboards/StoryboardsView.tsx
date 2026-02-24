import { useState, useEffect } from 'react';
import { authHeadersOnly } from '../../services/authHeaders';

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:3001';

interface StoryboardFrame {
  frame: number;
  scene: string;
  visualDescription: string;
  dialogue?: string;
  imageUrl?: string;
}

interface Storyboard {
  _id: string;
  title: string;
  originalText: string;
  inputMode: 'voice' | 'text';
  frames: StoryboardFrame[];
  comicPageUrl?: string;
  mermaidDiagram?: string;
  createdAt: string;
  updatedAt: string;
}

// MOCK DATA FOR TESTING
const MOCK_STORYBOARDS: Storyboard[] = [
  {
    _id: '1',
    title: 'La aventura del robot perdido',
    originalText: 'Un robot se pierde en una ciudad desconocida y debe encontrar su camino de regreso a casa.',
    inputMode: 'voice',
    frames: [
      {
        frame: 1,
        scene: 'Robot en la ciudad',
        visualDescription: 'Un pequeño robot azul se encuentra solo en una gran ciudad llena de luces de neón.',
        dialogue: '¿Dónde estoy?'
      },
      {
        frame: 2,
        scene: 'Encuentra un mapa',
        visualDescription: 'El robot descubre un viejo mapa holográfico en un callejón oscuro.',
        dialogue: '¡Esto me ayudará!'
      },
      {
        frame: 3,
        scene: 'Camino a casa',
        visualDescription: 'El robot sigue las indicaciones del mapa bajo la lluvia nocturna.',
      }
    ],
    comicPageUrl: 'https://via.placeholder.com/800x1200/1a1a1a/ffffff?text=Comic+Page',
    createdAt: '2026-02-24T10:30:00.000Z',
    updatedAt: '2026-02-24T10:30:00.000Z'
  },
  {
    _id: '2',
    title: 'El misterio del bosque encantado',
    originalText: 'Una niña descubre que su abuelo era un mago y debe resolver un antiguo misterio en el bosque.',
    inputMode: 'text',
    frames: [
      {
        frame: 1,
        scene: 'La carta misteriosa',
        visualDescription: 'Una niña encuentra una carta antigua en el ático de su abuelo.',
        dialogue: 'Nunca supe que el abuelo tenía secretos...'
      }
    ],
    createdAt: '2026-02-23T15:20:00.000Z',
    updatedAt: '2026-02-23T15:20:00.000Z'
  },
  {
    _id: '3',
    title: 'Superhéroe por un día',
    originalText: 'Un chico tímido obtiene superpoderes por 24 horas y debe decidir qué hacer con ellos.',
    inputMode: 'voice',
    frames: [
      {
        frame: 1,
        scene: 'El despertar',
        visualDescription: 'El protagonista se despierta flotando sobre su cama.',
        dialogue: '¡¿QUÉ ME ESTÁ PASANDO?!'
      }
    ],
    comicPageUrl: 'https://via.placeholder.com/800x1200/2a2a2a/00ff00?text=Super+Hero',
    createdAt: '2026-02-22T09:15:00.000Z',
    updatedAt: '2026-02-22T09:15:00.000Z'
  }
];

export default function StoryboardsView() {
  const [storyboards, setStoryboards] = useState<Storyboard[]>(MOCK_STORYBOARDS);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // fetchStoryboards(); // DISABLED FOR MOCK
  }, []);

  const fetchStoryboards = async () => {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`${API_BASE}/storyboards`, {
        headers: authHeadersOnly(),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || 'Error cargando storyboards');
      }

      const data = await res.json();
      setStoryboards(data.storyboards || []);
    } catch (err: any) {
      console.error('Error fetching storyboards:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center bg-slate-900">
        <div className="text-center">
          <svg className="w-12 h-12 text-slate-600 mx-auto mb-3 animate-spin" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          <p className="text-slate-400">Cargando storyboards...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex-1 flex items-center justify-center bg-slate-900">
        <div className="text-center">
          <p className="text-red-400 mb-2">Error: {error}</p>
          <button 
            onClick={fetchStoryboards} 
            className="mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-colors"
          >
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto px-4 py-6 lg:px-8 bg-slate-900">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold text-white mb-6">Mis Storyboards</h1>
        <p className="text-yellow-400 text-sm mb-4">⚠️ Mostrando datos de prueba (mock)</p>

        {storyboards.length === 0 ? (
          <div className="text-center py-12">
            <svg className="w-16 h-16 text-slate-600 mx-auto mb-4" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
            </svg>
            <p className="text-slate-400 text-lg mb-2">No hay storyboards guardados</p>
            <p className="text-slate-600 text-sm">Generá y guardá tu primer storyboard en la sección de grabación</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {storyboards.map((storyboard) => (
              <div
                key={storyboard._id}
                className="bg-slate-800 rounded-lg border border-slate-700 overflow-hidden hover:border-slate-600 transition-colors"
              >
                {/* Thumbnail */}
                {storyboard.comicPageUrl && (
                  <div className="aspect-video bg-slate-900 overflow-hidden">
                    <img
                      src={storyboard.comicPageUrl}
                      alt={storyboard.title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}

                {/* Info */}
                <div className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xs px-2 py-1 rounded bg-blue-600/20 text-blue-400 border border-blue-600/30">
                      {storyboard.inputMode === 'voice' ? '🎙️ Voz' : '📝 Texto'}
                    </span>
                  </div>
                  <h3 className="text-white font-semibold mb-2">{storyboard.title}</h3>
                  <p className="text-slate-400 text-sm mb-3 line-clamp-2">
                    {storyboard.originalText}
                  </p>
                  <div className="flex items-center justify-between text-xs text-slate-500">
                    <span>📚 {storyboard.frames.length} viñetas</span>
                    <span>{new Date(storyboard.createdAt).toLocaleDateString('es-AR')}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
