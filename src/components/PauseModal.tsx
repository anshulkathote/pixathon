import { Grid, Volume2, VolumeX, HelpCircle } from 'lucide-react';
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
      <div className="pixel-modal relative w-full max-w-sm p-6 sm:p-7 flex flex-col items-center text-center text-slate-200">
        {/* Top Close 'X' Button in top corner */}
        <div className="absolute top-3 right-3">
          <button
            onClick={onResume}
            aria-label="Close Pause Menu"
            className="pixel-box-secondary w-8 h-8 flex items-center justify-center cursor-pointer group select-none"
          >
            <svg className="w-3.5 h-3.5 fill-slate-400 group-hover:fill-rose-400 transition-colors" viewBox="0 0 16 16">
              <path d="M3 3h2v2H3V3zm2 2h2v2H5V5zm2 2h2v2H7V7zm2-2h2V3H9v2zm2 2h2V5h-2v2zm-4 2H5v2H3v2h2v-2h2V9zm2 0h2v2h2v2h-2v-2H9V9z" />
            </svg>
          </button>
        </div>

        <div className="inline-block px-2 py-0.5 bg-violet-950/50 border border-violet-800/60 text-violet-400 font-pixel text-[9px] mb-2 uppercase tracking-widest">
          SHADOW LOOP PAUSED
        </div>
        <h2 className="font-pixel text-base text-white tracking-wide mb-1">
          CHAMBER 0{level.id}
        </h2>
        <span className="font-mono-code text-xs text-slate-400 mb-6">
          Loop {state.currentLoop} • Step {state.currentStep}/{state.maxSteps}
        </span>

        {/* Menu Buttons */}
        <div className="w-full flex flex-col gap-3">
          {/* Resume Button */}
          <button
            onClick={onResume}
            className="pixel-box-cyan w-full py-3 px-4 font-pixel text-xs text-black tracking-wider flex items-center justify-center gap-2.5 cursor-pointer group select-none"
          >
            <svg className="w-3.5 h-3.5 fill-black group-hover:scale-110 transition-transform" viewBox="0 0 16 16">
              <path d="M2 3h3v10H2V3zm6 0v10l7-5-7-5z" />
            </svg>
            <span>RESUME LOOP</span>
          </button>

          {/* Restart Loop Button */}
          <button
            onClick={onRestart}
            className="pixel-box-ghost w-full py-2.5 px-4 font-pixel text-[11px] text-purple-200 tracking-wider flex items-center justify-center gap-2 cursor-pointer group select-none"
          >
            <svg className="w-3.5 h-3.5 fill-purple-300 group-hover:rotate-180 transition-transform duration-300" viewBox="0 0 16 16">
              <path d="M8 2v3L5 2 8 2zm3 2h2v4h-2V5H9V3h2v1zM3 8H1v5h5v-2H3V8zm10 0v3h-2v2h3v-5h-1zM5 11h6v2H5v-2z" />
            </svg>
            <span>RESTART LOOP</span>
          </button>

          {/* Select Chamber / Level */}
          <button
            onClick={onLevelSelect}
            className="pixel-box-secondary w-full py-2.5 px-4 font-mono-code text-xs text-cyan-300 flex items-center justify-center gap-2 cursor-pointer select-none hover:text-white"
          >
            <Grid size={14} className="text-cyan-400" />
            <span>SELECT CHAMBER</span>
          </button>

          {/* How to Play */}
          <button
            onClick={onHelp}
            className="pixel-box-secondary w-full py-2 px-4 font-mono-code text-xs text-slate-300 flex items-center justify-center gap-2 cursor-pointer select-none hover:text-white"
          >
            <HelpCircle size={14} className="text-cyan-400" />
            <span>HOW TO PLAY</span>
          </button>

          {/* Mute toggle */}
          <button
            onClick={onToggleMute}
            className="w-full py-2 text-[11px] font-mono-code text-slate-400 hover:text-slate-200 flex items-center justify-center gap-2 cursor-pointer transition-colors"
          >
            {isMuted ? <VolumeX size={13} /> : <Volume2 size={13} />}
            <span>{isMuted ? 'UNMUTE AUDIO' : 'MUTE AUDIO'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
