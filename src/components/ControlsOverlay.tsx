import { ArrowUp, ArrowDown, ArrowLeft, ArrowRight, Circle, FastForward, Undo2 } from 'lucide-react';
import type { Direction } from '../types/game';

interface ControlsOverlayProps {
  onMove: (dir: Direction) => void;
  onEndLoop: () => void;
  onUndo: () => void;
  canEndLoop: boolean;
  canUndo: boolean;
}

export const ControlsOverlay: React.FC<ControlsOverlayProps> = ({
  onMove,
  onEndLoop,
  onUndo,
  canEndLoop,
  canUndo,
}) => {
  return (
    <div className="w-full flex flex-col md:flex-row items-center justify-between gap-3 text-slate-400 select-none font-pixel text-[9px]">
      {/* Desktop Keyboard Quick Guide */}
      <div className="hidden md:flex items-center gap-3.5 pixel-card-subtle px-4 py-2.5">
        <div className="flex items-center gap-1.5">
          <span className="text-slate-300">MOVE:</span>
          <span className="pixel-kbd px-1.5 py-0.5 text-[8px]">WASD</span>
          <span className="text-slate-600">/</span>
          <span className="pixel-kbd px-1.5 py-0.5 text-[8px]">ARROWS</span>
        </div>
        <span className="text-slate-700">|</span>
        <div className="flex items-center gap-1.5">
          <span className="text-slate-300">WAIT:</span>
          <span className="pixel-kbd px-1.5 py-0.5 text-[8px] text-slate-300">SPACE</span>
        </div>
        <span className="text-slate-700">|</span>
        <div className="flex items-center gap-1.5">
          <span className="text-slate-300">END LOOP:</span>
          <span className="pixel-kbd px-1.5 py-0.5 text-[8px] text-purple-300">ENTER</span>
        </div>
        <span className="text-slate-700">|</span>
        <div className="flex items-center gap-1.5">
          <span className="text-slate-300">UNDO:</span>
          <span className="pixel-kbd px-1.5 py-0.5 text-[8px] text-slate-300">Z</span>
        </div>
        <span className="text-slate-700">|</span>
        <div className="flex items-center gap-1.5">
          <span className="text-slate-300">RESTART:</span>
          <span className="pixel-kbd px-1.5 py-0.5 text-[8px] text-slate-300">R</span>
        </div>
        <span className="text-slate-700">|</span>
        <div className="flex items-center gap-1.5">
          <span className="text-slate-300">PREVIEW:</span>
          <span className="pixel-kbd px-1.5 py-0.5 text-[8px]">P</span>
        </div>
      </div>

      {/* On-screen / Mobile Touch D-Pad */}
      <div className="flex md:hidden items-center justify-center gap-6 w-full py-1">
        {/* Undo & End Loop touch buttons */}
        <div className="flex flex-col gap-2.5">
          <button
            onClick={onUndo}
            disabled={!canUndo}
            className={`w-12 h-12 flex items-center justify-center transition active:scale-95 cursor-pointer ${
              canUndo
                ? 'pixel-box-secondary text-slate-200'
                : 'bg-slate-900/40 text-slate-700 cursor-not-allowed opacity-40'
            }`}
          >
            <Undo2 size={18} />
          </button>
          <button
            onClick={onEndLoop}
            disabled={!canEndLoop}
            className={`w-12 h-12 flex items-center justify-center transition active:scale-95 cursor-pointer ${
              canEndLoop
                ? 'pixel-box-ghost text-purple-200'
                : 'bg-slate-900/40 text-slate-700 cursor-not-allowed opacity-40'
            }`}
          >
            <FastForward size={18} />
          </button>
        </div>

        {/* Directional Pad */}
        <div className="grid grid-cols-3 gap-2 w-36 h-36">
          <div />
          <button
            onClick={() => onMove('UP')}
            className="w-10 h-10 pixel-box-secondary flex items-center justify-center text-slate-200 hover:text-cyan-300 active:scale-95 transition cursor-pointer"
          >
            <ArrowUp size={16} />
          </button>
          <div />

          <button
            onClick={() => onMove('LEFT')}
            className="w-10 h-10 pixel-box-secondary flex items-center justify-center text-slate-200 hover:text-cyan-300 active:scale-95 transition cursor-pointer"
          >
            <ArrowLeft size={16} />
          </button>
          <button
            onClick={() => onMove('WAIT')}
            title="Wait"
            className="w-10 h-10 pixel-box-secondary flex items-center justify-center text-slate-400 hover:text-cyan-300 active:scale-95 transition cursor-pointer"
          >
            <Circle size={10} />
          </button>
          <button
            onClick={() => onMove('RIGHT')}
            className="w-10 h-10 pixel-box-secondary flex items-center justify-center text-slate-200 hover:text-cyan-300 active:scale-95 transition cursor-pointer"
          >
            <ArrowRight size={16} />
          </button>

          <div />
          <button
            onClick={() => onMove('DOWN')}
            className="w-10 h-10 pixel-box-secondary flex items-center justify-center text-slate-200 hover:text-cyan-300 active:scale-95 transition cursor-pointer"
          >
            <ArrowDown size={16} />
          </button>
          <div />
        </div>
      </div>
    </div>
  );
};
