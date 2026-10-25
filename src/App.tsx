import { useState, useEffect, useCallback, useRef } from 'react';
import type { GameState, Direction } from './types/game';
import {
  createInitialState,
  applyMove,
  undoMove,
  endLoop,
  restartLevel,
  retryLoop,
  getLevelDef,
} from './engine/gameEngine';
import { LEVELS } from './engine/levels';
import { sound } from './engine/sound';
import { GameCanvas } from './components/GameCanvas';
import { HUD } from './components/HUD';
import { ControlsOverlay } from './components/ControlsOverlay';
import { VictoryModal } from './components/VictoryModal';
import { GameOverModal } from './components/GameOverModal';
import { TutorialModal } from './components/TutorialModal';
import { LevelSelectModal } from './components/LevelSelectModal';
import { PauseModal } from './components/PauseModal';
import { MainMenu } from './components/MainMenu';

export function App() {
  const [screen, setScreen] = useState<'MENU' | 'PLAYING'>('MENU');
  const [currentLevelId, setCurrentLevelId] = useState<number>(1);
  const [gameState, setGameState] = useState<GameState>(() => createInitialState(1));
  const [isRewinding, setIsRewinding] = useState<boolean>(false);
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [showTutorial, setShowTutorial] = useState<boolean>(false);
  const [showLevelSelect, setShowLevelSelect] = useState<boolean>(false);
  const [showPathPreview, setShowPathPreview] = useState<boolean>(true);
  const [isMuted, setIsMuted] = useState<boolean>(() => sound.isMuted());
  const [completedLevels, setCompletedLevels] = useState<number[]>(() => {
    try {
      const saved = localStorage.getItem('echo_maze_completed_levels');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Track previous mechanisms to trigger audio
  const prevDoorCountRef = useRef<number>(0);
  const prevPlateCountRef = useRef<number>(0);

  // Initialize level
  const loadLevel = useCallback((levelId: number) => {
    setCurrentLevelId(levelId);
    const newState = createInitialState(levelId);
    setGameState(newState);
    setIsRewinding(false);
    setIsPaused(false);
    prevDoorCountRef.current = newState.doors.filter((d) => d.isOpen).length;
    prevPlateCountRef.current = 0;
  }, []);

  // Handle Level Victory persistence
  useEffect(() => {
    if (gameState.isWon) {
      const levelId = gameState.levelIndex;
      setCompletedLevels((prev) => {
        if (prev.includes(levelId)) return prev;
        const updated = [...prev, levelId];
        try {
          localStorage.setItem('echo_maze_completed_levels', JSON.stringify(updated));
        } catch {
          // ignore
        }
        return updated;
      });
    }
  }, [gameState.isWon, gameState.levelIndex]);

  // Audio effects when doors open/close or key is collected
  useEffect(() => {
    const openDoorsCount = gameState.doors.filter((d) => d.isOpen).length;
    if (openDoorsCount > prevDoorCountRef.current) {
      sound.playDoor(true);
    } else if (openDoorsCount < prevDoorCountRef.current) {
      sound.playDoor(false);
    }
    prevDoorCountRef.current = openDoorsCount;
  }, [gameState.doors]);

  // Movement handler
  const handleMove = useCallback(
    (dir: Direction) => {
      if (screen !== 'PLAYING' || isPaused || isRewinding) return;

      const hadKeyBefore = gameState.keys.some((k) => k.isCollected);
      const { nextState, moved } = applyMove(gameState, dir);

      if (!moved) {
        sound.playBump();
        return;
      }

      // Check key pickup
      const hasKeyAfter = nextState.keys.some((k) => k.isCollected);
      if (!hadKeyBefore && hasKeyAfter) {
        sound.playKey();
      } else {
        sound.playMove();
      }

      setGameState(nextState);
    },
    [screen, isPaused, isRewinding, gameState]
  );

  // End Loop handler
  const handleEndLoop = useCallback(() => {
    if (screen !== 'PLAYING' || isPaused || isRewinding) return;
    const level = getLevelDef(gameState.levelIndex);
    if (gameState.ghosts.length >= level.maxGhosts || gameState.isWon) return;

    sound.playRewind();
    setIsRewinding(true);
  }, [screen, isPaused, isRewinding, gameState]);

  const handleRewindComplete = useCallback(() => {
    setIsRewinding(false);
    setGameState((prev) => endLoop(prev));
  }, []);

  // Undo handler
  const handleUndo = useCallback(() => {
    if (screen !== 'PLAYING' || isPaused || isRewinding) return;
    if (gameState.playerHistory.length <= 1) return;

    sound.playUndo();
    setGameState((prev) => undoMove(prev));
  }, [screen, isPaused, isRewinding, gameState.playerHistory.length]);

  // Restart level handler
  const handleRestart = useCallback(() => {
    sound.playRewind();
    setGameState(restartLevel(currentLevelId));
    setIsPaused(false);
  }, [currentLevelId]);

  // Retry loop handler
  const handleRetryLoop = useCallback(() => {
    sound.playRewind();
    setGameState((prev) => retryLoop(prev));
    setIsPaused(false);
  }, []);

  // Audio toggle
  const handleToggleMute = useCallback(() => {
    const nextMuted = sound.toggleMute();
    setIsMuted(nextMuted);
  }, []);

  // Next level handler
  const handleNextLevel = useCallback(() => {
    const nextId = currentLevelId + 1;
    if (LEVELS.some((l) => l.id === nextId)) {
      loadLevel(nextId);
    } else {
      setShowLevelSelect(true);
    }
  }, [currentLevelId, loadLevel]);

  // Keyboard controls listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't intercept inputs inside textfields if any exist
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName)) {
        return;
      }

      // Prevent scrolling for navigation keys
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' '].includes(e.key)) {
        e.preventDefault();
      }

      if (e.key === 'Escape') {
        if (showTutorial) {
          setShowTutorial(false);
          return;
        }
        if (showLevelSelect) {
          setShowLevelSelect(false);
          return;
        }
        if (screen === 'PLAYING') {
          setIsPaused((prev) => !prev);
        }
        return;
      }

      if (screen !== 'PLAYING' || isPaused || isRewinding) return;

      switch (e.key.toLowerCase()) {
        case 'w':
        case 'arrowup':
          handleMove('UP');
          break;
        case 's':
        case 'arrowdown':
          handleMove('DOWN');
          break;
        case 'a':
        case 'arrowleft':
          handleMove('LEFT');
          break;
        case 'd':
        case 'arrowright':
          handleMove('RIGHT');
          break;
        case ' ':
          handleMove('WAIT');
          break;
        case 'enter':
          handleEndLoop();
          break;
        case 'z':
          handleUndo();
          break;
        case 'r':
          handleRestart();
          break;
        case 'p':
          setShowPathPreview((prev) => !prev);
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    screen,
    isPaused,
    isRewinding,
    showTutorial,
    showLevelSelect,
    handleMove,
    handleEndLoop,
    handleUndo,
    handleRestart,
  ]);

  // Check if first-time tutorial should be shown when starting game
  const handleStartGame = () => {
    try {
      const seen = localStorage.getItem('echo_maze_tutorial_seen');
      if (!seen) {
        setShowTutorial(true);
        localStorage.setItem('echo_maze_tutorial_seen', 'true');
      }
    } catch {
      // ignore
    }
    loadLevel(1);
    setScreen('PLAYING');
  };

  const level = getLevelDef(currentLevelId);
  const hasNextLevel = LEVELS.some((l) => l.id === currentLevelId + 1);

  if (screen === 'MENU') {
    return (
      <main className="min-h-screen bg-[#060913]">
        <MainMenu
          onStartGame={handleStartGame}
          onOpenLevelSelect={() => setShowLevelSelect(true)}
          onOpenTutorial={() => setShowTutorial(true)}
          isMuted={isMuted}
          onToggleMute={handleToggleMute}
          completedLevels={completedLevels}
        />

        {showTutorial && (
          <TutorialModal onClose={() => setShowTutorial(false)} />
        )}

        {showLevelSelect && (
          <LevelSelectModal
            currentLevel={currentLevelId}
            completedLevels={completedLevels}
            onSelectLevel={(id) => {
              loadLevel(id);
              setScreen('PLAYING');
            }}
            onClose={() => setShowLevelSelect(false)}
          />
        )}
      </main>
    );
  }

  return (
    <main className="min-h-screen w-full bg-[#060913] text-slate-100 flex flex-col items-center justify-between p-2 sm:p-4 select-none overflow-x-hidden">
      {/* Container with optimized width for immersive display */}
      <div className="w-full max-w-5xl flex flex-col gap-2.5 flex-1">
        {/* Minimal Gameplay HUD (Showing ONLY Game Board, Level, Moves Left, Pause, Rewind) */}
        <HUD
          state={gameState}
          onUndo={handleUndo}
          onPause={() => setIsPaused(true)}
        />

        {/* Center Game Canvas Area - Expanded for rich spaceship environment */}
        <div className="relative w-full flex-1 min-h-[460px] sm:min-h-[560px] md:min-h-[620px] flex items-center justify-center my-1 pixel-card p-1 sm:p-2 bg-[#060913]/95">
          <GameCanvas
            state={gameState}
            isRewinding={isRewinding}
            showPathPreview={showPathPreview}
            onRewindComplete={handleRewindComplete}
          />
        </div>

        {/* Primary Gameplay Action: END LOOP / REWIND & SPAWN GHOST Button */}
        {(() => {
          const canEnd = gameState.ghosts.length < level.maxGhosts && !gameState.isWon && !isRewinding;
          const ghostNum = gameState.ghosts.length + 1;
          const ghostColor = gameState.ghosts.length === 0 ? '#bd52ff' : '#0df2c8';

          return (
            <div className="w-full flex items-center justify-center py-1">
              <button
                onClick={handleEndLoop}
                disabled={!canEnd}
                className={`w-full max-w-md py-2.5 sm:py-3 px-5 flex items-center justify-center gap-3 transition-all select-none font-pixel text-xs sm:text-sm tracking-wider cursor-pointer ${
                  canEnd
                    ? 'pixel-box-ghost text-purple-100 hover:text-white'
                    : 'bg-[#0a0f20] border border-slate-800 text-slate-600 opacity-40 cursor-not-allowed shadow-none'
                }`}
                title={canEnd ? 'End current recording loop & rewind to spawn ghost (Press Enter)' : 'Loop limit reached or game won'}
                aria-label="End Loop and Rewind"
              >
                {/* Retro Fast-Forward / Echo Icon */}
                <svg
                  className="w-4 h-4 sm:w-5 sm:h-5 pixel-crisp flex-shrink-0"
                  viewBox="0 0 16 16"
                  fill="currentColor"
                  style={{ color: canEnd ? ghostColor : '#64748b' }}
                >
                  <path d="M2 3 L8 8 L2 13 Z M8 3 L14 8 L8 13 Z" />
                </svg>

                <span className="truncate">
                  {isRewinding
                    ? 'REWINDING...'
                    : canEnd
                    ? `END LOOP (SPAWN GHOST #${ghostNum})`
                    : `LOOP LIMIT (${level.maxGhosts}/${level.maxGhosts})`}
                </span>

                <span className="hidden sm:inline-block pixel-kbd px-1.5 py-0.5 text-[8px] text-purple-300 font-mono-tech border border-purple-500/40 bg-purple-950/60 ml-1">
                  ENTER
                </span>
              </button>
            </div>
          );
        })()}

        {/* Mobile Touch Controls (D-pad & shortcuts) */}
        <div className="md:hidden">
          <ControlsOverlay
            onMove={handleMove}
            onEndLoop={handleEndLoop}
            onUndo={handleUndo}
            canEndLoop={gameState.ghosts.length < level.maxGhosts && !gameState.isWon}
            canUndo={gameState.playerHistory.length > 1}
          />
        </div>
      </div>

      {/* Modals */}
      {gameState.isWon && (
        <VictoryModal
          state={gameState}
          onNextLevel={handleNextLevel}
          onRestart={handleRestart}
          onLevelSelect={() => setShowLevelSelect(true)}
          hasNextLevel={hasNextLevel}
        />
      )}

      {!gameState.isWon && gameState.gameStatus === 'FAILED_STEPS' && (
        <GameOverModal
          state={gameState}
          onEndLoop={handleEndLoop}
          onRetryLoop={handleRetryLoop}
          onRestart={handleRestart}
          onLevelSelect={() => setShowLevelSelect(true)}
        />
      )}

      {isPaused && (
        <PauseModal
          state={gameState}
          onResume={() => setIsPaused(false)}
          onRestart={handleRestart}
          onLevelSelect={() => setShowLevelSelect(true)}
          onHelp={() => setShowTutorial(true)}
          isMuted={isMuted}
          onToggleMute={handleToggleMute}
        />
      )}

      {showTutorial && (
        <TutorialModal onClose={() => setShowTutorial(false)} />
      )}

      {showLevelSelect && (
        <LevelSelectModal
          currentLevel={currentLevelId}
          completedLevels={completedLevels}
          onSelectLevel={(id) => {
            loadLevel(id);
            setShowLevelSelect(false);
          }}
          onClose={() => setShowLevelSelect(false)}
        />
      )}
    </main>
  );
}

export default App;
