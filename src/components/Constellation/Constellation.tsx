import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { birthday } from '../../config/birthday';
import { useTimeline } from '../../hooks/useTimeline';
import { useSpace } from '../SpaceBackground/SpaceBackground';
import { StarMap, VIEWBOX } from './StarMap';
import { StarPanel } from './StarPanel';
import './Constellation.css';

interface ConstellationProps {
  /** Índices (0–4) das mensagens já descobertas. Mantido no App para sobreviver à navegação. */
  discovered: number[];
  onDiscover: (message: number) => void;
  onNext: () => void;
}

export function Constellation({ discovered, onDiscover, onNext }: ConstellationProps) {
  const space = useSpace();
  const { at } = useTimeline();
  const mapRef = useRef<SVGSVGElement>(null);
  const lastFocus = useRef<number | null>(null);
  const { stars: messages, constellation: texts } = birthday;
  const total = messages.length;

  const found = useMemo(() => new Set(discovered), [discovered]);
  const allFound = found.size >= total;

  const [active, setActive] = useState<number | null>(null);
  const [focusY, setFocusY] = useState(VIEWBOX.y + VIEWBOX.h * 0.3);
  /** A surpresa já foi revelada (ao voltar a este capítulo, ela continua aberta). */
  const [complete, setComplete] = useState(allFound);

  useEffect(() => {
    space.setScene({ stars: 0.85, nebula: 0.6, dust: 0.5, glow: 0.08, galaxy: 0, zoom: 1.04, focusX: 0.5, focusY: 0.45 }, 0.8);
  }, [space]);

  const starScreenPoint = (message: number) => {
    const el = mapRef.current?.querySelector<SVGGElement>(`[data-message="${message}"] .message-star__core`);
    if (!el) return null;
    const r = el.getBoundingClientRect();
    return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
  };

  /** Ponto da tela, acima do painel da mensagem, onde a estrela aproximada deve ficar. */
  const computeFocus = () => {
    const svg = mapRef.current;
    if (!svg) return;
    const r = svg.getBoundingClientRect();
    const k = Math.min(r.width / VIEWBOX.w, r.height / VIEWBOX.h);
    const contentTop = r.top + (r.height - VIEWBOX.h * k) / 2;
    const panelSpace = Math.min(460, window.innerHeight * 0.66);
    const desired = Math.max(96, (window.innerHeight - panelSpace) * 0.5 + 24);
    setFocusY(VIEWBOX.y + (desired - contentTop) / k);
  };

  /** Leva a câmera até uma estrela e abre sua mensagem (também usado para pular de uma estrela à outra). */
  const focusStar = (message: number) => {
    computeFocus();
    const p = starScreenPoint(message);
    if (p) space.burst(p.x, p.y, found.has(message) ? 18 : 60);
    space.flash(0.1);
    space.setScene({ zoom: 1.22, stars: 0.6, nebula: 0.75 }, 1.2);
    lastFocus.current = message;
    setActive(message);
    onDiscover(message);
  };

  /** Toque direto numa estrela do mapa (opcional). */
  const select = (message: number) => {
    if (active === null) focusStar(message);
  };

  /** Próxima estrela ainda não vista: segue em frente e, no fim, volta às que faltaram. */
  const nextOf = (current: number): number | null => {
    for (let step = 1; step < total; step++) {
      const i = (current + step) % total;
      if (!found.has(i)) return i;
    }
    return null;
  };

  const firstPending = () => {
    for (let i = 0; i < total; i++) if (!found.has(i)) return i;
    return 0;
  };

  const close = useCallback(() => {
    setActive(null);
    space.setScene({ zoom: 1.04, stars: 0.85, nebula: 0.6 }, 1.2);
    // Devolve o foco à estrela de onde a pessoa veio.
    const m = lastFocus.current;
    window.setTimeout(() => {
      mapRef.current?.querySelector<SVGGElement>(`[data-message="${m}"]`)?.focus({ preventScroll: true });
    }, 50);
  }, [space]);

  // Surpresa: dispara quando a última mensagem é fechada.
  useEffect(() => {
    if (!allFound || complete || active !== null) return;
    at(900, () => {
      setComplete(true);
      space.flash(0.35);
      space.setScene({ glow: 0.4, stars: 1, nebula: 0.8 }, 0.9);
      const box = mapRef.current?.getBoundingClientRect();
      if (box) {
        const k = box.width / 446;
        [0, 1, 2, 3, 4].forEach((i) =>
          at(i * 160, () => {
            const p = starScreenPoint(i);
            if (p) space.burst(p.x, p.y, Math.round(50 * Math.min(1.4, k + 0.4)));
          }),
        );
      }
    });
  }, [allFound, complete, active, at, space]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <section
      className={`chapter constellation ${complete ? 'is-complete' : ''}`}
      aria-label={`Capítulo III — ${birthday.chapters[2].label}`}
    >
      <div className={`constellation__inner ${active !== null ? 'is-dimmed' : ''}`}>
        <header className="constellation__header">
          <p className="eyebrow">{texts.eyebrow}</p>
          <h1 className="constellation__title display">{texts.title}</h1>
          <p className="constellation__progress" aria-live="polite">
            {texts.progress(found.size, total)}
          </p>
        </header>

        <div className="constellation__map">
          <StarMap
            ref={mapRef}
            discovered={found}
            active={active}
            complete={complete}
            focusY={focusY}
            onSelect={select}
          />
        </div>

        {!complete && (
          <div className="constellation__tour">
            <button
              type="button"
              className="lumina-button"
              onClick={() => focusStar(firstPending())}
              tabIndex={active === null ? 0 : -1}
            >
              {found.size === 0 ? texts.start : texts.resume}
            </button>
            <p className="constellation__hint">{texts.hint}</p>
          </div>
        )}

        {complete && (
          <div className="constellation__surprise" aria-live="polite">
            <p className="constellation__surprise-text prose">{texts.completeMessage}</p>
            <button type="button" className="lumina-button" onClick={onNext}>
              {texts.completeButton}
            </button>
          </div>
        )}
      </div>

      <StarPanel
        message={active === null ? null : messages[active]}
        onClose={close}
        nextLabel={active !== null && nextOf(active) !== null ? texts.next : texts.finish}
        onNext={() => {
          if (active === null) return;
          const n = nextOf(active);
          if (n === null) close();
          else focusStar(n);
        }}
      />
    </section>
  );
}
