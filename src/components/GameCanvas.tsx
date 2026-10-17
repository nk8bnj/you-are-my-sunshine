import { useEffect, useRef } from "react";
import type { Dispatch, PointerEvent, SetStateAction } from "react";
import { FLOWER_SPRITE, WORLD } from "../game/config";
import { nextFacing } from "../game/movement";
import { updateGame } from "../game/update";
import { renderGame } from "../game/renderer";
import { BOY_SPRITE, GIRL_SPRITE } from "../game/character-sprites";
import type { Character, GameState, Vector } from "../game/types";

type GameCanvasProps = {
  state: GameState;
  setState: Dispatch<SetStateAction<GameState>>;
  onFirstInteraction: () => void;
  preview?: { facing: Character["facing"]; walking: boolean };
};

export default function GameCanvas({
  state,
  setState,
  onFirstInteraction,
  preview,
}: GameCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const stateRef = useRef(state);
  const previewRef = useRef(preview);
  previewRef.current = preview;
  const companionSpriteRef = useRef<HTMLImageElement | null>(null);
  const spriteRef = useRef<HTMLImageElement | null>(null);
  const flowerSpriteRef = useRef<HTMLImageElement | null>(null);
  const lastTimeRef = useRef<number | null>(null);

  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  useEffect(() => {
    const sprite = new Image();
    sprite.src = GIRL_SPRITE.src;
    const companionSprite = new Image();
    companionSprite.src = BOY_SPRITE.src;
    companionSpriteRef.current = companionSprite;
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
      const ctx = canvas.getContext("2d");
      ctx?.setTransform(ratio, 0, 0, ratio, 0, 0);
    };

    resize();
    window.addEventListener("resize", resize);
    return () => window.removeEventListener("resize", resize);
  }, []);

  useEffect(() => {
    let frame = 0;

    const tick = (time: number) => {
      const canvas = canvasRef.current;
      const ctx = canvas?.getContext("2d");
      if (!canvas || !ctx) {
        frame = requestAnimationFrame(tick);
        return;
      }

      const rect = canvas.getBoundingClientRect();
      const lastTime = lastTimeRef.current ?? time;
      const deltaSeconds = Math.min(0.04, (time - lastTime) / 1000);
      lastTimeRef.current = time;

      setState((current) => {
        const next = previewRef.current ? current : updateGame(current, deltaSeconds, {
          width: rect.width,
          height: rect.height,
        });
        stateRef.current = next;
        renderGame({
          ctx,
          viewport: { width: rect.width, height: rect.height },
          camera: previewRef.current ? { position: { x: 360, y: Math.min(900, WORLD.height - rect.height / 2) } } : next.camera,
          character: previewRef.current ? {
            ...next.character, position: { x: 310, y: 900 },
            facing: previewRef.current.facing, isWalking: previewRef.current.walking,
          } : next.character,
          companion: previewRef.current ? {
            position: { x: previewRef.current ? 410 : 460, y: 900 },
            target: { x: 460, y: 900 },
            facing: previewRef.current?.facing ?? 'front',
            isWalking: previewRef.current?.walking ?? false,
          } : next.scene?.stage === 'positioning' ? null : next.scene?.companion ?? null,
          companionSprite: companionSpriteRef.current,
          flowers: next.flowers,
          decor: next.decor,
          heart: next.heart,
          celebrating: next.phase === 'complete' && next.scene?.answer === 'yes',
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

    if (previewRef.current || stateRef.current.phase !== "collecting") return;
    onFirstInteraction();
    canvas.setPointerCapture(event.pointerId);
    const rect = canvas.getBoundingClientRect();
    const current = stateRef.current;
    const target: Vector = {
      x: event.clientX - rect.left + current.camera.position.x - rect.width / 2,
      y: event.clientY - rect.top + current.camera.position.y - rect.height / 2,
    };

    setState((previous) => previous.phase !== "collecting" ? previous : ({
      ...previous,
      character: {
        ...previous.character,
        target: clampToWorld(target),
        facing: nextFacing(previous.character.position, target),
        isWalking: true,
      },
      lastMessage: previous.lastMessage,
    }));
  };

  return (
    <canvas
      ref={canvasRef}
      className="game-canvas"
      onPointerDown={handlePointerDown}
    />
  );
}

function clampToWorld(point: Vector): Vector {
  return {
    x: Math.min(
      WORLD.width - WORLD.safePadding,
      Math.max(WORLD.safePadding, point.x),
    ),
    y: Math.min(
      WORLD.height - WORLD.safePadding,
      Math.max(WORLD.safePadding, point.y),
    ),
  };
}
