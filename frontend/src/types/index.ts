// Tipos para el estado temporal
export type TemporalState = 'PAST' | 'PRESENT' | 'FUTURE';

// Categorías de vida disponibles
export type Category =
  | 'HEALTH'
  | 'WORK'
  | 'LOVE'
  | 'FAMILY'
  | 'FINANCES'
  | 'PERSONAL_GROWTH'
  | 'LEISURE'
  | 'SPIRITUALITY'
  | 'SOCIAL';

// Interfaz para un nodo del mapa mental
export interface MindverseNode {
  id: string;
  content: string;
  description?: string;
  category: Category;
  temporalState: TemporalState;
  positionX: number;
  positionY: number;
  color: string;
  createdAt: Date;
}

// Interfaz para una conexión entre nodos
export interface Connection {
  id: string;
  source: string;
  target: string;
  label?: string;
}

// Estado completo del mapa mental
export interface MindverseState {
  nodes: MindverseNode[];
  connections: Connection[];
  activeTemporalFilter: TemporalState | 'ALL';
  activeCategoryFilter: Category | 'ALL';
}
