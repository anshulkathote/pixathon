import { useEffect, useRef } from 'react';
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

      // 1. Draw subtle grid floor tiles
      for (let y = 0; y < level.height; y++) {
        for (let x = 0; x < level.width; x++) {
          const cx = offsetX + x * cellSize;
          const cy = offsetY + y * cellSize;
          const isWall = level.walls.some((w) => w.x === x && w.y === y);

          if (!isWall) {
            // Dark grid floor tile
            ctx.fillStyle = '#0b1120';
            ctx.fillRect(cx + 1, cy + 1, cellSize - 2, cellSize - 2);

            // Subtle inner grid border
            ctx.strokeStyle = 'rgba(30, 41, 59, 0.45)';
            ctx.lineWidth = 1;
            ctx.strokeRect(cx + 1.5, cy + 1.5, cellSize - 3, cellSize - 3);

            // Tech floor dot in center
            ctx.fillStyle = 'rgba(71, 85, 105, 0.35)';
            ctx.beginPath();
            ctx.arc(cx + cellSize / 2, cy + cellSize / 2, 1.5, 0, Math.PI * 2);
            ctx.fill();
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
          // Active glowing neon circuit
          ctx.strokeStyle = door.color;
          ctx.lineWidth = 2.5;
          ctx.shadowColor = door.color;
          ctx.shadowBlur = 8;
          ctx.stroke();

          // Flowing energy pulse
          const pulsePhase = (now * 0.003) % 1;
          const pulseX = tx + (dx - tx) * pulsePhase;
          const pulseY = ty + (dy - ty) * pulsePhase;
          ctx.fillStyle = '#ffffff';
          ctx.shadowColor = '#ffffff';
          ctx.shadowBlur = 10;
          ctx.beginPath();
          ctx.arc(pulseX, pulseY, 2.5, 0, Math.PI * 2);
          ctx.fill();
        } else {
          // Dormant circuit wire
          ctx.strokeStyle = 'rgba(100, 116, 139, 0.3)';
          ctx.lineWidth = 1.5;
          ctx.setLineDash([4, 4]);
          ctx.stroke();
        }
        ctx.restore();
      }

      // 3. Draw Pressure Plates (Mechanical, for Player OR Ghost)
      for (const plate of state.plates) {
        const cx = offsetX + plate.x * cellSize;
        const cy = offsetY + plate.y * cellSize;
        const isPressed = plate.isPressed;

        const pad = Math.floor(cellSize * 0.16);
        const pw = cellSize - pad * 2;
        const ph = cellSize - pad * 2;

        ctx.save();
        if (isPressed) {
          ctx.fillStyle = 'rgba(15, 23, 42, 0.9)';
          ctx.fillRect(cx + pad, cy + pad, pw, ph);

          ctx.strokeStyle = plate.color;
          ctx.lineWidth = 2.5;
          ctx.shadowColor = plate.color;
          ctx.shadowBlur = 12;
          ctx.strokeRect(cx + pad + 1, cy + pad + 1, pw - 2, ph - 2);

          ctx.fillStyle = plate.color;
          ctx.globalAlpha = 0.35 + Math.sin(now * 0.008) * 0.15;
          ctx.fillRect(cx + pad + 4, cy + pad + 4, pw - 8, ph - 8);

          ctx.globalAlpha = 1;
          ctx.fillStyle = '#ffffff';
          ctx.beginPath();
          ctx.arc(cx + cellSize / 2, cy + cellSize / 2, pw * 0.18, 0, Math.PI * 2);
          ctx.fill();
        } else {
          ctx.fillStyle = '#1e293b';
          ctx.fillRect(cx + pad, cy + pad, pw, ph);

          ctx.strokeStyle = 'rgba(148, 163, 184, 0.4)';
          ctx.lineWidth = 1.5;
          ctx.strokeRect(cx + pad, cy + pad, pw, ph);

          ctx.strokeStyle = plate.color;
          ctx.globalAlpha = 0.6;
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.arc(cx + cellSize / 2, cy + cellSize / 2, pw * 0.2, 0, Math.PI * 2);
          ctx.stroke();
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

      // 6. Draw Doors (Standard, Synchronized, or Key-Locked)
      for (const door of state.doors) {
        const cx = offsetX + door.x * cellSize;
        const cy = offsetY + door.y * cellSize;
        const isLocked = door.requiredKeyId || door.isLockedDoor;

        ctx.save();
        if (door.isOpen) {
          // Open Door: energy threshold pillars and floor glow
          ctx.fillStyle = 'rgba(15, 23, 42, 0.5)';
          ctx.fillRect(cx + 2, cy + 2, cellSize - 4, cellSize - 4);

          // Side emitter pillars
          ctx.fillStyle = door.color;
          ctx.shadowColor = door.color;
          ctx.shadowBlur = 8;
          ctx.fillRect(cx + 2, cy + 2, 4, cellSize - 4);
          ctx.fillRect(cx + cellSize - 6, cy + 2, 4, cellSize - 4);

          // Open glowing indicator
          ctx.strokeStyle = door.color;
          ctx.globalAlpha = 0.35 + Math.sin(now * 0.006) * 0.15;
          ctx.lineWidth = 1.5;
          ctx.setLineDash([2, 4]);
          ctx.strokeRect(cx + 8, cy + 4, cellSize - 16, cellSize - 8);
        } else {
          // Closed Door: solid barrier with pulsating energy laser grid
          ctx.fillStyle = '#0f172a';
          ctx.fillRect(cx + 2, cy + 2, cellSize - 4, cellSize - 4);

          // Strong border
          ctx.strokeStyle = door.color;
          ctx.lineWidth = 2.5;
          ctx.shadowColor = door.color;
          ctx.shadowBlur = 10;
          ctx.strokeRect(cx + 2, cy + 2, cellSize - 4, cellSize - 4);

          // Energy laser bars
          ctx.lineWidth = 2;
          ctx.shadowBlur = 6;
          const barCount = 3;
          for (let b = 1; b <= barCount; b++) {
            const by = cy + (cellSize * b) / (barCount + 1);
            ctx.beginPath();
            ctx.moveTo(cx + 6, by);
            ctx.lineTo(cx + cellSize - 6, by);
            ctx.stroke();
          }

          // Central icon (Lock glyph if locked door, else central node)
          if (isLocked) {
            ctx.fillStyle = '#facc15';
            ctx.fillRect(cx + cellSize / 2 - 5, cy + cellSize / 2 - 2, 10, 8);
            ctx.strokeStyle = '#facc15';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(cx + cellSize / 2, cy + cellSize / 2 - 2, 4, Math.PI, 0, false);
            ctx.stroke();
          } else {
            ctx.fillStyle = '#ffffff';
            ctx.beginPath();
            ctx.arc(cx + cellSize / 2, cy + cellSize / 2, 4, 0, Math.PI * 2);
            ctx.fill();
          }
        }
        ctx.restore();
      }

      // 7. Draw Key (if present and not collected)
      for (const key of state.keys) {
        if (!key.isCollected) {
          const kx = offsetX + key.x * cellSize + cellSize / 2;
          const floatOffset = Math.sin(now * 0.005) * 4;
          const ky = offsetY + key.y * cellSize + cellSize / 2 + floatOffset;

          ctx.save();
          ctx.shadowColor = key.color || '#facc15';
          ctx.shadowBlur = 14;

          // Key head ring
          ctx.strokeStyle = key.color || '#facc15';
          ctx.lineWidth = 3;
          ctx.beginPath();
          ctx.arc(kx, ky - 4, 7, 0, Math.PI * 2);
          ctx.stroke();

          // Key shaft
          ctx.beginPath();
          ctx.moveTo(kx, ky + 3);
          ctx.lineTo(kx, ky + 14);
          ctx.stroke();

          // Key teeth
          ctx.beginPath();
          ctx.moveTo(kx, ky + 10);
          ctx.lineTo(kx + 5, ky + 10);
          ctx.moveTo(kx, ky + 14);
          ctx.lineTo(kx + 5, ky + 14);
          ctx.stroke();

          ctx.restore();
        }
      }

      // 8. Draw Exit Portal
      const exitCx = offsetX + state.exit.x * cellSize + cellSize / 2;
      const exitCy = offsetY + state.exit.y * cellSize + cellSize / 2;
      ctx.save();

      if (state.exit.isUnlocked) {
        // Swirling unlocked quantum portal
        const rot = now * 0.002;
        ctx.shadowColor = '#10b981';
        ctx.shadowBlur = 18;

        // Outer rotating ring
        ctx.strokeStyle = '#10b981';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(exitCx, exitCy, cellSize * 0.36, 0, Math.PI * 2);
        ctx.stroke();

        // Inner vortex ring
        ctx.strokeStyle = '#34d399';
        ctx.lineWidth = 2;
        ctx.setLineDash([6, 4]);
        ctx.save();
        ctx.translate(exitCx, exitCy);
        ctx.rotate(rot);
        ctx.beginPath();
        ctx.arc(0, 0, cellSize * 0.24, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();

        // Center glowing rift
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(exitCx, exitCy, cellSize * 0.12, 0, Math.PI * 2);
        ctx.fill();
      } else {
        // Locked Exit: sealed cyber-door with padlock glyph
        ctx.fillStyle = 'rgba(30, 41, 59, 0.7)';
        ctx.fillRect(
          offsetX + state.exit.x * cellSize + 4,
          offsetY + state.exit.y * cellSize + 4,
          cellSize - 8,
          cellSize - 8
        );

        ctx.strokeStyle = '#ef4444';
        ctx.lineWidth = 2;
        ctx.shadowColor = '#ef4444';
        ctx.shadowBlur = 8;
        ctx.strokeRect(
          offsetX + state.exit.x * cellSize + 4,
          offsetY + state.exit.y * cellSize + 4,
          cellSize - 8,
          cellSize - 8
        );

        // Lock icon
        ctx.fillStyle = '#f87171';
        ctx.fillRect(exitCx - 6, exitCy, 12, 10);
        ctx.strokeStyle = '#f87171';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(exitCx, exitCy, 5, Math.PI, 0, false);
        ctx.stroke();
      }
      ctx.restore();

      // 9. Draw Walls
      for (const wall of level.walls) {
        const wx = offsetX + wall.x * cellSize;
        const wy = offsetY + wall.y * cellSize;

        ctx.save();
        ctx.fillStyle = '#0a1122';
        ctx.fillRect(wx, wy, cellSize, cellSize);

        ctx.fillStyle = '#111c34';
        ctx.fillRect(wx + 2, wy + 2, cellSize - 4, cellSize - 4);

        ctx.strokeStyle = '#1e293b';
        ctx.lineWidth = 1;
        ctx.strokeRect(wx + 2, wy + 2, cellSize - 4, cellSize - 4);
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

      // 13. Draw Ghosts (Translucent with distinct color & number badge)
      state.ghosts.forEach((ghost, gIdx) => {
        const gPos = animGhostPos.current[gIdx] || { x: 0, y: 0 };
        const gx = offsetX + gPos.x * cellSize + cellSize / 2;
        const gy = offsetY + gPos.y * cellSize + cellSize / 2;

        ctx.save();
        const ghostFloat = Math.sin(now * 0.005 + gIdx * 2) * 3;

        ctx.shadowColor = ghost.color;
        ctx.shadowBlur = 16;
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
        ctx.font = `bold ${Math.max(10, Math.floor(cellSize * 0.22))}px ui-sans-serif, sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.globalAlpha = 1;
        ctx.fillText(String(ghost.id), gx, gy + ghostFloat);

        ctx.restore();
      });

      // 14. Draw Current Player (Glowing Cyan Avatar)
      const px = offsetX + animPlayerPos.current.x * cellSize + cellSize / 2;
      const py = offsetY + animPlayerPos.current.y * cellSize + cellSize / 2;

      ctx.save();
      ctx.shadowColor = '#00f2fe';
      ctx.shadowBlur = 18;

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
