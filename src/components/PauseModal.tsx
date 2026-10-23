import { Play, RotateCcw, Grid, Volume2, VolumeX, HelpCircle } from 'lucide-react';
import type { GameState } from '../types/game';
import { getLevelDef } from '../engine/gameEngine';

interface PauseModalProps {
  state: GameState;
  onResume: () => void;
  onRestart: () => void;
  onLevelSelect: () => void;
  onHelp: () => void;
  isMuted: boolean;
  onToggleMute: () => void;
}

export const PauseModal: React.FC<PauseModalProps> = ({
  state,
  onResume,
  onRestart,
  onLevelSelect,
  onHelp,
  isMuted,
  onToggleMute,
}) => {
  const level = getLevelDef(state.levelIndex);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-sm bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-7 shadow-2xl flex flex-col items-center text-center text-slate-200">
        <span className="text-xs uppercase font-bold tracking-widest text-slate-400 mb-1">
          Timeline Paused
        </span>
        <h2 className="text-xl font-bold text-slate-100 tracking-tight mb-1">
          Level {level.id}: {level.title}
        </h2>
        <span className="text-xs text-slate-500 mb-6">
          Loop {state.currentLoop} • Step {state.currentStep} of {state.maxSteps}
        </span>

        {/* Menu Buttons */}
        <div className="w-full flex flex-col gap-2.5">
          <button
            onClick={onResume}
            className="w-full py-3 px-4 rounded-xl font-bold text-sm bg-cyan-500 hover:bg-cyan-400 text-slate-950 flex items-center justify-center gap-2 shadow-lg shadow-cyan-500/20 transition active:scale-[0.98] cursor-pointer"
          >
            <Play size={16} />
            <span>Resume</span>
          </button>

          <button
            onClick={onRestart}
            className="w-full py-2.5 px-4 rounded-xl font-semibold text-xs bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 flex items-center justify-center gap-2 transition cursor-pointer"
          >
            <RotateCcw size={14} />
            <span>Restart Level</span>
          </button>

          <button
            onClick={onLevelSelect}
            className="w-full py-2.5 px-4 rounded-xl font-semibold text-xs bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 flex items-center justify-center gap-2 transition cursor-pointer"
          >
            <Grid size={14} />
            <span>Select Level</span>
          </button>

          <button
            onClick={onHelp}
            className="w-full py-2.5 px-4 rounded-xl font-semibold text-xs bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 flex items-center justify-center gap-2 transition cursor-pointer"
          >
            <HelpCircle size={14} />
            <span>How to Play</span>
          </button>

          <button
            onClick={onToggleMute}
            className="w-full py-2.5 px-4 rounded-xl font-semibold text-xs bg-slate-800/80 hover:bg-slate-700 text-slate-300 border border-slate-700 flex items-center justify-center gap-2 transition cursor-pointer"
          >
            {isMuted ? <VolumeX size={14} /> : <Volume2 size={14} />}
            <span>{isMuted ? 'Unmute Audio' : 'Mute Audio'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
