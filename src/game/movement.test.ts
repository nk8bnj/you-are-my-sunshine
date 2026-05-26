import { describe, expect, it } from 'vitest';
import { moveToward, nextFacing, updateCamera } from './movement';

describe('movement', () => {
  it('moves toward a target without overshooting', () => {
    const result = moveToward({ x: 0, y: 0 }, { x: 10, y: 0 }, 20, 1);
    expect(result.position).toEqual({ x: 10, y: 0 });
    expect(result.reached).toBe(true);
  });

  it('moves proportionally by speed and delta time', () => {
    const result = moveToward({ x: 0, y: 0 }, { x: 100, y: 0 }, 25, 2);
    expect(result.position.x).toBe(50);
    expect(result.position.y).toBe(0);
    expect(result.reached).toBe(false);
  });

  it('chooses horizontal facing for wider x movement', () => {
    expect(nextFacing({ x: 0, y: 0 }, { x: -20, y: 5 })).toBe('left');
    expect(nextFacing({ x: 0, y: 0 }, { x: 20, y: 5 })).toBe('right');
  });

  it('keeps camera inside world bounds', () => {
    const camera = updateCamera(
      { x: 0, y: 0 },
      { x: 20, y: 20 },
      { width: 300, height: 500 },
      { width: 720, height: 1120 },
      1,
    );
    expect(camera.x).toBe(150);
    expect(camera.y).toBe(250);
  });
});
