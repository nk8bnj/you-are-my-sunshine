import { DIALOGUE } from './dialogue';
import { WORLD } from './config';
import type { Character, GameState, Vector } from './types';

export const PROGRESS_KEY = 'flower-heart-progress-v1';
const revision = DIALOGUE.map((line) => line.text).join('|');
const point = (v: unknown): v is Vector => {
  if (!v || typeof v !== 'object') return false;
  const p = v as Vector;
  return Number.isFinite(p.x) && Number.isFinite(p.y) && p.x >= 0 && p.x <= WORLD.width && p.y >= 0 && p.y <= WORLD.height;
};
const actor = (v: unknown): v is Character => {
  if (!v || typeof v !== 'object') return false;
  const a = v as Character;
  return point(a.position) && point(a.target) && ['front', 'back', 'left', 'right'].includes(a.facing) && typeof a.isWalking === 'boolean';
};

export function restoreProgress(fresh: GameState, storage: Pick<Storage, 'getItem'>): GameState {
  try {
    const saved = JSON.parse(storage.getItem(PROGRESS_KEY) ?? 'null');
    if (!saved || saved.revision !== revision) return fresh;
    const s = saved.state as GameState;
    if (!s || !['collecting', 'meeting', 'dialogue', 'complete'].includes(s.phase) || !actor(s.character) || !point(s.camera?.position)) return fresh;
    if (!Array.isArray(s.flowers) || s.flowers.length !== fresh.flowers.length || !Array.isArray(s.collectedOrder)) return fresh;
    if (!s.flowers.every((f, i) => f?.id === fresh.flowers[i].id && point(f.position) && typeof f.collected === 'boolean')) return fresh;
    const picked = s.flowers.filter((f) => f.collected).map((f) => f.id);
    if (new Set(s.collectedOrder).size !== s.collectedOrder.length || picked.length !== s.collectedOrder.length || !picked.every((id) => s.collectedOrder.includes(id))) return fresh;
    if (s.phase === 'collecting') {
      if (s.scene !== null || picked.length === fresh.flowers.length) return fresh;
    } else {
      const scene = s.scene;
      if (picked.length !== fresh.flowers.length || !scene || !actor(scene.companion) || !['positioning', 'entering', 'talking'].includes(scene.stage)) return fresh;
      if (!Number.isInteger(scene.dialogueIndex) || scene.dialogueIndex < 0 || scene.dialogueIndex >= DIALOGUE.length) return fresh;
      if (scene.reaction !== null && !DIALOGUE[scene.dialogueIndex].options?.some((option) => option.reaction === scene.reaction)) return fresh;
      if (!Number.isFinite(scene.proposalPauseMs) || scene.proposalPauseMs < 0 || scene.proposalPauseMs > 1200) return fresh;
      if (scene.turnAwayMs !== undefined && (!Number.isFinite(scene.turnAwayMs) || scene.turnAwayMs < 0 || scene.turnAwayMs > 1100)) return fresh;
      if (s.phase === 'complete' ? !['yes', 'no'].includes(scene.answer ?? '') : scene.answer !== null) return fresh;
    }
    return { ...fresh, phase: s.phase, character: s.character, camera: s.camera, scene: s.scene,
      collectedOrder: s.collectedOrder,
      flowers: fresh.flowers.map((f, i) => ({ ...f, position: s.flowers[i].position, collected: s.flowers[i].collected })),
    };
  } catch { return fresh; }
}

export function saveProgress(state: GameState, storage: Pick<Storage, 'setItem'>): void {
  try {
    const { phase, character, camera, flowers, collectedOrder, scene } = state;
    storage.setItem(PROGRESS_KEY, JSON.stringify({ revision, state: { phase, character, camera,
      flowers: flowers.map(({ id, position, collected }) => ({ id, position, collected })), collectedOrder, scene } }));
  } catch { /* Storage can be unavailable in private browsers; gameplay continues. */ }
}
