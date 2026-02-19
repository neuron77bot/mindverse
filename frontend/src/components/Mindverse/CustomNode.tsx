import { memo } from 'react';
import { Handle, Position } from 'reactflow';
import type { NodeProps } from 'reactflow';
import type { MindverseNode } from '../../types';
import { CATEGORY_LABELS, EMOTIONAL_LABELS, EMOTIONAL_COLORS } from '../../data/mockData';
import { useMindverseStore } from '../../store/mindverseStore';

interface CustomNodeData {
  node: MindverseNode;
}

const CustomNode = memo(({ data }: NodeProps<CustomNodeData>) => {
  const { node } = data;
  const openEditor = useMindverseStore((state) => state.openEditor);

  const handleDoubleClick = () => {
    openEditor(node);
  };

  if (node.isRoot) {
    return (
      <div
        className="relative px-6 py-4 rounded-full shadow-2xl cursor-pointer transition-all duration-300 hover:scale-110 hover:shadow-[0_0_40px_rgba(251,191,36,0.5)] min-w-[180px] text-center"
        style={{
          background: 'radial-gradient(circle, #FBBF24 0%, #D97706 60%, #92400E 100%)',
          border: '3px solid #FBBF24',
          boxShadow: '0 0 25px rgba(251,191,36,0.35)',
        }}
        onDoubleClick={handleDoubleClick}
      >
        <Handle
          type="target"
          position={Position.Top}
          className="!w-4 !h-4 !bg-yellow-300 !border-2 !border-yellow-500"
        />

        <div className="text-white">
          <h3 className="font-bold text-base leading-tight tracking-wide">
            {node.content}
          </h3>
          <p className="text-xs opacity-80 mt-1">Punto Cero</p>
        </div>

        <Handle
          type="source"
          position={Position.Bottom}
          className="!w-4 !h-4 !bg-yellow-300 !border-2 !border-yellow-500"
        />
      </div>
    );
  }

  const emotionalColor = EMOTIONAL_COLORS[node.emotionalLevel];

  return (
    <div
      className="relative rounded-xl shadow-lg cursor-pointer transition-all duration-200 hover:scale-105 hover:shadow-xl min-w-[160px] max-w-[240px] overflow-hidden"
      style={{ backgroundColor: node.color, border: `2px solid ${node.color}` }}
      onDoubleClick={handleDoubleClick}
    >
      <Handle
        type="target"
        position={Position.Left}
        className="!w-3 !h-3 !bg-white !border-2"
        style={{ borderColor: node.color }}
      />

      {/* Banner: imagen real o placeholder */}
      <div className="relative h-28 w-full overflow-hidden">
        {node.imageUrl ? (
          <img
            src={node.imageUrl}
            alt={node.content}
            className="w-full h-full object-cover"
          />
        ) : (
          <div
            className="w-full h-full flex items-center justify-center"
            style={{ background: `linear-gradient(135deg, ${node.color}55 0%, ${node.color}22 100%)` }}
          >
            <span className="text-4xl opacity-50">
              {{ HEALTH:'💪', WORK:'💼', LOVE:'❤️', FAMILY:'👨‍👩‍👧', FINANCES:'💰',
                 PERSONAL_GROWTH:'🚀', LEISURE:'🎉', SPIRITUALITY:'🔮', SOCIAL:'🤝'
               }[node.category] ?? '✨'}
            </span>
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
      </div>

      <div className="px-4 py-3 text-white">
        <div className="flex items-center gap-1.5 mb-2 flex-wrap">
          <span
            className="inline-block px-2 py-0.5 text-xs font-medium rounded-full"
            style={{ backgroundColor: 'rgba(255,255,255,0.25)' }}
          >
            {CATEGORY_LABELS[node.category]}
          </span>
          <span
            className="inline-block px-2 py-0.5 text-xs font-medium rounded-full"
            style={{ backgroundColor: emotionalColor, color: '#fff' }}
          >
            {EMOTIONAL_LABELS[node.emotionalLevel]}
          </span>
        </div>

        <h3 className="font-semibold text-sm leading-tight mb-1">
          {node.content}
        </h3>

        {node.description && (
          <p className="text-xs opacity-90 line-clamp-2">{node.description}</p>
        )}
      </div>

      <Handle
        type="source"
        position={Position.Right}
        className="!w-3 !h-3 !bg-white !border-2"
        style={{ borderColor: node.color }}
      />
    </div>
  );
});

CustomNode.displayName = 'CustomNode';

export default CustomNode;
