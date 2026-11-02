import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { birthday } from '../../config/birthday';
import { useTimeline } from '../../hooks/useTimeline';
import { useReducedMotion } from '../../hooks/useReducedMotion';
import { useSpace } from '../SpaceBackground/SpaceBackground';
import { CelestialDivider, LuminaMark } from '../Brand/Brand';
import './Letter.css';

type Stage = 'sealed' | 'opening' | 'reading' | 'done';

interface LetterProps {
  onNext: () => void;
}

/** Tempo de leitura de um trecho: proporcional ao tamanho, com limites confortáveis. */
const readingTime = (text: string) => Math.min(3400, 900 + text.length * 16);

/**
 * A carta é dividida em "folhas" que cabem na tela — nada de rolar.
 * Cada bloco (saudação, parágrafos, assinatura) é medido e as folhas são montadas por encaixe.
 */
export function Letter({ onNext }: LetterProps) {
  const space = useSpace();
  const reduced = useReducedMotion();
  const { at, clear } = useTimeline();
  const { letter, decor } = birthday;

  const [stage, setStage] = useState<Stage>('sealed');
  /** Quantos blocos já foram revelados. */
  const [shown, setShown] = useState(0);
  const [pages, setPages] = useState<number[][]>([]);
  const [page, setPage] = useState(0);
  const bodyRef = useRef<HTMLDivElement>(null);
  const measureRef = useRef<HTMLDivElement>(null);

  const blocks = useMemo(() => {
    const list: { key: string; text: string; node: ReactNode }[] = [
      { key: 'greeting', text: letter.greeting, node: <p className="paper__greeting">{letter.greeting}</p> },
      ...letter.paragraphs.map((p, i) => ({ key: `p${i}`, text: p, node: <p className="paper__p">{p}</p> })),
      {
        key: 'sign',
        text: letter.signature,
        node: (
          <div className="paper__sign">
            <CelestialDivider />
            <p className="paper__signature">{letter.signature}</p>
            <p className="paper__coords">{decor.coordinates}</p>
          </div>
        ),
      },
    ];
    return list;
  }, [letter, decor]);
  const total = blocks.length;

  useEffect(() => {
    space.setScene({ stars: 0.25, nebula: 0.2, dust: 0.15, glow: 0.5, galaxy: 0, zoom: 1, focusX: 0.5, focusY: 0.4 }, 0.9);
  }, [space]);

  const isOpen = stage === 'reading' || stage === 'done';

  // Monta as folhas medindo cada bloco na largura real do papel.
  const paginate = useCallback(() => {
    const body = bodyRef.current;
    const measurer = measureRef.current;
    if (!body || !measurer) return;
    const available = body.clientHeight;
    const heights = Array.from(measurer.children).map((el) => (el as HTMLElement).offsetHeight);
    const result: number[][] = [];
    let current: number[] = [];
    let used = 0;
    heights.forEach((h, i) => {
      if (current.length && used + h > available) {
        result.push(current);
        current = [];
        used = 0;
      }
      current.push(i);
      used += h;
    });
    if (current.length) result.push(current);
    setPages((prev) => (JSON.stringify(prev) === JSON.stringify(result) ? prev : result));
  }, []);

  useLayoutEffect(() => {
    if (!isOpen) return;
    paginate();
    const ro = new ResizeObserver(paginate);
    if (bodyRef.current) ro.observe(bodyRef.current);
    document.fonts?.ready.then(paginate).catch(() => undefined);
    return () => ro.disconnect();
  }, [isOpen, paginate]);

  const pageOf = useCallback(
    (block: number) => Math.max(0, pages.findIndex((p) => p.includes(block))),
    [pages],
  );

  // Revela os blocos um a um; a folha vira sozinha quando a anterior termina.
  useEffect(() => {
    if (stage !== 'reading') return;
    if (shown >= total) {
      setStage('done');
      return;
    }
    const prev = shown > 0 ? blocks[shown - 1].text : '';
    const turning = shown > 0 && pageOf(shown) !== pageOf(shown - 1);
    const delay = shown === 0 ? 500 : readingTime(prev) + (turning ? 900 : 0);
    const id = at(delay, () => setShown((n) => n + 1));
    return () => window.clearTimeout(id);
  }, [stage, shown, total, blocks, pageOf, at]);

  useEffect(() => {
    if (stage === 'reading' && shown > 0) setPage(pageOf(shown - 1));
  }, [stage, shown, pageOf]);

  const open = () => {
    if (stage !== 'sealed') return;
    space.flash(0.15);
    if (reduced) {
      setShown(total);
      setStage('done');
      return;
    }
    setStage('opening');
    at(1700, () => setStage('reading'));
  };

  const revealAll = () => {
    clear();
    setShown(total);
    setStage('done');
  };


  const pageCount = Math.max(1, pages.length);
  const visibleBlocks = pages[page] ?? [];
  const lastPage = page >= pageCount - 1;

  return (
    <section className="chapter letter" data-stage={stage} aria-label={`Capítulo IV — ${birthday.chapters[3].label}`}>
      <div className="letter-room" aria-hidden="true">
        <svg className="letter-room__chart" viewBox="0 0 400 400" preserveAspectRatio="xMidYMid slice">
          <circle cx="200" cy="200" r="190" />
          <circle cx="200" cy="200" r="140" />
          <circle cx="200" cy="200" r="90" strokeDasharray="2 5" />
          <path d="M10 200 H390 M200 10 V390 M66 66 L334 334 M334 66 L66 334" />
        </svg>
      </div>

      <div className={`letter__inner ${isOpen ? 'is-open' : ''}`}>
        <header className="letter__header">
          <p className="eyebrow letter__eyebrow">{letter.eyebrow}</p>
          <h1 className="letter__title display">{letter.title}</h1>
        </header>

        {!isOpen && (
          <>
            <div className="envelope" data-stage={stage}>
              <div className="envelope__back" />
              <div className="envelope__paper-peek" />
              <div className="envelope__front" />
              <div className="envelope__flap" />
              <button type="button" className="envelope__seal" onClick={open} aria-label={letter.sealLabel}>
                <LuminaMark size={34} />
              </button>
            </div>
            <button
              type="button"
              className={`lumina-button letter__open ${stage !== 'sealed' ? 'is-hidden' : ''}`}
              onClick={open}
            >
              {letter.openButton}
            </button>
          </>
        )}

        {isOpen && (
          <article className="paper" aria-live="polite">
            <span className="paper__corner paper__corner--tl" aria-hidden="true" />
            <span className="paper__corner paper__corner--tr" aria-hidden="true" />
            <span className="paper__corner paper__corner--bl" aria-hidden="true" />
            <span className="paper__corner paper__corner--br" aria-hidden="true" />

            <div className="paper__mark" aria-hidden="true">
              <LuminaMark size={26} />
            </div>

            <div ref={bodyRef} className="paper__body">
              {/* Medidor invisível: mesma largura e tipografia do papel */}
              <div ref={measureRef} className="paper__measure" aria-hidden="true">
                {blocks.map((b) => (
                  <div key={b.key} className="paper__block">
                    {b.node}
                  </div>
                ))}
              </div>

              <div key={page} className="paper__page">
                {visibleBlocks.map((i) => (
                  <div key={blocks[i].key} className={`paper__block ink ${shown > i ? 'is-visible' : ''}`}>
                    {blocks[i].node}
                  </div>
                ))}
              </div>
            </div>

            {pageCount > 1 && (
              <div className="paper__pager">
                <button
                  type="button"
                  className="paper__turn"
                  onClick={() => setPage((p) => Math.max(0, p - 1))}
                  disabled={stage !== 'done' || page === 0}
                  aria-label={letter.prevPage}
                >
                  ‹
                </button>
                <span className="paper__folio">
                  {letter.folio(page + 1, pageCount)}
                </span>
                <button
                  type="button"
                  className="paper__turn"
                  onClick={() => setPage((p) => Math.min(pageCount - 1, p + 1))}
                  disabled={stage !== 'done' || lastPage}
                  aria-label={letter.nextPage}
                >
                  ›
                </button>
              </div>
            )}
          </article>
        )}

        <div className="letter__actions">
          {stage === 'reading' && (
            <button type="button" className="letter__skip" onClick={revealAll}>
              {letter.revealAll}
            </button>
          )}
          {stage === 'done' && !lastPage && (
            <button type="button" className="lumina-button letter__next" onClick={() => setPage((p) => p + 1)}>
              {letter.continueReading}
            </button>
          )}
          {stage === 'done' && lastPage && (
            <button type="button" className="lumina-button letter__next" onClick={onNext}>
              {letter.nextButton}
            </button>
          )}
        </div>
      </div>
    </section>
  );
}
