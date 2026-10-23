import { AlertTriangle, RotateCcw, FastForward, HelpCircle, ArrowLeft } from 'lucide-react';
import type { GameState } from '../types/game';
import { getLevelDef } from '../engine/gameEngine';

interface GameOverModalProps {
  state: GameState;
  onEndLoop: () => void;
  onRetryLoop: () => void;
  onRestart: () => void;
  onLevelSelect: () => void;
}

export const GameOverModal: React.FC<GameOverModalProps> = ({
  state,
  onEndLoop,
  onRetryLoop,
  onRestart,
  onLevelSelect,
}) => {
  const level = getLevelDef(state.levelIndex);
  const canSpawnGhost = state.ghosts.length < level.maxGhosts;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-fade-in font-pixel select-none">
      <div className="pixel-modal relative w-full max-w-md p-6 sm:p-7 flex flex-col items-center text-center text-slate-200">
        {/* Violet icon badge */}
        <div className="w-12 h-12 pixel-card-subtle flex items-center justify-center text-violet-400 mb-4 shadow-[0_0_16px_rgba(189,82,255,0.35)]">
          <AlertTriangle size={24} />
        </div>

        {/* Heading */}
        <div className="pixel-badge px-2.5 py-1 bg-violet-950/80 text-violet-300 text-[9px] mb-2 uppercase tracking-widest">
          SHADOW LOOP DEPLETED
        </div>
        <h2 className="text-sm sm:text-base text-white tracking-tight mb-2">
          STEP LIMIT REACHED
        </h2>
        <p className="text-[9px] text-slate-400 leading-relaxed mb-4">
          CONSUMED ALL {state.maxSteps} STEPS FOR THIS LOOP WITHOUT REACHING EXIT.
        </p>

        {/* Tactical Hint */}
        <div className="w-full my-3 pixel-card-subtle p-3 text-left flex items-start gap-2.5">
          <HelpCircle size={14} className="text-cyan-400 shrink-0 mt-0.5" />
          <div className="flex flex-col text-[8px]">
            <span className="text-slate-300 font-bold mb-1">TACTICAL HINT:</span>
            <span className="text-slate-400 leading-relaxed uppercase">{level.hint}</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="w-full flex flex-col gap-3 mt-2">
          {canSpawnGhost ? (
            <button
              onClick={onEndLoop}
              className="pixel-box-cyan w-full py-3.5 px-4 text-xs text-black tracking-wider flex items-center justify-center gap-2 cursor-pointer select-none"
            >
              <FastForward size={14} />
              <span>SPAWN SHADOW {state.ghosts.length + 1}</span>
            </button>
          ) : (
            <button
              onClick={onRetryLoop}
              className="pixel-box-cyan w-full py-3.5 px-4 text-xs text-black tracking-wider flex items-center justify-center gap-2 cursor-pointer select-none"
            >
              <RotateCcw size={14} />
              <span>RETRY LOOP</span>
            </button>
          )}

          <div className="flex items-center gap-2.5">
            <button
              onClick={onRestart}
              className="pixel-box-secondary flex-1 py-2.5 px-2 text-[9px] text-slate-200 flex items-center justify-center gap-1.5 cursor-pointer select-none"
            >
              <RotateCcw size={12} />
              <span>RESTART</span>
            </button>
            <button
              onClick={onLevelSelect}
              className="pixel-box-secondary flex-1 py-2.5 px-2 text-[9px] text-slate-200 flex items-center justify-center gap-1.5 cursor-pointer select-none"
            >
              <ArrowLeft size={12} />
              <span>CHAMBERS</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
