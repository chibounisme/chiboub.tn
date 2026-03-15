/**
 * BloomPass — Post-processing bloom effect using framebuffer render-to-texture.
 * Extracts bright pixels, applies Gaussian blur, composites back with vignette.
 */

import type { RenderSystem, SpaceConfig } from '../types';

// ============================================================================
// Shaders
// ============================================================================

// Fullscreen quad vertex shader (shared for all passes)
const QUAD_VERTEX = `
attribute vec2 a_position;
varying vec2 v_uv;
void main() {
  v_uv = a_position * 0.5 + 0.5;
  gl_Position = vec4(a_position, 0.0, 1.0);
}
`;

// Extract bright pixels + apply blur (WebGL1-safe: no array indexing)
const BLOOM_FRAGMENT = `
precision mediump float;
varying vec2 v_uv;
uniform sampler2D u_texture;
uniform vec2 u_texelSize;
uniform float u_bloomIntensity;

void main() {
  // 9-tap Gaussian blur with brightness extraction (unrolled for WebGL1 compat)
  vec4 sum = vec4(0.0);
  vec4 s;
  float b;
  float c;

  s = texture2D(u_texture, v_uv + vec2(-4.0, 0.0) * u_texelSize * 2.0);
  b = dot(s.rgb, vec3(0.2126, 0.7152, 0.0722));
  c = smoothstep(0.3, 0.8, b);
  sum += s * c * 0.05;

  s = texture2D(u_texture, v_uv + vec2(-3.0, 0.0) * u_texelSize * 2.0);
  b = dot(s.rgb, vec3(0.2126, 0.7152, 0.0722));
  c = smoothstep(0.3, 0.8, b);
  sum += s * c * 0.09;

  s = texture2D(u_texture, v_uv + vec2(-2.0, 0.0) * u_texelSize * 2.0);
  b = dot(s.rgb, vec3(0.2126, 0.7152, 0.0722));
  c = smoothstep(0.3, 0.8, b);
  sum += s * c * 0.12;

  s = texture2D(u_texture, v_uv + vec2(-1.0, 0.0) * u_texelSize * 2.0);
  b = dot(s.rgb, vec3(0.2126, 0.7152, 0.0722));
  c = smoothstep(0.3, 0.8, b);
  sum += s * c * 0.15;

  s = texture2D(u_texture, v_uv);
  b = dot(s.rgb, vec3(0.2126, 0.7152, 0.0722));
  c = smoothstep(0.3, 0.8, b);
  sum += s * c * 0.18;

  s = texture2D(u_texture, v_uv + vec2(1.0, 0.0) * u_texelSize * 2.0);
  b = dot(s.rgb, vec3(0.2126, 0.7152, 0.0722));
  c = smoothstep(0.3, 0.8, b);
  sum += s * c * 0.15;

  s = texture2D(u_texture, v_uv + vec2(2.0, 0.0) * u_texelSize * 2.0);
  b = dot(s.rgb, vec3(0.2126, 0.7152, 0.0722));
  c = smoothstep(0.3, 0.8, b);
  sum += s * c * 0.12;

  s = texture2D(u_texture, v_uv + vec2(3.0, 0.0) * u_texelSize * 2.0);
  b = dot(s.rgb, vec3(0.2126, 0.7152, 0.0722));
  c = smoothstep(0.3, 0.8, b);
  sum += s * c * 0.09;

  s = texture2D(u_texture, v_uv + vec2(4.0, 0.0) * u_texelSize * 2.0);
  b = dot(s.rgb, vec3(0.2126, 0.7152, 0.0722));
  c = smoothstep(0.3, 0.8, b);
  sum += s * c * 0.05;

  gl_FragColor = sum * u_bloomIntensity;
}
`;

// Final composite: original + bloom + vignette + color grading
const COMPOSITE_FRAGMENT = `
precision mediump float;
varying vec2 v_uv;
uniform sampler2D u_scene;
uniform sampler2D u_bloom;
uniform float u_vignetteStrength;

void main() {
  vec4 scene = texture2D(u_scene, v_uv);
  vec4 bloom = texture2D(u_bloom, v_uv);

  // Additive bloom
  vec3 color = scene.rgb + bloom.rgb * 0.6;

  // Subtle color grading: blue shift for distant center, warm for near edges
  float distFromCenter = length(v_uv - vec2(0.5)) * 2.0;
  color.b += (1.0 - distFromCenter) * 0.008;
  color.r += distFromCenter * 0.005;

  // Vignette
  float vignette = 1.0 - distFromCenter * distFromCenter * u_vignetteStrength;
  color *= max(0.0, vignette);

  gl_FragColor = vec4(color, 1.0);
}
`;

// ============================================================================
// System
// ============================================================================

export class BloomPass implements RenderSystem {
  private bloomProgram: WebGLProgram | null = null;
  private compositeProgram: WebGLProgram | null = null;
  private quadBuffer: WebGLBuffer | null = null;
  private bloomPositionLocation = -1;
  private compositePositionLocation = -1;
  private bloomUniforms: {
    texture: WebGLUniformLocation | null;
    texelSize: WebGLUniformLocation | null;
    bloomIntensity: WebGLUniformLocation | null;
  } = { texture: null, texelSize: null, bloomIntensity: null };
  private compositeUniforms: {
    scene: WebGLUniformLocation | null;
    bloom: WebGLUniformLocation | null;
    vignetteStrength: WebGLUniformLocation | null;
  } = { scene: null, bloom: null, vignetteStrength: null };

  // Framebuffers and textures
  private sceneFb: WebGLFramebuffer | null = null;
  private sceneTexture: WebGLTexture | null = null;
  private bloomFb: WebGLFramebuffer | null = null;
  private bloomTexture: WebGLTexture | null = null;

  private width = 0;
  private height = 0;
  private enabled = true;

  get framebuffer(): WebGLFramebuffer | null {
    return this.sceneFb;
  }

  get isEnabled(): boolean {
    return this.enabled;
  }

  init(gl: WebGLRenderingContext, width: number, height: number, _config: SpaceConfig): void {
    this.width = width;
    this.height = height;

    try {
      // Quad buffer
      this.quadBuffer = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, this.quadBuffer);
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
        -1, -1, 1, -1, -1, 1,
        1, -1, 1, 1, -1, 1,
      ]), gl.STATIC_DRAW);

      // Compile programs
      this.bloomProgram = this.buildProgram(gl, QUAD_VERTEX, BLOOM_FRAGMENT);
      this.compositeProgram = this.buildProgram(gl, QUAD_VERTEX, COMPOSITE_FRAGMENT);

      if (!this.bloomProgram || !this.compositeProgram) {
        this.enabled = false;
        return;
      }

      this.bloomPositionLocation = gl.getAttribLocation(this.bloomProgram, 'a_position');
      this.compositePositionLocation = gl.getAttribLocation(this.compositeProgram, 'a_position');
      this.bloomUniforms = {
        texture: gl.getUniformLocation(this.bloomProgram, 'u_texture'),
        texelSize: gl.getUniformLocation(this.bloomProgram, 'u_texelSize'),
        bloomIntensity: gl.getUniformLocation(this.bloomProgram, 'u_bloomIntensity'),
      };
      this.compositeUniforms = {
        scene: gl.getUniformLocation(this.compositeProgram, 'u_scene'),
        bloom: gl.getUniformLocation(this.compositeProgram, 'u_bloom'),
        vignetteStrength: gl.getUniformLocation(this.compositeProgram, 'u_vignetteStrength'),
      };

      this.createFramebuffers(gl, width, height);
    } catch {
      this.enabled = false;
    }
  }

  private createFramebuffers(gl: WebGLRenderingContext, width: number, height: number): void {
    // Cleanup old
    if (this.sceneTexture) gl.deleteTexture(this.sceneTexture);
    if (this.sceneFb) gl.deleteFramebuffer(this.sceneFb);
    if (this.bloomTexture) gl.deleteTexture(this.bloomTexture);
    if (this.bloomFb) gl.deleteFramebuffer(this.bloomFb);

    // Scene framebuffer (full resolution)
    this.sceneTexture = this.createFbTexture(gl, width, height);
    this.sceneFb = gl.createFramebuffer();
    gl.bindFramebuffer(gl.FRAMEBUFFER, this.sceneFb);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, this.sceneTexture, 0);

    // Check framebuffer completeness
    if (gl.checkFramebufferStatus(gl.FRAMEBUFFER) !== gl.FRAMEBUFFER_COMPLETE) {
      this.enabled = false;
      gl.bindFramebuffer(gl.FRAMEBUFFER, null);
      return;
    }

    // Bloom framebuffer (half resolution for performance)
    const bw = Math.max(1, Math.floor(width / 2));
    const bh = Math.max(1, Math.floor(height / 2));
    this.bloomTexture = this.createFbTexture(gl, bw, bh);
    this.bloomFb = gl.createFramebuffer();
    gl.bindFramebuffer(gl.FRAMEBUFFER, this.bloomFb);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, this.bloomTexture, 0);

    if (gl.checkFramebufferStatus(gl.FRAMEBUFFER) !== gl.FRAMEBUFFER_COMPLETE) {
      this.enabled = false;
    }

    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
  }

  private createFbTexture(gl: WebGLRenderingContext, width: number, height: number): WebGLTexture | null {
    const tex = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, width, height, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    return tex;
  }

  resize(gl: WebGLRenderingContext, width: number, height: number): void {
    this.width = width;
    this.height = height;
    if (this.enabled) {
      this.createFramebuffers(gl, width, height);
    }
  }

  update(_time: number, _deltaTime: number): void {
    // No per-frame state needed
  }

  /** Call this before rendering all other systems */
  beginSceneCapture(gl: WebGLRenderingContext): void {
    if (!this.enabled || !this.sceneFb) return;
    gl.bindFramebuffer(gl.FRAMEBUFFER, this.sceneFb);
    gl.viewport(0, 0, this.width, this.height);
    gl.clearColor(0.01, 0.01, 0.025, 1.0);
    gl.clear(gl.COLOR_BUFFER_BIT);
  }

  /** Call this after all systems have rendered to apply bloom + composite */
  render(gl: WebGLRenderingContext): void {
    if (!this.enabled || !this.bloomProgram || !this.compositeProgram) return;

    // --- Pass 1: Blur bright parts into bloom framebuffer ---
    gl.bindFramebuffer(gl.FRAMEBUFFER, this.bloomFb);
    const bw = Math.max(1, Math.floor(this.width / 2));
    const bh = Math.max(1, Math.floor(this.height / 2));
    gl.viewport(0, 0, bw, bh);
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT);

    gl.useProgram(this.bloomProgram);
    gl.disable(gl.BLEND);

    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, this.sceneTexture);
    gl.uniform1i(this.bloomUniforms.texture, 0);
    gl.uniform2f(this.bloomUniforms.texelSize, 1.0 / bw, 1.0 / bh);
    gl.uniform1f(this.bloomUniforms.bloomIntensity, 1.5);

    this.drawQuad(gl, this.bloomPositionLocation);

    // --- Pass 2: Composite scene + bloom to screen ---
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.viewport(0, 0, this.width, this.height);

    gl.useProgram(this.compositeProgram);

    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, this.sceneTexture);
    gl.uniform1i(this.compositeUniforms.scene, 0);

    gl.activeTexture(gl.TEXTURE1);
    gl.bindTexture(gl.TEXTURE_2D, this.bloomTexture);
    gl.uniform1i(this.compositeUniforms.bloom, 1);

    gl.uniform1f(this.compositeUniforms.vignetteStrength, 0.3);

    this.drawQuad(gl, this.compositePositionLocation);

    gl.enable(gl.BLEND);
  }

  private drawQuad(gl: WebGLRenderingContext, positionLocation: number): void {
    if (positionLocation < 0) return;
    gl.bindBuffer(gl.ARRAY_BUFFER, this.quadBuffer);
    gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(positionLocation);
    gl.drawArrays(gl.TRIANGLES, 0, 6);
  }

  private buildProgram(gl: WebGLRenderingContext, vsSrc: string, fsSrc: string): WebGLProgram | null {
    const vs = compileShader(gl, gl.VERTEX_SHADER, vsSrc);
    const fs = compileShader(gl, gl.FRAGMENT_SHADER, fsSrc);
    if (!vs || !fs) return null;

    const prog = gl.createProgram();
    if (!prog) return null;

    gl.attachShader(prog, vs);
    gl.attachShader(prog, fs);
    gl.linkProgram(prog);

    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
      return null;
    }
    return prog;
  }

  dispose(gl: WebGLRenderingContext): void {
    if (this.sceneTexture) gl.deleteTexture(this.sceneTexture);
    if (this.sceneFb) gl.deleteFramebuffer(this.sceneFb);
    if (this.bloomTexture) gl.deleteTexture(this.bloomTexture);
    if (this.bloomFb) gl.deleteFramebuffer(this.bloomFb);
    if (this.quadBuffer) gl.deleteBuffer(this.quadBuffer);
    if (this.bloomProgram) gl.deleteProgram(this.bloomProgram);
    if (this.compositeProgram) gl.deleteProgram(this.compositeProgram);
    this.bloomPositionLocation = -1;
    this.compositePositionLocation = -1;
    this.bloomUniforms = { texture: null, texelSize: null, bloomIntensity: null };
    this.compositeUniforms = { scene: null, bloom: null, vignetteStrength: null };
  }
}

function compileShader(gl: WebGLRenderingContext, type: number, source: string): WebGLShader | null {
  const shader = gl.createShader(type);
  if (!shader) return null;
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    gl.deleteShader(shader);
    return null;
  }
  return shader;
}
