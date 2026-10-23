import { Grid, HelpCircle, Volume2, VolumeX, Sparkles } from 'lucide-react';
import { LEVELS } from '../engine/levels';

interface MainMenuProps {
  onStartGame: () => void;
  onOpenLevelSelect: () => void;
  onOpenTutorial: () => void;
  isMuted: boolean;
  onToggleMute: () => void;
  completedLevels: number[];
}

export const MainMenu: React.FC<MainMenuProps> = ({
  onStartGame,
  onOpenLevelSelect,
  onOpenTutorial,
  isMuted,
  onToggleMute,
  completedLevels,
}) => {
  return (
    <div className="relative min-h-screen w-full flex flex-col items-center justify-center p-6 bg-[#060913] text-slate-100 overflow-hidden select-none">
      {/* Background radial atmosphere */}
      <div className="absolute w-[600px] h-[600px] rounded-full bg-cyan-600/10 blur-[140px] pointer-events-none -top-40 -left-20" />
      <div className="absolute w-[500px] h-[500px] rounded-full bg-purple-600/10 blur-[130px] pointer-events-none -bottom-30 -right-20" />

      {/* Decorative Grid Lines */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b15_1px,transparent_1px),linear-gradient(to_bottom,#1e293b15_1px,transparent_1px)] bg-[size:3rem_3rem] pointer-events-none" />

      {/* Main Brand Card */}
      <div className="relative z-10 w-full max-w-lg flex flex-col items-center text-center">
        {/* Animated Cyber Tag */}
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-950/70 border border-cyan-500/40 text-cyan-400 text-xs font-semibold tracking-widest uppercase mb-4 shadow-lg shadow-cyan-950/40 animate-pulse">
          <Sparkles size={13} />
          <span>Temporal Co-op Puzzle</span>
        </div>

        {/* Title */}
        <h1 className="text-5xl sm:text-6xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-sky-200 to-purple-400 drop-shadow-sm">
          ECHO MAZE
        </h1>

        {/* Subtitle / Core Hook */}
        <p className="text-base sm:text-lg text-slate-300 font-medium mt-3 max-w-md">
          You are not playing alone.{' '}
          <span className="text-cyan-400 font-semibold block sm:inline">
            You are cooperating with yourself.
          </span>
        </p>

        <p className="text-xs text-slate-400 mt-2 max-w-sm leading-relaxed">
          Record your path. Rewind the loop. Your translucent echoes replay your past movements to hold plates, bypass laser doors, and unlock the nexus.
        </p>

        {/* Hero Interactive Elements Preview */}
        <div className="flex items-center justify-center gap-5 my-8 bg-slate-900/60 backdrop-blur-md border border-slate-800/80 px-6 py-3.5 rounded-2xl shadow-xl">
          {/* Player Avatar */}
          <div className="flex flex-col items-center gap-1">
            <div className="w-9 h-9 rounded-full bg-cyan-500/20 border-2 border-cyan-400 flex items-center justify-center shadow-lg shadow-cyan-500/30">
              <div className="w-3.5 h-3.5 rounded-full bg-cyan-300" />
            </div>
            <span className="text-[11px] font-mono text-cyan-300">You (Now)</span>
          </div>

          <span className="text-slate-600 font-bold">+</span>

          {/* Echo 1 */}
          <div className="flex flex-col items-center gap-1">
            <div className="w-9 h-9 rounded-full bg-purple-500/20 border-2 border-purple-400 flex items-center justify-center shadow-lg shadow-purple-500/30 opacity-75">
              <span className="text-xs font-bold text-purple-200">1</span>
            </div>
            <span className="text-[11px] font-mono text-purple-300">Echo 1</span>
          </div>

          <span className="text-slate-600 font-bold">+</span>

          {/* Echo 2 */}
          <div className="flex flex-col items-center gap-1">
            <div className="w-9 h-9 rounded-full bg-amber-500/20 border-2 border-amber-400 flex items-center justify-center shadow-lg shadow-amber-500/30 opacity-75">
              <span className="text-xs font-bold text-amber-200">2</span>
            </div>
            <span className="text-[11px] font-mono text-amber-300">Echo 2</span>
          </div>
        </div>

        {/* Buttons List */}
        <div className="w-full max-w-xs flex flex-col gap-3.5">
          <button
            onClick={onStartGame}
            className="pixel-box-cyan w-full py-3.5 px-6 font-pixel text-xs text-black tracking-wider flex items-center justify-center gap-3 cursor-pointer group select-none"
          >
            <svg className="w-4 h-4 fill-black group-hover:scale-110 transition-transform" viewBox="0 0 16 16">
              <path d="M4 2v12l10-6L4 2z" />
            </svg>
            <span>START GAME</span>
            <span className="w-1.5 h-1.5 bg-black ml-1 animate-pulse" />
          </button>

          <button
            onClick={onOpenLevelSelect}
            className="pixel-box-secondary w-full py-3 px-5 font-pixel text-[11px] text-cyan-300 tracking-wider flex items-center justify-center gap-2.5 cursor-pointer group select-none"
          >
            <Grid size={14} className="text-cyan-400 group-hover:scale-110 transition-transform" />
            <span>CHAMBERS ({completedLevels.length}/{LEVELS.length})</span>
          </button>

          <button
            onClick={onOpenTutorial}
            className="pixel-box-secondary w-full py-2.5 px-4 font-mono-code text-xs text-slate-300 flex items-center justify-center gap-2 cursor-pointer select-none hover:text-white"
          >
            <HelpCircle size={14} className="text-cyan-400" />
            <span>HOW TO PLAY</span>
          </button>
        </div>

        {/* Footer controls */}
        <div className="mt-8 flex items-center gap-4 text-xs text-slate-500">
          <button
            onClick={onToggleMute}
            className="flex items-center gap-1.5 hover:text-slate-300 transition cursor-pointer"
          >
            {isMuted ? <VolumeX size={15} /> : <Volume2 size={15} />}
            <span>{isMuted ? 'Muted' : 'Audio On'}</span>
          </button>
          <span>•</span>
          <span>Keyboard & Touch Enabled</span>
        </div>
      </div>
    </div>
  );
};
