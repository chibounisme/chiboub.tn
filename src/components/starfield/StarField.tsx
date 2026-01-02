import { useEffect, useRef } from 'react';
import type { FC } from 'react';
import type { Star, ShootingStar, Galaxy, Nebula } from './types';
import { initStars, initGalaxies, initNebulas, createShootingStar, getNextShootingStarDelay } from './generators';
import { drawStars, drawShootingStars, drawGalaxies, drawNebulas, drawBackground } from './drawFunctions';
import { getPerformanceConfig, logPerformanceInfo } from './performanceUtils';
import './StarField.css';

// Autopilot/drift configuration
const DRIFT_SPEED = 0.05; // Speed of forward movement

const StarField: FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Detect performance and get config
    const performanceConfig = getPerformanceConfig();
    logPerformanceInfo(); // Log for debugging

    let animationFrameId: number;
    let stars: Star[] = [];
    let shootingStars: ShootingStar[] = [];
    let galaxies: Galaxy[] = [];
    let nebulas: Nebula[] = [];
    let time = 0;
    let lastTimestamp = 0;
    let nextShootingStarTime = 5 + Math.random() * 10;
    
    // Performance monitoring
    let frameCount = 0;
    let lastFpsCheck = 0;
    let currentFps = 60;
    let quality = 1.0; // 0.1 to 1.0
    
    // Mouse position for parallax effect
    let mouseX = 0;
    let mouseY = 0;
    let targetMouseX = 0;
    let targetMouseY = 0;
    
    // Space travel / autopilot state
    let driftOffset = 0; // Accumulated travel distance (0-1, wraps)
    const driftAmount = 1; // Always full speed

    const handleMouseMove = (e: MouseEvent) => {
      targetMouseX = (e.clientX / window.innerWidth - 0.5) * 2;
      targetMouseY = (e.clientY / window.innerHeight - 0.5) * 2;
    };

    const resizeCanvas = () => {
      // Limit pixel ratio for performance on high-DPI screens
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = window.innerWidth * dpr;
      canvas.height = window.innerHeight * dpr;
      
      // Re-init objects with new dimensions
      galaxies = initGalaxies(canvas.width, canvas.height, performanceConfig);
      nebulas = initNebulas(canvas.width, canvas.height, performanceConfig);
      stars = initStars(canvas.width, canvas.height, performanceConfig);
    };

    const animate = (timestamp: number) => {
      if (lastTimestamp === 0) lastTimestamp = timestamp;
      const deltaTime = (timestamp - lastTimestamp) / 1000;
      lastTimestamp = timestamp;
      time += deltaTime;
      
      // FPS Calculation and Adaptive Quality
      frameCount++;
      if (timestamp - lastFpsCheck >= 1000) {
        currentFps = frameCount;
        frameCount = 0;
        lastFpsCheck = timestamp;
        
        // Adjust quality based on FPS
        if (currentFps < 30 && quality > 0.2) {
          quality -= 0.1;
        } else if (currentFps > 55 && quality < 1.0) {
          quality += 0.05;
        }
      }
      
      // Accumulate drift offset - scaled by driftAmount for smooth acceleration/deceleration
      // This way, movement speed smoothly ramps up and down
      driftOffset += DRIFT_SPEED * deltaTime * driftAmount;
      // Keep in reasonable range (wraps smoothly)
      if (driftOffset > 100) driftOffset -= 100;
      
      // Smooth parallax interpolation
      const lerpFactor = 0.05;
      mouseX += (targetMouseX - mouseX) * lerpFactor;
      mouseY += (targetMouseY - mouseY) * lerpFactor;

      // Draw background
      drawBackground(ctx, canvas.width, canvas.height, quality);
      
      // Draw celestial objects (back to front) with drift parameters
      // Apply quality reduction by slicing arrays
      const activeNebulas = quality < 0.5 ? [] : nebulas; // Hide nebulas on low quality
      const activeGalaxies = quality < 0.8 ? [] : galaxies; // Hide galaxies on medium/low quality
      const activeStars = stars.slice(0, Math.floor(stars.length * quality));
      
      if (quality > 0.5) {
          drawNebulas(ctx, activeNebulas, mouseX, mouseY, canvas.width, canvas.height, driftOffset, driftAmount);
      }
      if (quality > 0.8) {
          drawGalaxies(ctx, activeGalaxies, mouseX, mouseY, canvas.width, canvas.height, driftOffset, driftAmount);
      }
      
      drawStars(ctx, activeStars, time, mouseX, mouseY, canvas.width, canvas.height, driftOffset, driftAmount);
      
      // Only show shooting stars when not in space travel mode
      // Limit based on performance config
      if (quality > 0.6) {
        shootingStars = drawShootingStars(ctx, shootingStars, mouseX, mouseY, canvas.width, canvas.height);

        // Spawn shooting star at intervals (respecting max count)
        if (time >= nextShootingStarTime && shootingStars.length < performanceConfig.maxShootingStars) {
          shootingStars.push(createShootingStar(canvas.width, canvas.height));
          nextShootingStarTime = time + getNextShootingStarDelay();
        }
      } else {
        // Let existing shooting stars finish, but don't spawn new ones
        shootingStars = shootingStars.filter(s => s.life > 0);
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
