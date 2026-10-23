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
  color: string; // e.g. '#00f2fe' (cyan), '#ec4899' (pink), '#eab308' (amber)
  name: string;
  isPressed?: boolean;
}

export interface EchoReceiver {
  id: string;
  x: number;
  y: number;
  color: string; // e.g. '#c084fc' (violet)
  name: string;
  isActive?: boolean;
}

export interface Door {
  id: string;
  x: number;
  y: number;
  color: string;
  isOpen: boolean;
  linkedPlateId?: string;
  linkedTriggerIds?: string[]; // for multi-mechanism synchronization
  syncCondition?: 'ALL' | 'ANY'; // 'ALL' = all triggers must be active simultaneously
  requiredKeyId?: string; // if this door is locked and requires a key
  isLockedDoor?: boolean;
}

export interface KeyItem {
  id: string;
  x: number;
  y: number;
  name?: string;
  color?: string; // e.g. '#facc15'
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
    linkedTriggerIds?: string[];
    syncCondition?: 'ALL' | 'ANY';
    requiredKeyId?: string;
    isLockedDoor?: boolean;
  }>;
  keys?: KeyItem[];
  receivers?: Array<{
    id: string;
    x: number;
    y: number;
    color: string;
    name: string;
  }>;
}

export interface StepRecord {
  playerPos: Position;
  ghostPositions: Position[];
  keyCollected: boolean;
  activePlates: string[];
  activeReceivers: string[];
  openDoors: string[];
  isSynchronized?: boolean;
}

export interface GameState {
  levelIndex: number;
  currentLoop: number;
  maxLoops: number; // e.g. maxGhosts + 1
  currentStep: number;
  maxSteps: number;
  playerPos: Position;
  playerHistory: Position[]; // history of positions in current loop
  ghosts: Ghost[];
  keys: KeyItem[];
  doors: Door[];
  plates: PressurePlate[];
  receivers: EchoReceiver[];
  exit: ExitPortal;
  stepHistory: StepRecord[]; // for undo support
  isWon: boolean;
  isGameOver: boolean;
  isSynchronized: boolean; // true if any multi-trigger door condition is satisfied
  gameStatus: 'PLAYING' | 'WON' | 'FAILED_STEPS' | 'FAILED_LOOPS' | 'PAUSED';
}
