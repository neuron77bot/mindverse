import { memo } from 'react';
import { Handle, Position } from 'reactflow';
import type { NodeProps } from 'reactflow';
import type { MindverseNode } from '../../types';
import { CATEGORY_LABELS } from '../../data/mockData';
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

  return (
    <div
      className="relative px-4 py-3 rounded-xl shadow-lg cursor-pointer transition-all duration-200 hover:scale-105 hover:shadow-xl min-w-[160px] max-w-[220px]"
      style={{
        backgroundColor: node.color,
        border: `2px solid ${node.color}`,
      }}
      onDoubleClick={handleDoubleClick}
    >
      <Handle
        type="target"
        position={Position.Left}
        className="!w-3 !h-3 !bg-white !border-2"
        style={{ borderColor: node.color }}
      />

      <div className="text-white">
        <span
          className="inline-block px-2 py-0.5 mb-2 text-xs font-medium rounded-full"
          style={{ backgroundColor: 'rgba(255,255,255,0.25)' }}
        >
          {CATEGORY_LABELS[node.category]}
        </span>

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
