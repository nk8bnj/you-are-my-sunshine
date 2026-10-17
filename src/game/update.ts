import { CHARACTER, COLLECTION, WORLD } from './config';
import { isWithinRadius } from './collision';
import { moveToward, nextFacing, updateCamera } from './movement';
import type { Character, GameState, Vector } from './types';

const MEETING_WALK_SPEED = CHARACTER.speedPixelsPerSecond * 0.7;

function walk(actor: Character, seconds: number, speed = CHARACTER.speedPixelsPerSecond): Character {
  const moved = moveToward(actor.position, actor.target, speed, seconds);
  return { ...actor, position: moved.position, isWalking: !moved.reached,
    facing: actor.isWalking ? nextFacing(actor.position, actor.target) : actor.facing };
}

export function beginMeeting(state: GameState, viewport: { width: number; height: number }): GameState {
  const y = Math.min(WORLD.height - 300, Math.max(viewport.height * .55, state.character.position.y));
  const target = { x: WORLD.width / 2 - 50, y };
  return { ...state, phase: 'meeting', heart: { ...state.heart, active: false },
    character: { ...state.character, target, isWalking: true },
    scene: {
      stage: 'positioning', dialogueIndex: 0, reaction: null, answer: null, proposalPauseMs: 0,
      companion: { position: { x: WORLD.width / 2 + viewport.width / 2 + 90, y },
        target: { x: WORLD.width / 2 + 50, y }, facing: 'left', isWalking: false },
    }, lastMessage: 'Букет готов. Кажется, кто-то идёт…' };
}

export function updateGame(current: GameState, seconds: number, viewport: { width: number; height: number }): GameState {
  if (current.phase === 'complete' && current.scene?.answer === 'yes') {
    const companion = current.scene.companion;
    const center = (current.character.target.x + companion.target.x) / 2;
    const approach = (actor: Character, x: number): Character => {
      const target = { x, y: current.character.position.y };
      const moved = moveToward(actor.position, target, 42, seconds);
      return { ...actor, position: moved.position, target, isWalking: !moved.reached,
        facing: moved.reached ? 'front' : nextFacing(actor.position, target) };
    };
    const character = approach(current.character, center - 26);
    const partner = approach(companion, center + 26);
    if (!character.isWalking && !partner.isWalking && current.character.facing === 'front' && companion.facing === 'front') return current;
    return { ...current, character, scene: { ...current.scene, companion: partner } };
  }
  if (current.phase === 'dialogue' && current.scene && current.scene.proposalPauseMs > 0) {
    const scene = current.scene;
    const moved = moveToward(scene.companion.position, scene.companion.target, 55, seconds);
    const remaining = Math.max(0, scene.proposalPauseMs - seconds * 1000);
    return { ...current, scene: { ...scene, proposalPauseMs: remaining,
      dialogueIndex: scene.dialogueIndex + (remaining === 0 ? 1 : 0),
      companion: { ...scene.companion, position: moved.position, isWalking: !moved.reached },
    } };
  }
  if (current.phase === 'meeting' && current.scene) {
    const scene = { ...current.scene };
    let character = current.character;
    if (scene.stage === 'positioning') {
      character = walk(character, seconds, MEETING_WALK_SPEED);
      if (!character.isWalking) {
        character = { ...character, facing: 'right' };
      }
    } else {
      scene.companion = walk(scene.companion, seconds, MEETING_WALK_SPEED);
    }
    // Keep three answer buttons below the actors even on short phone screens.
    const feetY = Math.min(viewport.height * .65, viewport.height - 270);
    const focus: Vector = {
      x: scene.stage === 'positioning' && character.isWalking ? character.position.x : WORLD.width / 2,
      y: character.position.y + viewport.height / 2 - feetY + 18,
    };
    // Follow her actual walk, rather than aiming at the distant meeting point.
    // Time-based easing and a speed limit avoid a fast initial camera jump.
    const eased = updateCamera(current.camera.position, focus, viewport, WORLD, 1 - Math.exp(-3 * seconds));
    const cameraPosition = moveToward(current.camera.position, eased, 150, seconds).position;
    const destination = updateCamera(cameraPosition, focus, viewport, WORLD, 1);
    const cameraSettled = Math.hypot(destination.x - cameraPosition.x, destination.y - cameraPosition.y) < 1;
    if (scene.stage === 'positioning' && !character.isWalking && cameraSettled) {
      scene.stage = 'entering';
      scene.companion = { ...scene.companion,
        position: { x: cameraPosition.x + viewport.width / 2 + 90, y: character.position.y },
        isWalking: true };
    }
    if (scene.stage === 'entering' && !scene.companion.isWalking
      && cameraSettled) scene.stage = 'talking';
    return { ...current, character, scene, phase: scene.stage === 'talking' ? 'dialogue' : 'meeting',
      camera: { position: cameraPosition } };
  }
  if (current.phase !== 'collecting') return current;
  const character = walk(current.character, seconds);
  const camera = { position: updateCamera(current.camera.position, character.position, viewport, WORLD, WORLD.cameraEase) };
  const collectedOrder = [...current.collectedOrder];
  const flowers = current.flowers.map((flower) => {
    if (!flower.collected && isWithinRadius(character.position, flower.position, COLLECTION.flowerRadius)) {
      collectedOrder.push(flower.id);
      return { ...flower, collected: true };
    }
    return flower;
  });
  const next = { ...current, character, camera, flowers, collectedOrder };
  return flowers.length > 0 && flowers.every((flower) => flower.collected) ? beginMeeting(next, viewport) : next;
}
