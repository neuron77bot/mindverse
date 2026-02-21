import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { MindverseNode, Connection, Category, TemporalState } from '../types';
import type { LayoutDirection } from '../utils/layoutUtils';
import {
  apiGetThoughts, apiCreateThought, apiUpdateThought,
  apiDeleteThought, apiBulkSync,
  backendToNode, extractConnections,
} from '../services/thoughtsApi';

// ── Debounce helper ───────────────────────────────────────────────────────────
const positionTimers = new Map<string, ReturnType<typeof setTimeout>>();

function debouncePosition(nodeId: string, fn: () => void, delay = 1200) {
  const prev = positionTimers.get(nodeId);
  if (prev) clearTimeout(prev);
  positionTimers.set(nodeId, setTimeout(() => { fn(); positionTimers.delete(nodeId); }, delay));
}

// ── Tipos ─────────────────────────────────────────────────────────────────────
interface MindverseStore {
  // Estado
  nodes: MindverseNode[];
  connections: Connection[];
  activeTemporalFilter: TemporalState | 'ALL';
  activeCategoryFilter: Category | 'ALL';
  selectedNode: MindverseNode | null;
  isEditorOpen: boolean;
  layoutDirection: LayoutDirection;
  focusedNodeId: string | null;
  syncStatus: 'idle' | 'syncing' | 'error';
  parentNodeId: string | null; // Para crear hijo desde Detail

  // Acciones - Pensamientos
  addNode: (node: MindverseNode) => void;
  updateNode: (id: string, updates: Partial<MindverseNode>) => void;
  deleteNode: (id: string) => void;
  updateNodePosition: (id: string, x: number, y: number) => void;

  // Acciones - Conexiones
  addConnection: (connection: Connection) => void;
  deleteConnection: (id: string) => void;

  // Acciones - Filtros
  setTemporalFilter: (filter: TemporalState | 'ALL') => void;
  setCategoryFilter: (filter: Category | 'ALL') => void;
  setLayoutDirection: (direction: LayoutDirection) => void;
  setFocusedNode: (id: string | null) => void;

  // Acciones - Editor
  setSelectedNode: (node: MindverseNode | null) => void;
  openEditor: (node?: MindverseNode, parentNodeId?: string) => void;
  closeEditor: () => void;

  // Acciones - Utilidades
  getFilteredNodes: () => MindverseNode[];
  getFilteredConnections: () => Connection[];

  // Acciones - Sync
  initFromBackend: () => Promise<void>;
}

export const useMindverseStore = create<MindverseStore>()(
  persist(
    (set, get) => ({
      // Estado inicial
      nodes: [],
      connections: [],
      activeTemporalFilter: 'PRESENT',
      activeCategoryFilter: 'ALL',
      selectedNode: null,
      isEditorOpen: false,
      layoutDirection: 'LR',
      focusedNodeId: null,
      syncStatus: 'idle',
      parentNodeId: null,

      // ── Nodos ────────────────────────────────────────────────────────────────
      addNode: async (node) => {
        const tempId = node.id; // UUID temporal
        set((state) => ({ nodes: [...state.nodes, node] }));
        
        try {
          const { connections } = get();
          const { _id } = await apiCreateThought(node, connections);
          
          // Actualizar el nodo con el _id de MongoDB
          set((state) => ({
            nodes: state.nodes.map((n) => n.id === tempId ? { ...n, id: _id } : n),
            connections: state.connections.map((c) => ({
              ...c,
              source: c.source === tempId ? _id : c.source,
              target: c.target === tempId ? _id : c.target,
            })),
          }));
        } catch (err) {
          console.error('Error creating thought:', err);
          // Revertir en caso de error
          set((state) => ({ nodes: state.nodes.filter((n) => n.id !== tempId) }));
        }
      },

      updateNode: (id, updates) => {
        set((state) => ({
          nodes: state.nodes.map((n) => n.id === id ? { ...n, ...updates } : n),
        }));
        const { connections } = get();
        apiUpdateThought(id, updates, connections).catch(console.error);
      },

      deleteNode: (id) => {
        
        set((state) => ({
          nodes: state.nodes.filter((n) => n.id !== id),
          connections: state.connections.filter((c) => c.source !== id && c.target !== id),
        }));
        apiDeleteThought(id).catch(console.error);
      },

      updateNodePosition: (id, x, y) => {
        set((state) => ({
          nodes: state.nodes.map((n) => n.id === id ? { ...n, positionX: x, positionY: y } : n),
        }));
        debouncePosition(id, () => {
          const { connections } = get();
          apiUpdateThought(id, { positionX: x, positionY: y }, connections).catch(console.error);
        });
      },

      // ── Conexiones ───────────────────────────────────────────────────────────
      addConnection: (connection) => {
        set((state) => ({ connections: [...state.connections, connection] }));
        // Actualizar nodo source con las nuevas conexiones
        const { connections } = get();
        apiUpdateThought(connection.source, {}, connections).catch(console.error);
      },

      deleteConnection: (id) => {
        const { connections } = get();
        const conn = connections.find((c) => c.id === id);
        set((state) => ({
          connections: state.connections.filter((c) => c.id !== id),
        }));
        if (conn) {
          const updated = connections.filter((c) => c.id !== id);
          apiUpdateThought(conn.source, {}, updated).catch(console.error);
        }
      },

      // ── Filtros ───────────────────────────────────────────────────────────────
      setTemporalFilter:  (filter)    => set({ activeTemporalFilter: filter }),
      setCategoryFilter:  (filter)    => set({ activeCategoryFilter: filter }),
      setLayoutDirection: (direction) => set({ layoutDirection: direction }),
      setFocusedNode:     (id)        => set({ focusedNodeId: id }),

      // ── Editor ────────────────────────────────────────────────────────────────
      setSelectedNode: (node) => set({ selectedNode: node }),
      openEditor:  (node, parentNodeId) => set({ 
        selectedNode: node || null, 
        isEditorOpen: true,
        parentNodeId: parentNodeId || null 
      }),
      closeEditor: ()     => set({ selectedNode: null, isEditorOpen: false, parentNodeId: null }),

      // ── Getters ───────────────────────────────────────────────────────────────
      getFilteredNodes: () => {
        const { nodes, activeTemporalFilter, activeCategoryFilter } = get();
        return nodes.filter((node) => {
          
          const matchesTemporal =
            activeTemporalFilter === 'ALL' || node.temporalState === activeTemporalFilter;
          const matchesCategory =
            activeCategoryFilter === 'ALL' || node.category === activeCategoryFilter;
          return matchesTemporal && matchesCategory;
        });
      },

      getFilteredConnections: () => {
        const filteredNodes = get().getFilteredNodes();
        const nodeIds = new Set(filteredNodes.map((n) => n.id));
        return get().connections.filter(
          (conn) => nodeIds.has(conn.source) && nodeIds.has(conn.target)
        );
      },

      // ── Sync con backend ──────────────────────────────────────────────────────
      initFromBackend: async () => {
        set({ syncStatus: 'syncing' });
        try {
          const backendThoughts = await apiGetThoughts();

          if (backendThoughts.length > 0) {
            // El backend tiene datos → los usamos como fuente de verdad
            const nodes = backendThoughts.map(backendToNode);
            const connections = extractConnections(backendThoughts);
            set({ nodes, connections, syncStatus: 'idle' });
          } else {
            // Backend vacío → sincronizamos el estado local
            const { nodes, connections } = get();
            await apiBulkSync(nodes, connections);
            set({ syncStatus: 'idle' });
          }
        } catch (err) {
          console.warn('⚠️ Backend no disponible, usando datos locales:', err);
          set({ syncStatus: 'error' });
        }
      },
    }),
    {
      name: 'mindverse-storage',
      partialize: (state) => ({
        nodes:                state.nodes,
        connections:          state.connections,
        activeTemporalFilter: state.activeTemporalFilter,
        activeCategoryFilter: state.activeCategoryFilter,
      }),
    }
  )
);
