/**
 * ShootingStarSystem — GPU-rendered shooting stars / meteors.
 * Small particle system: 0-2 active at a time, dynamic spawn with cooldown.
 * Each meteor is a trail of fading point sprites.
 */

import type { RenderSystem, SpaceConfig } from '../types';

// ============================================================================
// Shaders
// ============================================================================

const VERTEX_SHADER = `
attribute vec2 a_position;
attribute float a_alpha;
attribute float a_size;
attribute vec3 a_color;

uniform vec2 u_resolution;

varying vec3 v_color;
varying float v_alpha;

void main() {
  gl_Position = vec4((a_position / u_resolution) * 2.0 - 1.0, 0.0, 1.0);
  gl_Position.y *= -1.0;
  gl_PointSize = a_size * (u_resolution.y / 1000.0);
  v_color = a_color;
  v_alpha = a_alpha;
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
  float alpha = 1.0 - smoothstep(0.1, 0.5, dist);
  gl_FragColor = vec4(v_color, v_alpha * alpha);
}
`;

// ============================================================================
// Meteor state
// ============================================================================

interface Meteor {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  size: number;
  r: number;
  g: number;
  b: number;
  trail: { x: number; y: number; alpha: number }[];
}

const TRAIL_LENGTH = 20;

// Warm white/gold meteor colors
const METEOR_COLORS = [
  { r: 1.0, g: 0.95, b: 0.85 },
  { r: 1.0, g: 0.90, b: 0.75 },
  { r: 0.95, g: 0.92, b: 1.0 },
  { r: 1.0, g: 0.85, b: 0.70 },
];

export class ShootingStarSystem implements RenderSystem {
  private program: WebGLProgram | null = null;
  private buffer: WebGLBuffer | null = null;
  private meteors: Meteor[] = [];
  private nextSpawn = 0;
  private width = 0;
  private height = 0;
  private maxActive = 2;
  private minDelay = 4;
  private maxDelay = 12;
  init(gl: WebGLRenderingContext, width: number, height: number, config: SpaceConfig): void {
    this.width = width;
    this.height = height;
    this.maxActive = config.shootingStars.maxActive;
    this.minDelay = config.shootingStars.minDelay;
    this.maxDelay = config.shootingStars.maxDelay;

    const vs = compileShader(gl, gl.VERTEX_SHADER, VERTEX_SHADER);
    const fs = compileShader(gl, gl.FRAGMENT_SHADER, FRAGMENT_SHADER);
    if (!vs || !fs) return;

    this.program = gl.createProgram()!;
    gl.attachShader(this.program, vs);
    gl.attachShader(this.program, fs);
    gl.linkProgram(this.program);

    this.buffer = gl.createBuffer();
    this.nextSpawn = this.minDelay + Math.random() * (this.maxDelay - this.minDelay);
  }

  resize(_gl: WebGLRenderingContext, width: number, height: number): void {
    this.width = width;
    this.height = height;
  }

  update(_time: number, deltaTime: number, _driftOffset: number): void {
    // Spawn logic
    this.nextSpawn -= deltaTime;
    if (this.nextSpawn <= 0 && this.meteors.length < this.maxActive) {
      this.spawnMeteor();
      this.nextSpawn = this.minDelay + Math.random() * (this.maxDelay - this.minDelay);
    }

    // Update existing meteors
    for (let i = this.meteors.length - 1; i >= 0; i--) {
      const m = this.meteors[i];
      m.life -= deltaTime;

      if (m.life <= 0) {
        this.meteors.splice(i, 1);
        continue;
      }

      m.x += m.vx * deltaTime;
      m.y += m.vy * deltaTime;

      // Update trail
      m.trail.unshift({ x: m.x, y: m.y, alpha: m.life / m.maxLife });
      if (m.trail.length > TRAIL_LENGTH) m.trail.pop();
    }
  }

  private spawnMeteor(): void {
    // Spawn from a random edge, travel across the viewport
    const angle = Math.random() * Math.PI * 2;
    const speed = 800 + Math.random() * 1200;
    const lifetime = 0.3 + Math.random() * 1.2;

    // Start from a random position in the viewport  
    const x = Math.random() * this.width;
    const y = Math.random() * this.height * 0.6; // Upper portion
    const color = METEOR_COLORS[Math.floor(Math.random() * METEOR_COLORS.length)];

    this.meteors.push({
      x, y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed * 0.5 + speed * 0.3, // Slight downward bias
      life: lifetime,
      maxLife: lifetime,
      size: 2.0 + Math.random() * 3.0,
      r: color.r,
      g: color.g,
      b: color.b,
      trail: [{ x, y, alpha: 1.0 }],
    });
  }

  render(gl: WebGLRenderingContext): void {
    if (!this.program || !this.buffer || this.meteors.length === 0) return;

    // Build vertex data from all meteor trails
    let totalPoints = 0;
    for (const m of this.meteors) totalPoints += m.trail.length;
    if (totalPoints === 0) return;

    // 7 floats per point: x, y, alpha, size, r, g, b
    const data = new Float32Array(totalPoints * 7);
    let offset = 0;

    for (const m of this.meteors) {
      const lifeRatio = m.life / m.maxLife;
      for (let t = 0; t < m.trail.length; t++) {
        const tp = m.trail[t];
        const trailFade = 1.0 - t / TRAIL_LENGTH;
        const off = offset * 7;
        data[off] = tp.x;
        data[off + 1] = tp.y;
        data[off + 2] = tp.alpha * trailFade * lifeRatio;
        data[off + 3] = m.size * (1.0 - t / TRAIL_LENGTH * 0.7);
        data[off + 4] = m.r;
        data[off + 5] = m.g;
        data[off + 6] = m.b;
        offset++;
      }
    }

    gl.useProgram(this.program);
    gl.bindBuffer(gl.ARRAY_BUFFER, this.buffer);
    gl.bufferData(gl.ARRAY_BUFFER, data, gl.DYNAMIC_DRAW);

    const stride = 7 * 4;
    const attrs: [string, number, number][] = [
      ['a_position', 2, 0],
      ['a_alpha', 1, 8],
      ['a_size', 1, 12],
      ['a_color', 3, 16],
    ];

    for (const [name, size, attrOffset] of attrs) {
      const loc = gl.getAttribLocation(this.program, name);
      if (loc >= 0) {
        gl.vertexAttribPointer(loc, size, gl.FLOAT, false, stride, attrOffset);
        gl.enableVertexAttribArray(loc);
      }
    }

    const resLoc = gl.getUniformLocation(this.program, 'u_resolution');
    gl.uniform2f(resLoc, this.width, this.height);

    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE);
    gl.drawArrays(gl.POINTS, 0, totalPoints);
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
