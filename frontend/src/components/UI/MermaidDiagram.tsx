import { useEffect, useRef } from 'react';
import mermaid from 'mermaid';
import { TransformWrapper, TransformComponent } from 'react-zoom-pan-pinch';

interface MermaidDiagramProps {
  chart: string;
  className?: string;
}

// Inicializar Mermaid con tema oscuro y alto contraste
mermaid.initialize({
  startOnLoad: false,
  theme: 'dark',
  themeVariables: {
    primaryColor: '#3b82f6',
    primaryTextColor: '#000000',
    primaryBorderColor: '#2563eb',
    lineColor: '#94a3b8',
    secondaryColor: '#8b5cf6',
    tertiaryColor: '#0ea5e9',
    background: '#1e293b',
    mainBkg: '#3b82f6',
    secondBkg: '#8b5cf6',
    border1: '#2563eb',
    border2: '#7c3aed',
    fontFamily: 'ui-sans-serif, system-ui, sans-serif',
    fontSize: '16px',
    nodeBorder: '#2563eb',
    clusterBkg: '#334155',
    clusterBorder: '#64748b',
    textColor: '#000000',
    titleColor: '#ffffff',
  },
  flowchart: {
    curve: 'basis',
    padding: 20,
    nodeSpacing: 60,
    rankSpacing: 80,
    htmlLabels: true,
  },
});

export default function MermaidDiagram({ chart, className = '' }: MermaidDiagramProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current || !chart) return;

    const renderDiagram = async () => {
      try {
        const id = `mermaid-${Math.random().toString(36).substr(2, 9)}`;
        const { svg } = await mermaid.render(id, chart);
        if (containerRef.current) {
          containerRef.current.innerHTML = svg;
        }
      } catch (error) {
        console.error('Error rendering Mermaid diagram:', error);
        if (containerRef.current) {
          containerRef.current.innerHTML = `<div class="text-red-400 text-sm p-4">Error al renderizar el diagrama</div>`;
        }
      }
    };

    renderDiagram();
  }, [chart]);

  return (
    <div className="relative">
      <TransformWrapper
        initialScale={1}
        minScale={0.5}
        maxScale={3}
        centerOnInit
        wheel={{ step: 0.1 }}
      >
        {({ zoomIn, zoomOut, resetTransform }) => (
          <>
            {/* Controles de zoom */}
            <div className="absolute top-2 right-2 z-10 flex flex-col gap-1 bg-slate-900/80 rounded-lg p-1 border border-slate-700">
              <button
                onClick={() => zoomIn()}
                className="p-2 hover:bg-slate-700 rounded transition-colors text-white"
                title="Zoom in"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
              </button>
              <button
                onClick={() => zoomOut()}
                className="p-2 hover:bg-slate-700 rounded transition-colors text-white"
                title="Zoom out"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                </svg>
              </button>
              <button
                onClick={() => resetTransform()}
                className="p-2 hover:bg-slate-700 rounded transition-colors text-white"
                title="Resetear zoom"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              </button>
            </div>

            {/* Contenedor con pan/zoom */}
            <TransformComponent
              wrapperStyle={{ width: '100%', height: '500px' }}
              contentStyle={{ width: '100%', height: '100%' }}
            >
              <div 
                ref={containerRef} 
                className={`mermaid-container ${className}`}
                style={{ minWidth: '100%', minHeight: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              />
            </TransformComponent>
          </>
        )}
      </TransformWrapper>
      
      {/* Indicador de instrucciones */}
      <div className="mt-2 text-center text-xs text-slate-500">
        Arrastrá para mover • Rueda del mouse para zoom • Click en botones para controlar
      </div>
    </div>
  );
}
