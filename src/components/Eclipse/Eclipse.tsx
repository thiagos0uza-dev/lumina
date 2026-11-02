import './Eclipse.css';

export type EclipsePhase =
  /** Invisível: o céu ainda está escuro. */
  | 'hidden'
  /** A lua desliza sobre o sol e a coroa começa a aparecer. */
  | 'forming'
  /** Totalidade: coroa completa e respirando. */
  | 'full'
  /** Anel de diamante: clarão antes da aproximação da câmera. */
  | 'flare'
  /** Celebração final: coroa mais intensa e ampla. */
  | 'radiant';

interface EclipseProps {
  phase: EclipsePhase;
  className?: string;
}

/**
 * Eclipse solar feito apenas com camadas de CSS (gradientes radiais e cônicos),
 * leve o bastante para celulares intermediários.
 */
export function Eclipse({ phase, className = '' }: EclipseProps) {
  return (
    <div className={`eclipse ${className}`} data-phase={phase} aria-hidden="true">
      <div className="eclipse__halo" />
      <div className="eclipse__corona eclipse__corona--outer" />
      <div className="eclipse__corona eclipse__corona--inner" />
      <div className="eclipse__sun" />
      <div className="eclipse__rim" />
      <div className="eclipse__moon" />
      <div className="eclipse__bead" />
    </div>
  );
}
