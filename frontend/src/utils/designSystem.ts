/**
 * Design System Utilities
 * Helper functions to work with CSS custom properties and dynamic colors
 */

/**
 * Creates style object with color variables for vibration-based styling
 * Use with CSS classes like .badge-vibration, .bg-vibration-medium, etc.
 */
export function vibrationVars(color: string): React.CSSProperties {
  return {
    '--vib-color': color,
    '--vib-color-alpha-08': `${color}08`,
    '--vib-color-alpha-10': `${color}10`,
    '--vib-color-alpha-15': `${color}15`,
    '--vib-color-alpha-20': `${color}20`,
    '--vib-color-alpha-25': `${color}25`,
    '--vib-color-alpha-50': `${color}50`,
  } as React.CSSProperties;
}

/**
 * Creates style object with color variables for category-based styling
 * Use with CSS classes like .badge-category, .border-category-light, etc.
 */
export function categoryVars(color: string): React.CSSProperties {
  return {
    '--cat-color': color,
    '--cat-color-alpha-20': `${color}20`,
    '--cat-color-alpha-30': `${color}30`,
  } as React.CSSProperties;
}

/**
 * Creates style object with color variables for frequency labels
 * Use with CSS class .badge-frequency
 */
export function frequencyVars(color: string, bg: string): React.CSSProperties {
  return {
    '--freq-color': color,
    '--freq-bg': bg,
  } as React.CSSProperties;
}

/**
 * Creates gradient background string for node banners
 */
export function nodeGradient(color: string): string {
  return `linear-gradient(135deg, ${color}55 0%, ${color}22 100%)`;
}

/**
 * Combines multiple style objects safely
 */
export function mergeStyles(...styles: (React.CSSProperties | undefined)[]): React.CSSProperties {
  return Object.assign({}, ...styles.filter(Boolean));
}
