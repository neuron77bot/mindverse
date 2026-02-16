import type { MindverseNode, Connection, Category, EmotionalLevel } from '../types';

// ===== CATEGORÍAS DE VIDA =====

export const CATEGORY_COLORS: Record<Category, string> = {
  HEALTH: '#10B981',
  WORK: '#3B82F6',
  LOVE: '#EF4444',
  FAMILY: '#F59E0B',
  FINANCES: '#8B5CF6',
  PERSONAL_GROWTH: '#06B6D4',
  LEISURE: '#EC4899',
  SPIRITUALITY: '#6366F1',
  SOCIAL: '#14B8A6',
};

export const CATEGORY_LABELS: Record<Category, string> = {
  HEALTH: 'Salud',
  WORK: 'Trabajo',
  LOVE: 'Amor',
  FAMILY: 'Familia',
  FINANCES: 'Finanzas',
  PERSONAL_GROWTH: 'Crecimiento Personal',
  LEISURE: 'Ocio',
  SPIRITUALITY: 'Espiritualidad',
  SOCIAL: 'Social',
};

// ===== LÍNEA TEMPORAL (metadatos) =====

export const TEMPORAL_LABELS: Record<string, string> = {
  PAST: 'Pasado',
  PRESENT: 'Presente',
  FUTURE: 'Futuro',
  ALL: 'Todos',
};

// ===== ESCALA VIBRACIONAL — Dr. David R. Hawkins =====

export interface HawkinsLevel {
  key: EmotionalLevel;
  label: string;
  calibration: number;
  color: string;
}

export const HAWKINS_SCALE: HawkinsLevel[] = [
  { key: 'SHAME',         label: 'Vergüenza',    calibration: 20,   color: '#4A0404' },
  { key: 'GUILT',         label: 'Culpa',         calibration: 30,   color: '#6B0F0F' },
  { key: 'APATHY',        label: 'Apatía',        calibration: 50,   color: '#7C2D12' },
  { key: 'GRIEF',         label: 'Duelo',         calibration: 75,   color: '#92400E' },
  { key: 'FEAR',          label: 'Miedo',         calibration: 100,  color: '#A16207' },
  { key: 'DESIRE',        label: 'Deseo',         calibration: 125,  color: '#CA8A04' },
  { key: 'ANGER',         label: 'Ira',           calibration: 150,  color: '#DC2626' },
  { key: 'PRIDE',         label: 'Orgullo',       calibration: 175,  color: '#EA580C' },
  { key: 'COURAGE',       label: 'Coraje',        calibration: 200,  color: '#D97706' },
  { key: 'NEUTRALITY',    label: 'Neutralidad',   calibration: 250,  color: '#65A30D' },
  { key: 'WILLINGNESS',   label: 'Voluntad',      calibration: 310,  color: '#16A34A' },
  { key: 'ACCEPTANCE',    label: 'Aceptación',    calibration: 350,  color: '#0D9488' },
  { key: 'REASON',        label: 'Razón',         calibration: 400,  color: '#0891B2' },
  { key: 'LOVE',          label: 'Amor',          calibration: 500,  color: '#EC4899' },
  { key: 'JOY',           label: 'Alegría',       calibration: 540,  color: '#F59E0B' },
  { key: 'PEACE',         label: 'Paz',           calibration: 600,  color: '#8B5CF6' },
  { key: 'ENLIGHTENMENT', label: 'Iluminación',   calibration: 700,  color: '#FBBF24' },
];

export const EMOTIONAL_LABELS: Record<EmotionalLevel, string> = Object.fromEntries(
  HAWKINS_SCALE.map((l) => [l.key, `${l.label} (${l.calibration})`])
) as Record<EmotionalLevel, string>;

export const EMOTIONAL_COLORS: Record<EmotionalLevel, string> = Object.fromEntries(
  HAWKINS_SCALE.map((l) => [l.key, l.color])
) as Record<EmotionalLevel, string>;

// ===== NODO RAÍZ — CASCO PERIFÉRICO (Punto Cero) =====

export const ROOT_NODE_ID = 'casco-periferico';

const rootNode: MindverseNode = {
  id: ROOT_NODE_ID,
  content: 'Casco Periférico',
  description: 'Punto cero — origen de todos los pensamientos',
  category: 'SPIRITUALITY',
  temporalState: 'PRESENT',
  emotionalLevel: 'PEACE',
  positionX: 400,
  positionY: 0,
  color: '#FBBF24',
  createdAt: new Date('2026-01-01'),
  isRoot: true,
};

// ===== PENSAMIENTOS DE EJEMPLO =====

export const mockNodes: MindverseNode[] = [
  rootNode,

  // ===== PASADO =====
  {
    id: 'node-1',
    content: 'Superé mi ansiedad',
    description: 'Después de meses de terapia, logré controlar mis ataques de pánico',
    category: 'HEALTH',
    temporalState: 'PAST',
    emotionalLevel: 'COURAGE',
    positionX: 100,
    positionY: 200,
    color: CATEGORY_COLORS.HEALTH,
    createdAt: new Date('2024-06-15'),
  },
  {
    id: 'node-2',
    content: 'Primer trabajo en tech',
    description: 'Conseguí mi primer empleo como desarrollador junior',
    category: 'WORK',
    temporalState: 'PAST',
    emotionalLevel: 'WILLINGNESS',
    positionX: 350,
    positionY: 200,
    color: CATEGORY_COLORS.WORK,
    createdAt: new Date('2023-03-20'),
  },
  {
    id: 'node-3',
    content: 'Ruptura importante',
    description: 'Terminé una relación de 3 años, fue doloroso pero necesario',
    category: 'LOVE',
    temporalState: 'PAST',
    emotionalLevel: 'GRIEF',
    positionX: 600,
    positionY: 200,
    color: CATEGORY_COLORS.LOVE,
    createdAt: new Date('2024-01-10'),
  },
  {
    id: 'node-4',
    content: 'Pagué mis deudas',
    description: 'Finalmente libre de deudas de tarjeta de crédito',
    category: 'FINANCES',
    temporalState: 'PAST',
    emotionalLevel: 'ACCEPTANCE',
    positionX: 225,
    positionY: 380,
    color: CATEGORY_COLORS.FINANCES,
    createdAt: new Date('2024-08-01'),
  },

  // ===== PRESENTE =====
  {
    id: 'node-5',
    content: 'Rutina de ejercicio',
    description: 'Voy al gimnasio 4 veces por semana, me siento con más energía',
    category: 'HEALTH',
    temporalState: 'PRESENT',
    emotionalLevel: 'WILLINGNESS',
    positionX: 100,
    positionY: 200,
    color: CATEGORY_COLORS.HEALTH,
    createdAt: new Date('2025-12-01'),
  },
  {
    id: 'node-6',
    content: 'Desarrollador Mid-Level',
    description: 'Trabajo remoto, buen salario, equipo increíble',
    category: 'WORK',
    temporalState: 'PRESENT',
    emotionalLevel: 'REASON',
    positionX: 400,
    positionY: 200,
    color: CATEGORY_COLORS.WORK,
    createdAt: new Date('2025-11-15'),
  },
  {
    id: 'node-7',
    content: 'Conociendo a alguien',
    description: 'Empezando a salir con alguien nuevo, vamos despacio',
    category: 'LOVE',
    temporalState: 'PRESENT',
    emotionalLevel: 'JOY',
    positionX: 700,
    positionY: 200,
    color: CATEGORY_COLORS.LOVE,
    createdAt: new Date('2026-01-20'),
  },
  {
    id: 'node-8',
    content: 'Ahorrando para departamento',
    description: 'Meta: juntar el 20% de enganche en 2 años',
    category: 'FINANCES',
    temporalState: 'PRESENT',
    emotionalLevel: 'NEUTRALITY',
    positionX: 400,
    positionY: 380,
    color: CATEGORY_COLORS.FINANCES,
    createdAt: new Date('2026-01-01'),
  },
  {
    id: 'node-9',
    content: 'Aprendiendo inglés',
    description: 'Clases 3 veces por semana, nivel B1 actualmente',
    category: 'PERSONAL_GROWTH',
    temporalState: 'PRESENT',
    emotionalLevel: 'WILLINGNESS',
    positionX: 100,
    positionY: 380,
    color: CATEGORY_COLORS.PERSONAL_GROWTH,
    createdAt: new Date('2025-09-01'),
  },
  {
    id: 'node-10',
    content: 'Relación cercana con mamá',
    description: 'Hablamos todas las semanas, la visito cada mes',
    category: 'FAMILY',
    temporalState: 'PRESENT',
    emotionalLevel: 'LOVE',
    positionX: 700,
    positionY: 380,
    color: CATEGORY_COLORS.FAMILY,
    createdAt: new Date('2025-06-01'),
  },

  // ===== FUTURO =====
  {
    id: 'node-11',
    content: 'Correr un maratón',
    description: 'Meta para 2027: completar mi primer maratón',
    category: 'HEALTH',
    temporalState: 'FUTURE',
    emotionalLevel: 'DESIRE',
    positionX: 100,
    positionY: 200,
    color: CATEGORY_COLORS.HEALTH,
    createdAt: new Date('2026-02-01'),
  },
  {
    id: 'node-12',
    content: 'Ser Tech Lead',
    description: 'En 3 años quiero liderar un equipo de desarrollo',
    category: 'WORK',
    temporalState: 'FUTURE',
    emotionalLevel: 'DESIRE',
    positionX: 400,
    positionY: 200,
    color: CATEGORY_COLORS.WORK,
    createdAt: new Date('2026-02-01'),
  },
  {
    id: 'node-13',
    content: 'Relación estable',
    description: 'Encontrar una pareja con quien construir un futuro',
    category: 'LOVE',
    temporalState: 'FUTURE',
    emotionalLevel: 'LOVE',
    positionX: 700,
    positionY: 200,
    color: CATEGORY_COLORS.LOVE,
    createdAt: new Date('2026-02-01'),
  },
  {
    id: 'node-14',
    content: 'Comprar departamento',
    description: 'Mi propio espacio en la ciudad',
    category: 'FINANCES',
    temporalState: 'FUTURE',
    emotionalLevel: 'DESIRE',
    positionX: 250,
    positionY: 380,
    color: CATEGORY_COLORS.FINANCES,
    createdAt: new Date('2026-02-01'),
  },
  {
    id: 'node-15',
    content: 'Inglés fluido C1',
    description: 'Poder trabajar en empresas internacionales sin barrera de idioma',
    category: 'PERSONAL_GROWTH',
    temporalState: 'FUTURE',
    emotionalLevel: 'WILLINGNESS',
    positionX: 550,
    positionY: 380,
    color: CATEGORY_COLORS.PERSONAL_GROWTH,
    createdAt: new Date('2026-02-01'),
  },
  {
    id: 'node-16',
    content: 'Viajar a Japón',
    description: 'Sueño de toda la vida: conocer Tokio y Kioto',
    category: 'LEISURE',
    temporalState: 'FUTURE',
    emotionalLevel: 'JOY',
    positionX: 400,
    positionY: 550,
    color: CATEGORY_COLORS.LEISURE,
    createdAt: new Date('2026-02-01'),
  },
];

// ===== CONEXIONES — Todas parten del Casco Periférico + relaciones entre pensamientos =====

export const mockConnections: Connection[] = [
  // Conexiones desde el Casco Periférico a pensamientos clave
  { id: 'conn-root-1', source: ROOT_NODE_ID, target: 'node-1', label: 'recuerdo' },
  { id: 'conn-root-2', source: ROOT_NODE_ID, target: 'node-5', label: 'siento ahora' },
  { id: 'conn-root-3', source: ROOT_NODE_ID, target: 'node-6', label: 'me define hoy' },
  { id: 'conn-root-4', source: ROOT_NODE_ID, target: 'node-11', label: 'anhelo' },
  { id: 'conn-root-5', source: ROOT_NODE_ID, target: 'node-10', label: 'agradezco' },

  // Relaciones entre pensamientos del presente
  {
    id: 'conn-1',
    source: 'node-5',
    target: 'node-6',
    label: 'me da energía para',
  },
  {
    id: 'conn-2',
    source: 'node-6',
    target: 'node-8',
    label: 'me permite',
  },
  {
    id: 'conn-3',
    source: 'node-9',
    target: 'node-6',
    label: 'mejora mi',
  },

  // Relaciones entre pensamientos del futuro
  {
    id: 'conn-4',
    source: 'node-12',
    target: 'node-14',
    label: 'financiará',
  },
  {
    id: 'conn-5',
    source: 'node-15',
    target: 'node-12',
    label: 'ayudará a lograr',
  },
  {
    id: 'conn-6',
    source: 'node-11',
    target: 'node-13',
    label: 'confianza para',
  },
];
