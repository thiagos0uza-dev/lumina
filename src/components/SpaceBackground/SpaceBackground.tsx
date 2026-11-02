import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import { SpaceEngine } from '../../animations/SpaceEngine';
import { prefersReducedMotion, useReducedMotion } from '../../hooks/useReducedMotion';
import './SpaceBackground.css';

const SpaceContext = createContext<SpaceEngine | null>(null);

/** Acesso ao céu compartilhado a partir de qualquer capítulo. */
export function useSpace(): SpaceEngine {
  const engine = useContext(SpaceContext);
  if (!engine) throw new Error('useSpace precisa estar dentro de <SpaceProvider>');
  return engine;
}

/**
 * Um único céu para toda a jornada: o canvas nunca é recriado entre capítulos,
 * o que garante a sensação de um plano contínuo de câmera.
 */
export function SpaceProvider({ children }: { children: ReactNode }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [engine, setEngine] = useState<SpaceEngine | null>(null);
  const reduced = useReducedMotion();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const instance = new SpaceEngine(canvas, { reducedMotion: prefersReducedMotion() });
    instance.start();
    setEngine(instance);
    return () => instance.destroy();
  }, []);

  useEffect(() => {
    engine?.setReducedMotion(reduced);
  }, [engine, reduced]);

  return (
    <>
      <canvas ref={canvasRef} className="space-canvas" aria-hidden="true" />
      <div className="space-vignette" aria-hidden="true" />
      {engine && <SpaceContext.Provider value={engine}>{children}</SpaceContext.Provider>}
    </>
  );
}
