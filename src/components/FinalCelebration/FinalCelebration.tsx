import { useCallback, useEffect, useRef, useState } from 'react';
import { birthday } from '../../config/birthday';
import { useTimeline } from '../../hooks/useTimeline';
import { useReducedMotion } from '../../hooks/useReducedMotion';
import { useSpace } from '../SpaceBackground/SpaceBackground';
import { Eclipse, type EclipsePhase } from '../Eclipse/Eclipse';
import { CelestialDivider } from '../Brand/Brand';
import { sampleWord } from '../../utils/constellation';
import './FinalCelebration.css';

/** 0 afastando · 1 nome formado · 2 título · 3 mensagem + botão · 4 pedido feito · 5 mensagem final */
type Step = 0 | 1 | 2 | 3 | 4 | 5;

interface FinalCelebrationProps {
  onRestart: () => void;
}

export function FinalCelebration({ onRestart }: FinalCelebrationProps) {
  const space = useSpace();
  const reduced = useReducedMotion();
  const { at } = useTimeline();
  const { finale } = birthday;

  const eclipseRef = useRef<HTMLDivElement>(null);
  const nameRef = useRef<HTMLDivElement>(null);
  const [step, setStep] = useState<Step>(0);
  const [phase, setPhase] = useState<EclipsePhase>('hidden');
  const [uiHidden, setUiHidden] = useState(false);
  const nameFormed = useRef(false);

  /** Mantém a galáxia atrás do eclipse e as partículas sobre o espaço reservado ao nome. */
  const align = useCallback(() => {
    const e = eclipseRef.current?.getBoundingClientRect();
    if (e) {
      space.setScene({
        focusX: (e.left + e.width / 2) / window.innerWidth,
        focusY: (e.top + e.height / 2) / window.innerHeight,
      });
    }
    if (nameFormed.current && nameRef.current) {
      const r = nameRef.current.getBoundingClientRect();
      const spacing = r.width < 420 ? 5 : 6.5;
      space.formName(sampleWord({ x: r.left, y: r.top, width: r.width, height: r.height }, spacing));
    }
  }, [space]);

  useEffect(() => {
    // Câmera começa próxima e se afasta, revelando a galáxia inteira.
    space.setScene({ zoom: 1.5, stars: 0.6 }, 2);
    at(60, () => {
      align();
      space.setScene({ stars: 1, nebula: 0.85, dust: 0.9, galaxy: 1, glow: 0.55, zoom: 0.92 }, reduced ? 4 : 0.32);
    });
    at(reduced ? 0 : 900, () => setPhase('radiant'));
    at(reduced ? 0 : 2400, () => {
      nameFormed.current = true;
      align();
      setStep(1);
    });
    at(reduced ? 0 : 4400, () => setStep(2));
    at(reduced ? 0 : 5600, () => setStep(3));

    window.addEventListener('resize', align);
    return () => {
      window.removeEventListener('resize', align);
      space.formName(null);
    };
  }, [space, reduced, at, align]);

  // O layout muda quando o texto aparece; reposiciona o nome e o foco.
  useEffect(() => {
    const id = window.setTimeout(align, 80);
    return () => window.clearTimeout(id);
  }, [step, uiHidden, align]);

  const makeWish = () => {
    if (step !== 3) return;
    setStep(4);
    const w = window.innerWidth;
    const h = window.innerHeight;
    space.shootingStar({ big: true, from: { x: w * 1.05, y: h * 0.05 }, angle: Math.PI * 0.8 });
    at(reduced ? 0 : 650, () => {
      space.flash(0.55);
      const e = eclipseRef.current?.getBoundingClientRect();
      const cx = e ? e.left + e.width / 2 : w / 2;
      const cy = e ? e.top + e.height / 2 : h / 2;
      space.burst(cx, cy, 220);
      space.setScene({ galaxy: 1.5, glow: 0.85, nebula: 1, zoom: 0.86 }, 0.7);
    });
    at(reduced ? 0 : 1300, () => {
      const r = nameRef.current?.getBoundingClientRect();
      if (r) space.burst(r.left + r.width / 2, r.top + r.height / 2, 120);
    });
    at(reduced ? 0 : 1700, () => setStep(5));
    at(reduced ? 0 : 2600, () => space.shootingStar());
  };

  const restart = () => {
    space.formName(null);
    onRestart();
  };

  return (
    <section
      className={`chapter finale ${uiHidden ? 'is-ui-hidden' : ''}`}
      data-step={step}
      aria-label={`Capítulo V — ${birthday.chapters[4].label}`}
      onClick={uiHidden ? () => setUiHidden(false) : undefined}
      onScroll={align}
    >
      <div className="finale__inner">
        <div ref={eclipseRef} className="finale__eclipse">
          <Eclipse phase={phase} />
        </div>

        {/* Espaço reservado onde as partículas escrevem o nome no canvas */}
        <div ref={nameRef} className="finale__name" role="img" aria-label={birthday.name} />

        <div className="finale__ui">
          <h1 className={`finale__title display reveal ${step >= 2 ? 'is-visible' : ''}`}>{finale.title}</h1>

          <p className={`finale__message prose reveal ${step >= 3 ? 'is-visible' : ''}`}>{finale.message}</p>

          <div className="finale__wish-slot">
            {step <= 3 && (
              <div className={`reveal ${step >= 3 ? 'is-visible' : ''}`}>
                <button type="button" className="lumina-button finale__wish" onClick={makeWish} tabIndex={step === 3 ? 0 : -1}>
                  {finale.wishButton}
                </button>
              </div>
            )}

            {step >= 4 && (
              <div className={`finale__wished reveal ${step >= 5 ? 'is-visible' : ''}`} aria-live="polite">
                <CelestialDivider />
                <p className="finale__wish-message display">{finale.wishMessage}</p>
                <p className="finale__signature">{finale.signature}</p>
                <div className="finale__actions">
                  <button
                    type="button"
                    className="lumina-button lumina-button--ghost"
                    onClick={(e) => {
                      e.stopPropagation();
                      setUiHidden(true);
                    }}
                  >
                    {finale.keepWatching}
                  </button>
                  <button type="button" className="finale__restart" onClick={restart}>
                    {finale.restart}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {uiHidden && (
        <button type="button" className="finale__show" onClick={() => setUiHidden(false)}>
          {finale.showAgain}
        </button>
      )}
    </section>
  );
}
