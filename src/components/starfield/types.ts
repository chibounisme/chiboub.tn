// Type definitions for StarField celestial objects

export interface Color {
  r: number;
  g: number;
  b: number;
}

export interface Star {
  x: number;
  y: number;
  size: number;
  brightness: number;
  twinkleSpeed: number;
  twinkleOffset: number;
  color: Color;
  parallaxFactor: number;
}

export interface ShootingStar {
  x: number;
  y: number;
  angle: number;
  speed: number;
  length: number;
  brightness: number;
  life: number;
  decay: number;
  size: number;
  color: Color;
  parallaxFactor: number;
}

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
  tilt: number;
  arms: number;
  armTightness: number;
  armSpread: number;
  coreSize: number;
  coreColor: Color;
  armColor: Color;
  outerColor: Color;
  parallaxFactor: number;
  armPoints: ArmPoint[][];
  ellipticity: number;
  starPoints: StarPoint[];
}

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

export interface DustLane {
  angle: number;
  width: number;
  offset: number;
}

export interface EmbeddedStar {
  angle: number;
  dist: number;
  size: number;
  brightness: number;
  color: Color;
}

export interface Nebula {
  x: number;
  y: number;
  size: number;
  brightness: number;
  color1: Color;
  color2: Color;
  color3: Color;
  shape: number;
  rotation: number;
  noiseSeeds: number[];
  dustLanes: DustLane[];
  layers: NebulaLayer[];
  blobs: NebulaBlob[][];
  filaments: NebulaFilament[];
  dustParticles: DustParticle[];
  embeddedStars: EmbeddedStar[];
  parallaxFactor: number;
}
