import type { LevelDef } from '../types/game';

export const LEVELS: LevelDef[] = [
  {
    id: 1,
    title: 'Hold That Thought',
    subtitle: 'Timeline Resonance',
    description: 'A door blocks your path to the exit. Leave an echo of yourself on the pressure plate to hold it open.',
    hint: 'Move down and right onto the cyan plate. Then press "End Loop" (Enter). In the next loop, your ghost will hold the door open for you.',
    width: 7,
    height: 5,
    maxSteps: 12,
    maxGhosts: 1,
    playerStart: { x: 1, y: 1 },
    exit: { x: 5, y: 1, requiresKey: false, isUnlocked: true },
    plates: [
      { id: 'plate-1', name: 'Plate α', x: 2, y: 3, color: '#00f2fe' }
    ],
    doors: [
      { id: 'door-1', x: 4, y: 1, linkedPlateId: 'plate-1', color: '#00f2fe' }
    ],
    walls: [
      // Top & bottom boundary
      { x: 0, y: 0 }, { x: 1, y: 0 }, { x: 2, y: 0 }, { x: 3, y: 0 }, { x: 4, y: 0 }, { x: 5, y: 0 }, { x: 6, y: 0 },
      { x: 0, y: 4 }, { x: 1, y: 4 }, { x: 2, y: 4 }, { x: 3, y: 4 }, { x: 4, y: 4 }, { x: 5, y: 4 }, { x: 6, y: 4 },
      // Left & right boundary
      { x: 0, y: 1 }, { x: 0, y: 2 }, { x: 0, y: 3 },
      { x: 6, y: 1 }, { x: 6, y: 2 }, { x: 6, y: 3 },
      // Interior partition separating top corridor from plate chamber
      { x: 2, y: 2 }, { x: 3, y: 2 }, { x: 4, y: 2 }, { x: 5, y: 2 }
    ]
  },
  {
    id: 2,
    title: 'The Key Behind the Door',
    subtitle: 'Temporal Reclamation',
    description: 'The exit is locked tight. The key is sealed behind a heavy gate. Your past self must hold the gate open while you retrieve the key and return.',
    hint: 'Loop 1: Walk to the pressure plate at the bottom-left and end your loop. Loop 2: Your ghost will open the gate; run inside, grab the key, and head to the locked exit!',
    width: 8,
    height: 7,
    maxSteps: 18,
    maxGhosts: 1,
    playerStart: { x: 1, y: 1 },
    exit: { x: 1, y: 5, requiresKey: true, isUnlocked: false },
    plates: [
      { id: 'plate-1', name: 'Plate α', x: 2, y: 4, color: '#00f2fe' }
    ],
    doors: [
      { id: 'door-1', x: 4, y: 2, linkedPlateId: 'plate-1', color: '#00f2fe' }
    ],
    keys: [
      { id: 'key-1', x: 6, y: 1, name: 'Vault Key', color: '#facc15', isCollected: false }
    ],
    walls: [
      // Outer boundaries
      { x: 0, y: 0 }, { x: 1, y: 0 }, { x: 2, y: 0 }, { x: 3, y: 0 }, { x: 4, y: 0 }, { x: 5, y: 0 }, { x: 6, y: 0 }, { x: 7, y: 0 },
      { x: 0, y: 6 }, { x: 1, y: 6 }, { x: 2, y: 6 }, { x: 3, y: 6 }, { x: 4, y: 6 }, { x: 5, y: 6 }, { x: 6, y: 6 }, { x: 7, y: 6 },
      { x: 0, y: 1 }, { x: 0, y: 2 }, { x: 0, y: 3 }, { x: 0, y: 4 }, { x: 0, y: 5 },
      { x: 7, y: 1 }, { x: 7, y: 2 }, { x: 7, y: 3 }, { x: 7, y: 4 }, { x: 7, y: 5 },
      // Partition walls
      { x: 4, y: 1 },
      // door-1 is at (4, 2)
      { x: 4, y: 3 },
      { x: 4, y: 4 },
      { x: 4, y: 5 },
      { x: 2, y: 2 },
      { x: 2, y: 3 }
    ]
  },
  {
    id: 3,
    title: 'Domino',
    subtitle: 'Cascading Echoes',
    description: 'A two-stage security sequence. Neither gate can be passed alone. You will need two echoes to unlock the path to freedom.',
    hint: 'Loop 1: Walk to Plate α (cyan) to open Door α. Loop 2: Walk through Door α and stand on Plate β (amber). Loop 3: With both ghosts holding their posts, walk through both doors to the exit!',
    width: 9,
    height: 7,
    maxSteps: 20,
    maxGhosts: 2,
    playerStart: { x: 1, y: 1 },
    exit: { x: 7, y: 5, requiresKey: false, isUnlocked: true },
    plates: [
      { id: 'plate-1', name: 'Plate α', x: 1, y: 5, color: '#00f2fe' },
      { id: 'plate-2', name: 'Plate β', x: 4, y: 1, color: '#f59e0b' }
    ],
    doors: [
      { id: 'door-1', x: 3, y: 3, linkedPlateId: 'plate-1', color: '#00f2fe' },
      { id: 'door-2', x: 6, y: 3, linkedPlateId: 'plate-2', color: '#f59e0b' }
    ],
    walls: [
      // Outer boundaries
      { x: 0, y: 0 }, { x: 1, y: 0 }, { x: 2, y: 0 }, { x: 3, y: 0 }, { x: 4, y: 0 }, { x: 5, y: 0 }, { x: 6, y: 0 }, { x: 7, y: 0 }, { x: 8, y: 0 },
      { x: 0, y: 6 }, { x: 1, y: 6 }, { x: 2, y: 6 }, { x: 3, y: 6 }, { x: 4, y: 6 }, { x: 5, y: 6 }, { x: 6, y: 6 }, { x: 7, y: 6 }, { x: 8, y: 6 },
      { x: 0, y: 1 }, { x: 0, y: 2 }, { x: 0, y: 3 }, { x: 0, y: 4 }, { x: 0, y: 5 },
      { x: 8, y: 1 }, { x: 8, y: 2 }, { x: 8, y: 3 }, { x: 8, y: 4 }, { x: 8, y: 5 },
      // Wall partition 1
      { x: 3, y: 1 },
      { x: 3, y: 2 },
      { x: 3, y: 4 },
      { x: 3, y: 5 },
      // Wall partition 2
      { x: 6, y: 1 },
      { x: 6, y: 2 },
      { x: 6, y: 4 },
      { x: 6, y: 5 }
    ]
  },
  {
    id: 4,
    title: 'The Quantum Nexus',
    subtitle: 'Master Timeline Challenge',
    description: 'An advanced multi-loop chamber requiring precise coordination. Coordinate two echoes across two switches and retrieve the chronos key.',
    hint: 'One ghost must open the key chamber, a second ghost must open the exit chamber, allowing you to seize the key and unlock the nexus.',
    width: 9,
    height: 7,
    maxSteps: 22,
    maxGhosts: 2,
    playerStart: { x: 4, y: 3 },
    exit: { x: 7, y: 1, requiresKey: true, isUnlocked: false },
    plates: [
      { id: 'plate-1', name: 'Plate α', x: 1, y: 1, color: '#00f2fe' },
      { id: 'plate-2', name: 'Plate β', x: 1, y: 5, color: '#ec4899' }
    ],
    doors: [
      { id: 'door-1', x: 6, y: 5, linkedPlateId: 'plate-1', color: '#00f2fe' },
      { id: 'door-2', x: 6, y: 1, linkedPlateId: 'plate-2', color: '#ec4899' }
    ],
    keys: [
      { id: 'key-1', x: 7, y: 5, name: 'Nexus Key', color: '#facc15', isCollected: false }
    ],
    walls: [
      { x: 0, y: 0 }, { x: 1, y: 0 }, { x: 2, y: 0 }, { x: 3, y: 0 }, { x: 4, y: 0 }, { x: 5, y: 0 }, { x: 6, y: 0 }, { x: 7, y: 0 }, { x: 8, y: 0 },
      { x: 0, y: 6 }, { x: 1, y: 6 }, { x: 2, y: 6 }, { x: 3, y: 6 }, { x: 4, y: 6 }, { x: 5, y: 6 }, { x: 6, y: 6 }, { x: 7, y: 6 }, { x: 8, y: 6 },
      { x: 0, y: 1 }, { x: 0, y: 2 }, { x: 0, y: 3 }, { x: 0, y: 4 }, { x: 0, y: 5 },
      { x: 8, y: 1 }, { x: 8, y: 2 }, { x: 8, y: 3 }, { x: 8, y: 4 }, { x: 8, y: 5 },
      { x: 2, y: 2 }, { x: 2, y: 4 },
      { x: 6, y: 2 }, { x: 6, y: 3 }, { x: 6, y: 4 }
    ]
  },
  {
    id: 5,
    title: 'The Resonance Chamber',
    subtitle: 'Echo Receivers & Dual Synchronization',
    description: 'Echo Receivers resonate ONLY with spectral ghosts—mortal feet cannot activate them. The central sync gate demands simultaneous activation of both Plate α and Receiver Ω.',
    hint: 'Loop 1: Station Echo 1 on Plate α (cyan). Loop 2: Station Echo 2 on Receiver Ω (violet). Loop 3: With both mechanisms active simultaneously, the Sync Gate opens! Retrieve the key to unlock the exit.',
    width: 9,
    height: 7,
    maxSteps: 22,
    maxGhosts: 2,
    playerStart: { x: 1, y: 1 },
    exit: { x: 7, y: 5, requiresKey: true, isUnlocked: false },
    plates: [
      { id: 'plate-1', name: 'Plate α', x: 1, y: 5, color: '#00f2fe' }
    ],
    receivers: [
      { id: 'recv-1', name: 'Receiver Ω', x: 4, y: 5, color: '#c084fc' }
    ],
    doors: [
      {
        id: 'door-sync',
        x: 4,
        y: 2,
        color: '#c084fc',
        linkedTriggerIds: ['plate-1', 'recv-1'],
        syncCondition: 'ALL'
      }
    ],
    keys: [
      { id: 'key-1', x: 7, y: 2, name: 'Resonance Key', color: '#facc15', isCollected: false }
    ],
    walls: [
      // Outer boundaries
      { x: 0, y: 0 }, { x: 1, y: 0 }, { x: 2, y: 0 }, { x: 3, y: 0 }, { x: 4, y: 0 }, { x: 5, y: 0 }, { x: 6, y: 0 }, { x: 7, y: 0 }, { x: 8, y: 0 },
      { x: 0, y: 6 }, { x: 1, y: 6 }, { x: 2, y: 6 }, { x: 3, y: 6 }, { x: 4, y: 6 }, { x: 5, y: 6 }, { x: 6, y: 6 }, { x: 7, y: 6 }, { x: 8, y: 6 },
      { x: 0, y: 1 }, { x: 0, y: 2 }, { x: 0, y: 3 }, { x: 0, y: 4 }, { x: 0, y: 5 },
      { x: 8, y: 1 }, { x: 8, y: 2 }, { x: 8, y: 3 }, { x: 8, y: 4 }, { x: 8, y: 5 },
      // Central vertical partition (column 4)
      { x: 4, y: 1 },
      // door-sync is at (4, 2)
      { x: 4, y: 3 },
      { x: 4, y: 4 },
      // Wall barrier between chambers
      { x: 2, y: 3 },
      { x: 3, y: 3 },
      // Right wing partition
      { x: 6, y: 3 },
      { x: 6, y: 4 }
    ]
  }
];
