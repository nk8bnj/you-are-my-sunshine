import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Check, Music, VolumeX, X } from 'lucide-react';
import GameCanvas from './components/GameCanvas';
import Hud from './components/Hud';
import Dialogue from './components/Dialogue';
import { DIALOGUE } from './game/dialogue';
import { restoreProgress, saveProgress } from './game/progress';
import { beginMeeting, updateGame } from './game/update';
import { createGameAudio } from './game/audio';
import { CHARACTER, HEART as HEART_CONFIG } from './game/config';
import { createDecor, createFlowers } from './game/spawn';
import type { Character, GameState } from './game/types';

function createInitialGameState(restore = true): GameState {
  const state: GameState = {
    phase: 'collecting',
    scene: null,
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
  const preview = new URLSearchParams(window.location.search).get('preview');
  if (preview === 'meeting' || preview === 'ending' || preview === 'question') {
    state.flowers = state.flowers.map((flower) => ({ ...flower, collected: true }));
    state.collectedOrder = state.flowers.map((flower) => flower.id);
    const viewport = { width: Math.min(window.innerWidth, 430), height: Math.min(window.innerHeight, 920) };
    let scene = beginMeeting(state, viewport);
    if (preview === 'ending' || preview === 'question') {
      // Run the normal entrance first so the final preview has the same camera framing.
      for (let frame = 0; frame < 600 && scene.phase === 'meeting'; frame++) scene = updateGame(scene, .04, viewport);
      return { ...scene, phase: preview === 'question' ? 'dialogue' : 'complete', scene: scene.scene ? { ...scene.scene, dialogueIndex: new URLSearchParams(window.location.search).get('moment') === 'title' ? DIALOGUE.findIndex((line) => line.emphasis) : DIALOGUE.length - 1, answer: preview === 'question' ? null : 'yes' } : null };
    }
    return scene;
  }
  if (restore && !preview) {
    try { return restoreProgress(state, window.localStorage); } catch { return state; }
  }
  return state;
}

export default function App() {
  const [started, setStarted] = useState(() => new URLSearchParams(window.location.search).has('preview'));
  const [starting, setStarting] = useState(false);
  const [revealing, setRevealing] = useState(false);
  const startTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => () => {
    if (startTimerRef.current !== null) clearTimeout(startTimerRef.current);
  }, []);
  const [musicEnabled, setMusicEnabled] = useState(false);
  const musicChoiceRef = useRef(musicEnabled);
  const isSpritePreview = new URLSearchParams(window.location.search).get('preview') === 'characters';
  const [previewFacing, setPreviewFacing] = useState<Character['facing']>('front');
  const [previewWalking, setPreviewWalking] = useState(false);
  const [gameState, setGameState] = useState<GameState>(() => createInitialGameState());
  const [introBubbleVisible, setIntroBubbleVisible] = useState(() => gameState.phase === 'collecting'
    && gameState.collectedOrder.length === 0 && gameState.character.position.x === CHARACTER.start.x
    && gameState.character.position.y === CHARACTER.start.y);
  const [introBubbleLeaving, setIntroBubbleLeaving] = useState(false);
  const progressRef = useRef(gameState);
  progressRef.current = gameState;
  const isPreview = new URLSearchParams(window.location.search).has('preview');
  const persist = useCallback(() => {
    if (isPreview || !started) return;
    try { saveProgress(progressRef.current, window.localStorage); } catch { /* Optional storage. */ }
  }, [isPreview, started]);
  useEffect(() => {
    const timer = window.setInterval(persist, 1000);
    const onHidden = () => { if (document.visibilityState === 'hidden') persist(); };
    window.addEventListener('pagehide', persist);
    document.addEventListener('visibilitychange', onHidden);
    return () => { window.clearInterval(timer); window.removeEventListener('pagehide', persist); document.removeEventListener('visibilitychange', onHidden); };
  }, [persist]);
  useEffect(() => { persist(); }, [persist, gameState.phase, gameState.collectedOrder.length,
    gameState.scene?.dialogueIndex, gameState.scene?.reaction, gameState.scene?.answer]);
  const [musicPlaying, setMusicPlaying] = useState(false);
  const audio = useMemo(() => createGameAudio(), []);
  const previousCollectedCountRef = useRef(0);
  const previousPhaseRef = useRef<GameState['phase']>('collecting');
  const triedAutoplayRef = useRef(false);
  const quietMoment = gameState.phase === 'dialogue' && (gameState.scene?.dialogueIndex ?? 0) >= DIALOGUE.length - 4;
  useEffect(() => {
    audio.setQuiet(quietMoment);
    return () => audio.setQuiet(false);
  }, [audio, quietMoment]);

  const restart = useCallback(() => {
    previousCollectedCountRef.current = 0;
    previousPhaseRef.current = 'collecting';
    setIntroBubbleVisible(true);
    setIntroBubbleLeaving(false);
    const fresh = createInitialGameState(false);
    progressRef.current = fresh;
    persist();
    setGameState(fresh);
  }, [persist]);

  useEffect(() => {
    if (!started) return;
    if (gameState.collectedOrder.length > previousCollectedCountRef.current) {
      audio.flower();
    }

    if (previousPhaseRef.current !== gameState.phase && gameState.phase === 'meeting') {
      audio.heart();
    }

    if (previousPhaseRef.current !== gameState.phase && gameState.phase === 'complete' && gameState.scene?.answer === 'yes') {
      audio.success();
    }

    previousCollectedCountRef.current = gameState.collectedOrder.length;
    previousPhaseRef.current = gameState.phase;
  }, [audio, gameState.collectedOrder.length, gameState.phase, started]);

  const toggleMusic = useCallback(async () => {
    const playing = await audio.toggleMusic();
    triedAutoplayRef.current = true;
    setMusicPlaying(playing);
    setMusicEnabled(playing);
  }, [audio]);

  const setMenuMusic = (enabled: boolean) => {
    musicChoiceRef.current = enabled;
    setMusicEnabled(enabled);
    triedAutoplayRef.current = true;
    if (!enabled) {
      audio.stopMusic();
      setMusicPlaying(false);
      return;
    }
    void audio.startMusic().then((playing) => {
      if (!musicChoiceRef.current) { audio.stopMusic(); return; }
      setMusicPlaying(playing);
      if (!playing) {
        setMusicEnabled(false);
        musicChoiceRef.current = false;
      }
    });
  };

  const tryStartMusic = useCallback(() => {
    setIntroBubbleLeaving(true);
    if (triedAutoplayRef.current || musicPlaying) {
      return;
    }

    triedAutoplayRef.current = true;
    void audio.startMusic().then((playing) => {
      setMusicPlaying(playing);
    });
  }, [audio, musicPlaying]);

  const musicControl = (
          <button className="corner-button" type="button" aria-label={musicPlaying ? 'Turn music off' : 'Turn music on'} onClick={toggleMusic}>
            {musicPlaying ? <Music size={18} /> : <VolumeX size={18} />}
          </button>
  );

  const returnToMenu = () => {
    persist();
    setRevealing(false);
    setStarting(false);
    setStarted(false);
  };

  const startGame = (fromBeginning: boolean) => {
    if (starting) return;
    if (fromBeginning) restart();
    setStarting(true);
    triedAutoplayRef.current = true;
    if (musicEnabled) void audio.startMusic().then(setMusicPlaying);
    startTimerRef.current = setTimeout(() => {
      setRevealing(true);
      setStarted(true);
      setStarting(false);
    }, window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 80 : 380);
  };
  const hasProgress = gameState.phase !== 'collecting' || gameState.collectedOrder.length > 0
    || gameState.character.position.x !== CHARACTER.start.x || gameState.character.position.y !== CHARACTER.start.y;

  if (!started) return (
    <main className="app-shell">
      <section className={`phone-stage start-screen${starting ? ' start-screen-leaving' : ''}`} aria-label="Главное меню" aria-busy={starting}>
        <div className="start-garden" aria-hidden="true"><div className="start-trail" /></div>
        <div className="start-card">
          <span className="start-eyebrow">МАЛЕНЬКОЕ ПРИКЛЮЧЕНИЕ ДЛЯ ТЕБЯ</span>
          <h1>"Последний<br />вопрос"</h1>
          <div className="start-character" role="img" aria-label="Твоя героиня"><img src="/assets/girl-sprite-v2.png" alt="" /></div>
          <p className="start-description">Немного цветов, немного разговоров.<br />А дальше...</p>
          <button type="button" className="start-music" role="switch" aria-checked={musicEnabled} aria-label="Музыка" onClick={() => setMenuMusic(!musicEnabled)}>
            <Music size={18} aria-hidden="true" /><span>Музыка</span>
            <span className="start-music-state" aria-hidden="true">{musicEnabled ? <Check size={22} /> : <X size={22} />}</span>
          </button>
          <button type="button" className="start-primary" disabled={starting} onClick={() => startGame(false)}>{hasProgress ? 'Продолжить' : 'Старт'}</button>
          {hasProgress ? <button type="button" className="start-secondary" disabled={starting} onClick={() => startGame(true)}>Начать заново</button> : null}
          <span className="start-footnote">Играй в своём темпе</span>
        </div>
      </section>
    </main>
  );

  return (
    <main className="app-shell">
      <section className="phone-stage" aria-label="Flower Heart game">
        {revealing ? <div className="game-reveal" aria-hidden="true" onAnimationEnd={() => setRevealing(false)} /> : null}
        <GameCanvas
          preview={isSpritePreview ? { facing: previewFacing, walking: previewWalking } : undefined}
          state={gameState}
          setState={setGameState}
          onFirstInteraction={tryStartMusic}
        />
        {isSpritePreview ? (
          <div className="sprite-preview-panel">
            <strong>Проверка персонажей</strong>
            <div className="sprite-preview-directions">
              {([['front', 'Спереди'], ['back', 'Со спины'], ['left', 'Влево'], ['right', 'Вправо']] as const).map(([facing, label]) => (
                <button key={facing} type="button" aria-pressed={previewFacing === facing} onClick={() => setPreviewFacing(facing)}>{label}</button>
              ))}
            </div>
            <button type="button" aria-pressed={previewWalking} onClick={() => setPreviewWalking((walking) => !walking)}>{previewWalking ? 'Остановить ходьбу' : 'Проверить ходьбу'}</button>
            <a href={window.location.pathname}>Вернуться к игре</a>
          </div>
        ) : gameState.phase === 'collecting' ? <Hud state={gameState} onRetry={restart} /> : null}
        {!isSpritePreview && introBubbleVisible && gameState.phase === 'collecting' ? (
          <div className={`character-bubble${introBubbleLeaving ? ' character-bubble-leaving' : ''}`} role="status" onAnimationEnd={(event) => {
            if (event.animationName === 'hint-disappear') setIntroBubbleVisible(false);
          }}>
            Нажимай на поляну, чтобы идти. Собери пять разных цветов 🌷
          </div>
        ) : null}
        {gameState.phase === 'meeting' ? <div className={`meeting-note${gameState.scene?.stage === 'entering' ? ' meeting-note-leaving' : ''}`} role="status">Букет готов. Кажется, кто-то идёт…</div> : null}
        {(gameState.phase === 'dialogue' || gameState.phase === 'complete') ? <Dialogue musicControl={musicControl} state={gameState} setState={setGameState} onMainMenu={returnToMenu} /> : null}
        {gameState.phase !== 'dialogue' && gameState.phase !== 'complete' ? <div className="corner-actions">{musicControl}</div> : null}
      </section>
    </main>
  );
}
