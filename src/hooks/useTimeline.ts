import { useCallback, useEffect, useRef } from 'react';

/**
 * Agenda passos de uma cena (setTimeout) e cancela tudo ao desmontar.
 * Mantém as sequências cinematográficas legíveis e sem vazamentos.
 */
export function useTimeline() {
  const timers = useRef<number[]>([]);

  const at = useCallback((ms: number, fn: () => void) => {
    const id = window.setTimeout(fn, ms);
    timers.current.push(id);
    return id;
  }, []);

  const clear = useCallback(() => {
    timers.current.forEach((id) => window.clearTimeout(id));
    timers.current = [];
  }, []);

  useEffect(() => clear, [clear]);

  return { at, clear };
}
