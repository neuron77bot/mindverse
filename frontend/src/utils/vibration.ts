export function getFreqLabel(calibration: number): {
  label: string;
  icon: string;
  color: string;
  bg: string;
} {
  if (calibration < 200) {
    return {
      label: 'Baja frecuencia',
      icon: '🔻',
      color: '#F87171',
      bg: '#F8717118',
    };
  }
  return {
    label: 'Alta frecuencia',
    icon: '✨',
    color: '#34D399',
    bg: '#34D39918',
  };
}
