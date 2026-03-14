// Type definitions for StarField celestial objects

export interface Color {
  r: number;
  g: number;
  b: number;
}

// ============================================================================
// Star Types
// ============================================================================

export interface Star {
  size: number;
  brightness: number;
  twinkleSpeed: number;
  twinkleOffset: number;
  color: Color;
  angle: number;
  initialPhase: number;
}

// ============================================================================
// Galaxy Types
// ============================================================================

export type GalaxyType = 'spiral' | 'barred-spiral' | 'elliptical' | 'irregular' | 'lenticular';

export interface ArmPoint {
  t: number;
  offset: number;
  dotSize: number;
}

export interface StarPoint {
  x: number;
  y: number;
  size: number;
  brightness: number;
}

export interface Galaxy {
  x: number;
  y: number;
  size: number;
  rotation: number;
  brightness: number;
  type: GalaxyType;
  inclination: number;
  arms: number;
  armTightness: number;
  armSpread: number;
  coreSize: number;
  coreColor: Color;
  armColor: Color;
  outerColor: Color;
  armPoints: ArmPoint[][];
  starPoints: StarPoint[];
}

// ============================================================================
// Nebula Types
// ============================================================================

export interface NebulaLayer {
  offsetX: number;
  offsetY: number;
  scale: number;
  opacity: number;
}

export interface NebulaBlob {
  angle: number;
  dist: number;
  size: number;
}

export interface NebulaFilament {
  startAngle: number;
  endAngle: number;
  startDist: number;
  endDist: number;
  ctrlX: number;
  ctrlY: number;
  lineWidth: number;
  colorIndex: number;
}

export interface DustParticle {
  angle: number;
  dist: number;
  colorIndex: number;
  alpha: number;
  size: number;
}

export interface EmbeddedStar {
  angle: number;
  dist: number;
  size: number;
  brightness: number;
  color: Color;
}

export type NebulaType = 'emission' | 'reflection' | 'dark' | 'planetary' | 'supernova' | 'butterfly' | 'hourglass' | 'twin-jet' | 'ring' | 'egg' | 'eye';

export interface Nebula {
  x: number;
  y: number;
  size: number;
  brightness: number;
  color1: Color;
  color2: Color;
  color3: Color;
  rotation: number;
  type: NebulaType;
  layers: NebulaLayer[];
  blobs: NebulaBlob[][];
  filaments: NebulaFilament[];
  dustParticles: DustParticle[];
  embeddedStars: EmbeddedStar[];
}

// ============================================================================
// Render System Interface
// ============================================================================

export interface RenderSystem {
  init(gl: WebGLRenderingContext, width: number, height: number, config: SpaceConfig): void;
  resize(gl: WebGLRenderingContext, width: number, height: number): void;
  update(time: number, deltaTime: number, driftOffset: number): void;
  render(gl: WebGLRenderingContext): void;
  dispose(gl: WebGLRenderingContext): void;
}

// ============================================================================
// Configuration
// ============================================================================

export interface SpaceConfig {
  stars: {
    densityMultiplier: number;
    densityFactor: number;
  };
  galaxies: {
    countMultiplier: number;
    min: number;
    max: number;
  };
  nebulae: {
    countMultiplier: number;
    min: number;
    max: number;
  };
  dustClouds: {
    count: number;
    minAlpha: number;
    maxAlpha: number;
  };
  motion: {
    driftSpeed: number;
    warpExponent: number;
  };
}

export const DEFAULT_CONFIG: SpaceConfig = {
  stars: {
    densityMultiplier: 1.2,
    densityFactor: 200,
  },
  galaxies: {
    countMultiplier: 2.5,
    min: 40,
    max: 80,
  },
  nebulae: {
    countMultiplier: 3.0,
    min: 3,
    max: 6,
  },
  dustClouds: {
    count: 10,
    minAlpha: 0.02,
    maxAlpha: 0.06,
  },
  motion: {
    driftSpeed: 0.05,
    warpExponent: 1.5,
  },
};
