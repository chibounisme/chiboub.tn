import type { Color } from './types';
import { STAR_COLORS, STAR_COLOR_WEIGHTS, GALAXY_COLOR_PALETTES, CLUSTER_COLOR_PALETTES } from './constants';

/**
 * Get a random star color with unique per-star variation
 * Uses weighted selection plus subtle color shifting for uniqueness
 */
export const getRandomStarColor = (): Color => {
  const random = Math.random();
  let cumulative = 0;
  let baseColor = STAR_COLORS[STAR_COLORS.length - 1];
  
  for (let i = 0; i < STAR_COLOR_WEIGHTS.length; i++) {
    cumulative += STAR_COLOR_WEIGHTS[i];
    if (random < cumulative) {
      baseColor = STAR_COLORS[i];
      break;
    }
  }
  
  // Add subtle unique variation to each star (±10 per channel)
  return {
    r: Math.min(255, Math.max(0, baseColor.r + Math.floor((Math.random() - 0.5) * 20))),
    g: Math.min(255, Math.max(0, baseColor.g + Math.floor((Math.random() - 0.5) * 20))),
    b: Math.min(255, Math.max(0, baseColor.b + Math.floor((Math.random() - 0.5) * 20))),
  };
};

/**
 * Get a random galaxy color palette
 * Returns [core, arm, outer] colors
 */
export const getRandomGalaxyPalette = (): [Color, Color, Color] => {
  const paletteKeys = Object.keys(GALAXY_COLOR_PALETTES);
  const randomKey = paletteKeys[Math.floor(Math.random() * paletteKeys.length)];
  const palette = GALAXY_COLOR_PALETTES[randomKey];
  
  // Return varied versions of the palette colors
  return [
    varyColor(palette[0], 20),
    varyColor(palette[1], 30),
    varyColor(palette[2], 40)
  ];
};

/**
 * Get a random cluster base color
 */
export const getRandomClusterColor = (): Color => {
  const paletteKeys = Object.keys(CLUSTER_COLOR_PALETTES);
  const randomKey = paletteKeys[Math.floor(Math.random() * paletteKeys.length)];
  const baseColor = CLUSTER_COLOR_PALETTES[randomKey];
  
  return varyColor(baseColor, 20);
};

/**
 * Generate a color variation from a base color with configurable variance
 */
export const varyColor = (base: Color, variance: number): Color => {
  return {
    r: Math.min(255, Math.max(0, base.r + Math.floor((Math.random() - 0.5) * variance))),
    g: Math.min(255, Math.max(0, base.g + Math.floor((Math.random() - 0.5) * variance))),
    b: Math.min(255, Math.max(0, base.b + Math.floor((Math.random() - 0.5) * variance))),
  };
};

/**
 * Blend two colors with a ratio
 */
export const blendColors = (color1: Color, color2: Color, ratio: number): Color => {
  const r = Math.floor(color1.r * (1 - ratio) + color2.r * ratio);
  const g = Math.floor(color1.g * (1 - ratio) + color2.g * ratio);
  const b = Math.floor(color1.b * (1 - ratio) + color2.b * ratio);
  return { r, g, b };
};

/**
 * Shift hue slightly for unique color variations
 */
export const shiftHue = (color: Color, amount: number): Color => {
  // Simple hue rotation approximation
  const shift = Math.floor((Math.random() - 0.5) * amount);
  return {
    r: Math.min(255, Math.max(0, color.r + shift)),
    g: Math.min(255, Math.max(0, color.g - shift * 0.5)),
    b: Math.min(255, Math.max(0, color.b + shift * 0.3)),
  };
};
