import { useCallback, useEffect, useMemo, useState } from 'react';
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  Panel,
  useNodesState,
  useEdgesState,
  addEdge,
  applyNodeChanges,
  useReactFlow,
  ReactFlowProvider,
} from 'reactflow';
import type { Node, Edge, Connection, NodeChange } from 'reactflow';
import 'reactflow/dist/style.css';
import { v4 as uuidv4 } from 'uuid';
import { useMindverseStore } from '../../store/mindverseStore';
import type { MindverseNode } from '../../types';
import CustomNode from './CustomNode';
import { getAutoLayoutedElements, type LayoutDirection } from '../../utils/layoutUtils';

// Defined outside of the component as per React Flow documentation
const nodeTypes = {
  custom: CustomNode,
};

const fitViewOptions = { padding: 0.2 };

const defaultEdgeOptions = {
  type: 'smoothstep' as const,
  animated: true,
};

function getNodeColor(node: Node) {
  const nodeData = node.data as { node: MindverseNode };
  return nodeData.node?.color || '#6366F1';
}

function MindverseCanvasInner() {
  const { fitView } = useReactFlow();
  const activeTemporalFilter = useMindverseStore((s) => s.activeTemporalFilter);
  const activeCategoryFilter = useMindverseStore((s) => s.activeCategoryFilter);
  const storeNodes = useMindverseStore((s) => s.nodes);
  const storeConnections = useMindverseStore((s) => s.connections);
  const updateNodePosition = useMindverseStore((s) => s.updateNodePosition);
  const addConnectionToStore = useMindverseStore((s) => s.addConnection);

  const [layoutDirection, setLayoutDirection] = useState<LayoutDirection>('LR');

  // Filtrar nodos según los filtros activos
  const filteredNodes = useMemo(() => {
    return storeNodes.filter((node) => {
      const matchesTemporal =
        activeTemporalFilter === 'ALL' || node.temporalState === activeTemporalFilter;
      const matchesCategory =
        activeCategoryFilter === 'ALL' || node.category === activeCategoryFilter;
      return matchesTemporal && matchesCategory;
    });
  }, [storeNodes, activeTemporalFilter, activeCategoryFilter]);

  // Filtrar conexiones según los nodos visibles
  const filteredConnections = useMemo(() => {
    const nodeIds = new Set(filteredNodes.map((n) => n.id));
    return storeConnections.filter(
      (conn) => nodeIds.has(conn.source) && nodeIds.has(conn.target)
    );
  }, [storeConnections, filteredNodes]);

  // Convertir nodos del store a nodos de React Flow
  const flowNodes: Node[] = useMemo(
    () =>
      filteredNodes.map((node: MindverseNode) => ({
        id: node.id,
        type: 'custom',
        position: { x: node.positionX, y: node.positionY },
        data: { node },
      })),
    [filteredNodes]
  );

  // Convertir conexiones del store a edges de React Flow
  const flowEdges: Edge[] = useMemo(
    () =>
      filteredConnections.map((conn) => ({
        id: conn.id,
        source: conn.source,
        target: conn.target,
        label: conn.label,
        type: 'smoothstep',
        animated: true,
        style: { stroke: '#6366F1', strokeWidth: 2 },
        labelStyle: { fill: '#e2e8f0', fontWeight: 500, fontSize: 12 },
        labelBgStyle: { fill: '#1e293b', fillOpacity: 0.95 },
        labelBgPadding: [8, 4] as [number, number],
        labelBgBorderRadius: 4,
      })),
    [filteredConnections]
  );

  const [nodes, setNodes] = useNodesState(flowNodes);
  const [edges, setEdges] = useEdgesState(flowEdges);

  // Sincronizar cuando cambian los filtros
  useEffect(() => {
    setNodes(flowNodes);
    setEdges(flowEdges);
  }, [flowNodes, flowEdges, setNodes, setEdges]);

  // Aplicar auto-layout con dagre
  const onLayout = useCallback(
    (direction: LayoutDirection) => {
      setLayoutDirection(direction);
      const { nodes: layoutedNodes, edges: layoutedEdges } = getAutoLayoutedElements(
        nodes,
        edges,
        direction
      );

      setNodes([...layoutedNodes]);
      setEdges([...layoutedEdges]);

      // Guardar las nuevas posiciones en el store
      layoutedNodes.forEach((node) => {
        updateNodePosition(node.id, node.position.x, node.position.y);
      });

      // Ajustar la vista después del layout
      window.requestAnimationFrame(() => {
        fitView({ padding: 0.2 });
      });
    },
    [nodes, edges, setNodes, setEdges, updateNodePosition, fitView]
  );

  // Manejar cambios de posición de nodos
  const onNodesChange = useCallback(
    (changes: NodeChange[]) => {
      setNodes((nds) => applyNodeChanges(changes, nds));

      // Guardar posición en el store cuando se suelta el nodo
      changes.forEach((change) => {
        if (change.type === 'position' && change.position && !change.dragging) {
          updateNodePosition(change.id, change.position.x, change.position.y);
        }
      });
    },
    [setNodes, updateNodePosition]
  );

  // Manejar nuevas conexiones
  const onConnect = useCallback(
    (params: Connection) => {
      if (params.source && params.target) {
        const newConnection = {
          id: uuidv4(),
          source: params.source,
          target: params.target,
        };
        addConnectionToStore(newConnection);
        setEdges((eds) => addEdge({ ...params, id: newConnection.id }, eds));
      }
    },
    [addConnectionToStore, setEdges]
  );

  return (
    <ReactFlow
      nodes={nodes}
      edges={edges}
      onNodesChange={onNodesChange}
      onConnect={onConnect}
      nodeTypes={nodeTypes}
      fitView
      fitViewOptions={fitViewOptions}
      defaultEdgeOptions={defaultEdgeOptions}
      className="bg-slate-900"
    >
      <Background color="#334155" gap={20} size={1} />
      <Controls className="!bg-slate-800 !shadow-lg !rounded-lg !border !border-slate-700" />
      <MiniMap
        nodeColor={getNodeColor}
        className="!bg-slate-800 !shadow-lg !rounded-lg !border !border-slate-700"
        maskColor="rgba(0,0,0,0.6)"
      />
      
      {/* Layout Controls Panel */}
      <Panel position="top-right" className="flex gap-2">
        <div className="bg-slate-800 rounded-lg p-2 shadow-lg border border-slate-700 flex items-center gap-2">
          <span className="text-xs text-slate-400 px-2">Layout:</span>
          <button
            onClick={() => onLayout('TB')}
            className={`px-3 py-1.5 rounded text-xs font-medium transition-all ${
              layoutDirection === 'TB'
                ? 'bg-indigo-600 text-white'
                : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
            }`}
            title="Top to Bottom"
          >
            ↓ TB
          </button>
          <button
            onClick={() => onLayout('LR')}
            className={`px-3 py-1.5 rounded text-xs font-medium transition-all ${
              layoutDirection === 'LR'
                ? 'bg-indigo-600 text-white'
                : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
            }`}
            title="Left to Right"
          >
            → LR
          </button>
          <button
            onClick={() => onLayout('BT')}
            className={`px-3 py-1.5 rounded text-xs font-medium transition-all ${
              layoutDirection === 'BT'
                ? 'bg-indigo-600 text-white'
                : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
            }`}
            title="Bottom to Top"
          >
            ↑ BT
          </button>
          <button
            onClick={() => onLayout('RL')}
            className={`px-3 py-1.5 rounded text-xs font-medium transition-all ${
              layoutDirection === 'RL'
                ? 'bg-indigo-600 text-white'
                : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
            }`}
            title="Right to Left"
          >
            ← RL
          </button>
        </div>
      </Panel>
    </ReactFlow>
  );
}

// Wrap with ReactFlowProvider to use useReactFlow hook
function MindverseCanvas() {
  return (
    <div className="w-full h-full">
      <ReactFlowProvider>
        <MindverseCanvasInner />
      </ReactFlowProvider>
    </div>
  );
}

export default MindverseCanvas;
