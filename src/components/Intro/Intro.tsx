import { useEffect, useRef, useState } from 'react';
import { birthday } from '../../config/birthday';
import { useTimeline } from '../../hooks/useTimeline';
import { useReducedMotion } from '../../hooks/useReducedMotion';
import { useSpace } from '../SpaceBackground/SpaceBackground';
import { Eclipse, type EclipsePhase } from '../Eclipse/Eclipse';
import { CelestialDivider } from '../Brand/Brand';
import './Intro.css';

type Beat = 'dark' | 'line' | 'title' | 'ready' | 'leaving';
const ORDER: Beat[] = ['dark', 'line', 'title', 'ready', 'leaving'];

interface IntroProps {
  /** Chamado no clique do botão (antes da transição) — usado para iniciar a trilha. */
  onEnterStart: () => void;
  /** Chamado ao fim da transição cinematográfica. */
  onComplete: () => void;
}

export function Intro({ onEnterStart, onComplete }: IntroProps) {
  const space = useSpace();
  const reduced = useReducedMotion();
  const { at, clear } = useTimeline();
  const eclipseRef = useRef<HTMLDivElement>(null);
  const [beat, setBeat] = useState<Beat>('dark');
  const [phase, setPhase] = useState<EclipsePhase>('hidden');
  const { intro, project } = birthday;

  const reached = (b: Beat) => ORDER.indexOf(beat) >= ORDER.indexOf(b);

  // Mantém a luz do céu alinhada ao centro do eclipse.
  useEffect(() => {
    const align = () => {
      const el = eclipseRef.current;
      if (!el) return;
      const r = el.getBoundingClientRect();
      space.setScene({
        focusX: (r.left + r.width / 2) / window.innerWidth,
        focusY: (r.top + r.height / 2) / window.innerHeight,
      });
    };
    align();
    window.addEventListener('resize', align);
    return () => window.removeEventListener('resize', align);
  }, [space]);

  // Sequência de abertura.
  useEffect(() => {
    space.jumpScene({ stars: 0, nebula: 0, dust: 0, glow: 0, galaxy: 0, zoom: 1.15 });
    space.setScene({ stars: 0.4, nebula: 0.2, dust: 0.55, glow: 0.15, zoom: 1.1 }, 0.35);

    if (reduced) {
      setPhase('full');
      setBeat('ready');
      return;
    }
    at(700, () => setPhase('forming'));
    at(2200, () => setBeat('line'));
    at(5600, () => {
      setPhase('full');
      setBeat('title');
      space.setScene({ glow: 0.45, nebula: 0.32 }, 0.6);
    });
    at(7000, () => setBeat('ready'));
  }, [space, reduced, at]);

  const skipAhead = () => {
    if (ORDER.indexOf(beat) >= ORDER.indexOf('ready')) return;
    clear();
    setPhase('full');
    setBeat('ready');
    space.setScene({ glow: 0.45, nebula: 0.32 }, 1.2);
  };

  const enter = () => {
    if (beat === 'leaving') return;
    onEnterStart();
    clear();
    setPhase('flare');
    space.flash(0.35);
    space.setScene({ glow: 0.9, stars: 0.8 }, 1.4);

    if (reduced) {
      at(400, onComplete);
      return;
    }
    at(700, () => {
      setBeat('leaving');
      space.warpPulse(1500);
      space.setScene({ zoom: 1.9, nebula: 0.55, glow: 0.3 }, 1.2);
    });
    at(1100, () => space.flash(0.7));
    at(2200, onComplete);
  };

  return (
    <section
      className="chapter intro"
      data-beat={beat}
      aria-label={`Capítulo I — ${birthday.chapters[0].label}`}
      onClick={skipAhead}
    >
      <div className="intro__stage">
        <div ref={eclipseRef} className="intro__eclipse">
          <Eclipse phase={phase} />
        </div>

        <div className="intro__text">
          <p className={`intro__line prose reveal ${reached('line') ? 'is-visible' : ''}`}>{intro.line}</p>

          <div className={`intro__title reveal ${reached('title') ? 'is-visible' : ''}`}>
            <h1 className="intro__wordmark display" aria-label={project.name}>
              {project.name.split('').map((ch, i) => (
                <span key={i} style={{ transitionDelay: `${i * 120}ms` }}>
                  {ch}
                </span>
              ))}
            </h1>
            <CelestialDivider />
            <p className="intro__subtitle">{intro.subtitle}</p>
          </div>

          <div className={`intro__cta reveal ${reached('ready') ? 'is-visible' : ''}`}>
            <button
              type="button"
              className="lumina-button"
              onClick={(e) => {
                e.stopPropagation();
                enter();
              }}
              tabIndex={reached('ready') ? 0 : -1}
            >
              {intro.button}
            </button>
          </div>
        </div>
      </div>

      <p className={`intro__hint ${beat === 'dark' || beat === 'line' ? 'is-visible' : ''}`} aria-hidden="true">
        {intro.skipHint}
      </p>
    </section>
  );
}
