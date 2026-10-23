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
    <div className="relative min-h-screen w-full flex flex-col items-center justify-center p-6 bg-[#060913] text-slate-100 overflow-hidden select-none font-pixel">
      {/* Background radial atmosphere */}
      <div className="absolute w-[600px] h-[600px] bg-cyan-600/10 blur-[140px] pointer-events-none -top-40 -left-20" />
      <div className="absolute w-[500px] h-[500px] bg-purple-600/10 blur-[130px] pointer-events-none -bottom-30 -right-20" />

      {/* Decorative Grid Lines */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b15_1px,transparent_1px),linear-gradient(to_bottom,#1e293b15_1px,transparent_1px)] bg-[size:3rem_3rem] pointer-events-none" />

      {/* Main Brand Card */}
      <div className="relative z-10 w-full max-w-lg flex flex-col items-center text-center">
        {/* Pixel Badge Cyber Tag */}
        <div className="pixel-badge items-center gap-2 px-3 py-1.5 bg-violet-950/80 text-violet-300 text-[9px] uppercase tracking-widest mb-5 animate-pulse shadow-[0_0_12px_rgba(189,82,255,0.4)]">
          <Sparkles size={12} />
          <span>SHADOW CO-OP PUZZLE</span>
        </div>

        {/* Title */}
        <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-violet-400 via-cyan-200 to-purple-500 drop-shadow-[0_4px_0_#03060c] mb-3">
          SHADOW MAZE
        </h1>

        {/* Subtitle / Core Hook */}
        <p className="text-[10px] sm:text-xs text-slate-300 mt-2 max-w-md leading-relaxed">
          YOU ARE NOT PLAYING ALONE.{' '}
          <span className="text-violet-300 block sm:inline">
            YOU ARE COOPERATING WITH YOUR SHADOW.
          </span>
        </p>

        <p className="text-[8px] text-slate-400 mt-3 max-w-md leading-relaxed">
          RECORD PATH. REWIND LOOP. TRANSLUCENT SHADOWS REPLAY MOVEMENTS TO HOLD PLATES & UNLOCK THE SANCTUM.
        </p>

        {/* Hero Interactive Elements Preview */}
        <div className="flex items-center justify-center gap-4 my-7 pixel-card px-5 py-3.5">
          {/* Player Avatar */}
          <div className="flex flex-col items-center gap-1.5">
            <div className="w-8 h-8 pixel-card bg-cyan-950/80 flex items-center justify-center shadow-[0_0_8px_rgba(0,240,255,0.4)]">
              <div className="w-3.5 h-3.5 bg-cyan-400" />
            </div>
            <span className="text-[8px] text-cyan-300">YOU</span>
          </div>

          <span className="text-slate-600 font-bold">+</span>

          {/* Shadow 1 */}
          <div className="flex flex-col items-center gap-1.5">
            <div className="w-8 h-8 pixel-card bg-purple-950/80 flex items-center justify-center opacity-85 shadow-[0_0_8px_rgba(189,82,255,0.4)]">
              <span className="text-[10px] font-bold text-purple-200">1</span>
            </div>
            <span className="text-[8px] text-purple-300">SHADOW 1</span>
          </div>

          <span className="text-slate-600 font-bold">+</span>

          {/* Shadow 2 */}
          <div className="flex flex-col items-center gap-1.5">
            <div className="w-8 h-8 pixel-card bg-amber-950/80 flex items-center justify-center opacity-85 shadow-[0_0_8px_rgba(255,209,92,0.4)]">
              <span className="text-[10px] font-bold text-amber-200">2</span>
            </div>
            <span className="text-[8px] text-amber-300">SHADOW 2</span>
          </div>
        </div>

        {/* Buttons List */}
        <div className="w-full max-w-xs flex flex-col gap-3.5">
          <button
            onClick={onStartGame}
            className="pixel-box-cyan w-full py-3.5 px-6 text-xs text-black tracking-wider flex items-center justify-center gap-3 cursor-pointer group select-none"
          >
            <svg className="w-3.5 h-3.5 fill-black group-hover:scale-110 transition-transform" viewBox="0 0 16 16">
              <path d="M4 2v12l10-6L4 2z" />
            </svg>
            <span>START GAME</span>
            <span className="w-1.5 h-1.5 bg-black ml-1 animate-pulse" />
          </button>

          <button
            onClick={onOpenLevelSelect}
            className="pixel-box-secondary w-full py-3 px-5 text-[10px] text-cyan-300 tracking-wider flex items-center justify-center gap-2.5 cursor-pointer group select-none"
          >
            <Grid size={13} className="text-cyan-400 group-hover:scale-110 transition-transform" />
            <span>CHAMBERS ({completedLevels.length}/{LEVELS.length})</span>
          </button>

          <button
            onClick={onOpenTutorial}
            className="pixel-box-secondary w-full py-2.5 px-4 text-[10px] text-slate-300 flex items-center justify-center gap-2 cursor-pointer select-none hover:text-white"
          >
            <HelpCircle size={13} className="text-cyan-400" />
            <span>HOW TO PLAY</span>
          </button>
        </div>

        {/* Footer controls */}
        <div className="mt-8 flex items-center gap-4 text-[8px] text-slate-500">
          <button
            onClick={onToggleMute}
            className="flex items-center gap-1.5 hover:text-slate-300 transition cursor-pointer"
          >
            {isMuted ? <VolumeX size={12} /> : <Volume2 size={12} />}
            <span>{isMuted ? 'MUTED' : 'AUDIO ON'}</span>
          </button>
          <span>•</span>
          <span>KEYBOARD & TOUCH</span>
        </div>
      </div>
    </div>
  );
};
