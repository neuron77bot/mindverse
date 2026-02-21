import { useEffect, useRef } from 'react';
import mermaid from 'mermaid';

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

  return <div ref={containerRef} className={`mermaid-container ${className}`} />;
}
