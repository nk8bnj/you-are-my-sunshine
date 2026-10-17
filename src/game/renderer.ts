import { CHARACTER, FLOWER_SPRITE, WORLD } from './config';
import type { Camera, Character, DecorItem, Flower, HeartState, Vector } from './types';

import { BOY_SPRITE, GIRL_SPRITE, getCharacterFrame } from './character-sprites';
import type { CharacterSprite, SpriteFrame } from './character-sprites';

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
  companion: Character | null;
  companionSprite: HTMLImageElement | null;
  celebrating?: boolean;
};

export function renderGame(input: RenderInput): void {
  const { ctx, viewport, camera, character, flowers, decor, heart, sprite, flowerSprite } = input;
  const time = performance.now();

  ctx.clearRect(0, 0, viewport.width, viewport.height);
  ctx.imageSmoothingEnabled = false;

  drawMeadow(ctx, viewport, camera);
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

  const actors = [
    { character, image: sprite, config: GIRL_SPRITE },
    ...(input.companion ? [{ character: input.companion, image: input.companionSprite, config: BOY_SPRITE }] : []),
  ].sort((a, b) => a.character.position.y - b.character.position.y);
  for (const actor of actors) {
    drawCharacter(ctx, actor.character, camera, viewport, actor.image, time, actor.config);
  }
  if (input.celebrating && input.companion) {
    if (!character.isWalking && !input.companion.isWalking && character.facing === 'front' && input.companion.facing === 'front') {
      drawJoinedHands(ctx, toScreen(character.position, camera, viewport), toScreen(input.companion.position, camera, viewport));
    }
    const center = toScreen({ x: (character.position.x + input.companion.position.x) / 2,
      y: character.position.y - 150 }, camera, viewport);
    ctx.save(); ctx.translate(Math.round(center.x), Math.round(center.y)); ctx.scale(.38, .38);
    drawHeart(ctx, 0, 0, time); ctx.restore();
  }
}

function drawJoinedHands(ctx: CanvasRenderingContext2D, girl: Vector, boy: Vector): void {
  const centerX = Math.round((girl.x + boy.x) / 2);
  const handY = Math.round(girl.y - 16);
  // Pixel-stepped sleeves cover the resting inner hands and extend toward the clasp.
  ctx.fillStyle = '#17294c';
  ctx.fillRect(Math.round(girl.x + 15), handY - 11, 7, 14);
  ctx.fillRect(Math.round(girl.x + 19), handY - 6, 6, 7);
  ctx.fillStyle = '#24212b';
  ctx.fillRect(Math.round(boy.x - 23), handY - 19, 8, 11);
  ctx.fillRect(Math.round(boy.x - 25), handY - 12, 7, 9);
  ctx.fillRect(centerX + 1, handY - 5, 6, 6);
  ctx.fillStyle = '#ac7253'; ctx.fillRect(centerX - 4, handY - 3, 9, 6);
  ctx.fillStyle = '#efb28b'; ctx.fillRect(centerX - 4, handY - 3, 5, 4);
  ctx.fillStyle = '#f6c59c'; ctx.fillRect(centerX, handY - 2, 4, 4);
}

let gardenLayer: HTMLCanvasElement | null = null;

function drawMeadow(ctx: CanvasRenderingContext2D, viewport: { width: number; height: number }, camera: Camera): void {
  if (!gardenLayer) gardenLayer = createGardenLayer();
  ctx.fillStyle = '#64886a';
  ctx.fillRect(0, 0, viewport.width, viewport.height);
  const origin = toScreen({ x: 0, y: 0 }, camera, viewport);
  ctx.drawImage(gardenLayer, Math.round(origin.x), Math.round(origin.y));
}

function createGardenLayer(): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width = WORLD.width;
  canvas.height = WORLD.height;
  const ctx = canvas.getContext('2d')!;
  ctx.fillStyle = '#92b77e';
  ctx.fillRect(0, 0, WORLD.width, WORLD.height);
  // Seeded texture stays anchored to the world and is painted only once.
  let seed = 741;
  const random = () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296; };
  for (let i = 0; i < 1050; i++) {
    const x = Math.floor(random() * WORLD.width / 4) * 4;
    const y = Math.floor(random() * WORLD.height / 4) * 4;
    ctx.fillStyle = ['#9cbe86', '#89ad75', '#96b982', '#a3c38c'][i % 4];
    ctx.fillRect(x, y, 12 + Math.floor(random() * 6) * 4, 4 + Math.floor(random() * 3) * 4);
  }
  // A winding sandy walk opens into a quiet clearing for the conversation.
  for (let y = 30; y < WORLD.height - 26; y += 4) {
    const center = 360 + Math.sin(y / 170) * 65;
    const clearing = Math.max(0, 1 - ((y - 820) / 100) ** 2);
    const half = Math.max(36, Math.sqrt(clearing) * 132);
    const x = Math.round((center - half) / 4) * 4;
    const width = Math.round(half * 2 / 4) * 4;
    ctx.fillStyle = '#819c68'; ctx.fillRect(x - 8, y + 4, width + 16, 4);
    ctx.fillStyle = '#b5b783'; ctx.fillRect(x - 4, y, width + 8, 4);
    ctx.fillStyle = '#ddcaa3'; ctx.fillRect(x, y, width, 4);
    if (y % 20 === 2) { ctx.fillStyle = '#e5d4af'; ctx.fillRect(x + 12, y, Math.min(20, width - 16), 2); }
  }
  for (let i = 0; i < 650; i++) {
    const x = Math.floor(random() * WORLD.width / 4) * 4;
    const y = Math.floor(random() * WORLD.height / 4) * 4;
    const center = 360 + Math.sin(y / 170) * 65;
    const half = Math.max(36, Math.sqrt(Math.max(0, 1 - ((y - 820) / 100) ** 2)) * 132);
    if (Math.abs(x - center) < half - 8) {
      ctx.fillStyle = i % 2 ? '#c9b68f' : '#f0dfbc'; ctx.fillRect(x, y, 4, 2);
    } else {
      ctx.fillStyle = i % 3 ? '#78a16c' : '#abc78e';
      ctx.fillRect(x, y, 2, 5); ctx.fillRect(x + 4, y - 2, 2, 6);
    }
  }
  const bush = (x: number, y: number, blossoms: boolean) => {
    ctx.fillStyle = '#67835b'; ctx.fillRect(x - 22, y + 8, 48, 12);
    ctx.fillStyle = '#4f7954'; ctx.fillRect(x - 26, y - 6, 52, 20); ctx.fillRect(x - 18, y - 18, 36, 40);
    ctx.fillStyle = '#638f5d'; ctx.fillRect(x - 22, y - 10, 40, 18); ctx.fillRect(x - 12, y - 22, 28, 32);
    ctx.fillStyle = '#7da267'; ctx.fillRect(x - 14, y - 16, 12, 6); ctx.fillRect(x + 6, y - 10, 10, 4);
    if (blossoms) for (const [dx, dy] of [[-12, -8], [9, -14], [15, 5], [-4, 7]]) {
      ctx.fillStyle = '#d9a1b0'; ctx.fillRect(x + dx - 3, y + dy - 3, 8, 8);
      ctx.fillStyle = '#f5d6cb'; ctx.fillRect(x + dx, y + dy, 3, 3);
    }
  };
  for (let y = 25; y < WORLD.height; y += 36) {
    bush(24, y, y % 3 === 0); bush(WORLD.width - 24, y, y % 4 === 0);
  }
  for (let x = 40; x < WORLD.width; x += 38) {
    bush(x, 22, x % 3 === 0); bush(x, WORLD.height - 20, x % 4 === 0);
  }
  for (const [x, y] of [[150, 230], [180, 250], [552, 395], [578, 415], [145, 610], [170, 628], [560, 950], [585, 965]]) bush(x, y, true);
  // Small clusters of ground flowers are distinct from collectible tall flowers.
  for (let i = 0; i < 42; i++) {
    const x = (i % 2 ? 142 : 550) + Math.floor(random() * 50);
    const y = 100 + Math.floor(random() * 900);
    ctx.fillStyle = '#668c5b'; ctx.fillRect(x, y + 2, 2, 6);
    ctx.fillStyle = i % 3 ? '#f3e5bf' : '#dfacb8';
    ctx.fillRect(x - 2, y, 6, 2); ctx.fillRect(x, y - 2, 2, 6);
  }
  return canvas;
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
  config: CharacterSprite,
): void {
  const screen = toScreen(character.position, camera, viewport);

  ctx.fillStyle = 'rgba(40, 55, 36, 0.22)';
  ctx.beginPath();
  ctx.ellipse(screen.x, screen.y + 10, 28, 10, 0, 0, Math.PI * 2);
  ctx.fill();

  const sourceFrame = getCharacterFrame(character, time, config);
  const frame = sprite?.complete && sprite.naturalWidth > 0 ? getCleanSpriteFrame(sprite, sourceFrame) : null;
  if (frame) {
    drawSpriteFrame(ctx, frame, screen, config);
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
  screen: Vector,
  config: CharacterSprite,
): void {
  // Each direction has its own artwork: no mirroring or per-frame stretching.
  ctx.drawImage(frame, Math.round(screen.x - config.renderWidth / 2),
    Math.round(screen.y - config.renderHeight + 18), config.renderWidth, config.renderHeight);
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
  canvas.width = 200;
  canvas.height = 304;
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
    304 - frame.height,
    frame.width,
    frame.height,
  );

  cachedFrames.set(key, canvas);
  return canvas;
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
