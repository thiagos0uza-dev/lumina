import { useEffect, useRef } from 'react';
import { birthday, type StarMessage } from '../../config/birthday';
import { Sparkle } from '../Brand/Brand';

interface StarPanelProps {
  message: StarMessage | null;
  onClose: () => void;
  /** Rótulo do botão principal ("Próxima estrela" ou "Ver a constelação completa"). */
  nextLabel: string;
  onNext: () => void;
}

/** A mensagem de uma estrela, apresentada como uma pequena ficha de observatório. */
export function StarPanel({ message, onClose, nextLabel, onNext }: StarPanelProps) {
  const closeRef = useRef<HTMLButtonElement>(null);
  const open = message !== null;
  const lastMessage = useRef<StarMessage | null>(null);
  if (message) lastMessage.current = message;
  const shown = message ?? lastMessage.current;

  useEffect(() => {
    if (!open) return;
    const t = window.setTimeout(() => closeRef.current?.focus({ preventScroll: true }), 450);
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => {
      window.clearTimeout(t);
      window.removeEventListener('keydown', onKey);
    };
  }, [open, onClose, shown?.id]);

  return (
    <div className={`star-panel-layer ${open ? 'is-open' : ''}`} aria-hidden={!open}>
      <button type="button" className="star-panel-layer__backdrop" tabIndex={-1} onClick={onClose} aria-hidden="true" />
      {shown && (
        <div
          key={shown.id}
          className="star-panel"
          role="dialog"
          aria-modal="true"
          aria-labelledby="star-panel-title"
          aria-describedby="star-panel-text"
        >
          <span className="star-panel__corner star-panel__corner--tl" aria-hidden="true" />
          <span className="star-panel__corner star-panel__corner--br" aria-hidden="true" />
          <p className="eyebrow">{birthday.constellation.messageEyebrow(shown.number)}</p>
          <h2 id="star-panel-title" className="star-panel__title display">
            {shown.title}
          </h2>
          <Sparkle size={14} className="star-panel__sparkle" />
          <p id="star-panel-text" className="star-panel__text">
            {shown.text}
          </p>
          <button
            ref={closeRef}
            type="button"
            className="lumina-button star-panel__next"
            onClick={onNext}
            tabIndex={open ? 0 : -1}
          >
            {nextLabel}
          </button>
          <button type="button" className="star-panel__back" onClick={onClose} tabIndex={open ? 0 : -1}>
            {birthday.constellation.back}
          </button>
        </div>
      )}
    </div>
  );
}
