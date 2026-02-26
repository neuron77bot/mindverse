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

  const vibColor = EMOTIONAL_COLORS[node.emotionalLevel] || node.color;

  return (
    <div
      className="mind-node relative rounded-xl shadow-lg cursor-pointer transition-all duration-200 hover:scale-105 hover:shadow-xl min-w-[160px] max-w-[240px] overflow-hidden"
      style={{
        '--node-color': vibColor,
        '--node-color-light': `${vibColor}55`,
        '--node-color-lighter': `${vibColor}22`,
        backgroundColor: `${vibColor}cc`,
      } as React.CSSProperties}
      onDoubleClick={handleDoubleClick}
    >
      <Handle
        type="target"
        position={Position.Left}
        className="node-handle !w-3 !h-3 !bg-white !border-2"
      />

      {/* Banner: imagen real o placeholder */}
      <div className="relative h-28 w-full overflow-hidden">
        {node.imageUrl ? (
          <img src={node.imageUrl} alt={node.content} className="w-full h-full object-cover" />
        ) : (
          <div className="node-banner-gradient w-full h-full flex items-center justify-center">
            <span className="text-[10px] font-semibold tracking-widest uppercase opacity-30 text-white">
              Sin imagen
            </span>
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
      </div>

      <div className="px-4 py-3 text-white">
        <div className="flex items-center gap-1.5 mb-2 flex-wrap">
          <span className="badge-overlay inline-block px-2 py-0.5 text-xs font-medium rounded-full">
            {CATEGORY_LABELS[node.category]}
          </span>
          <span className="badge-overlay inline-block px-2 py-0.5 text-xs font-medium rounded-full">
            {EMOTIONAL_LABELS[node.emotionalLevel]}
          </span>
        </div>

        <h3 className="font-semibold text-sm leading-tight mb-1">{node.content}</h3>

        {node.description && <p className="text-xs opacity-80 line-clamp-2">{node.description}</p>}
      </div>

      <Handle
        type="source"
        position={Position.Right}
        className="node-handle !w-3 !h-3 !bg-white !border-2"
      />
    </div>
  );
});

CustomNode.displayName = 'CustomNode';

export default CustomNode;
