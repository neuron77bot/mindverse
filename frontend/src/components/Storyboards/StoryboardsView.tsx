import { useState } from 'react';

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
  createdAt: string;
}

// MOCK DATA - Preparado para reemplazar con backend
const MOCK_STORYBOARDS: Storyboard[] = [
  {
    _id: '1',
    title: 'La aventura del robot perdido',
    originalText: 'Un robot se pierde en una ciudad desconocida y debe encontrar su camino de regreso a casa. Durante su viaje, descubre la importancia de pedir ayuda y hacer nuevos amigos.',
    inputMode: 'voice',
    frames: [
      {
        frame: 1,
        scene: 'Robot en la ciudad',
        visualDescription: 'Un pequeño robot azul se encuentra solo en una gran ciudad llena de luces de neón y rascacielos imponentes.',
        dialogue: '¿Dónde estoy? Todo es tan grande y brillante...',
        imageUrl: 'https://via.placeholder.com/400x300/1a1a2e/00d9ff?text=Robot+Perdido'
      },
      {
        frame: 2,
        scene: 'Encuentra un mapa',
        visualDescription: 'El robot descubre un viejo mapa holográfico en un callejón oscuro. La pantalla parpadea mostrando rutas de la ciudad.',
        dialogue: '¡Esto me ayudará! Aunque está un poco roto...',
        imageUrl: 'https://via.placeholder.com/400x300/2d2d44/4ecca3?text=Mapa+Hologr%C3%A1fico'
      },
      {
        frame: 3,
        scene: 'Conoce a un gato robot',
        visualDescription: 'Un gato robot amigable se acerca y ofrece ayuda. Tiene ojos brillantes y una sonrisa digital.',
        dialogue: 'Hola pequeño, ¿estás perdido? Yo conozco la ciudad.',
        imageUrl: 'https://via.placeholder.com/400x300/16213e/ff6b6b?text=Gato+Robot'
      },
      {
        frame: 4,
        scene: 'Camino a casa',
        visualDescription: 'Los dos robots caminan juntos bajo la lluvia nocturna, siguiendo las luces de la ciudad hacia casa.',
        imageUrl: 'https://via.placeholder.com/400x300/0f3460/ee5a6f?text=Regreso+a+Casa'
      }
    ],
    comicPageUrl: 'https://via.placeholder.com/600x800/1a1a2e/ffffff?text=Comic+Page+Completa',
    createdAt: '2026-02-24T10:30:00.000Z'
  },
  {
    _id: '2',
    title: 'El secreto del bosque mágico',
    originalText: 'Una niña descubre que su abuelo era un mago y debe resolver un antiguo misterio en el bosque.',
    inputMode: 'text',
    frames: [
      {
        frame: 1,
        scene: 'La carta misteriosa',
        visualDescription: 'Luna encuentra una carta antigua en el ático de su abuelo. El papel tiene símbolos extraños que brillan levemente.',
        dialogue: 'Nunca supe que el abuelo tenía estos secretos...',
        imageUrl: 'https://via.placeholder.com/400x300/2c3e50/ecf0f1?text=Carta+Antigua'
      },
      {
        frame: 2,
        scene: 'La entrada al bosque',
        visualDescription: 'Un árbol enorme con una puerta tallada se abre al toque de Luna. Luz verde emana del interior.',
        imageUrl: 'https://via.placeholder.com/400x300/27ae60/ecf0f1?text=%C3%81rbol+Portal'
      }
    ],
    createdAt: '2026-02-23T15:20:00.000Z'
  },
  {
    _id: '3',
    title: 'Superhéroe por un día',
    originalText: 'Lucas, un chico tímido, obtiene superpoderes por 24 horas y debe decidir qué hacer con ellos.',
    inputMode: 'voice',
    frames: [
      {
        frame: 1,
        scene: 'El despertar',
        visualDescription: 'Lucas se despierta flotando sobre su cama. Sus manos brillan con energía azul.',
        dialogue: '¡¿QUÉ ME ESTÁ PASANDO?!',
        imageUrl: 'https://via.placeholder.com/400x300/34495e/3498db?text=Levitaci%C3%B3n'
      },
      {
        frame: 2,
        scene: 'Primera prueba',
        visualDescription: 'En el patio, Lucas intenta controlar sus poderes. Hace levitar una pelota.',
        dialogue: 'Esto es increíble... pero da un poco de miedo.',
        imageUrl: 'https://via.placeholder.com/400x300/1abc9c/ecf0f1?text=Telequinesis'
      },
      {
        frame: 3,
        scene: 'La decisión',
        visualDescription: 'Lucas ve a alguien en peligro en la calle. Debe decidir si usar sus poderes.',
        dialogue: 'Solo tengo 24 horas... ¿qué haría un héroe de verdad?',
        imageUrl: 'https://via.placeholder.com/400x300/e74c3c/ecf0f1?text=Elecci%C3%B3n'
      }
    ],
    comicPageUrl: 'https://via.placeholder.com/600x800/34495e/ffffff?text=Super+Hero+Page',
    createdAt: '2026-02-22T09:15:00.000Z'
  }
];

export default function StoryboardsView() {
  const [selectedStoryboard, setSelectedStoryboard] = useState<Storyboard | null>(null);

  // Vista detalle
  if (selectedStoryboard) {
    return (
      <div className="flex-1 overflow-y-auto bg-slate-900">
        <div className="max-w-4xl mx-auto">
          {/* Header sticky */}
          <div className="sticky top-0 z-10 bg-slate-900/95 backdrop-blur border-b border-slate-700 px-4 py-3">
            <button
              onClick={() => setSelectedStoryboard(null)}
              className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              <span className="text-sm font-medium">Volver</span>
            </button>
          </div>

          <div className="px-4 py-6">
            {/* Título */}
            <h1 className="text-2xl md:text-3xl font-bold text-white mb-3">{selectedStoryboard.title}</h1>
            
            {/* Metadata */}
            <div className="flex flex-wrap items-center gap-3 mb-6">
              <span className="text-xs px-3 py-1.5 rounded-full bg-blue-600/20 text-blue-400 border border-blue-600/30 font-medium">
                {selectedStoryboard.inputMode === 'voice' ? '🎙️ Voz' : '📝 Texto'}
              </span>
              <span className="text-sm text-slate-400">
                {new Date(selectedStoryboard.createdAt).toLocaleDateString('es-AR', { 
                  day: 'numeric', 
                  month: 'long', 
                  year: 'numeric' 
                })}
              </span>
              <span className="text-sm text-slate-500">
                📚 {selectedStoryboard.frames.length} viñetas
              </span>
            </div>

            {/* Historia original */}
            <div className="mb-6 p-4 bg-slate-800/50 rounded-xl border border-slate-700/50">
              <h3 className="text-white font-semibold mb-2 text-sm uppercase tracking-wide">Historia Original</h3>
              <p className="text-slate-300 text-sm md:text-base leading-relaxed">
                {selectedStoryboard.originalText}
              </p>
            </div>

            {/* Página de cómic completa */}
            {selectedStoryboard.comicPageUrl && (
              <div className="mb-6 bg-gradient-to-br from-slate-800 to-slate-900 rounded-xl border-2 border-slate-700 overflow-hidden">
                <div className="p-4 border-b border-slate-700">
                  <h3 className="text-white font-semibold text-sm uppercase tracking-wide">Página de Cómic Completa</h3>
                </div>
                <div className="p-4">
                  <img
                    src={selectedStoryboard.comicPageUrl}
                    alt="Página de cómic"
                    className="w-full rounded-lg"
                  />
                </div>
                <div className="p-4 border-t border-slate-700">
                  <a
                    href={selectedStoryboard.comicPageUrl}
                    download="comic-page.png"
                    className="block w-full py-3 px-4 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-sm font-medium text-center transition-colors"
                  >
                    Descargar Página Completa
                  </a>
                </div>
              </div>
            )}

            {/* Viñetas individuales */}
            <h3 className="text-white font-semibold mb-4 text-sm uppercase tracking-wide">
              Viñetas ({selectedStoryboard.frames.length})
            </h3>
            
            <div className="space-y-4">
              {selectedStoryboard.frames.map((frame) => (
                <div key={frame.frame} className="bg-slate-800/80 rounded-xl border border-slate-700 overflow-hidden">
                  {/* Header del frame */}
                  <div className="bg-slate-700/50 px-4 py-3 border-b border-slate-600 flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white text-sm font-bold">
                      {frame.frame}
                    </div>
                    <h4 className="text-white font-medium text-base flex-1">{frame.scene}</h4>
                  </div>

                  {/* Contenido */}
                  <div className="p-4 space-y-4">
                    {/* Imagen */}
                    {frame.imageUrl && (
                      <div className="rounded-lg overflow-hidden bg-slate-900/50">
                        <img 
                          src={frame.imageUrl} 
                          alt={`Viñeta ${frame.frame}`} 
                          className="w-full"
                        />
                      </div>
                    )}

                    {/* Descripción visual */}
                    <div>
                      <h5 className="text-slate-400 text-xs font-semibold mb-2 uppercase tracking-wider">
                        Descripción Visual
                      </h5>
                      <p className="text-slate-300 text-sm leading-relaxed">
                        {frame.visualDescription}
                      </p>
                    </div>

                    {/* Diálogo */}
                    {frame.dialogue && (
                      <div className="pt-3 border-t border-slate-700/50">
                        <h5 className="text-slate-400 text-xs font-semibold mb-2 uppercase tracking-wider">
                          Diálogo
                        </h5>
                        <p className="text-slate-200 text-sm italic bg-slate-900/30 p-3 rounded-lg border-l-4 border-blue-500">
                          "{frame.dialogue}"
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Vista lista
  return (
    <div className="flex-1 overflow-y-auto bg-slate-900 px-4 py-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <h1 className="text-2xl md:text-3xl font-bold text-white mb-2">Mis Storyboards</h1>
        <p className="text-slate-400 text-sm mb-6">
          {MOCK_STORYBOARDS.length} storyboard{MOCK_STORYBOARDS.length !== 1 ? 's' : ''} guardado{MOCK_STORYBOARDS.length !== 1 ? 's' : ''}
        </p>

        {/* Warning temporal */}
        <div className="mb-6 p-4 bg-yellow-900/20 border border-yellow-500/30 rounded-lg">
          <div className="flex items-start gap-3">
            <span className="text-yellow-400 text-lg">⚠️</span>
            <div>
              <p className="text-yellow-300 text-sm font-medium mb-1">Vista de prueba con datos mock</p>
              <p className="text-yellow-400/80 text-xs">
                Siguiente paso: conectar al backend para cargar tus storyboards reales
              </p>
            </div>
          </div>
        </div>

        {/* Grid de cards - Responsive */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {MOCK_STORYBOARDS.map((storyboard) => (
            <div
              key={storyboard._id}
              onClick={() => setSelectedStoryboard(storyboard)}
              className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden hover:border-slate-600 hover:shadow-lg hover:shadow-blue-500/10 transition-all cursor-pointer active:scale-[0.98]"
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
                {/* Badge */}
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-xs px-2 py-1 rounded bg-blue-600/20 text-blue-400 border border-blue-600/30">
                    {storyboard.inputMode === 'voice' ? '🎙️ Voz' : '📝 Texto'}
                  </span>
                </div>

                {/* Título */}
                <h3 className="text-white font-semibold mb-2 text-base line-clamp-2">
                  {storyboard.title}
                </h3>

                {/* Preview */}
                <p className="text-slate-400 text-sm mb-3 line-clamp-2">
                  {storyboard.originalText}
                </p>

                {/* Footer */}
                <div className="flex items-center justify-between text-xs text-slate-500 pt-3 border-t border-slate-700">
                  <span className="flex items-center gap-1">
                    <span>📚</span>
                    <span>{storyboard.frames.length} viñetas</span>
                  </span>
                  <span>
                    {new Date(storyboard.createdAt).toLocaleDateString('es-AR', { 
                      day: 'numeric', 
                      month: 'short' 
                    })}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
