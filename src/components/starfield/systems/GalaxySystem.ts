/**
 * GalaxySystem — GPU-rendered galaxies using WebGL point sprites.
 * All galaxy arm/star points are packed into a single VBO with per-galaxy motion.
 * Core glows are rendered as separate large point sprites.
 */

import type { RenderSystem, SpaceConfig, GalaxyType, Color } from '../types';
import { GALAXY_TYPES, GALAXY_COLOR_PALETTES } from '../constants';

// ============================================================================
// Shaders — Galaxy points rendered as colored circles with depth-phase motion
// ============================================================================

const VERTEX_SHADER = `
attribute vec2 a_position;    // x,y relative to galaxy center (in pixels)
attribute float a_angle;      // galaxy travel angle from screen center
attribute float a_phase;      // galaxy initial depth phase
attribute float a_speed;      // galaxy travel speed
attribute float a_size;       // point size
attribute vec3 a_color;       // point color
attribute float a_alpha;      // base alpha
attribute float a_rotation;   // galaxy rotation angle
attribute float a_inclination;

uniform float u_driftOffset;
uniform vec2 u_resolution;
uniform float u_warpExponent;

varying vec3 v_color;
varying float v_alpha;

void main() {
  float maxDist = length(u_resolution * 0.5);
  float depthPhase = mod(a_phase + u_driftOffset * a_speed, 1.0);

  float warpedPhase = pow(depthPhase, u_warpExponent);
  float travelDist = maxDist * warpedPhase;

  vec2 center = u_resolution * 0.5;
  vec2 galaxyCenter = center + vec2(cos(a_angle), sin(a_angle)) * travelDist;

  // Rotate and incline the point relative to galaxy center
  float cs = cos(a_rotation);
  float sn = sin(a_rotation);
  vec2 rotated = vec2(
    a_position.x * cs - a_position.y * sn,
    (a_position.x * sn + a_position.y * cs) * (1.0 - a_inclination * 0.85)
  );

  // Scale with depth
  float depthSize = 0.1 + depthPhase * 1.4;
  // Scale sub-point offsets uniformly with depth so they don't form cones
  float offsetScale = max(0.2, depthSize);
  vec2 pos = galaxyCenter + rotated * offsetScale;

  gl_Position = vec4((pos / u_resolution) * 2.0 - 1.0, 0.0, 1.0);
  gl_Position.y *= -1.0;

  gl_PointSize = max(1.0, a_size * depthSize * (u_resolution.y / 1000.0));

  // Alpha: fade in/out with depth
  float depthAlpha = 1.0;
  if (depthPhase < 0.4) {
    float t = depthPhase / 0.4;
    depthAlpha = t * t;
  } else if (depthPhase > 0.95) {
    depthAlpha = (1.0 - depthPhase) / 0.05;
  }

  v_alpha = a_alpha * depthAlpha;
  v_color = a_color;
}
`;

const FRAGMENT_SHADER = `
precision mediump float;
varying vec3 v_color;
varying float v_alpha;

void main() {
  vec2 coord = gl_PointCoord - vec2(0.5);
  float dist = length(coord);
  if (dist > 0.5) discard;

  float alpha = 1.0 - smoothstep(0.15, 0.5, dist);
  gl_FragColor = vec4(v_color, v_alpha * alpha);
}
`;

// ============================================================================
// Galaxy Generation — produces flat point arrays for GPU upload
// ============================================================================

interface GalaxyPoint {
  px: number;  // position relative to galaxy center
  py: number;
  angle: number;  // galaxy travel angle
  phase: number;  // galaxy depth phase
  speed: number;
  size: number;
  r: number;
  g: number;
  b: number;
  alpha: number;
  rotation: number;
  inclination: number;
}

function varyColor(base: Color, variance: number): Color {
  return {
    r: Math.min(255, Math.max(0, base.r + Math.floor((Math.random() - 0.5) * variance))),
    g: Math.min(255, Math.max(0, base.g + Math.floor((Math.random() - 0.5) * variance))),
    b: Math.min(255, Math.max(0, base.b + Math.floor((Math.random() - 0.5) * variance))),
  };
}

function getRandomGalaxyPalette(): [Color, Color, Color] {
  const keys = Object.keys(GALAXY_COLOR_PALETTES);
  const palette = GALAXY_COLOR_PALETTES[keys[Math.floor(Math.random() * keys.length)]];
  return [varyColor(palette[0], 20), varyColor(palette[1], 30), varyColor(palette[2], 40)];
}

function generateGalaxyPoints(width: number, height: number, config: SpaceConfig): GalaxyPoint[] {
  const points: GalaxyPoint[] = [];
  const screenArea = width * height;
  const referenceArea = 1920 * 1080;
  const scaleFactor = Math.min(1.5, Math.max(0.3, screenArea / referenceArea));
  const mult = config.galaxies.countMultiplier;

  const minG = Math.floor(config.galaxies.min * scaleFactor * mult);
  const maxG = Math.floor(config.galaxies.max * scaleFactor * mult);
  const numGalaxies = minG + Math.floor(Math.random() * (maxG - minG + 1));

  for (let i = 0; i < numGalaxies; i++) {
    const [coreColor, armColor, outerColor] = getRandomGalaxyPalette();
    const galaxyType = GALAXY_TYPES[Math.floor(Math.random() * GALAXY_TYPES.length)] as GalaxyType;

    const distanceFactor = Math.random();
    let galaxySize: number;
    if (distanceFactor < 0.35) galaxySize = 3 + Math.random() * 8;
    else if (distanceFactor < 0.55) galaxySize = 10 + Math.random() * 15;
    else if (distanceFactor < 0.75) galaxySize = 25 + Math.random() * 30;
    else if (distanceFactor < 0.9) galaxySize = 55 + Math.random() * 40;
    else galaxySize = 95 + Math.random() * 55;

    const inclination = Math.random() * 0.85;
    const rotation = Math.random() * Math.PI * 2;
    const brightness = 0.02 + Math.random() * 0.06;

    // Stable travel angle and phase
    const travelAngle = Math.random() * Math.PI * 2;
    const initialPhase = Math.random();
    const speed = 0.1;

    const coreSize = galaxyType === 'elliptical' ? 0.3 + Math.random() * 0.6 : 0.05 + Math.random() * 0.3;
    const coreRadius = galaxySize * coreSize;

    // Core glow point (large, faint, centered)
    points.push({
      px: 0, py: 0,
      angle: travelAngle, phase: initialPhase, speed,
      size: coreRadius * 3,
      r: coreColor.r / 255, g: coreColor.g / 255, b: coreColor.b / 255,
      alpha: brightness * 0.4,
      rotation, inclination,
    });

    if (galaxyType === 'spiral' || galaxyType === 'barred-spiral') {
      const numArms = galaxyType === 'barred-spiral' ? 2 : (Math.random() < 0.3 ? 2 : 2 + Math.floor(Math.random() * 6));
      const armTightness = galaxyType === 'barred-spiral' ? 0.5 + Math.random() * 1.0 : 0.4 + Math.random() * 2.5;
      const armSpread = 0.1 + Math.random() * 0.8;
      const numPointsPerArm = Math.floor(15 + Math.random() * 20 + galaxySize / 5);

      for (let arm = 0; arm < numArms; arm++) {
        const armRotation = galaxyType === 'barred-spiral'
          ? (arm === 0 ? 0 : Math.PI)
          : (arm / numArms) * Math.PI * 2;

        for (let p = 0; p < numPointsPerArm; p++) {
          const t = p / numPointsPerArm;
          const spiralAngle = armRotation + t * Math.PI * armTightness;
          const sizeScale = galaxySize / 50;

          let distance: number;
          if (galaxyType === 'barred-spiral') {
            const barLength = galaxySize * 0.35;
            distance = barLength * 0.8 + t * (galaxySize - barLength);
          } else {
            distance = coreRadius * 0.5 + t * (galaxySize - coreRadius * 0.5);
          }

          const offset = (Math.random() - 0.5) * 6 * t * sizeScale;
          const perpAngle = spiralAngle + Math.PI / 2;
          const baseX = Math.cos(spiralAngle) * distance;
          const baseY = Math.sin(spiralAngle) * distance * armSpread;
          const px = baseX + Math.cos(perpAngle) * offset;
          const py = baseY + Math.sin(perpAngle) * offset * armSpread;

          const colorBlend = t;
          const r = (armColor.r * (1 - colorBlend) + outerColor.r * colorBlend) / 255;
          const g = (armColor.g * (1 - colorBlend) + outerColor.g * colorBlend) / 255;
          const b = (armColor.b * (1 - colorBlend) + outerColor.b * colorBlend) / 255;

          const dotSize = Math.max(0.3, (1 - t) * (1.5 + Math.random() * 1.5) * sizeScale);
          const pointAlpha = brightness * (1 - t * 0.6) * 0.6;

          points.push({
            px, py,
            angle: travelAngle, phase: initialPhase, speed,
            size: dotSize * 2,
            r, g, b,
            alpha: pointAlpha,
            rotation, inclination,
          });
        }
      }
    } else {
      // Elliptical, irregular, lenticular — scatter star points
      const numStars = Math.floor(20 + Math.random() * 40 * (galaxySize / 30));

      const centers: { x: number; y: number }[] = [];
      if (galaxyType === 'irregular') {
        const numCenters = 2 + Math.floor(Math.random() * 3);
        for (let c = 0; c < numCenters; c++) {
          centers.push({ x: (Math.random() - 0.5) * 1.5, y: (Math.random() - 0.5) * 1.5 });
        }
      }

      for (let s = 0; s < numStars; s++) {
        let sx: number, sy: number;
        if (galaxyType === 'irregular') {
          const center = centers[Math.floor(Math.random() * centers.length)];
          const r = Math.random() * 0.6;
          const a = Math.random() * Math.PI * 2;
          sx = center.x + Math.cos(a) * r;
          sy = center.y + Math.sin(a) * r;
        } else {
          const r = Math.random() * Math.random();
          const a = Math.random() * Math.PI * 2;
          sx = Math.cos(a) * r;
          sy = Math.sin(a) * r;
        }

        const starSize = Math.max(0.2, (0.3 + Math.random() * 0.8) * (galaxySize / 40));
        const starBrightness = 0.3 + Math.random() * 0.7;
        const distFromCenter = Math.sqrt(sx * sx + sy * sy);
        const starAlpha = brightness * starBrightness * Math.max(0, 1 - distFromCenter * 0.8);

        points.push({
          px: sx * galaxySize, py: sy * galaxySize,
          angle: travelAngle, phase: initialPhase, speed,
          size: starSize * 3,
          r: coreColor.r / 255, g: coreColor.g / 255, b: coreColor.b / 255,
          alpha: starAlpha,
          rotation, inclination,
        });
      }
    }
  }

  return points;
}

// ============================================================================
// System
// ============================================================================

export class GalaxySystem implements RenderSystem {
  private program: WebGLProgram | null = null;
  private buffer: WebGLBuffer | null = null;
  private pointCount = 0;
  private uniforms: {
    driftOffset: WebGLUniformLocation | null;
    resolution: WebGLUniformLocation | null;
    warpExponent: WebGLUniformLocation | null;
  } = { driftOffset: null, resolution: null, warpExponent: null };
  private driftOffset = 0;
  private width = 0;
  private height = 0;
  private warpExponent = 1.5;
  private config: SpaceConfig | null = null;

  init(gl: WebGLRenderingContext, width: number, height: number, config: SpaceConfig): void {
    this.width = width;
    this.height = height;
    this.warpExponent = config.motion.warpExponent;
    this.config = config;

    const vs = compileShader(gl, gl.VERTEX_SHADER, VERTEX_SHADER);
    const fs = compileShader(gl, gl.FRAGMENT_SHADER, FRAGMENT_SHADER);
    if (!vs || !fs) return;

    this.program = gl.createProgram()!;
    gl.attachShader(this.program, vs);
    gl.attachShader(this.program, fs);
    gl.linkProgram(this.program);

    if (!gl.getProgramParameter(this.program, gl.LINK_STATUS)) {
      console.error('GalaxySystem program link error');
      return;
    }

    this.uniforms = {
      driftOffset: gl.getUniformLocation(this.program, 'u_driftOffset'),
      resolution: gl.getUniformLocation(this.program, 'u_resolution'),
      warpExponent: gl.getUniformLocation(this.program, 'u_warpExponent'),
    };

    this.buildBuffer(gl, width, height, config);
  }

  private buildBuffer(gl: WebGLRenderingContext, width: number, height: number, config: SpaceConfig): void {
    const galaxyPoints = generateGalaxyPoints(width, height, config);
    this.pointCount = galaxyPoints.length;

    // 12 floats per point: px, py, angle, phase, speed, size, r, g, b, alpha, rotation, inclination
    const data = new Float32Array(galaxyPoints.length * 12);
    for (let i = 0; i < galaxyPoints.length; i++) {
      const p = galaxyPoints[i];
      const off = i * 12;
      data[off] = p.px;
      data[off + 1] = p.py;
      data[off + 2] = p.angle;
      data[off + 3] = p.phase;
      data[off + 4] = p.speed;
      data[off + 5] = p.size;
      data[off + 6] = p.r;
      data[off + 7] = p.g;
      data[off + 8] = p.b;
      data[off + 9] = p.alpha;
      data[off + 10] = p.rotation;
      data[off + 11] = p.inclination;
    }

    if (this.buffer) gl.deleteBuffer(this.buffer);
    this.buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, this.buffer);
    gl.bufferData(gl.ARRAY_BUFFER, data, gl.STATIC_DRAW);
  }

  resize(gl: WebGLRenderingContext, width: number, height: number): void {
    this.width = width;
    this.height = height;
    if (this.config) this.buildBuffer(gl, width, height, this.config);
  }

  update(_time: number, _deltaTime: number, driftOffset: number): void {
    this.driftOffset = driftOffset;
  }

  render(gl: WebGLRenderingContext): void {
    if (!this.program || !this.buffer || this.pointCount === 0) return;

    gl.useProgram(this.program);
    gl.bindBuffer(gl.ARRAY_BUFFER, this.buffer);

    const stride = 12 * 4;
    const attrs: [string, number, number][] = [
      ['a_position', 2, 0],
      ['a_angle', 1, 8],
      ['a_phase', 1, 12],
      ['a_speed', 1, 16],
      ['a_size', 1, 20],
      ['a_color', 3, 24],
      ['a_alpha', 1, 36],
      ['a_rotation', 1, 40],
      ['a_inclination', 1, 44],
    ];

    for (const [name, size, offset] of attrs) {
      const loc = gl.getAttribLocation(this.program, name);
      if (loc >= 0) {
        gl.vertexAttribPointer(loc, size, gl.FLOAT, false, stride, offset);
        gl.enableVertexAttribArray(loc);
      }
    }

    gl.uniform1f(this.uniforms.driftOffset, this.driftOffset);
    gl.uniform2f(this.uniforms.resolution, this.width, this.height);
    gl.uniform1f(this.uniforms.warpExponent, this.warpExponent);

    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE);
    gl.drawArrays(gl.POINTS, 0, this.pointCount);
  }

  dispose(gl: WebGLRenderingContext): void {
    if (this.buffer) gl.deleteBuffer(this.buffer);
    if (this.program) gl.deleteProgram(this.program);
    this.buffer = null;
    this.program = null;
  }
}

function compileShader(gl: WebGLRenderingContext, type: number, source: string): WebGLShader | null {
  const shader = gl.createShader(type);
  if (!shader) return null;
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    console.warn('Shader error: ' + (gl.getShaderInfoLog(shader) || ''));
    gl.deleteShader(shader);
    return null;
  }
  return shader;
}
