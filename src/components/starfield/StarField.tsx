import { useEffect, useRef } from 'react';
import type { FC } from 'react';
import type { ShootingStar, Galaxy, Nebula } from './types';
import { initStars, initGalaxies, initNebulas, createShootingStar, getNextShootingStarDelay } from './generators';
import { drawShootingStars, drawGalaxies, drawNebulas } from './drawFunctions';
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
// WEBGL SHADERS - Stars rendered on GPU for maximum performance
// ============================================================================

const VERTEX_SHADER = `
attribute float a_angle;
attribute float a_initialPhase;
attribute float a_size;
attribute vec3 a_color;
attribute float a_brightness;
attribute float a_twinkleSpeed;
attribute float a_twinkleOffset;

uniform float u_time;
uniform float u_driftOffset;
uniform vec2 u_resolution;

varying vec3 v_color;
varying float v_alpha;

void main() {
  float maxDist = length(u_resolution * 0.5);
  
  // Calculate depth phase (0 to 1) - continuous warp effect
  float speed = 0.2;
  float depthPhase = mod(a_initialPhase + u_driftOffset * speed, 1.0);
  
  // Calculate travel distance from center
  float travelDist = maxDist * depthPhase;
  
  // Calculate position from center outward
  float x = cos(a_angle) * travelDist;
  float y = sin(a_angle) * travelDist;
  
  // Center the coordinates
  vec2 center = u_resolution * 0.5;
  vec2 pos = center + vec2(x, y);
  
  // Convert to clip space (-1 to 1)
  gl_Position = vec4((pos / u_resolution) * 2.0 - 1.0, 0.0, 1.0);
  gl_Position.y *= -1.0; // Flip Y to match Canvas coords
  
  // Size scaling - starts small, grows as it approaches
  float depthSize = 0.1 + depthPhase * 1.4;
  gl_PointSize = a_size * depthSize * (u_resolution.y / 1000.0) * 2.0;
  
  // Alpha fading - fade in from center, fade out at edges
  float depthAlpha = 1.0;
  if (depthPhase < 0.4) {
    float t = depthPhase / 0.4;
    depthAlpha = t * t; // Quadratic ease-in
  } else if (depthPhase > 0.95) {
    depthAlpha = (1.0 - depthPhase) / 0.05;
  }
  
  // Twinkle effect
  float twinkle = sin(u_time * a_twinkleSpeed + a_twinkleOffset) * 0.4 + 0.6;
  
  v_alpha = a_brightness * twinkle * depthAlpha;
  v_color = a_color;
}
`;

const FRAGMENT_SHADER = `
precision mediump float;
varying vec3 v_color;
varying float v_alpha;

void main() {
  // Soft circle for each star point
  vec2 coord = gl_PointCoord - vec2(0.5);
  float dist = length(coord);
  
  if (dist > 0.5) {
    discard;
  }
  
  // Soft glow edge
  float alpha = 1.0 - smoothstep(0.3, 0.5, dist);
  
  gl_FragColor = vec4(v_color, v_alpha * alpha);
}
`;

// ============================================================================
// CONFIGURATION
// ============================================================================

const DRIFT_SPEED = 0.05; // Speed of forward movement through space
const HIGH_DENSITY_CONFIG = {
  starDensityMultiplier: 1.2,      // Slightly reduced stars
  galaxyCountMultiplier: 2.5,      // More galaxies
  nebulaCountMultiplier: 3.0,      // More nebulas
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

    // ========================================================================
    // WEBGL SETUP (for stars - the heavy lifting)
    // ========================================================================
    const gl = canvas.getContext('webgl', {
      alpha: false,
      antialias: false,
      powerPreference: 'high-performance'
    });
    
    // 2D Canvas for galaxies, nebulas, shooting stars (few objects, complex rendering)
    const ctx2d = overlay.getContext('2d');

    if (!gl || !ctx2d) {
      console.error('WebGL or 2D context not supported');
      return;
    }

    // Log performance info once
    if (!performanceLogged) {
      console.log('🚀 StarField: WebGL renderer active');
      performanceLogged = true;
    }

    // Enable blending for transparency
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE); // Additive blending for stars

    // Compile Shaders
    const createShader = (type: number, source: string) => {
      const shader = gl.createShader(type);
      if (!shader) return null;
      gl.shaderSource(shader, source);
      gl.compileShader(shader);
      if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        console.error('Shader compile error:', gl.getShaderInfoLog(shader));
        gl.deleteShader(shader);
        return null;
      }
      return shader;
    };

    const vertexShader = createShader(gl.VERTEX_SHADER, VERTEX_SHADER);
    const fragmentShader = createShader(gl.FRAGMENT_SHADER, FRAGMENT_SHADER);
    
    if (!vertexShader || !fragmentShader) return;

    const program = gl.createProgram();
    if (!program) return;
    
    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);
    
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      console.error('Program link error:', gl.getProgramInfoLog(program));
      return;
    }

    gl.useProgram(program);

    // Attribute Locations (per-star data)
    const locAngle = gl.getAttribLocation(program, 'a_angle');
    const locPhase = gl.getAttribLocation(program, 'a_initialPhase');
    const locSize = gl.getAttribLocation(program, 'a_size');
    const locColor = gl.getAttribLocation(program, 'a_color');
    const locBrightness = gl.getAttribLocation(program, 'a_brightness');
    const locTwinkleSpeed = gl.getAttribLocation(program, 'a_twinkleSpeed');
    const locTwinkleOffset = gl.getAttribLocation(program, 'a_twinkleOffset');

    // Uniform Locations (global values)
    const locTime = gl.getUniformLocation(program, 'u_time');
    const locDrift = gl.getUniformLocation(program, 'u_driftOffset');
    const locRes = gl.getUniformLocation(program, 'u_resolution');

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
    // BUFFER INITIALIZATION
    // ========================================================================
    const initBuffers = (width: number, height: number) => {
      // Generate stars with high density (WebGL can handle it!)
      const stars = initStars(width, height, HIGH_DENSITY_CONFIG as any);

      // Flatten star data into GPU buffer
      // Format: [angle, phase, size, r, g, b, brightness, twinkleSpeed, twinkleOffset]
      const data: number[] = [];

      stars.forEach(star => {
        data.push(
          star.angle,
          star.initialPhase,
          star.size,
          star.color.r / 255,
          star.color.g / 255,
          star.color.b / 255,
          star.brightness,
          star.twinkleSpeed,
          star.twinkleOffset
        );
      });
      
      particleCount = stars.length;
      const buffer = new Float32Array(data);
      
      const glBuffer = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, glBuffer);
      gl.bufferData(gl.ARRAY_BUFFER, buffer, gl.STATIC_DRAW);
      
      const stride = 9 * 4; // 9 floats * 4 bytes
      
      gl.vertexAttribPointer(locAngle, 1, gl.FLOAT, false, stride, 0);
      gl.enableVertexAttribArray(locAngle);
      
      gl.vertexAttribPointer(locPhase, 1, gl.FLOAT, false, stride, 4);
      gl.enableVertexAttribArray(locPhase);
      
      gl.vertexAttribPointer(locSize, 1, gl.FLOAT, false, stride, 8);
      gl.enableVertexAttribArray(locSize);
      
      gl.vertexAttribPointer(locColor, 3, gl.FLOAT, false, stride, 12);
      gl.enableVertexAttribArray(locColor);
      
      gl.vertexAttribPointer(locBrightness, 1, gl.FLOAT, false, stride, 24);
      gl.enableVertexAttribArray(locBrightness);
      
      gl.vertexAttribPointer(locTwinkleSpeed, 1, gl.FLOAT, false, stride, 28);
      gl.enableVertexAttribArray(locTwinkleSpeed);
      
      gl.vertexAttribPointer(locTwinkleOffset, 1, gl.FLOAT, false, stride, 32);
      gl.enableVertexAttribArray(locTwinkleOffset);
      
      // Initialize 2D objects (galaxies, nebulas)
      galaxies = initGalaxies(width, height, HIGH_DENSITY_CONFIG as any);
      nebulas = initNebulas(width, height, HIGH_DENSITY_CONFIG as any);
      
      console.log(`🌟 Initialized ${particleCount} stars (WebGL), ${galaxies.length} galaxies, ${nebulas.length} nebulas (2D)`);
    };

    // ========================================================================
    // RESIZE HANDLER
    // ========================================================================
    const resize = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      overlay.width = width * dpr;
      overlay.height = height * dpr;
      
      gl.viewport(0, 0, canvas.width, canvas.height);
      gl.uniform2f(locRes, canvas.width, canvas.height);
      
      initBuffers(canvas.width, canvas.height);
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

      // Update drift (continuous forward movement)
      driftOffset += DRIFT_SPEED * deltaTime;
      if (driftOffset > 100) driftOffset -= 100;

      // ======================================================================
      // WEBGL: Draw Stars
      // ======================================================================
      gl.uniform1f(locTime, time);
      gl.uniform1f(locDrift, driftOffset);
      
      // Clear with dark background
      gl.clearColor(0.02, 0.02, 0.04, 1.0);
      gl.clear(gl.COLOR_BUFFER_BIT);
      
      // Draw all stars in one call
      gl.drawArrays(gl.POINTS, 0, particleCount);
      
      // ======================================================================
      // 2D CANVAS: Draw Galaxies, Nebulas, Shooting Stars, FPS
      // ======================================================================
      ctx2d.clearRect(0, 0, overlay.width, overlay.height);
      
      // Draw nebulas (behind galaxies)
      drawNebulas(ctx2d, nebulas, 0, 0, overlay.width, overlay.height, driftOffset, 1);
      
      // Draw galaxies
      drawGalaxies(ctx2d, galaxies, 0, 0, overlay.width, overlay.height, driftOffset, 1);
      
      // Shooting stars
      if (time >= nextShootingStarTime && shootingStars.length < HIGH_DENSITY_CONFIG.maxShootingStars) {
        shootingStars.push(createShootingStar(overlay.width, overlay.height));
        nextShootingStarTime = time + getNextShootingStarDelay();
      }
      shootingStars = drawShootingStars(ctx2d, shootingStars, 0, 0, overlay.width, overlay.height);

      // FPS Counter (Fraps style)
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
    // INITIALIZATION
    // ========================================================================
    window.addEventListener('resize', resize);
    resize();
    animationFrameId = requestAnimationFrame(render);

    // ========================================================================
    // CLEANUP
    // ========================================================================
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
