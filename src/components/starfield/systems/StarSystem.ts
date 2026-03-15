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
uniform vec2 u_resolution;

varying vec3 v_color;
varying float v_alpha;
varying float v_isBright;

void main() {
  float maxDist = length(u_resolution * 0.5);

  // Static radial position based on initial phase
  float travelDist = maxDist * a_initialPhase;

  float x = cos(a_angle) * travelDist;
  float y = sin(a_angle) * travelDist;

  vec2 center = u_resolution * 0.5;
  vec2 pos = center + vec2(x, y);

  gl_Position = vec4((pos / u_resolution) * 2.0 - 1.0, 0.0, 1.0);
  gl_Position.y *= -1.0;

  // Size scaling with depth
  float depthSize = 0.1 + a_initialPhase * 1.4;
  gl_PointSize = a_size * depthSize * (u_resolution.y / 1000.0) * 2.0;

  v_alpha = a_brightness;
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
  private attributes: {
    angle: number;
    phase: number;
    size: number;
    color: number;
    brightness: number;
    twinkleSpeed: number;
    twinkleOffset: number;
    isBright: number;
  } = {
    angle: -1,
    phase: -1,
    size: -1,
    color: -1,
    brightness: -1,
    twinkleSpeed: -1,
    twinkleOffset: -1,
    isBright: -1,
  };
  private uniforms: {
    time: WebGLUniformLocation | null;
    resolution: WebGLUniformLocation | null;
  } = { time: null, resolution: null };
  private time = 0;
  private width = 0;
  private height = 0;
  private config: SpaceConfig | null = null;

  init(gl: WebGLRenderingContext, width: number, height: number, config: SpaceConfig): void {
    this.width = width;
    this.height = height;
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
      resolution: gl.getUniformLocation(this.program, 'u_resolution'),
    };

    this.attributes = {
      angle: gl.getAttribLocation(this.program, 'a_angle'),
      phase: gl.getAttribLocation(this.program, 'a_initialPhase'),
      size: gl.getAttribLocation(this.program, 'a_size'),
      color: gl.getAttribLocation(this.program, 'a_color'),
      brightness: gl.getAttribLocation(this.program, 'a_brightness'),
      twinkleSpeed: gl.getAttribLocation(this.program, 'a_twinkleSpeed'),
      twinkleOffset: gl.getAttribLocation(this.program, 'a_twinkleOffset'),
      isBright: gl.getAttribLocation(this.program, 'a_isBright'),
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

  update(time: number, _deltaTime: number): void {
    this.time = time;
  }

  render(gl: WebGLRenderingContext): void {
    if (!this.program || !this.buffer || this.particleCount === 0) return;

    gl.useProgram(this.program);
    gl.bindBuffer(gl.ARRAY_BUFFER, this.buffer);

    const stride = 10 * 4;
    if (this.attributes.angle >= 0) {
      gl.vertexAttribPointer(this.attributes.angle, 1, gl.FLOAT, false, stride, 0);
      gl.enableVertexAttribArray(this.attributes.angle);
    }
    if (this.attributes.phase >= 0) {
      gl.vertexAttribPointer(this.attributes.phase, 1, gl.FLOAT, false, stride, 4);
      gl.enableVertexAttribArray(this.attributes.phase);
    }
    if (this.attributes.size >= 0) {
      gl.vertexAttribPointer(this.attributes.size, 1, gl.FLOAT, false, stride, 8);
      gl.enableVertexAttribArray(this.attributes.size);
    }
    if (this.attributes.color >= 0) {
      gl.vertexAttribPointer(this.attributes.color, 3, gl.FLOAT, false, stride, 12);
      gl.enableVertexAttribArray(this.attributes.color);
    }
    if (this.attributes.brightness >= 0) {
      gl.vertexAttribPointer(this.attributes.brightness, 1, gl.FLOAT, false, stride, 24);
      gl.enableVertexAttribArray(this.attributes.brightness);
    }
    if (this.attributes.twinkleSpeed >= 0) {
      gl.vertexAttribPointer(this.attributes.twinkleSpeed, 1, gl.FLOAT, false, stride, 28);
      gl.enableVertexAttribArray(this.attributes.twinkleSpeed);
    }
    if (this.attributes.twinkleOffset >= 0) {
      gl.vertexAttribPointer(this.attributes.twinkleOffset, 1, gl.FLOAT, false, stride, 32);
      gl.enableVertexAttribArray(this.attributes.twinkleOffset);
    }
    if (this.attributes.isBright >= 0) {
      gl.vertexAttribPointer(this.attributes.isBright, 1, gl.FLOAT, false, stride, 36);
      gl.enableVertexAttribArray(this.attributes.isBright);
    }

    gl.uniform1f(this.uniforms.time, this.time);
    gl.uniform2f(this.uniforms.resolution, this.width, this.height);

    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE);
    gl.drawArrays(gl.POINTS, 0, this.particleCount);
  }

  dispose(gl: WebGLRenderingContext): void {
    if (this.buffer) gl.deleteBuffer(this.buffer);
    if (this.program) gl.deleteProgram(this.program);
    this.buffer = null;
    this.program = null;
    this.attributes = {
      angle: -1,
      phase: -1,
      size: -1,
      color: -1,
      brightness: -1,
      twinkleSpeed: -1,
      twinkleOffset: -1,
      isBright: -1,
    };
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
