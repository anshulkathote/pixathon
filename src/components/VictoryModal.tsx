import { useEffect } from 'react';
import confetti from 'canvas-confetti';
import { Trophy, ArrowRight, RotateCcw, Grid, Sparkles } from 'lucide-react';
import type { GameState } from '../types/game';
import { getLevelDef } from '../engine/gameEngine';
import { sound } from '../engine/sound';

interface VictoryModalProps {
  state: GameState;
  onNextLevel: () => void;
  onRestart: () => void;
  onLevelSelect: () => void;
  hasNextLevel: boolean;
}

export const VictoryModal: React.FC<VictoryModalProps> = ({
  state,
  onNextLevel,
  onRestart,
  onLevelSelect,
  hasNextLevel,
}) => {
  const level = getLevelDef(state.levelIndex);

  useEffect(() => {
    sound.playWin();

    // Celebratory confetti burst
    const end = Date.now() + 1000;
    const colors = ['#00f2fe', '#c084fc', '#f59e0b', '#10b981', '#38bdf8'];

    const frame = () => {
      confetti({
        particleCount: 3,
        angle: 60,
        spread: 55,
        origin: { x: 0 },
        colors,
      });
      confetti({
        particleCount: 3,
        angle: 120,
        spread: 55,
        origin: { x: 1 },
        colors,
      });

      if (Date.now() < end) {
        requestAnimationFrame(frame);
      }
    };
    frame();
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-md bg-slate-900 border border-cyan-500/40 rounded-2xl p-6 sm:p-8 shadow-2xl shadow-cyan-950/60 flex flex-col items-center text-center">
        {/* Glow ambient circle */}
        <div className="absolute -top-12 w-24 h-24 rounded-full bg-cyan-500/20 blur-2xl pointer-events-none" />

        {/* Victory Icon */}
        <div className="w-16 h-16 rounded-2xl bg-cyan-950/80 border border-cyan-500/50 flex items-center justify-center text-cyan-400 mb-4 shadow-lg shadow-cyan-900/40">
          <Trophy size={32} className="animate-bounce" />
        </div>

        {/* Heading */}
        <span className="text-xs uppercase font-bold tracking-widest text-cyan-400 mb-1 flex items-center gap-1.5">
          <Sparkles size={13} /> Timeline Synchronized
        </span>
        <h2 className="text-2xl font-black text-slate-100 tracking-tight">
          {level.title} Completed!
        </h2>
        <p className="text-sm text-slate-400 mt-2 italic">
          "You are not playing alone. You cooperated with yourself."
        </p>

        {/* Run Stats */}
        <div className="w-full grid grid-cols-2 gap-3 my-6 bg-slate-950/70 border border-slate-800 rounded-xl p-4">
          <div className="flex flex-col items-center">
            <span className="text-xs text-slate-500 font-medium">Timelines Used</span>
            <span className="text-xl font-bold text-purple-400 mt-0.5">
              {state.currentLoop} / {state.maxLoops}
            </span>
          </div>
          <div className="flex flex-col items-center">
            <span className="text-xs text-slate-500 font-medium">Final Steps</span>
            <span className="text-xl font-bold text-cyan-400 mt-0.5">
              {state.currentStep} / {state.maxSteps}
            </span>
          </div>
        </div>

        {/* Actions */}
        <div className="w-full flex flex-col gap-2.5">
          {hasNextLevel ? (
            <button
              onClick={onNextLevel}
              className="w-full py-3 px-4 rounded-xl font-bold text-sm bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 flex items-center justify-center gap-2 shadow-lg shadow-cyan-500/25 transition active:scale-[0.98] cursor-pointer"
            >
              <span>Next Level</span>
              <ArrowRight size={16} />
            </button>
          ) : (
            <div className="py-2.5 px-4 rounded-xl font-bold text-xs bg-emerald-950/60 border border-emerald-800/80 text-emerald-300">
              🎉 Congratulations! All Master Timelines Solved!
            </div>
          )}

          <div className="flex items-center gap-2.5">
            <button
              onClick={onRestart}
              className="flex-1 py-2.5 px-3 rounded-xl font-semibold text-xs bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 flex items-center justify-center gap-1.5 transition cursor-pointer"
            >
              <RotateCcw size={14} />
              <span>Replay Level</span>
            </button>
            <button
              onClick={onLevelSelect}
              className="flex-1 py-2.5 px-3 rounded-xl font-semibold text-xs bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 flex items-center justify-center gap-1.5 transition cursor-pointer"
            >
              <Grid size={14} />
              <span>Level Select</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
