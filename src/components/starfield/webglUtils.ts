/**
 * WebGL utility functions for StarField
 */

import type { Star } from './types';

/**
 * Compile a shader from source
 */
export const createShader = (
  gl: WebGLRenderingContext,
  type: number,
  source: string
): WebGLShader | null => {
  const shader = gl.createShader(type);
  if (!shader) return null;
  
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    console.error('Shader compile error:', gl.getShaderInfoLog(shader));
    gl.deleteShader(shader);
    return null;
  }
  
  return shader;
};

/**
 * Create and link a WebGL program from vertex and fragment shaders
 */
export const createProgram = (
  gl: WebGLRenderingContext,
  vertexShader: WebGLShader,
  fragmentShader: WebGLShader
): WebGLProgram | null => {
  const program = gl.createProgram();
  if (!program) return null;
  
  gl.attachShader(program, vertexShader);
  gl.attachShader(program, fragmentShader);
  gl.linkProgram(program);
  
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    console.error('Program link error:', gl.getProgramInfoLog(program));
    return null;
  }
  
  return program;
};

/**
 * Attribute locations for star data
 */
export interface StarAttributeLocations {
  angle: number;
  phase: number;
  size: number;
  color: number;
  brightness: number;
  twinkleSpeed: number;
  twinkleOffset: number;
}

/**
 * Uniform locations for global values
 */
export interface StarUniformLocations {
  time: WebGLUniformLocation | null;
  driftOffset: WebGLUniformLocation | null;
  resolution: WebGLUniformLocation | null;
}

/**
 * Get all attribute locations for the star shader
 */
export const getAttributeLocations = (
  gl: WebGLRenderingContext,
  program: WebGLProgram
): StarAttributeLocations => ({
  angle: gl.getAttribLocation(program, 'a_angle'),
  phase: gl.getAttribLocation(program, 'a_initialPhase'),
  size: gl.getAttribLocation(program, 'a_size'),
  color: gl.getAttribLocation(program, 'a_color'),
  brightness: gl.getAttribLocation(program, 'a_brightness'),
  twinkleSpeed: gl.getAttribLocation(program, 'a_twinkleSpeed'),
  twinkleOffset: gl.getAttribLocation(program, 'a_twinkleOffset'),
});

/**
 * Get all uniform locations for the star shader
 */
export const getUniformLocations = (
  gl: WebGLRenderingContext,
  program: WebGLProgram
): StarUniformLocations => ({
  time: gl.getUniformLocation(program, 'u_time'),
  driftOffset: gl.getUniformLocation(program, 'u_driftOffset'),
  resolution: gl.getUniformLocation(program, 'u_resolution'),
});

/**
 * Create and populate the star vertex buffer
 * Returns the number of particles
 */
export const createStarBuffer = (
  gl: WebGLRenderingContext,
  stars: Star[],
  locations: StarAttributeLocations
): number => {
  // Flatten star data into GPU buffer
  // Format: [angle, phase, size, r, g, b, brightness, twinkleSpeed, twinkleOffset]
  const data: number[] = [];

  stars.forEach(star => {
    data.push(
      star.angle,
      star.initialPhase,
      star.size,
      star.color.r / 255,
      star.color.g / 255,
      star.color.b / 255,
      star.brightness,
      star.twinkleSpeed,
      star.twinkleOffset
    );
  });
  
  const buffer = new Float32Array(data);
  
  const glBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, glBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, buffer, gl.STATIC_DRAW);
  
  const stride = 9 * 4; // 9 floats * 4 bytes
  
  gl.vertexAttribPointer(locations.angle, 1, gl.FLOAT, false, stride, 0);
  gl.enableVertexAttribArray(locations.angle);
  
  gl.vertexAttribPointer(locations.phase, 1, gl.FLOAT, false, stride, 4);
  gl.enableVertexAttribArray(locations.phase);
  
  gl.vertexAttribPointer(locations.size, 1, gl.FLOAT, false, stride, 8);
  gl.enableVertexAttribArray(locations.size);
  
  gl.vertexAttribPointer(locations.color, 3, gl.FLOAT, false, stride, 12);
  gl.enableVertexAttribArray(locations.color);
  
  gl.vertexAttribPointer(locations.brightness, 1, gl.FLOAT, false, stride, 24);
  gl.enableVertexAttribArray(locations.brightness);
  
  gl.vertexAttribPointer(locations.twinkleSpeed, 1, gl.FLOAT, false, stride, 28);
  gl.enableVertexAttribArray(locations.twinkleSpeed);
  
  gl.vertexAttribPointer(locations.twinkleOffset, 1, gl.FLOAT, false, stride, 32);
  gl.enableVertexAttribArray(locations.twinkleOffset);
  
  return stars.length;
};

/**
 * Initialize WebGL context with optimal settings for star rendering
 */
export const initWebGL = (canvas: HTMLCanvasElement): WebGLRenderingContext | null => {
  const gl = canvas.getContext('webgl', {
    alpha: false,
    antialias: false,
    powerPreference: 'high-performance'
  });
  
  if (!gl) {
    console.error('WebGL not supported');
    return null;
  }
  
  // Enable blending for transparency (additive blending for stars)
  gl.enable(gl.BLEND);
  gl.blendFunc(gl.SRC_ALPHA, gl.ONE);
  
  return gl;
};
