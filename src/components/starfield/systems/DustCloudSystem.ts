/**
 * DustCloudSystem — GPU-rendered cosmic dust clouds / interstellar gas.
 * Large, very faint soft sprites that drift slowly, creating depth parallax.
 * Colors based on real interstellar medium spectra.
 */

import type { RenderSystem, SpaceConfig } from '../types';

// ============================================================================
// Shaders
// ============================================================================

const VERTEX_SHADER = `
attribute float a_angle;
attribute float a_phase;
attribute float a_size;
attribute vec3 a_color;
attribute float a_alpha;

uniform float u_driftOffset;
uniform vec2 u_resolution;
uniform float u_warpExponent;

varying vec3 v_color;
varying float v_alpha;

void main() {
  float maxDist = length(u_resolution * 0.5);
  // Dust clouds move at 60% speed for parallax depth layering
  float speed = 0.12;
  float depthPhase = mod(a_phase + u_driftOffset * speed, 1.0);

  float warpedPhase = pow(depthPhase, u_warpExponent);
  float travelDist = maxDist * warpedPhase;

  vec2 center = u_resolution * 0.5;
  vec2 pos = center + vec2(cos(a_angle), sin(a_angle)) * travelDist;

  gl_Position = vec4((pos / u_resolution) * 2.0 - 1.0, 0.0, 1.0);
  gl_Position.y *= -1.0;

  float depthSize = 0.1 + depthPhase * 1.4;
  gl_PointSize = a_size * depthSize * (u_resolution.y / 1000.0);

  // Alpha: very gentle fade in/out
  float depthAlpha = 1.0;
  if (depthPhase < 0.3) {
    float t = depthPhase / 0.3;
    depthAlpha = t * t * t; // Cubic ease-in (very gentle)
  } else if (depthPhase > 0.9) {
    depthAlpha = (1.0 - depthPhase) / 0.1;
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

  // Very soft gaussian-like falloff
  float alpha = exp(-dist * dist * 8.0);
  gl_FragColor = vec4(v_color, v_alpha * alpha);
}
`;

// ============================================================================
// Dust Cloud Colors — based on real ISM spectral observations
// ============================================================================

const DUST_COLORS = [
  // Deep blue-violet (reflection nebula dust)
  { r: 0.15, g: 0.12, b: 0.35 },
  { r: 0.10, g: 0.15, b: 0.40 },
  { r: 0.20, g: 0.15, b: 0.30 },
  // Warm amber (heated dust grains near stars)
  { r: 0.35, g: 0.25, b: 0.10 },
  { r: 0.30, g: 0.20, b: 0.08 },
  // Muted red (hydrogen alpha glow in diffuse ISM)
  { r: 0.35, g: 0.10, b: 0.12 },
  { r: 0.25, g: 0.08, b: 0.15 },
  // Cool blue (scattered starlight)
  { r: 0.12, g: 0.18, b: 0.30 },
  // Faint green (OIII in very diffuse regions)
  { r: 0.10, g: 0.20, b: 0.18 },
];

// ============================================================================
// System
// ============================================================================

export class DustCloudSystem implements RenderSystem {
  private program: WebGLProgram | null = null;
  private buffer: WebGLBuffer | null = null;
  private pointCount = 0;
  private attributes: Array<{ location: number; size: number; offset: number }> = [];
  private uniforms: {
    driftOffset: WebGLUniformLocation | null;
    resolution: WebGLUniformLocation | null;
    warpExponent: WebGLUniformLocation | null;
  } = { driftOffset: null, resolution: null, warpExponent: null };
  private driftOffset = 0;
  private width = 0;
  private height = 0;
  private warpExponent = 1.5;

  init(gl: WebGLRenderingContext, width: number, height: number, config: SpaceConfig): void {
    this.width = width;
    this.height = height;

    const vs = compileShader(gl, gl.VERTEX_SHADER, VERTEX_SHADER);
    const fs = compileShader(gl, gl.FRAGMENT_SHADER, FRAGMENT_SHADER);
    if (!vs || !fs) return;

    this.program = gl.createProgram()!;
    gl.attachShader(this.program, vs);
    gl.attachShader(this.program, fs);
    gl.linkProgram(this.program);

    if (!gl.getProgramParameter(this.program, gl.LINK_STATUS)) {
      console.error('DustCloudSystem program link error');
      return;
    }

    this.uniforms = {
      driftOffset: gl.getUniformLocation(this.program, 'u_driftOffset'),
      resolution: gl.getUniformLocation(this.program, 'u_resolution'),
      warpExponent: gl.getUniformLocation(this.program, 'u_warpExponent'),
    };

    this.attributes = [
      ['a_angle', 1, 0],
      ['a_phase', 1, 4],
      ['a_size', 1, 8],
      ['a_color', 3, 12],
      ['a_alpha', 1, 24],
    ].map(([name, size, offset]) => ({
      location: gl.getAttribLocation(this.program!, name),
      size,
      offset,
    }));

    this.buildBuffer(gl, config);
  }

  private buildBuffer(gl: WebGLRenderingContext, config: SpaceConfig): void {
    const count = config.dustClouds.count;
    this.pointCount = count;

    // 6 floats per cloud: angle, phase, size, r, g, b, alpha → 7
    // But we need alpha too, so 7 floats
    const data = new Float32Array(count * 7);

    for (let i = 0; i < count; i++) {
      const color = DUST_COLORS[Math.floor(Math.random() * DUST_COLORS.length)];
      const off = i * 7;
      data[off] = Math.random() * Math.PI * 2; // angle
      data[off + 1] = Math.random(); // phase
      data[off + 2] = 80 + Math.random() * 200; // size (large!)
      data[off + 3] = color.r + (Math.random() - 0.5) * 0.05;
      data[off + 4] = color.g + (Math.random() - 0.5) * 0.05;
      data[off + 5] = color.b + (Math.random() - 0.5) * 0.05;
      data[off + 6] = config.dustClouds.minAlpha + Math.random() * (config.dustClouds.maxAlpha - config.dustClouds.minAlpha);
    }

    if (this.buffer) gl.deleteBuffer(this.buffer);
    this.buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, this.buffer);
    gl.bufferData(gl.ARRAY_BUFFER, data, gl.STATIC_DRAW);
  }

  resize(_gl: WebGLRenderingContext, width: number, height: number): void {
    this.width = width;
    this.height = height;
  }

  update(_time: number, _deltaTime: number): void {
  }

  render(gl: WebGLRenderingContext): void {
    if (!this.program || !this.buffer || this.pointCount === 0) return;

    gl.useProgram(this.program);
    gl.bindBuffer(gl.ARRAY_BUFFER, this.buffer);

    const stride = 7 * 4;
    for (const attr of this.attributes) {
      if (attr.location >= 0) {
        gl.vertexAttribPointer(attr.location, attr.size, gl.FLOAT, false, stride, attr.offset);
        gl.enableVertexAttribArray(attr.location);
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
    this.attributes = [];
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
