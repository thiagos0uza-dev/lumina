import { useCallback, useRef, useState } from 'react';
import { birthday, type ChapterIndex } from './config/birthday';
import { useAudio } from './hooks/useAudio';
import { SpaceProvider } from './components/SpaceBackground/SpaceBackground';
import { Intro } from './components/Intro/Intro';
import { Welcome } from './components/Welcome/Welcome';
import { Constellation } from './components/Constellation/Constellation';
import { Letter } from './components/Letter/Letter';
import { FinalCelebration } from './components/FinalCelebration/FinalCelebration';
import { ChapterNav } from './components/Navigation/ChapterNav';
import { MusicPlayer } from './components/MusicPlayer/MusicPlayer';

const TRANSITION_MS = 800;

export default function App() {
  const audio = useAudio(birthday.audio);
  const [chapter, setChapter] = useState<ChapterIndex>(0);
  const [unlocked, setUnlocked] = useState<ChapterIndex>(0);
  const [stage, setStage] = useState<'in' | 'out'>('in');
  const [discovered, setDiscovered] = useState<number[]>([]);
  const busy = useRef(false);

  const goTo = useCallback((next: ChapterIndex, instant = false) => {
    if (busy.current) return;
    busy.current = true;
    const swap = () => {
      setChapter(next);
      setUnlocked((u) => (next > u ? next : u));
      setStage('in');
      busy.current = false;
    };
    if (instant) {
      swap();
      return;
    }
    setStage('out');
    window.setTimeout(swap, TRANSITION_MS);
  }, []);

  const discover = useCallback((message: number) => {
    setDiscovered((list) => (list.includes(message) ? list : [...list, message]));
  }, []);

  const startMusic = useCallback(() => {
    if (birthday.audio.playOnEnter && audio.available && !audio.playing) audio.play();
  }, [audio]);

  return (
    <SpaceProvider>
      {chapter > 0 && (
        <ChapterNav current={chapter} unlocked={unlocked} onSelect={(c) => goTo(c)} light={chapter === 3}>
          <MusicPlayer audio={audio} light={chapter === 3} />
        </ChapterNav>
      )}

      <div className="chapter-stage" data-stage={stage}>
        {chapter === 0 && <Intro onEnterStart={startMusic} onComplete={() => goTo(1, true)} />}
        {chapter === 1 && <Welcome onNext={() => goTo(2)} />}
        {chapter === 2 && <Constellation discovered={discovered} onDiscover={discover} onNext={() => goTo(3)} />}
        {chapter === 3 && <Letter onNext={() => goTo(4)} />}
        {chapter === 4 && <FinalCelebration onRestart={() => goTo(0)} />}
      </div>

    </SpaceProvider>
  );
}
