import { useEffect, useRef } from 'react';
import type { FC } from 'react';
import type { ShootingStar, Galaxy, Nebula } from './types';
import { initStars, initGalaxies, initNebulas, createShootingStar, getNextShootingStarDelay } from './generators';
import { drawShootingStars, drawGalaxies, drawNebulas } from './drawFunctions';
import { VERTEX_SHADER, FRAGMENT_SHADER } from './shaders';
import {
  initWebGL,
  createShader,
  createProgram,
  getAttributeLocations,
  getUniformLocations,
  createStarBuffer,
} from './webglUtils';
import './StarField.css';

// Add global declaration for the FPS toggle
declare global {
  interface Window {
    showFps: boolean;
  }
}

// Enable FPS by default in dev mode
if (import.meta.env.DEV) {
  window.showFps = true;
}

// ============================================================================
// CONFIGURATION
// ============================================================================

const DRIFT_SPEED = 0.05; // Speed of forward movement through space
const DENSITY_CONFIG = {
  starDensityMultiplier: 1.2,
  galaxyCountMultiplier: 2.5,
  nebulaCountMultiplier: 3.0,
  maxShootingStars: 5,
};

let performanceLogged = false;

// ============================================================================
// COMPONENT
// ============================================================================

const StarField: FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const overlayRef = useRef<HTMLCanvasElement>(null);
  const fpsRef = useRef(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    const overlay = overlayRef.current;
    if (!canvas || !overlay) return;

    // Initialize WebGL for stars
    const gl = initWebGL(canvas);
    const ctx2d = overlay.getContext('2d');

    if (!gl || !ctx2d) {
      console.error('WebGL or 2D context not supported');
      return;
    }

    // Log once
    if (!performanceLogged) {
      console.log('🚀 StarField: WebGL renderer active');
      performanceLogged = true;
    }

    // Compile shaders and create program
    const vertexShader = createShader(gl, gl.VERTEX_SHADER, VERTEX_SHADER);
    const fragmentShader = createShader(gl, gl.FRAGMENT_SHADER, FRAGMENT_SHADER);
    
    if (!vertexShader || !fragmentShader) return;

    const program = createProgram(gl, vertexShader, fragmentShader);
    if (!program) return;

    gl.useProgram(program);

    // Get shader locations
    const attributes = getAttributeLocations(gl, program);
    const uniforms = getUniformLocations(gl, program);

    // ========================================================================
    // STATE
    // ========================================================================
    let animationFrameId: number;
    let time = 0;
    let lastTimestamp = 0;
    let driftOffset = 0;
    let particleCount = 0;
    
    // Celestial objects (2D canvas)
    let galaxies: Galaxy[] = [];
    let nebulas: Nebula[] = [];
    let shootingStars: ShootingStar[] = [];
    let nextShootingStarTime = 5 + Math.random() * 10;
    
    // FPS tracking
    let frameCount = 0;
    let lastFpsCheck = 0;

    // ========================================================================
    // INITIALIZATION
    // ========================================================================
    const initScene = (width: number, height: number) => {
      // Generate and upload stars to GPU
      const stars = initStars(width, height, DENSITY_CONFIG as any);
      particleCount = createStarBuffer(gl, stars, attributes);
      
      // Initialize 2D objects
      galaxies = initGalaxies(width, height, DENSITY_CONFIG as any);
      nebulas = initNebulas(width, height, DENSITY_CONFIG as any);
      
      console.log(`🌟 ${particleCount} stars (WebGL), ${galaxies.length} galaxies, ${nebulas.length} nebulas`);
    };

    const resize = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      overlay.width = width * dpr;
      overlay.height = height * dpr;
      
      gl.viewport(0, 0, canvas.width, canvas.height);
      gl.uniform2f(uniforms.resolution, canvas.width, canvas.height);
      
      initScene(canvas.width, canvas.height);
    };

    // ========================================================================
    // RENDER LOOP
    // ========================================================================
    const render = (timestamp: number) => {
      if (lastTimestamp === 0) lastTimestamp = timestamp;
      const deltaTime = (timestamp - lastTimestamp) / 1000;
      lastTimestamp = timestamp;
      time += deltaTime;
      
      // FPS calculation
      frameCount++;
      if (timestamp - lastFpsCheck >= 1000) {
        fpsRef.current = frameCount;
        frameCount = 0;
        lastFpsCheck = timestamp;
      }

      // Update drift
      driftOffset += DRIFT_SPEED * deltaTime;
      if (driftOffset > 100) driftOffset -= 100;

      // --- WebGL: Draw Stars ---
      gl.uniform1f(uniforms.time, time);
      gl.uniform1f(uniforms.driftOffset, driftOffset);
      gl.clearColor(0.02, 0.02, 0.04, 1.0);
      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.drawArrays(gl.POINTS, 0, particleCount);
      
      // --- 2D Canvas: Draw Galaxies, Nebulas, Shooting Stars ---
      ctx2d.clearRect(0, 0, overlay.width, overlay.height);
      drawNebulas(ctx2d, nebulas, 0, 0, overlay.width, overlay.height, driftOffset, 1);
      drawGalaxies(ctx2d, galaxies, 0, 0, overlay.width, overlay.height, driftOffset, 1);
      
      // Shooting stars
      if (time >= nextShootingStarTime && shootingStars.length < DENSITY_CONFIG.maxShootingStars) {
        shootingStars.push(createShootingStar(overlay.width, overlay.height));
        nextShootingStarTime = time + getNextShootingStarDelay();
      }
      shootingStars = drawShootingStars(ctx2d, shootingStars, 0, 0, overlay.width, overlay.height);

      // FPS Counter
      if (window.showFps) {
        ctx2d.font = 'bold 48px monospace';
        ctx2d.fillStyle = '#FFFF00';
        ctx2d.textAlign = 'left';
        ctx2d.textBaseline = 'top';
        ctx2d.fillText(Math.round(fpsRef.current).toString(), 10, 10);
      }

      animationFrameId = requestAnimationFrame(render);
    };

    // ========================================================================
    // START
    // ========================================================================
    window.addEventListener('resize', resize);
    resize();
    animationFrameId = requestAnimationFrame(render);

    return () => {
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <>
      <canvas ref={canvasRef} className="starfield-canvas" style={{ zIndex: 0 }} />
      <canvas ref={overlayRef} className="starfield-canvas" style={{ zIndex: 1, pointerEvents: 'none', background: 'transparent' }} />
    </>
  );
};

export default StarField;
