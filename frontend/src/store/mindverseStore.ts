import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { MindverseNode, Connection, Category, TemporalState } from '../types';
import { mockNodes, mockConnections, ROOT_NODE_ID } from '../data/mockData';

interface MindverseStore {
  // Estado
  nodes: MindverseNode[];
  connections: Connection[];
  activeTemporalFilter: TemporalState | 'ALL';
  activeCategoryFilter: Category | 'ALL';
  selectedNode: MindverseNode | null;
  isEditorOpen: boolean;

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

  // Acciones - Editor
  setSelectedNode: (node: MindverseNode | null) => void;
  openEditor: (node?: MindverseNode) => void;
  closeEditor: () => void;

  // Acciones - Utilidades
  getFilteredNodes: () => MindverseNode[];
  getFilteredConnections: () => Connection[];
  resetToMockData: () => void;
}

export const useMindverseStore = create<MindverseStore>()(
  persist(
    (set, get) => ({
      // Estado inicial con datos mock
      nodes: mockNodes,
      connections: mockConnections,
      activeTemporalFilter: 'PRESENT',
      activeCategoryFilter: 'ALL',
      selectedNode: null,
      isEditorOpen: false,

      // Acciones - Nodos
      addNode: (node) =>
        set((state) => ({
          nodes: [...state.nodes, node],
        })),

      updateNode: (id, updates) =>
        set((state) => ({
          nodes: state.nodes.map((node) =>
            node.id === id ? { ...node, ...updates } : node
          ),
        })),

      deleteNode: (id) => {
        if (id === ROOT_NODE_ID) return;
        set((state) => ({
          nodes: state.nodes.filter((node) => node.id !== id),
          connections: state.connections.filter(
            (conn) => conn.source !== id && conn.target !== id
          ),
        }));
      },

      updateNodePosition: (id, x, y) =>
        set((state) => ({
          nodes: state.nodes.map((node) =>
            node.id === id ? { ...node, positionX: x, positionY: y } : node
          ),
        })),

      // Acciones - Conexiones
      addConnection: (connection) =>
        set((state) => ({
          connections: [...state.connections, connection],
        })),

      deleteConnection: (id) =>
        set((state) => ({
          connections: state.connections.filter((conn) => conn.id !== id),
        })),

      // Acciones - Filtros
      setTemporalFilter: (filter) => set({ activeTemporalFilter: filter }),

      setCategoryFilter: (filter) => set({ activeCategoryFilter: filter }),

      // Acciones - Editor
      setSelectedNode: (node) => set({ selectedNode: node }),

      openEditor: (node) =>
        set({
          selectedNode: node || null,
          isEditorOpen: true,
        }),

      closeEditor: () =>
        set({
          selectedNode: null,
          isEditorOpen: false,
        }),

      // Getters — el nodo raíz (Casco Periférico) siempre es visible
      getFilteredNodes: () => {
        const { nodes, activeTemporalFilter, activeCategoryFilter } = get();
        return nodes.filter((node) => {
          if (node.id === ROOT_NODE_ID) return true;
          const matchesTemporal =
            activeTemporalFilter === 'ALL' ||
            node.temporalState === activeTemporalFilter;
          const matchesCategory =
            activeCategoryFilter === 'ALL' ||
            node.category === activeCategoryFilter;
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

      resetToMockData: () =>
        set({
          nodes: mockNodes,
          connections: mockConnections,
        }),
    }),
    {
      name: 'mindverse-storage',
      partialize: (state) => ({
        nodes: state.nodes,
        connections: state.connections,
        activeTemporalFilter: state.activeTemporalFilter,
        activeCategoryFilter: state.activeCategoryFilter,
      }),
    }
  )
);
