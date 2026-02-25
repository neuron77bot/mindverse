// Tipos para el estado temporal (metadato del pensamiento)
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

// Niveles vibracionales de emoción según la escala del Dr. David R. Hawkins
export type EmotionalLevel =
  | 'SHAME'
  | 'GUILT'
  | 'APATHY'
  | 'GRIEF'
  | 'FEAR'
  | 'DESIRE'
  | 'ANGER'
  | 'PRIDE'
  | 'COURAGE'
  | 'NEUTRALITY'
  | 'WILLINGNESS'
  | 'ACCEPTANCE'
  | 'REASON'
  | 'LOVE'
  | 'JOY'
  | 'PEACE'
  | 'ENLIGHTENMENT';

// Interfaz para un pensamiento en el mapa mental
export interface MindverseNode {
  id: string;
  content: string;
  description?: string;
  category: Category;
  temporalState: TemporalState;
  emotionalLevel: EmotionalLevel;
  positionX: number;
  positionY: number;
  color: string;
  createdAt: Date;
  imageUrl?: string; // thumbnail generado con IA
  tags?: string[]; // etiquetas personalizadas
  isFavorite?: boolean; // destacado
  isRoot?: boolean; // pensamiento raíz (se muestra en Home)
}

// Interfaz para una conexión entre pensamientos
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
