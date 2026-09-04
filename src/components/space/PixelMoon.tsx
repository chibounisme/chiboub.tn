import { useEffect, useRef } from 'react';

export default function PixelMoon() {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const context = ref.current?.getContext('2d');
    if (!context) return;
    context.clearRect(0, 0, 16, 16);
    context.fillStyle = '#d8dfb9';
    for (let y = 0; y < 16; y++) {
      for (let x = 0; x < 16; x++) {
        if (
          (x - 7.5) ** 2 + (y - 7.5) ** 2 < 43 &&
          (x - 10) ** 2 + (y - 5) ** 2 >= 35
        ) {
          context.fillRect(x, y, 1, 1);
        }
      }
    }
  }, []);
  return (
    <canvas
      ref={ref}
      className="pixel-moon"
      width={16}
      height={16}
      aria-hidden="true"
    />
  );
}
