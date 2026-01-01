import { useEffect, useRef } from 'react';
import type { FC } from 'react';
import type { Star, ShootingStar, Galaxy, Nebula } from './types';
import { initStars, initGalaxies, initNebulas, createShootingStar, getNextShootingStarDelay } from './generators';
import { drawStars, drawShootingStars, drawGalaxies, drawNebulas, drawBackground } from './drawFunctions';
import './StarField.css';

// Autopilot/drift configuration
const IDLE_THRESHOLD = 5; // Seconds of idle before space travel starts
const DRIFT_SPEED = 0.015; // Speed of forward movement (lower = slower)
const DRIFT_FADE_IN = 0.015; // How fast drift fades in
const DRIFT_FADE_OUT = 0.04; // How fast drift fades out when mouse moves

interface StarFieldProps {
  onDriftChange?: (driftAmount: number) => void;
}

const StarField: FC<StarFieldProps> = ({ onDriftChange }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const onDriftChangeRef = useRef(onDriftChange);
  
  // Keep ref updated with latest callback
  useEffect(() => {
    onDriftChangeRef.current = onDriftChange;
  }, [onDriftChange]);

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
    
    // Space travel / autopilot state
    let lastMouseMoveTime = 0;
    let driftAmount = 0; // 0 = normal mode, 1 = full space travel
    let driftOffset = 0; // Accumulated travel distance (0-1, wraps)
    let lastReportedDrift = -1; // Track last reported value to avoid redundant updates

    const handleMouseMove = (e: MouseEvent) => {
      targetMouseX = (e.clientX / window.innerWidth - 0.5) * 2;
      targetMouseY = (e.clientY / window.innerHeight - 0.5) * 2;
      lastMouseMoveTime = time; // Reset idle timer on mouse move
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
      
      // Update drift state based on idle time
      const idleTime = time - lastMouseMoveTime;
      const shouldDrift = idleTime > IDLE_THRESHOLD;
      
      if (shouldDrift) {
        // Fade in drift
        driftAmount = Math.min(1, driftAmount + DRIFT_FADE_IN);
      } else {
        // Fade out drift (faster)
        driftAmount = Math.max(0, driftAmount - DRIFT_FADE_OUT);
      }
      
      // Notify parent of drift state changes (throttled to avoid excessive re-renders)
      const roundedDrift = Math.round(driftAmount * 100) / 100;
      if (roundedDrift !== lastReportedDrift && onDriftChangeRef.current) {
        lastReportedDrift = roundedDrift;
        onDriftChangeRef.current(driftAmount);
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
      drawBackground(ctx, canvas.width, canvas.height);
      
      // Draw celestial objects (back to front) with drift parameters
      drawNebulas(ctx, nebulas, mouseX, mouseY, canvas.width, canvas.height, driftOffset, driftAmount);
      drawGalaxies(ctx, galaxies, mouseX, mouseY, canvas.width, canvas.height, driftOffset, driftAmount);
      drawStars(ctx, stars, time, mouseX, mouseY, canvas.width, canvas.height, driftOffset, driftAmount);
      
      // Only show shooting stars when not in space travel mode
      if (driftAmount < 0.5) {
        shootingStars = drawShootingStars(ctx, shootingStars, mouseX, mouseY, canvas.width, canvas.height);

        // Spawn shooting star at intervals
        if (time >= nextShootingStarTime) {
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
