import { forwardRef, useMemo, type KeyboardEvent } from 'react';
import { birthday } from '../../config/birthday';
import { layoutWord, type WordStar } from '../../utils/constellation';
import { seeded } from '../../utils/math';

/** Área do mapa em unidades (a palavra ocupa x 0–378, y 0–100). */
export const ZOOM_LEVEL = 1.85;
export const VIEWBOX = { x: -34, y: -74, w: 446, h: 262 };
const ZOOM = ZOOM_LEVEL;

interface StarMapProps {
  discovered: ReadonlySet<number>;
  active: number | null;
  complete: boolean;
  /** Altura (em unidades do mapa) onde a estrela aproximada deve parar. */
  focusY: number;
  onSelect: (message: number) => void;
}

const word = layoutWord();

/** Estrelas de fundo do mapa: fixas (semente determinística) para a composição não mudar a cada visita. */
function useFieldStars() {
  return useMemo(() => {
    const rand = seeded(424242);
    return Array.from({ length: 70 }, () => ({
      x: VIEWBOX.x + rand() * VIEWBOX.w,
      y: VIEWBOX.y + rand() * VIEWBOX.h,
      r: 0.35 + rand() * 0.9,
      o: 0.15 + rand() * 0.45,
    }));
  }, []);
}

/**
 * O mapa celeste em SVG: graticulado, eclíptica, rótulos de coordenadas,
 * a constelação L-U-I-S-A e as cinco estrelas interativas.
 */
export const StarMap = forwardRef<SVGSVGElement, StarMapProps>(function StarMap(
  { discovered, active, complete, focusY, onSelect },
  ref,
) {
  const field = useFieldStars();
  const { stars: messages, constellation: texts, decor, birthDate } = birthday;

  const activeStar = active === null ? null : word.stars.find((s) => s.message === active) ?? null;
  const cameraStyle = activeStar
    ? {
        transform: `translate(${VIEWBOX.x + VIEWBOX.w / 2 - activeStar.x * ZOOM}px, ${
          focusY - activeStar.y * ZOOM
        }px) scale(${ZOOM})`,
      }
    : undefined;

  const onKey = (e: KeyboardEvent, message: number) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onSelect(message);
    }
  };

  const litLetter = (letter: number) => complete || discovered.has(letter);

  return (
    <svg
      ref={ref}
      className={`star-map ${complete ? 'is-complete' : ''} ${active !== null ? 'is-focused' : ''}`}
      viewBox={`${VIEWBOX.x} ${VIEWBOX.y} ${VIEWBOX.w} ${VIEWBOX.h}`}
      role="group"
      aria-label={texts.title}
    >
      <defs>
        <filter id="star-glow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="1.6" result="b" />
          <feMerge>
            <feMergeNode in="b" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
        <radialGradient id="star-halo">
          <stop offset="0%" stopColor="var(--champagne)" stopOpacity="0.7" />
          <stop offset="40%" stopColor="var(--amber)" stopOpacity="0.22" />
          <stop offset="100%" stopColor="var(--amber)" stopOpacity="0" />
        </radialGradient>
      </defs>

      <g className="star-map__camera" style={cameraStyle}>
        {/* Moldura e graticulado de mapa antigo */}
        <g className="star-map__chart" aria-hidden="true">
          <rect x={VIEWBOX.x + 6} y={VIEWBOX.y + 6} width={VIEWBOX.w - 12} height={VIEWBOX.h - 12} rx="2" />
          {[-10, 90, 189, 288, 388].map((x, i) => (
            <path key={x} d={`M ${x} ${VIEWBOX.y + 6} Q ${x + (i - 2) * 14} 60 ${x} ${VIEWBOX.y + VIEWBOX.h - 6}`} />
          ))}
          {[-40, 50, 140].map((y) => (
            <path key={y} d={`M ${VIEWBOX.x + 6} ${y} Q 189 ${y - 18} ${VIEWBOX.x + VIEWBOX.w - 6} ${y}`} />
          ))}
          <path className="star-map__ecliptic" d={`M ${VIEWBOX.x + 6} 150 Q 189 -70 ${VIEWBOX.x + VIEWBOX.w - 6} 128`} />
          {['6ʰ', '5ʰ 30ᵐ', '5ʰ', '4ʰ 30ᵐ', '4ʰ'].map((t, i) => (
            <text key={t} x={-10 + i * 99.5} y={VIEWBOX.y + 17} textAnchor="middle">
              {t}
            </text>
          ))}
          {['+30°', '+20°', '+10°'].map((t, i) => (
            <text key={t} x={VIEWBOX.x + 12} y={-37 + i * 90} textAnchor="start">
              {t}
            </text>
          ))}
          <circle className="star-map__compass" cx={VIEWBOX.x + VIEWBOX.w - 30} cy={VIEWBOX.y + 30} r="11" />
          <path
            className="star-map__compass-star"
            d={`M ${VIEWBOX.x + VIEWBOX.w - 30} ${VIEWBOX.y + 16} l 2 12 l -2 2 l -2 -2 Z`}
          />
        </g>

        {field.map((s, i) => (
          <circle key={i} className="star-map__field" cx={s.x} cy={s.y} r={s.r} opacity={s.o} />
        ))}

        <g className="star-map__constellation" filter="url(#star-glow)">
          {word.edges.map((e, i) => (
            <line
              key={i}
              className={`star-map__edge ${litLetter(e.letter) ? 'is-lit' : ''}`}
              x1={e.from.x}
              y1={e.from.y}
              x2={e.to.x}
              y2={e.to.y}
              style={{ animationDelay: `${(i % 12) * 0.08}s` }}
            />
          ))}
          {word.stars
            .filter((s) => s.message < 0)
            .map((s) => (
              <circle
                key={s.id}
                className={`star-map__node ${litLetter(s.letter) ? 'is-lit' : ''}`}
                cx={s.x}
                cy={s.y}
                r="1.9"
              />
            ))}
        </g>

        {word.stars
          .filter((s): s is WordStar => s.message >= 0)
          .map((s) => {
            const msg = messages[s.message];
            const found = discovered.has(s.message);
            const labelBelow = s.y < 50;
            return (
              <g
                key={s.id}
                className={`message-star ${found ? 'is-found' : ''} ${active === s.message ? 'is-active' : ''}`}
                transform={`translate(${s.x} ${s.y})`}
                role="button"
                tabIndex={active === null ? 0 : -1}
                aria-label={texts.starLabel(msg.number, msg.title, found)}
                data-message={s.message}
                onClick={() => onSelect(s.message)}
                onKeyDown={(e) => onKey(e, s.message)}
              >
                <circle className="message-star__hit" r="26" />
                <circle className="message-star__halo" r="20" fill="url(#star-halo)" />
                <circle className="message-star__ring" r="8.5" />
                <path className="message-star__core" d="M0 -6.5 L1.5 -1.5 L6.5 0 L1.5 1.5 L0 6.5 L-1.5 1.5 L-6.5 0 L-1.5 -1.5 Z" />
                <text className="message-star__label" y={labelBelow ? 22 : -15} textAnchor="middle">
                  {msg.number}
                </text>
              </g>
            );
          })}

        <text className="star-map__name" x="189" y="128" textAnchor="middle" aria-hidden="true">
          {birthday.name.toUpperCase()}
        </text>

        <g className="star-map__cartouche" aria-hidden="true">
          <text className="star-map__title" x="189" y="150" textAnchor="middle">
            {decor.mapTitle}
          </text>
          <text className="star-map__subtitle" x="189" y="166" textAnchor="middle">
            {birthDate ? `${decor.mapSubtitle} · ${birthDate}` : decor.mapSubtitle}
          </text>
        </g>
      </g>
    </svg>
  );
});
