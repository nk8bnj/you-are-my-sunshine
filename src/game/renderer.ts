import { CHARACTER, COLLECTION, FLOWER_SPRITE, SPRITE, WORLD } from './config';
import type { Camera, Character, DecorItem, Flower, HeartState, Vector } from './types';

type SpriteFrame = {
  x: number;
  y: number;
  width: number;
  height: number;
};

const cleanedSpriteFrames = new WeakMap<HTMLImageElement, Map<string, HTMLCanvasElement>>();

export type RenderInput = {
  ctx: CanvasRenderingContext2D;
  viewport: { width: number; height: number };
  camera: Camera;
  character: Character;
  flowers: Flower[];
  decor: DecorItem[];
  heart: HeartState;
  sprite: HTMLImageElement | null;
  flowerSprite: HTMLImageElement | null;
};

export function renderGame(input: RenderInput): void {
  const { ctx, viewport, camera, character, flowers, decor, heart, sprite, flowerSprite } = input;
  const time = performance.now();

  ctx.clearRect(0, 0, viewport.width, viewport.height);
  ctx.imageSmoothingEnabled = false;

  drawMeadow(ctx, viewport, camera);
  drawWorldEdgeBushes(ctx, viewport, camera);
  drawDecor(ctx, viewport, camera, decor, time);

  for (const flower of flowers) {
    if (!flower.collected) {
      drawFlower(ctx, viewport, flower, camera, flowerSprite);
    }
  }

  if (heart.active && heart.position) {
    const screen = toScreen(heart.position, camera, viewport);
    drawHeart(ctx, screen.x, screen.y, time);
  }

  drawCharacter(ctx, character, camera, viewport, sprite, time);
}

function drawMeadow(ctx: CanvasRenderingContext2D, viewport: { width: number; height: number }, camera: Camera): void {
  ctx.fillStyle = '#9fd58a';
  ctx.fillRect(0, 0, viewport.width, viewport.height);

  const tile = 32;
  const startWorldX = Math.floor((camera.position.x - viewport.width / 2) / tile) * tile;
  const startWorldY = Math.floor((camera.position.y - viewport.height / 2) / tile) * tile;
  const endWorldX = camera.position.x + viewport.width / 2 + tile;
  const endWorldY = camera.position.y + viewport.height / 2 + tile;

  for (let x = startWorldX; x < endWorldX; x += tile) {
    for (let y = startWorldY; y < endWorldY; y += tile) {
      const screen = toScreen({ x, y }, camera, viewport);
      ctx.fillStyle = (x / tile + y / tile) % 3 === 0 ? '#94cb80' : '#a4d890';
      ctx.fillRect(screen.x, screen.y, tile, tile);
      ctx.fillStyle = '#75b96b';
      ctx.fillRect(screen.x + 8, screen.y + 18, 3, 8);
      ctx.fillRect(screen.x + 20, screen.y + 9, 3, 7);
    }
  }
}

function drawDecor(
  ctx: CanvasRenderingContext2D,
  viewport: { width: number; height: number },
  camera: Camera,
  decor: DecorItem[],
  time: number,
): void {
  for (const item of decor) {
    const position = getDecorPosition(item, time);
    const screen = toScreen(position, camera, viewport);
    const x = Math.round(screen.x);
    const y = Math.round(screen.y);

    if (item.type === 'grass') {
      drawGrassClump(ctx, x, y, item.variant);
    } else if (item.type === 'stone') {
      drawStone(ctx, x, y, item.variant);
    } else if (item.type === 'leaf') {
      drawLeaf(ctx, x, y, item.variant);
    } else if (item.type === 'petal') {
      drawPetal(ctx, x, y, item.variant);
    } else if (item.type === 'sparkle') {
      drawSparklePatch(ctx, x, y, item.variant);
    } else {
      drawButterfly(ctx, x, y, item.variant, time);
    }
  }
}

function getDecorPosition(item: DecorItem, time: number): Vector {
  if (!item.drift) {
    return item.position;
  }

  const t = time * item.drift.speed + item.drift.phase;
  return {
    x: item.position.x + Math.sin(t) * item.drift.radiusX,
    y: item.position.y + Math.sin(t * 1.7) * item.drift.radiusY,
  };
}

function drawGrassClump(ctx: CanvasRenderingContext2D, x: number, y: number, variant: number): void {
  ctx.fillStyle = variant % 2 === 0 ? '#6db766' : '#78bf70';
  ctx.fillRect(x - 7, y + 3, 3, 10);
  ctx.fillRect(x - 1, y - 1, 3, 14);
  ctx.fillRect(x + 5, y + 4, 3, 9);
  ctx.fillStyle = '#8ccf80';
  ctx.fillRect(x + 1, y + 2, 2, 7);
}

function drawStone(ctx: CanvasRenderingContext2D, x: number, y: number, variant: number): void {
  ctx.fillStyle = variant % 2 === 0 ? '#d9d6c7' : '#cfcbb8';
  ctx.fillRect(x - 9, y - 4, 18, 9);
  ctx.fillStyle = '#b8b4a4';
  ctx.fillRect(x - 4, y - 7, 12, 4);
}

function drawLeaf(ctx: CanvasRenderingContext2D, x: number, y: number, variant: number): void {
  ctx.fillStyle = variant % 2 === 0 ? '#5ead5f' : '#4f9f58';
  ctx.fillRect(x - 6, y - 2, 13, 5);
  ctx.fillRect(x - 2, y - 5, 7, 11);
  ctx.fillStyle = '#3f8546';
  ctx.fillRect(x - 1, y - 1, 9, 2);
}

function drawPetal(ctx: CanvasRenderingContext2D, x: number, y: number, variant: number): void {
  ctx.fillStyle = variant % 2 === 0 ? '#ffadc2' : '#fff0b8';
  ctx.fillRect(x - 4, y - 2, 9, 5);
  ctx.fillRect(x - 1, y - 5, 5, 9);
  ctx.fillStyle = 'rgba(110, 82, 74, 0.12)';
  ctx.fillRect(x - 5, y + 4, 11, 2);
}

function drawSparklePatch(ctx: CanvasRenderingContext2D, x: number, y: number, variant: number): void {
  ctx.fillStyle = variant % 2 === 0 ? 'rgba(255, 250, 226, 0.5)' : 'rgba(255, 216, 130, 0.42)';
  ctx.fillRect(x - 1, y - 8, 2, 16);
  ctx.fillRect(x - 8, y - 1, 16, 2);
  ctx.fillRect(x - 3, y - 3, 6, 6);
}

function drawButterfly(ctx: CanvasRenderingContext2D, x: number, y: number, variant: number, time: number): void {
  const flap = Math.sin(time / 90 + variant) > 0 ? 1 : 0;
  const wing = variant % 2 === 0 ? '#ffd36f' : '#ff9bc0';
  const wingDark = variant % 2 === 0 ? '#e99b35' : '#d95d8d';
  const wingOffset = flap ? 7 : 5;

  ctx.fillStyle = 'rgba(45, 73, 40, 0.12)';
  ctx.fillRect(x - 7, y + 13, 14, 3);
  ctx.fillStyle = wingDark;
  ctx.fillRect(x - wingOffset - 6, y - 5, 8, 10);
  ctx.fillRect(x + wingOffset - 2, y - 5, 8, 10);
  ctx.fillStyle = wing;
  ctx.fillRect(x - wingOffset - 5, y - 9, 7, 8);
  ctx.fillRect(x + wingOffset - 1, y - 9, 7, 8);
  ctx.fillRect(x - wingOffset - 4, y + 3, 6, 7);
  ctx.fillRect(x + wingOffset, y + 3, 6, 7);
  ctx.fillStyle = '#45342d';
  ctx.fillRect(x - 1, y - 7, 3, 16);
  ctx.fillStyle = '#fff7da';
  ctx.fillRect(x - 2, y - 9, 2, 2);
  ctx.fillRect(x + 2, y - 9, 2, 2);
}

function drawWorldEdgeBushes(ctx: CanvasRenderingContext2D, viewport: { width: number; height: number }, camera: Camera): void {
  ctx.fillStyle = '#5aa35f';
  const topLeft = toScreen({ x: 0, y: 0 }, camera, viewport);
  const bottomRight = toScreen({ x: WORLD.width, y: WORLD.height }, camera, viewport);
  ctx.fillRect(topLeft.x, topLeft.y, WORLD.width, 28);
  ctx.fillRect(topLeft.x, bottomRight.y - 28, WORLD.width, 28);
  ctx.fillRect(topLeft.x, topLeft.y, 28, WORLD.height);
  ctx.fillRect(bottomRight.x - 28, topLeft.y, 28, WORLD.height);
}

function drawFlower(
  ctx: CanvasRenderingContext2D,
  viewport: { width: number; height: number },
  flower: Flower,
  camera: Camera,
  flowerSprite: HTMLImageElement | null,
): void {
  const screen = toScreen(flower.position, camera, viewport);
  const x = Math.round(screen.x);
  const y = Math.round(screen.y);

  drawFlowerShadow(ctx, x, y);

  if (!flowerSprite?.complete || flowerSprite.naturalWidth === 0) {
    drawFallbackFlower(ctx, x, y, flower.color, flower.accent);
    return;
  }

  ctx.drawImage(
    flowerSprite,
    flower.sprite.x,
    flower.sprite.y,
    flower.sprite.width,
    flower.sprite.height,
    x - FLOWER_SPRITE.renderWidth / 2,
    y - FLOWER_SPRITE.renderHeight + 16,
    FLOWER_SPRITE.renderWidth,
    FLOWER_SPRITE.renderHeight,
  );
}

function drawFlowerShadow(ctx: CanvasRenderingContext2D, x: number, y: number): void {
  ctx.fillStyle = 'rgba(45, 73, 40, 0.2)';
  ctx.fillRect(x - 12, y + 16, 24, 5);
  ctx.fillRect(x - 8, y + 13, 16, 4);
}

function drawFallbackFlower(ctx: CanvasRenderingContext2D, x: number, y: number, color: string, accent: string): void {
  ctx.fillStyle = '#2f7c3d';
  ctx.fillRect(x - 2, y - 1, 4, 24);
  ctx.fillStyle = color;
  ctx.fillRect(x - 14, y - 28, 28, 22);
  ctx.fillStyle = accent;
  ctx.fillRect(x - 5, y - 20, 10, 10);
}

function drawHeart(ctx: CanvasRenderingContext2D, x: number, y: number, time: number): void {
  const pulse = 1 + Math.sin(time / 170) * 0.05;
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(pulse, pulse);
  drawPixelHeart(ctx);
  ctx.restore();
}

function drawPixelHeart(ctx: CanvasRenderingContext2D): void {
  const size = 8;
  const rows = [
    '001110011100',
    '011111111110',
    '111111111111',
    '111111111111',
    '011111111110',
    '001111111100',
    '000111111000',
    '000011110000',
    '000001100000',
  ];

  const width = rows[0].length * size;
  const height = rows.length * size;
  const originX = -width / 2;
  const originY = -height / 2;

  for (let row = 0; row < rows.length; row += 1) {
    for (let col = 0; col < rows[row].length; col += 1) {
      if (rows[row][col] !== '1') {
        continue;
      }

      ctx.fillStyle = '#101010';
      ctx.fillRect(originX + col * size - 4, originY + row * size - 4, size + 8, size + 8);
    }
  }

  for (let row = 0; row < rows.length; row += 1) {
    for (let col = 0; col < rows[row].length; col += 1) {
      if (rows[row][col] !== '1') {
        continue;
      }

      ctx.fillStyle = row > 4 ? '#d92d13' : '#ff3a12';
      ctx.fillRect(originX + col * size, originY + row * size, size, size);
    }
  }

  ctx.fillStyle = '#ffffff';
  ctx.fillRect(originX + 3 * size, originY + 2 * size, size, size);
  ctx.fillRect(originX + 4 * size, originY + 1 * size, size, size);
}

function drawCharacter(
  ctx: CanvasRenderingContext2D,
  character: Character,
  camera: Camera,
  viewport: { width: number; height: number },
  sprite: HTMLImageElement | null,
  time: number,
): void {
  const screen = toScreen(character.position, camera, viewport);

  ctx.fillStyle = 'rgba(40, 55, 36, 0.22)';
  ctx.beginPath();
  ctx.ellipse(screen.x, screen.y + 10, 28, 10, 0, 0, Math.PI * 2);
  ctx.fill();

  const sourceFrame = getSpriteFrame(character, time);
  const frame = sprite?.complete && sprite.naturalWidth > 0 ? getCleanSpriteFrame(sprite, sourceFrame) : null;
  if (frame) {
    drawSpriteFrame(ctx, frame, character, screen);
    return;
  }

  ctx.fillStyle = '#20202a';
  ctx.fillRect(screen.x - 22, screen.y - 72, 44, 66);
  ctx.fillStyle = '#f2c37b';
  ctx.fillRect(screen.x - 20, screen.y - 104, 40, 34);
  ctx.fillStyle = '#d9a441';
  ctx.fillRect(screen.x - 27, screen.y - 112, 54, 30);
}

function drawSpriteFrame(
  ctx: CanvasRenderingContext2D,
  frame: HTMLCanvasElement,
  character: Character,
  screen: Vector,
): void {
  const x = screen.x - CHARACTER.renderWidth / 2;
  const y = screen.y - CHARACTER.renderHeight + 18;

  if (character.facing !== 'left') {
    ctx.drawImage(frame, x, y, CHARACTER.renderWidth, CHARACTER.renderHeight);
    return;
  }

  ctx.save();
  ctx.translate(screen.x, 0);
  ctx.scale(-1, 1);
  ctx.drawImage(frame, -CHARACTER.renderWidth / 2, y, CHARACTER.renderWidth, CHARACTER.renderHeight);
  ctx.restore();
}

function getSpriteFrame(character: Character, time: number): SpriteFrame {
  const frames = SPRITE.frames[character.facing] ?? SPRITE.frames.front;
  if (!character.isWalking) {
    return frames[0] ?? SPRITE.fallbackFrame;
  }

  return frames[Math.floor(time / SPRITE.frameMs) % frames.length] ?? SPRITE.fallbackFrame;
}

function getCleanSpriteFrame(sprite: HTMLImageElement, frame: SpriteFrame): HTMLCanvasElement | null {
  let cachedFrames = cleanedSpriteFrames.get(sprite);
  if (!cachedFrames) {
    cachedFrames = new Map();
    cleanedSpriteFrames.set(sprite, cachedFrames);
  }

  const key = `${frame.x}:${frame.y}:${frame.width}:${frame.height}`;
  const cached = cachedFrames.get(key);
  if (cached) {
    return cached;
  }

  const canvas = document.createElement('canvas');
  canvas.width = frame.width;
  canvas.height = frame.height;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) {
    return null;
  }

  ctx.drawImage(
    sprite,
    frame.x,
    frame.y,
    frame.width,
    frame.height,
    0,
    0,
    frame.width,
    frame.height,
  );

  const image = ctx.getImageData(0, 0, canvas.width, canvas.height);
  removeConnectedCheckerboard(image);
  ctx.putImageData(image, 0, 0);
  cachedFrames.set(key, canvas);
  return canvas;
}

function removeConnectedCheckerboard(image: ImageData): void {
  const { width, height, data } = image;
  const visited = new Uint8Array(width * height);
  const queue: number[] = [];

  const enqueue = (x: number, y: number) => {
    if (x < 0 || y < 0 || x >= width || y >= height) {
      return;
    }

    const index = y * width + x;
    if (visited[index]) {
      return;
    }

    const dataIndex = index * 4;
    if (!isCheckerboardPixel(data[dataIndex], data[dataIndex + 1], data[dataIndex + 2], data[dataIndex + 3])) {
      return;
    }

    visited[index] = 1;
    queue.push(index);
  };

  for (let x = 0; x < width; x += 1) {
    enqueue(x, 0);
    enqueue(x, height - 1);
  }

  for (let y = 0; y < height; y += 1) {
    enqueue(0, y);
    enqueue(width - 1, y);
  }

  while (queue.length > 0) {
    const index = queue.shift()!;
    const x = index % width;
    const y = Math.floor(index / width);
    data[index * 4 + 3] = 0;

    enqueue(x + 1, y);
    enqueue(x - 1, y);
    enqueue(x, y + 1);
    enqueue(x, y - 1);
  }
}

function isCheckerboardPixel(r: number, g: number, b: number, a: number): boolean {
  if (a < 8) {
    return true;
  }

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  return max - min < 10 && r > 180 && g > 180 && b > 180;
}

function toScreen(
  point: Vector,
  camera: Camera,
  viewport: { width: number; height: number },
): Vector {
  return {
    x: point.x - camera.position.x + viewport.width / 2,
    y: point.y - camera.position.y + viewport.height / 2,
  };
}
