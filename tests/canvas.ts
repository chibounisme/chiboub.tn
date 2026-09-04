import { vi } from 'vitest';

interface Pixel {
  x: number;
  y: number;
  width: number;
  height: number;
  color: string;
}

export function recordingContext() {
  let pixels: Pixel[] = [];
  let paints = 0;
  const context = {
    fillStyle: '',
    globalAlpha: 1,
    imageSmoothingEnabled: false,
    clearRect() {
      pixels = [];
      paints++;
    },
    fillRect(x: number, y: number, width: number, height: number) {
      pixels.push({ x, y, width, height, color: this.fillStyle });
    },
  };
  return {
    context: context as unknown as CanvasRenderingContext2D,
    pixels: () => pixels,
    paints: () => paints,
  };
}

export function skyHarness(width = 580, height = 400) {
  let size = { width, height };
  let time = 0;
  let nextId = 0;
  const frames = new Map<number, FrameRequestCallback>();
  const recorder = recordingContext();
  let onResize: ResizeObserverCallback | undefined;
  const disconnect = vi.fn();
  const observer: ResizeObserver = {
    observe: vi.fn(),
    unobserve: vi.fn(),
    disconnect,
  };
  class TestResizeObserver implements ResizeObserver {
    constructor(callback: ResizeObserverCallback) {
      onResize = callback;
    }
    observe = vi.fn();
    unobserve = vi.fn();
    disconnect = disconnect;
  }
  vi.stubGlobal('ResizeObserver', TestResizeObserver);
  vi.stubGlobal('requestAnimationFrame', (callback: FrameRequestCallback) => {
    const id = ++nextId;
    frames.set(id, callback);
    return id;
  });
  vi.stubGlobal('cancelAnimationFrame', (id: number) => frames.delete(id));
  const visibility = vi.spyOn(document, 'hidden', 'get').mockReturnValue(false);
  const root = document.createElement('div');
  const canvas = document.createElement('canvas');
  root.append(canvas);
  document.body.append(root);
  vi.spyOn(root, 'getBoundingClientRect').mockImplementation(
    () => new DOMRect(0, 0, size.width, size.height),
  );
  vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(
    recorder.context,
  );
  Object.defineProperty(Range.prototype, 'getClientRects', {
    configurable: true,
    value: () => [],
  });

  return {
    ...recorder,
    root,
    canvas,
    visibility,
    disconnect,
    pendingFrames: () => frames.size,
    advance(milliseconds = 50) {
      for (let elapsed = 0; elapsed < milliseconds; elapsed += 50) {
        time += 50;
        const callbacks = [...frames.values()];
        frames.clear();
        callbacks.forEach((callback) => callback(time));
      }
    },
    resize(nextWidth: number, nextHeight: number) {
      size = { width: nextWidth, height: nextHeight };
      onResize?.([], observer);
    },
  };
}
