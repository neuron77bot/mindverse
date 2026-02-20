import { useEffect, useRef } from 'react';
import mermaid from 'mermaid';

interface MermaidDiagramProps {
  chart: string;
  className?: string;
}

// Inicializar Mermaid con tema oscuro
mermaid.initialize({
  startOnLoad: false,
  theme: 'dark',
  themeVariables: {
    primaryColor: '#6366f1',
    primaryTextColor: '#fff',
    primaryBorderColor: '#818cf8',
    lineColor: '#64748b',
    secondaryColor: '#8b5cf6',
    tertiaryColor: '#0ea5e9',
    background: '#1e293b',
    mainBkg: '#1e293b',
    secondBkg: '#334155',
    border1: '#475569',
    border2: '#64748b',
    fontFamily: 'ui-sans-serif, system-ui, sans-serif',
  },
  flowchart: {
    curve: 'basis',
    padding: 20,
    nodeSpacing: 60,
    rankSpacing: 80,
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

  return <div ref={containerRef} className={`mermaid-container ${className}`} />;
}
