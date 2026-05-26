import type { Vector } from './types';

export function distance(a: Vector, b: Vector): number {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

export function isWithinRadius(a: Vector, b: Vector, radius: number): boolean {
  return distance(a, b) <= radius;
}
