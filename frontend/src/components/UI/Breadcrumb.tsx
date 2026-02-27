import { Fragment } from 'react';
import { Link } from 'react-router-dom';

interface BreadcrumbItem {
  label: string;
  path?: string; // opcional: si tiene path, será clickeable
}

interface BreadcrumbProps {
  items: BreadcrumbItem[];
  onBack?: () => void; // opcional: función para botón "Volver"
}

export default function Breadcrumb({ items, onBack }: BreadcrumbProps) {
  // Si no hay items, no renderizar nada
  if (!items || items.length === 0) {
    return null;
  }

  return (
    <div className="px-4 py-3 lg:px-8 flex items-center gap-3 border-b border-slate-700/60 bg-slate-800/40 flex-shrink-0">
      {/* Botón Volver (opcional) */}
      {onBack && (
        <>
          <button
            onClick={onBack}
            className="flex items-center gap-1.5 text-slate-400 hover:text-white transition-colors text-sm font-medium"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
              />
            </svg>
            Volver
          </button>
          <span className="text-slate-700">/</span>
        </>
      )}

      {/* Items del breadcrumb */}
      {items.map((item, index) => {
        const isLast = index === items.length - 1;

        return (
          <Fragment key={index}>
            {index > 0 && <span className="text-slate-700">/</span>}

            {item.path && !isLast ? (
              <Link
                to={item.path}
                className="text-slate-400 hover:text-white transition-colors text-sm"
              >
                {item.label}
              </Link>
            ) : (
              <span className="text-slate-400 text-sm">{item.label}</span>
            )}
          </Fragment>
        );
      })}
    </div>
  );
}
