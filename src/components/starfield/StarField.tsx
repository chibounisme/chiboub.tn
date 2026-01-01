import { useEffect, useRef } from 'react';
import type { FC } from 'react';
import type { Star, ShootingStar, Galaxy, Nebula } from './types';
import { initStars, initGalaxies, initNebulas, createShootingStar, getNextShootingStarDelay } from './generators';
import { drawStars, drawShootingStars, drawGalaxies, drawNebulas, drawBackground } from './drawFunctions';
import './StarField.css';

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
    let nextShootingStarTime = 5 + Math.random() * 10;
    
    // Mouse position for parallax effect
    let mouseX = 0;
    let mouseY = 0;
    let targetMouseX = 0;
    let targetMouseY = 0;

    const handleMouseMove = (e: MouseEvent) => {
      targetMouseX = (e.clientX / window.innerWidth - 0.5) * 2;
      targetMouseY = (e.clientY / window.innerHeight - 0.5) * 2;
    };

    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      galaxies = initGalaxies(canvas.width, canvas.height);
      nebulas = initNebulas(canvas.width, canvas.height);
      stars = initStars(canvas.width, canvas.height);
    };

    const animate = (timestamp: number) => {
      if (lastTimestamp === 0) lastTimestamp = timestamp;
      const deltaTime = (timestamp - lastTimestamp) / 1000;
      lastTimestamp = timestamp;
      time += deltaTime;
      
      // Smooth parallax interpolation
      const lerpFactor = 0.05;
      mouseX += (targetMouseX - mouseX) * lerpFactor;
      mouseY += (targetMouseY - mouseY) * lerpFactor;

      // Draw background
      drawBackground(ctx, canvas.width, canvas.height);
      
      // Draw celestial objects (back to front)
      drawNebulas(ctx, nebulas, mouseX, mouseY, canvas.width, canvas.height);
      drawGalaxies(ctx, galaxies, mouseX, mouseY, canvas.width, canvas.height);
      drawStars(ctx, stars, time, mouseX, mouseY, canvas.width, canvas.height);
      shootingStars = drawShootingStars(ctx, shootingStars, mouseX, mouseY, canvas.width, canvas.height);

      // Spawn shooting star at intervals
      if (time >= nextShootingStarTime) {
        shootingStars.push(createShootingStar(canvas.width, canvas.height));
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
