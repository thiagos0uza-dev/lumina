import { useState } from 'react';
import { birthday } from '../../config/birthday';
import type { AudioControls } from '../../hooks/useAudio';
import './MusicPlayer.css';

interface MusicPlayerProps {
  audio: AudioControls;
  light: boolean;
}

/** Controle discreto da trilha. Só aparece se o arquivo de áudio existir. */
export function MusicPlayer({ audio, light }: MusicPlayerProps) {
  const [expanded, setExpanded] = useState(false);
  const labels = birthday.audio.labels;
  if (!audio.available) return null;

  const silent = audio.muted || audio.volume === 0;

  return (
    <div
      className={`music ${expanded ? 'is-expanded' : ''} ${audio.playing ? 'is-playing' : ''} ${light ? 'is-light' : ''}`}
      role="group"
      aria-label={labels.group}
    >
      <button
        type="button"
        className="music__btn music__play"
        onClick={audio.toggle}
        aria-label={audio.playing ? labels.pause : labels.play}
        aria-pressed={audio.playing}
      >
        {audio.playing ? (
          <span className="music__bars" aria-hidden="true">
            <i />
            <i />
            <i />
            <i />
          </span>
        ) : (
          <svg viewBox="0 0 16 16" width="14" height="14" aria-hidden="true">
            <path d="M4 2.5 L13 8 L4 13.5 Z" fill="currentColor" />
          </svg>
        )}
      </button>

      <div className="music__panel">
      <button
        type="button"
        className="music__btn music__mute"
        onClick={audio.toggleMute}
        aria-label={silent ? labels.unmute : labels.mute}
        aria-pressed={audio.muted}
      >
        <svg viewBox="0 0 16 16" width="16" height="16" aria-hidden="true">
          <path d="M2 6 H5 L9 2.5 V13.5 L5 10 H2 Z" fill="currentColor" />
          {silent ? (
            <path d="M11 5.5 L15 10.5 M15 5.5 L11 10.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
          ) : (
            <path d="M11 5.2 Q13 8 11 10.8 M12.8 3.6 Q16 8 12.8 12.4" stroke="currentColor" strokeWidth="1.1" fill="none" strokeLinecap="round" />
          )}
        </svg>
      </button>

      <label className="music__volume">
        <span className="sr-only">{labels.volume}</span>
        <input
          type="range"
          min={0}
          max={1}
          step={0.01}
          value={audio.muted ? 0 : audio.volume}
          onChange={(e) => audio.setVolume(Number(e.target.value))}
          onFocus={() => setExpanded(true)}
          style={{ '--fill': `${(audio.muted ? 0 : audio.volume) * 100}%` } as React.CSSProperties}
        />
      </label>
      </div>

      <button
        type="button"
        className="music__btn music__toggle"
        onClick={() => setExpanded((v) => !v)}
        aria-label={labels.volume}
        aria-expanded={expanded}
      >
        <svg viewBox="0 0 16 16" width="12" height="12" aria-hidden="true">
          <path d={expanded ? 'M3 10 L8 5 L13 10' : 'M3 6 L8 11 L13 6'} stroke="currentColor" strokeWidth="1.4" fill="none" />
        </svg>
      </button>
    </div>
  );
}
