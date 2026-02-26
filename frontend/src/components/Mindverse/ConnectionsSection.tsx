import type { MindverseNode } from '../../types';

interface ConnectionsSectionProps {
  nodes: MindverseNode[];
  inNodeIds: string[];
  outNodeIds: string[];
  onInChange: (ids: string[]) => void;
  onOutChange: (ids: string[]) => void;
  showIn: boolean;
  showOut: boolean;
}

export default function ConnectionsSection({
  nodes,
  inNodeIds,
  outNodeIds,
  onInChange,
  onOutChange,
  showIn,
  showOut,
}: ConnectionsSectionProps) {
  const selectClass =
    'w-full px-3 py-2 bg-slate-900 border border-slate-600 rounded-lg text-white text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors';

  const otherNodes = nodes;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      {/* IN connections */}
      {showIn && (
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">→ IN (Padres)</label>
          {inNodeIds.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mb-2">
              {inNodeIds.map((nodeId) => {
                const node = nodes.find((n) => n.id === nodeId);
                return (
                  <span
                    key={nodeId}
                    className="inline-flex items-center gap-1 px-2 py-1 bg-indigo-600/20 border border-indigo-500/40 text-indigo-300 text-xs rounded-md"
                  >
                    {node?.content || nodeId}
                    <button
                      type="button"
                      onClick={() => onInChange(inNodeIds.filter((id) => id !== nodeId))}
                      className="hover:text-red-400 transition-colors"
                      aria-label={`Eliminar conexión con ${node?.content || nodeId}`}
                    >
                      ✕
                    </button>
                  </span>
                );
              })}
            </div>
          )}
          <select
            value=""
            onChange={(e) => {
              const val = e.target.value;
              if (val && !inNodeIds.includes(val)) onInChange([...inNodeIds, val]);
            }}
            className={selectClass}
            aria-label="Agregar nodo padre"
          >
            <option value="">+ Agregar padre</option>
            {otherNodes
              .filter((n) => !inNodeIds.includes(n.id))
              .map((n) => (
                <option key={n.id} value={n.id}>
                  {n.content}
                </option>
              ))}
          </select>
        </div>
      )}

      {/* OUT connections */}
      {showOut && (
        <div className={showIn ? '' : 'col-span-2'}>
          <label className="block text-sm font-medium text-slate-300 mb-2">→ OUT (Hijos)</label>
          {outNodeIds.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mb-2">
              {outNodeIds.map((nodeId) => {
                const node = nodes.find((n) => n.id === nodeId);
                return (
                  <span
                    key={nodeId}
                    className="inline-flex items-center gap-1 px-2 py-1 bg-purple-600/20 border border-purple-500/40 text-purple-300 text-xs rounded-md"
                  >
                    {node?.content || nodeId}
                    <button
                      type="button"
                      onClick={() => onOutChange(outNodeIds.filter((id) => id !== nodeId))}
                      className="hover:text-red-400 transition-colors"
                      aria-label={`Eliminar conexión con ${node?.content || nodeId}`}
                    >
                      ✕
                    </button>
                  </span>
                );
              })}
            </div>
          )}
          <select
            value=""
            onChange={(e) => {
              const val = e.target.value;
              if (val && !outNodeIds.includes(val)) onOutChange([...outNodeIds, val]);
            }}
            className={selectClass}
            aria-label="Agregar nodo hijo"
          >
            <option value="">+ Agregar hijo</option>
            {otherNodes
              .filter((n) => !outNodeIds.includes(n.id))
              .map((n) => (
                <option key={n.id} value={n.id}>
                  {n.content}
                </option>
              ))}
          </select>
        </div>
      )}
    </div>
  );
}
