/**
 * ResourceManager — WebGL resource lifecycle management
 * Handles shader compilation, program creation, buffer/texture management, and cleanup.
 */

export interface ProgramInfo {
  program: WebGLProgram;
  vertexShader: WebGLShader;
  fragmentShader: WebGLShader;
}

export class ResourceManager {
  private programs: ProgramInfo[] = [];
  private buffers: WebGLBuffer[] = [];
  private textures: WebGLTexture[] = [];
  private framebuffers: WebGLFramebuffer[] = [];

  createShader(gl: WebGLRenderingContext, type: number, source: string): WebGLShader | null {
    const shader = gl.createShader(type);
    if (!shader) return null;

    gl.shaderSource(shader, source);
    gl.compileShader(shader);

    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      console.warn('Shader compile error: ' + (gl.getShaderInfoLog(shader) || ''));
      gl.deleteShader(shader);
      return null;
    }

    return shader;
  }

  createProgram(gl: WebGLRenderingContext, vertexSource: string, fragmentSource: string): ProgramInfo | null {
    const vertexShader = this.createShader(gl, gl.VERTEX_SHADER, vertexSource);
    const fragmentShader = this.createShader(gl, gl.FRAGMENT_SHADER, fragmentSource);
    if (!vertexShader || !fragmentShader) return null;

    const program = gl.createProgram();
    if (!program) return null;

    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);

    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      console.warn('Program link error: ' + (gl.getProgramInfoLog(program) || ''));
      gl.deleteProgram(program);
      gl.deleteShader(vertexShader);
      gl.deleteShader(fragmentShader);
      return null;
    }

    const info: ProgramInfo = { program, vertexShader, fragmentShader };
    this.programs.push(info);
    return info;
  }

  createBuffer(gl: WebGLRenderingContext, data: Float32Array, usage: number = gl.STATIC_DRAW): WebGLBuffer | null {
    const buffer = gl.createBuffer();
    if (!buffer) return null;

    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, data, usage);
    this.buffers.push(buffer);
    return buffer;
  }

  createTexture(gl: WebGLRenderingContext, width: number, height: number, data: Uint8Array | null, params?: {
    minFilter?: number;
    magFilter?: number;
    wrapS?: number;
    wrapT?: number;
    format?: number;
  }): WebGLTexture | null {
    const texture = gl.createTexture();
    if (!texture) return null;

    const format = params?.format ?? gl.RGBA;

    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texImage2D(gl.TEXTURE_2D, 0, format, width, height, 0, format, gl.UNSIGNED_BYTE, data);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, params?.minFilter ?? gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, params?.magFilter ?? gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, params?.wrapS ?? gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, params?.wrapT ?? gl.CLAMP_TO_EDGE);

    this.textures.push(texture);
    return texture;
  }

  createFramebuffer(gl: WebGLRenderingContext, texture: WebGLTexture): WebGLFramebuffer | null {
    const fb = gl.createFramebuffer();
    if (!fb) return null;

    gl.bindFramebuffer(gl.FRAMEBUFFER, fb);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, texture, 0);
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);

    this.framebuffers.push(fb);
    return fb;
  }

  dispose(gl: WebGLRenderingContext): void {
    for (const fb of this.framebuffers) gl.deleteFramebuffer(fb);
    for (const tex of this.textures) gl.deleteTexture(tex);
    for (const buf of this.buffers) gl.deleteBuffer(buf);
    for (const p of this.programs) {
      gl.detachShader(p.program, p.vertexShader);
      gl.detachShader(p.program, p.fragmentShader);
      gl.deleteShader(p.vertexShader);
      gl.deleteShader(p.fragmentShader);
      gl.deleteProgram(p.program);
    }
    this.framebuffers = [];
    this.textures = [];
    this.buffers = [];
    this.programs = [];

    const ext = gl.getExtension('WEBGL_lose_context');
    if (ext) ext.loseContext();
  }
}
