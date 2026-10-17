export type GamePhase = 'collecting' | 'heart' | 'success' | 'retry' | 'meeting' | 'dialogue' | 'complete';

export type Vector = {
  x: number;
  y: number;
};

export type FlowerType = 'daisy' | 'tulip' | 'rose' | 'bluebell' | 'sunflower';

export type Flower = {
  id: FlowerType;
  label: string;
  color: string;
  accent: string;
  sprite: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  position: Vector;
  collected: boolean;
};

export type DecorType = 'grass' | 'stone' | 'leaf' | 'petal' | 'sparkle' | 'butterfly';

export type DecorItem = {
  id: string;
  type: DecorType;
  position: Vector;
  variant: number;
  drift?: {
    radiusX: number;
    radiusY: number;
    speed: number;
    phase: number;
  };
};

export type Character = {
  position: Vector;
  target: Vector;
  facing: 'front' | 'back' | 'left' | 'right';
  isWalking: boolean;
};

export type Camera = {
  position: Vector;
};

export type HeartState = {
  position: Vector | null;
  timerMs: number;
  active: boolean;
};

export type GameState = {
  phase: GamePhase;
  scene: {
    stage: 'positioning' | 'entering' | 'talking';
    companion: Character;
    dialogueIndex: number;
    reaction: string | null;
    answer: 'yes' | 'no' | null;
    proposalPauseMs: number;
    turnAwayMs?: number;
  } | null;
  character: Character;
  camera: Camera;
  flowers: Flower[];
  decor: DecorItem[];
  heart: HeartState;
  lastMessage: string;
  collectedOrder: FlowerType[];
};
