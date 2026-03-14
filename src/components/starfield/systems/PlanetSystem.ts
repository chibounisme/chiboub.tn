/**
 * PlanetSystem — GPU-rendered distant planets with hemisphere shading.
 * 1-3 planets visible at a time, appearing rarely during travel.
 * Rendered as shaded circles with atmosphere glow in fragment shader.
 */

import type { RenderSystem, SpaceConfig } from '../types';

// ============================================================================
// Shaders - Planet uses a quad (two triangles) per planet for fragment shading
// ============================================================================

const VERTEX_SHADER = `
attribute vec2 a_position;     // quad vertex position
attribute vec2 a_center;       // planet center in screen coords
attribute float a_radius;      // planet radius
attribute vec3 a_baseColor;    // planet base color
attribute vec3 a_darkColor;    // shadow side color
attribute float a_alpha;       // overall alpha
attribute float a_lightAngle;  // light source angle
attribute float a_bands;       // number of bands (0 for rocky)

uniform vec2 u_resolution;

varying vec2 v_uv;
varying vec3 v_baseColor;
varying vec3 v_darkColor;
varying float v_alpha;
varying float v_lightAngle;
varying float v_bands;

void main() {
  // a_position is in [-1, 1], scale by radius and offset to center
  vec2 pos = a_center + a_position * a_radius;

  gl_Position = vec4((pos / u_resolution) * 2.0 - 1.0, 0.0, 1.0);
  gl_Position.y *= -1.0;

  v_uv = a_position; // [-1, 1] UV for fragment shader
  v_baseColor = a_baseColor;
  v_darkColor = a_darkColor;
  v_alpha = a_alpha;
  v_lightAngle = a_lightAngle;
  v_bands = a_bands;
}
`;

const FRAGMENT_SHADER = `
precision mediump float;

varying vec2 v_uv;
varying vec3 v_baseColor;
varying vec3 v_darkColor;
varying float v_alpha;
varying float v_lightAngle;
varying float v_bands;

void main() {
  float dist = length(v_uv);

  // Atmosphere glow ring (outside the planet body)
  if (dist > 1.0) {
    float atmosphereDist = dist - 1.0;
    if (atmosphereDist > 0.15) discard;
    float glowAlpha = (1.0 - atmosphereDist / 0.15);
    glowAlpha *= glowAlpha * glowAlpha;
    vec3 glowColor = mix(v_baseColor, vec3(0.6, 0.8, 1.0), 0.5);
    gl_FragColor = vec4(glowColor, v_alpha * glowAlpha * 0.3);
    return;
  }

  // Hemisphere shading — simulate star illumination from one side
  float cs = cos(v_lightAngle);
  float sn = sin(v_lightAngle);
  vec2 lightDir = vec2(cs, sn);
  float lighting = dot(normalize(v_uv), lightDir) * 0.5 + 0.5;
  lighting = pow(lighting, 1.5); // Slightly harsher terminator

  // Band pattern for gas/ice giants
  vec3 surfaceColor = v_baseColor;
  if (v_bands > 0.5) {
    // Create horizontal bands with subtle color variation
    float bandFreq = v_bands * 3.14159;
    float bandPattern = sin(v_uv.y * bandFreq) * 0.5 + 0.5;
    surfaceColor = mix(v_baseColor, v_darkColor, bandPattern * 0.3);
  }

  // Mix lit and shadow sides
  vec3 color = mix(v_darkColor * 0.15, surfaceColor, lighting);

  // Limb darkening — edges of the planet are slightly darker
  float limb = 1.0 - dist;
  limb = pow(limb, 0.4);
  color *= limb;

  // Soft edge anti-aliasing
  float edgeAlpha = 1.0 - smoothstep(0.95, 1.0, dist);

  gl_FragColor = vec4(color, v_alpha * edgeAlpha);
}
`;

// ============================================================================
// Planet palettes — based on real planet types
// ============================================================================

interface PlanetTemplate {
  name: string;
  baseColor: [number, number, number];
  darkColor: [number, number, number];
  bands: number; // 0 = rocky, >0 = gas giant band count
}

const PLANET_TEMPLATES: PlanetTemplate[] = [
  // Gas giants (Jupiter-like)
  { name: 'jupiter', baseColor: [0.85, 0.70, 0.45], darkColor: [0.65, 0.45, 0.25], bands: 6 },
  { name: 'saturn', baseColor: [0.90, 0.80, 0.55], darkColor: [0.70, 0.55, 0.30], bands: 4 },
  { name: 'warmGiant', baseColor: [0.80, 0.55, 0.35], darkColor: [0.50, 0.30, 0.15], bands: 5 },
  // Ice giants (Neptune/Uranus-like)
  { name: 'neptune', baseColor: [0.25, 0.45, 0.80], darkColor: [0.10, 0.20, 0.50], bands: 3 },
  { name: 'uranus', baseColor: [0.50, 0.75, 0.80], darkColor: [0.25, 0.45, 0.55], bands: 2 },
  // Rocky planets
  { name: 'mars', baseColor: [0.70, 0.35, 0.20], darkColor: [0.40, 0.18, 0.10], bands: 0 },
  { name: 'moon', baseColor: [0.50, 0.48, 0.45], darkColor: [0.25, 0.23, 0.22], bands: 0 },
  { name: 'mercury', baseColor: [0.55, 0.50, 0.45], darkColor: [0.30, 0.28, 0.25], bands: 0 },
];

// ============================================================================
// Planet state
// ============================================================================

interface ActivePlanet {
  centerX: number;
  centerY: number;
  radius: number;
  template: PlanetTemplate;
  lightAngle: number;
  travelAngle: number;
  phase: number;
  speed: number;
  maxDist: number;
}

export class PlanetSystem implements RenderSystem {
  private program: WebGLProgram | null = null;
  private buffer: WebGLBuffer | null = null;
  private planets: ActivePlanet[] = [];
  private width = 0;
  private height = 0;
  private maxVisible = 2;
  private spawnChance = 0.3;
  private driftOffset = 0;
  private warpExponent = 1.5;


  init(gl: WebGLRenderingContext, width: number, height: number, config: SpaceConfig): void {
    this.width = width;
    this.height = height;
    this.maxVisible = config.planets.maxVisible;
    this.spawnChance = config.planets.spawnChance;
    this.warpExponent = config.motion.warpExponent;

    const vs = compileShader(gl, gl.VERTEX_SHADER, VERTEX_SHADER);
    const fs = compileShader(gl, gl.FRAGMENT_SHADER, FRAGMENT_SHADER);
    if (!vs || !fs) return;

    this.program = gl.createProgram()!;
    gl.attachShader(this.program, vs);
    gl.attachShader(this.program, fs);
    gl.linkProgram(this.program);

    if (!gl.getProgramParameter(this.program, gl.LINK_STATUS)) {
      console.error('PlanetSystem program link error');
      return;
    }

    this.buffer = gl.createBuffer();
    this.spawnPlanets();
  }

  private spawnPlanets(): void {
    this.planets = [];
    const count = 1 + Math.floor(Math.random() * this.maxVisible);
    const maxDist = Math.sqrt(this.width * this.width / 4 + this.height * this.height / 4);

    for (let i = 0; i < count; i++) {
      if (Math.random() > this.spawnChance && i > 0) continue;

      const template = PLANET_TEMPLATES[Math.floor(Math.random() * PLANET_TEMPLATES.length)];
      const radius = 15 + Math.random() * 35; // Distant → small

      this.planets.push({
        centerX: 0,
        centerY: 0,
        radius,
        template,
        lightAngle: Math.random() * Math.PI * 2,
        travelAngle: Math.random() * Math.PI * 2,
        phase: Math.random(),
        speed: 0.03 + Math.random() * 0.02, // Very slow
        maxDist,
      });
    }
  }

  resize(_gl: WebGLRenderingContext, width: number, height: number): void {
    this.width = width;
    this.height = height;
    const maxDist = Math.sqrt(width * width / 4 + height * height / 4);
    for (const p of this.planets) p.maxDist = maxDist;
  }

  update(_time: number, _deltaTime: number, driftOffset: number): void {
    this.driftOffset = driftOffset;

    // Update planet positions based on drift
    const centerX = this.width / 2;
    const centerY = this.height / 2;

    for (const p of this.planets) {
      const depthPhase = (p.phase + driftOffset * p.speed) % 1;
      const warpedPhase = Math.pow(depthPhase, this.warpExponent);
      const travelDist = p.maxDist * warpedPhase;

      p.centerX = centerX + Math.cos(p.travelAngle) * travelDist;
      p.centerY = centerY + Math.sin(p.travelAngle) * travelDist;
    }
  }

  render(gl: WebGLRenderingContext): void {
    if (!this.program || !this.buffer || this.planets.length === 0) return;

    // Build quad data for visible planets
    const visiblePlanets = this.planets.filter(p => {
      const depthPhase = (p.phase + this.driftOffset * p.speed) % 1;
      // Only render when in the visible depth range
      return depthPhase > 0.15 && depthPhase < 0.85;
    });

    if (visiblePlanets.length === 0) return;

    // 6 vertices per planet (2 triangles), 13 floats per vertex
    const verticesPerPlanet = 6;
    const floatsPerVertex = 13;
    const data = new Float32Array(visiblePlanets.length * verticesPerPlanet * floatsPerVertex);

    for (let pi = 0; pi < visiblePlanets.length; pi++) {
      const p = visiblePlanets[pi];
      const depthPhase = (p.phase + this.driftOffset * p.speed) % 1;
      const depthSize = 0.1 + depthPhase * 1.4;
      const scaledRadius = p.radius * depthSize;

      // Alpha: fade in/out
      let depthAlpha = 1.0;
      if (depthPhase < 0.3) {
        const t = depthPhase / 0.3;
        depthAlpha = t * t;
      } else if (depthPhase > 0.8) {
        depthAlpha = (1.0 - depthPhase) / 0.2;
      }

      const t = p.template;
      // Quad corners: two triangles covering [-1.15, 1.15] to include atmosphere glow
      const quadVerts = [
        [-1.15, -1.15], [1.15, -1.15], [-1.15, 1.15],
        [1.15, -1.15], [1.15, 1.15], [-1.15, 1.15],
      ];

      for (let vi = 0; vi < 6; vi++) {
        const off = (pi * verticesPerPlanet + vi) * floatsPerVertex;
        data[off] = quadVerts[vi][0];     // a_position.x
        data[off + 1] = quadVerts[vi][1]; // a_position.y
        data[off + 2] = p.centerX;        // a_center.x
        data[off + 3] = p.centerY;        // a_center.y
        data[off + 4] = scaledRadius;     // a_radius
        data[off + 5] = t.baseColor[0];   // a_baseColor
        data[off + 6] = t.baseColor[1];
        data[off + 7] = t.baseColor[2];
        data[off + 8] = t.darkColor[0];   // a_darkColor
        data[off + 9] = t.darkColor[1];
        data[off + 10] = t.darkColor[2];
        data[off + 11] = depthAlpha * 0.8; // a_alpha
        data[off + 12] = p.lightAngle;     // a_lightAngle
        // Bands encoded in a_lightAngle area — but we need separate attrib
        // We'll pack bands into an extra float
      }
    }

    // Actually need 14 floats to include bands
    const data2 = new Float32Array(visiblePlanets.length * verticesPerPlanet * 14);
    for (let pi = 0; pi < visiblePlanets.length; pi++) {
      const p = visiblePlanets[pi];
      const depthPhase = (p.phase + this.driftOffset * p.speed) % 1;
      const depthSize = 0.1 + depthPhase * 1.4;
      const scaledRadius = p.radius * depthSize;

      let depthAlpha = 1.0;
      if (depthPhase < 0.3) {
        const t2 = depthPhase / 0.3;
        depthAlpha = t2 * t2;
      } else if (depthPhase > 0.8) {
        depthAlpha = (1.0 - depthPhase) / 0.2;
      }

      const t = p.template;
      const quadVerts = [
        [-1.15, -1.15], [1.15, -1.15], [-1.15, 1.15],
        [1.15, -1.15], [1.15, 1.15], [-1.15, 1.15],
      ];

      for (let vi = 0; vi < 6; vi++) {
        const off = (pi * verticesPerPlanet + vi) * 14;
        data2[off] = quadVerts[vi][0];
        data2[off + 1] = quadVerts[vi][1];
        data2[off + 2] = p.centerX;
        data2[off + 3] = p.centerY;
        data2[off + 4] = scaledRadius;
        data2[off + 5] = t.baseColor[0];
        data2[off + 6] = t.baseColor[1];
        data2[off + 7] = t.baseColor[2];
        data2[off + 8] = t.darkColor[0];
        data2[off + 9] = t.darkColor[1];
        data2[off + 10] = t.darkColor[2];
        data2[off + 11] = depthAlpha * 0.8;
        data2[off + 12] = p.lightAngle;
        data2[off + 13] = t.bands;
      }
    }

    gl.useProgram(this.program);
    gl.bindBuffer(gl.ARRAY_BUFFER, this.buffer);
    gl.bufferData(gl.ARRAY_BUFFER, data2, gl.DYNAMIC_DRAW);

    const stride = 14 * 4;
    const attrs: [string, number, number][] = [
      ['a_position', 2, 0],
      ['a_center', 2, 8],
      ['a_radius', 1, 16],
      ['a_baseColor', 3, 20],
      ['a_darkColor', 3, 32],
      ['a_alpha', 1, 44],
      ['a_lightAngle', 1, 48],
      ['a_bands', 1, 52],
    ];

    for (const [name, size, offset] of attrs) {
      const loc = gl.getAttribLocation(this.program, name);
      if (loc >= 0) {
        gl.vertexAttribPointer(loc, size, gl.FLOAT, false, stride, offset);
        gl.enableVertexAttribArray(loc);
      }
    }

    const resLoc = gl.getUniformLocation(this.program, 'u_resolution');
    gl.uniform2f(resLoc, this.width, this.height);

    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA); // Standard blending for opaque bodies
    gl.drawArrays(gl.TRIANGLES, 0, visiblePlanets.length * verticesPerPlanet);

    // Restore additive blending for other systems
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE);
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
