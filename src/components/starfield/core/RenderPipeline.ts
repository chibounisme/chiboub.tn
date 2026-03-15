/**
 * RenderPipeline — Orchestrates rendering order and manages all render systems.
 * Single WebGL context, single animation loop, composable systems.
 */

import type { RenderSystem, SpaceConfig } from '../types';
import { ResourceManager } from './ResourceManager';

export class RenderPipeline {
  private systems: RenderSystem[] = [];
  private width = 0;
  private height = 0;
  readonly resources = new ResourceManager();

  addSystem(system: RenderSystem): void {
    this.systems.push(system);
  }

  init(gl: WebGLRenderingContext, width: number, height: number, config: SpaceConfig): void {
    this.width = width;
    this.height = height;
    for (const system of this.systems) {
      system.init(gl, width, height, config);
    }
  }

  resize(gl: WebGLRenderingContext, width: number, height: number): void {
    this.width = width;
    this.height = height;
    for (const system of this.systems) {
      system.resize(gl, width, height);
    }
  }

  update(time: number, deltaTime: number): void {
    for (const system of this.systems) {
      system.update(time, deltaTime);
    }
  }

  render(gl: WebGLRenderingContext): void {
    gl.viewport(0, 0, this.width, this.height);
    gl.clearColor(0.01, 0.01, 0.025, 1.0);
    gl.clear(gl.COLOR_BUFFER_BIT);

    for (const system of this.systems) {
      system.render(gl);
    }
  }

  dispose(gl: WebGLRenderingContext): void {
    for (const system of this.systems) {
      system.dispose(gl);
    }
    this.systems = [];
    this.resources.dispose(gl);
  }
}
