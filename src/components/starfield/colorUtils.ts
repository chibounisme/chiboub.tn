import type { Color } from './types';
import { STAR_COLORS, STAR_COLOR_WEIGHTS, SHOOTING_STAR_COLORS } from './constants';

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
 * Get a random shooting star color with unique variation
 */
export const getRandomShootingStarColor = (): Color => {
  const baseColor = SHOOTING_STAR_COLORS[Math.floor(Math.random() * SHOOTING_STAR_COLORS.length)];
  
  // Add variation for uniqueness
  return {
    r: Math.min(255, Math.max(0, baseColor.r + Math.floor((Math.random() - 0.5) * 30))),
    g: Math.min(255, Math.max(0, baseColor.g + Math.floor((Math.random() - 0.5) * 30))),
    b: Math.min(255, Math.max(0, baseColor.b + Math.floor((Math.random() - 0.5) * 30))),
  };
};

/**
 * Generate random galaxy color with high diversity
 * Based on real galaxy color observations (SDSS surveys)
 */
export const getRandomGalaxyColor = (): Color => {
  const galaxyType = Math.random();
  let r: number, g: number, b: number;
  
  if (galaxyType < 0.25) {
    // Young star-forming galaxies (blue)
    r = 120 + Math.floor(Math.random() * 80);
    g = 150 + Math.floor(Math.random() * 80);
    b = 200 + Math.floor(Math.random() * 55);
  } else if (galaxyType < 0.45) {
    // Elliptical/old galaxies (red/orange)
    r = 220 + Math.floor(Math.random() * 35);
    g = 160 + Math.floor(Math.random() * 60);
    b = 100 + Math.floor(Math.random() * 60);
  } else if (galaxyType < 0.6) {
    // Mixed-age spirals (yellow/gold)
    r = 200 + Math.floor(Math.random() * 55);
    g = 180 + Math.floor(Math.random() * 60);
    b = 120 + Math.floor(Math.random() * 80);
  } else if (galaxyType < 0.75) {
    // Active galactic nuclei (purple/violet)
    r = 160 + Math.floor(Math.random() * 80);
    g = 100 + Math.floor(Math.random() * 80);
    b = 180 + Math.floor(Math.random() * 75);
  } else if (galaxyType < 0.85) {
    // Starburst galaxies (cyan/teal)
    r = 100 + Math.floor(Math.random() * 80);
    g = 180 + Math.floor(Math.random() * 60);
    b = 200 + Math.floor(Math.random() * 55);
  } else if (galaxyType < 0.93) {
    // Seyfert galaxies (green-blue)
    r = 120 + Math.floor(Math.random() * 60);
    g = 170 + Math.floor(Math.random() * 60);
    b = 180 + Math.floor(Math.random() * 60);
  } else {
    // Rare/unusual galaxies (pink/rose)
    r = 200 + Math.floor(Math.random() * 55);
    g = 140 + Math.floor(Math.random() * 60);
    b = 170 + Math.floor(Math.random() * 70);
  }
  
  return { r, g, b };
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
