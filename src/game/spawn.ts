import { CHARACTER, FLOWER_DEFS, HEART, WORLD } from './config';
import { distance } from './collision';
import type { DecorItem, DecorType, Flower, Vector } from './types';

const FLOWER_MIN_DISTANCE = 150;
const FLOWER_START_DISTANCE = 190;
const FLOWER_EDGE_PADDING_X = 118;
const FLOWER_EDGE_PADDING_TOP = 118;
const FLOWER_EDGE_PADDING_BOTTOM = 44;
const DECOR_TYPES: DecorType[] = ['grass', 'grass', 'stone', 'leaf', 'petal', 'sparkle'];

export function createFlowers(random: () => number = Math.random): Flower[] {
  const positions = createFlowerPositions(FLOWER_DEFS.length, random);
  return FLOWER_DEFS.map((definition, index) => ({
    ...definition,
    position: positions[index],
    collected: false,
  }));
}

export function createDecor(random: () => number = Math.random): DecorItem[] {
  const items: DecorItem[] = [];
  let attempts = 0;

  while (items.length < 28 && attempts < 500) {
    attempts += 1;
    const point = {
      x: randomRange(WORLD.safePadding, WORLD.width - WORLD.safePadding, random),
      y: randomRange(WORLD.safePadding, WORLD.height - WORLD.safePadding, random),
    };

    const farFromStart = distance(point, CHARACTER.start) >= 130;
    const farFromDecor = items.every((item) => distance(item.position, point) >= 42);

    if (farFromStart && farFromDecor) {
      items.push({
        id: `decor-${items.length}`,
        type: DECOR_TYPES[Math.floor(random() * DECOR_TYPES.length)],
        position: point,
        variant: Math.floor(random() * 4),
      });
    }
  }

  items.push(...createButterflies(random));
  return items;
}

function createButterflies(random: () => number): DecorItem[] {
  return Array.from({ length: 2 }, (_, index) => ({
    id: `butterfly-${index}`,
    type: 'butterfly' as const,
    position: {
      x: randomRange(WORLD.safePadding + 80, WORLD.width - WORLD.safePadding - 80, random),
      y: randomRange(WORLD.safePadding + 160, WORLD.height - WORLD.safePadding - 220, random),
    },
    variant: index,
    drift: {
      radiusX: randomRange(34, 76, random),
      radiusY: randomRange(18, 42, random),
      speed: randomRange(0.0012, 0.0022, random),
      phase: randomRange(0, Math.PI * 2, random),
    },
  }));
}

function createFlowerPositions(count: number, random: () => number): Vector[] {
  const positions: Vector[] = [];
  let attempts = 0;

  while (positions.length < count && attempts < 600) {
    attempts += 1;
    const point = {
      x: randomRange(FLOWER_EDGE_PADDING_X, WORLD.width - FLOWER_EDGE_PADDING_X, random),
      y: randomRange(FLOWER_EDGE_PADDING_TOP, WORLD.height - FLOWER_EDGE_PADDING_BOTTOM, random),
    };

    const farFromStart = distance(point, CHARACTER.start) >= FLOWER_START_DISTANCE;
    const farFromFlowers = positions.every((position) => distance(position, point) >= FLOWER_MIN_DISTANCE);

    if (farFromStart && farFromFlowers) {
      positions.push(point);
    }
  }

  while (positions.length < count) {
    positions.push({
      x: randomRange(FLOWER_EDGE_PADDING_X, WORLD.width - FLOWER_EDGE_PADDING_X, random),
      y: randomRange(FLOWER_EDGE_PADDING_TOP, WORLD.height - FLOWER_EDGE_PADDING_BOTTOM, random),
    });
  }

  return positions;
}

function randomRange(min: number, max: number, random: () => number): number {
  return min + (max - min) * random();
}

export function createHeartPosition(characterPosition: Vector): Vector {
  const candidates = createHeartCandidates(characterPosition);
  return candidates[Math.floor(Math.random() * candidates.length)] ?? {
    x: WORLD.width / 2,
    y: WORLD.height / 2,
  };
}

export function createVisibleHeartPosition(
  characterPosition: Vector,
  cameraPosition: Vector,
  viewport: { width: number; height: number },
): Vector {
  const minX = Math.max(WORLD.safePadding, cameraPosition.x - viewport.width / 2 + 72);
  const maxX = Math.min(WORLD.width - WORLD.safePadding, cameraPosition.x + viewport.width / 2 - 72);
  const minY = Math.max(WORLD.safePadding, cameraPosition.y - viewport.height / 2 + 150);
  const maxY = Math.min(WORLD.height - WORLD.safePadding, cameraPosition.y + viewport.height / 2 - 96);
  const candidates: Vector[] = [];
  const step = 32;

  for (let x = minX; x <= maxX; x += step) {
    for (let y = minY; y <= maxY; y += step) {
      const point = { x, y };
      const pointDistance = distance(characterPosition, point);
      if (pointDistance >= 220 && pointDistance <= HEART.maxDistance) {
        candidates.push(point);
      }
    }
  }

  return candidates[Math.floor(Math.random() * candidates.length)] ?? createHeartPosition(characterPosition);
}

function createHeartCandidates(characterPosition: Vector): Vector[] {
  const candidates: Vector[] = [];
  const step = 40;

  for (let x = WORLD.safePadding; x <= WORLD.width - WORLD.safePadding; x += step) {
    for (let y = WORLD.safePadding; y <= WORLD.height - WORLD.safePadding; y += step) {
      const point = { x, y };
      const pointDistance = distance(characterPosition, point);
      if (pointDistance >= HEART.minDistance && pointDistance <= HEART.maxDistance) {
        candidates.push(point);
      }
    }
  }

  return candidates;
}
