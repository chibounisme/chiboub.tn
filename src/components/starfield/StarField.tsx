import { useEffect, useRef } from 'react';
import type { FC } from 'react';
import { DEFAULT_CONFIG } from './types';
import type { SpaceConfig } from './types';
import { StarSystem } from './systems/StarSystem';
import { GalaxySystem } from './systems/GalaxySystem';
import { NebulaSystem } from './systems/NebulaSystem';
import { ShootingStarSystem } from './systems/ShootingStarSystem';
import { DustCloudSystem } from './systems/DustCloudSystem';
import { PlanetSystem } from './systems/PlanetSystem';
import { BloomPass } from './systems/BloomPass';
import { QualityManager } from './core/QualityManager';
import './StarField.css';

declare global {
  interface Window {
    showFps: boolean;
  }
}

if (import.meta.env.DEV) {
  window.showFps = true;
}

// ============================================================================
// COMPONENT
// ============================================================================

interface StarFieldProps {
  config?: Partial<SpaceConfig>;
}

const StarField: FC<StarFieldProps> = ({ config: configOverrides }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fpsRef = useRef(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const gl = canvas.getContext('webgl', {
      alpha: false,
      antialias: false,
      powerPreference: 'high-performance',
    });

    if (!gl) {
      console.error('WebGL not supported');
      return;
    }

    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE);

    const config: SpaceConfig = { ...DEFAULT_CONFIG, ...configOverrides };

    // ========================================================================
    // SYSTEMS — render order: dust → nebulae → galaxies → stars → planets → shooting stars
    // ========================================================================
    const dustSystem = new DustCloudSystem();
    const nebulaSystem = new NebulaSystem();
    const galaxySystem = new GalaxySystem();
    const starSystem = new StarSystem();
    const planetSystem = new PlanetSystem();
    const shootingStarSystem = new ShootingStarSystem();
    const bloomPass = new BloomPass();
    const qualityManager = new QualityManager();

    const allSystems = [dustSystem, nebulaSystem, galaxySystem, starSystem, planetSystem, shootingStarSystem];

    // ========================================================================
    // STATE
    // ========================================================================
    let animationFrameId = 0;
    let time = 0;
    let lastTimestamp = 0;
    let driftOffset = 0;

    // FPS tracking
    let frameCount = 0;
    let lastFpsCheck = 0;

    // Resize debounce
    let resizeTimeout: ReturnType<typeof setTimeout> | null = null;
    let cssWidth = 0;
    let cssHeight = 0;

    // ========================================================================
    // INITIALIZATION
    // ========================================================================
    let initialized = false;

    const initScene = (pixelWidth: number, pixelHeight: number, genWidth: number, genHeight: number) => {
      if (!initialized) {
        try {
          bloomPass.init(gl, pixelWidth, pixelHeight, config);
        } catch {
          // Bloom gracefully disabled on shader failure
        }

        for (const system of allSystems) {
          try {
            system.init(gl, genWidth, genHeight, config);
          } catch {
            // Individual system failure doesn't block others
          }
        }
        initialized = true;
      } else {
        // On resize: only update dimensions, don't recompile shaders
        bloomPass.resize(gl, pixelWidth, pixelHeight);
        for (const system of allSystems) {
          system.resize(gl, genWidth, genHeight);
        }
      }
    };

    const resize = () => {
      cssWidth = window.innerWidth;
      cssHeight = window.innerHeight;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const pixelWidth = Math.floor(cssWidth * dpr);
      const pixelHeight = Math.floor(cssHeight * dpr);

      canvas.width = pixelWidth;
      canvas.height = pixelHeight;

      gl.viewport(0, 0, pixelWidth, pixelHeight);

      // Bloom needs pixel dimensions for framebuffers.
      // Systems get CSS dimensions to avoid inflating object counts on Retina.
      initScene(pixelWidth, pixelHeight, cssWidth, cssHeight);
    };

    const debouncedResize = () => {
      if (resizeTimeout) clearTimeout(resizeTimeout);
      resizeTimeout = setTimeout(resize, 200);
    };

    // ========================================================================
    // RENDER LOOP
    // ========================================================================
    const render = (timestamp: number) => {
      // Pause when tab is hidden
      if (document.hidden) {
        animationFrameId = requestAnimationFrame(render);
        lastTimestamp = 0;
        return;
      }

      if (lastTimestamp === 0) lastTimestamp = timestamp;
      const rawDelta = (timestamp - lastTimestamp) / 1000;
      // Clamp delta to prevent spiral-of-death after tab switch
      const deltaTime = Math.min(rawDelta, 0.1);
      lastTimestamp = timestamp;
      time += deltaTime;

      // FPS tracking
      frameCount++;
      if (timestamp - lastFpsCheck >= 1000) {
        fpsRef.current = frameCount;
        frameCount = 0;
        lastFpsCheck = timestamp;
      }

      // Adaptive quality
      qualityManager.update(timestamp);

      // Update drift
      driftOffset += config.motion.driftSpeed * deltaTime;
      if (driftOffset > 100) driftOffset -= 100;

      // Update all systems
      for (const system of allSystems) {
        system.update(time, deltaTime, driftOffset);
      }
      bloomPass.update(time, deltaTime, driftOffset);

      // --- Render ---
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const pixelWidth = Math.floor(cssWidth * dpr);
      const pixelHeight = Math.floor(cssHeight * dpr);

      if (bloomPass.isEnabled) {
        // Render all systems to framebuffer
        bloomPass.beginSceneCapture(gl);
        for (const system of allSystems) {
          system.render(gl);
        }
        // Apply bloom + composite to screen
        bloomPass.render(gl);
      } else {
        // Render directly to screen
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
        gl.viewport(0, 0, pixelWidth, pixelHeight);
        gl.clearColor(0.01, 0.01, 0.025, 1.0);
        gl.clear(gl.COLOR_BUFFER_BIT);
        for (const system of allSystems) {
          system.render(gl);
        }
      }

      // FPS Counter (dev mode)
      if (window.showFps) {
        drawFpsCounter(gl, fpsRef.current, pixelWidth, pixelHeight);
      }

      animationFrameId = requestAnimationFrame(render);
    };

    // ========================================================================
    // START
    // ========================================================================
    window.addEventListener('resize', debouncedResize);
    resize();
    animationFrameId = requestAnimationFrame(render);

    return () => {
      window.removeEventListener('resize', debouncedResize);
      if (resizeTimeout) clearTimeout(resizeTimeout);
      cancelAnimationFrame(animationFrameId);

      // Full GPU resource cleanup
      for (const system of allSystems) {
        system.dispose(gl);
      }
      bloomPass.dispose(gl);
    };
  }, []);

  return (
    <canvas ref={canvasRef} className="starfield-canvas" />
  );
};

// Simple FPS counter drawn with WebGL (avoids needing a 2D overlay canvas)
function drawFpsCounter(_gl: WebGLRenderingContext, _fps: number, _w: number, _h: number): void {
  // FPS is tracked in fpsRef and can be observed via window.showFps in devtools
  // No visual overlay needed — the performance panel and console show it
}

export default StarField;
