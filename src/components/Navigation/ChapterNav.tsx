import type { ReactNode } from 'react';
import { birthday, type ChapterIndex } from '../../config/birthday';
import { LuminaMark } from '../Brand/Brand';
import './ChapterNav.css';

interface ChapterNavProps {
  current: ChapterIndex;
  /** Capítulo mais avançado já desbloqueado. */
  unlocked: ChapterIndex;
  onSelect: (chapter: ChapterIndex) => void;
  /** Tema claro para a sala marfim da carta. */
  light: boolean;
  /** Controles extras à direita (ex.: trilha sonora). */
  children?: ReactNode;
}

export function ChapterNav({ current, unlocked, onSelect, light, children }: ChapterNavProps) {
  const { chapters, navigation, project } = birthday;

  return (
    <nav className={`chapter-nav ${light ? 'is-light' : ''}`} aria-label={navigation.label}>
      <div className="chapter-nav__brand" aria-hidden="true">
        <LuminaMark size={22} />
        <span>{project.name}</span>
      </div>

      <ol className="chapter-nav__list">
        {chapters.map((c, i) => {
          const index = i as ChapterIndex;
          const locked = index > unlocked;
          const isCurrent = index === current;
          return (
            <li key={c.id}>
              <button
                type="button"
                className={`chapter-nav__dot ${isCurrent ? 'is-current' : ''} ${locked ? 'is-locked' : ''}`}
                disabled={locked || isCurrent}
                aria-current={isCurrent ? 'step' : undefined}
                aria-label={navigation.chapterAria(c.numeral, c.label, locked, isCurrent)}
                onClick={() => onSelect(index)}
              >
                <span className="chapter-nav__numeral" aria-hidden="true">
                  {c.numeral}
                </span>
              </button>
            </li>
          );
        })}
      </ol>

      <div className="chapter-nav__end">
        <p className="chapter-nav__current" aria-hidden="true">
          {chapters[current].label}
        </p>
        {children}
      </div>
    </nav>
  );
}
