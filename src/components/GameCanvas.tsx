import { useEffect, useRef, useState } from 'react';
import type { GameState, LevelDef, Position } from '../types/game';
import { getLevelDef } from '../engine/gameEngine';
import { sound } from '../engine/sound';

interface GameCanvasProps {
  state: GameState;
  isRewinding: boolean;
  showPathPreview?: boolean;
  onRewindComplete?: () => void;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  size: number;
  alpha: number;
  decay: number;
}

interface TrailPoint {
  x: number;
  y: number;
  color: string;
  alpha: number;
}

type Direction8 = 'south' | 'south-east' | 'east' | 'north-east' | 'north' | 'north-west' | 'west' | 'south-west';
type CardinalDir = 'south' | 'east' | 'north' | 'west';

const DIRECTIONS: Direction8[] = [
  'south',
  'south-east',
  'east',
  'north-east',
  'north',
  'north-west',
  'west',
  'south-west',
];

const CARDINAL_DIRS: CardinalDir[] = ['south', 'east', 'north', 'west'];

function toCardinalDir(dir: Direction8): CardinalDir {
  if (dir === 'south' || dir === 'south-east' || dir === 'south-west') return 'south';
  if (dir === 'north' || dir === 'north-east' || dir === 'north-west') return 'north';
  if (dir === 'east') return 'east';
  return 'west';
}

function getDirection8(dx: number, dy: number, fallback: Direction8 = 'south'): Direction8 {
  if (dx === 0 && dy === 0) return fallback;
  if (dx === 0 && dy > 0) return 'south';
  if (dx === 0 && dy < 0) return 'north';
  if (dx > 0 && dy === 0) return 'east';
  if (dx < 0 && dy === 0) return 'west';
  if (dx > 0 && dy > 0) return 'south-east';
  if (dx < 0 && dy > 0) return 'south-west';
  if (dx > 0 && dy < 0) return 'north-east';
  if (dx < 0 && dy < 0) return 'north-west';
  return fallback;
}

export const GameCanvas: React.FC<GameCanvasProps> = ({
  state,
  isRewinding,
  showPathPreview = true,
  onRewindComplete,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animFrameRef = useRef<number | null>(null);

  // Smooth interpolated positions for animation
  const animPlayerPos = useRef<Position>({ ...state.playerPos });
  const animGhostPos = useRef<Position[]>([]);
  const trailsRef = useRef<TrailPoint[]>([]);
  const particlesRef = useRef<Particle[]>([]);

  // Rewind animation state
  const rewindProgress = useRef<number>(0);
  const rewindActive = useRef<boolean>(false);

  // Asset image caches
  const playerSprites = useRef<Record<Direction8, HTMLImageElement>>({} as Record<Direction8, HTMLImageElement>);
  const ghostSprites = useRef<Record<Direction8, HTMLImageElement>>({} as Record<Direction8, HTMLImageElement>);
  const playerWalkFrames = useRef<Record<CardinalDir, HTMLImageElement[]>>({
    south: [],
    east: [],
    north: [],
    west: [],
  });
  const ghostWalkFrames = useRef<Record<CardinalDir, HTMLImageElement[]>>({
    south: [],
    east: [],
    north: [],
    west: [],
  });
  const tileImages = useRef<Record<string, HTMLImageElement>>({});
  const [, setAssetsLoaded] = useState<boolean>(false);

  // Direction tracking
  const playerDirection = useRef<Direction8>('south');
  const prevPlayerCoord = useRef<Position>({ ...state.playerPos });
  const ghostDirections = useRef<Direction8[]>([]);

  // Preload all sprites, animations, and tiles once
  useEffect(() => {
    let loadedCount = 0;
    // 8 rotations * 2 (player + ghost) + 4 dirs * 8 walk frames * 2 (player + ghost) + 10 pngTiles + 16 scifiTiles = 16 + 64 + 26 = 106
    const totalExpected = DIRECTIONS.length * 2 + CARDINAL_DIRS.length * 8 * 2 + 10 + 16;
    const checkDone = () => {
      loadedCount++;
      if (loadedCount >= totalExpected) {
        setAssetsLoaded(true);
      }
    };

    // 1. Preload 8-directional idle rotation sprites
    DIRECTIONS.forEach((dir) => {
      const pImg = new Image();
      pImg.src = `/sprites/player/${dir}.png`;
      pImg.onload = checkDone;
      pImg.onerror = checkDone;
      playerSprites.current[dir] = pImg;

      const gImg = new Image();
      gImg.src = `/sprites/ghost/${dir}.png`;
      gImg.onload = checkDone;
      gImg.onerror = checkDone;
      ghostSprites.current[dir] = gImg;
    });

    // 2. Preload 8-frame walk cycles for all 4 cardinal directions (south, east, north, west)
    CARDINAL_DIRS.forEach((dir) => {
      playerWalkFrames.current[dir] = [];
      ghostWalkFrames.current[dir] = [];

      for (let f = 0; f < 8; f++) {
        const frameStr = String(f).padStart(3, '0');

        const pWalkImg = new Image();
        pWalkImg.src = `/sprites/player/walk/${dir}/frame_${frameStr}.png`;
        pWalkImg.onload = checkDone;
        pWalkImg.onerror = checkDone;
        playerWalkFrames.current[dir][f] = pWalkImg;

        const gWalkImg = new Image();
        gWalkImg.src = `/sprites/ghost/walk/${dir}/frame_${frameStr}.png`;
        gWalkImg.onload = checkDone;
        gWalkImg.onerror = checkDone;
        ghostWalkFrames.current[dir][f] = gWalkImg;
      }
    });

    // 3. Preload environment tiles (classic & futuristic sci-fi)
    const pngTiles = [
      'floor_plain',
      'floor_ornate',
      'floor_runes',
      'floor_cracked',
      'wall_top',
      'wall_block',
      'wall_vert',
      'wall_corner_tl',
      'crystals',
      'crystal_single',
    ];

    const scifiTiles = [
      'floor_main',
      'floor_alt',
      'floor_energy',
      'wall_solid',
      'wall_corner',
      'wall_edge',
      'wall_pillar',
      'gate_locked',
      'gate_unlocked',
      'gate_open',
      'plate_inactive',
      'plate_active',
      'key',
      'exit_portal',
      'deco_terminal',
      'deco_cables',
    ];

    pngTiles.forEach((t) => {
      const img = new Image();
      img.src = `/tiles/${t}.png`;
      img.onload = checkDone;
      img.onerror = checkDone;
      tileImages.current[t] = img;
    });

    scifiTiles.forEach((t) => {
      const img = new Image();
      img.src = `/tiles/scifi/${t}.svg`;
      img.onload = checkDone;
      img.onerror = checkDone;
      tileImages.current[t] = img;
    });
  }, []);

  // Update player facing direction when coordinate changes
  useEffect(() => {
    const dx = state.playerPos.x - prevPlayerCoord.current.x;
    const dy = state.playerPos.y - prevPlayerCoord.current.y;
    if (dx !== 0 || dy !== 0) {
      playerDirection.current = getDirection8(dx, dy, playerDirection.current);
      prevPlayerCoord.current = { ...state.playerPos };
    }
  }, [state.playerPos]);

  // Update ghost facing directions based on current step vs previous step in path
  useEffect(() => {
    ghostDirections.current = state.ghosts.map((ghost, gIdx) => {
      const curIdx = Math.min(state.currentStep, ghost.path.length - 1);
      const prevIdx = Math.max(0, curIdx - 1);
      const cur = ghost.path[curIdx] || { x: 0, y: 0 };
      const prev = ghost.path[prevIdx] || cur;
      const dx = cur.x - prev.x;
      const dy = cur.y - prev.y;
      const currentDir = ghostDirections.current[gIdx] || 'south';
      return getDirection8(dx, dy, currentDir);
    });
  }, [state.ghosts, state.currentStep]);

  // Event trackers for audio triggers
  const prevPlatesRef = useRef<string[]>([]);
  const prevKeysRef = useRef<boolean>(false);

  const level: LevelDef = getLevelDef(state.levelIndex);

  // Initialize or update ghost positions when ghosts array changes
  useEffect(() => {
    animGhostPos.current = state.ghosts.map((g) => {
      const idx = Math.min(state.currentStep, g.path.length - 1);
      return { ...g.path[idx] };
    });
  }, [state.ghosts, state.currentStep]);

  // Handle rewind trigger
  useEffect(() => {
    if (isRewinding) {
      rewindActive.current = true;
      rewindProgress.current = 0;

      // Spawn rewind reverse particles
      const canvas = canvasRef.current;
      if (canvas) {
        for (let i = 0; i < 70; i++) {
          const angle = Math.random() * Math.PI * 2;
          const dist = 50 + Math.random() * 200;
          particlesRef.current.push({
            x: canvas.width / 2 + Math.cos(angle) * dist,
            y: canvas.height / 2 + Math.sin(angle) * dist,
            vx: -Math.cos(angle) * (2 + Math.random() * 4),
            vy: -Math.sin(angle) * (2 + Math.random() * 4),
            color: Math.random() > 0.5 ? '#00f2fe' : '#c084fc',
            size: 2 + Math.random() * 3,
            alpha: 1,
            decay: 0.02 + Math.random() * 0.02,
          });
        }
      }
    }
  }, [isRewinding]);

  // Spawn particles and audio on plate and key events
  useEffect(() => {
    const currentActivePlates = state.plates.filter((p) => p.isPressed).map((p) => p.id);

    // Newly activated plates
    for (const plate of state.plates) {
      const wasActive = prevPlatesRef.current.includes(plate.id);
      const isActive = currentActivePlates.includes(plate.id);
      if (!wasActive && isActive) {
        sound.playPlate(true);
        for (let i = 0; i < 20; i++) {
          const angle = Math.random() * Math.PI * 2;
          const speed = 1 + Math.random() * 2.5;
          particlesRef.current.push({
            x: plate.x,
            y: plate.y,
            vx: Math.cos(angle) * speed * 0.04,
            vy: Math.sin(angle) * speed * 0.04,
            color: plate.color,
            size: 2 + Math.random() * 2.5,
            alpha: 1,
            decay: 0.03,
          });
        }
      }
    }
    prevPlatesRef.current = currentActivePlates;

    // Key collected check
    const hasKey = state.keys.some((k) => k.isCollected);
    if (!prevKeysRef.current && hasKey) {
      const keyItem = state.keys.find((k) => k.isCollected);
      if (keyItem) {
        for (let i = 0; i < 30; i++) {
          const angle = Math.random() * Math.PI * 2;
          const speed = 1.5 + Math.random() * 3;
          particlesRef.current.push({
            x: keyItem.x,
            y: keyItem.y,
            vx: Math.cos(angle) * speed * 0.05,
            vy: Math.sin(angle) * speed * 0.05,
            color: keyItem.color || '#facc15',
            size: 3 + Math.random() * 2.5,
            alpha: 1,
            decay: 0.025,
          });
        }
      }
    }
    prevKeysRef.current = hasKey;
  }, [state]);

  useEffect(() => {
    let lastTime = performance.now();

    const render = (now: number) => {
      const dt = Math.min((now - lastTime) / 1000, 0.1);
      lastTime = now;

      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const dpr = window.devicePixelRatio || 1;
      const displayWidth = canvas.clientWidth;
      const displayHeight = canvas.clientHeight;

      if (canvas.width !== displayWidth * dpr || canvas.height !== displayHeight * dpr) {
        canvas.width = displayWidth * dpr;
        canvas.height = displayHeight * dpr;
      }

      ctx.save();
      ctx.scale(dpr, dpr);

      // Compute grid layout & cell sizing
      const padding = 32;
      const availWidth = displayWidth - padding * 2;
      const availHeight = displayHeight - padding * 2;
      const cellSize = Math.min(
        Math.floor(availWidth / level.width),
        Math.floor(availHeight / level.height),
        72 // max cell size
      );

      const gridPixelWidth = level.width * cellSize;
      const gridPixelHeight = level.height * cellSize;
      const offsetX = Math.floor((displayWidth - gridPixelWidth) / 2);
      const offsetY = Math.floor((displayHeight - gridPixelHeight) / 2);

      // Background clearing
      ctx.fillStyle = '#060913';
      ctx.fillRect(0, 0, displayWidth, displayHeight);

      // Subtle ambient vignette
      const bgGrad = ctx.createRadialGradient(
        displayWidth / 2,
        displayHeight / 2,
        Math.min(displayWidth, displayHeight) * 0.2,
        displayWidth / 2,
        displayHeight / 2,
        Math.max(displayWidth, displayHeight) * 0.7
      );
      bgGrad.addColorStop(0, '#0c1322');
      bgGrad.addColorStop(1, '#04060c');
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, displayWidth, displayHeight);

      // 1. Draw Environment Walkable Floor Tiles & Sci-Fi Tech Accents
      for (let y = 0; y < level.height; y++) {
        for (let x = 0; x < level.width; x++) {
          const cx = offsetX + x * cellSize;
          const cy = offsetY + y * cellSize;
          const isWall = level.walls.some((w) => w.x === x && w.y === y);

          if (!isWall) {
            // Pick floor tile pattern based on coordinate hash:
            // 70% main hull plate, 20% tech mesh vent, 10% special energy conduit
            const hash = (x * 7 + y * 13) % 10;
            let tileKey = 'floor_main';
            if (hash === 2 || hash === 8) tileKey = 'floor_alt';
            else if (hash === 5) tileKey = 'floor_energy';

            const tileImg = tileImages.current[tileKey] || tileImages.current['floor_plain'];
            if (tileImg && tileImg.complete && tileImg.naturalWidth > 0) {
              ctx.drawImage(tileImg, cx, cy, cellSize, cellSize);
            } else {
              // Deep spaceship hull floor fallback
              ctx.fillStyle = '#101a33';
              ctx.fillRect(cx, cy, cellSize, cellSize);

              ctx.fillStyle = '#121e3c';
              ctx.fillRect(cx + 1, cy + 1, cellSize - 2, cellSize - 2);

              ctx.strokeStyle = '#1b2a50';
              ctx.lineWidth = 1;
              ctx.strokeRect(cx + 0.5, cy + 0.5, cellSize - 1, cellSize - 1);
            }

            // Decorative floor elements: subtle tech consoles or cable junctions
            if ((x * 11 + y * 17) % 23 === 7) {
              const decoKey = (x + y) % 2 === 0 ? 'deco_terminal' : 'deco_cables';
              const decoImg = tileImages.current[decoKey];
              if (decoImg && decoImg.complete && decoImg.naturalWidth > 0) {
                ctx.save();
                ctx.globalAlpha = 0.85;
                ctx.drawImage(decoImg, cx, cy, cellSize, cellSize);
                ctx.restore();
              }
            }
          }
        }
      }

      // 2. Draw Circuit Lines connecting Plates to their Energy Doors
      for (const door of state.doors) {
        if (!door.linkedPlateId) continue; // only pressure-plate doors get circuit lines
        const plate = state.plates.find((p) => p.id === door.linkedPlateId);
        if (!plate) continue;

        const tx = offsetX + plate.x * cellSize + cellSize / 2;
        const ty = offsetY + plate.y * cellSize + cellSize / 2;
        const dx = offsetX + door.x * cellSize + cellSize / 2;
        const dy = offsetY + door.y * cellSize + cellSize / 2;

        ctx.save();
        ctx.beginPath();
        ctx.moveTo(tx, ty);
        ctx.lineTo(tx, dy);
        ctx.lineTo(dx, dy);

        if (door.isOpen) {
          // Active glowing neon circuit (cyan/teal pulse)
          ctx.strokeStyle = '#0df2c8';
          ctx.lineWidth = 2.5;
          ctx.shadowColor = '#00f0ff';
          ctx.shadowBlur = 10;
          ctx.stroke();

          // Flowing energy pulse
          const pulsePhase = (now * 0.003) % 1;
          const pulseX = tx + (dx - tx) * pulsePhase;
          const pulseY = ty + (dy - ty) * pulsePhase;
          ctx.fillStyle = '#ffffff';
          ctx.shadowColor = '#00f0ff';
          ctx.shadowBlur = 10;
          ctx.beginPath();
          ctx.arc(pulseX, pulseY, 2.5, 0, Math.PI * 2);
          ctx.fill();
        } else {
          // Dormant tech conduit wire
          ctx.strokeStyle = 'rgba(27, 43, 84, 0.7)';
          ctx.lineWidth = 1.5;
          ctx.setLineDash([4, 4]);
          ctx.stroke();
        }
        ctx.restore();
      }

      // 3. Draw Pressure Plates (Mechanical & Capacitive Sensors)
      for (const plate of state.plates) {
        const cx = offsetX + plate.x * cellSize;
        const cy = offsetY + plate.y * cellSize;
        const isPressed = plate.isPressed;

        ctx.save();
        const plateSpriteKey = isPressed ? 'plate_active' : 'plate_inactive';
        const plateImg = tileImages.current[plateSpriteKey];

        if (plateImg && plateImg.complete && plateImg.naturalWidth > 0) {
          if (isPressed) {
            ctx.shadowColor = '#00f0ff';
            ctx.shadowBlur = 16;
            ctx.drawImage(plateImg, cx, cy, cellSize, cellSize);

            // Pulsing capacitive feedback ring
            ctx.strokeStyle = '#00f0ff';
            ctx.lineWidth = 1.5;
            ctx.globalAlpha = 0.6 + Math.sin(now * 0.008) * 0.3;
            ctx.strokeRect(cx + 2, cy + 2, cellSize - 4, cellSize - 4);
          } else {
            ctx.drawImage(plateImg, cx, cy, cellSize, cellSize);

            // Subtle color identification marker for distinct puzzle plates
            if (plate.color && plate.color !== '#00f2fe') {
              ctx.fillStyle = plate.color;
              ctx.globalAlpha = 0.7;
              ctx.fillRect(cx + cellSize / 2 - 2, cy + cellSize / 2 - 2, 4, 4);
            }
          }
        } else {
          // Sci-Fi procedural fallback
          const pad = Math.floor(cellSize * 0.12);
          const pw = cellSize - pad * 2;
          const ph = cellSize - pad * 2;

          if (isPressed) {
            ctx.fillStyle = '#061224';
            ctx.fillRect(cx + pad, cy + pad, pw, ph);

            ctx.strokeStyle = '#00f0ff';
            ctx.lineWidth = 2.5;
            ctx.shadowColor = '#00f0ff';
            ctx.shadowBlur = 14;
            ctx.strokeRect(cx + pad + 1, cy + pad + 1, pw - 2, ph - 2);

            ctx.fillStyle = '#0df2c8';
            ctx.beginPath();
            ctx.arc(cx + cellSize / 2, cy + cellSize / 2, pw * 0.2, 0, Math.PI * 2);
            ctx.fill();
          } else {
            ctx.fillStyle = '#15213b';
            ctx.fillRect(cx + pad, cy + pad, pw, ph);

            ctx.strokeStyle = '#223254';
            ctx.lineWidth = 1.5;
            ctx.strokeRect(cx + pad, cy + pad, pw, ph);
          }
        }
        ctx.restore();
      }

      // 4. Draw Optional Recorded-Path Preview
      if (showPathPreview && state.ghosts.length > 0) {
        state.ghosts.forEach((ghost) => {
          if (ghost.path.length <= 1) return;

          ctx.save();
          ctx.strokeStyle = ghost.color;
          ctx.fillStyle = ghost.color;
          ctx.lineWidth = 2;
          ctx.setLineDash([4, 4]);
          ctx.globalAlpha = 0.38;

          ctx.beginPath();
          ghost.path.forEach((pt, pIdx) => {
            const px = offsetX + pt.x * cellSize + cellSize / 2;
            const py = offsetY + pt.y * cellSize + cellSize / 2;
            if (pIdx === 0) {
              ctx.moveTo(px, py);
            } else {
              ctx.lineTo(px, py);
            }
          });
          ctx.stroke();

          // Draw small step node indicators along path
          ctx.setLineDash([]);
          ghost.path.forEach((pt) => {
            const px = offsetX + pt.x * cellSize + cellSize / 2;
            const py = offsetY + pt.y * cellSize + cellSize / 2;
            ctx.beginPath();
            ctx.arc(px, py, 2.5, 0, Math.PI * 2);
            ctx.fill();
          });

          // Draw stationed marker at final resting position
          const finalPt = ghost.path[ghost.path.length - 1];
          const fx = offsetX + finalPt.x * cellSize + cellSize / 2;
          const fy = offsetY + finalPt.y * cellSize + cellSize / 2;
          ctx.globalAlpha = 0.7;
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.arc(fx, fy, cellSize * 0.34, 0, Math.PI * 2);
          ctx.stroke();
          ctx.restore();
        });
      }

      // 6. Draw Doors (Standard Laser Barricade, Unlocked Power-Cycling, or Retracted Open)
      for (const door of state.doors) {
        const cx = offsetX + door.x * cellSize;
        const cy = offsetY + door.y * cellSize;
        const isLocked = door.requiredKeyId || door.isLockedDoor;

        ctx.save();
        let gateKey = 'gate_locked';
        if (door.isOpen) {
          gateKey = 'gate_open';
        } else if (!isLocked) {
          gateKey = 'gate_unlocked';
        }

        const gateImg = tileImages.current[gateKey];
        if (gateImg && gateImg.complete && gateImg.naturalWidth > 0) {
          if (door.isOpen) {
            ctx.globalAlpha = 0.9;
            ctx.drawImage(gateImg, cx, cy, cellSize, cellSize);

            // Subtle energy glow along open corridor threshold
            ctx.fillStyle = '#0df2c8';
            ctx.shadowColor = '#00f0ff';
            ctx.shadowBlur = 8;
            ctx.fillRect(cx + 8, cy + cellSize / 2 - 1, cellSize - 16, 2);
          } else {
            // Closed door with laser beams
            ctx.shadowColor = isLocked ? '#ef4444' : (door.color || '#00f0ff');
            ctx.shadowBlur = 10;
            ctx.drawImage(gateImg, cx, cy, cellSize, cellSize);

            // Pulsing laser glow effect
            ctx.strokeStyle = isLocked ? '#f87171' : '#00f0ff';
            ctx.globalAlpha = 0.5 + Math.sin(now * 0.007) * 0.3;
            ctx.lineWidth = 1.5;
            ctx.strokeRect(cx + 2, cy + 2, cellSize - 4, cellSize - 4);
          }
        } else {
          // Procedural Sci-Fi Door Fallback
          if (door.isOpen) {
            ctx.fillStyle = 'rgba(16, 26, 51, 0.5)';
            ctx.fillRect(cx + 2, cy + 2, cellSize - 4, cellSize - 4);

            // Retracted posts
            ctx.fillStyle = '#202f52';
            ctx.fillRect(cx + 2, cy + 4, 4, cellSize - 8);
            ctx.fillRect(cx + cellSize - 6, cy + 4, 4, cellSize - 8);

            ctx.fillStyle = '#0df2c8';
            ctx.fillRect(cx + 8, cy + cellSize / 2 - 1, cellSize - 16, 2);
          } else {
            ctx.fillStyle = '#090f1d';
            ctx.fillRect(cx + 2, cy + 2, cellSize - 4, cellSize - 4);

            ctx.strokeStyle = isLocked ? '#ef4444' : (door.color || '#00f0ff');
            ctx.lineWidth = 2.5;
            ctx.shadowColor = ctx.strokeStyle;
            ctx.shadowBlur = 10;
            ctx.strokeRect(cx + 2, cy + 2, cellSize - 4, cellSize - 4);

            // Laser beams
            for (let b = 1; b <= 3; b++) {
              const by = cy + (cellSize * b) / 4;
              ctx.beginPath();
              ctx.moveTo(cx + 6, by);
              ctx.lineTo(cx + cellSize - 6, by);
              ctx.stroke();
            }
          }
        }
        ctx.restore();
      }

      // 7. Draw Collectible Quantum Gold Key (if present and not collected)
      for (const key of state.keys) {
        if (!key.isCollected) {
          const kx = offsetX + key.x * cellSize;
          const floatOffset = Math.sin(now * 0.005) * 3;
          const ky = offsetY + key.y * cellSize + floatOffset;

          ctx.save();
          const keyImg = tileImages.current['key'];
          if (keyImg && keyImg.complete && keyImg.naturalWidth > 0) {
            ctx.shadowColor = '#fbbf24';
            ctx.shadowBlur = 14;
            ctx.drawImage(keyImg, kx, ky, cellSize, cellSize);

            // Shimmer flare
            ctx.fillStyle = '#ffffff';
            ctx.globalAlpha = 0.6 + Math.sin(now * 0.01) * 0.4;
            ctx.fillRect(kx + cellSize * 0.46, ky + cellSize * 0.32, 2.5, 2.5);
          } else {
            // Procedural gold key
            const centerKx = kx + cellSize / 2;
            const centerKy = ky + cellSize / 2;
            ctx.shadowColor = '#fbbf24';
            ctx.shadowBlur = 14;
            ctx.strokeStyle = '#fbbf24';
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.arc(centerKx, centerKy - 4, 6, 0, Math.PI * 2);
            ctx.stroke();

            ctx.beginPath();
            ctx.moveTo(centerKx, centerKy + 2);
            ctx.lineTo(centerKx, centerKy + 12);
            ctx.moveTo(centerKx, centerKy + 7);
            ctx.lineTo(centerKx + 4, centerKy + 7);
            ctx.stroke();
          }
          ctx.restore();
        }
      }

      // 8. Draw Exit / Temporal Goal Portal
      const exitX = offsetX + state.exit.x * cellSize;
      const exitY = offsetY + state.exit.y * cellSize;
      const exitCx = exitX + cellSize / 2;
      const exitCy = exitY + cellSize / 2;

      ctx.save();
      const portalImg = tileImages.current['exit_portal'];
      if (portalImg && portalImg.complete && portalImg.naturalWidth > 0) {
        if (state.exit.isUnlocked) {
          ctx.shadowColor = '#a855f7';
          ctx.shadowBlur = 18;
          ctx.drawImage(portalImg, exitX, exitY, cellSize, cellSize);

          // Animated temporal vortex swirl overlay
          const rot = now * 0.003;
          ctx.save();
          ctx.translate(exitCx, exitCy);
          ctx.rotate(rot);
          ctx.strokeStyle = '#00f0ff';
          ctx.lineWidth = 1.5;
          ctx.setLineDash([4, 4]);
          ctx.beginPath();
          ctx.arc(0, 0, cellSize * 0.22, 0, Math.PI * 2);
          ctx.stroke();
          ctx.restore();

          // Pulsing white quantum core
          ctx.fillStyle = '#ffffff';
          ctx.shadowColor = '#ffffff';
          ctx.shadowBlur = 12;
          ctx.globalAlpha = 0.8 + Math.sin(now * 0.008) * 0.2;
          ctx.beginPath();
          ctx.arc(exitCx, exitCy, cellSize * 0.1, 0, Math.PI * 2);
          ctx.fill();
        } else {
          // Locked exit pad: dim violet base with sealed cyber-lock
          ctx.globalAlpha = 0.55;
          ctx.drawImage(portalImg, exitX, exitY, cellSize, cellSize);

          ctx.globalAlpha = 1;
          ctx.strokeStyle = '#ef4444';
          ctx.lineWidth = 2;
          ctx.shadowColor = '#ef4444';
          ctx.shadowBlur = 8;
          ctx.strokeRect(exitX + 4, exitY + 4, cellSize - 8, cellSize - 8);

          // Lock icon
          ctx.fillStyle = '#f87171';
          ctx.fillRect(exitCx - 5, exitCy - 1, 10, 8);
          ctx.beginPath();
          ctx.arc(exitCx, exitCy - 1, 4, Math.PI, 0, false);
          ctx.stroke();
        }
      } else {
        // Procedural Sci-Fi Portal Fallback
        if (state.exit.isUnlocked) {
          ctx.shadowColor = '#a855f7';
          ctx.shadowBlur = 18;
          ctx.strokeStyle = '#7e22ce';
          ctx.lineWidth = 3;
          ctx.strokeRect(exitX + 3, exitY + 3, cellSize - 6, cellSize - 6);

          ctx.fillStyle = '#00f0ff';
          ctx.beginPath();
          ctx.arc(exitCx, exitCy, cellSize * 0.25, 0, Math.PI * 2);
          ctx.fill();
        } else {
          ctx.fillStyle = '#101a33';
          ctx.fillRect(exitX + 3, exitY + 3, cellSize - 6, cellSize - 6);
          ctx.strokeStyle = '#ef4444';
          ctx.lineWidth = 2;
          ctx.strokeRect(exitX + 3, exitY + 3, cellSize - 6, cellSize - 6);
        }
      }
      ctx.restore();

      // 9. Draw Spaceship Hull Walls & Corner Junctions
      for (const wall of level.walls) {
        const wx = offsetX + wall.x * cellSize;
        const wy = offsetY + wall.y * cellSize;

        // Check 4-way wall adjacencies
        const hasNorth = level.walls.some((w) => w.x === wall.x && w.y === wall.y - 1);
        const hasSouth = level.walls.some((w) => w.x === wall.x && w.y === wall.y + 1);
        const hasEast = level.walls.some((w) => w.x === wall.x + 1 && w.y === wall.y);
        const hasWest = level.walls.some((w) => w.x === wall.x - 1 && w.y === wall.y);
        const neighborCount = (hasNorth ? 1 : 0) + (hasSouth ? 1 : 0) + (hasEast ? 1 : 0) + (hasWest ? 1 : 0);

        ctx.save();
        let wallKey = 'wall_solid';
        let rotation = 0; // in radians

        if (neighborCount === 0) {
          // Free-standing obstacle pillar
          wallKey = 'wall_pillar';
        } else if ((hasSouth && hasEast) && !hasNorth && !hasWest) {
          // Top-left corner
          wallKey = 'wall_corner';
          rotation = 0;
        } else if ((hasSouth && hasWest) && !hasNorth && !hasEast) {
          // Top-right corner
          wallKey = 'wall_corner';
          rotation = Math.PI / 2;
        } else if ((hasNorth && hasWest) && !hasSouth && !hasEast) {
          // Bottom-right corner
          wallKey = 'wall_corner';
          rotation = Math.PI;
        } else if ((hasNorth && hasEast) && !hasSouth && !hasWest) {
          // Bottom-left corner
          wallKey = 'wall_corner';
          rotation = (3 * Math.PI) / 2;
        } else if ((hasEast || hasWest) && !hasNorth && !hasSouth) {
          // Horizontal wall edge
          wallKey = 'wall_edge';
        } else {
          // Solid wall section
          wallKey = 'wall_solid';
        }

        const wallImg = tileImages.current[wallKey] || tileImages.current['wall_solid'] || tileImages.current['wall_block'];

        if (wallImg && wallImg.complete && wallImg.naturalWidth > 0) {
          if (rotation !== 0) {
            ctx.translate(wx + cellSize / 2, wy + cellSize / 2);
            ctx.rotate(rotation);
            ctx.drawImage(wallImg, -cellSize / 2, -cellSize / 2, cellSize, cellSize);
          } else {
            ctx.drawImage(wallImg, wx, wy, cellSize, cellSize);
          }

          // Subtle cyan edge armor glow
          ctx.strokeStyle = 'rgba(0, 240, 255, 0.12)';
          ctx.lineWidth = 1;
          ctx.strokeRect(wx + 0.5, wy + 0.5, cellSize - 1, cellSize - 1);
        } else {
          // High-contrast spaceship hull wall fallback
          ctx.fillStyle = '#080e1c';
          ctx.fillRect(wx, wy, cellSize, cellSize);

          ctx.fillStyle = '#182542';
          ctx.fillRect(wx + 2, wy + 2, cellSize - 4, cellSize - 4);

          ctx.fillStyle = '#2d4272';
          ctx.fillRect(wx + 4, wy + 4, cellSize - 8, cellSize - 8);

          ctx.fillStyle = '#00f0ff';
          ctx.fillRect(wx + 5, wy + 5, 2, 2);
          ctx.fillRect(wx + cellSize - 7, wy + 5, 2, 2);
          ctx.fillRect(wx + 5, wy + cellSize - 7, 2, 2);
          ctx.fillRect(wx + cellSize - 7, wy + cellSize - 7, 2, 2);
        }
        ctx.restore();
      }

      // 10. Lerp Player Position
      const lerpSpeed = Math.min(1, dt * 18);
      animPlayerPos.current.x += (state.playerPos.x - animPlayerPos.current.x) * lerpSpeed;
      animPlayerPos.current.y += (state.playerPos.y - animPlayerPos.current.y) * lerpSpeed;

      // Add trail point for player
      if (Math.hypot(state.playerPos.x - animPlayerPos.current.x, state.playerPos.y - animPlayerPos.current.y) > 0.02) {
        trailsRef.current.push({
          x: animPlayerPos.current.x,
          y: animPlayerPos.current.y,
          color: '#00f2fe',
          alpha: 0.6,
        });
      }

      // 11. Lerp Ghost Positions
      state.ghosts.forEach((ghost, gIdx) => {
        if (!animGhostPos.current[gIdx]) {
          const idx = Math.min(state.currentStep, ghost.path.length - 1);
          animGhostPos.current[gIdx] = { ...ghost.path[idx] };
        }
        const targetIdx = Math.min(state.currentStep, ghost.path.length - 1);
        const targetPos = ghost.path[targetIdx] || { x: 0, y: 0 };
        const curPos = animGhostPos.current[gIdx];

        curPos.x += (targetPos.x - curPos.x) * lerpSpeed;
        curPos.y += (targetPos.y - curPos.y) * lerpSpeed;

        if (Math.hypot(targetPos.x - curPos.x, targetPos.y - curPos.y) > 0.02) {
          trailsRef.current.push({
            x: curPos.x,
            y: curPos.y,
            color: ghost.color,
            alpha: 0.5,
          });
        }
      });

      // 12. Draw and update trails
      for (let i = trailsRef.current.length - 1; i >= 0; i--) {
        const pt = trailsRef.current[i];
        pt.alpha -= dt * 2.2;
        if (pt.alpha <= 0) {
          trailsRef.current.splice(i, 1);
          continue;
        }

        const tx = offsetX + pt.x * cellSize + cellSize / 2;
        const ty = offsetY + pt.y * cellSize + cellSize / 2;

        ctx.save();
        ctx.fillStyle = pt.color;
        ctx.globalAlpha = pt.alpha * 0.4;
        ctx.beginPath();
        ctx.arc(tx, ty, cellSize * 0.2, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }

      // 13. Draw Ghosts (Translucent with distinct color & number badge, using animated walk frames or directional idle)
      state.ghosts.forEach((ghost, gIdx) => {
        const gPos = animGhostPos.current[gIdx] || { x: 0, y: 0 };
        const gx = offsetX + gPos.x * cellSize + cellSize / 2;
        const gy = offsetY + gPos.y * cellSize + cellSize / 2;

        ctx.save();
        const ghostFloat = Math.sin(now * 0.005 + gIdx * 2) * 3;
        const gDir = ghostDirections.current[gIdx] || 'south';

        // Check if ghost is currently moving (lerping towards target coordinate)
        const targetIdx = Math.min(state.currentStep, ghost.path.length - 1);
        const targetPos = ghost.path[targetIdx] || { x: 0, y: 0 };
        const isGhostMoving = Math.hypot(targetPos.x - gPos.x, targetPos.y - gPos.y) > 0.04;

        let sprite: HTMLImageElement | undefined;
        if (isGhostMoving) {
          const cardinal = toCardinalDir(gDir);
          const walkFrames = ghostWalkFrames.current[cardinal];
          if (walkFrames && walkFrames.length > 0) {
            const frameIndex = Math.floor((now / 100) % walkFrames.length);
            sprite = walkFrames[frameIndex];
          }
        }

        // Fallback to directional idle sprite if stationary or frame not ready
        if (!sprite || !sprite.complete || sprite.naturalWidth === 0) {
          sprite = ghostSprites.current[gDir];
        }

        // Spectral aura glow
        ctx.shadowColor = ghost.color;
        ctx.shadowBlur = 18;

        const charSize = Math.floor(cellSize * 0.88);

        if (sprite && sprite.complete && sprite.naturalWidth > 0) {
          ctx.globalAlpha = 0.72;

          // For Ghost 2+ (fallback to Ghost 1 art with distinguishable hue tint)
          if (ghost.id > 1) {
            ctx.filter = 'hue-rotate(65deg) saturate(1.4)';
          }

          ctx.drawImage(
            sprite,
            gx - charSize / 2,
            gy + ghostFloat - charSize / 2,
            charSize,
            charSize
          );

          // Reset filter
          ctx.filter = 'none';

          // Floating identification badge over head
          ctx.globalAlpha = 1;
          const badgeY = gy + ghostFloat - charSize / 2 - 4;
          ctx.fillStyle = ghost.color;
          ctx.beginPath();
          ctx.arc(gx, badgeY, 6, 0, Math.PI * 2);
          ctx.fill();

          ctx.fillStyle = '#ffffff';
          ctx.font = '7px "Press Start 2P", monospace';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(String(ghost.id), gx, badgeY + 1);
        } else {
          // Fallback if sprite image is still loading
          ctx.fillStyle = ghost.color;
          ctx.globalAlpha = 0.55;
          ctx.beginPath();
          ctx.arc(gx, gy + ghostFloat, cellSize * 0.28, 0, Math.PI * 2);
          ctx.fill();

          ctx.strokeStyle = '#ffffff';
          ctx.lineWidth = 1.5;
          ctx.globalAlpha = 0.8;
          ctx.stroke();

          ctx.fillStyle = '#ffffff';
          ctx.font = `${Math.max(8, Math.floor(cellSize * 0.18))}px "Press Start 2P", monospace`;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.globalAlpha = 1;
          ctx.fillText(String(ghost.id), gx, gy + ghostFloat);
        }

        ctx.restore();
      });

      // 14. Draw Current Player (8-Directional Pixel-Art Sprite with Cyan Glow Aura & Walking Animations)
      const px = offsetX + animPlayerPos.current.x * cellSize + cellSize / 2;
      const py = offsetY + animPlayerPos.current.y * cellSize + cellSize / 2;

      ctx.save();
      const pDir = playerDirection.current || 'south';
      const isPlayerMoving = Math.hypot(state.playerPos.x - animPlayerPos.current.x, state.playerPos.y - animPlayerPos.current.y) > 0.04;

      let pSprite: HTMLImageElement | undefined;
      if (isPlayerMoving) {
        const cardinal = toCardinalDir(pDir);
        const walkFrames = playerWalkFrames.current[cardinal];
        if (walkFrames && walkFrames.length > 0) {
          const frameIndex = Math.floor((now / 100) % walkFrames.length);
          pSprite = walkFrames[frameIndex];
        }
      }

      // Fallback to directional idle sprite if stationary or frame not ready
      if (!pSprite || !pSprite.complete || pSprite.naturalWidth === 0) {
        pSprite = playerSprites.current[pDir];
      }

      const pSize = Math.floor(cellSize * 0.88);

      // Cyan pulse aura beneath player feet
      ctx.shadowColor = '#00f2fe';
      ctx.shadowBlur = 16;
      ctx.strokeStyle = 'rgba(0, 242, 254, 0.4)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.ellipse(px, py + pSize * 0.35, pSize * 0.32, pSize * 0.16, 0, 0, Math.PI * 2);
      ctx.stroke();

      if (pSprite && pSprite.complete && pSprite.naturalWidth > 0) {
        // Draw pixel-art explorer sprite (animated walk or directional idle)
        ctx.drawImage(
          pSprite,
          px - pSize / 2,
          py - pSize / 2,
          pSize,
          pSize
        );
      } else {
        // High quality gradient avatar fallback while loading
        ctx.strokeStyle = '#00f2fe';
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.arc(px, py, cellSize * 0.32, 0, Math.PI * 2);
        ctx.stroke();

        const coreGrad = ctx.createRadialGradient(px, py, 2, px, py, cellSize * 0.26);
        coreGrad.addColorStop(0, '#ffffff');
        coreGrad.addColorStop(0.5, '#38bdf8');
        coreGrad.addColorStop(1, '#0284c7');
        ctx.fillStyle = coreGrad;
        ctx.beginPath();
        ctx.arc(px, py, cellSize * 0.25, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(px, py, 3.5, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.restore();

      // 15. Draw Particles
      for (let i = particlesRef.current.length - 1; i >= 0; i--) {
        const p = particlesRef.current[i];
        p.x += p.vx;
        p.y += p.vy;
        p.alpha -= p.decay;

        if (p.alpha <= 0) {
          particlesRef.current.splice(i, 1);
          continue;
        }

        ctx.save();
        ctx.fillStyle = p.color;
        ctx.globalAlpha = p.alpha;
        ctx.shadowColor = p.color;
        ctx.shadowBlur = 6;
        ctx.beginPath();
        const drawPx = p.x < 50 ? offsetX + p.x * cellSize + cellSize / 2 : p.x;
        const drawPy = p.y < 50 ? offsetY + p.y * cellSize + cellSize / 2 : p.y;
        ctx.arc(drawPx, drawPy, p.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }

      // 16. Rewind Screen Distortion Effect
      if (rewindActive.current) {
        rewindProgress.current += dt * 2.2;
        ctx.save();
        const scanlineY = (now * 0.8) % displayHeight;
        ctx.fillStyle = 'rgba(0, 242, 254, 0.12)';
        ctx.fillRect(0, scanlineY - 4, displayWidth, 8);

        ctx.fillStyle = `rgba(168, 85, 247, ${Math.max(0, 0.4 - rewindProgress.current * 0.4)})`;
        ctx.fillRect(0, 0, displayWidth, displayHeight);
        ctx.restore();

        if (rewindProgress.current >= 1) {
          rewindActive.current = false;
          if (onRewindComplete) {
            onRewindComplete();
          }
        }
      }

      ctx.restore();
      animFrameRef.current = requestAnimationFrame(render);
    };

    animFrameRef.current = requestAnimationFrame(render);

    return () => {
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
      }
    };
  }, [state, level, showPathPreview, onRewindComplete]);

  return (
    <div className="relative w-full h-full flex items-center justify-center select-none overflow-hidden rounded-2xl bg-slate-950 border border-slate-800 shadow-2xl">
      <canvas ref={canvasRef} className="w-full h-full block" />
    </div>
  );
};
