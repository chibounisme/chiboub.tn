import { StrictMode, useRef } from 'react';
import { render } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  createSky,
  createStars,
  type SkyController,
} from '../src/components/space/sky';
import PixelSky from '../src/components/space/PixelSky';
import PixelPlanet from '../src/components/space/PixelPlanet';
import PixelMoon from '../src/components/space/PixelMoon';
import { skyHarness } from './canvas';

let controller: SkyController | undefined;
afterEach(() => {
  controller?.destroy();
  controller = undefined;
  document.body.replaceChildren();
});

describe('star placement', () => {
  it('maintains equal density in every quadrant with no planet-specific cluster', () => {
    const stars = createStars(580, 580);
    const counts = [0, 0, 0, 0];
    for (const star of stars) {
      const quadrant = (star.x >= 290 ? 1 : 0) + (star.y >= 290 ? 2 : 0);
      counts[quadrant] = (counts[quadrant] ?? 0) + 1;
    }
    expect(counts).toEqual([100, 100, 100, 100]);
    expect(
      new Set(
        stars.map(
          (star) => `${Math.floor(star.x / 29)},${Math.floor(star.y / 29)}`,
        ),
      ).size,
    ).toBe(stars.length);
  });

  it('preserves existing star positions when the page gets longer', () => {
    expect(createStars(580, 1160).filter((star) => star.y < 580)).toEqual(
      createStars(580, 580),
    );
  });

  it.each([
    [1, 1],
    [160, 370],
    [195, 422],
    [721, 503],
  ])('keeps all stars within a %s by %s sky', (width, height) => {
    for (const star of createStars(width, height)) {
      expect(star.x).toBeGreaterThanOrEqual(0);
      expect(star.x).toBeLessThan(width);
      expect(star.y).toBeGreaterThanOrEqual(0);
      expect(star.y).toBeLessThan(height);
    }
  });
});

describe('sky lifecycle', () => {
  it('stops work when paused or hidden, resumes once, and cleans up completely', async () => {
    const h = skyHarness();
    controller = createSky(h.canvas, h.root);
    await Promise.resolve();
    h.advance();
    expect(h.pendingFrames()).toBe(0);
    controller.setPlaying(true);
    h.advance(200);
    const playingPaints = h.paints();
    expect(h.pendingFrames()).toBe(1);
    controller.setPlaying(false);
    const pausedPaints = h.paints();
    h.advance(500);
    expect(h.paints()).toBe(pausedPaints);
    expect(pausedPaints).toBeGreaterThan(playingPaints);
    controller.setPlaying(true);
    h.visibility.mockReturnValue(true);
    document.dispatchEvent(new Event('visibilitychange'));
    expect(h.pendingFrames()).toBe(0);
    h.visibility.mockReturnValue(false);
    document.dispatchEvent(new Event('visibilitychange'));
    expect(h.pendingFrames()).toBe(1);
    controller.destroy();
    controller.destroy();
    expect(h.pendingFrames()).toBe(0);
    expect(h.disconnect).toHaveBeenCalled();
    const finalPaints = h.paints();
    document.dispatchEvent(new Event('visibilitychange'));
    h.root.dispatchEvent(new Event('load'));
    controller.refresh();
    h.advance(500);
    expect(h.paints()).toBe(finalPaints);
    expect(h.pendingFrames()).toBe(0);
  });

  it('coalesces resize work and covers the complete article height', async () => {
    const h = skyHarness();
    controller = createSky(h.canvas, h.root);
    await Promise.resolve();
    h.advance();
    h.resize(390, 2400);
    controller.refresh();
    controller.refresh();
    expect(h.pendingFrames()).toBe(1);
    h.advance();
    expect(h.canvas.width).toBe(195);
    expect(h.canvas.height).toBe(1200);
    expect(h.pendingFrames()).toBe(0);
  });

  it('keeps stars and ambient objects away from readable text', () => {
    const h = skyHarness();
    const text = document.createElement('p');
    text.textContent = 'Read this';
    h.root.append(text);
    Object.defineProperty(Range.prototype, 'getClientRects', {
      configurable: true,
      value: () => [new DOMRect(0, 0, 580, 400)],
    });
    controller = createSky(h.canvas, h.root);
    expect(h.pixels()).toHaveLength(0);
    controller.setPlaying(true);
    h.advance(15000);
    expect(h.pixels()).toHaveLength(0);
  });

  it('masks the planet itself without suppressing the surrounding sky', () => {
    const h = skyHarness(800, 680);
    const planet = document.createElement('div');
    planet.className = 'pixel-planet';
    const canvas = document.createElement('canvas');
    planet.append(canvas);
    h.root.append(planet);
    vi.spyOn(canvas, 'getBoundingClientRect').mockReturnValue(
      new DOMRect(0, 0, 400, 340),
    );
    controller = createSky(h.canvas, h.root);
    expect(h.pixels().length).toBeGreaterThan(100);
    expect(
      h
        .pixels()
        .filter((pixel) => Math.hypot(pixel.x - 120.5, pixel.y - 70) < 44),
    ).toHaveLength(0);
  });

  it('updates text exclusion after layout refresh without measuring text every frame', async () => {
    const h = skyHarness();
    const text = document.createElement('p');
    text.textContent = 'An article';
    h.root.append(text);
    const rects = vi.spyOn(Range.prototype, 'getClientRects');
    controller = createSky(h.canvas, h.root);
    await Promise.resolve();
    h.advance();
    expect(h.pixels().length).toBeGreaterThan(0);
    controller.setPlaying(true);
    const measurements = rects.mock.calls.length;
    h.advance(1000);
    expect(rects).toHaveBeenCalledTimes(measurements);
    rects.mockReturnValue([
      new DOMRect(0, 0, 580, 400),
    ] as unknown as DOMRectList);
    controller.refresh();
    h.advance();
    expect(h.pixels()).toHaveLength(0);
    rects.mockReturnValue([] as unknown as DOMRectList);
    controller.refresh();
    h.advance();
    expect(h.pixels().length).toBeGreaterThan(0);
  });

  it('runs varied ambient events without accumulating animation loops', () => {
    let seed = 34;
    vi.spyOn(Math, 'random').mockImplementation(() => {
      seed = (seed * 16807) % 2147483647;
      return (seed - 1) / 2147483646;
    });
    const h = skyHarness();
    controller = createSky(h.canvas, h.root);
    controller.setPlaying(true);
    h.advance(90000);
    expect(h.pendingFrames()).toBe(1);
    expect(h.paints()).toBeGreaterThan(1000);
    expect(
      h
        .pixels()
        .every((pixel) => Number.isFinite(pixel.x) && Number.isFinite(pixel.y)),
    ).toBe(true);
  });

  it('supports browsers where a canvas context is unavailable', () => {
    const root = document.createElement('div');
    const canvas = document.createElement('canvas');
    controller = createSky(canvas, root);
    expect(() => {
      controller?.setPlaying(true);
      controller?.refresh();
      controller?.destroy();
    }).not.toThrow();
  });

  it('does not leak work through React Strict Mode mounts and route changes', async () => {
    const h = skyHarness();
    function Host({
      routeKey,
      playing,
    }: {
      routeKey: string;
      playing: boolean;
    }) {
      const ref = useRef<HTMLDivElement>(null);
      return (
        <div ref={ref}>
          <PixelSky containerRef={ref} routeKey={routeKey} playing={playing} />
          <PixelPlanet />
          <PixelMoon />
        </div>
      );
    }
    const view = render(
      <StrictMode>
        <Host routeKey="/" playing />
      </StrictMode>,
    );
    await Promise.resolve();
    h.advance();
    const sky = view.container.querySelector('.pixel-sky');
    view.rerender(
      <StrictMode>
        <Host routeKey="/about" playing={false} />
      </StrictMode>,
    );
    h.advance();
    expect(view.container.querySelector('.pixel-sky')).toBe(sky);
    expect(h.pendingFrames()).toBe(0);
    view.unmount();
    expect(h.pendingFrames()).toBe(0);
    expect(h.disconnect).toHaveBeenCalledTimes(2);
  });
});
