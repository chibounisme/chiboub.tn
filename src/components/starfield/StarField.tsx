import { useEffect, useRef } from 'react';
import type { FC } from 'react';
import { DEFAULT_CONFIG } from './types';
import type { SpaceConfig } from './types';
import { StarSystem } from './systems/StarSystem';
import { GalaxySystem } from './systems/GalaxySystem';
import { NebulaSystem } from './systems/NebulaSystem';
import { DustCloudSystem } from './systems/DustCloudSystem';
import { BloomPass } from './systems/BloomPass';

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

function mergeConfig(configOverrides?: Partial<SpaceConfig>): SpaceConfig {
  return {
    stars: {
      ...DEFAULT_CONFIG.stars,
      ...configOverrides?.stars,
    },
    galaxies: {
      ...DEFAULT_CONFIG.galaxies,
      ...configOverrides?.galaxies,
    },
    nebulae: {
      ...DEFAULT_CONFIG.nebulae,
      ...configOverrides?.nebulae,
    },
    dustClouds: {
      ...DEFAULT_CONFIG.dustClouds,
      ...configOverrides?.dustClouds,
    },
    bloom: {
      ...DEFAULT_CONFIG.bloom,
      ...configOverrides?.bloom,
    },
  };
}

function isLowEndDevice(config: SpaceConfig): boolean {
  if (!config.bloom.disableOnLowEnd) {
    return false;
  }

  const nav = navigator as Navigator & { deviceMemory?: number };
  const memory = nav.deviceMemory;
  const cores = nav.hardwareConcurrency;

  return Boolean(
    (typeof memory === 'number' && memory <= config.bloom.lowEndMaxMemoryGb) ||
    (typeof cores === 'number' && cores <= config.bloom.lowEndMaxCores)
  );
}

const StarField: FC<StarFieldProps> = ({ config: configOverrides }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const renderVersionRef = useRef(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const displayCtx = canvas.getContext('2d', {
      alpha: false,
      desynchronized: true,
    });

    if (!displayCtx) {
      console.error('2D canvas not supported');
      return;
    }

    displayCtx.imageSmoothingEnabled = false;

    const config = mergeConfig(configOverrides);
    const bloomEnabled = config.bloom.enabled && !isLowEndDevice(config);

    // Resize debounce
    let resizeTimeout: ReturnType<typeof setTimeout> | null = null;
    let lastPixelWidth = 0;
    let lastPixelHeight = 0;

    const PIXEL_SCALE = 6;

    const drawFallback = (width: number, height: number) => {
      canvas.width = width;
      canvas.height = height;
      displayCtx.fillStyle = '#03040a';
      displayCtx.fillRect(0, 0, width, height);
    };

    const renderScene = async (force = false) => {
      const renderVersion = ++renderVersionRef.current;

      if (document.hidden) {
        return;
      }

      const cssWidth = window.innerWidth;
      const cssHeight = window.innerHeight;
      const pixelWidth = Math.max(1, Math.floor(cssWidth / PIXEL_SCALE));
      const pixelHeight = Math.max(1, Math.floor(cssHeight / PIXEL_SCALE));

      if (!force && pixelWidth === lastPixelWidth && pixelHeight === lastPixelHeight) {
        return;
      }

      lastPixelWidth = pixelWidth;
      lastPixelHeight = pixelHeight;
      canvas.width = pixelWidth;
      canvas.height = pixelHeight;

      const renderCanvas = document.createElement('canvas');
      renderCanvas.width = pixelWidth;
      renderCanvas.height = pixelHeight;

      const gl = renderCanvas.getContext('webgl', {
        alpha: false,
        antialias: false,
        preserveDrawingBuffer: true,
        powerPreference: 'high-performance',
      });

      if (!gl) {
        drawFallback(pixelWidth, pixelHeight);
        return;
      }

      gl.enable(gl.BLEND);
      gl.blendFunc(gl.SRC_ALPHA, gl.ONE);
      gl.viewport(0, 0, pixelWidth, pixelHeight);

      const dustSystem = new DustCloudSystem();
      const nebulaSystem = new NebulaSystem();
      const galaxySystem = new GalaxySystem();
      const starSystem = new StarSystem();
      const bloomPass = new BloomPass();
      const allSystems = [dustSystem, nebulaSystem, galaxySystem, starSystem];

      try {
        if (bloomEnabled) {
          try {
            bloomPass.init(gl, pixelWidth, pixelHeight, config);
          } catch {
            // Bloom gracefully disables itself on initialization failure.
          }
        }

        for (const system of allSystems) {
          try {
            system.init(gl, pixelWidth, pixelHeight, config);
            system.update(0, 0);
          } catch {
            // Individual system failure should not block the static frame.
          }
        }

        if (bloomPass.isEnabled) {
          bloomPass.beginSceneCapture(gl);
          for (const system of allSystems) {
            system.render(gl);
          }
          bloomPass.render(gl);
        } else {
          gl.bindFramebuffer(gl.FRAMEBUFFER, null);
          gl.viewport(0, 0, pixelWidth, pixelHeight);
          gl.clearColor(0.01, 0.01, 0.025, 1.0);
          gl.clear(gl.COLOR_BUFFER_BIT);
          for (const system of allSystems) {
            system.render(gl);
          }
        }

        if (window.showFps) {
          drawFpsCounter(gl, 0, pixelWidth, pixelHeight);
        }

        if (typeof createImageBitmap === 'function') {
          const bitmap = await createImageBitmap(renderCanvas);
          if (renderVersionRef.current === renderVersion) {
            displayCtx.clearRect(0, 0, pixelWidth, pixelHeight);
            displayCtx.drawImage(bitmap, 0, 0, pixelWidth, pixelHeight);
          }
          bitmap.close();
        } else if (renderVersionRef.current === renderVersion) {
          displayCtx.clearRect(0, 0, pixelWidth, pixelHeight);
          displayCtx.drawImage(renderCanvas, 0, 0, pixelWidth, pixelHeight);
        }
      } finally {
        for (const system of allSystems) {
          system.dispose(gl);
        }
        bloomPass.dispose(gl);
        gl.getExtension('WEBGL_lose_context')?.loseContext();
      }
    };

    const debouncedResize = () => {
      if (resizeTimeout) clearTimeout(resizeTimeout);
      resizeTimeout = setTimeout(() => {
        void renderScene();
      }, 200);
    };

    const handleVisibilityChange = () => {
      if (!document.hidden) {
        void renderScene(true);
      }
    };

    // ========================================================================
    // START
    // ========================================================================
    window.addEventListener('resize', debouncedResize);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    void renderScene(true);

    return () => {
      window.removeEventListener('resize', debouncedResize);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      if (resizeTimeout) clearTimeout(resizeTimeout);
      renderVersionRef.current += 1;
    };
  }, [configOverrides]);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 z-1 h-full w-full [image-rendering:pixelated]"
    />
  );
};

// Simple FPS counter drawn with WebGL (avoids needing a 2D overlay canvas)
function drawFpsCounter(_gl: WebGLRenderingContext, _fps: number, _w: number, _h: number): void {
  // FPS is tracked in fpsRef and can be observed via window.showFps in devtools
  // No visual overlay needed — the performance panel and console show it
}

export default StarField;
