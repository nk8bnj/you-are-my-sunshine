import type { Character, Vector } from './types';

export function moveToward(
  position: Vector,
  target: Vector,
  speedPixelsPerSecond: number,
  deltaSeconds: number,
): { position: Vector; reached: boolean } {
  const dx = target.x - position.x;
  const dy = target.y - position.y;
  const length = Math.hypot(dx, dy);
  const maxStep = speedPixelsPerSecond * deltaSeconds;

  if (length <= maxStep || length === 0) {
    return { position: target, reached: true };
  }

  return {
    position: {
      x: position.x + (dx / length) * maxStep,
      y: position.y + (dy / length) * maxStep,
    },
    reached: false,
  };
}

export function nextFacing(from: Vector, to: Vector): Character['facing'] {
  const dx = to.x - from.x;
  const dy = to.y - from.y;

  if (Math.abs(dx) > Math.abs(dy)) {
    return dx < 0 ? 'left' : 'right';
  }

  return dy < 0 ? 'back' : 'front';
}

export function updateCamera(
  current: Vector,
  focus: Vector,
  viewport: { width: number; height: number },
  world: { width: number; height: number },
  ease: number,
): Vector {
  const desired = {
    x: clamp(focus.x, viewport.width / 2, world.width - viewport.width / 2),
    y: clamp(focus.y, viewport.height / 2, world.height - viewport.height / 2),
  };

  return {
    x: current.x + (desired.x - current.x) * ease,
    y: current.y + (desired.y - current.y) * ease,
  };
}

function clamp(value: number, min: number, max: number): number {
  if (min > max) {
    return value;
  }

  return Math.min(max, Math.max(min, value));
}
