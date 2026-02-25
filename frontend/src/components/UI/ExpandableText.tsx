import { useState, useRef, useEffect } from 'react';

interface ExpandableTextProps {
  text: string;
  className?: string;
  clamp?: 2 | 3 | 4;
}

const CLAMP_CLASS: Record<number, string> = {
  2: 'line-clamp-2',
  3: 'line-clamp-3',
  4: 'line-clamp-4',
};

export default function ExpandableText({ text, className = '', clamp = 2 }: ExpandableTextProps) {
  const [expanded, setExpanded] = useState(false);
  const [isClamped, setIsClamped] = useState(false);
  const ref = useRef<HTMLParagraphElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (el) {
      // Medir si el contenido excede el espacio visible
      setIsClamped(el.scrollHeight > el.clientHeight);
    }
  }, [text]);

  return (
    <div>
      <p ref={ref} className={`${className} ${expanded ? '' : CLAMP_CLASS[clamp]}`}>
        {text}
      </p>
      {isClamped && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            setExpanded((v) => !v);
          }}
          className="mt-1 text-xs text-indigo-400 hover:text-indigo-300 font-medium transition-colors"
        >
          {expanded ? 'Leer menos ↑' : 'Leer más ↓'}
        </button>
      )}
    </div>
  );
}
