import type { Star, ShootingStar, Galaxy, Nebula, GalaxyType, NebulaType } from './types';
import {
  STAR_DENSITY_FACTOR,
  GALAXY_TYPES,
  MIN_GALAXIES,
  MAX_GALAXIES,
  MIN_NEBULAS,
  MAX_NEBULAS,
  MIN_NEBULA_SIZE,
  MAX_NEBULA_SIZE,
  NEBULA_TYPES,
  NEBULA_PALETTES,
} from './constants';
import {
  getRandomStarColor,
  getRandomShootingStarColor,
  getRandomGalaxyPalette,
  getRandomClusterColor,
  varyColor,
} from './colorUtils';

/**
 * Initialize stars based on canvas dimensions with diverse sizes
 */
export const initStars = (width: number, height: number): Star[] => {
  const stars: Star[] = [];
  const numStars = Math.floor((width * height) / STAR_DENSITY_FACTOR);
  
  for (let i = 0; i < numStars; i++) {
    // More diverse size distribution - most stars are tiny, few are bright
    const sizeRoll = Math.random();
    let size: number;
    if (sizeRoll < 0.5) {
      // 50% - tiny distant stars
      size = 0.2 + Math.random() * 0.5;
    } else if (sizeRoll < 0.8) {
      // 30% - small stars
      size = 0.5 + Math.random() * 0.8;
    } else if (sizeRoll < 0.95) {
      // 15% - medium stars
      size = 1.0 + Math.random() * 1.0;
    } else {
      // 5% - bright prominent stars
      size = 1.8 + Math.random() * 1.2;
    }
    
    // Brightness correlated with size but with variation
    const baseBrightness = 0.3 + (size / 3) * 0.5;
    const brightness = Math.min(1, baseBrightness + (Math.random() - 0.5) * 0.3);
    
    const parallaxFactor = 0.02 + (size / 3) * 0.08;
    
    // Twinkle speed varies - smaller stars twinkle faster
    const twinkleSpeed = 0.01 + Math.random() * 0.05 + (1 - size / 3) * 0.02;
    
    stars.push({
      x: Math.random() * width,
      y: Math.random() * height,
      size,
      brightness,
      twinkleSpeed,
      twinkleOffset: Math.random() * Math.PI * 2,
      color: getRandomStarColor(),
      parallaxFactor,
    });
  }
  
  return stars;
};

/**
 * Create a new shooting star
 */
export const createShootingStar = (width: number, height: number): ShootingStar => {
  const edge = Math.floor(Math.random() * 4);
  const margin = 50;
  let startX: number, startY: number, angle: number;
  
  switch (edge) {
    case 0: // From top
      startX = Math.random() * width;
      startY = -margin;
      angle = Math.PI / 4 + Math.random() * Math.PI / 2;
      break;
    case 1: // From right
      startX = width + margin;
      startY = Math.random() * height;
      angle = Math.PI * 0.6 + Math.random() * Math.PI * 0.6;
      break;
    case 2: // From bottom
      startX = Math.random() * width;
      startY = height + margin;
      angle = -Math.PI / 4 - Math.random() * Math.PI / 2;
      break;
    case 3: // From left
    default:
      startX = -margin;
      startY = Math.random() * height;
      angle = -Math.PI / 4 + Math.random() * Math.PI / 2;
      break;
  }

  // More varied shooting star characteristics
  const speedRoll = Math.random();
  let speed: number;
  if (speedRoll < 0.3) {
    speed = 3 + Math.random() * 5;  // Slow, graceful
  } else if (speedRoll < 0.7) {
    speed = 8 + Math.random() * 10; // Medium
  } else {
    speed = 18 + Math.random() * 12; // Fast, dramatic
  }
  
  // Size varies - some are faint streaks, others are bright bolides
  const sizeRoll = Math.random();
  let size: number;
  if (sizeRoll < 0.5) {
    size = 0.5 + Math.random() * 1;   // Faint
  } else if (sizeRoll < 0.85) {
    size = 1.5 + Math.random() * 1.5; // Normal
  } else {
    size = 3 + Math.random() * 2;     // Bright bolide
  }
  
  const length = 30 + speed * 6 + size * 15 + Math.random() * 50;

  return {
    x: startX,
    y: startY,
    angle,
    speed,
    length,
    brightness: 0.6 + Math.random() * 0.4,
    life: 1,
    decay: 0.002 + Math.random() * 0.015 + (speed / 30) * 0.01,
    size,
    color: getRandomShootingStarColor(),
    parallaxFactor: 0.06 + Math.random() * 0.06,
  };
};

/**
 * Initialize galaxies with diverse sizes and colors
 */
export const initGalaxies = (width: number, height: number): Galaxy[] => {
  const galaxies: Galaxy[] = [];
  const numGalaxies = MIN_GALAXIES + Math.floor(Math.random() * (MAX_GALAXIES - MIN_GALAXIES + 1));
  
  for (let i = 0; i < numGalaxies; i++) {
    const [coreColor, armColor, outerColor] = getRandomGalaxyPalette();
    const galaxyType = GALAXY_TYPES[Math.floor(Math.random() * GALAXY_TYPES.length)] as GalaxyType;
    
    // More diverse size distribution simulating cosmic distance
    const distanceFactor = Math.random();
    let galaxySize: number;
    if (distanceFactor < 0.35) {
      // Very distant - barely visible dots
      galaxySize = 3 + Math.random() * 8;
    } else if (distanceFactor < 0.55) {
      // Distant - small fuzzy patches
      galaxySize = 10 + Math.random() * 15;
    } else if (distanceFactor < 0.75) {
      // Medium distance
      galaxySize = 25 + Math.random() * 30;
    } else if (distanceFactor < 0.9) {
      // Closer - visible structure
      galaxySize = 55 + Math.random() * 40;
    } else {
      // Very close - large and detailed
      galaxySize = 95 + Math.random() * 55;
    }
    
    // Inclination affects appearance dramatically - allow full range of 3D orientations
    // 0 = face-on, 1 = edge-on
    const inclination = Math.random() * 0.85; 
    const tilt = Math.random() * Math.PI * 2;
    
    // Number of arms based on type with more variation
    let numArms = 0;
    if (galaxyType === 'spiral') {
      // Grand design spirals have 2, others can have up to 6
      numArms = Math.random() < 0.3 ? 2 : 2 + Math.floor(Math.random() * 6);
    } else if (galaxyType === 'barred-spiral') {
      numArms = 2;
    }
    
    // Pre-generate arm points with varied density
    const armPoints: { t: number; offset: number; dotSize: number }[][] = [];
    if (galaxyType === 'spiral' || galaxyType === 'barred-spiral') {
      // More points for larger galaxies
      const numPointsPerArm = Math.floor(15 + Math.random() * 20 + galaxySize / 5);
      for (let arm = 0; arm < numArms; arm++) {
        const points: { t: number; offset: number; dotSize: number }[] = [];
        for (let p = 0; p < numPointsPerArm; p++) {
          const t = p / numPointsPerArm;
          const sizeScale = galaxySize / 50;
          points.push({
            t,
            offset: (Math.random() - 0.5) * 6 * t * sizeScale,
            dotSize: Math.max(0.3, (1 - t) * (1.5 + Math.random() * 1.5) * sizeScale),
          });
        }
        armPoints.push(points);
      }
    }
    
    // Pre-generate star points for elliptical/irregular/lenticular
    const starPoints: { x: number; y: number; size: number; brightness: number }[] = [];
    if (galaxyType === 'elliptical' || galaxyType === 'irregular' || galaxyType === 'lenticular') {
      const numStars = Math.floor(20 + Math.random() * 40 * (galaxySize / 30));
      
      // For irregular galaxies, create multiple centers/blobs
      const centers: {x: number, y: number}[] = [];
      if (galaxyType === 'irregular') {
        const numCenters = 2 + Math.floor(Math.random() * 3);
        for(let c=0; c<numCenters; c++) {
          centers.push({
            x: (Math.random() - 0.5) * 1.5,
            y: (Math.random() - 0.5) * 1.5
          });
        }
      }

      for (let s = 0; s < numStars; s++) {
        let sx: number, sy: number;
        if (galaxyType === 'irregular') {
          // Pick a random center
          const center = centers[Math.floor(Math.random() * centers.length)];
          // Scatter around that center
          const r = Math.random() * 0.6;
          const angle = Math.random() * Math.PI * 2;
          sx = center.x + Math.cos(angle) * r;
          sy = center.y + Math.sin(angle) * r;
        } else {
          const r = Math.random() * Math.random(); // Bias towards center
          const angle = Math.random() * Math.PI * 2;
          sx = Math.cos(angle) * r;
          sy = Math.sin(angle) * r;
        }
        starPoints.push({
          x: sx,
          y: sy,
          size: Math.max(0.2, (0.3 + Math.random() * 0.8) * (galaxySize / 40)),
          brightness: 0.3 + Math.random() * 0.7,
        });
      }
    }
    
    const ellipticity = galaxyType === 'elliptical' ? Math.random() * 0.7 : 
                       galaxyType === 'lenticular' ? 0.5 + Math.random() * 0.3 : 0;
    
    galaxies.push({
      x: Math.random() * width,
      y: Math.random() * height,
      size: galaxySize,
      rotation: Math.random() * Math.PI * 2,
      brightness: 0.02 + Math.random() * 0.06,
      type: galaxyType,
      inclination,
      tilt,
      arms: numArms,
      armTightness: galaxyType === 'barred-spiral' ? 0.5 + Math.random() * 1.0 : 0.4 + Math.random() * 2.5,
      armSpread: 0.1 + Math.random() * 0.8,
      coreSize: galaxyType === 'elliptical' ? 0.3 + Math.random() * 0.6 : 0.05 + Math.random() * 0.3,
      coreColor,
      armColor,
      outerColor,
      parallaxFactor: 0.005 + (1 - galaxySize / 150) * 0.05,
      armPoints,
      ellipticity,
      starPoints,
    });
  }
  
  return galaxies;
};

/**
 * Initialize nebulas with diverse sizes and colors
 */
export const initNebulas = (width: number, height: number): Nebula[] => {
  const nebulas: Nebula[] = [];
  const numNebulas = MIN_NEBULAS + Math.floor(Math.random() * (MAX_NEBULAS - MIN_NEBULAS + 1));
  
  for (let i = 0; i < numNebulas; i++) {
    // Select random type and corresponding palette
    const type = NEBULA_TYPES[Math.floor(Math.random() * NEBULA_TYPES.length)] as NebulaType;
    const palettes = NEBULA_PALETTES[type];
    const baseTriplet = palettes[Math.floor(Math.random() * palettes.length)];
    
    const colorTriplet: [typeof baseTriplet[0], typeof baseTriplet[1], typeof baseTriplet[2]] = [
      varyColor(baseTriplet[0], 30),
      varyColor(baseTriplet[1], 30),
      varyColor(baseTriplet[2], 30),
    ];
    
    // More diverse nebula sizes
    const sizeRoll = Math.random();
    let nebulaSize: number;
    if (sizeRoll < 0.3) {
      nebulaSize = 25 + Math.random() * 35;   // Small compact nebulas
    } else if (sizeRoll < 0.6) {
      nebulaSize = 60 + Math.random() * 50;   // Medium
    } else if (sizeRoll < 0.85) {
      nebulaSize = 110 + Math.random() * 60;  // Large
    } else {
      nebulaSize = 170 + Math.random() * 80;  // Very large diffuse
    }
    
    const noiseSeeds = Array.from({ length: 8 }, () => Math.random() * 1000);
    
    // Create layers - more layers for larger nebulas
    const numLayers = 3 + Math.floor(Math.random() * 4) + Math.floor(nebulaSize / 80);
    const layers = [];
    const blobs: { angle: number; dist: number; size: number }[][] = [];
    
    for (let l = 0; l < numLayers; l++) {
      const layerScale = 0.3 + Math.random() * 0.9;
      const layerSize = nebulaSize * layerScale;
      const seed = noiseSeeds[l % noiseSeeds.length];
      
      layers.push({
        offsetX: (Math.random() - 0.5) * nebulaSize * 0.7,
        offsetY: (Math.random() - 0.5) * nebulaSize * 0.6,
        scale: layerScale,
        opacity: 0.3 + Math.random() * 0.5,
      });
      
      // Generate blobs based on type
      const layerBlobs = [];
      const numBlobs = 5 + Math.floor(Math.random() * 4);
      
      for (let b = 0; b < numBlobs; b++) {
        let angle: number, dist: number, size: number;
        
        // Shape logic based on type
        if (type === 'butterfly') {
          // Two lobes at 0 and PI
          const side = Math.random() < 0.5 ? 0 : Math.PI;
          angle = side + (Math.random() - 0.5) * 1.0; // Cone spread
          dist = layerSize * (0.2 + Math.random() * 0.6);
          size = layerSize * (0.3 + Math.random() * 0.4);
        } else if (type === 'hourglass') {
          // Two lobes but wider/conical
          const side = Math.random() < 0.5 ? 0 : Math.PI;
          angle = side + (Math.random() - 0.5) * 1.5; // Wider cone
          dist = layerSize * (0.1 + Math.random() * 0.7);
          size = layerSize * (0.2 + Math.random() * 0.5);
        } else if (type === 'twin-jet') {
          // Narrow jets along axis
          const side = Math.random() < 0.5 ? 0 : Math.PI;
          angle = side + (Math.random() - 0.5) * 0.3; // Very narrow
          dist = layerSize * (0.1 + Math.random() * 0.9);
          size = layerSize * (0.1 + Math.random() * 0.3); // Smaller blobs
        } else if (type === 'ring') {
          // Ring shape
          angle = Math.random() * Math.PI * 2;
          dist = layerSize * (0.6 + Math.random() * 0.2); // Ring radius
          size = layerSize * (0.2 + Math.random() * 0.3);
        } else {
          // Default cloud/supernova
          angle = (b / numBlobs) * Math.PI * 2 + seed;
          dist = layerSize * 0.3 * Math.random();
          size = layerSize * (0.3 + Math.random() * 0.5);
        }
        
        layerBlobs.push({ angle, dist, size });
      }
      blobs.push(layerBlobs);
    }
    
    // Create dust lanes
    const numDustLanes = 1 + Math.floor(Math.random() * 3);
    const dustLanes = [];
    for (let d = 0; d < numDustLanes; d++) {
      dustLanes.push({
        angle: Math.random() * Math.PI * 2,
        width: 0.1 + Math.random() * 0.2,
        offset: (Math.random() - 0.5) * 0.5,
      });
    }
    
    // Generate filaments based on type
    const numFilaments = 3 + Math.floor(Math.random() * 3);
    const filaments = [];
    for (let f = 0; f < numFilaments; f++) {
      let startAngle: number, endAngle: number, startDist: number, endDist: number;
      
      if (type === 'butterfly' || type === 'hourglass') {
        // Filaments follow the lobes
        const side = f % 2 === 0 ? 0 : Math.PI;
        startAngle = side + (Math.random() - 0.5) * 0.5;
        endAngle = startAngle + (Math.random() - 0.5) * 0.5;
        startDist = nebulaSize * 0.1;
        endDist = nebulaSize * (0.5 + Math.random() * 0.4);
      } else if (type === 'twin-jet') {
        // Long straight filaments
        const side = f % 2 === 0 ? 0 : Math.PI;
        startAngle = side;
        endAngle = side + (Math.random() - 0.5) * 0.1;
        startDist = nebulaSize * 0.1;
        endDist = nebulaSize * (0.8 + Math.random() * 0.4); // Very long
      } else if (type === 'ring') {
        // Filaments along the ring
        startAngle = (f / numFilaments) * Math.PI * 2;
        endAngle = startAngle + Math.PI * 0.5;
        startDist = nebulaSize * 0.6;
        endDist = nebulaSize * 0.6;
      } else {
        // Random
        startAngle = (f / numFilaments) * Math.PI * 2;
        endAngle = startAngle + Math.PI * (0.5 + Math.random() * 0.5);
        startDist = nebulaSize * 0.2;
        endDist = nebulaSize * (0.4 + Math.random() * 0.3);
      }
      
      filaments.push({
        startAngle,
        endAngle,
        startDist,
        endDist,
        ctrlX: (Math.cos(startAngle) * startDist + Math.cos(endAngle) * endDist) / 2 + (Math.random() - 0.5) * nebulaSize * 0.3,
        ctrlY: (Math.sin(startAngle) * startDist + Math.sin(endAngle) * endDist) / 2 + (Math.random() - 0.5) * nebulaSize * 0.2,
        lineWidth: 2 + Math.random() * 6,
        colorIndex: f % 2,
      });
    }
    
    // Pre-generate dust particles
    const numDustParticles = Math.floor(nebulaSize / 5);
    const dustParticles = [];
    for (let d = 0; d < numDustParticles; d++) {
      dustParticles.push({
        angle: Math.random() * Math.PI * 2,
        dist: Math.random() * nebulaSize * 0.9,
        colorIndex: Math.random() < 0.5 ? 0 : 1,
        alpha: 0.2 + Math.random() * 0.4,
        size: 0.3 + Math.random() * 1.2,
      });
    }
    
    // Pre-generate embedded stars - significantly increased count for "cluster-like" effect
    const numEmbeddedStars = 15 + Math.floor(Math.random() * 20) + Math.floor(nebulaSize / 10);
    const embeddedStars = [];
    for (let s = 0; s < numEmbeddedStars; s++) {
      // Varied star sizes within nebula
      const starSizeRoll = Math.random();
      let starSize: number;
      if (starSizeRoll < 0.6) {
        starSize = 0.3 + Math.random() * 0.8;
      } else if (starSizeRoll < 0.9) {
        starSize = 1.0 + Math.random() * 1.2;
      } else {
        starSize = 2.0 + Math.random() * 1.5;  // Bright embedded stars
      }
      
      // Random distribution within the nebula radius
      // Using sqrt(random) for uniform circular distribution, or power for center bias
      const r = Math.sqrt(Math.random()) * nebulaSize * 0.8;
      const theta = Math.random() * Math.PI * 2;

      embeddedStars.push({
        angle: theta,
        dist: r,
        size: starSize,
        brightness: 0.5 + Math.random() * 0.5,
        color: getRandomStarColor(),
      });
    }
    
    // Brightness varies with size - smaller nebulas can be brighter (closer)
    const baseBrightness = 0.015 + Math.random() * 0.025;
    const sizeBrightnessMod = Math.max(0, 0.02 - nebulaSize / 10000);
    
    nebulas.push({
      x: Math.random() * width,
      y: Math.random() * height,
      size: nebulaSize,
      brightness: baseBrightness + sizeBrightnessMod,
      color1: colorTriplet[0],
      color2: colorTriplet[1],
      color3: colorTriplet[2],
      shape: Math.random(),
      rotation: Math.random() * Math.PI * 2,
      type,
      noiseSeeds,
      dustLanes,
      layers,
      blobs,
      filaments,
      dustParticles,
      embeddedStars,
      parallaxFactor: 0.005 + Math.random() * 0.025,
    });
  }
  
  return nebulas;
};

/**
 * Initialize star clusters
 */
export const initStarClusters = (width: number, height: number): import('./types').StarCluster[] => {
  const clusters: import('./types').StarCluster[] = [];
  const numClusters = 5 + Math.floor(Math.random() * 10); // 5-15 clusters
  
  for (let i = 0; i < numClusters; i++) {
    const type = Math.random() < 0.7 ? 'open' : 'globular';
    const size = type === 'open' 
      ? 40 + Math.random() * 60 
      : 20 + Math.random() * 40;
      
    const numStars = type === 'open'
      ? 30 + Math.floor(Math.random() * 50)
      : 100 + Math.floor(Math.random() * 200);
      
    const clusterStars: import('./types').ClusterStar[] = [];
    // Use specific cluster palette 70% of time, random star color 30%
    const baseColor = Math.random() < 0.7 ? getRandomClusterColor() : getRandomStarColor();
    
    for (let s = 0; s < numStars; s++) {
      // Distribution logic
      let sx: number, sy: number;
      if (type === 'globular') {
        // Dense center, sparse edges (gaussian-ish)
        const r = size * Math.pow(Math.random(), 2); // Bias to center
        const theta = Math.random() * Math.PI * 2;
        sx = Math.cos(theta) * r;
        sy = Math.sin(theta) * r;
      } else {
        // Random scatter
        sx = (Math.random() - 0.5) * 2 * size;
        sy = (Math.random() - 0.5) * 2 * size;
      }
      
      clusterStars.push({
        x: sx,
        y: sy,
        size: 0.5 + Math.random() * 1.5,
        color: varyColor(baseColor, 30),
        brightness: 0.4 + Math.random() * 0.6,
        twinkleSpeed: 0.02 + Math.random() * 0.05,
        twinkleOffset: Math.random() * Math.PI * 2,
      });
    }
    
    clusters.push({
      x: Math.random() * width,
      y: Math.random() * height,
      size,
      brightness: 0.8 + Math.random() * 0.2,
      stars: clusterStars,
      color: baseColor,
      parallaxFactor: 0.01 + Math.random() * 0.02,
      rotation: Math.random() * Math.PI * 2,
      type
    });
  }
  
  return clusters;
};

/**
 * Get the next shooting star delay (in seconds)
 */
export const getNextShootingStarDelay = (): number => {
  return 5 + Math.random() * 10;
};
