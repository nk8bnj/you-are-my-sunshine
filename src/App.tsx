import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Music, VolumeX } from 'lucide-react';
import GameCanvas from './components/GameCanvas';
import Hud from './components/Hud';
import Postcard from './components/Postcard';
import { createGameAudio } from './game/audio';
import { CHARACTER, HEART as HEART_CONFIG } from './game/config';
import { createDecor, createFlowers } from './game/spawn';
import type { GameState } from './game/types';

function createInitialGameState(): GameState {
  return {
    phase: 'collecting',
    character: {
      position: CHARACTER.start,
      target: CHARACTER.start,
      facing: 'front',
      isWalking: false,
    },
    camera: {
      position: CHARACTER.start,
    },
    flowers: createFlowers(),
    decor: createDecor(),
    heart: {
      position: null,
      timerMs: HEART_CONFIG.durationMs,
      active: false,
    },
    lastMessage: 'Collect five flowers for the bouquet.',
    collectedOrder: [],
  };
}

export default function App() {
  const [gameState, setGameState] = useState<GameState>(() => createInitialGameState());
  const [introBubbleVisible, setIntroBubbleVisible] = useState(true);
  const [introBubbleKey, setIntroBubbleKey] = useState(0);
  const [musicPlaying, setMusicPlaying] = useState(false);
  const audio = useMemo(() => createGameAudio(), []);
  const previousCollectedCountRef = useRef(0);
  const previousPhaseRef = useRef<GameState['phase']>('collecting');
  const triedAutoplayRef = useRef(false);

  const restart = useCallback(() => {
    previousCollectedCountRef.current = 0;
    previousPhaseRef.current = 'collecting';
    setIntroBubbleVisible(true);
    setIntroBubbleKey((key) => key + 1);
    setGameState(createInitialGameState());
  }, []);

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      setIntroBubbleVisible(false);
    }, 3000);

    return () => window.clearTimeout(timeout);
  }, [introBubbleKey]);

  useEffect(() => {
    if (gameState.collectedOrder.length > previousCollectedCountRef.current) {
      audio.flower();
    }

    if (previousPhaseRef.current !== gameState.phase && gameState.phase === 'heart') {
      audio.heart();
    }

    if (previousPhaseRef.current !== gameState.phase && gameState.phase === 'success') {
      audio.success();
    }

    previousCollectedCountRef.current = gameState.collectedOrder.length;
    previousPhaseRef.current = gameState.phase;
  }, [audio, gameState.collectedOrder.length, gameState.phase]);

  const toggleMusic = useCallback(async () => {
    const playing = await audio.toggleMusic();
    triedAutoplayRef.current = true;
    setMusicPlaying(playing);
  }, [audio]);

  const tryStartMusic = useCallback(() => {
    if (triedAutoplayRef.current || musicPlaying) {
      return;
    }

    triedAutoplayRef.current = true;
    void audio.startMusic().then((playing) => {
      setMusicPlaying(playing);
    });
  }, [audio, musicPlaying]);

  return (
    <main className="app-shell">
      <section className="phone-stage" aria-label="Flower Heart game">
        <GameCanvas
          state={gameState}
          setState={setGameState}
          onFirstInteraction={tryStartMusic}
        />
        <Hud state={gameState} onRetry={restart} />
        {introBubbleVisible && gameState.phase === 'collecting' ? (
          <div className="character-bubble" role="status">
            Собери букет цветов :)
          </div>
        ) : null}
        {gameState.phase === 'success' ? <Postcard onReplay={restart} /> : null}
        <div className="corner-actions">
          <button className="corner-button" type="button" aria-label={musicPlaying ? 'Turn music off' : 'Turn music on'} onClick={toggleMusic}>
            {musicPlaying ? <Music size={18} /> : <VolumeX size={18} />}
          </button>
        </div>
      </section>
    </main>
  );
}
