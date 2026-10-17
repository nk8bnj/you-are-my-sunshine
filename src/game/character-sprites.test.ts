import { describe, expect, it } from 'vitest';
import { BOY_SPRITE, GIRL_SPRITE, getCharacterFrame } from './character-sprites';
import type { Character } from './types';

describe('character atlas playback', () => {
  for (const sprite of [GIRL_SPRITE, BOY_SPRITE]) {
    it(`keeps idle separate and plays a complete cycle for ${sprite.src}`, () => {
      for (const facing of ['front', 'back', 'left', 'right'] as const) {
        const actor: Character = { position: { x: 0, y: 0 }, target: { x: 0, y: 0 }, facing, isWalking: false };
        expect(getCharacterFrame(actor, 9999, sprite)).toBe(sprite.frames[facing][0]);
        actor.isWalking = true;
        expect([0, 1, 2, 3, 4].map((step) => getCharacterFrame(actor, step * sprite.frameMs, sprite)))
          .toEqual([1, 2, 3, 2, 1].map((index) => sprite.frames[facing][index]));
      }
    });
  }

  it('keeps all measured crops inside the atlas and normalization canvas', () => {
    for (const sprite of [GIRL_SPRITE, BOY_SPRITE]) {
      for (const frame of Object.values(sprite.frames).flat()) {
        expect(frame.x).toBeGreaterThanOrEqual(0);
        expect(frame.y).toBeGreaterThanOrEqual(0);
        expect(frame.x + frame.width).toBeLessThanOrEqual(1254);
        expect(frame.y + frame.height).toBeLessThanOrEqual(1254);
        expect(frame.height).toBeLessThanOrEqual(304);
      }
    }
  });
});
