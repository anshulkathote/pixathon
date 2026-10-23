import { useEffect } from 'react';
import confetti from 'canvas-confetti';
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-fade-in">
      <div className="pixel-modal relative w-full max-w-md p-6 sm:p-7 flex flex-col items-center text-center text-slate-200">
        {/* Top Close 'X' Button */}
        <div className="absolute top-3.5 right-3.5">
          <button
            onClick={onLevelSelect}
            aria-label="Back to Chamber Select"
            className="pixel-box-secondary w-8 h-8 flex items-center justify-center cursor-pointer group select-none"
          >
            <svg className="w-3.5 h-3.5 fill-slate-400 group-hover:fill-rose-400 transition-colors" viewBox="0 0 16 16">
              <path d="M3 3h2v2H3V3zm2 2h2v2H5V5zm2 2h2v2H7V7zm2-2h2V3H9v2zm2 2h2V5h-2v2zm-4 2H5v2H3v2h2v-2h2V9zm2 0h2v2h2v2h-2v-2H9V9z" />
            </svg>
          </button>
        </div>

        {/* Victory Trophy Badge */}
        <div className="mx-auto mb-3.5 w-12 h-12 bg-[#172238] border-2 border-[#2b3a60] flex items-center justify-center shadow-[0_0_16px_rgba(255,209,92,0.35)]">
          <svg className="w-7 h-7 fill-amber-300" viewBox="0 0 16 16">
            <path d="M3 2h10v2h-1v4h-1v2H9v2h2v2H5v-2h2v-2H5V8H4V4H3V2zm-1 2h1v3h1V4H3v3h1v1H2V4zm11 0h1v4h-2V7h1V4z" />
          </svg>
        </div>

        {/* Header Titles */}
        <div className="inline-block px-2.5 py-1 bg-amber-950/40 border border-amber-600/40 text-[#ffd15c] font-pixel text-[9px] mb-2 tracking-widest uppercase">
          PARADOX RESOLVED
        </div>
        <h3 className="font-pixel text-lg text-white tracking-wide mb-1">
          LEVEL COMPLETED!
        </h3>
        <p className="font-mono-code text-xs text-violet-300/80 mb-4">
          Shadow unified in Chamber 0{level.id} (<span className="text-amber-300">{state.currentLoop} Loop{state.currentLoop > 1 ? 's' : ''}</span>)
        </p>

        {/* Stars Rating Display */}
        <div className="flex items-center justify-center gap-3 py-2 px-4 bg-[#0a0f1d] border border-slate-800/80 mb-5 w-full">
          <svg className="w-5 h-5 fill-[#ffd15c] drop-shadow-[0_0_4px_#ffd15c]" viewBox="0 0 16 16">
            <path d="M7 1h2v3h2v2h3v2h-2v2h1v3h-3v-2H8v2H5v-3h1v-2H4V6h3V4h-1V1h1z" />
          </svg>
          <svg className="w-5 h-5 fill-[#ffd15c] drop-shadow-[0_0_4px_#ffd15c]" viewBox="0 0 16 16">
            <path d="M7 1h2v3h2v2h3v2h-2v2h1v3h-3v-2H8v2H5v-3h1v-2H4V6h3V4h-1V1h1z" />
          </svg>
          <svg
            className={`w-5 h-5 ${
              state.currentLoop <= 2
                ? 'fill-[#ffd15c] drop-shadow-[0_0_4px_#ffd15c]'
                : 'fill-slate-700'
            }`}
            viewBox="0 0 16 16"
          >
            <path d="M7 1h2v3h2v2h3v2h-2v2h1v3h-3v-2H8v2H5v-3h1v-2H4V6h3V4h-1V1h1z" />
          </svg>
          <span className="text-[10px] font-pixel text-slate-400 ml-2">
            {state.currentLoop <= 2 ? '3 / 3' : '2 / 3'} STARS
          </span>
        </div>

        {/* Actions Group */}
        <div className="w-full flex flex-col gap-3">
          {hasNextLevel ? (
            <button
              onClick={onNextLevel}
              className="pixel-box-cyan w-full py-3.5 text-black font-pixel text-xs tracking-wider flex items-center justify-center gap-2.5 cursor-pointer group select-none"
            >
              <span>NEXT LEVEL</span>
              <svg className="w-3.5 h-3.5 fill-black group-hover:translate-x-1 transition-transform" viewBox="0 0 16 16">
                <path d="M6 3h2v2h2v2h2v2h-2v2H8v2H6v-2h2V9H2V7h6V5H6V3z" />
              </svg>
            </button>
          ) : (
            <div className="py-3 px-4 bg-emerald-950/60 border border-emerald-800/80 text-emerald-300 font-pixel text-xs">
              🎉 ALL CHAMBERS UNLOCKED!
            </div>
          )}

          {/* Replay Level */}
          <button
            onClick={onRestart}
            className="pixel-box-secondary w-full py-3 text-slate-200 font-pixel text-[11px] tracking-wider flex items-center justify-center gap-2.5 cursor-pointer group select-none"
          >
            <svg className="w-3.5 h-3.5 fill-cyan-400 group-hover:rotate-180 transition-transform duration-300" viewBox="0 0 16 16">
              <path d="M8 2v3L5 2 8 2zm3 2h2v4h-2V5H9V3h2v1zM3 8H1v5h5v-2H3V8zm10 0v3h-2v2h3v-5h-1zM5 11h6v2H5v-2z" />
            </svg>
            <span>REPLAY LEVEL</span>
          </button>
        </div>

        {/* Micro Telemetry Details */}
        <div className="mt-4 pt-3 border-t border-slate-800/80 w-full flex items-center justify-between text-[10px] font-mono-code text-slate-500">
          <span>STEPS: {state.currentStep}/{state.maxSteps}</span>
          <span className="text-violet-400">PARADOX FREE</span>
        </div>
      </div>
    </div>
  );
};
