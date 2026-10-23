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
    <div className="w-full flex flex-col md:flex-row items-center justify-between gap-3 text-slate-400 select-none">
      {/* Desktop Keyboard Quick Guide */}
      <div className="hidden md:flex items-center gap-3 text-xs bg-slate-900/60 backdrop-blur border border-slate-800/80 px-4 py-2 rounded-xl">
        <div className="flex items-center gap-1.5">
          <span className="font-semibold text-slate-300">Move:</span>
          <kbd className="px-1.5 py-0.5 bg-slate-800 border border-slate-700 rounded text-cyan-300 font-mono text-[11px]">WASD</kbd>
          <span className="text-slate-500">or</span>
          <kbd className="px-1.5 py-0.5 bg-slate-800 border border-slate-700 rounded text-cyan-300 font-mono text-[11px]">Arrows</kbd>
        </div>
        <span className="text-slate-700">|</span>
        <div className="flex items-center gap-1.5">
          <span className="font-semibold text-slate-300">Wait:</span>
          <kbd className="px-1.5 py-0.5 bg-slate-800 border border-slate-700 rounded text-slate-300 font-mono text-[11px]">Space</kbd>
        </div>
        <span className="text-slate-700">|</span>
        <div className="flex items-center gap-1.5">
          <span className="font-semibold text-slate-300">End Loop:</span>
          <kbd className="px-1.5 py-0.5 bg-purple-950/80 border border-purple-800/80 rounded text-purple-300 font-mono text-[11px]">Enter</kbd>
        </div>
        <span className="text-slate-700">|</span>
        <div className="flex items-center gap-1.5">
          <span className="font-semibold text-slate-300">Undo:</span>
          <kbd className="px-1.5 py-0.5 bg-slate-800 border border-slate-700 rounded text-slate-300 font-mono text-[11px]">Z</kbd>
        </div>
        <span className="text-slate-700">|</span>
        <div className="flex items-center gap-1.5">
          <span className="font-semibold text-slate-300">Restart:</span>
          <kbd className="px-1.5 py-0.5 bg-slate-800 border border-slate-700 rounded text-slate-300 font-mono text-[11px]">R</kbd>
        </div>
        <span className="text-slate-700">|</span>
        <div className="flex items-center gap-1.5">
          <span className="font-semibold text-slate-300">Preview:</span>
          <kbd className="px-1.5 py-0.5 bg-slate-800 border border-slate-700 rounded text-cyan-300 font-mono text-[11px]">P</kbd>
        </div>
      </div>

      {/* On-screen / Mobile Touch D-Pad */}
      <div className="flex md:hidden items-center justify-center gap-6 w-full py-1">
        {/* Undo & End Loop touch buttons */}
        <div className="flex flex-col gap-2">
          <button
            onClick={onUndo}
            disabled={!canUndo}
            className={`w-12 h-12 rounded-xl flex items-center justify-center border transition active:scale-95 cursor-pointer ${
              canUndo
                ? 'bg-slate-800 border-slate-700 text-slate-200'
                : 'bg-slate-900 border-slate-800 text-slate-600 opacity-50'
            }`}
          >
            <Undo2 size={20} />
          </button>
          <button
            onClick={onEndLoop}
            disabled={!canEndLoop}
            className={`w-12 h-12 rounded-xl flex items-center justify-center border transition active:scale-95 cursor-pointer ${
              canEndLoop
                ? 'bg-purple-900/80 border-purple-600 text-purple-200 shadow-lg shadow-purple-900/40'
                : 'bg-slate-900 border-slate-800 text-slate-600 opacity-50'
            }`}
          >
            <FastForward size={20} />
          </button>
        </div>

        {/* Directional Pad */}
        <div className="grid grid-cols-3 gap-1.5 w-36 h-36">
          <div />
          <button
            onClick={() => onMove('UP')}
            className="w-11 h-11 rounded-xl bg-slate-800/90 active:bg-cyan-600 active:scale-95 border border-slate-700 flex items-center justify-center text-slate-200 hover:text-cyan-300 shadow transition cursor-pointer"
          >
            <ArrowUp size={20} />
          </button>
          <div />

          <button
            onClick={() => onMove('LEFT')}
            className="w-11 h-11 rounded-xl bg-slate-800/90 active:bg-cyan-600 active:scale-95 border border-slate-700 flex items-center justify-center text-slate-200 hover:text-cyan-300 shadow transition cursor-pointer"
          >
            <ArrowLeft size={20} />
          </button>
          <button
            onClick={() => onMove('WAIT')}
            title="Wait"
            className="w-11 h-11 rounded-xl bg-slate-800/70 active:bg-slate-700 active:scale-95 border border-slate-700/80 flex items-center justify-center text-slate-400 hover:text-cyan-300 shadow transition cursor-pointer"
          >
            <Circle size={14} />
          </button>
          <button
            onClick={() => onMove('RIGHT')}
            className="w-11 h-11 rounded-xl bg-slate-800/90 active:bg-cyan-600 active:scale-95 border border-slate-700 flex items-center justify-center text-slate-200 hover:text-cyan-300 shadow transition cursor-pointer"
          >
            <ArrowRight size={20} />
          </button>

          <div />
          <button
            onClick={() => onMove('DOWN')}
            className="w-11 h-11 rounded-xl bg-slate-800/90 active:bg-cyan-600 active:scale-95 border border-slate-700 flex items-center justify-center text-slate-200 hover:text-cyan-300 shadow transition cursor-pointer"
          >
            <ArrowDown size={20} />
          </button>
          <div />
        </div>
      </div>
    </div>
  );
};
