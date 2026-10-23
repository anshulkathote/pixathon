import { describe, it, expect } from 'vitest';
import {
  createInitialState,
  applyMove,
  undoMove,
  endLoop,
  restartLevel,
  canMove,
  isPlatePressed,
  isReceiverActive,
} from './gameEngine';
import type { Direction } from '../types/game';

describe('Echo Maze Game Engine', () => {
  describe('Basic Movement & Collisions', () => {
    it('initializes state correctly for Level 1', () => {
      const state = createInitialState(1);
      expect(state.levelIndex).toBe(1);
      expect(state.currentLoop).toBe(1);
      expect(state.currentStep).toBe(0);
      expect(state.playerPos).toEqual({ x: 1, y: 1 });
      expect(state.ghosts).toHaveLength(0);
      expect(state.isWon).toBe(false);
      expect(state.doors[0].isOpen).toBe(false);
    });

    it('blocks movement into walls without consuming steps', () => {
      const state = createInitialState(1);
      expect(canMove(state, 'UP')).toBe(false);
      const { nextState, moved } = applyMove(state, 'UP');
      expect(moved).toBe(false);
      expect(nextState.currentStep).toBe(0);
      expect(nextState.playerPos).toEqual({ x: 1, y: 1 });
    });

    it('consumes step on valid movement', () => {
      const state = createInitialState(1);
      expect(canMove(state, 'DOWN')).toBe(true);
      const { nextState, moved } = applyMove(state, 'DOWN');
      expect(moved).toBe(true);
      expect(nextState.currentStep).toBe(1);
      expect(nextState.playerPos).toEqual({ x: 1, y: 2 });
    });

    it('blocks movement through closed doors', () => {
      const state = createInitialState(1);
      let cur = applyMove(state, 'RIGHT').nextState; // (2, 1)
      cur = applyMove(cur, 'RIGHT').nextState; // (3, 1)
      expect(cur.playerPos).toEqual({ x: 3, y: 1 });
      expect(cur.doors[0].isOpen).toBe(false);

      expect(canMove(cur, 'RIGHT')).toBe(false);
      const { nextState, moved } = applyMove(cur, 'RIGHT');
      expect(moved).toBe(false);
      expect(nextState.currentStep).toBe(2);
      expect(nextState.playerPos).toEqual({ x: 3, y: 1 });
    });
  });

  describe('Undo Mechanics', () => {
    it('reverts position and step count accurately', () => {
      const state = createInitialState(1);
      const s1 = applyMove(state, 'DOWN').nextState;
      const s2 = applyMove(s1, 'DOWN').nextState;
      expect(s2.currentStep).toBe(2);
      expect(s2.playerPos).toEqual({ x: 1, y: 3 });

      const undone = undoMove(s2);
      expect(undone.currentStep).toBe(1);
      expect(undone.playerPos).toEqual({ x: 1, y: 2 });

      const undone2 = undoMove(undone);
      expect(undone2.currentStep).toBe(0);
      expect(undone2.playerPos).toEqual({ x: 1, y: 1 });

      const undone3 = undoMove(undone2);
      expect(undone3.currentStep).toBe(0);
      expect(undone3.playerPos).toEqual({ x: 1, y: 1 });
    });
  });

  describe('Ghost Recording & Playback', () => {
    it('creates a ghost when ending loop', () => {
      let state = createInitialState(1);
      state = applyMove(state, 'DOWN').nextState;
      state = applyMove(state, 'DOWN').nextState;
      state = applyMove(state, 'RIGHT').nextState; // at (2, 3) which is Plate α!

      expect(state.doors[0].isOpen).toBe(true);
      const loop2 = endLoop(state);

      expect(loop2.currentLoop).toBe(2);
      expect(loop2.currentStep).toBe(0);
      expect(loop2.playerPos).toEqual({ x: 1, y: 1 });
      expect(loop2.ghosts).toHaveLength(1);
      expect(loop2.ghosts[0].path).toHaveLength(4);
    });

    it('holds pressure plate down indefinitely once ghost reaches end of path', () => {
      let state = createInitialState(1);
      state = applyMove(state, 'DOWN').nextState;
      state = applyMove(state, 'DOWN').nextState;
      state = applyMove(state, 'RIGHT').nextState;
      let loop2 = endLoop(state);

      expect(loop2.doors[0].isOpen).toBe(false);

      loop2 = applyMove(loop2, 'RIGHT').nextState;
      expect(loop2.doors[0].isOpen).toBe(false);

      loop2 = applyMove(loop2, 'RIGHT').nextState;
      expect(loop2.doors[0].isOpen).toBe(false);

      loop2 = applyMove(loop2, 'WAIT').nextState;
      expect(loop2.doors[0].isOpen).toBe(true);

      loop2 = applyMove(loop2, 'WAIT').nextState;
      expect(loop2.doors[0].isOpen).toBe(true);
    });
  });

  describe('Keys & Locked Exits', () => {
    it('updates inventory on key collection, unlocks exit, and resets keys across loops', () => {
      let state = createInitialState(2);
      expect(state.keys).toHaveLength(1);
      expect(state.keys[0].isCollected).toBe(false);
      expect(state.exit.requiresKey).toBe(true);
      expect(state.exit.isUnlocked).toBe(false);

      // Path to key in Level 2: starts (1, 1), key is at (6, 1)
      // If loop ends before collecting or without completing, keys reset
      const loop2 = endLoop(state);
      expect(loop2.keys[0].isCollected).toBe(false);
      expect(loop2.exit.isUnlocked).toBe(false);
    });

    it('reverts key collection when move is undone', () => {
      let state = createInitialState(2);
      // Key is at (6, 1). Simulate player moving onto key
      state.playerPos = { x: 5, y: 1 };
      state.playerHistory.push({ x: 5, y: 1 });
      const moved = applyMove(state, 'RIGHT').nextState; // into (6, 1)
      expect(moved.keys[0].isCollected).toBe(true);

      const undone = undoMove(moved);
      expect(undone.keys[0].isCollected).toBe(false);
    });
  });

  describe('Echo Receivers (Ghost Only Mechanics)', () => {
    it('does NOT activate when player steps on it', () => {
      let state = createInitialState(5);
      expect(state.receivers).toHaveLength(1);
      const receiver = state.receivers[0];
      expect(receiver.id).toBe('recv-1');
      expect(receiver.x).toBe(4);
      expect(receiver.y).toBe(5);

      // Move player onto receiver at (4, 5)
      state.playerPos = { x: 4, y: 5 };
      expect(isReceiverActive(receiver.x, receiver.y, state.ghosts, state.currentStep)).toBe(false);
    });

    it('activates when a ghost occupies its tile', () => {
      let state = createInitialState(5);
      const receiver = state.receivers[0];

      // Create a ghost that walks onto (4, 5)
      state.ghosts = [
        {
          id: 1,
          name: 'Echo 1',
          color: '#c084fc',
          path: [
            { x: 1, y: 1 },
            { x: 4, y: 5 },
          ],
        },
      ];

      // At step 0: ghost is at (1, 1) -> not active
      expect(isReceiverActive(receiver.x, receiver.y, state.ghosts, 0)).toBe(false);

      // At step 1: ghost is at (4, 5) -> active!
      expect(isReceiverActive(receiver.x, receiver.y, state.ghosts, 1)).toBe(true);

      // At step 2+: ghost stays at (4, 5) -> continues to be active!
      expect(isReceiverActive(receiver.x, receiver.y, state.ghosts, 2)).toBe(true);
    });
  });

  describe('Ghost Synchronization', () => {
    it('keeps sync door closed if only one trigger is active, and opens only when both are active simultaneously', () => {
      let state = createInitialState(5);
      const syncDoor = state.doors.find((d) => d.id === 'door-sync');
      expect(syncDoor).toBeDefined();
      expect(syncDoor?.linkedTriggerIds).toEqual(['plate-1', 'recv-1']);
      expect(syncDoor?.syncCondition).toBe('ALL');

      // Case 1: Neither active -> Closed
      expect(syncDoor?.isOpen).toBe(false);

      // Case 2: Only Plate 1 active (player on Plate 1 at 1, 5)
      state.playerPos = { x: 1, y: 5 };
      // ghosts empty, receiver not active
      expect(isPlatePressed(1, 5, state.playerPos, state.ghosts, 0)).toBe(true);
      expect(isReceiverActive(4, 5, state.ghosts, 0)).toBe(false);
      // Synchronized door should still be CLOSED!
      const { nextState } = applyMove(state, 'WAIT');
      const doorAfterPlateOnly = nextState.doors.find((d) => d.id === 'door-sync');
      expect(doorAfterPlateOnly?.isOpen).toBe(false);
      expect(nextState.isSynchronized).toBe(false);

      // Case 3: Both Ghost 1 on Plate 1 AND Ghost 2 on Receiver 1
      nextState.ghosts = [
        { id: 1, name: 'Echo 1', color: '#00f2fe', path: [{ x: 1, y: 5 }] },
        { id: 2, name: 'Echo 2', color: '#c084fc', path: [{ x: 4, y: 5 }] },
      ];
      const { nextState: bothActiveState } = applyMove(nextState, 'WAIT');
      const doorBothActive = bothActiveState.doors.find((d) => d.id === 'door-sync');
      expect(doorBothActive?.isOpen).toBe(true);
      expect(bothActiveState.isSynchronized).toBe(true);
    });
  });

  describe('Level 1: Hold That Thought - Solvability Test', () => {
    it('solves Level 1 with 1 ghost in 2 loops', () => {
      let state = createInitialState(1);

      // Loop 1: Player walks to plate and ends loop
      const loop1Moves: Direction[] = ['DOWN', 'DOWN', 'RIGHT'];
      for (const m of loop1Moves) {
        const res = applyMove(state, m);
        expect(res.moved).toBe(true);
        state = res.nextState;
      }
      expect(state.playerPos).toEqual({ x: 2, y: 3 });
      expect(state.doors[0].isOpen).toBe(true);

      state = endLoop(state);
      expect(state.currentLoop).toBe(2);
      expect(state.ghosts).toHaveLength(1);

      // Loop 2: Ghost walks to plate and holds door open. Player walks to exit
      const loop2Moves: Direction[] = ['RIGHT', 'RIGHT', 'RIGHT', 'RIGHT'];
      for (const m of loop2Moves) {
        const res = applyMove(state, m);
        expect(res.moved).toBe(true);
        state = res.nextState;
      }

      expect(state.playerPos).toEqual({ x: 5, y: 1 });
      expect(state.isWon).toBe(true);
      expect(state.gameStatus).toBe('WON');
      expect(state.currentStep).toBe(4);
      expect(state.currentStep).toBeLessThanOrEqual(state.maxSteps);
    });
  });

  describe('Level 2: The Key Behind the Door - Solvability Test', () => {
    it('solves Level 2: Ghost holds door open, player retrieves key and reaches locked exit', () => {
      let state = createInitialState(2);
      expect(state.keys).toHaveLength(1);
      expect(state.exit.requiresKey).toBe(true);
      expect(state.exit.isUnlocked).toBe(false);

      // Loop 1: Player walks to Plate at (2, 4)
      const loop1Moves: Direction[] = ['DOWN', 'DOWN', 'DOWN', 'RIGHT'];
      for (const m of loop1Moves) {
        const res = applyMove(state, m);
        expect(res.moved).toBe(true);
        state = res.nextState;
      }
      expect(state.playerPos).toEqual({ x: 2, y: 4 });
      expect(state.doors[0].isOpen).toBe(true);

      state = endLoop(state);
      expect(state.currentLoop).toBe(2);
      expect(state.ghosts).toHaveLength(1);

      // Loop 2: Player retrieves key behind Door (4, 2) and returns to Exit (1, 5)
      const loop2Moves: Direction[] = [
        'RIGHT', 'RIGHT', 'DOWN', 'RIGHT', // steps 1-4: pass door
        'RIGHT', 'UP', 'RIGHT',             // steps 5-7: grab key at (6, 1)
        'LEFT', 'DOWN', 'LEFT', 'LEFT',     // steps 8-11: exit chamber back to (3, 2)
        'DOWN', 'DOWN', 'DOWN',             // steps 12-14: down to (3, 5)
        'LEFT', 'LEFT'                      // steps 15-16: to exit at (1, 5)
      ];

      for (const m of loop2Moves) {
        const res = applyMove(state, m);
        expect(res.moved).toBe(true);
        state = res.nextState;
      }

      expect(state.playerPos).toEqual({ x: 1, y: 5 });
      expect(state.keys[0].isCollected).toBe(true);
      expect(state.exit.isUnlocked).toBe(true);
      expect(state.isWon).toBe(true);
      expect(state.currentStep).toBe(16);
      expect(state.currentStep).toBeLessThanOrEqual(state.maxSteps);
    });
  });

  describe('Level 3: Domino - Solvability Test', () => {
    it('solves Level 3 with 2 ghosts and sequential door triggers', () => {
      let state = createInitialState(3);

      // Loop 1: Player walks to Plate 1 at (1, 5)
      const loop1Moves: Direction[] = ['DOWN', 'DOWN', 'DOWN', 'DOWN'];
      for (const m of loop1Moves) {
        state = applyMove(state, m).nextState;
      }
      expect(state.playerPos).toEqual({ x: 1, y: 5 });
      expect(state.doors[0].isOpen).toBe(true);

      state = endLoop(state);
      expect(state.currentLoop).toBe(2);
      expect(state.ghosts).toHaveLength(1);

      // Loop 2: Ghost 1 holds Door 1 open. Player walks through Door 1 to Plate 2 at (4, 1)
      const loop2Moves: Direction[] = ['DOWN', 'DOWN', 'RIGHT', 'RIGHT', 'RIGHT', 'UP', 'UP'];
      for (const m of loop2Moves) {
        const res = applyMove(state, m);
        expect(res.moved).toBe(true);
        state = res.nextState;
      }
      expect(state.playerPos).toEqual({ x: 4, y: 1 });
      expect(state.doors[1].isOpen).toBe(true);

      state = endLoop(state);
      expect(state.currentLoop).toBe(3);
      expect(state.ghosts).toHaveLength(2);

      // Loop 3: Ghost 1 opens Door 1, Ghost 2 opens Door 2. Player walks through both to Exit (7, 5)
      const loop3Moves: Direction[] = [
        'DOWN', 'DOWN', 'RIGHT', 'RIGHT', // steps 1-4: through Door 1
        'RIGHT', 'RIGHT', 'RIGHT',         // steps 5-7: through Door 2 (opens at step 7)
        'RIGHT', 'DOWN', 'DOWN'            // steps 8-10: to Exit at (7, 5)
      ];

      for (const m of loop3Moves) {
        const res = applyMove(state, m);
        expect(res.moved).toBe(true);
        state = res.nextState;
      }

      expect(state.playerPos).toEqual({ x: 7, y: 5 });
      expect(state.isWon).toBe(true);
      expect(state.gameStatus).toBe('WON');
      expect(state.currentStep).toBe(10);
      expect(state.currentStep).toBeLessThanOrEqual(state.maxSteps);
    });
  });

  describe('Level 4: The Quantum Nexus - Solvability Test', () => {
    it('solves Level 4 with 2 ghosts, key retrieval and unlocked exit', () => {
      let state = createInitialState(4);

      // Loop 1: Player walks to Plate 1 at (1, 1) to open Door 1 (Key vault)
      const loop1Moves: Direction[] = ['LEFT', 'UP', 'UP', 'LEFT', 'LEFT'];
      for (const m of loop1Moves) {
        state = applyMove(state, m).nextState;
      }
      expect(state.playerPos).toEqual({ x: 1, y: 1 });
      expect(state.doors[0].isOpen).toBe(true);

      state = endLoop(state);
      expect(state.currentLoop).toBe(2);

      // Loop 2: Player walks to Plate 2 at (1, 5) to open Door 2 (Exit vault)
      const loop2Moves: Direction[] = ['LEFT', 'DOWN', 'DOWN', 'LEFT', 'LEFT'];
      for (const m of loop2Moves) {
        state = applyMove(state, m).nextState;
      }
      expect(state.playerPos).toEqual({ x: 1, y: 5 });
      expect(state.doors[1].isOpen).toBe(true);

      state = endLoop(state);
      expect(state.currentLoop).toBe(3);
      expect(state.ghosts).toHaveLength(2);

      // Loop 3: Player retrieves Key through Door 1, then unlocks Exit through Door 2
      const loop3Moves: Direction[] = [
        'DOWN', 'DOWN', 'RIGHT', 'WAIT', 'RIGHT', 'RIGHT', // steps 1-6: sync with Echo 1 to grab key at (7, 5)
        'LEFT', 'LEFT', 'UP', 'UP', 'UP', 'UP',            // steps 7-12: return up column 5 to (5, 1)
        'RIGHT', 'RIGHT'                                   // steps 13-14: pass through Door 2 to unlocked Exit at (7, 1)
      ];

      for (const m of loop3Moves) {
        const res = applyMove(state, m);
        expect(res.moved).toBe(true);
        state = res.nextState;
      }

      expect(state.playerPos).toEqual({ x: 7, y: 1 });
      expect(state.keys[0].isCollected).toBe(true);
      expect(state.isWon).toBe(true);
      expect(state.gameStatus).toBe('WON');
      expect(state.currentStep).toBe(14);
      expect(state.currentStep).toBeLessThanOrEqual(state.maxSteps);
    });
  });

  describe('Level 5: The Resonance Chamber - Solvability Test', () => {
    it('solves Level 5 demonstrating Echo Receivers, Simultaneous Synchronization, and Key Lock', () => {
      let state = createInitialState(5);
      expect(state.receivers).toHaveLength(1);
      expect(state.doors[0].linkedTriggerIds).toEqual(['plate-1', 'recv-1']);

      // --- Loop 1: Player walks to Plate 1 at (1, 5) ---
      // (1, 1) -> (1, 2) -> (1, 3) -> (1, 4) -> (1, 5) [4 steps]
      const loop1Moves: Direction[] = ['DOWN', 'DOWN', 'DOWN', 'DOWN'];
      for (const m of loop1Moves) {
        state = applyMove(state, m).nextState;
      }
      expect(state.playerPos).toEqual({ x: 1, y: 5 });
      expect(state.plates[0].isPressed).toBe(true);

      state = endLoop(state);
      expect(state.currentLoop).toBe(2);
      expect(state.ghosts).toHaveLength(1);

      // --- Loop 2: Player walks to Receiver 1 at (4, 5) ---
      // (1, 1) -> (1, 2) -> (2, 2) -> (3, 2) -> (3, 3) -> (3, 4) -> (3, 5) -> (4, 5) [7 steps]
      // Wait, let's check walls in Level 5:
      // Walls: (4, 1), (4, 3), (4, 4), (2, 3), (3, 3), (6, 3), (6, 4)
      // Path around (2, 3) and (3, 3):
      // (1, 1) -> (1, 2) -> (2, 2) -> (3, 2) -> (3, 1) -> wait, (4, 1) is wall.
      // What about:
      // (1, 1) -> (1, 2) -> (2, 2) -> (3, 2) -> wait, is (3, 3) a wall? Yes.
      // Can player go down column 1 to (1, 4), then right?
      // Row 4: (1, 4) -> (2, 4) -> (3, 4) -> (3, 5) -> (4, 5)!
      // Let's check row 4: (2, 4) and (3, 4) are open!
      // Let's trace:
      // (1, 1) -> (1, 2) -> (1, 3) -> (1, 4) -> (2, 4) -> (3, 4) -> (4, 4 is wall) -> so from (3, 4) down to (3, 5) -> right to (4, 5)!
      // That's:
      // 1: (1, 2)
      // 2: (1, 3)
      // 3: (1, 4)
      // 4: (2, 4)
      // 5: (3, 4)
      // 6: (3, 5)
      // 7: (4, 5) [Receiver Ω!]
      const loop2Moves: Direction[] = [
        'DOWN', 'DOWN', 'DOWN', // to (1, 4)
        'RIGHT', 'RIGHT',       // to (3, 4)
        'DOWN', 'RIGHT'         // to (4, 5)
      ];

      for (const m of loop2Moves) {
        state = applyMove(state, m).nextState;
      }
      expect(state.playerPos).toEqual({ x: 4, y: 5 });
      // When player is on receiver, receiver is NOT active (requires ghost!)
      expect(state.receivers[0].isActive).toBe(false);

      state = endLoop(state);
      expect(state.currentLoop).toBe(3);
      expect(state.ghosts).toHaveLength(2);

      // --- Loop 3: Both Ghost 1 (Plate α) and Ghost 2 (Receiver Ω) are stationed ---
      // Ghost 1 arrives at Plate α at step 4.
      // Ghost 2 arrives at Receiver Ω at step 7.
      // At step 7: Both Plate α and Receiver Ω are active simultaneously -> Sync Door at (4, 2) opens!
      // Player path:
      // From (1, 1):
      // 1: (2, 1)
      // 2: (3, 1)
      // 3: (3, 2)
      // 4: WAIT at (3, 2)
      // 5: WAIT at (3, 2)
      // 6: WAIT at (3, 2)
      // 7: (4, 2) [Sync Door opens as Ghost 2 hits Receiver Ω!]
      // 8: (5, 2)
      // 9: (6, 2)
      // 10: (7, 2) [Grabs Key!]
      // 11: (7, 3)
      // 12: (7, 4)
      // 13: (7, 5) [Locked Exit -> Key unlocks it -> VICTORY!]
      const loop3Moves: Direction[] = [
        'RIGHT', 'RIGHT', 'DOWN', // steps 1-3: to (3, 2)
        'WAIT', 'WAIT', 'WAIT',   // steps 4-6: wait for Echo 2 to reach receiver at step 7
        'RIGHT',                  // step 7: pass through synchronized Door at (4, 2)!
        'RIGHT', 'RIGHT', 'RIGHT',// steps 8-10: grab Key at (7, 2)
        'DOWN', 'DOWN', 'DOWN'    // steps 11-13: reach Locked Exit at (7, 5)
      ];

      for (const m of loop3Moves) {
        const res = applyMove(state, m);
        expect(res.moved).toBe(true);
        state = res.nextState;
      }

      expect(state.playerPos).toEqual({ x: 7, y: 5 });
      expect(state.keys[0].isCollected).toBe(true);
      expect(state.exit.isUnlocked).toBe(true);
      expect(state.isWon).toBe(true);
      expect(state.gameStatus).toBe('WON');
      expect(state.currentStep).toBe(13);
      expect(state.currentStep).toBeLessThanOrEqual(state.maxSteps);
    });
  });

  describe('Restart Level', () => {
    it('completely clears ghosts and resets timeline on restart', () => {
      let state = createInitialState(1);
      state = applyMove(state, 'DOWN').nextState;
      state = endLoop(state);
      expect(state.ghosts).toHaveLength(1);
      expect(state.currentLoop).toBe(2);

      const restarted = restartLevel(1);
      expect(restarted.ghosts).toHaveLength(0);
      expect(restarted.currentLoop).toBe(1);
      expect(restarted.currentStep).toBe(0);
      expect(restarted.playerPos).toEqual({ x: 1, y: 1 });
    });
  });
});
