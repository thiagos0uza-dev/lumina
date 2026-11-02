import { useEffect, useState } from 'react';
import { birthday } from '../../config/birthday';
import { useTimeline } from '../../hooks/useTimeline';
import { useReducedMotion } from '../../hooks/useReducedMotion';
import { useSpace } from '../SpaceBackground/SpaceBackground';
import { CelestialDivider, Sparkle } from '../Brand/Brand';
import './Welcome.css';

interface WelcomeProps {
  onNext: () => void;
}

/** Revela o texto em etapas: 0 nada · 1 nome · 2 título · 3 mensagem · 4 instrução · 5 botão. */
export function Welcome({ onNext }: WelcomeProps) {
  const space = useSpace();
  const reduced = useReducedMotion();
  const { at } = useTimeline();
  const [step, setStep] = useState(0);
  const { welcome, name, decor } = birthday;

  useEffect(() => {
    // A câmera, que estava colada no eclipse, recua e revela o universo.
    space.setScene(
      { stars: 1, nebula: 0.75, dust: 0.8, glow: 0.18, galaxy: 0, zoom: 1, focusX: 0.5, focusY: 0.42 },
      0.55,
    );
    if (reduced) {
      setStep(5);
      return;
    }
    [600, 2200, 3300, 4600, 5600].forEach((ms, i) => at(ms, () => setStep(i + 1)));
  }, [space, reduced, at]);

  return (
    <section className="chapter welcome" aria-label={`Capítulo II — ${birthday.chapters[1].label}`}>
      <div className="welcome__inner">
        <p className={`eyebrow reveal ${step >= 1 ? 'is-visible' : ''}`}>{welcome.eyebrow}</p>

        <div className="welcome__name" aria-hidden="true">
          {name
            .toUpperCase()
            .split('')
            .map((ch, i) => (
              <span
                key={i}
                className={step >= 1 ? 'is-visible' : ''}
                style={{ transitionDelay: `${i * 180}ms` }}
              >
                {ch}
              </span>
            ))}
        </div>

        <p className={`coords reveal ${step >= 1 ? 'is-visible' : ''}`} style={{ transitionDelay: '1s' }}>
          {decor.coordinates}
        </p>

        <h1 className={`welcome__title display reveal ${step >= 2 ? 'is-visible' : ''}`}>{welcome.title}</h1>

        <CelestialDivider className={`reveal ${step >= 2 ? 'is-visible' : ''}`} />

        <p className={`welcome__message prose reveal ${step >= 3 ? 'is-visible' : ''}`}>{welcome.message}</p>

        <p className={`welcome__instruction reveal ${step >= 4 ? 'is-visible' : ''}`}>
          <Sparkle size={11} />
          <span>{welcome.instruction}</span>
          <Sparkle size={11} />
        </p>

        <div className={`reveal ${step >= 5 ? 'is-visible' : ''}`}>
          <button
            type="button"
            className="lumina-button"
            onClick={onNext}
            tabIndex={step >= 5 ? 0 : -1}
          >
            {welcome.button}
          </button>
        </div>
      </div>
    </section>
  );
}
