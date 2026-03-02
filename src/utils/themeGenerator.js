/**
 * Theme Generator Utility
 * Converts a hex primary color into a full OKLCH CSS variable palette
 * Used by the GET /api/firm-settings/theme endpoint
 */

const { parse, formatCss, converter } = require('culori');

const toOklch = converter('oklch');

/**
 * Convert hex color to OKLCH components
 * @param {string} hex - Hex color string (e.g., "#1a0a4e")
 * @returns {{ l: number, c: number, h: number }} OKLCH components
 */
function hexToOklch(hex) {
  const parsed = parse(hex);
  if (!parsed) throw new Error(`Invalid hex color: ${hex}`);
  const oklch = toOklch(parsed);
  return {
    l: oklch.l || 0,
    c: oklch.c || 0,
    h: oklch.h || 0
  };
}

/**
 * Format OKLCH values as a CSS string
 * @param {number} l - Lightness (0-1)
 * @param {number} c - Chroma (0-0.4)
 * @param {number} h - Hue (0-360)
 * @returns {string} CSS oklch() string
 */
function oklchString(l, c, h) {
  return `oklch(${l.toFixed(4)} ${c.toFixed(4)} ${((h % 360) + 360) % 360 === 0 && c < 0.001 ? 0 : ((h % 360) + 360) % 360 === 0 ? h.toFixed(3) : (((h % 360) + 360) % 360).toFixed(3)})`;
}

/**
 * Simplified oklch string formatter
 */
function oklch(l, c, h) {
  const hNorm = c < 0.001 ? 0 : ((h % 360) + 360) % 360;
  return `oklch(${l.toFixed(4)} ${c.toFixed(4)} ${hNorm.toFixed(3)})`;
}

/**
 * Clamp a value between min and max
 */
function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

/**
 * Generate a complete CSS variable palette from a primary hex color
 * @param {object} themeConfig - Theme configuration
 * @param {string} themeConfig.primaryColor - Hex primary color
 * @param {string} [themeConfig.fontFamily] - Google Font name
 * @param {number} [themeConfig.borderRadius] - Border radius in rem
 * @returns {{ cssVariables: string, fontUrl: string|null }} CSS variables string and optional font URL
 */
function generateThemePalette(themeConfig) {
  const { primaryColor, fontFamily, borderRadius } = themeConfig;
  const { l, c, h } = hexToOklch(primaryColor);

  // === Light mode variables ===
  const lightVars = {
    '--primary': oklch(l, c, h),
    '--primary-foreground': oklch(0.969, Math.min(c * 0.12, 0.02), h),
    '--ring': oklch(clamp(l + 0.35, 0.5, 0.65), clamp(c * 1.5, 0.15, 0.3), h),
    '--sidebar-primary': oklch(clamp(l + 0.35, 0.5, 0.65), clamp(c * 1.5, 0.15, 0.3), h),
    '--sidebar-primary-foreground': oklch(0.969, Math.min(c * 0.12, 0.02), h),
    '--sidebar-ring': oklch(clamp(l + 0.35, 0.5, 0.65), clamp(c * 1.5, 0.15, 0.3), h),
    // Charts: 5 hue rotations, 72° apart
    '--chart-1': oklch(0.646, clamp(c * 1.2, 0.15, 0.25), (h + 120) % 360),
    '--chart-2': oklch(0.600, clamp(c * 0.9, 0.08, 0.15), (h + 192) % 360),
    '--chart-3': oklch(0.398, clamp(c * 0.6, 0.05, 0.10), (h + 264) % 360),
    '--chart-4': oklch(0.828, clamp(c * 1.0, 0.12, 0.20), (h + 336) % 360),
    '--chart-5': oklch(0.769, clamp(c * 1.0, 0.12, 0.20), (h + 48) % 360),
    // Near-neutrals tinted with primary hue
    '--secondary': oklch(0.967, 0.001, h),
    '--secondary-foreground': oklch(0.210, 0.006, h),
    '--accent': oklch(0.967, 0.001, h),
    '--accent-foreground': oklch(0.210, 0.006, h),
    '--muted': oklch(0.967, 0.001, h),
    '--muted-foreground': oklch(0.552, 0.016, h),
    '--sidebar-accent': oklch(0.967, 0.001, h),
    '--sidebar-accent-foreground': oklch(0.210, 0.006, h),
    '--border': oklch(0.920, 0.004, h),
    '--input': oklch(0.920, 0.004, h),
    '--sidebar-border': oklch(0.920, 0.004, h),
  };

  // === Dark mode variables ===
  const darkVars = {
    '--primary': oklch(clamp(l + 0.29, 0.45, 0.58), clamp(c * 1.8, 0.2, 0.32), h),
    '--primary-foreground': oklch(0.969, Math.min(c * 0.12, 0.02), h),
    '--ring': oklch(clamp(l + 0.29, 0.45, 0.58), clamp(c * 1.8, 0.2, 0.32), h),
    '--sidebar-primary': oklch(clamp(l + 0.29, 0.45, 0.58), clamp(c * 1.8, 0.2, 0.32), h),
    '--sidebar-primary-foreground': oklch(0.969, Math.min(c * 0.12, 0.02), h),
    '--sidebar-ring': oklch(clamp(l + 0.29, 0.45, 0.58), clamp(c * 1.8, 0.2, 0.32), h),
    '--chart-1': oklch(0.488, clamp(c * 1.5, 0.18, 0.28), (h + 120) % 360),
    '--chart-2': oklch(0.696, clamp(c * 1.0, 0.10, 0.20), (h + 192) % 360),
    '--chart-3': oklch(0.769, clamp(c * 1.0, 0.12, 0.20), (h + 264) % 360),
    '--chart-4': oklch(0.627, clamp(c * 1.5, 0.18, 0.30), (h + 336) % 360),
    '--chart-5': oklch(0.645, clamp(c * 1.5, 0.18, 0.28), (h + 48) % 360),
    '--secondary': oklch(0.274, 0.006, h),
    '--secondary-foreground': oklch(0.985, 0, 0),
    '--accent': oklch(0.274, 0.006, h),
    '--accent-foreground': oklch(0.985, 0, 0),
    '--muted': oklch(0.274, 0.006, h),
    '--muted-foreground': oklch(0.705, 0.015, h),
    '--sidebar-accent': oklch(0.274, 0.006, h),
    '--sidebar-accent-foreground': oklch(0.985, 0, 0),
    '--border': 'oklch(1 0 0 / 10%)',
    '--input': 'oklch(1 0 0 / 15%)',
    '--sidebar-border': 'oklch(1 0 0 / 10%)',
  };

  // Build CSS string
  let css = ':root {\n';
  for (const [key, value] of Object.entries(lightVars)) {
    css += `  ${key}: ${value};\n`;
  }
  if (borderRadius != null) {
    css += `  --radius: ${borderRadius}rem;\n`;
  }
  css += '}\n\n';

  css += '.dark {\n';
  for (const [key, value] of Object.entries(darkVars)) {
    css += `  ${key}: ${value};\n`;
  }
  css += '}\n';

  // Font URL
  let fontUrl = null;
  if (fontFamily && fontFamily !== 'Geist') {
    const fontParam = fontFamily.replace(/\s+/g, '+');
    fontUrl = `https://fonts.googleapis.com/css2?family=${fontParam}:wght@300;400;500;600;700&display=swap`;
  }

  // Add font-family CSS if custom font
  if (fontFamily && fontFamily !== 'Geist') {
    css = css.replace(':root {', `:root {\n  --font-geist-sans: '${fontFamily}', sans-serif;`);
  }

  return { cssVariables: css, fontUrl };
}

module.exports = { generateThemePalette, hexToOklch };
