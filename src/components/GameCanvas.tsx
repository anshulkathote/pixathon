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

      // Compute optimal cell sizing and viewport positioning
      const minPadding = displayWidth < 640 ? 12 : 24;
      const availWidth = displayWidth - minPadding * 2;
      const availHeight = displayHeight - minPadding * 2;

      // Scale dynamically to fill viewport while preserving 1:1 aspect ratio
      const rawCellSize = Math.min(availWidth / level.width, availHeight / level.height);
      const cellSize = Math.max(38, Math.min(Math.floor(rawCellSize), 96));

      const gridPixelWidth = level.width * cellSize;
      const gridPixelHeight = level.height * cellSize;
      const offsetX = Math.floor((displayWidth - gridPixelWidth) / 2);
      const offsetY = Math.floor((displayHeight - gridPixelHeight) / 2);

      // --- 0. DEEP SPACE & SURROUNDING SPACESHIP SUPERSTRUCTURE ---
      // Outer facility background - deep space & structural bulkheads
      ctx.fillStyle = '#08080f';
      ctx.fillRect(0, 0, displayWidth, displayHeight);

      // Subtle ambient stars / nebula particles in outer perimeter
      for (let s = 0; s < 36; s++) {
        const sx = (Math.sin(s * 91.7 + 12.3) * 0.5 + 0.5) * displayWidth;
        const sy = (Math.cos(s * 43.1 + 84.9) * 0.5 + 0.5) * displayHeight;
        const sBrightness = 0.15 + (Math.sin(now * 0.0015 + s * 1.5) * 0.5 + 0.5) * 0.35;
        ctx.fillStyle = s % 3 === 0 ? `rgba(0, 240, 255, ${sBrightness})` : `rgba(168, 85, 247, ${sBrightness * 0.7})`;
        ctx.fillRect(Math.floor(sx), Math.floor(sy), s % 4 === 0 ? 2 : 1, s % 4 === 0 ? 2 : 1);
      }

      // Outer spaceship hull panel plating around the active maze module
      const outerHullPadding = Math.max(16, Math.floor(cellSize * 0.65));
      const hullLeft = offsetX - outerHullPadding;
      const hullTop = offsetY - outerHullPadding;
      const hullWidth = gridPixelWidth + outerHullPadding * 2;
      const hullHeight = gridPixelHeight + outerHullPadding * 2;

      // Heavy industrial perimeter hull
      ctx.fillStyle = '#10131f';
      ctx.fillRect(hullLeft, hullTop, hullWidth, hullHeight);

      // Outer steel rim
      ctx.strokeStyle = '#222940';
      ctx.lineWidth = 3;
      ctx.strokeRect(hullLeft, hullTop, hullWidth, hullHeight);

      // Perimeter outer wall dark void rim
      ctx.strokeStyle = '#05060a';
      ctx.lineWidth = 2;
      ctx.strokeRect(hullLeft + 2, hullTop + 2, hullWidth - 4, hullHeight - 4);

      // --- 1. INDUSTRIAL CORRIDOR FLOOR PLATING & GRATES ---
      for (let y = 0; y < level.height; y++) {
        for (let x = 0; x < level.width; x++) {
          const cx = offsetX + x * cellSize;
          const cy = offsetY + y * cellSize;
          const isWall = level.walls.some((w) => w.x === x && w.y === y);

          if (!isWall) {
            const hash = (x * 7 + y * 13) % 10;
            const isGrate = hash === 3 || hash === 8;

            if (isGrate) {
              // Industrial ventilation mesh / drainage grate tile
              ctx.fillStyle = '#151c2e';
              ctx.fillRect(cx, cy, cellSize, cellSize);

              // Grate mesh slits
              ctx.fillStyle = '#0a0d16';
              const slitH = Math.max(2, Math.floor(cellSize * 0.08));
              const gap = Math.max(4, Math.floor(cellSize * 0.16));
              for (let gy = cy + 4; gy < cy + cellSize - 4; gy += gap) {
                ctx.fillRect(cx + 4, gy, cellSize - 8, slitH);
              }

              // Grate frame border
              ctx.strokeStyle = '#283652';
              ctx.lineWidth = 1;
              ctx.strokeRect(cx + 1, cy + 1, cellSize - 2, cellSize - 2);
            } else {
              // Heavy metallic floor plate (blue-grey slate)
              ctx.fillStyle = '#212f48';
              ctx.fillRect(cx, cy, cellSize, cellSize);

              // Inner floor plate tone variation
              const shade = (x + y) % 2 === 0 ? '#263753' : '#1e2b42';
              ctx.fillStyle = shade;
              ctx.fillRect(cx + 2, cy + 2, cellSize - 4, cellSize - 4);

              // Metal floor seams & bevels
              ctx.strokeStyle = '#121a2a';
              ctx.lineWidth = 1.5;
              ctx.strokeRect(cx + 0.5, cy + 0.5, cellSize - 1, cellSize - 1);

              // Subtle corner bolts
              ctx.fillStyle = '#3f567f';
              ctx.fillRect(cx + 4, cy + 4, 2, 2);
              ctx.fillRect(cx + cellSize - 6, cy + 4, 2, 2);
              ctx.fillRect(cx + 4, cy + cellSize - 6, 2, 2);
              ctx.fillRect(cx + cellSize - 6, cy + cellSize - 6, 2, 2);

              // Subtle scratch / panel seam line
              if (hash === 5) {
                ctx.strokeStyle = '#182338';
                ctx.lineWidth = 1;
                ctx.beginPath();
                ctx.moveTo(cx + 6, cy + cellSize / 2);
                ctx.lineTo(cx + cellSize - 6, cy + cellSize / 2);
                ctx.stroke();
              }
            }

            // Floor cables snaking across corridors (as in reference image)
            if ((x * 11 + y * 17) % 19 === 7) {
              ctx.save();
              ctx.strokeStyle = '#0e121a';
              ctx.lineWidth = 3;
              ctx.beginPath();
              ctx.moveTo(cx, cy + cellSize * 0.7);
              ctx.bezierCurveTo(cx + cellSize * 0.4, cy + cellSize * 0.9, cx + cellSize * 0.6, cy + cellSize * 0.3, cx + cellSize, cy + cellSize * 0.5);
              ctx.stroke();

              // Colored wire jacket
              ctx.strokeStyle = (x % 2 === 0) ? '#852b36' : '#2d4b68';
              ctx.lineWidth = 1.5;
              ctx.beginPath();
              ctx.moveTo(cx, cy + cellSize * 0.7);
              ctx.bezierCurveTo(cx + cellSize * 0.4, cy + cellSize * 0.9, cx + cellSize * 0.6, cy + cellSize * 0.3, cx + cellSize, cy + cellSize * 0.5);
              ctx.stroke();
              ctx.restore();
            }
          }
        }
      }

      // --- 2. RADIANT CYAN NEON FLOOR LIGHT GUIDES & CIRCUITS ---
      // Draw continuous cyan neon light strips along the corridor paths (signature look from reference image)
      for (let y = 0; y < level.height; y++) {
        for (let x = 0; x < level.width; x++) {
          const isWall = level.walls.some((w) => w.x === x && w.y === y);
          if (isWall) continue;

          const cx = offsetX + x * cellSize;
          const cy = offsetY + y * cellSize;

          // Check if neighboring cells are walls to place floor edge neon tracks
          const hasWallN = level.walls.some((w) => w.x === x && w.y === y - 1);
          const hasWallS = level.walls.some((w) => w.x === x && w.y === y + 1);
          const hasWallW = level.walls.some((w) => w.x === x - 1 && w.y === y);
          const hasWallE = level.walls.some((w) => w.x === x + 1 && w.y === y);

          // Draw neon guide strip along corridor edge parallel to walls
          ctx.save();
          ctx.shadowColor = '#00f0ff';
          ctx.shadowBlur = 8;
          ctx.strokeStyle = '#00f0ff';
          ctx.lineWidth = Math.max(2, Math.floor(cellSize * 0.05));

          const margin = Math.max(4, Math.floor(cellSize * 0.14));

          if (hasWallN && !hasWallW && !hasWallE) {
            ctx.beginPath();
            ctx.moveTo(cx, cy + margin);
            ctx.lineTo(cx + cellSize, cy + margin);
            ctx.stroke();
          } else if (hasWallS && !hasWallW && !hasWallE) {
            ctx.beginPath();
            ctx.moveTo(cx, cy + cellSize - margin);
            ctx.lineTo(cx + cellSize, cy + cellSize - margin);
            ctx.stroke();
          } else if (hasWallW && !hasWallN && !hasWallS) {
            ctx.beginPath();
            ctx.moveTo(cx + margin, cy);
            ctx.lineTo(cx + margin, cy + cellSize);
            ctx.stroke();
          } else if (hasWallE && !hasWallN && !hasWallS) {
            ctx.beginPath();
            ctx.moveTo(cx + cellSize - margin, cy);
            ctx.lineTo(cx + cellSize - margin, cy + cellSize);
            ctx.stroke();
          }
          ctx.restore();
        }
      }

      // Circuit conduit lines connecting pressure plates to their linked doors
      for (const door of state.doors) {
        if (!door.linkedPlateId) continue;
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
          // Blazing active cyan circuit
          ctx.strokeStyle = '#00f0ff';
          ctx.lineWidth = Math.max(2.5, Math.floor(cellSize * 0.07));
          ctx.shadowColor = '#00f0ff';
          ctx.shadowBlur = 12;
          ctx.stroke();

          // Flowing pulse particle
          const pulsePhase = (now * 0.003) % 1;
          const pulseX = tx + (dx - tx) * pulsePhase;
          const pulseY = ty + (dy - ty) * pulsePhase;
          ctx.fillStyle = '#ffffff';
          ctx.shadowColor = '#ffffff';
          ctx.shadowBlur = 10;
          ctx.beginPath();
          ctx.arc(pulseX, pulseY, Math.max(2.5, cellSize * 0.06), 0, Math.PI * 2);
          ctx.fill();
        } else {
          // Dormant cable trench
          ctx.strokeStyle = '#18243a';
          ctx.lineWidth = Math.max(2, Math.floor(cellSize * 0.04));
          ctx.stroke();
        }
        ctx.restore();
      }

      // --- 3. PRESSURE PLATES (Capacitive Sub-Floor Trigger Terminals) ---
      for (const plate of state.plates) {
        const cx = offsetX + plate.x * cellSize;
        const cy = offsetY + plate.y * cellSize;
        const isPressed = plate.isPressed;

        const pad = Math.floor(cellSize * 0.14);
        const pw = cellSize - pad * 2;
        const ph = cellSize - pad * 2;

        ctx.save();
        // Heavy steel rim
        ctx.fillStyle = '#0e1422';
        ctx.fillRect(cx + pad - 2, cy + pad - 2, pw + 4, ph + 4);
        ctx.strokeStyle = '#2d3e5e';
        ctx.lineWidth = 1.5;
        ctx.strokeRect(cx + pad - 2, cy + pad - 2, pw + 4, ph + 4);

        if (isPressed) {
          // Blazing cyan capacitive depression
          ctx.fillStyle = '#061324';
          ctx.fillRect(cx + pad, cy + pad, pw, ph);

          ctx.strokeStyle = '#00f0ff';
          ctx.lineWidth = 2.5;
          ctx.shadowColor = '#00f0ff';
          ctx.shadowBlur = 16;
          ctx.strokeRect(cx + pad + 1, cy + pad + 1, pw - 2, ph - 2);

          // Center glowing core
          ctx.fillStyle = '#0df2c8';
          ctx.beginPath();
          ctx.arc(cx + cellSize / 2, cy + cellSize / 2, pw * 0.22, 0, Math.PI * 2);
          ctx.fill();

          ctx.fillStyle = '#ffffff';
          ctx.beginPath();
          ctx.arc(cx + cellSize / 2, cy + cellSize / 2, pw * 0.1, 0, Math.PI * 2);
          ctx.fill();
        } else {
          // Raised mechanical plate in standby
          ctx.fillStyle = '#1c283f';
          ctx.fillRect(cx + pad, cy + pad, pw, ph);

          ctx.strokeStyle = '#32486d';
          ctx.lineWidth = 1.5;
          ctx.strokeRect(cx + pad, cy + pad, pw, ph);

          // Standby cyan LED dot
          ctx.fillStyle = '#00f0ff';
          ctx.globalAlpha = 0.5 + Math.sin(now * 0.005) * 0.3;
          ctx.fillRect(cx + cellSize / 2 - 2, cy + cellSize / 2 - 2, 4, 4);
        }
        ctx.restore();
      }

      // --- 4. RECORDED-PATH PREVIEW ---
      if (showPathPreview && state.ghosts.length > 0) {
        state.ghosts.forEach((ghost) => {
          if (ghost.path.length <= 1) return;

          ctx.save();
          ctx.strokeStyle = ghost.color;
          ctx.fillStyle = ghost.color;
          ctx.lineWidth = Math.max(1.5, Math.floor(cellSize * 0.04));
          ctx.setLineDash([4, 4]);
          ctx.globalAlpha = 0.42;

          ctx.beginPath();
          ghost.path.forEach((pt, pIdx) => {
            const px = offsetX + pt.x * cellSize + cellSize / 2;
            const py = offsetY + pt.y * cellSize + cellSize / 2;
            if (pIdx === 0) ctx.moveTo(px, py);
            else ctx.lineTo(px, py);
          });
          ctx.stroke();

          ctx.setLineDash([]);
          ghost.path.forEach((pt) => {
            const px = offsetX + pt.x * cellSize + cellSize / 2;
            const py = offsetY + pt.y * cellSize + cellSize / 2;
            ctx.beginPath();
            ctx.arc(px, py, Math.max(2, cellSize * 0.04), 0, Math.PI * 2);
            ctx.fill();
          });

          const finalPt = ghost.path[ghost.path.length - 1];
          const fx = offsetX + finalPt.x * cellSize + cellSize / 2;
          const fy = offsetY + finalPt.y * cellSize + cellSize / 2;
          ctx.globalAlpha = 0.75;
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.arc(fx, fy, cellSize * 0.32, 0, Math.PI * 2);
          ctx.stroke();
          ctx.restore();
        });
      }

      // --- 6. SCI-FI AIRLOCK DOORS (Matches the glowing orange double-sliding airlocks from the reference image) ---
      for (const door of state.doors) {
        const cx = offsetX + door.x * cellSize;
        const cy = offsetY + door.y * cellSize;
        const isLocked = door.requiredKeyId || door.isLockedDoor;

        ctx.save();
        if (door.isOpen) {
          // RETRACTED AIRLOCK: Door leaves slid into wall pockets
          // Doorway frame
          ctx.fillStyle = '#151b2c';
          ctx.fillRect(cx, cy, cellSize, cellSize);

          // Retracted left and right door leaves
          ctx.fillStyle = '#2a334a';
          ctx.fillRect(cx, cy + 2, 4, cellSize - 4);
          ctx.fillRect(cx + cellSize - 4, cy + 2, 4, cellSize - 4);

          // Threshold walk track & green access indicator
          ctx.fillStyle = '#0df2c8';
          ctx.shadowColor = '#00f0ff';
          ctx.shadowBlur = 8;
          ctx.fillRect(cx + 6, cy + cellSize / 2 - 1, cellSize - 12, 2);
        } else {
          // CLOSED AIRLOCK: Vibrant orange/amber illuminated double-panel doors with chevron seal
          const doorColor = isLocked ? '#ff5533' : '#ff9900';
          const coreColor = isLocked ? '#ffaa66' : '#ffcc33';

          // Outer heavy reinforced frame
          ctx.fillStyle = '#111624';
          ctx.fillRect(cx, cy, cellSize, cellSize);
          ctx.strokeStyle = '#2e3a54';
          ctx.lineWidth = 2;
          ctx.strokeRect(cx + 1, cy + 1, cellSize - 2, cellSize - 2);

          // Radiant orange ambient light emission onto surrounding floor
          ctx.shadowColor = doorColor;
          ctx.shadowBlur = 20;

          // Left sliding door leaf
          const leafW = Math.floor(cellSize * 0.42);
          ctx.fillStyle = doorColor;
          ctx.fillRect(cx + 3, cy + 3, leafW, cellSize - 6);

          // Right sliding door leaf
          ctx.fillRect(cx + cellSize - leafW - 3, cy + 3, leafW, cellSize - 6);

          // Inner glowing core panel on each leaf
          ctx.fillStyle = coreColor;
          ctx.fillRect(cx + 6, cy + 6, leafW - 6, cellSize - 12);
          ctx.fillRect(cx + cellSize - leafW, cy + 6, leafW - 6, cellSize - 12);

          // Center seal line with mechanical interlocking chevron
          ctx.shadowBlur = 0;
          ctx.strokeStyle = '#0e121a';
          ctx.lineWidth = 2;
          const midX = cx + cellSize / 2;
          ctx.beginPath();
          ctx.moveTo(midX, cy + 3);
          ctx.lineTo(midX, cy + cellSize * 0.4);
          ctx.lineTo(midX + 3, cy + cellSize * 0.5);
          ctx.lineTo(midX, cy + cellSize * 0.6);
          ctx.lineTo(midX, cy + cellSize - 3);
          ctx.stroke();

          // If locked with key, draw digital padlock badge
          if (isLocked) {
            ctx.fillStyle = '#ffeedd';
            ctx.fillRect(midX - 4, cy + cellSize / 2 - 4, 8, 8);
            ctx.fillStyle = '#220000';
            ctx.fillRect(midX - 2, cy + cellSize / 2 - 2, 4, 4);
          }
        }
        ctx.restore();
      }

      // --- 7. QUANTUM KEY ITEM ---
      for (const key of state.keys) {
        if (!key.isCollected) {
          const kx = offsetX + key.x * cellSize;
          const floatOffset = Math.sin(now * 0.005) * 3;
          const ky = offsetY + key.y * cellSize + floatOffset;

          ctx.save();
          const centerKx = kx + cellSize / 2;
          const centerKy = ky + cellSize / 2;

          ctx.shadowColor = '#fbbf24';
          ctx.shadowBlur = 18;

          // Gold key head
          ctx.strokeStyle = '#fbbf24';
          ctx.lineWidth = 3;
          ctx.beginPath();
          ctx.arc(centerKx, centerKy - 4, 6, 0, Math.PI * 2);
          ctx.stroke();

          // Key shaft & teeth
          ctx.beginPath();
          ctx.moveTo(centerKx, centerKy + 2);
          ctx.lineTo(centerKx, centerKy + 12);
          ctx.moveTo(centerKx, centerKy + 7);
          ctx.lineTo(centerKx + 4, centerKy + 7);
          ctx.stroke();

          // Embedded sparkling blue sub-pixel
          ctx.fillStyle = '#00f0ff';
          ctx.fillRect(centerKx - 1.5, centerKy - 5.5, 3, 3);
          ctx.restore();
        }
      }

      // --- 8. TEMPORAL EXIT PORTAL ---
      const exitX = offsetX + state.exit.x * cellSize;
      const exitY = offsetY + state.exit.y * cellSize;
      const exitCx = exitX + cellSize / 2;
      const exitCy = exitY + cellSize / 2;

      ctx.save();
      if (state.exit.isUnlocked) {
        // Swirling purple & cyan portal terminal pad
        ctx.fillStyle = '#101526';
        ctx.fillRect(exitX + 2, exitY + 2, cellSize - 4, cellSize - 4);
        ctx.strokeStyle = '#a855f7';
        ctx.lineWidth = 2.5;
        ctx.strokeRect(exitX + 2, exitY + 2, cellSize - 4, cellSize - 4);

        // Rotating vortex rings
        ctx.shadowColor = '#a855f7';
        ctx.shadowBlur = 20;
        const rot = now * 0.003;
        ctx.save();
        ctx.translate(exitCx, exitCy);
        ctx.rotate(rot);
        ctx.strokeStyle = '#00f0ff';
        ctx.lineWidth = 2;
        ctx.setLineDash([4, 4]);
        ctx.beginPath();
        ctx.arc(0, 0, cellSize * 0.28, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();

        // Pulsing white quantum core
        ctx.fillStyle = '#ffffff';
        ctx.shadowColor = '#ffffff';
        ctx.shadowBlur = 14;
        ctx.globalAlpha = 0.85 + Math.sin(now * 0.008) * 0.15;
        ctx.beginPath();
        ctx.arc(exitCx, exitCy, cellSize * 0.12, 0, Math.PI * 2);
        ctx.fill();
      } else {
        // Sealed airlock portal
        ctx.fillStyle = '#141824';
        ctx.fillRect(exitX + 2, exitY + 2, cellSize - 4, cellSize - 4);
        ctx.strokeStyle = '#ef4444';
        ctx.lineWidth = 2;
        ctx.strokeRect(exitX + 2, exitY + 2, cellSize - 4, cellSize - 4);

        ctx.fillStyle = '#f87171';
        ctx.fillRect(exitCx - 5, exitCy - 1, 10, 8);
        ctx.beginPath();
        ctx.arc(exitCx, exitCy - 1, 4, Math.PI, 0, false);
        ctx.stroke();
      }
      ctx.restore();

      // --- 9. TOP-DOWN 2.5D SPACESHIP BULKHEAD WALLS WITH MACHINERY & PIPING ---
      // (Recreates the exact perspective, wall depth, pipe bundles, and computer terminal monitors from the reference image)
      const isWallAt = (wx: number, wy: number) => level.walls.some((w) => w.x === wx && w.y === wy);

      for (const wall of level.walls) {
        const wx = offsetX + wall.x * cellSize;
        const wy = offsetY + wall.y * cellSize;

        const n = isWallAt(wall.x, wall.y - 1);
        const s = isWallAt(wall.x, wall.y + 1);
        const e = isWallAt(wall.x + 1, wall.y);
        const w = isWallAt(wall.x - 1, wall.y);

        ctx.save();

        // LAYER 1: WALL TOP CAP (The dark ceiling/bulkhead boundary seen from pure top-down)
        // Dark steel / black void cap
        ctx.fillStyle = '#121624';
        ctx.fillRect(wx, wy, cellSize, cellSize);

        // Inner cap plate
        ctx.fillStyle = '#1c2236';
        ctx.fillRect(wx + 2, wy + 2, cellSize - 4, cellSize - 4);

        // Connect seamlessly with adjacent wall caps
        if (n) ctx.fillRect(wx + 2, wy, cellSize - 4, 2);
        if (s) ctx.fillRect(wx + 2, wy + cellSize - 2, cellSize - 4, 2);
        if (w) ctx.fillRect(wx, wy + 2, 2, cellSize - 4);
        if (e) ctx.fillRect(wx + cellSize - 2, wy + 2, 2, cellSize - 4);

        // LAYER 2: SOUTHERN 2.5D WALL FACE (Vertical structural face looking into corridors)
        if (!s) {
          // Draw the vertical wall face with recessed panels & depth
          const faceH = Math.max(8, Math.floor(cellSize * 0.35));
          const faceY = wy + cellSize - faceH;

          // Vertical panel surface (deep charcoal/navy slate)
          ctx.fillStyle = '#0f1422';
          ctx.fillRect(wx, faceY, cellSize, faceH);

          // Wall face panel groove lines
          ctx.strokeStyle = '#080a12';
          ctx.lineWidth = 1;
          ctx.strokeRect(wx + 1, faceY + 1, cellSize - 2, faceH - 2);

          // Horizontal industrial pipes / conduit bundles along the wall base (prominent in reference image)
          const pipeY1 = faceY + faceH * 0.35;
          const pipeY2 = faceY + faceH * 0.7;

          // Primary pipe (copper / steel conduit)
          ctx.fillStyle = '#3a2d24';
          ctx.fillRect(wx, pipeY1, cellSize, 2.5);
          ctx.fillStyle = '#6b5443';
          ctx.fillRect(wx, pipeY1, cellSize, 1);

          // Secondary pipe (dark steel)
          ctx.fillStyle = '#1a2233';
          ctx.fillRect(wx, pipeY2, cellSize, 2);

          // Pipe brackets / wall mounts
          ctx.fillStyle = '#556688';
          ctx.fillRect(wx + 4, faceY + 2, 3, faceH - 4);
          ctx.fillRect(wx + cellSize - 7, faceY + 2, 3, faceH - 4);

          // Wall-mounted glowing computer terminals / monitors (like in reference image)
          if ((wall.x * 7 + wall.y * 11) % 5 === 2) {
            const screenW = Math.max(8, Math.floor(cellSize * 0.32));
            const screenH = Math.max(6, Math.floor(faceH * 0.75));
            const screenX = wx + cellSize / 2 - screenW / 2;
            const screenY = faceY + 2;

            // Monitor casing
            ctx.fillStyle = '#080b12';
            ctx.fillRect(screenX - 1, screenY - 1, screenW + 2, screenH + 2);

            // Glowing blue/cyan display screen
            const isMagentaScreen = (wall.x + wall.y) % 3 === 0;
            ctx.fillStyle = isMagentaScreen ? '#e056fd' : '#00f0ff';
            ctx.shadowColor = ctx.fillStyle;
            ctx.shadowBlur = 6;
            ctx.fillRect(screenX, screenY, screenW, screenH);

            // Scanlines / interface lines
            ctx.shadowBlur = 0;
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(screenX + 2, screenY + 2, screenW - 4, 1);
            ctx.fillRect(screenX + 2, screenY + 4, screenW - 6, 1);
          }

          // Deep ground contact shadow onto the floor below
          ctx.fillStyle = 'rgba(0, 0, 0, 0.55)';
          ctx.fillRect(wx, wy + cellSize, cellSize, Math.max(3, Math.floor(cellSize * 0.12)));
        }

        // LAYER 3: CORRIDOR EDGE CONDUIT FRAMING (Subtle steel bevels facing empty corridors)
        ctx.strokeStyle = '#2d3852';
        ctx.lineWidth = 1.5;
        if (!n) {
          ctx.beginPath();
          ctx.moveTo(wx, wy);
          ctx.lineTo(wx + cellSize, wy);
          ctx.stroke();
        }
        if (!w) {
          ctx.beginPath();
          ctx.moveTo(wx, wy);
          ctx.lineTo(wx, wy + cellSize);
          ctx.stroke();
        }
        if (!e) {
          ctx.beginPath();
          ctx.moveTo(wx + cellSize, wy);
          ctx.lineTo(wx + cellSize, wy + cellSize);
          ctx.stroke();
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
