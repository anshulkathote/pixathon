import type { GameState } from '../types/game';
import { getLevelDef } from '../engine/gameEngine';

interface HUDProps {
  state: GameState;
  onUndo: () => void;
  onPause: () => void;
}

export const HUD: React.FC<HUDProps> = ({
  state,
  onUndo,
  onPause,
}) => {
  const level = getLevelDef(state.levelIndex);
  const movesLeft = Math.max(0, state.maxSteps - state.currentStep);
  const canRewind = state.playerHistory.length > 1;
  const isLowMoves = movesLeft <= Math.max(3, Math.floor(state.maxSteps * 0.2));

  // Compute energy gauge bars (4 discrete pips)
  const ratio = state.maxSteps > 0 ? movesLeft / state.maxSteps : 1;
  const activeBars = Math.min(4, Math.ceil(ratio * 4));

  return (
    <header className="w-full max-w-4xl mx-auto select-none font-mono-tech">
      {/* Sci-Fi Minimal Gameplay HUD Bar (from pixellab-assets/UI/UI_components Section 6) */}
      <div className="bg-[#0a1126]/95 border border-[#1b2b54] p-2.5 sm:px-5 sm:py-2 rounded-lg flex items-center justify-between shadow-2xl backdrop-blur">
        
        {/* 1. Left: Level Number Indicator */}
        <div className="flex items-center gap-2.5">
          <div className="flex items-center gap-2 bg-[#060b1a] px-3 py-1.5 rounded border border-[#1b2b52] shadow-inner">
            <span className="text-[9px] font-pixel text-slate-400 tracking-wider">LVL</span>
            <span className="text-xs sm:text-sm font-pixel text-cyan-400 font-bold tracking-widest">
              {String(level.id).padStart(2, '0')}
            </span>
          </div>
          <div className="hidden sm:flex flex-col text-[10px] leading-tight">
            <span className="text-slate-500 text-[8px] uppercase tracking-wider">SECTOR</span>
            <span className="text-slate-300 font-semibold uppercase truncate max-w-[120px]">
              {level.title}
            </span>
          </div>
        </div>

        {/* 2. Center: Moves Left Indicator */}
        <div className="flex items-center gap-2.5 sm:gap-3 bg-[#060b1a] px-3.5 sm:px-4 py-1.5 rounded border border-[#1b2b52] shadow-inner">
          <div className="flex flex-col items-center">
            <span className="text-[8px] font-pixel text-slate-400 tracking-widest">MOVES LEFT</span>
            <div className="flex items-baseline gap-1 mt-0.5">
              <span
                className={`text-sm sm:text-base font-pixel tracking-wider font-bold transition-colors ${
                  isLowMoves ? 'text-amber-400 animate-pulse' : 'text-teal-300'
                }`}
              >
                {String(movesLeft).padStart(2, '0')}
              </span>
              <span className="text-[8px] font-pixel text-slate-500">
                / {state.maxSteps}
              </span>
            </div>
          </div>

          {/* Mini visual fuel/energy gauge pips */}
          <div className="w-10 sm:w-12 h-2.5 bg-[#0e1730] border border-[#1b2b54] flex gap-0.5 p-0.5">
            {[0, 1, 2, 3].map((barIdx) => (
              <div
                key={barIdx}
                className={`flex-1 transition-colors ${
                  barIdx < activeBars
                    ? isLowMoves
                      ? 'bg-amber-400'
                      : 'bg-teal-400'
                    : 'bg-slate-800'
                }`}
              />
            ))}
          </div>
        </div>

        {/* 3. Right: Action Buttons (Rewind & Pause) */}
        <div className="flex items-center gap-2">
          {/* Rewind (Undo Move) Button */}
          <button
            onClick={onUndo}
            disabled={!canRewind}
            className={`pixel-btn-demo w-8 h-8 sm:w-9 sm:h-9 rounded flex items-center justify-center transition-all group select-none ${
              canRewind
                ? 'bg-[#0e1834] hover:bg-[#16254e] active:bg-[#080f24] border border-[#213564] hover:border-cyan-400 text-cyan-300 cursor-pointer shadow-[0_0_8px_rgba(0,240,255,0.15)]'
                : 'bg-[#0a0f20] border border-slate-800 text-slate-600 opacity-40 cursor-not-allowed'
            }`}
            title="Rewind Move (Undo / Z)"
            aria-label="Rewind Move"
          >
            {/* Retro Pixel Rewind Icon from UI_components Spec */}
            <svg
              className="w-4 h-4 pixel-crisp transition-transform group-hover:scale-110"
              viewBox="0 0 16 16"
              fill="currentColor"
            >
              <path d="M7 3 L2 8 L7 13 L7 9 L14 9 L14 7 L7 7 Z" />
              <rect x="2" y="3" width="2" height="10" />
            </svg>
          </button>

          {/* Pause Button */}
          <button
            onClick={onPause}
            className="pixel-btn-demo w-8 h-8 sm:w-9 sm:h-9 bg-[#0e1834] hover:bg-[#16254e] active:bg-[#080f24] border border-[#213564] hover:border-cyan-400 text-cyan-300 rounded flex items-center justify-center transition-all group cursor-pointer shadow-[0_0_8px_rgba(0,240,255,0.15)] select-none"
            title="Pause Game (Esc)"
            aria-label="Pause Game"
          >
            {/* Retro Pixel Pause Bars from UI_components Spec */}
            <svg
              className="w-4 h-4 pixel-crisp transition-transform group-hover:scale-110"
              viewBox="0 0 16 16"
              fill="currentColor"
            >
              <rect x="4" y="3" width="3" height="10" />
              <rect x="9" y="3" width="3" height="10" />
            </svg>
          </button>
        </div>

      </div>
    </header>
  );
};
