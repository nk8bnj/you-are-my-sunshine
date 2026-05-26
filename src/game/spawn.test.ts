import { describe, expect, it } from 'vitest';
import { HEART, WORLD } from './config';
import { distance } from './collision';
import { createFlowers, createHeartPosition } from './spawn';

describe('spawn', () => {
  it('creates five different flowers inside world bounds', () => {
    const flowers = createFlowers(() => 0.5);
    expect(flowers).toHaveLength(5);
    expect(new Set(flowers.map((flower) => flower.id)).size).toBe(5);
    for (const flower of flowers) {
      expect(flower.position.x).toBeGreaterThanOrEqual(WORLD.safePadding);
      expect(flower.position.y).toBeGreaterThanOrEqual(WORLD.safePadding);
      expect(flower.position.x).toBeLessThanOrEqual(WORLD.width - WORLD.safePadding);
      expect(flower.position.y).toBeLessThanOrEqual(WORLD.height);
      expect(flower.position.x).toBeGreaterThan(50);
      expect(flower.position.x).toBeLessThan(WORLD.width - 50);
      expect(flower.position.y).toBeGreaterThan(100);
    }
  });

  it('randomizes flower positions between new games', () => {
    const first = createFlowers();
    const second = createFlowers();
    expect(first.map((flower) => flower.position)).not.toEqual(second.map((flower) => flower.position));
  });

  it('creates a heart within configured distance constraints', () => {
    const character = { x: 360, y: 560 };
    const heart = createHeartPosition(character);
    const heartDistance = distance(character, heart);
    expect(heartDistance).toBeGreaterThanOrEqual(HEART.minDistance);
    expect(heartDistance).toBeLessThanOrEqual(HEART.maxDistance);
  });
});
