interface Rect {
  x: number;
  y: number;
  width: number;
  height: number;
}
interface Planet {
  x: number;
  y: number;
  radiusX: number;
  radiusY: number;
}
interface Star {
  x: number;
  y: number;
  brightness: number;
  phase: number;
  period: number;
  glint: boolean;
  size: number;
}
interface Visitor {
  x: number;
  y: number;
  kind: number;
  born: number;
  duration: number;
  phase: number;
  angle: number;
}
export interface SkyController {
  setPlaying: (playing: boolean) => void;
  refresh: () => void;
  destroy: () => void;
}

const PIXEL_SCALE = 2;
const CELL_SIZE = 29;

function hash(column: number, row: number, salt: number) {
  let value =
    Math.imul(column + 1, 374761393) ^ Math.imul(row + 1, 668265263) ^ salt;
  value = Math.imul(value ^ (value >>> 13), 1274126177);
  return ((value ^ (value >>> 16)) >>> 0) / 4294967296;
}

/** A jittered grid prevents clusters while keeping stars fixed across navigation. */
export function createStars(width: number, height: number): Star[] {
  const stars: Star[] = [];
  for (let row = 0; row < Math.ceil(height / CELL_SIZE); row++) {
    for (let column = 0; column < Math.ceil(width / CELL_SIZE); column++) {
      const x = (column + 0.16 + hash(column, row, 17) * 0.68) * CELL_SIZE;
      const y = (row + 0.16 + hash(column, row, 41) * 0.68) * CELL_SIZE;
      if (x >= width || y >= height) continue;
      stars.push({
        x,
        y,
        brightness: 0.16 + hash(column, row, 53) * 0.28,
        phase: hash(column, row, 73) * Math.PI * 2,
        period: 9 + hash(column, row, 97) * 14,
        glint: hash(column, row, 109) < 0.055,
        size: hash(column, row, 131) > 0.94 ? 2 : 1,
      });
    }
  }
  return stars;
}

export function createSky(
  canvas: HTMLCanvasElement,
  root: HTMLElement,
): SkyController {
  const maybeContext = canvas.getContext('2d');
  if (!maybeContext) return { setPlaying() {}, refresh() {}, destroy() {} };
  const context = maybeContext;
  let width = 1,
    height = 1,
    elapsed = 0,
    lastTime = 0,
    lastPaint = 0;
  let frameId = 0,
    measureId = 0,
    nextVisitor = 5;
  let playing = false,
    destroyed = false,
    initialized = false;
  let zones: Rect[] = [],
    planet: Planet | null = null,
    stars: Star[] = [],
    visibleStars: Star[] = [],
    visitors: Visitor[] = [];

  const textAt = (x: number, y: number, padding = 0) =>
    zones.some(
      (rect) =>
        x > rect.x - padding &&
        x < rect.x + rect.width + padding &&
        y > rect.y - padding &&
        y < rect.y + rect.height + padding,
    );
  const onPlanet = (x: number, y: number, padding = 0) =>
    planet !== null &&
    ((x - planet.x) / (planet.radiusX + padding)) ** 2 +
      ((y - planet.y) / (planet.radiusY + padding)) ** 2 <
      1;

  function dot(x: number, y: number, color: string, alpha = 1, size = 1) {
    context.globalAlpha = Math.max(0, Math.min(1, alpha));
    context.fillStyle = color;
    context.fillRect(Math.round(x), Math.round(y), size, size);
  }

  function sparkle(x: number, y: number, size: number, alpha: number) {
    dot(x, y, '#f0f1d1', alpha);
    for (let distance = 1; distance <= size; distance++) {
      const a = alpha * (1 - distance / (size + 1));
      dot(x + distance, y, '#cbd3af', a);
      dot(x - distance, y, '#cbd3af', a);
      dot(x, y + distance, '#cbd3af', a);
      dot(x, y - distance, '#cbd3af', a);
    }
  }

  function spawnVisitor(
    kind = Math.floor(Math.random() * 4),
    age = 0,
  ): Visitor | null {
    for (let attempt = 0; attempt < 80; attempt++) {
      const x = 12 + Math.random() * Math.max(1, width - 24);
      const y = 12 + Math.random() * Math.max(1, height - 24);
      if (textAt(x, y, 18) || onPlanet(x, y, 15)) continue;
      return {
        x: x / width,
        y: y / height,
        kind,
        born: elapsed - age,
        duration: 12 + Math.random() * 7,
        phase: Math.random() * Math.PI * 2,
        angle: Math.random() * Math.PI * 2,
      };
    }
    return null;
  }

  function drawVisitor(visitor: Visitor) {
    const age = elapsed - visitor.born;
    const fade = Math.min(1, age / 3, (visitor.duration - age) / 3);
    const x = visitor.x * width,
      y = visitor.y * height;
    if (fade <= 0 || textAt(x, y, 18) || onPlanet(x, y, 15)) return;
    const alpha = fade * 0.52;
    if (visitor.kind === 0) {
      for (let arm = 0; arm < 2; arm++) {
        for (let i = 0; i < 22; i++) {
          const radius = 1 + i * 0.28,
            angle = i * 0.25 + arm * Math.PI + visitor.angle;
          dot(
            x + Math.cos(angle) * radius,
            y + Math.sin(angle) * radius * 0.55,
            '#b4c2a0',
            alpha * (1 - i / 30),
          );
        }
      }
      dot(x, y, '#e3e6c9', alpha * 1.2, 2);
    } else if (visitor.kind === 1) {
      const dx = Math.cos(visitor.angle),
        dy = Math.sin(visitor.angle) * 0.6;
      for (let i = 0; i < 16; i++)
        dot(x - dx * i, y - dy * i, '#bdcdb2', alpha * (1 - i / 16) ** 2);
      sparkle(x, y, 2, alpha);
    } else if (visitor.kind === 2) {
      for (let yy = -3; yy <= 3; yy++) {
        for (let xx = -3; xx <= 3; xx++) {
          if (xx * xx + yy * yy <= 10)
            dot(x + xx, y + yy, xx + yy < 0 ? '#bcc5a2' : '#596b54', alpha);
        }
      }
      for (let i = -7; i <= 7; i++)
        if (Math.abs(i) > 3 || i < 0)
          dot(x + i, y - Math.round(i * 0.35), '#d5d8b4', alpha * 0.9);
    } else {
      (
        [
          [-7, 2],
          [-3, -3],
          [2, -1],
          [6, 4],
        ] as const
      ).forEach(([dx, dy], index) => {
        dot(x + dx, y + dy, '#ced7b4', alpha * (0.65 + index * 0.1));
        if (index === 1) sparkle(x + dx, y + dy, 1, alpha);
      });
    }
    const shine =
      Math.max(0, Math.sin(age * 0.55 + visitor.phase)) ** 12 * fade;
    if (shine > 0.025) sparkle(x, y, 4, shine * 0.75);
  }

  function draw() {
    if (destroyed) return;
    context.clearRect(0, 0, width, height);
    for (const star of visibleStars) {
      const phase = (elapsed * Math.PI * 2) / star.period + star.phase;
      dot(
        star.x,
        star.y,
        '#a8b997',
        star.brightness * (0.76 + 0.24 * Math.sin(phase)),
        star.size,
      );
      if (star.glint) {
        const glow = Math.max(0, Math.sin(phase)) ** 18;
        if (glow > 0.015) sparkle(star.x, star.y, 3, glow * 0.6);
      }
    }
    visitors.forEach(drawVisitor);
    context.globalAlpha = 1;
  }

  function measure() {
    measureId = 0;
    if (destroyed) return;
    const box = root.getBoundingClientRect();
    const nextWidth = Math.max(1, Math.ceil(box.width / PIXEL_SCALE));
    const nextHeight = Math.max(1, Math.ceil(box.height / PIXEL_SCALE));
    if (width !== nextWidth || height !== nextHeight) {
      width = nextWidth;
      height = nextHeight;
      canvas.width = width;
      canvas.height = height;
      context.imageSmoothingEnabled = false;
      stars = createStars(width, height);
    }
    zones = [];
    root
      .querySelectorAll(
        'p,h1,h2,h3,h4,h5,h6,li,dt,dd,figcaption,a,time,button,pre,td,th',
      )
      .forEach((element) => {
        if (
          element.classList.contains('sr-only') ||
          element.closest('[hidden]')
        )
          return;
        const range = document.createRange();
        range.selectNodeContents(element);
        for (const rect of range.getClientRects()) {
          if (rect.width && rect.height)
            zones.push({
              x: (rect.left - box.left) / PIXEL_SCALE,
              y: (rect.top - box.top) / PIXEL_SCALE,
              width: rect.width / PIXEL_SCALE,
              height: rect.height / PIXEL_SCALE,
            });
        }
      });
    const planetCanvas = root.querySelector('.pixel-planet canvas');
    if (planetCanvas) {
      const rect = planetCanvas.getBoundingClientRect();
      planet = {
        x: (rect.left - box.left + (rect.width * 241) / 400) / PIXEL_SCALE,
        y: (rect.top - box.top + (rect.height * 140) / 340) / PIXEL_SCALE,
        radiusX: (rect.width * 94) / 400 / PIXEL_SCALE,
        radiusY: (rect.height * 94) / 340 / PIXEL_SCALE,
      };
    } else planet = null;
    visibleStars = stars.filter(
      (star) => !textAt(star.x, star.y, 4) && !onPlanet(star.x, star.y),
    );
    if (!initialized) {
      visitors = [spawnVisitor(0, 5), spawnVisitor(2, 6)].filter(
        (visitor): visitor is Visitor => visitor !== null,
      );
      initialized = true;
    }
    draw();
  }

  function refresh() {
    if (destroyed) return;
    cancelAnimationFrame(measureId);
    measureId = requestAnimationFrame(measure);
  }

  function tick(now: number) {
    if (destroyed || !playing || document.hidden) {
      frameId = 0;
      lastTime = 0;
      return;
    }
    if (!lastTime) lastTime = now;
    elapsed += Math.min(0.1, (now - lastTime) / 1000);
    lastTime = now;
    if (now - lastPaint >= 45) {
      visitors = visitors.filter(
        (visitor) => elapsed - visitor.born < visitor.duration,
      );
      if (elapsed >= nextVisitor && visitors.length < 3) {
        const visitor = spawnVisitor();
        if (visitor) visitors.push(visitor);
        nextVisitor = elapsed + 5 + Math.random() * 5;
      }
      draw();
      lastPaint = now;
    }
    frameId = requestAnimationFrame(tick);
  }

  function sync() {
    cancelAnimationFrame(frameId);
    frameId = 0;
    lastTime = 0;
    if (!destroyed && playing && !document.hidden)
      frameId = requestAnimationFrame(tick);
    draw();
  }
  const animationEnded = (event: AnimationEvent) => {
    if (event.animationName === 'page-arrive') refresh();
  };
  const observer = new ResizeObserver(refresh);
  observer.observe(root);
  root.addEventListener('animationend', animationEnded);
  root.addEventListener('load', refresh, true);
  document.addEventListener('visibilitychange', sync);
  void document.fonts.ready.then(refresh);
  measure();

  return {
    setPlaying(value) {
      playing = value;
      sync();
    },
    refresh,
    destroy() {
      if (destroyed) return;
      destroyed = true;
      cancelAnimationFrame(frameId);
      cancelAnimationFrame(measureId);
      observer.disconnect();
      root.removeEventListener('animationend', animationEnded);
      root.removeEventListener('load', refresh, true);
      document.removeEventListener('visibilitychange', sync);
    },
  };
}
