import { useEffect, useRef } from 'react';
import { drawPlanet } from './planet';

export default function PixelPlanet() {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const context = ref.current?.getContext('2d');
    if (context) drawPlanet(context);
  }, []);
  return (
    <div className="pixel-planet" aria-hidden="true">
      <canvas ref={ref} width={400} height={340} />
    </div>
  );
}
