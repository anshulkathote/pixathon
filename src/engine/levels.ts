import type { LevelDef } from '../types/game';

export const LEVELS: LevelDef[] = [
  {
    id: 1,
    title: 'Learn to Cooperate',
    subtitle: 'The First Shadow',
    description: 'A dark barrier blocks the only passage to the exit. Standing on the pressure plate opens the door, but stepping off closes it. You cannot be in two places at once... unless you cooperate with your past shadow.',
    hint: 'Move down into the lower alcove onto the cyan plate. Then press "End Loop" (Enter). In the next loop, your shadow will hold the plate down so you can walk straight to the exit.',
    width: 7,
    height: 6,
    maxSteps: 14,
    maxGhosts: 1,
    playerStart: { x: 1, y: 1 },
    exit: { x: 5, y: 1, requiresKey: false, isUnlocked: true },
    plates: [
      { id: 'plate-1', name: 'Plate α', x: 4, y: 4, color: '#00f2fe' }
    ],
    doors: [
      { id: 'door-1', x: 4, y: 1, linkedPlateId: 'plate-1', color: '#00f2fe' }
    ],
    walls: [
      // Outer border
      { x: 0, y: 0 }, { x: 1, y: 0 }, { x: 2, y: 0 }, { x: 3, y: 0 }, { x: 4, y: 0 }, { x: 5, y: 0 }, { x: 6, y: 0 },
      { x: 0, y: 5 }, { x: 1, y: 5 }, { x: 2, y: 5 }, { x: 3, y: 5 }, { x: 4, y: 5 }, { x: 5, y: 5 }, { x: 6, y: 5 },
      { x: 0, y: 1 }, { x: 0, y: 2 }, { x: 0, y: 3 }, { x: 0, y: 4 },
      { x: 6, y: 1 }, { x: 6, y: 2 }, { x: 6, y: 3 }, { x: 6, y: 4 },
      // Internal walls isolating exit and plate alcove
      { x: 3, y: 1 },
      { x: 3, y: 2 },
      { x: 5, y: 2 },
      { x: 1, y: 4 },
      { x: 2, y: 4 },
      { x: 3, y: 4 },
      { x: 5, y: 4 }
    ]
  },
  {
    id: 2,
    title: 'The Missing Key',
    subtitle: 'Shadow Lock & Key',
    description: 'The exit portal is sealed tight behind a heavy locked door. The key is hidden inside a shadowed vault. Your past shadow must hold the dark gate open so you can retrieve the key and return to unlock the exit.',
    hint: 'Loop 1: Walk to the pressure plate at the bottom-left and end your loop. Loop 2: With your shadow holding the dark door open, walk inside, seize the key, and head down to the locked gate!',
    width: 9,
    height: 7,
    maxSteps: 22,
    maxGhosts: 1,
    playerStart: { x: 1, y: 1 },
    exit: { x: 7, y: 5, requiresKey: false, isUnlocked: true },
    plates: [
      { id: 'plate-1', name: 'Plate α', x: 1, y: 5, color: '#00f2fe' }
    ],
    doors: [
      { id: 'door-energy', x: 5, y: 2, linkedPlateId: 'plate-1', color: '#00f2fe' },
      { id: 'door-lock', x: 5, y: 5, requiredKeyId: 'key-1', color: '#facc15', isLockedDoor: true }
    ],
    keys: [
      { id: 'key-1', name: 'Vault Key', x: 7, y: 1, color: '#facc15', isCollected: false }
    ],
    walls: [
      // Outer boundaries
      { x: 0, y: 0 }, { x: 1, y: 0 }, { x: 2, y: 0 }, { x: 3, y: 0 }, { x: 4, y: 0 }, { x: 5, y: 0 }, { x: 6, y: 0 }, { x: 7, y: 0 }, { x: 8, y: 0 },
      { x: 0, y: 6 }, { x: 1, y: 6 }, { x: 2, y: 6 }, { x: 3, y: 6 }, { x: 4, y: 6 }, { x: 5, y: 6 }, { x: 6, y: 6 }, { x: 7, y: 6 }, { x: 8, y: 6 },
      { x: 0, y: 1 }, { x: 0, y: 2 }, { x: 0, y: 3 }, { x: 0, y: 4 }, { x: 0, y: 5 },
      { x: 8, y: 1 }, { x: 8, y: 2 }, { x: 8, y: 3 }, { x: 8, y: 4 }, { x: 8, y: 5 },
      // Left vertical divider between start/passage and plate wing
      { x: 2, y: 2 }, { x: 2, y: 3 }, { x: 2, y: 4 }, { x: 2, y: 5 },
      // Vault dividers
      { x: 4, y: 1 }, { x: 4, y: 2 },
      { x: 6, y: 3 }, { x: 7, y: 3 },
      // Exit chamber dividers
      { x: 4, y: 4 }, { x: 4, y: 5 },
      { x: 6, y: 4 }, { x: 7, y: 4 }
    ]
  },
  {
    id: 3,
    title: 'The Wrong Turn',
    subtitle: 'Cascading Shadow Protocol',
    description: 'A labyrinthine corridor with two dark barriers, a gold locked door, and two pressure plates. One shadow must hold open the key chamber, and a second shadow must hold open the exit corridor so you can escape.',
    hint: 'Loop 1: Walk to Plate α (cyan) to open Door α. Loop 2: Walk through Door α to reach Plate β (amber). Loop 3: With both shadows holding their posts, grab the key, cross Door β, unlock the gate, and win!',
    width: 10,
    height: 7,
    maxSteps: 22,
    maxGhosts: 2,
    playerStart: { x: 1, y: 1 },
    exit: { x: 8, y: 5, requiresKey: false, isUnlocked: true },
    plates: [
      { id: 'plate-1', name: 'Plate α', x: 1, y: 5, color: '#00f2fe' },
      { id: 'plate-2', name: 'Plate β', x: 5, y: 5, color: '#f59e0b' }
    ],
    doors: [
      { id: 'door-1', x: 4, y: 2, linkedPlateId: 'plate-1', color: '#00f2fe' },
      { id: 'door-2', x: 7, y: 2, linkedPlateId: 'plate-2', color: '#f59e0b' },
      { id: 'door-lock', x: 8, y: 4, requiredKeyId: 'key-1', color: '#facc15', isLockedDoor: true }
    ],
    keys: [
      { id: 'key-1', name: 'Labyrinth Key', x: 5, y: 1, color: '#facc15', isCollected: false }
    ],
    walls: [
      // Outer boundaries
      { x: 0, y: 0 }, { x: 1, y: 0 }, { x: 2, y: 0 }, { x: 3, y: 0 }, { x: 4, y: 0 }, { x: 5, y: 0 }, { x: 6, y: 0 }, { x: 7, y: 0 }, { x: 8, y: 0 }, { x: 9, y: 0 },
      { x: 0, y: 6 }, { x: 1, y: 6 }, { x: 2, y: 6 }, { x: 3, y: 6 }, { x: 4, y: 6 }, { x: 5, y: 6 }, { x: 6, y: 6 }, { x: 7, y: 6 }, { x: 8, y: 6 }, { x: 9, y: 6 },
      { x: 0, y: 1 }, { x: 0, y: 2 }, { x: 0, y: 3 }, { x: 0, y: 4 }, { x: 0, y: 5 },
      { x: 9, y: 1 }, { x: 9, y: 2 }, { x: 9, y: 3 }, { x: 9, y: 4 }, { x: 9, y: 5 },
      // Partition 1 (Column 4, door at 4,2)
      { x: 4, y: 1 },
      { x: 4, y: 3 },
      { x: 4, y: 4 },
      { x: 4, y: 5 },
      // Left chamber dividers
      { x: 2, y: 2 }, { x: 2, y: 3 }, { x: 2, y: 4 }, { x: 2, y: 5 },
      // Partition 2 (Column 7, door at 7,2)
      { x: 7, y: 1 },
      { x: 7, y: 3 },
      { x: 7, y: 4 },
      { x: 7, y: 5 },
      // Middle chamber inner divider
      { x: 6, y: 3 }
    ]
  },
  {
    id: 4,
    title: 'Crossroads of Time',
    subtitle: 'The Grand Shadow Vault',
    description: 'A grand symmetric facility divided into North and South wings. You will need two shadows to penetrate both wings, retrieve the vault key, and unlock the central exit sanctum.',
    hint: 'Shadow 1 must open the South Wing to secure the Vault Key. Shadow 2 must open the North Wing where the Locked Gate shields the Exit Portal.',
    width: 9,
    height: 7,
    maxSteps: 24,
    maxGhosts: 2,
    playerStart: { x: 4, y: 3 },
    exit: { x: 7, y: 1, requiresKey: false, isUnlocked: true },
    plates: [
      { id: 'plate-1', name: 'Plate α (South)', x: 1, y: 5, color: '#00f2fe' },
      { id: 'plate-2', name: 'Plate β (North)', x: 1, y: 1, color: '#f59e0b' }
    ],
    doors: [
      { id: 'door-1', x: 6, y: 5, linkedPlateId: 'plate-1', color: '#00f2fe' },
      { id: 'door-2', x: 6, y: 2, linkedPlateId: 'plate-2', color: '#f59e0b' },
      { id: 'door-lock', x: 6, y: 1, requiredKeyId: 'key-1', color: '#facc15', isLockedDoor: true }
    ],
    keys: [
      { id: 'key-1', name: 'Sanctuary Key', x: 7, y: 5, color: '#facc15', isCollected: false }
    ],
    walls: [
      // Outer boundaries
      { x: 0, y: 0 }, { x: 1, y: 0 }, { x: 2, y: 0 }, { x: 3, y: 0 }, { x: 4, y: 0 }, { x: 5, y: 0 }, { x: 6, y: 0 }, { x: 7, y: 0 }, { x: 8, y: 0 },
      { x: 0, y: 6 }, { x: 1, y: 6 }, { x: 2, y: 6 }, { x: 3, y: 6 }, { x: 4, y: 6 }, { x: 5, y: 6 }, { x: 6, y: 6 }, { x: 7, y: 6 }, { x: 8, y: 6 },
      { x: 0, y: 1 }, { x: 0, y: 2 }, { x: 0, y: 3 }, { x: 0, y: 4 }, { x: 0, y: 5 },
      { x: 8, y: 1 }, { x: 8, y: 2 }, { x: 8, y: 3 }, { x: 8, y: 4 }, { x: 8, y: 5 },
      // Center corridor dividers
      { x: 2, y: 2 }, { x: 2, y: 4 },
      // Wing dividers
      { x: 6, y: 3 }, { x: 6, y: 4 }
    ]
  }
];
