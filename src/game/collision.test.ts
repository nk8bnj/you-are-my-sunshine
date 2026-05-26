import { describe, expect, it } from 'vitest';
import { distance, isWithinRadius } from './collision';

describe('collision', () => {
  it('calculates distance between two points', () => {
    expect(distance({ x: 0, y: 0 }, { x: 3, y: 4 })).toBe(5);
  });

  it('returns true when inside radius', () => {
    expect(isWithinRadius({ x: 0, y: 0 }, { x: 3, y: 4 }, 5)).toBe(true);
  });

  it('returns false when outside radius', () => {
    expect(isWithinRadius({ x: 0, y: 0 }, { x: 6, y: 0 }, 5)).toBe(false);
  });
});
