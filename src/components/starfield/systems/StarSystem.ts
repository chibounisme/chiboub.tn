/**
 * StarSystem — GPU-rendered stars using WebGL point sprites.
 * All movement computed in GLSL vertex shader. Single draw call per frame.
 */

import type { RenderSystem, Star, SpaceConfig, Color } from '../types';
import { STAR_COLORS, STAR_COLOR_WEIGHTS } from '../constants';

// ============================================================================
// Shaders
// ============================================================================

const VERTEX_SHADER = `
attribute float a_angle;
attribute float a_initialPhase;
attribute float a_size;
attribute vec3 a_color;
attribute float a_brightness;
attribute float a_twinkleSpeed;
attribute float a_twinkleOffset;
attribute float a_isBright;

uniform float u_time;
uniform float u_driftOffset;
uniform vec2 u_resolution;
uniform float u_warpExponent;

varying vec3 v_color;
varying float v_alpha;
varying float v_isBright;

void main() {
  float maxDist = length(u_resolution * 0.5);

  float speed = 0.2;
  float depthPhase = mod(a_initialPhase + u_driftOffset * speed, 1.0);

  // Exponential warp — slow near center, fast at edges
  float warpedPhase = pow(depthPhase, u_warpExponent);
  float travelDist = maxDist * warpedPhase;

  float x = cos(a_angle) * travelDist;
  float y = sin(a_angle) * travelDist;

  vec2 center = u_resolution * 0.5;
  vec2 pos = center + vec2(x, y);

  gl_Position = vec4((pos / u_resolution) * 2.0 - 1.0, 0.0, 1.0);
  gl_Position.y *= -1.0;

  // Size scaling with depth
  float depthSize = 0.1 + depthPhase * 1.4;
  gl_PointSize = a_size * depthSize * (u_resolution.y / 1000.0) * 2.0;

  // Alpha fading — quadratic ease-in, sharp fade-out
  float depthAlpha = 1.0;
  if (depthPhase < 0.4) {
    float t = depthPhase / 0.4;
    depthAlpha = t * t;
  } else if (depthPhase > 0.95) {
    depthAlpha = (1.0 - depthPhase) / 0.05;
  }

  // Noise-inspired twinkle: combine two sine waves at different frequencies
  float twinkle1 = sin(u_time * a_twinkleSpeed + a_twinkleOffset) * 0.3;
  float twinkle2 = sin(u_time * a_twinkleSpeed * 2.7 + a_twinkleOffset * 1.3) * 0.15;
  float twinkle = 0.55 + twinkle1 + twinkle2;

  v_alpha = a_brightness * twinkle * depthAlpha;
  v_color = a_color;
  v_isBright = a_isBright;
}
`;

const FRAGMENT_SHADER = `
precision mediump float;
varying vec3 v_color;
varying float v_alpha;
varying float v_isBright;

void main() {
  vec2 coord = gl_PointCoord - vec2(0.5);
  float dist = length(coord);

  if (dist > 0.5) discard;

  // Soft glow edge
  float alpha = 1.0 - smoothstep(0.2, 0.5, dist);

  // Diffraction spikes for bright stars (cross pattern)
  float spike = 0.0;
  if (v_isBright > 0.5) {
    float ax = abs(coord.x);
    float ay = abs(coord.y);
    // Horizontal and vertical spikes
    float spikeH = max(0.0, 1.0 - ay * 12.0) * max(0.0, 1.0 - ax * 3.0);
    float spikeV = max(0.0, 1.0 - ax * 12.0) * max(0.0, 1.0 - ay * 3.0);
    spike = (spikeH + spikeV) * 0.3;
  }

  gl_FragColor = vec4(v_color, v_alpha * (alpha + spike));
}
`;

// ============================================================================
// Star Generation
// ============================================================================

function getRandomStarColor(): Color {
  const random = Math.random();
  let cumulative = 0;
  let baseColor = STAR_COLORS[STAR_COLORS.length - 1];

  for (let i = 0; i < STAR_COLOR_WEIGHTS.length; i++) {
    cumulative += STAR_COLOR_WEIGHTS[i];
    if (random < cumulative) {
      baseColor = STAR_COLORS[i];
      break;
    }
  }

  return {
    r: Math.min(255, Math.max(0, baseColor.r + Math.floor((Math.random() - 0.5) * 20))),
    g: Math.min(255, Math.max(0, baseColor.g + Math.floor((Math.random() - 0.5) * 20))),
    b: Math.min(255, Math.max(0, baseColor.b + Math.floor((Math.random() - 0.5) * 20))),
  };
}

function generateStars(width: number, height: number, config: SpaceConfig): Star[] {
  const adjustedDensity = config.stars.densityFactor / config.stars.densityMultiplier;
  const numStars = Math.floor((width * height) / adjustedDensity);
  const stars: Star[] = new Array(numStars);

  for (let i = 0; i < numStars; i++) {
    const sizeRoll = Math.random();
    let size: number;
    if (sizeRoll < 0.5) {
      size = 0.2 + Math.random() * 0.5;
    } else if (sizeRoll < 0.8) {
      size = 0.5 + Math.random() * 0.8;
    } else if (sizeRoll < 0.95) {
      size = 1.0 + Math.random() * 1.0;
    } else {
      size = 1.8 + Math.random() * 1.2;
    }

    const baseBrightness = 0.3 + (size / 3) * 0.5;
    const brightness = Math.min(1, baseBrightness + (Math.random() - 0.5) * 0.3);
    const twinkleSpeed = 0.01 + Math.random() * 0.05 + (1 - size / 3) * 0.02;
    const twinkleOffset = Math.random() * Math.PI * 2;

    stars[i] = {
      size,
      brightness,
      twinkleSpeed,
      twinkleOffset,
      color: getRandomStarColor(),
      angle: Math.random() * Math.PI * 2,
      initialPhase: Math.random(),
    };
  }

  return stars;
}

// ============================================================================
// System
// ============================================================================

export class StarSystem implements RenderSystem {
  private program: WebGLProgram | null = null;
  private buffer: WebGLBuffer | null = null;
  private particleCount = 0;
  private uniforms: {
    time: WebGLUniformLocation | null;
    driftOffset: WebGLUniformLocation | null;
    resolution: WebGLUniformLocation | null;
    warpExponent: WebGLUniformLocation | null;
  } = { time: null, driftOffset: null, resolution: null, warpExponent: null };
  private time = 0;
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

    // Compile program
    const vs = compileShader(gl, gl.VERTEX_SHADER, VERTEX_SHADER);
    const fs = compileShader(gl, gl.FRAGMENT_SHADER, FRAGMENT_SHADER);
    if (!vs || !fs) return;

    this.program = gl.createProgram()!;
    gl.attachShader(this.program, vs);
    gl.attachShader(this.program, fs);
    gl.linkProgram(this.program);

    if (!gl.getProgramParameter(this.program, gl.LINK_STATUS)) {
      console.error('StarSystem program link error');
      return;
    }

    this.uniforms = {
      time: gl.getUniformLocation(this.program, 'u_time'),
      driftOffset: gl.getUniformLocation(this.program, 'u_driftOffset'),
      resolution: gl.getUniformLocation(this.program, 'u_resolution'),
      warpExponent: gl.getUniformLocation(this.program, 'u_warpExponent'),
    };

    this.buildStarBuffer(gl, width, height, config);
  }

  private buildStarBuffer(gl: WebGLRenderingContext, width: number, height: number, config: SpaceConfig): void {
    const stars = generateStars(width, height, config);
    this.particleCount = stars.length;

    // 10 floats per star: angle, phase, size, r, g, b, brightness, twinkleSpeed, twinkleOffset, isBright
    const data = new Float32Array(stars.length * 10);
    for (let i = 0; i < stars.length; i++) {
      const s = stars[i];
      const off = i * 10;
      data[off] = s.angle;
      data[off + 1] = s.initialPhase;
      data[off + 2] = s.size;
      data[off + 3] = s.color.r / 255;
      data[off + 4] = s.color.g / 255;
      data[off + 5] = s.color.b / 255;
      data[off + 6] = s.brightness;
      data[off + 7] = s.twinkleSpeed;
      data[off + 8] = s.twinkleOffset;
      data[off + 9] = s.size > 1.8 ? 1.0 : 0.0; // isBright flag for diffraction spikes
    }

    if (this.buffer) gl.deleteBuffer(this.buffer);
    this.buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, this.buffer);
    gl.bufferData(gl.ARRAY_BUFFER, data, gl.STATIC_DRAW);
  }

  resize(gl: WebGLRenderingContext, width: number, height: number): void {
    this.width = width;
    this.height = height;
    if (this.config) this.buildStarBuffer(gl, width, height, this.config);
  }

  update(time: number, _deltaTime: number, driftOffset: number): void {
    this.time = time;
    this.driftOffset = driftOffset;
  }

  render(gl: WebGLRenderingContext): void {
    if (!this.program || !this.buffer || this.particleCount === 0) return;

    gl.useProgram(this.program);
    gl.bindBuffer(gl.ARRAY_BUFFER, this.buffer);

    const stride = 10 * 4;
    const locs = {
      angle: gl.getAttribLocation(this.program, 'a_angle'),
      phase: gl.getAttribLocation(this.program, 'a_initialPhase'),
      size: gl.getAttribLocation(this.program, 'a_size'),
      color: gl.getAttribLocation(this.program, 'a_color'),
      brightness: gl.getAttribLocation(this.program, 'a_brightness'),
      twinkleSpeed: gl.getAttribLocation(this.program, 'a_twinkleSpeed'),
      twinkleOffset: gl.getAttribLocation(this.program, 'a_twinkleOffset'),
      isBright: gl.getAttribLocation(this.program, 'a_isBright'),
    };

    gl.vertexAttribPointer(locs.angle, 1, gl.FLOAT, false, stride, 0);
    gl.enableVertexAttribArray(locs.angle);
    gl.vertexAttribPointer(locs.phase, 1, gl.FLOAT, false, stride, 4);
    gl.enableVertexAttribArray(locs.phase);
    gl.vertexAttribPointer(locs.size, 1, gl.FLOAT, false, stride, 8);
    gl.enableVertexAttribArray(locs.size);
    gl.vertexAttribPointer(locs.color, 3, gl.FLOAT, false, stride, 12);
    gl.enableVertexAttribArray(locs.color);
    gl.vertexAttribPointer(locs.brightness, 1, gl.FLOAT, false, stride, 24);
    gl.enableVertexAttribArray(locs.brightness);
    gl.vertexAttribPointer(locs.twinkleSpeed, 1, gl.FLOAT, false, stride, 28);
    gl.enableVertexAttribArray(locs.twinkleSpeed);
    gl.vertexAttribPointer(locs.twinkleOffset, 1, gl.FLOAT, false, stride, 32);
    gl.enableVertexAttribArray(locs.twinkleOffset);
    gl.vertexAttribPointer(locs.isBright, 1, gl.FLOAT, false, stride, 36);
    gl.enableVertexAttribArray(locs.isBright);

    gl.uniform1f(this.uniforms.time, this.time);
    gl.uniform1f(this.uniforms.driftOffset, this.driftOffset);
    gl.uniform2f(this.uniforms.resolution, this.width, this.height);
    gl.uniform1f(this.uniforms.warpExponent, this.warpExponent);

    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE);
    gl.drawArrays(gl.POINTS, 0, this.particleCount);
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
