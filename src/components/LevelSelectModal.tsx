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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-xl bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-2xl flex flex-col text-slate-200">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition cursor-pointer"
        >
          <X size={18} />
        </button>

        <div className="flex items-center gap-2 mb-1">
          <Sparkles size={16} className="text-violet-400" />
          <span className="text-xs uppercase font-bold tracking-widest text-violet-400">
            Shadow Matrix
          </span>
        </div>
        <h2 className="text-2xl font-black text-slate-100 tracking-tight">
          Select Shadow Chamber
        </h2>
        <p className="text-xs text-slate-400 mt-1 mb-5">
          Pick a shadow chamber to infiltrate. Progress is saved automatically.
        </p>

        {/* Level List Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
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
                className={`flex flex-col text-left p-4 rounded-xl border transition-all cursor-pointer ${
                  isCurrent
                    ? 'bg-violet-950/50 border-violet-500 shadow-md shadow-violet-950/50'
                    : 'bg-slate-950/60 border-slate-800 hover:border-slate-700 hover:bg-slate-800/40'
                }`}
              >
                <div className="flex items-center justify-between w-full mb-1">
                  <span
                    className={`text-xs font-mono font-bold px-2 py-0.5 rounded ${
                      isCurrent
                        ? 'bg-violet-500 text-slate-100'
                        : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    CHAMBER 0{lvl.id}
                  </span>
                  {isCompleted ? (
                    <div className="flex items-center gap-1 text-[11px] text-emerald-400 font-semibold">
                      <CheckCircle2 size={13} />
                      <span>Solved</span>
                    </div>
                  ) : (
                    <span className="text-[11px] text-slate-500">Unsolved</span>
                  )}
                </div>

                <h3 className="font-bold text-slate-100 text-sm mt-1">{lvl.title}</h3>
                <span className="text-xs text-slate-400 font-medium">{lvl.subtitle}</span>

                <div className="flex items-center gap-2 mt-3 text-[11px] text-slate-500">
                  <span className="px-1.5 py-0.5 bg-slate-900 rounded border border-slate-800">
                    Max Shadows: {lvl.maxGhosts}
                  </span>
                  <span className="px-1.5 py-0.5 bg-slate-900 rounded border border-slate-800">
                    Steps: {lvl.maxSteps}
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
