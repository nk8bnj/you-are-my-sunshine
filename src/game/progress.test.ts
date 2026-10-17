import { describe, expect, it } from 'vitest';
import { createFlowers } from './spawn';
import { beginMeeting } from './update';
import { DIALOGUE } from './dialogue';
import { PROGRESS_KEY, restoreProgress, saveProgress } from './progress';
import type { GameState } from './types';

function fresh(): GameState {
  return { phase: 'collecting', scene: null, character: { position: { x: 360, y: 900 }, target: { x: 360, y: 900 }, facing: 'front', isWalking: false },
    camera: { position: { x: 360, y: 700 } }, flowers: createFlowers(), collectedOrder: [], decor: [],
    heart: { active: false, position: null, timerMs: 5000 }, lastMessage: '' };
}
function memory() {
  const entries = new Map<string, string>();
  return { getItem: (key: string) => entries.get(key) ?? null, setItem: (key: string, value: string) => { entries.set(key, value); } };
}

describe('saved progress', () => {
  it('restores collected flowers, their positions and movement using current artwork', () => {
    const state = fresh(); const store = memory();
    state.flowers[0].collected = true;
    state.collectedOrder = [state.flowers[0].id];
    state.character.target = { x: 200, y: 400 };
    saveProgress(state, store);
    const restored = restoreProgress(fresh(), store);
    expect(restored.flowers).toEqual(state.flowers);
    expect(restored.collectedOrder).toEqual(state.collectedOrder);
    expect(restored.character).toEqual(state.character);
  });

  it.each(['yes', 'no'] as const)('restores the %s ending after returning from a chat', (answer) => {
    const state = fresh(); const store = memory();
    state.flowers.forEach((f) => { f.collected = true; });
    state.collectedOrder = state.flowers.map((f) => f.id);
    const end = beginMeeting(state, { width: 390, height: 844 });
    end.phase = 'complete'; end.scene!.answer = answer;
    saveProgress(end, store);
    expect(restoreProgress(fresh(), store).scene?.answer).toBe(answer);
    expect(restoreProgress(fresh(), store).phase).toBe('complete');
  });

  it('restores a quiz reaction and a partially completed proposal pause', () => {
    const base = fresh(); const store = memory();
    base.flowers.forEach((f) => { f.collected = true; });
    base.collectedOrder = base.flowers.map((f) => f.id);
    const state = beginMeeting(base, { width: 390, height: 844 });
    state.phase = 'dialogue';
    state.scene!.dialogueIndex = DIALOGUE.findIndex((line) => Boolean(line.options));
    state.scene!.reaction = DIALOGUE[state.scene!.dialogueIndex].options![0].reaction;
    saveProgress(state, store);
    expect(restoreProgress(fresh(), store).scene?.reaction).toBe(state.scene!.reaction);
    state.scene!.dialogueIndex = DIALOGUE.length - 2;
    state.scene!.reaction = null;
    state.scene!.proposalPauseMs = 640;
    saveProgress(state, store);
    expect(restoreProgress(fresh(), store).scene?.proposalPauseMs).toBe(640);
    expect(restoreProgress(fresh(), store).scene?.companion).toEqual(state.scene?.companion);
  });

  it('rejects corrupt, incompatible and incomplete snapshots', () => {
    const store = memory(); const base = fresh();
    store.setItem(PROGRESS_KEY, '{broken');
    expect(restoreProgress(base, store)).toBe(base);
    saveProgress(base, store);
    const snapshot = JSON.parse(store.getItem(PROGRESS_KEY)!);
    snapshot.state.character.position.x = null;
    store.setItem(PROGRESS_KEY, JSON.stringify(snapshot));
    expect(restoreProgress(base, store)).toBe(base);
    snapshot.revision = 'old story';
    expect(restoreProgress(base, { getItem: () => JSON.stringify(snapshot) })).toBe(base);
  });

  it('replaces old progress on replay and tolerates unavailable storage', () => {
    const state = fresh(); const store = memory();
    state.flowers[0].collected = true; state.collectedOrder = [state.flowers[0].id];
    saveProgress(state, store); saveProgress(fresh(), store);
    expect(restoreProgress(fresh(), store).collectedOrder).toEqual([]);
    expect(() => saveProgress(state, { setItem: () => { throw Error('blocked'); } })).not.toThrow();
    expect(restoreProgress(state, { getItem: () => { throw Error('blocked'); } })).toBe(state);
  });
});
