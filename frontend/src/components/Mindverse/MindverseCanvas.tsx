import { useCallback, useEffect, useMemo } from 'react';
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
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

import { EMOTIONAL_COLORS } from '../../data/mockData';

function getNodeColor(node: Node) {
  const nodeData = node.data as { node: MindverseNode };
  const n = nodeData.node;
  return (n?.emotionalLevel && EMOTIONAL_COLORS[n.emotionalLevel]) || n?.color || '#6366F1';
}

function MindverseCanvasInner() {
  const { fitView } = useReactFlow();
  const activeTemporalFilter = useMindverseStore((s) => s.activeTemporalFilter);
  const activeCategoryFilter = useMindverseStore((s) => s.activeCategoryFilter);
  const storeNodes = useMindverseStore((s) => s.nodes);
  const storeConnections = useMindverseStore((s) => s.connections);
  const updateNodePosition = useMindverseStore((s) => s.updateNodePosition);
  const addConnectionToStore = useMindverseStore((s) => s.addConnection);

  const layoutDirection = useMindverseStore((s) => s.layoutDirection);
  const focusedNodeId = useMindverseStore((s) => s.focusedNodeId);

  // Filtrar nodos — si hay focusedNodeId, mostrar ese nodo y TODOS sus descendientes
  const filteredNodes = useMemo(() => {
    if (focusedNodeId) {
      const allIds = new Set<string>([focusedNodeId]);
      const queue = [focusedNodeId];
      while (queue.length > 0) {
        const current = queue.shift()!;
        storeConnections
          .filter((c) => c.source === current && !allIds.has(c.target))
          .forEach((c) => {
            allIds.add(c.target);
            queue.push(c.target);
          });
      }
      return storeNodes.filter((n) => allIds.has(n.id));
    }
    return storeNodes.filter((node) => {
      const matchesTemporal =
        activeTemporalFilter === 'ALL' || node.temporalState === activeTemporalFilter;
      const matchesCategory =
        activeCategoryFilter === 'ALL' || node.category === activeCategoryFilter;
      return matchesTemporal && matchesCategory;
    });
  }, [storeNodes, storeConnections, activeTemporalFilter, activeCategoryFilter, focusedNodeId]);

  // Filtrar conexiones según los nodos visibles
  const filteredConnections = useMemo(() => {
    const nodeIds = new Set(filteredNodes.map((n) => n.id));
    return storeConnections.filter((conn) => nodeIds.has(conn.source) && nodeIds.has(conn.target));
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

  // Aplicar auto-layout con dagre cuando cambia la dirección
  const onLayout = useCallback(
    (direction: LayoutDirection) => {
      const { nodes: layoutedNodes, edges: layoutedEdges } = getAutoLayoutedElements(
        nodes,
        edges,
        direction
      );

      setNodes([...layoutedNodes]);
      setEdges([...layoutedEdges]);

      layoutedNodes.forEach((node) => {
        updateNodePosition(node.id, node.position.x, node.position.y);
      });

      window.requestAnimationFrame(() => {
        fitView({ padding: 0.2 });
      });
    },
    [nodes, edges, setNodes, setEdges, updateNodePosition, fitView]
  );

  // Reaccionar a cambios del layoutDirection en el store
  useEffect(() => {
    onLayout(layoutDirection);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [layoutDirection]);

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
