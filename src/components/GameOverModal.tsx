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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-md bg-slate-900 border border-amber-500/40 rounded-2xl p-6 sm:p-8 shadow-2xl shadow-amber-950/50 flex flex-col items-center text-center">
        {/* Amber icon badge */}
        <div className="w-16 h-16 rounded-2xl bg-amber-950/80 border border-amber-500/50 flex items-center justify-center text-amber-400 mb-4 shadow-lg shadow-amber-900/40">
          <AlertTriangle size={32} />
        </div>

        {/* Heading */}
        <span className="text-xs uppercase font-bold tracking-widest text-amber-400 mb-1">
          Timeline Depleted
        </span>
        <h2 className="text-2xl font-black text-slate-100 tracking-tight">
          Step Limit Reached
        </h2>
        <p className="text-sm text-slate-400 mt-2">
          You consumed all {state.maxSteps} steps for this timeline without reaching the exit.
        </p>

        {/* Tactical Hint */}
        <div className="w-full my-5 bg-slate-950/80 border border-slate-800 rounded-xl p-3.5 text-left flex items-start gap-3">
          <HelpCircle size={18} className="text-cyan-400 shrink-0 mt-0.5" />
          <div className="flex flex-col text-xs">
            <span className="font-semibold text-slate-300">Tactical Hint:</span>
            <span className="text-slate-400 mt-0.5 leading-relaxed">{level.hint}</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="w-full flex flex-col gap-2.5">
          {canSpawnGhost ? (
            <button
              onClick={onEndLoop}
              className="w-full py-3 px-4 rounded-xl font-bold text-sm bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white flex items-center justify-center gap-2 shadow-lg shadow-purple-900/40 transition active:scale-[0.98] cursor-pointer"
            >
              <FastForward size={16} />
              <span>Record & Spawn Echo {state.ghosts.length + 1}</span>
            </button>
          ) : (
            <button
              onClick={onRetryLoop}
              className="w-full py-3 px-4 rounded-xl font-bold text-sm bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white flex items-center justify-center gap-2 shadow-lg shadow-cyan-900/40 transition active:scale-[0.98] cursor-pointer"
            >
              <RotateCcw size={16} />
              <span>Retry Current Loop</span>
            </button>
          )}

          <div className="flex items-center gap-2.5">
            <button
              onClick={onRestart}
              className="flex-1 py-2.5 px-3 rounded-xl font-semibold text-xs bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 flex items-center justify-center gap-1.5 transition cursor-pointer"
            >
              <RotateCcw size={14} />
              <span>Restart Level</span>
            </button>
            <button
              onClick={onLevelSelect}
              className="flex-1 py-2.5 px-3 rounded-xl font-semibold text-xs bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 flex items-center justify-center gap-1.5 transition cursor-pointer"
            >
              <ArrowLeft size={14} />
              <span>Level Select</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
