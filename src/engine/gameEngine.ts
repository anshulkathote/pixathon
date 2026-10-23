import type {
  GameState,
  LevelDef,
  Direction,
  Position,
  StepRecord,
  Ghost,
  Door,
  EchoReceiver,
} from '../types/game';
import { LEVELS } from './levels';

export const GHOST_COLORS = ['#c084fc', '#f59e0b', '#10b981'];

export function getLevelDef(levelIndex: number): LevelDef {
  const level = LEVELS.find((l) => l.id === levelIndex);
  if (!level) {
    throw new Error(`Level ${levelIndex} not found`);
  }
  return level;
}

export function isPosEqual(a: Position, b: Position): boolean {
  return a.x === b.x && a.y === b.y;
}

export function createInitialState(levelIndex: number): GameState {
  const level = getLevelDef(levelIndex);
  const playerPos = { ...level.playerStart };
  const keys = level.keys ? level.keys.map((k) => ({ ...k, isCollected: false })) : [];
  const plates = level.plates.map((p) => ({ ...p, isPressed: false }));
  const receivers: EchoReceiver[] = level.receivers
    ? level.receivers.map((r) => ({ ...r, isActive: false }))
    : [];
  const doors = level.doors.map((d) => ({ ...d, isOpen: false }));
  const exit = {
    ...level.exit,
    isUnlocked: !level.exit.requiresKey,
  };

  const state: GameState = {
    levelIndex,
    currentLoop: 1,
    maxLoops: level.maxGhosts + 1,
    currentStep: 0,
    maxSteps: level.maxSteps,
    playerPos,
    playerHistory: [{ ...playerPos }],
    ghosts: [],
    keys,
    doors,
    plates,
    receivers,
    exit,
    stepHistory: [],
    isWon: false,
    isGameOver: false,
    isSynchronized: false,
    gameStatus: 'PLAYING',
  };

  // Compute mechanisms at step 0
  updateMechanisms(state);

  // Initial step history record
  state.stepHistory = [createStepRecord(state)];

  return state;
}

function createStepRecord(state: GameState): StepRecord {
  return {
    playerPos: { ...state.playerPos },
    ghostPositions: state.ghosts.map((g) => {
      const idx = Math.min(state.currentStep, g.path.length - 1);
      return { ...g.path[idx] };
    }),
    keyCollected: state.keys.length > 0 && state.keys.every((k) => k.isCollected),
    activePlates: state.plates
      .filter((p) => isPlatePressed(p.x, p.y, state.playerPos, state.ghosts, state.currentStep))
      .map((p) => p.id),
    activeReceivers: state.receivers
      .filter((r) => isReceiverActive(r.x, r.y, state.ghosts, state.currentStep))
      .map((r) => r.id),
    openDoors: state.doors.filter((d) => d.isOpen).map((d) => d.id),
    isSynchronized: state.isSynchronized,
  };
}

export function isPlatePressed(
  plateX: number,
  plateY: number,
  playerPos: Position,
  ghosts: Ghost[],
  currentStep: number
): boolean {
  if (playerPos.x === plateX && playerPos.y === plateY) {
    return true;
  }
  for (const ghost of ghosts) {
    const idx = Math.min(currentStep, ghost.path.length - 1);
    const gPos = ghost.path[idx];
    if (gPos && gPos.x === plateX && gPos.y === plateY) {
      return true;
    }
  }
  return false;
}

/**
 * Echo Receivers respond ONLY to ghosts.
 * Even if the player is standing on it, it does not activate.
 */
export function isReceiverActive(
  receiverX: number,
  receiverY: number,
  ghosts: Ghost[],
  currentStep: number
): boolean {
  for (const ghost of ghosts) {
    const idx = Math.min(currentStep, ghost.path.length - 1);
    const gPos = ghost.path[idx];
    if (gPos && gPos.x === receiverX && gPos.y === receiverY) {
      return true;
    }
  }
  return false;
}

export function isTriggerActiveAtStep(
  triggerId: string,
  state: GameState,
  hypotheticalPlayerPos: Position,
  targetStep: number
): boolean {
  // Check if it's a pressure plate
  const plate = state.plates.find((p) => p.id === triggerId);
  if (plate) {
    if (hypotheticalPlayerPos.x === plate.x && hypotheticalPlayerPos.y === plate.y) {
      return true;
    }
    for (const ghost of state.ghosts) {
      const idx = Math.min(targetStep, ghost.path.length - 1);
      const gPos = ghost.path[idx];
      if (gPos && gPos.x === plate.x && gPos.y === plate.y) {
        return true;
      }
    }
    return false;
  }

  // Check if it's an Echo Receiver (Ghost only!)
  const receiver = state.receivers.find((r) => r.id === triggerId);
  if (receiver) {
    for (const ghost of state.ghosts) {
      const idx = Math.min(targetStep, ghost.path.length - 1);
      const gPos = ghost.path[idx];
      if (gPos && gPos.x === receiver.x && gPos.y === receiver.y) {
        return true;
      }
    }
    return false;
  }

  return false;
}

export function isDoorOpenAtStep(
  door: Door,
  state: GameState,
  targetPos: Position,
  targetStep: number
): boolean {
  // 1. Locked Door requiring Key
  if (door.requiredKeyId || door.isLockedDoor) {
    const reqKey = state.keys.find((k) => k.id === (door.requiredKeyId || 'key-1'));
    if (reqKey && (reqKey.isCollected || isPosEqual(reqKey, targetPos))) {
      return true;
    }
    return false;
  }

  // 2. Multi-trigger synchronization door
  if (door.linkedTriggerIds && door.linkedTriggerIds.length > 0) {
    const syncCond = door.syncCondition || 'ALL';
    if (syncCond === 'ALL') {
      // ALL triggers must be active simultaneously
      return door.linkedTriggerIds.every((trigId) =>
        isTriggerActiveAtStep(trigId, state, targetPos, targetStep)
      );
    } else {
      // ANY trigger satisfies condition
      return door.linkedTriggerIds.some((trigId) =>
        isTriggerActiveAtStep(trigId, state, targetPos, targetStep)
      );
    }
  }

  // 3. Single plate link (standard)
  if (door.linkedPlateId) {
    return isTriggerActiveAtStep(door.linkedPlateId, state, targetPos, targetStep);
  }

  return false;
}

export function updateMechanisms(state: GameState): void {
  // 1. Update Pressure Plates
  for (const plate of state.plates) {
    plate.isPressed = isPlatePressed(
      plate.x,
      plate.y,
      state.playerPos,
      state.ghosts,
      state.currentStep
    );
  }

  // 2. Update Echo Receivers (ghosts only!)
  for (const receiver of state.receivers) {
    receiver.isActive = isReceiverActive(
      receiver.x,
      receiver.y,
      state.ghosts,
      state.currentStep
    );
  }

  // 3. Update Doors
  let anySyncActive = false;
  for (const door of state.doors) {
    door.isOpen = isDoorOpenAtStep(door, state, state.playerPos, state.currentStep);

    // Track synchronization success
    if (door.linkedTriggerIds && door.linkedTriggerIds.length > 1 && door.isOpen) {
      anySyncActive = true;
    }
  }
  state.isSynchronized = anySyncActive;

  // 4. Update Exit Unlock Status
  if (state.exit.requiresKey) {
    state.exit.isUnlocked = state.keys.length > 0 && state.keys.every((k) => k.isCollected);
  } else {
    state.exit.isUnlocked = true;
  }
}

export function canMove(state: GameState, dir: Direction): boolean {
  if (state.gameStatus !== 'PLAYING') return false;
  if (dir === 'WAIT') return true;

  const level = getLevelDef(state.levelIndex);
  let dx = 0;
  let dy = 0;

  switch (dir) {
    case 'UP':
      dy = -1;
      break;
    case 'DOWN':
      dy = 1;
      break;
    case 'LEFT':
      dx = -1;
      break;
    case 'RIGHT':
      dx = 1;
      break;
  }

  const targetX = state.playerPos.x + dx;
  const targetY = state.playerPos.y + dy;
  const nextStep = state.currentStep + 1;

  // Grid bounds check
  if (targetX < 0 || targetX >= level.width || targetY < 0 || targetY >= level.height) {
    return false;
  }

  // Wall collision check
  if (level.walls.some((w) => w.x === targetX && w.y === targetY)) {
    return false;
  }

  // Door collision check at nextStep
  const door = state.doors.find((d) => d.x === targetX && d.y === targetY);
  if (door) {
    const isOpenNext = isDoorOpenAtStep(door, state, { x: targetX, y: targetY }, nextStep);
    if (!isOpenNext) {
      return false;
    }
  }

  // Exit collision check
  if (
    state.exit.x === targetX &&
    state.exit.y === targetY &&
    state.exit.requiresKey
  ) {
    const allKeysCollected = state.keys.every((k) => k.isCollected);
    if (!allKeysCollected) {
      return false;
    }
  }

  return true;
}

export function applyMove(state: GameState, dir: Direction): { nextState: GameState; moved: boolean } {
  if (state.gameStatus !== 'PLAYING') {
    return { nextState: state, moved: false };
  }

  if (dir !== 'WAIT' && !canMove(state, dir)) {
    return { nextState: state, moved: false };
  }

  // Deep clone state to ensure immutability
  const next: GameState = {
    ...state,
    playerPos: { ...state.playerPos },
    playerHistory: state.playerHistory.map((p) => ({ ...p })),
    ghosts: state.ghosts.map((g) => ({
      ...g,
      path: g.path.map((p) => ({ ...p })),
    })),
    keys: state.keys.map((k) => ({ ...k })),
    doors: state.doors.map((d) => ({ ...d })),
    plates: state.plates.map((p) => ({ ...p })),
    receivers: state.receivers.map((r) => ({ ...r })),
    exit: { ...state.exit },
    stepHistory: [...state.stepHistory],
  };

  if (dir !== 'WAIT') {
    let dx = 0;
    let dy = 0;
    switch (dir) {
      case 'UP':
        dy = -1;
        break;
      case 'DOWN':
        dy = 1;
        break;
      case 'LEFT':
        dx = -1;
        break;
      case 'RIGHT':
        dx = 1;
        break;
    }
    next.playerPos.x += dx;
    next.playerPos.y += dy;
  }

  next.currentStep += 1;
  next.playerHistory.push({ ...next.playerPos });

  // Key collection check
  for (const key of next.keys) {
    if (!key.isCollected && isPosEqual(key, next.playerPos)) {
      key.isCollected = true;
    }
  }

  // Update mechanisms (plates, receivers, doors, exit, synchronization)
  updateMechanisms(next);

  // Check victory
  if (isPosEqual(next.playerPos, next.exit) && next.exit.isUnlocked) {
    next.isWon = true;
    next.gameStatus = 'WON';
    next.stepHistory.push(createStepRecord(next));
    return { nextState: next, moved: true };
  }

  // Check step limit
  if (next.currentStep >= next.maxSteps) {
    const level = getLevelDef(next.levelIndex);
    if (next.ghosts.length >= level.maxGhosts) {
      next.isGameOver = true;
      next.gameStatus = 'FAILED_STEPS';
    } else {
      next.gameStatus = 'FAILED_STEPS';
    }
  }

  next.stepHistory.push(createStepRecord(next));
  return { nextState: next, moved: true };
}

export function undoMove(state: GameState): GameState {
  if (state.playerHistory.length <= 1 || state.stepHistory.length <= 1) {
    return state;
  }

  const next: GameState = {
    ...state,
    playerHistory: state.playerHistory.slice(0, -1),
    stepHistory: state.stepHistory.slice(0, -1),
    currentStep: state.currentStep - 1,
    ghosts: state.ghosts.map((g) => ({
      ...g,
      path: g.path.map((p) => ({ ...p })),
    })),
    keys: state.keys.map((k) => ({ ...k })),
    doors: state.doors.map((d) => ({ ...d })),
    plates: state.plates.map((p) => ({ ...p })),
    receivers: state.receivers.map((r) => ({ ...r })),
    exit: { ...state.exit },
    isWon: false,
    isGameOver: false,
    isSynchronized: false,
    gameStatus: 'PLAYING',
  };

  next.playerPos = { ...next.playerHistory[next.playerHistory.length - 1] };

  // Revert key state based on player position history
  for (const key of next.keys) {
    key.isCollected = next.playerHistory.some((p) => isPosEqual(p, key));
  }

  updateMechanisms(next);

  return next;
}

export function endLoop(state: GameState): GameState {
  const level = getLevelDef(state.levelIndex);
  if (state.ghosts.length >= level.maxGhosts || state.isWon) {
    return state;
  }

  const newGhostId = state.ghosts.length + 1;
  const newGhost: Ghost = {
    id: newGhostId,
    name: `Echo ${newGhostId}`,
    color: GHOST_COLORS[(newGhostId - 1) % GHOST_COLORS.length],
    path: state.playerHistory.map((p) => ({ ...p })),
  };

  const nextGhosts = [...state.ghosts, newGhost];
  const nextLoop = state.currentLoop + 1;

  const next: GameState = {
    levelIndex: state.levelIndex,
    currentLoop: nextLoop,
    maxLoops: level.maxGhosts + 1,
    currentStep: 0,
    maxSteps: level.maxSteps,
    playerPos: { ...level.playerStart },
    playerHistory: [{ ...level.playerStart }],
    ghosts: nextGhosts,
    keys: level.keys ? level.keys.map((k) => ({ ...k, isCollected: false })) : [],
    doors: level.doors.map((d) => ({ ...d, isOpen: false })),
    plates: level.plates.map((p) => ({ ...p, isPressed: false })),
    receivers: level.receivers ? level.receivers.map((r) => ({ ...r, isActive: false })) : [],
    exit: { ...level.exit, isUnlocked: !level.exit.requiresKey },
    stepHistory: [],
    isWon: false,
    isGameOver: false,
    isSynchronized: false,
    gameStatus: 'PLAYING',
  };

  updateMechanisms(next);
  next.stepHistory = [createStepRecord(next)];

  return next;
}

export function restartLevel(levelIndex: number): GameState {
  return createInitialState(levelIndex);
}

export function retryLoop(state: GameState): GameState {
  const level = getLevelDef(state.levelIndex);
  const next: GameState = {
    levelIndex: state.levelIndex,
    currentLoop: state.currentLoop,
    maxLoops: level.maxGhosts + 1,
    currentStep: 0,
    maxSteps: level.maxSteps,
    playerPos: { ...level.playerStart },
    playerHistory: [{ ...level.playerStart }],
    ghosts: state.ghosts.map((g) => ({
      ...g,
      path: g.path.map((p) => ({ ...p })),
    })),
    keys: level.keys ? level.keys.map((k) => ({ ...k, isCollected: false })) : [],
    doors: level.doors.map((d) => ({ ...d, isOpen: false })),
    plates: level.plates.map((p) => ({ ...p, isPressed: false })),
    receivers: level.receivers ? level.receivers.map((r) => ({ ...r, isActive: false })) : [],
    exit: { ...level.exit, isUnlocked: !level.exit.requiresKey },
    stepHistory: [],
    isWon: false,
    isGameOver: false,
    isSynchronized: false,
    gameStatus: 'PLAYING',
  };

  updateMechanisms(next);
  next.stepHistory = [createStepRecord(next)];
  return next;
}
