import { useEffect, useRef, type RefObject } from 'react';
import { createSky, type SkyController } from './sky';

interface Props {
  containerRef: RefObject<HTMLDivElement | null>;
  playing: boolean;
  routeKey: string;
}

export default function PixelSky({ containerRef, playing, routeKey }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const controllerRef = useRef<SkyController | null>(null);

  useEffect(() => {
    if (!canvasRef.current || !containerRef.current) return;
    const controller = createSky(canvasRef.current, containerRef.current);
    controllerRef.current = controller;
    return () => {
      controller.destroy();
      controllerRef.current = null;
    };
  }, [containerRef]);

  useEffect(() => {
    controllerRef.current?.setPlaying(playing);
  }, [playing, containerRef]);
  useEffect(() => {
    controllerRef.current?.refresh();
  }, [routeKey, containerRef]);

  return <canvas ref={canvasRef} className="pixel-sky" aria-hidden="true" />;
}
