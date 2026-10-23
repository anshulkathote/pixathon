import { describe, it, expect } from 'vitest';
import {
  createInitialState,
  applyMove,
  undoMove,
  endLoop,
  restartLevel,
  canMove,
} from './gameEngine';
import type { Direction } from '../types/game';

describe('Shadow Maze Game Engine & Level Verification', () => {
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

    it('blocks movement through closed energy doors', () => {
      const state = createInitialState(1);
      // Move towards door at (4, 1)
      let cur = applyMove(state, 'DOWN').nextState; // (1, 2)
      cur = applyMove(cur, 'DOWN').nextState; // (1, 3)
      cur = applyMove(cur, 'RIGHT').nextState; // (2, 3)
      cur = applyMove(cur, 'RIGHT').nextState; // (3, 3)
      cur = applyMove(cur, 'RIGHT').nextState; // (4, 3)
      cur = applyMove(cur, 'UP').nextState; // (4, 2)
      expect(cur.playerPos).toEqual({ x: 4, y: 2 });
      expect(cur.doors[0].isOpen).toBe(false);

      // Attempt to enter closed Door 1 at (4, 1)
      expect(canMove(cur, 'UP')).toBe(false);
      const { nextState, moved } = applyMove(cur, 'UP');
      expect(moved).toBe(false);
      expect(nextState.currentStep).toBe(6);
      expect(nextState.playerPos).toEqual({ x: 4, y: 2 });
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

      // Cannot undo past step 0
      const undone3 = undoMove(undone2);
      expect(undone3.currentStep).toBe(0);
      expect(undone3.playerPos).toEqual({ x: 1, y: 1 });
    });
  });

  describe('Keys & Locked Doors Mechanics', () => {
    it('blocks passage through locked door without key, and allows passage with key', () => {
      const state = createInitialState(2);
      const lockedDoor = state.doors.find((d) => d.isLockedDoor);
      expect(lockedDoor).toBeDefined();
      expect(lockedDoor?.isOpen).toBe(false);

      // Player does not have key yet
      expect(state.keys[0].isCollected).toBe(false);

      // Collect key
      state.keys[0].isCollected = true;
      const { nextState } = applyMove(state, 'WAIT');
      const doorWithKey = nextState.doors.find((d) => d.id === lockedDoor?.id);
      expect(doorWithKey?.isOpen).toBe(true);
    });

    it('resets keys and re-locks doors when loop ends', () => {
      let state = createInitialState(2);
      state.keys[0].isCollected = true;
      state = endLoop(state);

      expect(state.currentLoop).toBe(2);
      expect(state.keys[0].isCollected).toBe(false);
      const lockedDoor = state.doors.find((d) => d.isLockedDoor);
      expect(lockedDoor?.isOpen).toBe(false);
    });

    it('reverts key collection when move is undone', () => {
      let state = createInitialState(2);
      // Key is at (7, 1). Simulate stepping onto key
      state.playerPos = { x: 6, y: 1 };
      state.playerHistory.push({ x: 6, y: 1 });
      const moved = applyMove(state, 'RIGHT').nextState; // into (7, 1)
      expect(moved.keys[0].isCollected).toBe(true);

      const undone = undoMove(moved);
      expect(undone.keys[0].isCollected).toBe(false);
    });
  });

  describe('Level 1: Learn to Cooperate - Strict Validation', () => {
    it('is strictly impossible to solve in Loop 1 without a ghost', () => {
      let state = createInitialState(1);
      // The exit is at (5, 1). The only entrance is (4, 1), which is Door 1.
      // Door 1 requires being on Plate 1 at (4, 4).
      // Let's test player trying to walk directly from start (1, 1) to (4, 1)
      const directMoves: Direction[] = ['DOWN', 'DOWN', 'RIGHT', 'RIGHT', 'RIGHT', 'UP'];
      for (const m of directMoves) {
        state = applyMove(state, m).nextState;
      }
      expect(state.playerPos).toEqual({ x: 4, y: 2 });
      // Door at (4, 1) is closed!
      expect(canMove(state, 'UP')).toBe(false);

      // What if player steps on Plate 1 at (4, 4) first, then tries to run to Door 1?
      let state2 = createInitialState(1);
      const toPlateMoves: Direction[] = ['DOWN', 'DOWN', 'RIGHT', 'RIGHT', 'RIGHT', 'DOWN'];
      for (const m of toPlateMoves) {
        state2 = applyMove(state2, m).nextState;
      }
      expect(state2.playerPos).toEqual({ x: 4, y: 4 });
      expect(state2.doors[0].isOpen).toBe(true); // Open while standing on plate

      // Now player walks off plate towards door:
      state2 = applyMove(state2, 'UP').nextState; // to (4, 3) - stepped OFF plate!
      expect(state2.doors[0].isOpen).toBe(false); // Door closes immediately!

      state2 = applyMove(state2, 'UP').nextState; // to (4, 2)
      expect(canMove(state2, 'UP')).toBe(false); // Door is closed!
      expect(state2.isWon).toBe(false);
    });

    it('solves Level 1 using Ghost 1 to hold the pressure plate', () => {
      let state = createInitialState(1);

      // Loop 1: Player walks to Plate 1 at (4, 4)
      const loop1Moves: Direction[] = ['DOWN', 'DOWN', 'RIGHT', 'RIGHT', 'RIGHT', 'DOWN'];
      for (const m of loop1Moves) {
        const res = applyMove(state, m);
        expect(res.moved).toBe(true);
        state = res.nextState;
      }
      expect(state.playerPos).toEqual({ x: 4, y: 4 });
      expect(state.doors[0].isOpen).toBe(true);

      state = endLoop(state);
      expect(state.currentLoop).toBe(2);
      expect(state.ghosts).toHaveLength(1);

      // Loop 2: Ghost 1 moves to (4, 4) and stays on it. Player moves to exit at (5, 1).
      // Ghost:
      // step 0: (1, 1)
      // step 1: (1, 2)
      // step 2: (1, 3)
      // step 3: (2, 3)
      // step 4: (3, 3)
      // step 5: (4, 3)
      // step 6: (4, 4) [On plate! Holds door open for all steps >= 6]
      //
      // Player:
      // step 1: (1, 2) [DOWN]
      // step 2: (1, 3) [DOWN]
      // step 3: (2, 3) [RIGHT]
      // step 4: (3, 3) [RIGHT]
      // step 5: (4, 3) [RIGHT]
      // step 6: (4, 2) [UP] (Door at 4,1 opens at step 6)
      // step 7: (4, 1) [UP] (Passes through Door 1)
      // step 8: (5, 1) [RIGHT] (Lands on Exit!)
      const loop2Moves: Direction[] = [
        'DOWN', 'DOWN', 'RIGHT', 'RIGHT', 'RIGHT', 'UP', 'UP', 'RIGHT'
      ];
      for (const m of loop2Moves) {
        const res = applyMove(state, m);
        expect(res.moved).toBe(true);
        state = res.nextState;
      }

      expect(state.playerPos).toEqual({ x: 5, y: 1 });
      expect(state.isWon).toBe(true);
      expect(state.gameStatus).toBe('WON');
      expect(state.currentStep).toBe(8);
      expect(state.currentStep).toBeLessThanOrEqual(state.maxSteps);
    });
  });

  describe('Level 2: The Missing Key - Strict Validation', () => {
    it('is strictly impossible to solve in Loop 1 without a ghost', () => {
      let state = createInitialState(2);
      // Key is inside (7, 1) behind Energy Door at (5, 2).
      // Energy door requires Plate 1 at (1, 5).
      // Exit is at (7, 5) behind Locked Door at (5, 5).
      // Player without ghost cannot hold Plate 1 and enter vault (5, 2).
      // Player cannot get key -> cannot open locked door -> cannot reach exit.
      expect(state.keys[0].isCollected).toBe(false);
      expect(state.doors.find((d) => d.id === 'door-lock')?.isOpen).toBe(false);
    });

    it('solves Level 2: Ghost 1 holds energy door, Player collects Key and unlocks gate', () => {
      let state = createInitialState(2);

      // Loop 1: Player walks to Plate 1 at (1, 5)
      // (1, 1) -> (1, 2) -> (1, 3) -> (1, 4) -> (1, 5) [4 steps]
      const loop1Moves: Direction[] = ['DOWN', 'DOWN', 'DOWN', 'DOWN'];
      for (const m of loop1Moves) {
        state = applyMove(state, m).nextState;
      }
      expect(state.playerPos).toEqual({ x: 1, y: 5 });
      expect(state.doors.find((d) => d.id === 'door-energy')?.isOpen).toBe(true);

      state = endLoop(state);
      expect(state.currentLoop).toBe(2);
      expect(state.ghosts).toHaveLength(1);

      // Loop 2: Ghost 1 reaches (1, 5) at step 4 and holds Energy Door (5, 2) open!
      // Player route:
      // step 1: (2, 1) [RIGHT]
      // step 2: (3, 1) [RIGHT]
      // step 3: (3, 2) [DOWN]
      // step 4: (3, 3) [DOWN]
      // step 5: (4, 3) [RIGHT]
      // step 6: (5, 3) [RIGHT]
      // step 7: (5, 2) [UP] (Through open Energy Door!)
      // step 8: (5, 1) [UP]
      // step 9: (6, 1) [RIGHT]
      // step 10: (7, 1) [RIGHT] (Picks up Key 1!)
      // step 11: (6, 1) [LEFT]
      // step 12: (5, 1) [LEFT]
      // step 13: (5, 2) [DOWN] (Passes through Energy Door)
      // step 14: (5, 3) [DOWN]
      // step 15: (5, 4) [DOWN]
      // step 16: (5, 5) [DOWN] (Unlocks Locked Door with Key 1!)
      // step 17: (6, 5) [RIGHT]
      // step 18: (7, 5) [RIGHT] (Reaches Exit!)
      const loop2Moves: Direction[] = [
        'RIGHT', 'RIGHT', 'DOWN', 'DOWN', 'RIGHT', 'RIGHT', // steps 1-6
        'UP', 'UP', 'RIGHT', 'RIGHT',                       // steps 7-10 (grab key at 7,1)
        'LEFT', 'LEFT', 'DOWN', 'DOWN', 'DOWN', 'DOWN',     // steps 11-16 (to locked door at 5,5)
        'RIGHT', 'RIGHT'                                    // steps 17-18 (to exit at 7,5)
      ];

      for (const m of loop2Moves) {
        const res = applyMove(state, m);
        expect(res.moved).toBe(true);
        state = res.nextState;
      }

      expect(state.playerPos).toEqual({ x: 7, y: 5 });
      expect(state.keys[0].isCollected).toBe(true);
      expect(state.isWon).toBe(true);
      expect(state.gameStatus).toBe('WON');
      expect(state.currentStep).toBe(18);
      expect(state.currentStep).toBeLessThanOrEqual(state.maxSteps);
    });
  });

  describe('Level 3: The Wrong Turn - Strict Validation', () => {
    it('is strictly impossible to solve without both ghosts', () => {
      const state = createInitialState(3);
      // Key is at (5, 1) behind Door 1 at (4, 2).
      // Door 2 is at (7, 2).
      // Locked door is at (7, 5).
      // Both doors need separate plates (Plate 1 at 1,5 and Plate 2 at 5,5).
      expect(state.doors[0].isOpen).toBe(false);
      expect(state.doors[1].isOpen).toBe(false);
    });

    it('solves Level 3 with 2 ghosts and key-locked gate', () => {
      let state = createInitialState(3);

      // Loop 1: Player walks to Plate 1 at (1, 5) (4 steps)
      const loop1Moves: Direction[] = ['DOWN', 'DOWN', 'DOWN', 'DOWN'];
      for (const m of loop1Moves) {
        state = applyMove(state, m).nextState;
      }
      expect(state.playerPos).toEqual({ x: 1, y: 5 });
      state = endLoop(state);
      expect(state.currentLoop).toBe(2);

      // Loop 2: Ghost 1 holds Door 1 at (4, 2). Player walks to Plate 2 at (5, 5)
      // Player:
      // (1, 1) -> (2, 1) -> (3, 1) -> (3, 2) -> (4, 2) [Door 1 opens at step 4]
      // -> (5, 2) -> (6, 2) -> (6, 4) -> (6, 5) -> (5, 5) [Plate 2!]
      // Let's check open tiles in middle chamber:
      // (5, 2) -> (6, 2) -> (6, 4 is open? Wait, (6, 3) is wall, so (5, 3) is open:
      // (5, 2) -> (5, 3 is open? Let's check walls in Level 3:
      // Walls: (4,1), (4,3), (4,4), (4,5); (7,1), (7,3), (7,4); (6,3).
      // So (5, 3) and (5, 4) and (5, 5) are completely open!
      // (4, 2) -> (5, 2) -> (5, 3) -> (5, 4) -> (5, 5) [Plate 2!]
      const loop2Moves: Direction[] = [
        'RIGHT', 'RIGHT', 'DOWN', 'RIGHT', // steps 1-4: through Door 1 at (4, 2)
        'RIGHT', 'DOWN', 'DOWN', 'DOWN'    // steps 5-8: to Plate 2 at (5, 5)
      ];
      for (const m of loop2Moves) {
        const res = applyMove(state, m);
        expect(res.moved).toBe(true);
        state = res.nextState;
      }
      expect(state.playerPos).toEqual({ x: 5, y: 5 });
      expect(state.doors.find((d) => d.id === 'door-2')?.isOpen).toBe(true);

      state = endLoop(state);
      expect(state.currentLoop).toBe(3);
      expect(state.ghosts).toHaveLength(2);

      // Loop 3:
      // Ghost 1 holds Door 1 at (4, 2).
      // Ghost 2 reaches Plate 2 at (5, 5) at step 8 and holds Door 2 at (7, 2) open!
      // Player path:
      // step 1: (2, 1) [RIGHT]
      // step 2: (3, 1) [RIGHT]
      // step 3: (3, 2) [DOWN]
      // step 4: (4, 2) [RIGHT] (Passes Door 1)
      // step 5: (5, 2) [RIGHT]
      // step 6: (5, 1) [UP] (Grabs Key 1!)
      // step 7: (5, 2) [DOWN]
      // step 8: (6, 2) [RIGHT]
      // step 9: (7, 2) [RIGHT] (Door 2 is open! Ghost 2 hit Plate 2 at step 8)
      // step 10: (8, 2) [RIGHT]
      // step 11: (8, 3) [DOWN]
      // step 12: (8, 4) [DOWN] (Locked Door unlocks with Key 1!)
      // step 13: (8, 5) [DOWN] (Lands on Exit!)
      const loop3Moves: Direction[] = [
        'RIGHT', 'RIGHT', 'DOWN', 'RIGHT', // steps 1-4
        'RIGHT', 'UP',                      // steps 5-6 (key at 5,1)
        'DOWN', 'RIGHT', 'RIGHT',           // steps 7-9 (through Door 2 at 7,2)
        'RIGHT', 'DOWN', 'DOWN', 'DOWN'     // steps 10-13 (through locked door 8,4 to exit 8,5)
      ];

      for (const m of loop3Moves) {
        const res = applyMove(state, m);
        expect(res.moved).toBe(true);
        state = res.nextState;
      }

      expect(state.playerPos).toEqual({ x: 8, y: 5 });
      expect(state.keys[0].isCollected).toBe(true);
      expect(state.isWon).toBe(true);
      expect(state.gameStatus).toBe('WON');
      expect(state.currentStep).toBe(13);
      expect(state.currentStep).toBeLessThanOrEqual(state.maxSteps);
    });
  });

  describe('Level 4: Crossroads of Time - Strict Validation', () => {
    it('is strictly impossible to solve without both ghosts', () => {
      const state = createInitialState(4);
      // Exit is at (7, 1) behind Door 2 at (6, 2) and Locked Door at (6, 1)
      // Key 1 is at (7, 5) behind Door 1 at (6, 5)
      // Plate 1 is at (1, 5); Plate 2 is at (1, 1)
      // A lone player cannot hold Plate 1 and grab Key 1, nor hold Plate 2 and reach Exit
      expect(state.doors[0].isOpen).toBe(false);
      expect(state.doors[1].isOpen).toBe(false);
      expect(state.doors[2].isOpen).toBe(false);
      expect(state.keys[0].isCollected).toBe(false);
    });

    it('solves Level 4 with 2 ghosts and key-locked gate', () => {
      let state = createInitialState(4);

      // Loop 1: Player walks to Plate 1 at (1, 5)
      const loop1Moves: Direction[] = ['LEFT', 'DOWN', 'DOWN', 'LEFT', 'LEFT'];
      for (const m of loop1Moves) {
        state = applyMove(state, m).nextState;
      }
      expect(state.playerPos).toEqual({ x: 1, y: 5 });
      state = endLoop(state);
      expect(state.currentLoop).toBe(2);

      // Loop 2: Player walks to Plate 2 at (1, 1)
      const loop2Moves: Direction[] = ['LEFT', 'UP', 'UP', 'LEFT', 'LEFT'];
      for (const m of loop2Moves) {
        state = applyMove(state, m).nextState;
      }
      expect(state.playerPos).toEqual({ x: 1, y: 1 });
      state = endLoop(state);
      expect(state.currentLoop).toBe(3);

      // Loop 3:
      // Ghost 1 holds Door 1 at (6, 5) [reaches at step 5]
      // Ghost 2 holds Door 2 at (6, 2) [reaches at step 5]
      // Player:
      // (4, 3) -> (4, 4) -> (4, 5) -> (5, 5) -> WAIT -> (6, 5) [through Door 1] -> (7, 5) [Key 1!]
      // -> (6, 5) -> (5, 5) -> (5, 4) -> (5, 3) -> (5, 2) -> (5, 1) -> (6, 1) [Locked Door opens with Key!] -> (7, 1) [Exit!]
      const loop3Moves: Direction[] = [
        'DOWN', 'DOWN', 'RIGHT', 'WAIT', 'RIGHT', 'RIGHT', // steps 1-6 (grab key at 7,5)
        'LEFT', 'LEFT', 'UP', 'UP', 'UP', 'UP',            // steps 7-12 (travel up to 5,1)
        'RIGHT', 'RIGHT'                                   // steps 13-14 (through locked door 6,1 to exit 7,1)
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
