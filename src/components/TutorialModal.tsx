import { Sparkles, Play, Key, Clock, FastForward, X } from 'lucide-react';

interface TutorialModalProps {
  onClose: () => void;
  isFirstTime?: boolean;
}

export const TutorialModal: React.FC<TutorialModalProps> = ({ onClose, isFirstTime = false }) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-lg bg-slate-900 border border-violet-500/30 rounded-2xl p-6 sm:p-8 shadow-2xl shadow-violet-950/50 flex flex-col text-slate-200">
        {!isFirstTime && (
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition cursor-pointer"
          >
            <X size={18} />
          </button>
        )}

        {/* Title Badge */}
        <div className="flex items-center gap-2 mb-2">
          <span className="p-1.5 rounded-lg bg-violet-950 border border-violet-500/40 text-violet-400">
            <Sparkles size={16} />
          </span>
          <span className="text-xs uppercase font-bold tracking-widest text-violet-400">
            Shadow Realm Protocol
          </span>
        </div>

        <h2 className="text-2xl font-black text-slate-100 tracking-tight">
          How to Play Shadow Maze
        </h2>
        <p className="text-sm text-violet-300 font-medium italic mt-1">
          "You are not playing alone. You are cooperating with your shadow."
        </p>

        {/* Mechanic Cards */}
        <div className="flex flex-col gap-3 my-5 text-xs">
          {/* Card 1: Record */}
          <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-3 flex items-start gap-3">
            <div className="w-8 h-8 rounded-lg bg-purple-950 border border-purple-600/60 flex items-center justify-center text-purple-300 shrink-0 mt-0.5">
              <Clock size={16} />
            </div>
            <div>
              <span className="font-bold text-slate-200 text-sm block">1. Record Your Shadow Loop</span>
              <p className="text-slate-400 mt-0.5 leading-relaxed">
                Take steps across the maze. When you finish positioning yourself (e.g. standing on a plate), press{' '}
                <kbd className="px-1.5 py-0.5 bg-purple-950 border border-purple-800 rounded text-purple-300 font-mono text-[11px]">Enter</kbd> to{' '}
                <strong className="text-purple-300">End Loop</strong>.
              </p>
            </div>
          </div>

          {/* Card 2: Shadows replay */}
          <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-3 flex items-start gap-3">
            <div className="w-8 h-8 rounded-lg bg-violet-950 border border-violet-600/60 flex items-center justify-center text-violet-300 shrink-0 mt-0.5">
              <FastForward size={16} />
            </div>
            <div>
              <span className="font-bold text-slate-200 text-sm block">2. Shadows Replay Your Steps</span>
              <p className="text-slate-400 mt-0.5 leading-relaxed">
                The world rewinds, and your past self spawns as a translucent shadow. It will faithfully repeat your moves and remain standing on plates to keep doors open for you.
              </p>
            </div>
          </div>

          {/* Card 3: Plates, Doors, Keys */}
          <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-3 flex items-start gap-3">
            <div className="w-8 h-8 rounded-lg bg-amber-950 border border-amber-600/60 flex items-center justify-center text-amber-300 shrink-0 mt-0.5">
              <Key size={16} />
            </div>
            <div>
              <span className="font-bold text-slate-200 text-sm block">3. Plates, Keys & Locked Exits</span>
              <p className="text-slate-400 mt-0.5 leading-relaxed">
                Step on pressure plates to trigger doors. Retrieve collectible keys into your inventory to unlock sealed gates and exits.
              </p>
            </div>
          </div>

          {/* Card 4: Plan Ahead */}
          <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-3 flex items-start gap-3">
            <div className="w-8 h-8 rounded-lg bg-indigo-950 border border-indigo-500/60 flex items-center justify-center text-indigo-300 shrink-0 mt-0.5">
              <Sparkles size={16} />
            </div>
            <div>
              <span className="font-bold text-slate-200 text-sm block">4. Plan Ahead</span>
              <p className="text-slate-400 mt-0.5 leading-relaxed">
                You have a limited number of steps <strong className="text-cyan-300">and</strong> loops. Think before you move! Toggle{' '}
                <kbd className="px-1 py-0.5 bg-slate-800 rounded text-cyan-300 font-mono text-[10px]">P</kbd>{' '}
                to preview a shadow's recorded path, and use{' '}
                <kbd className="px-1 py-0.5 bg-slate-800 rounded text-slate-300 font-mono text-[10px]">Z</kbd>{' '}
                to undo your last move.
              </p>
            </div>
          </div>
        </div>

        {/* Quick controls review */}
        <div className="bg-slate-950 border border-slate-800 rounded-xl p-3 mb-5 flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-400 font-mono">
          <span><strong className="text-cyan-300">WASD / Arrows:</strong> Move</span>
          <span><strong className="text-purple-300">Enter:</strong> End Loop</span>
          <span><strong className="text-slate-200">Space:</strong> Wait</span>
          <span><strong className="text-slate-200">Z:</strong> Undo</span>
          <span><strong className="text-slate-200">R:</strong> Restart</span>
          <span><strong className="text-cyan-300">P:</strong> Path Preview</span>
        </div>

        {/* Confirm Button */}
        <button
          onClick={onClose}
          className="w-full py-3 px-4 rounded-xl font-bold text-sm bg-gradient-to-r from-violet-500 to-purple-600 hover:from-violet-400 hover:to-purple-500 text-slate-100 flex items-center justify-center gap-2 shadow-lg shadow-violet-500/25 transition active:scale-[0.98] cursor-pointer"
        >
          <Play size={16} />
          <span>{isFirstTime ? 'Initiate Shadow Protocol' : 'Resume Mission'}</span>
        </button>
      </div>
    </div>
  );
};
