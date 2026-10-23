export type Direction = 'UP' | 'DOWN' | 'LEFT' | 'RIGHT' | 'WAIT';

export interface Position {
  x: number;
  y: number;
}

export type CellType = 'EMPTY' | 'WALL';

export interface PressurePlate {
  id: string;
  x: number;
  y: number;
  color: string; // e.g. '#00f2fe' (cyan), '#f59e0b' (amber), '#10b981' (emerald)
  name: string;
  isPressed?: boolean;
}

export interface Door {
  id: string;
  x: number;
  y: number;
  color: string;
  isOpen: boolean;
  linkedPlateId?: string; // If controlled by a pressure plate
  requiredKeyId?: string; // If locked by a key
  isLockedDoor?: boolean;
}

export interface KeyItem {
  id: string;
  x: number;
  y: number;
  name: string;
  color?: string; // e.g. '#facc15' (gold)
  isCollected: boolean;
}

export interface ExitPortal {
  x: number;
  y: number;
  requiresKey: boolean;
  isUnlocked: boolean;
}

export interface Ghost {
  id: number; // 1 or 2
  color: string;
  name: string;
  path: Position[]; // Path from step 0 to step N
}

export interface LevelDef {
  id: number;
  title: string;
  subtitle: string;
  description: string;
  hint: string;
  width: number;
  height: number;
  maxSteps: number;
  maxGhosts: number;
  playerStart: Position;
  exit: ExitPortal;
  walls: Position[];
  plates: PressurePlate[];
  doors: Array<{
    id: string;
    x: number;
    y: number;
    color: string;
    linkedPlateId?: string;
    requiredKeyId?: string;
    isLockedDoor?: boolean;
  }>;
  keys?: KeyItem[];
}

export interface StepRecord {
  playerPos: Position;
  ghostPositions: Position[];
  keyCollected: boolean;
  activePlates: string[];
  openDoors: string[];
}

export interface GameState {
  levelIndex: number;
  currentLoop: number;
  maxLoops: number;
  currentStep: number;
  maxSteps: number;
  playerPos: Position;
  playerHistory: Position[];
  ghosts: Ghost[];
  keys: KeyItem[];
  doors: Door[];
  plates: PressurePlate[];
  exit: ExitPortal;
  stepHistory: StepRecord[];
  isWon: boolean;
  isGameOver: boolean;
  gameStatus: 'PLAYING' | 'WON' | 'FAILED_STEPS' | 'FAILED_LOOPS' | 'PAUSED';
}
