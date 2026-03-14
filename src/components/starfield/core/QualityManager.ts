/**
 * QualityManager — Adaptive quality that monitors FPS and adjusts rendering load.
 * Ensures smooth 60fps across all devices by dynamically scaling detail levels.
 */

export type QualityLevel = 'ultra' | 'high' | 'medium' | 'low';

export interface QualityMultipliers {
  starDensity: number;
  galaxyDetail: number;
  nebulaDetail: number;
  enableBloom: boolean;
  dustCloudCount: number;
  planetDetail: number;
}

const QUALITY_PRESETS: Record<QualityLevel, QualityMultipliers> = {
  ultra: {
    starDensity: 1.0,
    galaxyDetail: 1.0,
    nebulaDetail: 1.0,
    enableBloom: true,
    dustCloudCount: 1.0,
    planetDetail: 1.0,
  },
  high: {
    starDensity: 0.7,
    galaxyDetail: 0.8,
    nebulaDetail: 0.8,
    enableBloom: true,
    dustCloudCount: 0.7,
    planetDetail: 0.8,
  },
  medium: {
    starDensity: 0.5,
    galaxyDetail: 0.5,
    nebulaDetail: 0.5,
    enableBloom: false,
    dustCloudCount: 0.5,
    planetDetail: 0.5,
  },
  low: {
    starDensity: 0.3,
    galaxyDetail: 0.3,
    nebulaDetail: 0.3,
    enableBloom: false,
    dustCloudCount: 0.3,
    planetDetail: 0.3,
  },
};

export class QualityManager {
  private level: QualityLevel = 'ultra';
  private fpsSamples: number[] = [];
  private sampleWindow = 2000; // 2 seconds
  private lastSampleTime = 0;
  private frameCount = 0;
  private stableHighTime = 0;
  private onQualityChange?: (level: QualityLevel, multipliers: QualityMultipliers) => void;

  get currentLevel(): QualityLevel {
    return this.level;
  }

  get multipliers(): QualityMultipliers {
    return QUALITY_PRESETS[this.level];
  }

  setCallback(cb: (level: QualityLevel, multipliers: QualityMultipliers) => void): void {
    this.onQualityChange = cb;
  }

  update(timestamp: number): void {
    this.frameCount++;

    if (this.lastSampleTime === 0) {
      this.lastSampleTime = timestamp;
      return;
    }

    const elapsed = timestamp - this.lastSampleTime;
    if (elapsed >= this.sampleWindow) {
      const fps = (this.frameCount / elapsed) * 1000;
      this.fpsSamples.push(fps);
      if (this.fpsSamples.length > 5) this.fpsSamples.shift();

      const avgFps = this.fpsSamples.reduce((a, b) => a + b, 0) / this.fpsSamples.length;

      if (avgFps < 40) {
        this.downgrade();
        this.stableHighTime = 0;
      } else if (avgFps > 55) {
        this.stableHighTime += elapsed;
        if (this.stableHighTime > 3000) {
          this.upgrade();
          this.stableHighTime = 0;
        }
      } else {
        this.stableHighTime = 0;
      }

      this.frameCount = 0;
      this.lastSampleTime = timestamp;
    }
  }

  private downgrade(): void {
    const levels: QualityLevel[] = ['ultra', 'high', 'medium', 'low'];
    const idx = levels.indexOf(this.level);
    if (idx < levels.length - 1) {
      this.level = levels[idx + 1];
      this.onQualityChange?.(this.level, this.multipliers);
    }
  }

  private upgrade(): void {
    const levels: QualityLevel[] = ['ultra', 'high', 'medium', 'low'];
    const idx = levels.indexOf(this.level);
    if (idx > 0) {
      this.level = levels[idx - 1];
      this.onQualityChange?.(this.level, this.multipliers);
    }
  }
}
