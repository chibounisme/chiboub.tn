import type { Color } from './types';

// Realistic star colors based on stellar classification (Harvard spectral classification)
export const STAR_COLORS: Color[] = [
  // O-class (30,000-60,000K) - Hottest, very rare
  { r: 146, g: 181, b: 255 }, // O3: Deep blue
  { r: 155, g: 176, b: 255 }, // O5: Blue
  { r: 162, g: 185, b: 255 }, // O9: Lighter blue
  
  // B-class (10,000-30,000K) - Blue-white giants
  { r: 170, g: 191, b: 255 }, // B0: Blue-white
  { r: 175, g: 195, b: 255 }, // B3: Light blue-white
  { r: 186, g: 204, b: 255 }, // B8: Pale blue
  
  // A-class (7,500-10,000K) - White stars like Sirius
  { r: 202, g: 215, b: 255 }, // A0: White with blue tint
  { r: 213, g: 224, b: 255 }, // A3: Pure white-blue
  { r: 230, g: 235, b: 255 }, // A7: Warm white
  
  // F-class (6,000-7,500K) - Yellow-white
  { r: 248, g: 247, b: 255 }, // F0: White
  { r: 252, g: 248, b: 245 }, // F5: Slight yellow
  { r: 255, g: 249, b: 240 }, // F8: Warm yellow-white
  
  // G-class (5,200-6,000K) - Yellow stars like our Sun
  { r: 255, g: 244, b: 234 }, // G0: Yellow-white
  { r: 255, g: 241, b: 220 }, // G2: Sun color
  { r: 255, g: 235, b: 200 }, // G8: Golden yellow
  
  // K-class (3,700-5,200K) - Orange stars
  { r: 255, g: 224, b: 178 }, // K0: Light orange
  { r: 255, g: 210, b: 161 }, // K3: Orange
  { r: 255, g: 198, b: 144 }, // K5: Deep orange
  { r: 255, g: 185, b: 120 }, // K7: Orange-red
  
  // M-class (2,400-3,700K) - Red dwarfs (most common)
  { r: 255, g: 170, b: 110 }, // M0: Orange-red
  { r: 255, g: 150, b: 90 },  // M3: Red
  { r: 255, g: 130, b: 80 },  // M5: Deep red
  { r: 255, g: 110, b: 70 },  // M8: Very red
  
  // Special types
  { r: 255, g: 255, b: 255 }, // Pure white
  { r: 250, g: 250, b: 255 }, // Cool white
  { r: 255, g: 252, b: 248 }, // Warm white
];

// Star color weights - M-class and K-class are most common, O-class is rarest
export const STAR_COLOR_WEIGHTS = [
  0.001, 0.001, 0.002,     // O-class (very rare)
  0.01, 0.015, 0.02,       // B-class (rare)
  0.03, 0.03, 0.03,        // A-class
  0.04, 0.04, 0.04,        // F-class
  0.05, 0.06, 0.05,        // G-class (like Sun)
  0.06, 0.07, 0.07, 0.06,  // K-class (common)
  0.08, 0.08, 0.06, 0.04,  // M-class (most common)
  0.05, 0.03, 0.02,        // Special types
];

// Shooting star colors (based on meteor mineral composition)
export const SHOOTING_STAR_COLORS: Color[] = [
  { r: 255, g: 255, b: 255 }, // White - rocky composition
  { r: 255, g: 250, b: 240 }, // Warm white - silicates
  { r: 200, g: 255, b: 200 }, // Green - magnesium
  { r: 150, g: 255, b: 150 }, // Bright green - nickel
  { r: 255, g: 255, b: 100 }, // Yellow - sodium
  { r: 255, g: 230, b: 150 }, // Yellow-orange - sodium
  { r: 255, g: 200, b: 100 }, // Orange - sodium/iron
  { r: 255, g: 160, b: 80 },  // Deep orange - iron
  { r: 180, g: 220, b: 255 }, // Blue-white - iron
  { r: 160, g: 200, b: 255 }, // Light blue - magnesium/iron
  { r: 255, g: 100, b: 100 }, // Red - nitrogen/oxygen
  { r: 255, g: 200, b: 150 }, // Peachy - atmospheric heating
  { r: 200, g: 180, b: 255 }, // Violet - calcium
];

// Nebula color triplets - based on real nebula emission spectra
export const NEBULA_COLOR_TRIPLETS: [Color, Color, Color][] = [
  // Emission nebulas (HII regions) - hydrogen alpha
  [{ r: 180, g: 40, b: 80 }, { r: 220, g: 80, b: 120 }, { r: 255, g: 150, b: 180 }],   // Deep rose/pink
  [{ r: 150, g: 30, b: 60 }, { r: 200, g: 60, b: 100 }, { r: 255, g: 120, b: 160 }],   // Crimson/magenta
  
  // Orion-like nebulas - mix of hydrogen and oxygen
  [{ r: 80, g: 40, b: 120 }, { r: 180, g: 80, b: 160 }, { r: 255, g: 150, b: 200 }],   // Purple/Magenta/Pink
  [{ r: 100, g: 50, b: 150 }, { r: 170, g: 100, b: 200 }, { r: 230, g: 180, b: 255 }], // Violet/Lavender
  
  // Oxygen-rich nebulas (OIII emission)
  [{ r: 20, g: 80, b: 100 }, { r: 60, g: 150, b: 170 }, { r: 120, g: 220, b: 230 }],   // Teal/Cyan
  [{ r: 30, g: 100, b: 130 }, { r: 80, g: 180, b: 200 }, { r: 150, g: 230, b: 245 }],  // Deep teal/turquoise
  [{ r: 30, g: 60, b: 120 }, { r: 80, g: 130, b: 180 }, { r: 150, g: 200, b: 255 }],   // Deep Blue/Cyan
  
  // Reflection nebulas - scattered starlight (blue)
  [{ r: 40, g: 60, b: 140 }, { r: 80, g: 120, b: 200 }, { r: 140, g: 180, b: 255 }],   // Deep blue/azure
  [{ r: 50, g: 80, b: 160 }, { r: 100, g: 150, b: 220 }, { r: 170, g: 210, b: 255 }],  // Royal blue
  
  // Planetary nebulas - dying star shells
  [{ r: 40, g: 120, b: 100 }, { r: 100, g: 200, b: 180 }, { r: 180, g: 255, b: 230 }], // Aquamarine/mint
  [{ r: 60, g: 100, b: 80 }, { r: 120, g: 180, b: 150 }, { r: 190, g: 240, b: 210 }],  // Sea green
  
  // Supernova remnants - shock-heated gas
  [{ r: 120, g: 50, b: 50 }, { r: 180, g: 80, b: 60 }, { r: 255, g: 140, b: 100 }],    // Crimson/Orange/Salmon
  [{ r: 140, g: 60, b: 30 }, { r: 200, g: 100, b: 50 }, { r: 255, g: 160, b: 80 }],    // Rust/Orange
  
  // Dark nebulas with edge glow
  [{ r: 60, g: 40, b: 100 }, { r: 100, g: 60, b: 140 }, { r: 180, g: 120, b: 200 }],   // Violet/Lavender
  [{ r: 100, g: 60, b: 80 }, { r: 150, g: 100, b: 120 }, { r: 200, g: 160, b: 180 }],  // Dusty Rose
  
  // Carina-like nebulas - complex mix
  [{ r: 100, g: 60, b: 40 }, { r: 180, g: 120, b: 80 }, { r: 255, g: 200, b: 150 }],   // Amber/Gold
  [{ r: 80, g: 80, b: 120 }, { r: 140, g: 140, b: 180 }, { r: 200, g: 200, b: 240 }],  // Steel blue/silver
];

// Galaxy type distribution
export const GALAXY_TYPES = [
  'spiral', 'spiral', 'barred-spiral', 'elliptical', 'elliptical', 'irregular', 'lenticular'
] as const;

// Star density factor (pixels per star) - lower = more stars
export const STAR_DENSITY_FACTOR = 600;

// Shooting star timing
export const SHOOTING_STAR_MIN_DELAY = 5;
export const SHOOTING_STAR_MAX_DELAY = 15;

// Galaxy count range
export const MIN_GALAXIES = 100;
export const MAX_GALAXIES = 200;

// Nebula count range
export const MIN_NEBULAS = 6;
export const MAX_NEBULAS = 12;

// Nebula size range
export const MIN_NEBULA_SIZE = 40;
export const MAX_NEBULA_SIZE = 120;
