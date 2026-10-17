import type { Character } from './types';

export type SpriteFrame = { x: number; y: number; width: number; height: number };
export type CharacterSprite = {
  src: string;
  renderWidth: number;
  renderHeight: number;
  frameMs: number;
  frames: Record<Character['facing'], SpriteFrame[]>;
};

// Generated sheets are not a regular grid. Each measured crop has the same
// width and a measured foot baseline; the renderer pads them to 200 × 304.
function row(centers: number[], baseline: number, top: number): SpriteFrame[] {
  return centers.map((center) => ({ x: center - 100, y: top, width: 200, height: baseline - top }));
}

export const GIRL_SPRITE: CharacterSprite = {
  src: '/assets/girl-sprite-v2.png',
  renderWidth: 74,
  renderHeight: 112.48,
  frameMs: 160,
  frames: {
    front: row([214, 489, 763, 1037], 312, 28),
    back: row([214, 491, 762, 1041], 614, 328),
    left: row([223, 499, 771, 1048], 909, 630),
    right: row([197, 474, 752, 1031], 1210, 923),
  },
};

export const BOY_SPRITE: CharacterSprite = {
  src: '/assets/boy-sprite-v1.png',
  renderWidth: 85,
  renderHeight: 129.2,
  frameMs: 160,
  frames: {
    front: row([256, 498, 754, 1004], 310, 6),
    back: row([256, 496, 751, 1000], 621, 317),
    left: row([252, 497, 745, 1003], 923, 627),
    right: row([259, 498, 755, 1009], 1235, 935),
  },
};

export function getCharacterFrame(character: Character, time: number, sprite: CharacterSprite): SpriteFrame {
  const frames = sprite.frames[character.facing];
  // Idle is separate; the walk uses contact / passing / opposite contact / passing.
  const cycle = [1, 2, 3, 2];
  return frames[character.isWalking ? cycle[Math.floor(time / sprite.frameMs) % cycle.length] : 0];
}
