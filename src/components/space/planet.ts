export function drawPlanet(context: CanvasRenderingContext2D) {
  const base = '#101310',
    light = '#d2d7be',
    mid = '#8f9a7d',
    shade = '#485242';
  const bayer = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5];
  context.clearRect(0, 0, 400, 340);
  context.imageSmoothingEnabled = false;
  let seed = 91102310;
  const random = () => {
    seed = (seed * 16807) % 2147483647;
    return (seed - 1) / 2147483646;
  };
  const dot = (x: number, y: number, color: string, size = 1) => {
    context.fillStyle = color;
    context.fillRect(Math.round(x), Math.round(y), size, size);
  };

  const cx = 241,
    cy = 140,
    radius = 94;
  const craters = Array.from({ length: 31 }, () => ({
    x: random() * 1.8 - 0.9,
    y: random() * 1.8 - 0.9,
    r: 0.025 + random() * 0.14,
  }));
  const pixelStep = 1.5;
  for (let py = -radius; py <= radius; py += pixelStep) {
    for (let px = -radius; px <= radius; px += pixelStep) {
      const nx = px / radius,
        ny = py / radius,
        distance = nx * nx + ny * ny;
      if (distance > 1) continue;
      const nz = Math.sqrt(1 - distance);
      const lighting = Math.max(0, -nx * 0.69 - ny * 0.48 + nz * 0.41);
      let terrain =
        0.06 * Math.sin(nx * 36 + ny * 17) +
        0.04 * Math.sin(nx * 67 - ny * 25) +
        0.03 * Math.sin(nx * 136 + ny * 99);
      for (const crater of craters) {
        const d = Math.hypot(nx - crater.x, ny - crater.y) / crater.r;
        if (d < 1.35) {
          terrain -= 0.21 * Math.exp(-d * d * 2);
          terrain += 0.22 * Math.exp(-Math.pow((d - 0.91) * 8, 2));
        }
      }
      const noise = (random() - 0.5) * 0.13;
      const luminosity = Math.max(
        0,
        Math.min(1, lighting * 0.93 + terrain + noise),
      );
      const threshold =
        (bayer[
          (Math.floor(py + radius) % 4) * 4 + (Math.floor(px + radius) % 4)
        ] ?? 0) / 16;
      let color: string;
      if (luminosity > 0.7)
        color = threshold < (luminosity - 0.7) / 0.3 ? light : mid;
      else if (luminosity > 0.28)
        color = threshold < (luminosity - 0.28) / 0.42 ? mid : shade;
      else color = threshold < luminosity / 0.28 ? shade : base;
      if (nz < 0.08 && lighting > 0.6) color = light;
      dot(cx + px, cy + py, color, pixelStep);
    }
  }
  const orbit = (front: boolean) => {
    for (let t = 0; t < Math.PI * 2; t += 0.006) {
      const u = 149 * Math.cos(t),
        v = 47 * Math.sin(t),
        angle = -0.57;
      const x = cx + u * Math.cos(angle) - v * Math.sin(angle);
      const y = cy + u * Math.sin(angle) + v * Math.cos(angle);
      if (front && Math.sin(t) < 0.2) continue;
      if (!front && Math.hypot(x - cx, y - cy) < radius + 3) continue;
      if (Math.floor(t * 85) % 7 === 0) continue;
      dot(x, y, front ? mid : shade);
    }
  };
  orbit(false);
  orbit(true);
}
