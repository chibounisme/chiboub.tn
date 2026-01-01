import { useEffect, useRef } from 'react';
import type { FC } from 'react';
import './StarField.css';

interface Star {
  x: number;
  y: number;
  size: number;
  brightness: number;
  twinkleSpeed: number;
  twinkleOffset: number;
  color: { r: number; g: number; b: number };
  parallaxFactor: number; // depth layer for parallax
}

interface ShootingStar {
  x: number;
  y: number;
  angle: number;
  speed: number;
  length: number;
  brightness: number;
  life: number;
  decay: number;
  size: number;
  color: { r: number; g: number; b: number };
  parallaxFactor: number;
}

interface Galaxy {
  x: number;
  y: number;
  size: number;
  rotation: number;
  brightness: number;
  type: 'spiral' | 'barred-spiral' | 'elliptical' | 'irregular' | 'lenticular';
  // 3D orientation - simulates viewing angle
  inclination: number; // 0 = face-on, 1 = edge-on
  tilt: number; // Secondary rotation axis
  arms: number;
  armTightness: number;
  armSpread: number;
  coreSize: number;
  coreColor: { r: number; g: number; b: number };
  armColor: { r: number; g: number; b: number };
  outerColor: { r: number; g: number; b: number };
  parallaxFactor: number;
  armPoints: { t: number; offset: number; dotSize: number }[][];
  // For elliptical/irregular galaxies
  ellipticity: number; // 0 = circular, 1 = very elongated
  starPoints: { x: number; y: number; size: number; brightness: number }[];
}

interface Nebula {
  x: number;
  y: number;
  size: number;
  brightness: number;
  color1: { r: number; g: number; b: number };
  color2: { r: number; g: number; b: number };
  color3: { r: number; g: number; b: number };
  shape: number;
  rotation: number;
  noiseSeeds: number[];
  dustLanes: { angle: number; width: number; offset: number }[];
  layers: { offsetX: number; offsetY: number; scale: number; opacity: number }[];
  // Pre-generated data to avoid flickering
  blobs: { angle: number; dist: number; size: number }[][];
  filaments: { startAngle: number; endAngle: number; startDist: number; endDist: number; ctrlX: number; ctrlY: number; lineWidth: number; colorIndex: number }[];
  dustParticles: { angle: number; dist: number; colorIndex: number; alpha: number; size: number }[];
  embeddedStars: { angle: number; dist: number; size: number; brightness: number; color: { r: number; g: number; b: number } }[];
  parallaxFactor: number;
}

// Realistic star colors based on stellar classification (temperature)
const starColors = [
  { r: 155, g: 176, b: 255 }, // O-class: Blue
  { r: 170, g: 191, b: 255 }, // B-class: Blue-white
  { r: 202, g: 215, b: 255 }, // A-class: White-blue
  { r: 248, g: 247, b: 255 }, // F-class: White
  { r: 255, g: 244, b: 234 }, // G-class: Yellow-white (like Sun)
  { r: 255, g: 210, b: 161 }, // K-class: Orange
  { r: 255, g: 204, b: 111 }, // K-class: Light orange
  { r: 255, g: 255, b: 255 }, // Pure white (most common visually)
];

// Shooting star colors (based on meteor composition)
const shootingStarColors = [
  { r: 255, g: 255, b: 255 }, // White (common)
  { r: 255, g: 250, b: 240 }, // Warm white
  { r: 200, g: 255, b: 200 }, // Green tint (magnesium)
  { r: 255, g: 230, b: 180 }, // Yellow-orange (sodium)
  { r: 180, g: 220, b: 255 }, // Blue-white (iron)
  { r: 255, g: 200, b: 150 }, // Orange (atmospheric heating)
];

const getRandomStarColor = () => {
  // Weight towards white/yellow stars (more common visually)
  const weights = [0.05, 0.08, 0.12, 0.15, 0.15, 0.1, 0.1, 0.25];
  const random = Math.random();
  let cumulative = 0;
  for (let i = 0; i < weights.length; i++) {
    cumulative += weights[i];
    if (random < cumulative) {
      return starColors[i];
    }
  }
  return starColors[7]; // Default to white
};

const getRandomShootingStarColor = () => {
  return shootingStarColors[Math.floor(Math.random() * shootingStarColors.length)];
};

// Generate random galaxy color with natural hue variation
const getRandomGalaxyColor = () => {
  // Galaxies have warm yellows, cool blues, or purple hues
  const hueType = Math.random();
  let r: number, g: number, b: number;
  
  if (hueType < 0.4) {
    // Warm yellow/orange tones
    r = 200 + Math.floor(Math.random() * 55);
    g = 180 + Math.floor(Math.random() * 60);
    b = 150 + Math.floor(Math.random() * 80);
  } else if (hueType < 0.7) {
    // Cool blue tones
    r = 150 + Math.floor(Math.random() * 60);
    g = 180 + Math.floor(Math.random() * 60);
    b = 220 + Math.floor(Math.random() * 35);
  } else {
    // Purple/pink tones
    r = 180 + Math.floor(Math.random() * 75);
    g = 150 + Math.floor(Math.random() * 60);
    b = 200 + Math.floor(Math.random() * 55);
  }
  
  return { r, g, b };
};

// Generate a color variation from a base color
const varyColor = (base: { r: number; g: number; b: number }, variance: number) => {
  return {
    r: Math.min(255, Math.max(0, base.r + Math.floor((Math.random() - 0.5) * variance))),
    g: Math.min(255, Math.max(0, base.g + Math.floor((Math.random() - 0.5) * variance))),
    b: Math.min(255, Math.max(0, base.b + Math.floor((Math.random() - 0.5) * variance))),
  };
};

// Nebula color triplets (for more realistic multi-hue nebulas)
const nebulaColorTriplets = [
  [{ r: 80, g: 40, b: 120 }, { r: 180, g: 80, b: 160 }, { r: 255, g: 150, b: 200 }],   // Purple/Magenta/Pink
  [{ r: 30, g: 60, b: 120 }, { r: 80, g: 130, b: 180 }, { r: 150, g: 200, b: 255 }],   // Deep Blue/Teal/Cyan
  [{ r: 120, g: 50, b: 50 }, { r: 180, g: 80, b: 60 }, { r: 255, g: 140, b: 100 }],    // Crimson/Orange/Salmon
  [{ r: 40, g: 80, b: 80 }, { r: 80, g: 150, b: 130 }, { r: 140, g: 200, b: 180 }],    // Deep Teal/Sea Green
  [{ r: 60, g: 40, b: 100 }, { r: 100, g: 60, b: 140 }, { r: 180, g: 120, b: 200 }],   // Violet/Lavender
  [{ r: 100, g: 60, b: 80 }, { r: 150, g: 100, b: 120 }, { r: 200, g: 160, b: 180 }],  // Dusty Rose
];

const StarField: FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let stars: Star[] = [];
    let shootingStars: ShootingStar[] = [];
    let galaxies: Galaxy[] = [];
    let nebulas: Nebula[] = [];
    let time = 0;
    let lastTimestamp = 0;
    let nextShootingStarTime = 5 + Math.random() * 10; // First one between 5-15 seconds
    
    // Mouse position for parallax effect
    let mouseX = 0;
    let mouseY = 0;
    let targetMouseX = 0;
    let targetMouseY = 0;

    const handleMouseMove = (e: MouseEvent) => {
      // Normalize mouse position to -1 to 1 range from center
      targetMouseX = (e.clientX / window.innerWidth - 0.5) * 2;
      targetMouseY = (e.clientY / window.innerHeight - 0.5) * 2;
    };

    const getNextShootingStarDelay = (): number => {
      return 5 + Math.random() * 10; // Random delay between 5 and 15 seconds
    };

    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      initGalaxiesAndNebulas();
      initStars();
    };

    const initGalaxiesAndNebulas = () => {
      galaxies = [];
      nebulas = [];
      
      // Add 12-20 galaxies with varied types and sizes (simulating distance)
      const numGalaxies = 12 + Math.floor(Math.random() * 9);
      const galaxyTypes: ('spiral' | 'barred-spiral' | 'elliptical' | 'irregular' | 'lenticular')[] = 
        ['spiral', 'spiral', 'barred-spiral', 'elliptical', 'elliptical', 'irregular', 'lenticular'];
      
      for (let i = 0; i < numGalaxies; i++) {
        const baseColor = getRandomGalaxyColor();
        const galaxyType = galaxyTypes[Math.floor(Math.random() * galaxyTypes.length)];
        
        // Size varies dramatically to simulate distance
        // Some very distant (tiny), some closer (larger)
        const distanceFactor = Math.random();
        let galaxySize: number;
        if (distanceFactor < 0.4) {
          // Distant galaxies (40%) - very small
          galaxySize = 5 + Math.random() * 15;
        } else if (distanceFactor < 0.75) {
          // Medium distance (35%)
          galaxySize = 20 + Math.random() * 30;
        } else {
          // Closer galaxies (25%) - larger
          galaxySize = 50 + Math.random() * 50;
        }
        
        // 3D orientation
        const inclination = Math.random(); // 0 = face-on, 1 = edge-on
        const tilt = Math.random() * Math.PI * 2;
        
        // Number of arms based on type
        let numArms = 0;
        if (galaxyType === 'spiral') {
          numArms = 2 + Math.floor(Math.random() * 4); // 2-5 arms
        } else if (galaxyType === 'barred-spiral') {
          numArms = 2; // Barred spirals typically have 2 main arms
        }
        
        // Pre-generate arm points for spiral types
        const armPoints: { t: number; offset: number; dotSize: number }[][] = [];
        if (galaxyType === 'spiral' || galaxyType === 'barred-spiral') {
          const numPointsPerArm = 20 + Math.floor(Math.random() * 25);
          for (let arm = 0; arm < numArms; arm++) {
            const points: { t: number; offset: number; dotSize: number }[] = [];
            for (let p = 0; p < numPointsPerArm; p++) {
              const t = p / numPointsPerArm;
              const sizeScale = galaxySize / 50; // Scale dot size with galaxy size
              points.push({
                t,
                offset: (Math.random() - 0.5) * 6 * t * sizeScale,
                dotSize: Math.max(0.3, (1 - t) * (1.5 + Math.random() * 1.5) * sizeScale),
              });
            }
            armPoints.push(points);
          }
        }
        
        // Pre-generate star points for elliptical/irregular galaxies
        const starPoints: { x: number; y: number; size: number; brightness: number }[] = [];
        if (galaxyType === 'elliptical' || galaxyType === 'irregular' || galaxyType === 'lenticular') {
          const numStars = Math.floor(15 + Math.random() * 30 * (galaxySize / 30));
          for (let s = 0; s < numStars; s++) {
            // Gaussian-like distribution for elliptical, random for irregular
            let sx: number, sy: number;
            if (galaxyType === 'irregular') {
              sx = (Math.random() - 0.5) * 2;
              sy = (Math.random() - 0.5) * 2;
            } else {
              // Elliptical distribution - more concentrated in center
              const r = Math.random() * Math.random(); // Squared for concentration
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
        
        // Ellipticity for elliptical galaxies (E0-E7 classification)
        const ellipticity = galaxyType === 'elliptical' ? Math.random() * 0.7 : 
                           galaxyType === 'lenticular' ? 0.5 + Math.random() * 0.3 : 0;
        
        galaxies.push({
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height,
          size: galaxySize,
          rotation: Math.random() * Math.PI * 2,
          brightness: 0.02 + Math.random() * 0.06,
          type: galaxyType,
          inclination,
          tilt,
          arms: numArms,
          armTightness: galaxyType === 'barred-spiral' ? 0.8 + Math.random() * 0.6 : 1.0 + Math.random() * 1.5,
          armSpread: 0.3 + Math.random() * 0.4,
          coreSize: galaxyType === 'elliptical' ? 0.6 + Math.random() * 0.3 : 0.15 + Math.random() * 0.2,
          coreColor: varyColor(baseColor, 30),
          armColor: varyColor(baseColor, 50),
          outerColor: varyColor(baseColor, 70),
          parallaxFactor: 0.01 + (1 - galaxySize / 100) * 0.04, // Smaller = more distant = less parallax
          armPoints,
          ellipticity,
          starPoints,
        });
      }
      
      // Add 6-10 nebulas with smaller size
      const numNebulas = 6 + Math.floor(Math.random() * 5);
      for (let i = 0; i < numNebulas; i++) {
        const colorTriplet = nebulaColorTriplets[Math.floor(Math.random() * nebulaColorTriplets.length)];
        const nebulaSize = 40 + Math.random() * 80; // Much smaller: 40-120 instead of 150-450
        const noiseSeeds = Array.from({ length: 8 }, () => Math.random() * 1000);
        
        // Create multiple layers for depth
        const numLayers = 4 + Math.floor(Math.random() * 4);
        const layers = [];
        const blobs: { angle: number; dist: number; size: number }[][] = [];
        
        for (let l = 0; l < numLayers; l++) {
          const layerScale = 0.4 + Math.random() * 0.8;
          const layerSize = nebulaSize * layerScale;
          const seed = noiseSeeds[l % noiseSeeds.length];
          
          layers.push({
            offsetX: (Math.random() - 0.5) * nebulaSize * 0.6,
            offsetY: (Math.random() - 0.5) * nebulaSize * 0.6,
            scale: layerScale,
            opacity: 0.3 + Math.random() * 0.5,
          });
          
          // Pre-generate blobs for this layer
          const numBlobs = 5 + Math.floor(Math.random() * 4);
          const layerBlobs = [];
          for (let b = 0; b < numBlobs; b++) {
            const angle = (b / numBlobs) * Math.PI * 2 + seed;
            // Simple noise calculation
            const n1 = Math.sin(b * 50 * 0.01 + seed) * Math.cos(seed * 10 * 0.01 + seed * 0.7);
            const n2 = Math.sin(b * 50 * 0.02 - seed * 0.3) * Math.sin(seed * 10 * 0.015 + seed * 0.5);
            const n3 = Math.cos(b * 50 * 0.008 + seed * 10 * 0.008 + seed * 0.2) * 0.5;
            const noise1 = (n1 + n2 + n3 + 2) / 4;
            
            const n4 = Math.sin(b * 30 * 0.01 + seed) * Math.cos(b * 20 * 0.01 + seed * 0.7);
            const n5 = Math.sin(b * 30 * 0.02 - seed * 0.3) * Math.sin(b * 20 * 0.015 + seed * 0.5);
            const n6 = Math.cos(b * 30 * 0.008 + b * 20 * 0.008 + seed * 0.2) * 0.5;
            const noise2 = (n4 + n5 + n6 + 2) / 4;
            
            layerBlobs.push({
              angle,
              dist: layerSize * 0.3 * noise1,
              size: layerSize * (0.3 + noise2 * 0.5),
            });
          }
          blobs.push(layerBlobs);
        }
        
        // Create dust lanes for realism
        const numDustLanes = 1 + Math.floor(Math.random() * 3);
        const dustLanes = [];
        for (let d = 0; d < numDustLanes; d++) {
          dustLanes.push({
            angle: Math.random() * Math.PI * 2,
            width: 0.1 + Math.random() * 0.2,
            offset: (Math.random() - 0.5) * 0.5,
          });
        }
        
        // Pre-generate filaments
        const numFilaments = 3 + Math.floor(Math.random() * 3);
        const filaments = [];
        for (let f = 0; f < numFilaments; f++) {
          const startAngle = (f / numFilaments) * Math.PI * 2;
          const endAngle = startAngle + Math.PI * (0.5 + Math.random() * 0.5);
          const startDist = nebulaSize * 0.2;
          const endDist = nebulaSize * (0.4 + Math.random() * 0.3);
          const startX = Math.cos(startAngle) * startDist;
          const startY = Math.sin(startAngle) * startDist * 0.6;
          const endX = Math.cos(endAngle) * endDist;
          const endY = Math.sin(endAngle) * endDist * 0.6;
          
          filaments.push({
            startAngle,
            endAngle,
            startDist,
            endDist,
            ctrlX: (startX + endX) / 2 + (Math.random() - 0.5) * nebulaSize * 0.3,
            ctrlY: (startY + endY) / 2 + (Math.random() - 0.5) * nebulaSize * 0.2,
            lineWidth: 2 + Math.random() * 6,
            colorIndex: f % 2,
          });
        }
        
        // Pre-generate dust particles
        const numDustParticles = Math.floor(nebulaSize / 5); // Fewer particles for smaller nebulas
        const dustParticles = [];
        for (let d = 0; d < numDustParticles; d++) {
          const pAngle = Math.random() * Math.PI * 2;
          const pDist = Math.random() * nebulaSize * 0.9;
          dustParticles.push({
            angle: pAngle,
            dist: pDist,
            colorIndex: Math.random() < 0.5 ? 0 : 1,
            alpha: 0.2 + Math.random() * 0.4,
            size: 0.3 + Math.random() * 1.2, // Smaller dust for smaller nebulas
          });
        }
        
        // Pre-generate embedded stars inside the nebula
        const numEmbeddedStars = 5 + Math.floor(Math.random() * 10); // 5-15 stars per nebula
        const embeddedStars = [];
        for (let s = 0; s < numEmbeddedStars; s++) {
          const sAngle = Math.random() * Math.PI * 2;
          const sDist = Math.random() * nebulaSize * 0.7; // Stars concentrated in inner area
          embeddedStars.push({
            angle: sAngle,
            dist: sDist,
            size: 0.5 + Math.random() * 1.5,
            brightness: 0.6 + Math.random() * 0.4,
            color: getRandomStarColor(),
          });
        }
        
        nebulas.push({
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height,
          size: nebulaSize,
          brightness: 0.02 + Math.random() * 0.03, // Slightly brighter for smaller nebulas
          color1: colorTriplet[0],
          color2: colorTriplet[1],
          color3: colorTriplet[2],
          shape: Math.random(),
          rotation: Math.random() * Math.PI * 2,
          noiseSeeds,
          dustLanes,
          layers,
          blobs,
          filaments,
          dustParticles,
          embeddedStars,
          parallaxFactor: 0.01 + Math.random() * 0.02, // Very subtle for nebulas
        });
      }
    };

    const initStars = () => {
      stars = [];
      // Much higher star density for realistic universe feel
      const numStars = Math.floor((canvas.width * canvas.height) / 600);
      
      for (let i = 0; i < numStars; i++) {
        // Parallax factor based on star size (smaller = further = less parallax)
        const size = Math.random() * 1.8 + 0.3;
        const parallaxFactor = 0.02 + (size / 2.1) * 0.08; // Range: 0.02 to 0.10
        
        stars.push({
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height,
          size,
          brightness: Math.random() * 0.7 + 0.3,
          twinkleSpeed: Math.random() * 0.04 + 0.01,
          twinkleOffset: Math.random() * Math.PI * 2,
          color: getRandomStarColor(),
          parallaxFactor,
        });
      }
    };

    const drawNebulas = () => {
      nebulas.forEach((nebula) => {
        const { x, y, size, brightness, color1, color2, color3, rotation, dustLanes, layers, blobs, filaments, dustParticles, parallaxFactor } = nebula;
        
        // Apply parallax offset
        const parallaxX = mouseX * parallaxFactor * canvas.width * 0.5;
        const parallaxY = mouseY * parallaxFactor * canvas.height * 0.5;
        
        ctx.save();
        ctx.translate(x + parallaxX, y + parallaxY);
        ctx.rotate(rotation);
        
        // Draw multiple cloud-like layers for each nebula (using pre-generated blobs)
        layers.forEach((layer, layerIndex) => {
          const { offsetX, offsetY, opacity } = layer;
          
          // Choose color based on layer depth
          const colorIndex = layerIndex % 3;
          const color = colorIndex === 0 ? color1 : colorIndex === 1 ? color2 : color3;
          
          // Use pre-generated blobs for this layer
          const layerBlobs = blobs[layerIndex] || [];
          layerBlobs.forEach((blob) => {
            const blobX = offsetX + Math.cos(blob.angle) * blob.dist;
            const blobY = offsetY + Math.sin(blob.angle) * blob.dist * 0.6;
            
            // Main blob gradient
            const gradient = ctx.createRadialGradient(
              blobX, blobY, 0,
              blobX, blobY, blob.size
            );
            
            const alpha = brightness * opacity;
            gradient.addColorStop(0, `rgba(${color.r}, ${color.g}, ${color.b}, ${alpha * 0.8})`);
            gradient.addColorStop(0.2, `rgba(${color.r}, ${color.g}, ${color.b}, ${alpha * 0.5})`);
            gradient.addColorStop(0.5, `rgba(${color.r}, ${color.g}, ${color.b}, ${alpha * 0.25})`);
            gradient.addColorStop(0.75, `rgba(${color.r}, ${color.g}, ${color.b}, ${alpha * 0.1})`);
            gradient.addColorStop(1, `rgba(${color.r}, ${color.g}, ${color.b}, 0)`);
            
            ctx.fillStyle = gradient;
            ctx.beginPath();
            ctx.arc(blobX, blobY, blob.size, 0, Math.PI * 2);
            ctx.fill();
          });
        });
        
        // Draw wispy filaments using pre-generated data
        filaments.forEach((filament) => {
          const startX = Math.cos(filament.startAngle) * filament.startDist;
          const startY = Math.sin(filament.startAngle) * filament.startDist * 0.6;
          const endX = Math.cos(filament.endAngle) * filament.endDist;
          const endY = Math.sin(filament.endAngle) * filament.endDist * 0.6;
          
          const filamentGradient = ctx.createLinearGradient(startX, startY, endX, endY);
          const filamentColor = filament.colorIndex === 0 ? color2 : color3;
          filamentGradient.addColorStop(0, `rgba(${filamentColor.r}, ${filamentColor.g}, ${filamentColor.b}, 0)`);
          filamentGradient.addColorStop(0.3, `rgba(${filamentColor.r}, ${filamentColor.g}, ${filamentColor.b}, ${brightness * 0.4})`);
          filamentGradient.addColorStop(0.7, `rgba(${filamentColor.r}, ${filamentColor.g}, ${filamentColor.b}, ${brightness * 0.4})`);
          filamentGradient.addColorStop(1, `rgba(${filamentColor.r}, ${filamentColor.g}, ${filamentColor.b}, 0)`);
          
          ctx.strokeStyle = filamentGradient;
          ctx.lineWidth = filament.lineWidth;
          ctx.lineCap = 'round';
          ctx.globalAlpha = 0.3;
          
          ctx.beginPath();
          ctx.moveTo(startX, startY);
          ctx.quadraticCurveTo(filament.ctrlX, filament.ctrlY, endX, endY);
          ctx.stroke();
          
          ctx.globalAlpha = 1;
        });
        
        // Draw dust lanes (darker regions that add realism)
        dustLanes.forEach((lane) => {
          const { angle, width, offset } = lane;
          const laneLength = size * 1.2;
          const laneWidth = size * width;
          
          const laneX = Math.cos(angle) * size * offset;
          const laneY = Math.sin(angle) * size * offset * 0.6;
          
          ctx.save();
          ctx.translate(laneX, laneY);
          ctx.rotate(angle);
          
          // Dark dust lane gradient
          const dustGradient = ctx.createLinearGradient(0, -laneWidth, 0, laneWidth);
          dustGradient.addColorStop(0, 'rgba(0, 0, 0, 0)');
          dustGradient.addColorStop(0.3, 'rgba(0, 0, 0, 0.03)');
          dustGradient.addColorStop(0.5, 'rgba(0, 0, 0, 0.05)');
          dustGradient.addColorStop(0.7, 'rgba(0, 0, 0, 0.03)');
          dustGradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
          
          ctx.fillStyle = dustGradient;
          ctx.fillRect(-laneLength / 2, -laneWidth, laneLength, laneWidth * 2);
          
          ctx.restore();
        });
        
        // Draw scattered dust particles using pre-generated data
        dustParticles.forEach((particle) => {
          const px = Math.cos(particle.angle) * particle.dist;
          const py = Math.sin(particle.angle) * particle.dist * 0.7;
          
          const dustColor = particle.colorIndex === 0 ? color2 : color3;
          const dustAlpha = brightness * particle.alpha * (1 - particle.dist / size);
          
          ctx.beginPath();
          ctx.arc(px, py, particle.size, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(${dustColor.r}, ${dustColor.g}, ${dustColor.b}, ${dustAlpha})`;
          ctx.fill();
        });
        
        // Draw embedded stars inside the nebula
        nebula.embeddedStars.forEach((star) => {
          const sx = Math.cos(star.angle) * star.dist;
          const sy = Math.sin(star.angle) * star.dist * 0.7;
          const { r, g, b } = star.color;
          
          // Star core
          ctx.beginPath();
          ctx.arc(sx, sy, star.size, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${star.brightness})`;
          ctx.fill();
          
          // Star glow
          ctx.beginPath();
          ctx.arc(sx, sy, star.size * 2.5, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${star.brightness * 0.2})`;
          ctx.fill();
        });
        
        // Central glow (star-forming region)
        const coreGradient = ctx.createRadialGradient(0, 0, 0, 0, 0, size * 0.25);
        coreGradient.addColorStop(0, `rgba(${color3.r}, ${color3.g}, ${color3.b}, ${brightness * 1.5})`);
        coreGradient.addColorStop(0.3, `rgba(${color2.r}, ${color2.g}, ${color2.b}, ${brightness * 0.8})`);
        coreGradient.addColorStop(0.6, `rgba(${color1.r}, ${color1.g}, ${color1.b}, ${brightness * 0.3})`);
        coreGradient.addColorStop(1, `rgba(${color1.r}, ${color1.g}, ${color1.b}, 0)`);
        
        ctx.fillStyle = coreGradient;
        ctx.beginPath();
        ctx.arc(0, 0, size * 0.25, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.restore();
      });
    };

    const drawGalaxies = () => {
      galaxies.forEach((galaxy) => {
        const { x, y, size, rotation, brightness, type, inclination, arms, armTightness, armSpread, coreSize, coreColor, armColor, outerColor, parallaxFactor, armPoints, ellipticity, starPoints } = galaxy;
        
        // Apply parallax offset
        const parallaxX = mouseX * parallaxFactor * canvas.width * 0.5;
        const parallaxY = mouseY * parallaxFactor * canvas.height * 0.5;
        
        ctx.save();
        ctx.translate(x + parallaxX, y + parallaxY);
        ctx.rotate(rotation);
        
        // Apply 3D inclination - squash vertically to simulate viewing angle
        const yScale = 1 - inclination * 0.85; // 0.15 to 1.0
        ctx.scale(1, yScale);
        
        if (type === 'elliptical' || type === 'lenticular') {
          // Draw elliptical/lenticular galaxy
          const xRadius = size;
          const yRadius = size * (1 - ellipticity);
          
          // Outer halo
          const haloGradient = ctx.createRadialGradient(0, 0, 0, 0, 0, xRadius);
          haloGradient.addColorStop(0, `rgba(${coreColor.r}, ${coreColor.g}, ${coreColor.b}, ${brightness * 2})`);
          haloGradient.addColorStop(0.3, `rgba(${armColor.r}, ${armColor.g}, ${armColor.b}, ${brightness * 1.2})`);
          haloGradient.addColorStop(0.6, `rgba(${outerColor.r}, ${outerColor.g}, ${outerColor.b}, ${brightness * 0.5})`);
          haloGradient.addColorStop(1, `rgba(${outerColor.r}, ${outerColor.g}, ${outerColor.b}, 0)`);
          
          ctx.fillStyle = haloGradient;
          ctx.beginPath();
          ctx.ellipse(0, 0, xRadius, yRadius, 0, 0, Math.PI * 2);
          ctx.fill();
          
          // Draw individual stars for texture
          starPoints.forEach((star) => {
            const sx = star.x * xRadius;
            const sy = star.y * yRadius;
            const alpha = brightness * star.brightness * (1 - Math.sqrt(star.x * star.x + star.y * star.y));
            
            if (alpha > 0.01) {
              ctx.beginPath();
              ctx.arc(sx, sy, star.size, 0, Math.PI * 2);
              ctx.fillStyle = `rgba(${coreColor.r}, ${coreColor.g}, ${coreColor.b}, ${alpha})`;
              ctx.fill();
            }
          });
          
        } else if (type === 'irregular') {
          // Draw irregular galaxy - asymmetric blob
          starPoints.forEach((star) => {
            const sx = star.x * size;
            const sy = star.y * size;
            const alpha = brightness * star.brightness;
            
            ctx.beginPath();
            ctx.arc(sx, sy, star.size, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(${armColor.r}, ${armColor.g}, ${armColor.b}, ${alpha})`;
            ctx.fill();
          });
          
          // Faint core glow
          const coreGradient = ctx.createRadialGradient(0, 0, 0, 0, 0, size * 0.4);
          coreGradient.addColorStop(0, `rgba(${coreColor.r}, ${coreColor.g}, ${coreColor.b}, ${brightness * 0.8})`);
          coreGradient.addColorStop(1, `rgba(${coreColor.r}, ${coreColor.g}, ${coreColor.b}, 0)`);
          ctx.fillStyle = coreGradient;
          ctx.beginPath();
          ctx.arc(0, 0, size * 0.4, 0, Math.PI * 2);
          ctx.fill();
          
        } else if (type === 'barred-spiral') {
          // Draw barred spiral galaxy
          const coreRadius = size * coreSize;
          const barLength = size * 0.4;
          const barWidth = size * 0.08;
          
          // Draw central bar
          const barGradient = ctx.createLinearGradient(-barLength, 0, barLength, 0);
          barGradient.addColorStop(0, `rgba(${armColor.r}, ${armColor.g}, ${armColor.b}, 0)`);
          barGradient.addColorStop(0.3, `rgba(${coreColor.r}, ${coreColor.g}, ${coreColor.b}, ${brightness * 1.5})`);
          barGradient.addColorStop(0.5, `rgba(${coreColor.r}, ${coreColor.g}, ${coreColor.b}, ${brightness * 2})`);
          barGradient.addColorStop(0.7, `rgba(${coreColor.r}, ${coreColor.g}, ${coreColor.b}, ${brightness * 1.5})`);
          barGradient.addColorStop(1, `rgba(${armColor.r}, ${armColor.g}, ${armColor.b}, 0)`);
          
          ctx.fillStyle = barGradient;
          ctx.beginPath();
          ctx.ellipse(0, 0, barLength, barWidth, 0, 0, Math.PI * 2);
          ctx.fill();
          
          // Draw core
          const coreGradient = ctx.createRadialGradient(0, 0, 0, 0, 0, coreRadius);
          coreGradient.addColorStop(0, `rgba(${coreColor.r}, ${coreColor.g}, ${coreColor.b}, ${brightness * 3})`);
          coreGradient.addColorStop(0.5, `rgba(${armColor.r}, ${armColor.g}, ${armColor.b}, ${brightness * 1.5})`);
          coreGradient.addColorStop(1, `rgba(${armColor.r}, ${armColor.g}, ${armColor.b}, 0)`);
          
          ctx.fillStyle = coreGradient;
          ctx.beginPath();
          ctx.arc(0, 0, coreRadius, 0, Math.PI * 2);
          ctx.fill();
          
          // Draw spiral arms starting from bar ends
          for (let armIndex = 0; armIndex < 2; armIndex++) {
            const armStartX = armIndex === 0 ? barLength : -barLength;
            const armRotation = armIndex === 0 ? 0 : Math.PI;
            const points = armPoints[armIndex] || [];
            
            points.forEach((point) => {
              const { t, offset, dotSize } = point;
              const spiralAngle = armRotation + t * Math.PI * armTightness;
              const distance = barLength + t * (size - barLength);
              
              const baseX = Math.cos(spiralAngle) * distance;
              const baseY = Math.sin(spiralAngle) * distance * armSpread;
              
              const perpAngle = spiralAngle + Math.PI / 2;
              const armX = baseX + Math.cos(perpAngle) * offset;
              const armY = baseY + Math.sin(perpAngle) * offset * armSpread;
              
              const colorBlend = t;
              const r = Math.floor(armColor.r * (1 - colorBlend) + outerColor.r * colorBlend);
              const g = Math.floor(armColor.g * (1 - colorBlend) + outerColor.g * colorBlend);
              const b = Math.floor(armColor.b * (1 - colorBlend) + outerColor.b * colorBlend);
              
              const alpha = brightness * (1 - t * 0.7);
              
              ctx.beginPath();
              ctx.arc(armX, armY, dotSize, 0, Math.PI * 2);
              ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${alpha})`;
              ctx.fill();
            });
          }
          
        } else {
          // Draw regular spiral galaxy
          const coreRadius = size * coreSize;
          const coreGradient = ctx.createRadialGradient(0, 0, 0, 0, 0, coreRadius);
          coreGradient.addColorStop(0, `rgba(${coreColor.r}, ${coreColor.g}, ${coreColor.b}, ${brightness * 3})`);
          coreGradient.addColorStop(0.5, `rgba(${armColor.r}, ${armColor.g}, ${armColor.b}, ${brightness * 1.5})`);
          coreGradient.addColorStop(1, `rgba(${armColor.r}, ${armColor.g}, ${armColor.b}, 0)`);
          
          ctx.fillStyle = coreGradient;
          ctx.beginPath();
          ctx.arc(0, 0, coreRadius, 0, Math.PI * 2);
          ctx.fill();
          
          // Draw spiral arms
          for (let armIndex = 0; armIndex < arms; armIndex++) {
            const armRotation = (armIndex / arms) * Math.PI * 2;
            const points = armPoints[armIndex] || [];
            
            points.forEach((point) => {
              const { t, offset, dotSize } = point;
              const spiralAngle = armRotation + t * Math.PI * armTightness;
              const distance = t * size;
              
              const baseX = Math.cos(spiralAngle) * distance;
              const baseY = Math.sin(spiralAngle) * distance * armSpread;
              
              const perpAngle = spiralAngle + Math.PI / 2;
              const armX = baseX + Math.cos(perpAngle) * offset;
              const armY = baseY + Math.sin(perpAngle) * offset * armSpread;
              
              const colorBlend = t;
              const r = Math.floor(armColor.r * (1 - colorBlend) + outerColor.r * colorBlend);
              const g = Math.floor(armColor.g * (1 - colorBlend) + outerColor.g * colorBlend);
              const b = Math.floor(armColor.b * (1 - colorBlend) + outerColor.b * colorBlend);
              
              const alpha = brightness * (1 - t * 0.7);
              
              ctx.beginPath();
              ctx.arc(armX, armY, dotSize, 0, Math.PI * 2);
              ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${alpha})`;
              ctx.fill();
            });
          }
        }
        
        ctx.restore();
      });
    };

    const createShootingStar = () => {
      // Random starting position from any edge
      const edge = Math.floor(Math.random() * 4); // 0=top, 1=right, 2=bottom, 3=left
      let startX: number, startY: number, angle: number;
      
      const margin = 50;
      
      switch (edge) {
        case 0: // From top
          startX = Math.random() * canvas.width;
          startY = -margin;
          angle = Math.PI / 4 + Math.random() * Math.PI / 2; // Down-ish (45° to 135°)
          break;
        case 1: // From right
          startX = canvas.width + margin;
          startY = Math.random() * canvas.height;
          angle = Math.PI * 0.6 + Math.random() * Math.PI * 0.6; // Left-ish (108° to 216°)
          break;
        case 2: // From bottom
          startX = Math.random() * canvas.width;
          startY = canvas.height + margin;
          angle = -Math.PI / 4 - Math.random() * Math.PI / 2; // Up-ish (-45° to -135°)
          break;
        case 3: // From left
        default:
          startX = -margin;
          startY = Math.random() * canvas.height;
          angle = -Math.PI / 4 + Math.random() * Math.PI / 2; // Right-ish (-45° to 45°)
          break;
      }

      // Random speed variation
      const speed = 4 + Math.random() * 16; // Very slow to very fast
      
      // Random length based on speed
      const length = 50 + speed * 8 + Math.random() * 60;

      shootingStars.push({
        x: startX,
        y: startY,
        angle: angle,
        speed: speed,
        length: length,
        brightness: 0.7 + Math.random() * 0.3,
        life: 1,
        decay: 0.003 + Math.random() * 0.012,
        size: 1 + Math.random() * 2,
        color: getRandomShootingStarColor(),
        parallaxFactor: 0.08 + Math.random() * 0.04, // Shooting stars are close, so more parallax
      });
    };

    const drawStars = () => {
      stars.forEach((star) => {
        const twinkle = Math.sin(time * star.twinkleSpeed + star.twinkleOffset) * 0.4 + 0.6;
        const alpha = star.brightness * twinkle;
        const { r, g, b } = star.color;
        
        // Apply parallax offset based on star's depth
        const parallaxX = mouseX * star.parallaxFactor * canvas.width * 0.5;
        const parallaxY = mouseY * star.parallaxFactor * canvas.height * 0.5;
        const drawX = star.x + parallaxX;
        const drawY = star.y + parallaxY;
        
        // Draw star core
        ctx.beginPath();
        ctx.arc(drawX, drawY, star.size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${alpha})`;
        ctx.fill();
        
        // Add glow for brighter stars
        if (star.brightness > 0.6) {
          ctx.beginPath();
          ctx.arc(drawX, drawY, star.size * 2.5, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${alpha * 0.15})`;
          ctx.fill();
        }
      });
    };

    const drawShootingStars = () => {
      shootingStars = shootingStars.filter((star) => star.life > 0);

      shootingStars.forEach((star) => {
        // Update position
        star.x += Math.cos(star.angle) * star.speed;
        star.y += Math.sin(star.angle) * star.speed;
        star.life -= star.decay;

        const alpha = star.brightness * star.life;
        const { r, g, b } = star.color;
        
        // Apply parallax offset for shooting stars
        const parallaxX = mouseX * star.parallaxFactor * canvas.width * 0.5;
        const parallaxY = mouseY * star.parallaxFactor * canvas.height * 0.5;
        const drawX = star.x + parallaxX;
        const drawY = star.y + parallaxY;
        
        // Calculate tail end position with parallax
        const tailX = drawX - Math.cos(star.angle) * star.length;
        const tailY = drawY - Math.sin(star.angle) * star.length;

        // Draw the shooting star with gradient tail
        const gradient = ctx.createLinearGradient(tailX, tailY, drawX, drawY);
        gradient.addColorStop(0, `rgba(${r}, ${g}, ${b}, 0)`);
        gradient.addColorStop(0.6, `rgba(${r}, ${g}, ${b}, ${alpha * 0.3})`);
        gradient.addColorStop(0.9, `rgba(${r}, ${g}, ${b}, ${alpha * 0.8})`);
        gradient.addColorStop(1, `rgba(${r}, ${g}, ${b}, ${alpha})`);

        ctx.beginPath();
        ctx.moveTo(tailX, tailY);
        ctx.lineTo(drawX, drawY);
        ctx.strokeStyle = gradient;
        ctx.lineWidth = star.size;
        ctx.lineCap = 'round';
        ctx.stroke();

        // Bright head
        ctx.beginPath();
        ctx.arc(drawX, drawY, star.size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${alpha})`;
        ctx.fill();

        // Glow around head
        const glowGradient = ctx.createRadialGradient(drawX, drawY, 0, drawX, drawY, star.size * 5);
        glowGradient.addColorStop(0, `rgba(${r}, ${g}, ${b}, ${alpha * 0.6})`);
        glowGradient.addColorStop(1, `rgba(${r}, ${g}, ${b}, 0)`);
        ctx.fillStyle = glowGradient;
        ctx.beginPath();
        ctx.arc(drawX, drawY, star.size * 5, 0, Math.PI * 2);
        ctx.fill();
      });
    };

    const animate = (timestamp: number) => {
      // Calculate delta time in seconds
      if (lastTimestamp === 0) lastTimestamp = timestamp;
      const deltaTime = (timestamp - lastTimestamp) / 1000;
      lastTimestamp = timestamp;
      time += deltaTime;
      
      // Smoothly interpolate mouse position for parallax (easing)
      const lerpFactor = 0.05;
      mouseX += (targetMouseX - mouseX) * lerpFactor;
      mouseY += (targetMouseY - mouseY) * lerpFactor;

      // Deep space background
      const bgGradient = ctx.createRadialGradient(
        canvas.width * 0.5, canvas.height * 0.5, 0,
        canvas.width * 0.5, canvas.height * 0.5, canvas.width * 0.8
      );
      bgGradient.addColorStop(0, '#0a0a10');
      bgGradient.addColorStop(0.5, '#050508');
      bgGradient.addColorStop(1, '#000000');
      
      ctx.fillStyle = bgGradient;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      // Draw background elements first (behind stars)
      drawNebulas();
      drawGalaxies();
      
      drawStars();
      drawShootingStars();

      // Spawn shooting star at randomized intervals (5-15 seconds)
      if (time >= nextShootingStarTime) {
        createShootingStar();
        nextShootingStarTime = time + getNextShootingStarDelay();
      }
      
      animationFrameId = requestAnimationFrame(animate);
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
    window.addEventListener('mousemove', handleMouseMove);
    
    animationFrameId = requestAnimationFrame(animate);

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      window.removeEventListener('mousemove', handleMouseMove);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return <canvas ref={canvasRef} className="starfield-canvas" />;
};

export default StarField;
