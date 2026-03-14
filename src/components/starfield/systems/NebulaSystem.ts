/**
 * NebulaSystem — GPU-rendered nebulae using WebGL point sprites.
 * Nebula blobs, dust particles, filament points, and embedded stars are
 * flattened into a single VBO and drawn in one call per frame.
 */

import type { RenderSystem, SpaceConfig, NebulaType, Color } from '../types';
import { NEBULA_TYPES, NEBULA_PALETTES } from '../constants';
import { STAR_COLORS, STAR_COLOR_WEIGHTS } from '../constants';

// ============================================================================
// Shaders
// ============================================================================

const VERTEX_SHADER = `
attribute vec2 a_position;
attribute float a_angle;
attribute float a_phase;
attribute float a_speed;
attribute float a_size;
attribute vec3 a_color;
attribute float a_alpha;
attribute float a_rotation;

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
  vec2 nebulaCenter = center + vec2(cos(a_angle), sin(a_angle)) * travelDist;

  // Rotate point relative to nebula center
  float cs = cos(a_rotation);
  float sn = sin(a_rotation);
  vec2 rotated = vec2(
    a_position.x * cs - a_position.y * sn,
    a_position.x * sn + a_position.y * cos(a_rotation)
  );

  float depthSize = 0.1 + depthPhase * 1.4;
  // Scale sub-point offsets uniformly with depth so they don't form cones
  float offsetScale = max(0.2, depthSize);
  vec2 pos = nebulaCenter + rotated * offsetScale;

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

  // Very soft falloff for nebula blobs
  float alpha = 1.0 - smoothstep(0.0, 0.5, dist);
  alpha *= alpha; // Extra softness
  gl_FragColor = vec4(v_color, v_alpha * alpha);
}
`;

// ============================================================================
// Nebula data generation — produces flat point arrays
// ============================================================================

interface NebulaPoint {
  px: number;
  py: number;
  angle: number;
  phase: number;
  speed: number;
  size: number;
  r: number;
  g: number;
  b: number;
  alpha: number;
  rotation: number;
}

function varyColor(base: Color, variance: number): Color {
  return {
    r: Math.min(255, Math.max(0, base.r + Math.floor((Math.random() - 0.5) * variance))),
    g: Math.min(255, Math.max(0, base.g + Math.floor((Math.random() - 0.5) * variance))),
    b: Math.min(255, Math.max(0, base.b + Math.floor((Math.random() - 0.5) * variance))),
  };
}

function getRandomStarColor(): Color {
  const random = Math.random();
  let cumulative = 0;
  let baseColor = STAR_COLORS[STAR_COLORS.length - 1];
  for (let i = 0; i < STAR_COLOR_WEIGHTS.length; i++) {
    cumulative += STAR_COLOR_WEIGHTS[i];
    if (random < cumulative) { baseColor = STAR_COLORS[i]; break; }
  }
  return varyColor(baseColor, 20);
}

function generateNebulaPoints(width: number, height: number, config: SpaceConfig): NebulaPoint[] {
  const points: NebulaPoint[] = [];
  const screenArea = width * height;
  const referenceArea = 1920 * 1080;
  const scaleFactor = Math.min(1.5, Math.max(0.4, screenArea / referenceArea));
  const mult = config.nebulae.countMultiplier;

  const minN = Math.floor(config.nebulae.min * scaleFactor * mult);
  const maxN = Math.floor(config.nebulae.max * scaleFactor * mult);
  const numNebulas = minN + Math.floor(Math.random() * (maxN - minN + 1));

  for (let i = 0; i < numNebulas; i++) {
    const type = NEBULA_TYPES[Math.floor(Math.random() * NEBULA_TYPES.length)] as NebulaType;
    const palettes = NEBULA_PALETTES[type];
    const baseTriplet = palettes[Math.floor(Math.random() * palettes.length)];
    const color1 = varyColor(baseTriplet[0], 30);
    const color2 = varyColor(baseTriplet[1], 30);
    const color3 = varyColor(baseTriplet[2], 30);

    const sizeRoll = Math.random();
    let nebulaSize: number;
    if (sizeRoll < 0.3) nebulaSize = 25 + Math.random() * 35;
    else if (sizeRoll < 0.6) nebulaSize = 60 + Math.random() * 50;
    else if (sizeRoll < 0.85) nebulaSize = 110 + Math.random() * 60;
    else nebulaSize = 170 + Math.random() * 80;

    const rotation = Math.random() * Math.PI * 2;
    const travelAngle = Math.random() * Math.PI * 2;
    const initialPhase = Math.random();
    const speed = 0.05;
    const baseBrightness = 0.015 + Math.random() * 0.025;

    const colors = [color1, color2, color3];

    // Nebula layers → blobs
    const numLayers = 3 + Math.floor(Math.random() * 4) + Math.floor(nebulaSize / 80);
    for (let l = 0; l < numLayers; l++) {
      const layerScale = 0.3 + Math.random() * 0.9;
      const layerSize = nebulaSize * layerScale;
      const offsetX = (Math.random() - 0.5) * nebulaSize * 0.7;
      const offsetY = (Math.random() - 0.5) * nebulaSize * 0.6;
      const opacity = 0.3 + Math.random() * 0.5;
      const color = colors[l % 3];

      const numBlobs = 5 + Math.floor(Math.random() * 4);
      for (let b = 0; b < numBlobs; b++) {
        const blobGeom = generateBlobGeometry(type, layerSize, b, numBlobs, Math.random() * 1000);
        const blobX = offsetX + Math.cos(blobGeom.angle) * blobGeom.dist;
        const blobY = offsetY + Math.sin(blobGeom.angle) * blobGeom.dist * 0.7;

        points.push({
          px: blobX, py: blobY,
          angle: travelAngle, phase: initialPhase, speed,
          size: blobGeom.size * 1.6,
          r: color.r / 255, g: color.g / 255, b: color.b / 255,
          alpha: baseBrightness * opacity * 0.15,
          rotation,
        });
      }
    }

    // Dust particles
    const numDust = Math.floor(nebulaSize / 5);
    for (let d = 0; d < numDust; d++) {
      const dustAngle = Math.random() * Math.PI * 2;
      const dustDist = Math.random() * nebulaSize * 0.9;
      const dustColor = colors[Math.random() < 0.5 ? 1 : 2];
      const distRatio = dustDist / nebulaSize;
      const dustAlpha = baseBrightness * (0.2 + Math.random() * 0.4) * 0.3 * Math.max(0, 1 - distRatio * 0.8);

      if (dustAlpha > 0.005) {
        points.push({
          px: Math.cos(dustAngle) * dustDist,
          py: Math.sin(dustAngle) * dustDist * 0.7,
          angle: travelAngle, phase: initialPhase, speed,
          size: (0.3 + Math.random() * 1.2) * 2,
          r: dustColor.r / 255, g: dustColor.g / 255, b: dustColor.b / 255,
          alpha: dustAlpha,
          rotation,
        });
      }
    }

    // Embedded stars
    const numEmbedded = 15 + Math.floor(Math.random() * 20) + Math.floor(nebulaSize / 10);
    for (let s = 0; s < numEmbedded; s++) {
      const starSizeRoll = Math.random();
      let starSize: number;
      if (starSizeRoll < 0.6) starSize = 0.3 + Math.random() * 0.8;
      else if (starSizeRoll < 0.9) starSize = 1.0 + Math.random() * 1.2;
      else starSize = 2.0 + Math.random() * 1.5;

      const r = Math.sqrt(Math.random()) * nebulaSize * 0.8;
      const theta = Math.random() * Math.PI * 2;
      const starColor = getRandomStarColor();
      const starBrightness = 0.5 + Math.random() * 0.5;

      // Bright core
      points.push({
        px: Math.cos(theta) * r,
        py: Math.sin(theta) * r * 0.7,
        angle: travelAngle, phase: initialPhase, speed,
        size: starSize * 2,
        r: starColor.r / 255, g: starColor.g / 255, b: starColor.b / 255,
        alpha: starBrightness * 0.9,
        rotation,
      });

      // Outer glow
      points.push({
        px: Math.cos(theta) * r,
        py: Math.sin(theta) * r * 0.7,
        angle: travelAngle, phase: initialPhase, speed,
        size: starSize * 5,
        r: starColor.r / 255, g: starColor.g / 255, b: starColor.b / 255,
        alpha: starBrightness * 0.15,
        rotation,
      });
    }

    // Core glow
    points.push({
      px: 0, py: 0,
      angle: travelAngle, phase: initialPhase, speed,
      size: nebulaSize * 0.3,
      r: color3.r / 255, g: color3.g / 255, b: color3.b / 255,
      alpha: baseBrightness * 0.25,
      rotation,
    });
  }

  return points;
}

function generateBlobGeometry(type: NebulaType, layerSize: number, b: number, numBlobs: number, seed: number): { angle: number; dist: number; size: number } {
  let angle: number, dist: number, size: number;

  if (type === 'butterfly') {
    const side = Math.random() < 0.5 ? 0 : Math.PI;
    angle = side + (Math.random() - 0.5) * 1.2;
    dist = layerSize * (0.2 + Math.random() * 0.7);
    size = layerSize * (0.3 + Math.random() * 0.45);
  } else if (type === 'hourglass') {
    const side = Math.random() < 0.5 ? 0 : Math.PI;
    angle = side + (Math.random() - 0.5) * 1.5;
    dist = layerSize * (0.1 + Math.random() * 0.7);
    size = layerSize * (0.2 + Math.random() * 0.5);
  } else if (type === 'twin-jet') {
    const side = Math.random() < 0.5 ? 0 : Math.PI;
    angle = side + (Math.random() - 0.5) * 0.3;
    dist = layerSize * (0.1 + Math.random() * 0.9);
    size = layerSize * (0.1 + Math.random() * 0.3);
  } else if (type === 'ring') {
    angle = Math.random() * Math.PI * 2;
    dist = layerSize * (0.5 + Math.random() * 0.25);
    size = layerSize * (0.2 + Math.random() * 0.3);
  } else if (type === 'egg') {
    const isJet = Math.random() < 0.3;
    if (isJet) {
      const side = Math.random() < 0.5 ? 0 : Math.PI;
      angle = side + (Math.random() - 0.5) * 0.2;
      dist = layerSize * (0.4 + Math.random() * 0.6);
      size = layerSize * (0.1 + Math.random() * 0.2);
    } else {
      angle = Math.random() * Math.PI * 2;
      const eggFactor = 0.5 + 0.5 * Math.cos(angle);
      dist = layerSize * (0.1 + Math.random() * 0.4) * eggFactor;
      size = layerSize * (0.25 + Math.random() * 0.35);
    }
  } else if (type === 'eye') {
    const isShell = Math.random() < 0.7;
    if (isShell) {
      const shellRadius = 0.3 + Math.random() * 0.5;
      angle = Math.random() * Math.PI * 2;
      dist = layerSize * shellRadius;
      size = layerSize * (0.15 + 0.1 * Math.abs(Math.sin(angle)));
    } else {
      angle = Math.random() * Math.PI * 2;
      dist = layerSize * Math.random() * 0.25;
      size = layerSize * (0.2 + Math.random() * 0.2);
    }
  } else {
    angle = (b / numBlobs) * Math.PI * 2 + seed;
    dist = layerSize * 0.3 * Math.random();
    size = layerSize * (0.3 + Math.random() * 0.5);
  }

  return { angle, dist, size };
}

// ============================================================================
// System
// ============================================================================

export class NebulaSystem implements RenderSystem {
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
      console.error('NebulaSystem program link error');
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
    const nebulaPoints = generateNebulaPoints(width, height, config);
    this.pointCount = nebulaPoints.length;

    // 11 floats: px, py, angle, phase, speed, size, r, g, b, alpha, rotation
    const data = new Float32Array(nebulaPoints.length * 11);
    for (let i = 0; i < nebulaPoints.length; i++) {
      const p = nebulaPoints[i];
      const off = i * 11;
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

    const stride = 11 * 4;
    const attrs: [string, number, number][] = [
      ['a_position', 2, 0],
      ['a_angle', 1, 8],
      ['a_phase', 1, 12],
      ['a_speed', 1, 16],
      ['a_size', 1, 20],
      ['a_color', 3, 24],
      ['a_alpha', 1, 36],
      ['a_rotation', 1, 40],
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
