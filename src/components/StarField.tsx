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
}

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
    let time = 0;
    let nextShootingStarTime = 3 + Math.random() * 9; // First one between 3-12 seconds

    const getNextShootingStarDelay = (): number => {
      return 3 + Math.random() * 9; // Random delay between 3 and 12 seconds
    };

    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      initStars();
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
        });
      }
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
        decay: 0.003 + Math.random() * 0.012, // Slower to faster fade
        size: 1 + Math.random() * 2,
      });
    };

    const drawStars = () => {
      stars.forEach((star) => {
        const twinkle = Math.sin(time * star.twinkleSpeed + star.twinkleOffset) * 0.4 + 0.6;
        const alpha = star.brightness * twinkle;
        
        // Draw star core
        ctx.beginPath();
        ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
        ctx.fill();
        
        // Add glow for brighter stars
        if (star.brightness > 0.6) {
          ctx.beginPath();
          ctx.arc(star.x, star.y, star.size * 2.5, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(255, 255, 255, ${alpha * 0.15})`;
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
        
        // Calculate tail end position
        const tailX = star.x - Math.cos(star.angle) * star.length;
        const tailY = star.y - Math.sin(star.angle) * star.length;

        // Draw the shooting star with gradient tail
        const gradient = ctx.createLinearGradient(tailX, tailY, star.x, star.y);
        gradient.addColorStop(0, `rgba(255, 255, 255, 0)`);
        gradient.addColorStop(0.6, `rgba(255, 255, 255, ${alpha * 0.3})`);
        gradient.addColorStop(0.9, `rgba(255, 255, 255, ${alpha * 0.8})`);
        gradient.addColorStop(1, `rgba(255, 255, 255, ${alpha})`);

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
        ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
        ctx.fill();

        // Glow around head
        const glowGradient = ctx.createRadialGradient(star.x, star.y, 0, star.x, star.y, star.size * 5);
        glowGradient.addColorStop(0, `rgba(255, 255, 255, ${alpha * 0.6})`);
        glowGradient.addColorStop(1, `rgba(255, 255, 255, 0)`);
        ctx.fillStyle = glowGradient;
        ctx.beginPath();
        ctx.arc(star.x, star.y, star.size * 5, 0, Math.PI * 2);
        ctx.fill();
      });
    };

    const animate = () => {
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
      
      drawStars();
      drawShootingStars();

      // Spawn shooting star at randomized intervals (3-12 seconds)
      if (time >= nextShootingStarTime) {
        createShootingStar();
        nextShootingStarTime = time + getNextShootingStarDelay();
      }
      
      time += 0.016;
      animationFrameId = requestAnimationFrame(animate);
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
    
    animate();

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return <canvas ref={canvasRef} className="starfield-canvas" />;
};

export default StarField;
