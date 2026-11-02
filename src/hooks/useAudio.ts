import { useCallback, useEffect, useRef, useState } from 'react';

export interface AudioOptions {
  src: string;
  initialVolume: number;
  loop: boolean;
}

export interface AudioControls {
  /** true quando o arquivo existe e pode ser reproduzido. */
  available: boolean;
  playing: boolean;
  muted: boolean;
  volume: number;
  play: () => void;
  pause: () => void;
  toggle: () => void;
  toggleMute: () => void;
  setVolume: (v: number) => void;
}

/**
 * Trilha sonora local e opcional. Nada toca sem interação do usuário,
 * e a ausência do arquivo é tratada silenciosamente.
 */
export function useAudio({ src, initialVolume, loop }: AudioOptions): AudioControls {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [available, setAvailable] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [muted, setMuted] = useState(false);
  const [volume, setVolumeState] = useState(initialVolume);

  useEffect(() => {
    const audio = new Audio();
    audio.preload = 'metadata';
    audio.loop = loop;
    audio.volume = initialVolume;

    const onReady = () => setAvailable(true);
    const onError = () => {
      setAvailable(false);
      setPlaying(false);
    };
    const onPlay = () => setPlaying(true);
    const onPause = () => setPlaying(false);

    audio.addEventListener('loadedmetadata', onReady);
    audio.addEventListener('error', onError);
    audio.addEventListener('play', onPlay);
    audio.addEventListener('pause', onPause);
    audio.src = src;
    audioRef.current = audio;

    return () => {
      audio.pause();
      audio.removeEventListener('loadedmetadata', onReady);
      audio.removeEventListener('error', onError);
      audio.removeEventListener('play', onPlay);
      audio.removeEventListener('pause', onPause);
      audio.removeAttribute('src');
      audio.load();
      audioRef.current = null;
    };
  }, [src, loop, initialVolume]);

  const play = useCallback(() => {
    const audio = audioRef.current;
    if (!audio || audio.error) return;
    // Entrada suave de volume para não assustar.
    const target = audio.volume;
    audio.volume = 0;
    audio
      .play()
      .then(() => {
        const start = performance.now();
        const step = (now: number) => {
          const k = Math.min(1, (now - start) / 2500);
          audio.volume = target * k;
          if (k < 1) requestAnimationFrame(step);
        };
        requestAnimationFrame(step);
      })
      .catch(() => {
        audio.volume = target;
      });
  }, []);

  const pause = useCallback(() => audioRef.current?.pause(), []);

  const toggle = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;
    if (audio.paused) play();
    else audio.pause();
  }, [play]);

  const toggleMute = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.muted = !audio.muted;
    setMuted(audio.muted);
  }, []);

  const setVolume = useCallback((v: number) => {
    const audio = audioRef.current;
    const value = Math.min(1, Math.max(0, v));
    if (audio) {
      audio.volume = value;
      if (value > 0 && audio.muted) {
        audio.muted = false;
        setMuted(false);
      }
    }
    setVolumeState(value);
  }, []);

  return { available, playing, muted, volume, play, pause, toggle, toggleMute, setVolume };
}
