import type { MindverseNode, Connection } from '../types';
import { authHeaders, authHeadersOnly } from './authHeaders';

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:3001';

// ── Helpers ───────────────────────────────────────────────────────────────────

/** Conexiones outgoing de un nodo */
const outgoingConns = (nodeId: string, connections: Connection[]) =>
  connections
    .filter((c) => c.source === nodeId)
    .map((c) => ({ source: c.source, target: c.target, connectionId: c.id }));

/** Convierte un nodo del backend al formato del store */
export interface BackendThought {
  _id: string;
  content: string;
  description?: string;
  category: string;
  temporalState: string;
  emotionalLevel: string;
  positionX: number;
  positionY: number;
  color: string;
  imageUrl?: string | null;
  tags?: string[];
  isFavorite?: boolean;
  isRoot?: boolean;
  connections: { source: string; target: string; connectionId: string }[];
  createdAt: string;
}

export function backendToNode(t: BackendThought): MindverseNode {
  return {
    id:            t._id,
    content:       t.content,
    description:   t.description ?? '',
    category:      t.category as MindverseNode['category'],
    temporalState: t.temporalState as MindverseNode['temporalState'],
    emotionalLevel: t.emotionalLevel as MindverseNode['emotionalLevel'],
    positionX:     t.positionX,
    positionY:     t.positionY,
    color:         t.color,
    imageUrl:      t.imageUrl ?? undefined,
    tags:          t.tags ?? [],
    isFavorite:    t.isFavorite ?? false,
    isRoot:        t.isRoot ?? false,
    createdAt:     new Date(t.createdAt),
  };
}

/** Reconstruye el array de conexiones del store a partir de los nodos del backend */
export function extractConnections(thoughts: BackendThought[]): Connection[] {
  const seen = new Set<string>();
  const conns: Connection[] = [];
  for (const t of thoughts) {
    for (const c of t.connections ?? []) {
      if (c.connectionId && !seen.has(c.connectionId)) {
        seen.add(c.connectionId);
        conns.push({ id: c.connectionId, source: c.source, target: c.target });
      }
    }
  }
  return conns;
}

// ── API calls ─────────────────────────────────────────────────────────────────

export async function apiGetThoughts(): Promise<BackendThought[]> {
  const res = await fetch(`${API_BASE}/thoughts`, { headers: authHeadersOnly() });
  if (!res.ok) throw new Error('Error al obtener pensamientos');
  const data = await res.json();
  return data.data as BackendThought[];
}

export async function apiCreateThought(node: MindverseNode, connections: Connection[]): Promise<{ _id: string }> {
  const res = await fetch(`${API_BASE}/thoughts`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify({
      content:        node.content,
      description:    node.description ?? '',
      category:       node.category,
      temporalState:  node.temporalState,
      emotionalLevel: node.emotionalLevel,
      positionX:      node.positionX,
      positionY:      node.positionY,
      color:          node.color,
      imageUrl:       node.imageUrl ?? null,
      tags:           node.tags ?? [],
      isFavorite:     node.isFavorite ?? false,
      isRoot:         node.isRoot ?? false,
      connections:    outgoingConns(node.id, connections),
    }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error ?? 'Error al crear pensamiento');
  }
  const result = await res.json();
  return { _id: result.data._id };
}

export async function apiUpdateThought(
  nodeId: string,
  updates: Partial<MindverseNode>,
  connections?: Connection[]
): Promise<void> {
  const body: Record<string, any> = { ...updates };
  // Renombrar id→frontendId si viene en updates
  if ('id' in body) { delete body.id; }
  if (connections !== undefined) {
    body.connections = outgoingConns(nodeId, connections);
  }
  const res = await fetch(`${API_BASE}/thoughts/${nodeId}`, {
    method: 'PATCH',
    headers: authHeaders(),
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error ?? 'Error al actualizar pensamiento');
  }
}

export async function apiDeleteThought(nodeId: string): Promise<void> {
  const res = await fetch(`${API_BASE}/thoughts/${nodeId}`, { method: 'DELETE', headers: authHeadersOnly() });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error ?? 'Error al eliminar pensamiento');
  }
}

export async function apiBulkSync(nodes: MindverseNode[], connections: Connection[]): Promise<void> {
  const thoughts = nodes.map((node) => ({
    _id:            node.id, // _id de MongoDB
    content:        node.content,
    description:    node.description ?? '',
    category:       node.category,
    temporalState:  node.temporalState,
    emotionalLevel: node.emotionalLevel,
    positionX:      node.positionX,
    positionY:      node.positionY,
    color:          node.color,
    imageUrl:       node.imageUrl ?? null,
    tags:           node.tags ?? [],
    isFavorite:     node.isFavorite ?? false,
    isRoot:         node.isRoot ?? false,
    connections:    outgoingConns(node.id, connections),
  }));
  const res = await fetch(`${API_BASE}/thoughts/bulk`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify({ thoughts }),
  });
  if (!res.ok) throw new Error('Error en bulk sync');
}
