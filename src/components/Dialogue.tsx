import type { CSSProperties, Dispatch, ReactNode, SetStateAction } from 'react';
import { advanceDialogue, DIALOGUE } from '../game/dialogue';
import { BOY_SPRITE, GIRL_SPRITE } from '../game/character-sprites';
import type { GameState } from '../game/types';

const ENDINGS = {
  yes: 'Теперь официально вместе ❤️ Напиши мне, хочу услышать это от тебя.',
  no: 'Мне жаль, я надеялся на другой ответ. Немного грустно, но я уважаю твоё решение. Если захочешь, можешь написать мне и сказать об этом сама. А если не хочется, можешь ничего не писать. Я пойму.',
};

const dialogueSizes = [
  ...DIALOGUE.flatMap((line) => [line.text, ...(line.options?.map((option) => option.reaction) ?? [])]),
  'Теперь официально вместе. Следующее приключение уже наше ❤️',
];

export default function Dialogue({ state, setState, onMainMenu, musicControl }: {
  state: GameState; setState: Dispatch<SetStateAction<GameState>>; onMainMenu: () => void; musicControl: ReactNode;
}) {
  const scene = state.scene;
  if (!scene) return null;
  const line = DIALOGUE[scene.dialogueIndex];
  const final = scene.dialogueIndex === DIALOGUE.length - 1;
  const completed = state.phase === 'complete';
  const speaker = scene.reaction || final || completed ? 'Ты' : line.speaker;
  const portrait = speaker === 'Она' ? GIRL_SPRITE : BOY_SPRITE;
  // Visible silhouette bounds, excluding each atlas frame's transparent gutters.
  const bounds = speaker === 'Она'
    ? { x: 127, y: 30, width: 174, height: 280 }
    : { x: 192, y: 8, width: 128, height: 300 };
  const scale = 96 / bounds.height;
  const portraitStyle = {
    '--portrait-x': `${-bounds.x * scale}px`,
    '--portrait-y': `${-bounds.y * scale}px`,
    '--portrait-width': `${bounds.width * scale}px`,
    '--portrait-sheet-size': `${1254 * scale}px`,
  } as CSSProperties;
  const text = completed ? ENDINGS[scene.answer === 'yes' ? 'yes' : 'no'] : scene.reaction ?? line.text;
  const choose = (answer: 'yes' | 'no') => setState((current) => current.scene && current.phase === 'dialogue'
    ? { ...current, phase: 'complete', scene: { ...current.scene, answer } } : current);
  return (
    <section className="dialogue-overlay" aria-label="Разговор">
      <div className={`dialogue-bubble${completed ? " dialogue-ending" : ""}`} data-speaker={speaker} aria-live="polite" aria-atomic="true">
        <div className="dialogue-portrait-slot">
          <span className="dialogue-portrait" style={portraitStyle} role="img" aria-label={speaker === 'Она' ? 'Говорит девушка' : 'Говорит Никита'}>
            <img src={portrait.src} alt="" aria-hidden="true" draggable={false} />
          </span>
        </div>
        <div className="dialogue-copy">
          {!completed && dialogueSizes.map((sample, index) => <p className="dialogue-measure" aria-hidden="true" key={index}>{sample}</p>)}
          <p className={line.emphasis && !scene.reaction && !completed ? 'dialogue-title-moment' : undefined}>
            {line.emphasis && !scene.reaction && !completed
              ? <>Остался <strong>последний вопрос</strong>.</> : text}
          </p>
        </div>
      </div>
      <div className="dialogue-actions">
        <div className="dialogue-music">{musicControl}</div>
        {completed ? <>
          <a className="dialogue-write" href="https://t.me/nk8bnj" target="_blank" rel="noopener noreferrer">{scene.answer === 'yes' ? 'Написать' : 'Написать, если захочется'}</a>
          <button className="dialogue-secondary" type="button" onClick={onMainMenu}>Главное меню</button>
        </> : final ? <>
            <button type="button" onClick={() => choose('yes')}>Да ❤️</button>
            <button className="dialogue-secondary" type="button" onClick={() => choose('no')}>Нет</button>
          </> : line.options && !scene.reaction ? line.options.map((option, index) => <button type="button" key={option.text} onClick={() => setState((current) => advanceDialogue(current, index))}>{option.text}</button>)
          : <button type="button" disabled={scene.proposalPauseMs > 0} onClick={() => setState((current) => advanceDialogue(current))}>{scene.proposalPauseMs > 0 ? '…' : scene.reaction ? 'Дальше' : line.nextLabel ?? 'Дальше'}</button>}
      </div>
    </section>
  );
}
