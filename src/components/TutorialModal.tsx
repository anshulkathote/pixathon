import { Sparkles, Play, Key, Clock, FastForward, X } from 'lucide-react';

interface TutorialModalProps {
  onClose: () => void;
  isFirstTime?: boolean;
}

export const TutorialModal: React.FC<TutorialModalProps> = ({ onClose, isFirstTime = false }) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-fade-in font-pixel select-none">
      <div className="pixel-modal relative w-full max-w-lg p-6 sm:p-7 flex flex-col text-slate-200">
        {!isFirstTime && (
          <button
            onClick={onClose}
            aria-label="Close Help"
            className="absolute top-3.5 right-3.5 pixel-box-secondary w-8 h-8 flex items-center justify-center cursor-pointer group select-none"
          >
            <X size={14} className="text-slate-400 group-hover:text-rose-400 transition-colors" />
          </button>
        )}

        {/* Title Badge */}
        <div className="flex items-center gap-2 mb-2">
          <div className="pixel-badge px-2 py-1 bg-violet-950/80 text-violet-300 text-[8px] uppercase tracking-wider">
            <Sparkles size={11} className="mr-1.5" />
            <span>SHADOW REALM PROTOCOL</span>
          </div>
        </div>

        <h2 className="text-sm sm:text-base text-white tracking-tight mb-1">
          HOW TO PLAY SHADOW MAZE
        </h2>
        <p className="text-[8px] text-violet-300/80 leading-relaxed mb-4">
          "YOU ARE NOT PLAYING ALONE. YOU ARE COOPERATING WITH YOUR SHADOW."
        </p>

        {/* Mechanic Cards */}
        <div className="flex flex-col gap-2.5 my-2 text-[8px]">
          {/* Card 1: Record */}
          <div className="pixel-card-subtle p-2.5 flex items-start gap-2.5">
            <div className="w-7 h-7 pixel-card flex items-center justify-center text-purple-300 shrink-0 mt-0.5">
              <Clock size={12} />
            </div>
            <div>
              <span className="text-slate-200 font-bold block mb-1">1. RECORD SHADOW LOOP</span>
              <p className="text-slate-400 leading-relaxed">
                Take steps across maze. Stand on pressure plate and press{' '}
                <span className="pixel-kbd px-1 py-0.5 text-[7px] text-purple-300">ENTER</span> to{' '}
                <strong className="text-purple-300">END LOOP</strong>.
              </p>
            </div>
          </div>

          {/* Card 2: Shadows replay */}
          <div className="pixel-card-subtle p-2.5 flex items-start gap-2.5">
            <div className="w-7 h-7 pixel-card flex items-center justify-center text-violet-300 shrink-0 mt-0.5">
              <FastForward size={12} />
            </div>
            <div>
              <span className="text-slate-200 font-bold block mb-1">2. SHADOW REPLAYS STEPS</span>
              <p className="text-slate-400 leading-relaxed">
                World rewinds. Past self spawns as shadow, repeating your moves to hold plates and open gates.
              </p>
            </div>
          </div>

          {/* Card 3: Plates, Doors, Keys */}
          <div className="pixel-card-subtle p-2.5 flex items-start gap-2.5">
            <div className="w-7 h-7 pixel-card flex items-center justify-center text-amber-300 shrink-0 mt-0.5">
              <Key size={12} />
            </div>
            <div>
              <span className="text-slate-200 font-bold block mb-1">3. PLATES, KEYS & GATES</span>
              <p className="text-slate-400 leading-relaxed">
                Step on plates to open doors. Grab keys into inventory to unlock sealed exits.
              </p>
            </div>
          </div>

          {/* Card 4: Plan Ahead */}
          <div className="pixel-card-subtle p-2.5 flex items-start gap-2.5">
            <div className="w-7 h-7 pixel-card flex items-center justify-center text-cyan-300 shrink-0 mt-0.5">
              <Sparkles size={12} />
            </div>
            <div>
              <span className="text-slate-200 font-bold block mb-1">4. TACTICAL LIMITS</span>
              <p className="text-slate-400 leading-relaxed">
                Limited steps & loops. Press <span className="pixel-kbd px-1 py-0.5 text-[7px]">P</span> for path preview, <span className="pixel-kbd px-1 py-0.5 text-[7px] text-slate-300">Z</span> to undo.
              </p>
            </div>
          </div>
        </div>

        {/* Quick controls review */}
        <div className="pixel-card-subtle p-2.5 my-3 flex flex-wrap items-center justify-between gap-2 text-[7px] text-slate-400">
          <span><strong className="text-cyan-300">WASD:</strong> MOVE</span>
          <span><strong className="text-purple-300">ENTER:</strong> END LOOP</span>
          <span><strong className="text-slate-200">SPACE:</strong> WAIT</span>
          <span><strong className="text-slate-200">Z:</strong> UNDO</span>
          <span><strong className="text-slate-200">R:</strong> RESTART</span>
          <span><strong className="text-cyan-300">P:</strong> PREVIEW</span>
        </div>

        {/* Confirm Button */}
        <button
          onClick={onClose}
          className="pixel-box-cyan w-full py-3 px-4 text-xs text-black tracking-wider flex items-center justify-center gap-2 cursor-pointer select-none"
        >
          <Play size={12} className="fill-black" />
          <span>{isFirstTime ? 'START MISSION' : 'RESUME MISSION'}</span>
        </button>
      </div>
    </div>
  );
};
