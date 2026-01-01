// Main component export
export { default as StarField } from './StarField';
export { default } from './StarField';

// Type exports
export type {
  Color,
  Star,
  ShootingStar,
  Galaxy,
  GalaxyType,
  Nebula,
  NebulaLayer,
  NebulaBlob,
  NebulaFilament,
  DustParticle,
  DustLane,
  EmbeddedStar,
  ArmPoint,
  StarPoint,
} from './types';

// Utility exports (if needed externally)
export * from './colorUtils';
export * from './generators';
export * from './drawFunctions';
export * from './constants';
