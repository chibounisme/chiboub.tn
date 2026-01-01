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
}

interface Galaxy {
  x: number;
  y: number;
  size: number;
  rotation: number;
  brightness: number;
  arms: number;
  color: { r: number; g: number; b: number };
}

interface Nebula {
  x: number;
  y: number;
  size: number;
  brightness: number;
  color1: { r: number; g: number; b: number };
  color2: { r: number; g: number; b: number };
  shape: number; // 0-1 for shape variation
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

// Galaxy colors
const galaxyColors = [
  { r: 200, g: 180, b: 255 }, // Purple-ish
  { r: 255, g: 220, b: 180 }, // Warm yellow
  { r: 180, g: 200, b: 255 }, // Blue-ish
  { r: 255, g: 200, b: 200 }, // Pink-ish
];

// Nebula color pairs
const nebulaColorPairs = [
  [{ r: 100, g: 50, b: 150 }, { r: 200, g: 100, b: 180 }],   // Purple/Pink
  [{ r: 50, g: 80, b: 150 }, { r: 100, g: 150, b: 200 }],    // Blue
  [{ r: 150, g: 80, b: 80 }, { r: 200, g: 120, b: 100 }],    // Red/Orange
  [{ r: 50, g: 100, b: 100 }, { r: 100, g: 180, b: 150 }],   // Teal/Green
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
      
      // Add 2-4 small galaxies
      const numGalaxies = 2 + Math.floor(Math.random() * 3);
      for (let i = 0; i < numGalaxies; i++) {
        galaxies.push({
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height,
          size: 20 + Math.random() * 40,
          rotation: Math.random() * Math.PI * 2,
          brightness: 0.03 + Math.random() * 0.05,
          arms: 2 + Math.floor(Math.random() * 3),
          color: galaxyColors[Math.floor(Math.random() * galaxyColors.length)],
        });
      }
      
      // Add 2-4 nebulas
      const numNebulas = 2 + Math.floor(Math.random() * 3);
      for (let i = 0; i < numNebulas; i++) {
        const colorPair = nebulaColorPairs[Math.floor(Math.random() * nebulaColorPairs.length)];
        nebulas.push({
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height,
          size: 80 + Math.random() * 150,
          brightness: 0.02 + Math.random() * 0.04,
          color1: colorPair[0],
          color2: colorPair[1],
          shape: Math.random(),
        });
      }
    };

    const initStars = () => {
      stars = [];
      const numStars = Math.floor((canvas.width * canvas.height) / 2500);
      
      for (let i = 0; i < numStars; i++) {
        stars.push({
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height,
          size: Math.random() * 1.8 + 0.3,
          brightness: Math.random() * 0.7 + 0.3,
          twinkleSpeed: Math.random() * 0.04 + 0.01,
          twinkleOffset: Math.random() * Math.PI * 2,
          color: getRandomStarColor(),
        });
      }
    };

    const drawNebulas = () => {
      nebulas.forEach((nebula) => {
        const { x, y, size, brightness, color1, color2, shape } = nebula;
        
        // Draw nebula as multiple overlapping gradients
        for (let i = 0; i < 3; i++) {
          const offsetX = (Math.sin(shape * Math.PI * 2 + i) * size * 0.3);
          const offsetY = (Math.cos(shape * Math.PI * 2 + i) * size * 0.2);
          const layerSize = size * (0.6 + i * 0.2);
          
          const gradient = ctx.createRadialGradient(
            x + offsetX, y + offsetY, 0,
            x + offsetX, y + offsetY, layerSize
          );
          
          const color = i % 2 === 0 ? color1 : color2;
          gradient.addColorStop(0, `rgba(${color.r}, ${color.g}, ${color.b}, ${brightness * 1.5})`);
          gradient.addColorStop(0.3, `rgba(${color.r}, ${color.g}, ${color.b}, ${brightness})`);
          gradient.addColorStop(0.7, `rgba(${color.r}, ${color.g}, ${color.b}, ${brightness * 0.3})`);
          gradient.addColorStop(1, `rgba(${color.r}, ${color.g}, ${color.b}, 0)`);
          
          ctx.fillStyle = gradient;
          ctx.beginPath();
          ctx.arc(x + offsetX, y + offsetY, layerSize, 0, Math.PI * 2);
          ctx.fill();
        }
      });
    };

    const drawGalaxies = () => {
      galaxies.forEach((galaxy) => {
        const { x, y, size, rotation, brightness, arms, color } = galaxy;
        
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(rotation);
        
        // Draw galaxy core
        const coreGradient = ctx.createRadialGradient(0, 0, 0, 0, 0, size * 0.3);
        coreGradient.addColorStop(0, `rgba(${color.r}, ${color.g}, ${color.b}, ${brightness * 3})`);
        coreGradient.addColorStop(0.5, `rgba(${color.r}, ${color.g}, ${color.b}, ${brightness * 1.5})`);
        coreGradient.addColorStop(1, `rgba(${color.r}, ${color.g}, ${color.b}, 0)`);
        
        ctx.fillStyle = coreGradient;
        ctx.beginPath();
        ctx.arc(0, 0, size * 0.3, 0, Math.PI * 2);
        ctx.fill();
        
        // Draw spiral arms
        for (let arm = 0; arm < arms; arm++) {
          const armRotation = (arm / arms) * Math.PI * 2;
          
          for (let i = 0; i < 30; i++) {
            const t = i / 30;
            const spiralAngle = armRotation + t * Math.PI * 1.5;
            const distance = t * size;
            const armX = Math.cos(spiralAngle) * distance;
            const armY = Math.sin(spiralAngle) * distance * 0.4; // Flatten for perspective
            
            const dotSize = (1 - t) * 3 + 0.5;
            const alpha = brightness * (1 - t * 0.7);
            
            ctx.beginPath();
            ctx.arc(armX, armY, dotSize, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(${color.r}, ${color.g}, ${color.b}, ${alpha})`;
            ctx.fill();
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
      });
    };

    const drawStars = () => {
      stars.forEach((star) => {
        const twinkle = Math.sin(time * star.twinkleSpeed + star.twinkleOffset) * 0.4 + 0.6;
        const alpha = star.brightness * twinkle;
        const { r, g, b } = star.color;
        
        // Draw star core
        ctx.beginPath();
        ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${alpha})`;
        ctx.fill();
        
        // Add glow for brighter stars
        if (star.brightness > 0.6) {
          ctx.beginPath();
          ctx.arc(star.x, star.y, star.size * 2.5, 0, Math.PI * 2);
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
        
        // Calculate tail end position
        const tailX = star.x - Math.cos(star.angle) * star.length;
        const tailY = star.y - Math.sin(star.angle) * star.length;

        // Draw the shooting star with gradient tail
        const gradient = ctx.createLinearGradient(tailX, tailY, star.x, star.y);
        gradient.addColorStop(0, `rgba(${r}, ${g}, ${b}, 0)`);
        gradient.addColorStop(0.6, `rgba(${r}, ${g}, ${b}, ${alpha * 0.3})`);
        gradient.addColorStop(0.9, `rgba(${r}, ${g}, ${b}, ${alpha * 0.8})`);
        gradient.addColorStop(1, `rgba(${r}, ${g}, ${b}, ${alpha})`);

        ctx.beginPath();
        ctx.moveTo(tailX, tailY);
        ctx.lineTo(star.x, star.y);
        ctx.strokeStyle = gradient;
        ctx.lineWidth = star.size;
        ctx.lineCap = 'round';
        ctx.stroke();

        // Bright head
        ctx.beginPath();
        ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${alpha})`;
        ctx.fill();

        // Glow around head
        const glowGradient = ctx.createRadialGradient(star.x, star.y, 0, star.x, star.y, star.size * 5);
        glowGradient.addColorStop(0, `rgba(${r}, ${g}, ${b}, ${alpha * 0.6})`);
        glowGradient.addColorStop(1, `rgba(${r}, ${g}, ${b}, 0)`);
        ctx.fillStyle = glowGradient;
        ctx.beginPath();
        ctx.arc(star.x, star.y, star.size * 5, 0, Math.PI * 2);
        ctx.fill();
      });
    };

    const animate = (timestamp: number) => {
      // Calculate delta time in seconds
      if (lastTimestamp === 0) lastTimestamp = timestamp;
      const deltaTime = (timestamp - lastTimestamp) / 1000;
      lastTimestamp = timestamp;
      time += deltaTime;

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
    
    animationFrameId = requestAnimationFrame(animate);

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return <canvas ref={canvasRef} className="starfield-canvas" />;
};

export default StarField;
