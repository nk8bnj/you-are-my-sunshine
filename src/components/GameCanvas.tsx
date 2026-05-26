import { useEffect, useRef } from 'react';
import type { Dispatch, PointerEvent, SetStateAction } from 'react';
import { CHARACTER, COLLECTION, FLOWER_SPRITE, HEART, SPRITE, WORLD } from '../game/config';
import { isWithinRadius } from '../game/collision';
import { moveToward, nextFacing, updateCamera } from '../game/movement';
import { renderGame } from '../game/renderer';
import { createVisibleHeartPosition } from '../game/spawn';
import type { GameState, Vector } from '../game/types';

type GameCanvasProps = {
  state: GameState;
  setState: Dispatch<SetStateAction<GameState>>;
  onFirstInteraction: () => void;
};

export default function GameCanvas({ state, setState, onFirstInteraction }: GameCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const stateRef = useRef(state);
  const spriteRef = useRef<HTMLImageElement | null>(null);
  const flowerSpriteRef = useRef<HTMLImageElement | null>(null);
  const lastTimeRef = useRef<number | null>(null);

  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  useEffect(() => {
    const sprite = new Image();
    sprite.src = SPRITE.src;
    spriteRef.current = sprite;

    const flowerSprite = new Image();
    flowerSprite.src = FLOWER_SPRITE.src;
    flowerSpriteRef.current = flowerSprite;
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) {
      return;
    }

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      const ratio = window.devicePixelRatio || 1;
      canvas.width = Math.floor(rect.width * ratio);
      canvas.height = Math.floor(rect.height * ratio);
      const ctx = canvas.getContext('2d');
      ctx?.setTransform(ratio, 0, 0, ratio, 0, 0);
    };

    resize();
    window.addEventListener('resize', resize);
    return () => window.removeEventListener('resize', resize);
  }, []);

  useEffect(() => {
    let frame = 0;

    const tick = (time: number) => {
      const canvas = canvasRef.current;
      const ctx = canvas?.getContext('2d');
      if (!canvas || !ctx) {
        frame = requestAnimationFrame(tick);
        return;
      }

      const rect = canvas.getBoundingClientRect();
      const lastTime = lastTimeRef.current ?? time;
      const deltaSeconds = Math.min(0.04, (time - lastTime) / 1000);
      lastTimeRef.current = time;

      setState((current) => {
        const next = updateGame(current, deltaSeconds, { width: rect.width, height: rect.height });
        stateRef.current = next;
        renderGame({
          ctx,
          viewport: { width: rect.width, height: rect.height },
          camera: next.camera,
          character: next.character,
          flowers: next.flowers,
          decor: next.decor,
          heart: next.heart,
          sprite: spriteRef.current,
          flowerSprite: flowerSpriteRef.current,
        });
        return next;
      });

      frame = requestAnimationFrame(tick);
    };

    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [setState]);

  const handlePointerDown = (event: PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) {
      return;
    }

    onFirstInteraction();
    canvas.setPointerCapture(event.pointerId);
    const rect = canvas.getBoundingClientRect();
    const current = stateRef.current;
    const target: Vector = {
      x: event.clientX - rect.left + current.camera.position.x - rect.width / 2,
      y: event.clientY - rect.top + current.camera.position.y - rect.height / 2,
    };

    setState((previous) => ({
      ...previous,
      character: {
        ...previous.character,
        target: clampToWorld(target),
        facing: nextFacing(previous.character.position, target),
        isWalking: true,
      },
      lastMessage: previous.phase === 'heart' ? 'Quick, catch the heart!' : previous.lastMessage,
    }));
  };

  return <canvas ref={canvasRef} className="game-canvas" onPointerDown={handlePointerDown} />;
}

function updateGame(
  current: GameState,
  deltaSeconds: number,
  viewport: { width: number; height: number },
): GameState {
  if (current.phase === 'success' || current.phase === 'retry') {
    return current;
  }

  const moved = moveToward(
    current.character.position,
    current.character.target,
    CHARACTER.speedPixelsPerSecond,
    deltaSeconds,
  );
  const character = {
    ...current.character,
    position: moved.position,
    isWalking: !moved.reached,
  };

  const camera = {
    position: updateCamera(current.camera.position, character.position, viewport, WORLD, WORLD.cameraEase),
  };

  if (current.phase === 'collecting') {
    const collectedOrder = [...current.collectedOrder];
    const flowers = current.flowers.map((flower) => {
      if (!flower.collected && isWithinRadius(character.position, flower.position, COLLECTION.flowerRadius)) {
        collectedOrder.push(flower.id);
        return { ...flower, collected: true };
      }
      return flower;
    });

    const allCollected = flowers.every((flower) => flower.collected);
    if (allCollected) {
      return {
        ...current,
        phase: 'heart',
        character,
        camera,
        flowers,
        collectedOrder,
        heart: {
          active: true,
          position: createVisibleHeartPosition(character.position, camera.position, viewport),
          timerMs: HEART.durationMs,
        },
        lastMessage: 'The heart appeared. Quick!',
      };
    }

    return { ...current, character, camera, flowers, collectedOrder };
  }

  if (current.phase === 'heart') {
    const timerMs = Math.max(0, current.heart.timerMs - deltaSeconds * 1000);
    const reachedHeart = Boolean(
      current.heart.position && isWithinRadius(character.position, current.heart.position, COLLECTION.heartRadius),
    );

    if (reachedHeart) {
      const settledCharacter = {
        ...character,
        target: character.position,
        facing: 'front' as const,
        isWalking: false,
      };

      return {
        ...current,
        phase: 'success',
        character: settledCharacter,
        camera,
        heart: { ...current.heart, timerMs, active: false },
        lastMessage: 'You caught the heart.',
      };
    }

    if (timerMs <= 0) {
      return {
        ...current,
        phase: 'retry',
        character,
        camera,
        heart: { ...current.heart, timerMs: 0, active: false },
        lastMessage: 'The heart got shy. Let us gather the bouquet again.',
      };
    }

    return {
      ...current,
      character,
      camera,
      heart: { ...current.heart, timerMs },
    };
  }

  return current;
}

function clampToWorld(point: Vector): Vector {
  return {
    x: Math.min(WORLD.width - WORLD.safePadding, Math.max(WORLD.safePadding, point.x)),
    y: Math.min(WORLD.height - WORLD.safePadding, Math.max(WORLD.safePadding, point.y)),
  };
}
