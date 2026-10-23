import type { GameState } from '../types/game';
import { getLevelDef } from '../engine/gameEngine';
import {
  RotateCcw,
  Undo2,
  Volume2,
  VolumeX,
  HelpCircle,
  FastForward,
  Eye,
  EyeOff,
  Key,
  Radio,
  Anchor,
  Play,
} from 'lucide-react';

interface HUDProps {
  state: GameState;
  showPathPreview: boolean;
  onTogglePathPreview: () => void;
  onEndLoop: () => void;
  onUndo: () => void;
  onRestart: () => void;
  onWait: () => void;
  onPause: () => void;
  onHelp: () => void;
  isMuted: boolean;
  onToggleMute: () => void;
}

export const HUD: React.FC<HUDProps> = ({
  state,
  showPathPreview,
  onTogglePathPreview,
  onEndLoop,
  onUndo,
  onRestart,
  onWait,
  onPause,
  onHelp,
  isMuted,
  onToggleMute,
}) => {
  const level = getLevelDef(state.levelIndex);
  const stepsRemaining = state.maxSteps - state.currentStep;
  const canEndLoop = state.ghosts.length < level.maxGhosts && !state.isWon;
  const canUndo = state.playerHistory.length > 1;

  // Determine dynamic objective string
  let objectiveText = '';
  const hasUncollectedKey = state.keys.some((k) => !k.isCollected);
  if (hasUncollectedKey) {
    objectiveText = 'RETRIEVE KEY TO UNLOCK GATE';
  } else if (state.doors.some((d) => !d.isOpen)) {
    objectiveText = 'COOPERATE ON PLATES TO OPEN GATES';
  } else if (state.exit.requiresKey && !state.exit.isUnlocked) {
    objectiveText = 'USE KEY TO UNLOCK EXIT';
  } else {
    objectiveText = 'PATH CLEAR — ENTER THE EXIT';
  }

  const stepPercentage = (state.currentStep / state.maxSteps) * 100;
  const isLowSteps = stepsRemaining <= 4;

  return (
    <div className="w-full flex flex-col gap-2.5 select-none font-pixel text-slate-200">
      {/* Top Header Card */}
      <div className="pixel-card px-4 py-3 flex flex-wrap items-center justify-between gap-3">
        {/* Level Title & Subtitle */}
        <div className="flex items-center gap-3">
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <span className="pixel-badge text-[9px] uppercase tracking-wider text-cyan-300 bg-cyan-950/80 px-2 py-1">
                CHAMBER 0{level.id}
              </span>
              <h1 className="text-xs sm:text-sm font-bold text-white tracking-tight">
                {level.title.toUpperCase()}
              </h1>
            </div>
            <p className="text-[9px] text-slate-400 hidden sm:block mt-1">
              {level.subtitle.toUpperCase()}
            </p>
          </div>
        </div>

        {/* Dynamic Objective Banner */}
        <div className="flex items-center gap-2 pixel-card-subtle px-3 py-2 text-[9px] max-w-md text-slate-300">
          <span className="w-2 h-2 bg-cyan-400 animate-pulse shrink-0" />
          <span className="truncate">{objectiveText}</span>
        </div>

        {/* Quick Utility Actions */}
        <div className="flex items-center gap-2">
          {/* Path Preview Toggle */}
          <button
            onClick={onTogglePathPreview}
            title={showPathPreview ? 'Hide Shadow Path Preview (P)' : 'Show Shadow Path Preview (P)'}
            className={`w-8 h-8 flex items-center justify-center cursor-pointer transition select-none ${
              showPathPreview
                ? 'pixel-btn-icon-active text-black'
                : 'pixel-btn-icon text-slate-400 hover:text-cyan-300'
            }`}
          >
            {showPathPreview ? <Eye size={14} /> : <EyeOff size={14} />}
          </button>

          <button
            onClick={onToggleMute}
            title={isMuted ? 'Unmute Audio' : 'Mute Audio'}
            className="pixel-btn-icon w-8 h-8 flex items-center justify-center text-slate-300 hover:text-cyan-300 cursor-pointer select-none"
          >
            {isMuted ? <VolumeX size={14} /> : <Volume2 size={14} />}
          </button>

          <button
            onClick={onHelp}
            title="How to Play"
            className="pixel-btn-icon w-8 h-8 flex items-center justify-center text-slate-300 hover:text-cyan-300 cursor-pointer select-none"
          >
            <HelpCircle size={14} />
          </button>

          <button
            onClick={onPause}
            title="Pause Menu (Esc)"
            className="pixel-box-secondary w-8 h-8 flex items-center justify-center cursor-pointer group select-none ml-1"
          >
            <svg className="w-3.5 h-3.5 fill-cyan-400 group-hover:fill-white transition-colors" viewBox="0 0 16 16">
              <path d="M4 3h3v10H4V3zm5 0h3v10H9V3z" />
            </svg>
          </button>
        </div>
      </div>

      {/* Primary Status & Telemetry Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        {/* Steps Remaining Card */}
        <div className="pixel-card p-3 flex flex-col justify-between">
          <div className="flex items-center justify-between text-[9px] text-slate-400">
            <span>STEPS LEFT</span>
            <span className={isLowSteps ? 'text-amber-400 font-bold animate-pulse' : 'text-slate-300'}>
              {state.currentStep}/{state.maxSteps}
            </span>
          </div>
          <div className="flex items-baseline gap-2 mt-1.5">
            <span
              className={`text-xl font-bold tracking-tight ${
                isLowSteps ? 'text-amber-400' : 'text-cyan-400'
              }`}
            >
              {stepsRemaining}
            </span>
            <span className="text-[8px] text-slate-500">REMAINING</span>
          </div>
          <div className="w-full h-2 pixel-progress-track mt-2 p-[1px]">
            <div
              className={`h-full pixel-progress-bar transition-all duration-200 ${
                isLowSteps ? 'bg-amber-400 text-amber-400' : 'bg-cyan-400 text-cyan-400'
              }`}
              style={{ width: `${Math.max(0, 100 - stepPercentage)}%` }}
            />
          </div>
        </div>

        {/* Current Loop / Timeline Card */}
        <div className="pixel-card p-3 flex flex-col justify-between">
          <span className="text-[9px] text-slate-400">SHADOW LOOP</span>
          <div className="flex items-baseline gap-2 mt-1.5">
            <span className="text-xl font-bold text-purple-400 tracking-tight">
              {state.currentLoop}
            </span>
            <span className="text-[8px] text-slate-500">OF {state.maxLoops}</span>
          </div>
          <div className="flex gap-1.5 mt-2">
            {Array.from({ length: state.maxLoops }).map((_, i) => (
              <div
                key={i}
                className={`h-2 flex-1 pixel-progress-track p-[1px]`}
              >
                <div
                  className={`h-full transition-colors ${
                    i < state.currentLoop
                      ? i === 0
                        ? 'bg-cyan-400'
                        : i === 1
                        ? 'bg-purple-400'
                        : 'bg-amber-400'
                      : 'bg-transparent'
                  }`}
                />
              </div>
            ))}
          </div>
        </div>

        {/* Key Inventory Card */}
        <div className="pixel-card p-3 flex flex-col justify-between">
          <span className="text-[9px] text-slate-400">INVENTORY KEYS</span>
          <div className="flex items-center gap-1.5 mt-1.5">
            {state.keys.length === 0 ? (
              <span className="text-[8px] text-slate-500">NONE REQUIRED</span>
            ) : (
              state.keys.map((key) => (
                <div
                  key={key.id}
                  className={`pixel-badge items-center gap-1.5 px-2 py-1 text-[8px] font-bold ${
                    key.isCollected
                      ? 'bg-amber-950/80 text-amber-300'
                      : 'bg-slate-950/60 text-slate-600'
                  }`}
                >
                  <Key size={10} className={key.isCollected ? 'text-amber-400 animate-pulse' : 'text-slate-600'} />
                  <span>{key.isCollected ? 'KEY READY' : 'KEY MISSING'}</span>
                </div>
              ))
            )}
          </div>
          <span className="text-[8px] text-slate-500 mt-2 truncate">
            {state.exit.requiresKey
              ? state.exit.isUnlocked
                ? 'EXIT UNLOCKED'
                : 'EXIT LOCKED'
              : 'DIRECT EXIT OPEN'}
          </span>
        </div>

        {/* Action Controls Bar */}
        <div className="pixel-card p-2 flex items-center justify-around gap-1.5">
          {/* End Loop Button */}
          <button
            onClick={onEndLoop}
            disabled={!canEndLoop}
            className={`flex-1 flex flex-col items-center justify-center py-2 px-1 text-[8px] transition select-none cursor-pointer ${
              canEndLoop
                ? 'pixel-box-ghost text-purple-200'
                : 'bg-slate-900/40 text-slate-600 opacity-40 cursor-not-allowed'
            }`}
            title="Record path and rewind to spawn shadow (Enter)"
          >
            <div className="flex items-center gap-1">
              <FastForward size={12} />
              <span className="font-bold">END LOOP</span>
            </div>
            <span className="text-[7px] text-purple-400/80 mt-0.5">[ENTER]</span>
          </button>

          {/* Wait Button */}
          <button
            onClick={onWait}
            disabled={state.gameStatus !== 'PLAYING'}
            className="pixel-box-secondary flex flex-col items-center justify-center py-2 px-2 text-[8px] text-slate-300 hover:text-cyan-300 cursor-pointer select-none"
            title="Pass turn in place (Space)"
          >
            <span className="font-bold">WAIT</span>
            <span className="text-[7px] text-slate-400 mt-0.5">[SPACE]</span>
          </button>

          {/* Undo Button */}
          <button
            onClick={onUndo}
            disabled={!canUndo}
            className={`flex flex-col items-center justify-center py-2 px-2 text-[8px] select-none ${
              canUndo
                ? 'pixel-box-secondary text-slate-300 hover:text-cyan-300 cursor-pointer'
                : 'bg-slate-900/40 text-slate-600 opacity-40 cursor-not-allowed'
            }`}
            title="Undo last move (Z)"
          >
            <Undo2 size={12} />
            <span className="text-[7px] text-slate-400 mt-0.5">[Z]</span>
          </button>

          {/* Restart Button */}
          <button
            onClick={onRestart}
            className="pixel-box-secondary flex flex-col items-center justify-center py-2 px-2 text-[8px] text-slate-300 hover:text-rose-400 cursor-pointer select-none"
            title="Restart Level completely (R)"
          >
            <RotateCcw size={12} />
            <span className="text-[7px] text-slate-400 mt-0.5">[R]</span>
          </button>
        </div>
      </div>

      {/* Ghost Timeline Bar */}
      {state.ghosts.length > 0 && (
        <div className="pixel-card-subtle px-3 py-2 flex flex-wrap items-center justify-between gap-3 text-[9px]">
          <div className="flex items-center gap-2 text-slate-400">
            <Radio size={12} className="text-purple-400 animate-pulse" />
            <span className="uppercase tracking-wider text-slate-400 font-bold">
              SHADOW TIMELINES:
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {state.ghosts.map((ghost) => {
              const totalMoves = ghost.path.length - 1;
              const isStationed = state.currentStep >= totalMoves;
              const curGhostStep = Math.min(state.currentStep, totalMoves);

              return (
                <div
                  key={ghost.id}
                  className="pixel-badge items-center gap-1.5 px-2 py-1 bg-slate-950/80 text-[8px]"
                  style={{ color: ghost.color }}
                >
                  <span
                    className="w-2 h-2"
                    style={{ backgroundColor: ghost.color }}
                  />
                  <span className="font-bold">
                    SHADOW {ghost.id}
                  </span>
                  <span className="text-slate-600">|</span>
                  <span className="text-slate-300">
                    MOVES: {totalMoves}
                  </span>
                  <span className="text-slate-600">|</span>
                  {isStationed ? (
                    <span className="flex items-center gap-1 text-emerald-400 font-bold">
                      <Anchor size={9} /> STATIONED
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 text-cyan-300 font-bold">
                      <Play size={8} className="fill-cyan-300" /> STEP {curGhostStep}/{totalMoves}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
