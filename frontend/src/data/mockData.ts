import type { Category, EmotionalLevel } from '../types';

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

