import './Brand.css';

/** Símbolo do LUMINA: um eclipse com um ponto de luz (anel de diamante) e uma estrela de quatro pontas. */
export function LuminaMark({ size = 28, className = '' }: { size?: number; className?: string }) {
  return (
    <svg className={`lumina-mark ${className}`} width={size} height={size} viewBox="0 0 40 40" aria-hidden="true">
      <circle cx="20" cy="20" r="13" fill="none" stroke="currentColor" strokeWidth="0.8" opacity="0.45" />
      <circle cx="20" cy="20" r="9.2" fill="currentColor" />
      <circle cx="21.1" cy="19.4" r="8.8" fill="var(--obsidian)" />
      <circle cx="26.6" cy="13.6" r="1.4" fill="var(--ivory)" />
      <path d="M20 1.5 L20.9 5 L20 8.5 L19.1 5 Z M20 31.5 L20.9 35 L20 38.5 L19.1 35 Z" fill="currentColor" opacity="0.7" />
    </svg>
  );
}

/** Divisor inspirado em mapas celestes: linha fina, marcas de grau e uma estrela ao centro. */
export function CelestialDivider({ className = '' }: { className?: string }) {
  return (
    <svg className={`celestial-divider ${className}`} viewBox="0 0 240 16" aria-hidden="true">
      <line x1="0" y1="8" x2="104" y2="8" stroke="currentColor" strokeWidth="0.6" />
      <line x1="136" y1="8" x2="240" y2="8" stroke="currentColor" strokeWidth="0.6" />
      {[20, 44, 68, 92, 148, 172, 196, 220].map((x) => (
        <line key={x} x1={x} y1="5.5" x2={x} y2="10.5" stroke="currentColor" strokeWidth="0.6" opacity="0.7" />
      ))}
      <circle cx="112" cy="8" r="1.2" fill="currentColor" />
      <circle cx="128" cy="8" r="1.2" fill="currentColor" />
      <path d="M120 1 L121.6 6.4 L127 8 L121.6 9.6 L120 15 L118.4 9.6 L113 8 L118.4 6.4 Z" fill="currentColor" />
    </svg>
  );
}

/** Estrela de quatro pontas usada em marcações e indicadores. */
export function Sparkle({ size = 12, className = '' }: { size?: number; className?: string }) {
  return (
    <svg className={className} width={size} height={size} viewBox="0 0 12 12" aria-hidden="true">
      <path d="M6 0 L7.1 4.9 L12 6 L7.1 7.1 L6 12 L4.9 7.1 L0 6 L4.9 4.9 Z" fill="currentColor" />
    </svg>
  );
}
