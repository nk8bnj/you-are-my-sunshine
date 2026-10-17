import { describe, expect, it } from 'vitest';
import { createFlowers } from './spawn';
import { beginMeeting, updateGame } from './update';
import { advanceDialogue, DIALOGUE } from './dialogue';
import type { GameState } from './types';

function initial(): GameState {
  return { phase: 'collecting', scene: null, character: { position: { x: 360, y: 900 }, target: { x: 360, y: 900 }, facing: 'front', isWalking: false },
    camera: { position: { x: 360, y: 698 } }, flowers: createFlowers(), decor: [],
    heart: { position: null, timerMs: 5000, active: false }, collectedOrder: [], lastMessage: '' };
}
const viewport = { width: 390, height: 844 };

describe('bouquet meeting', () => {
  it('collects the final flower once and starts the meeting without a timed heart', () => {
    const state = initial();
    state.flowers = state.flowers.map((f, i) => ({ ...f, collected: i > 0, position: state.character.position }));
    state.collectedOrder = state.flowers.slice(1).map((f) => f.id);
    const next = updateGame(state, .04, viewport);
    expect(next.phase).toBe('meeting');
    expect(next.collectedOrder).toHaveLength(5);
    expect(next.heart.active).toBe(false);
    expect(updateGame(next, .04, viewport).collectedOrder).toHaveLength(5);
  });

  it('positions the pair and waits until the companion arrives before dialogue', () => {
    let state = beginMeeting(initial(), viewport);
    expect(state.scene?.companion.position.x).toBeGreaterThan(555);
    expect(state.scene?.stage).toBe('positioning');
    for (let i = 0; i < 500 && state.phase !== 'dialogue'; i++) state = updateGame(state, .04, viewport);
    expect(state.phase).toBe('dialogue');
    expect(state.character.isWalking).toBe(false);
    expect(state.scene?.companion.isWalking).toBe(false);
    expect(state.character.position.y).toBe(state.scene?.companion.position.y);
    expect(state.character.facing).toBe('right');
    expect(state.scene?.companion.facing).toBe('left');
    expect(updateGame(state, 10, viewport)).toBe(state);
  });

  it('leaves space beneath the actors for answers on a short phone screen', () => {
    const phone = { width: 320, height: 568 };
    let state = beginMeeting(initial(), phone);
    for (let i = 0; i < 500 && state.phase !== 'dialogue'; i++) state = updateGame(state, .04, phone);
    const feetY = state.character.position.y - state.camera.position.y + phone.height / 2 + 18;
    expect(feetY).toBeLessThan(phone.height - 260);
    expect(feetY).toBeGreaterThan(180);
  });

  it('moves the camera smoothly from a distant flower to the meeting', () => {
    const start = initial();
    start.character.position = { x: 600, y: 150 };
    start.character.target = { ...start.character.position };
    start.camera.position = { x: 525, y: 422 };
    let state = beginMeeting(start, viewport);
    let frames = 0;
    while (state.phase === 'meeting' && frames < 1000) {
      const previous = state.camera.position;
      const previousEntering = state.scene?.stage === 'entering';
      state = updateGame(state, .04, viewport);
      if (state.scene?.stage === 'positioning') {
        expect(state.scene.companion.isWalking).toBe(false);
      } else if (state.scene?.stage === 'entering' && !previousEntering) {
        expect(state.character.isWalking).toBe(false);
        expect(state.scene.companion.position.x - state.camera.position.x).toBeGreaterThan(viewport.width / 2 + 80);
      }
      expect(Math.hypot(state.camera.position.x - previous.x, state.camera.position.y - previous.y))
        .toBeLessThanOrEqual(150 * .04 + .00001);
      frames++;
    }
    expect(state.phase).toBe('dialogue');
    expect(state.character.isWalking).toBe(false);
    expect(state.scene?.companion.isWalking).toBe(false);
    const settled = updateGame(state, .04, viewport);
    expect(settled.camera.position).toEqual(state.camera.position);
  });
});

describe('dialogue progression', () => {
  it('brings both characters together only after a confirmed yes', () => {
    let state = beginMeeting(initial(), viewport);
    for (let i = 0; i < 500 && state.phase === 'meeting'; i++) state = updateGame(state, .04, viewport);
    state = { ...state, phase: 'complete', scene: { ...state.scene!, answer: 'no' } };
    expect(updateGame(state, .04, viewport)).toBe(state);
    state = { ...state, scene: { ...state.scene!, answer: 'yes' } };
    for (let i = 0; i < 100; i++) state = updateGame(state, .04, viewport);
    expect(state.scene!.companion.position.x - state.character.position.x).toBe(52);
    expect(state.character.facing).toBe('front');
    expect(state.scene!.companion.facing).toBe('front');
    expect(state.character.isWalking).toBe(false);
    expect(state.scene!.companion.isWalking).toBe(false);
    expect(updateGame(state, .04, viewport)).toBe(state);
  });

  it('pauses before the proposal, moves closer once and ignores extra taps', () => {
    let state = beginMeeting(initial(), viewport);
    state.phase = 'dialogue';
    state.scene!.dialogueIndex = DIALOGUE.length - 2;
    state.scene!.companion = { position: { x: 410, y: 820 }, target: { x: 410, y: 820 }, facing: 'left', isWalking: false };
    state.character.position = { x: 310, y: 820 };
    state = advanceDialogue(state);
    expect(state.scene?.proposalPauseMs).toBe(1200);
    expect(advanceDialogue(state)).toBe(state);
    for (let i = 0; i < 31; i++) state = updateGame(state, .04, viewport);
    expect(state.scene?.dialogueIndex).toBe(DIALOGUE.length - 1);
    expect(state.scene?.proposalPauseMs).toBe(0);
    expect(state.scene?.companion.position.x).toBe(388);
    expect(state.scene?.companion.isWalking).toBe(false);
    expect(updateGame(state, .04, viewport)).toBe(state);
  });

  it('requires an option at each quiz and shows its reaction before continuing', () => {
    let state = beginMeeting(initial(), viewport);
    state.phase = 'dialogue';
    const quizIndex = DIALOGUE.findIndex((line) => Boolean(line.options));
    state.scene!.dialogueIndex = quizIndex;
    expect(advanceDialogue(state)).toBe(state);
    state = advanceDialogue(state, 2);
    expect(state.scene?.reaction).toBe(DIALOGUE[quizIndex].options![2].reaction);
    expect(state.scene?.dialogueIndex).toBe(quizIndex);
    state = advanceDialogue(state);
    expect(state.scene?.dialogueIndex).toBe(quizIndex + 1);
    expect(state.scene?.reaction).toBeNull();
  });
  it('does not advance past the final question or after an answer', () => {
    const state = beginMeeting(initial(), viewport);
    state.phase = 'dialogue';
    state.scene!.dialogueIndex = DIALOGUE.length - 1;
    expect(advanceDialogue(state)).toBe(state);
    state.scene!.dialogueIndex = 0;
    state.phase = 'complete';
    state.scene!.answer = 'no';
    expect(advanceDialogue(state)).toBe(state);
  });
});
