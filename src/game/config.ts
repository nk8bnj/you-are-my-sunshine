import type { Character, FlowerType, Vector } from './types';

export const WORLD = {
  width: 720,
  height: 1120,
  safePadding: 72,
  cameraEase: 0.12,
};

export const CHARACTER = {
  start: { x: WORLD.width / 2, y: WORLD.height - 220 } satisfies Vector,
  speedPixelsPerSecond: 190,
  radius: 28,
  renderWidth: 82,
  renderHeight: 108,
};

export const COLLECTION = {
  flowerRadius: 46,
  heartRadius: 54,
};

export const HEART = {
  durationMs: 5000,
  minDistance: 330,
  maxDistance: 610,
  safetyMs: 450,
};

export const FLOWER_DEFS: Array<{
  id: FlowerType;
  label: string;
  color: string;
  accent: string;
  sprite: { x: number; y: number; width: number; height: number };
}> = [
  { id: 'daisy', label: 'Daisy', color: '#fff7cf', accent: '#f2c94c', sprite: { x: 64, y: 0, width: 32, height: 32 } },
  { id: 'tulip', label: 'Tulip', color: '#ff7d9c', accent: '#be3455', sprite: { x: 160, y: 32, width: 32, height: 32 } },
  { id: 'rose', label: 'Rose', color: '#ff4f7a', accent: '#8f1736', sprite: { x: 96, y: 32, width: 32, height: 32 } },
  { id: 'bluebell', label: 'Bluebell', color: '#8fb6ff', accent: '#3f5fb8', sprite: { x: 96, y: 0, width: 32, height: 32 } },
  { id: 'sunflower', label: 'Sunflower', color: '#ffd447', accent: '#7a4a16', sprite: { x: 128, y: 32, width: 32, height: 32 } },
];

export const SPRITE = {
  src: '/assets/girl-sprite.png',
  frameMs: 150,
  fallbackFrame: { x: 40, y: 0, width: 150, height: 225 },
  frames: {
    front: [
      { x: 40, y: 0, width: 150, height: 225 },
      { x: 256, y: 0, width: 150, height: 225 },
      { x: 688, y: 0, width: 150, height: 225 },
      { x: 256, y: 0, width: 150, height: 225 },
    ],
    back: [
      { x: 40, y: 230, width: 150, height: 225 },
      { x: 256, y: 230, width: 150, height: 225 },
      { x: 688, y: 230, width: 150, height: 225 },
      { x: 256, y: 230, width: 150, height: 225 },
    ],
    left: [
      { x: 256, y: 460, width: 150, height: 225 },
      { x: 472, y: 460, width: 150, height: 225 },
      { x: 904, y: 460, width: 150, height: 225 },
      { x: 472, y: 460, width: 150, height: 225 },
    ],
    right: [
      { x: 256, y: 460, width: 150, height: 225 },
      { x: 472, y: 460, width: 150, height: 225 },
      { x: 904, y: 460, width: 150, height: 225 },
      { x: 472, y: 460, width: 150, height: 225 },
    ],
  } satisfies Record<Character['facing'], Array<{ x: number; y: number; width: number; height: number }>>,
};

export const FLOWER_SPRITE = {
  src: '/assets/Flowers_Without_Outline_Spritesheet.png',
  renderWidth: 48,
  renderHeight: 48,
};
