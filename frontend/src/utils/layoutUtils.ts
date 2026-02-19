import dagre from 'dagre';
import type { Node, Edge } from 'reactflow';

export type LayoutDirection = 'TB' | 'BT' | 'LR' | 'RL';

const NODE_WIDTH  = 260;
const NODE_HEIGHT = 220; // banner (112px) + contenido (~80px) + margen

export function getLayoutedElements(
  nodes: Node[],
  edges: Edge[],
  direction: LayoutDirection = 'TB'
): { nodes: Node[]; edges: Edge[] } {
  const dagreGraph = new dagre.graphlib.Graph();
  dagreGraph.setDefaultEdgeLabel(() => ({}));

  const isHorizontal = direction === 'LR' || direction === 'RL';
  
  dagreGraph.setGraph({
    rankdir: direction,
    nodesep: 60,
    ranksep: 120,
    marginx: 60,
    marginy: 60,
  });

  // Add nodes to dagre graph
  nodes.forEach((node) => {
    dagreGraph.setNode(node.id, { width: NODE_WIDTH, height: NODE_HEIGHT });
  });

  // Add edges to dagre graph
  edges.forEach((edge) => {
    dagreGraph.setEdge(edge.source, edge.target);
  });

  // Calculate layout
  dagre.layout(dagreGraph);

  // Get positioned nodes
  const layoutedNodes = nodes.map((node) => {
    const nodeWithPosition = dagreGraph.node(node.id);
    
    return {
      ...node,
      targetPosition: isHorizontal ? 'left' : 'top',
      sourcePosition: isHorizontal ? 'right' : 'bottom',
      position: {
        x: nodeWithPosition.x - NODE_WIDTH / 2,
        y: nodeWithPosition.y - NODE_HEIGHT / 2,
      },
    } as Node;
  });

  return { nodes: layoutedNodes, edges };
}

// Auto-layout for disconnected nodes (those without edges)
export function getAutoLayoutedElements(
  nodes: Node[],
  edges: Edge[],
  direction: LayoutDirection = 'LR'
): { nodes: Node[]; edges: Edge[] } {
  // Find connected nodes
  const connectedNodeIds = new Set<string>();
  edges.forEach((edge) => {
    connectedNodeIds.add(edge.source);
    connectedNodeIds.add(edge.target);
  });

  // Separate connected and disconnected nodes
  const connectedNodes = nodes.filter((n) => connectedNodeIds.has(n.id));
  const disconnectedNodes = nodes.filter((n) => !connectedNodeIds.has(n.id));

  // Layout connected nodes with dagre
  let layoutedConnectedNodes = connectedNodes;
  if (connectedNodes.length > 0 && edges.length > 0) {
    const result = getLayoutedElements(connectedNodes, edges, direction);
    layoutedConnectedNodes = result.nodes;
  }

  // Position disconnected nodes in a grid below/beside the tree
  const GRID_COLS = 4;
  const GRID_GAP_X = 300;
  const GRID_GAP_Y = 260;
  
  // Find the bounds of the layouted tree
  let maxY = 0;
  let minX = 0;
  layoutedConnectedNodes.forEach((node) => {
    if (node.position.y + NODE_HEIGHT > maxY) {
      maxY = node.position.y + NODE_HEIGHT;
    }
    if (node.position.x < minX) {
      minX = node.position.x;
    }
  });

  const startY = maxY + 100;
  const startX = minX;

  const layoutedDisconnectedNodes = disconnectedNodes.map((node, index) => {
    const col = index % GRID_COLS;
    const row = Math.floor(index / GRID_COLS);
    
    return {
      ...node,
      position: {
        x: startX + col * GRID_GAP_X,
        y: startY + row * GRID_GAP_Y,
      },
    };
  });

  return {
    nodes: [...layoutedConnectedNodes, ...layoutedDisconnectedNodes],
    edges,
  };
}
