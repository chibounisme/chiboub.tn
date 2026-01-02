/**
 * Performance detection and adaptive density control
 * Detects hardware capabilities and adjusts rendering density accordingly
 */

export type PerformanceTier = 'low' | 'medium' | 'high';

export interface PerformanceConfig {
  tier: PerformanceTier;
  starDensityMultiplier: number;
  galaxyCountMultiplier: number;
  nebulaCountMultiplier: number;
  clusterCountMultiplier: number;
  maxShootingStars: number;
}

/**
 * Detect hardware capabilities and return performance tier
 */
export const detectPerformanceTier = (): PerformanceTier => {
  // Check if we're on mobile/tablet
  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  if (isMobile) return 'low';

  // Check for hardware concurrency (CPU cores)
  const cores = navigator.hardwareConcurrency || 2;
  
  // Check device memory if available (in GB)
  const memory = (navigator as any).deviceMemory || 4;
  
  // Check screen size - smaller screens = less work needed
  const screenArea = window.screen.width * window.screen.height;
  const isSmallScreen = screenArea < 1920 * 1080;
  
  // Try to detect GPU capabilities via WebGL
  let gpuTier: 'low' | 'medium' | 'high' = 'medium';
  try {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl') as WebGLRenderingContext | null;
    if (gl) {
      const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
      if (debugInfo) {
        const renderer = gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL).toLowerCase();
        
        // High-end GPUs
        if (renderer.includes('nvidia') || renderer.includes('amd') || renderer.includes('radeon')) {
          if (renderer.includes('rtx') || renderer.includes('rx 6') || renderer.includes('rx 7')) {
            gpuTier = 'high';
          } else if (renderer.includes('gtx') || renderer.includes('rx 5')) {
            gpuTier = 'medium';
          }
        }
        // Integrated graphics
        if (renderer.includes('intel') || renderer.includes('integrated')) {
          gpuTier = 'low';
        }
      }
    }
  } catch (e) {
    // Fallback to medium if detection fails
    gpuTier = 'medium';
  }
  
  // Calculate score based on multiple factors
  let score = 0;
  
  // CPU cores (0-3 points)
  if (cores >= 8) score += 3;
  else if (cores >= 4) score += 2;
  else score += 1;
  
  // Memory (0-3 points)
  if (memory >= 8) score += 3;
  else if (memory >= 4) score += 2;
  else score += 1;
  
  // GPU (0-3 points)
  if (gpuTier === 'high') score += 3;
  else if (gpuTier === 'medium') score += 2;
  else score += 1;
  
  // Screen size penalty
  if (isSmallScreen) score -= 1;
  
  // Determine tier (max score = 9)
  if (score >= 7) return 'high';
  if (score >= 4) return 'medium';
  return 'low';
};

/**
 * Get performance-based configuration for rendering
 * Default is reduced density compared to original
 */
export const getPerformanceConfig = (tier?: PerformanceTier): PerformanceConfig => {
  const detectedTier = tier || detectPerformanceTier();
  
  switch (detectedTier) {
    case 'low':
      return {
        tier: 'low',
        starDensityMultiplier: 0.5,      // 50% of base density
        galaxyCountMultiplier: 0.25,     // 25% of base count
        nebulaCountMultiplier: 0.4,      // 40% of base count
        clusterCountMultiplier: 0.3,     // 30% of base count
        maxShootingStars: 2,             // Max 2 shooting stars
      };
    
    case 'medium':
      return {
        tier: 'medium',
        starDensityMultiplier: 1.0,      // 100% of base density
        galaxyCountMultiplier: 0.5,      // 50% of base count
        nebulaCountMultiplier: 0.6,      // 60% of base count
        clusterCountMultiplier: 0.5,     // 50% of base count
        maxShootingStars: 3,             // Max 3 shooting stars
      };
    
    case 'high':
      return {
        tier: 'high',
        starDensityMultiplier: 2.0,      // 200% of base density
        galaxyCountMultiplier: 1.2,      // 120% of base count
        nebulaCountMultiplier: 1.3,      // 130% of base count
        clusterCountMultiplier: 1.1,     // 110% of base count
        maxShootingStars: 8,             // Max 8 shooting stars
      };
  }
};

/**
 * Log detected performance tier for debugging
 */
export const logPerformanceInfo = (): void => {
  const tier = detectPerformanceTier();
  const config = getPerformanceConfig(tier);
  
  console.log('🎨 StarField Performance Detection:', {
    tier,
    cores: navigator.hardwareConcurrency || 'unknown',
    memory: `${(navigator as any).deviceMemory || 'unknown'} GB`,
    screen: `${window.screen.width}x${window.screen.height}`,
    config,
  });
};
