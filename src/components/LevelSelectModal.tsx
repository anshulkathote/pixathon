import { X, CheckCircle2, Sparkles } from 'lucide-react';
import { LEVELS } from '../engine/levels';

interface LevelSelectModalProps {
  currentLevel: number;
  completedLevels: number[];
  onSelectLevel: (levelId: number) => void;
  onClose: () => void;
}

export const LevelSelectModal: React.FC<LevelSelectModalProps> = ({
  currentLevel,
  completedLevels,
  onSelectLevel,
  onClose,
}) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-fade-in font-pixel select-none">
      <div className="pixel-modal relative w-full max-w-xl p-6 sm:p-7 flex flex-col text-slate-200">
        <button
          onClick={onClose}
          aria-label="Close Level Select"
          className="absolute top-3.5 right-3.5 pixel-box-secondary w-8 h-8 flex items-center justify-center cursor-pointer group select-none"
        >
          <X size={14} className="text-slate-400 group-hover:text-rose-400 transition-colors" />
        </button>

        <div className="flex items-center gap-2 mb-1.5">
          <div className="pixel-badge px-2 py-1 bg-violet-950/80 text-violet-300 text-[8px] uppercase tracking-wider">
            <Sparkles size={11} className="mr-1.5" />
            <span>SHADOW MATRIX</span>
          </div>
        </div>
        <h2 className="text-sm sm:text-base text-white tracking-tight mb-1">
          SELECT SHADOW CHAMBER
        </h2>
        <p className="text-[8px] text-slate-400 mb-4 leading-relaxed">
          PICK A SHADOW CHAMBER TO INFILTRATE. PROGRESS SAVES AUTOMATICALLY.
        </p>

        {/* Level List Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-2">
          {LEVELS.map((lvl) => {
            const isCompleted = completedLevels.includes(lvl.id);
            const isCurrent = currentLevel === lvl.id;

            return (
              <button
                key={lvl.id}
                onClick={() => {
                  onSelectLevel(lvl.id);
                  onClose();
                }}
                className={`flex flex-col text-left p-3.5 transition-all cursor-pointer ${
                  isCurrent
                    ? 'pixel-card border-violet-400 shadow-[0_0_12px_rgba(189,82,255,0.4)]'
                    : 'pixel-card-subtle hover:bg-slate-800/50'
                }`}
              >
                <div className="flex items-center justify-between w-full mb-1.5">
                  <span
                    className={`pixel-badge text-[8px] px-1.5 py-0.5 ${
                      isCurrent
                        ? 'bg-violet-500 text-black font-bold'
                        : 'bg-slate-900 text-slate-400'
                    }`}
                  >
                    CHAMBER 0{lvl.id}
                  </span>
                  {isCompleted ? (
                    <div className="flex items-center gap-1 text-[8px] text-emerald-400 font-bold">
                      <CheckCircle2 size={11} />
                      <span>SOLVED</span>
                    </div>
                  ) : (
                    <span className="text-[8px] text-slate-600">UNSOLVED</span>
                  )}
                </div>

                <h3 className="text-xs text-white mt-1">{lvl.title.toUpperCase()}</h3>
                <span className="text-[8px] text-slate-400 mt-0.5">{lvl.subtitle.toUpperCase()}</span>

                <div className="flex items-center gap-2 mt-3 text-[7px] text-slate-400">
                  <span className="pixel-badge px-1.5 py-0.5 bg-slate-950">
                    SHADOWS: {lvl.maxGhosts}
                  </span>
                  <span className="pixel-badge px-1.5 py-0.5 bg-slate-950">
                    STEPS: {lvl.maxSteps}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
