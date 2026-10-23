import type { GameState } from '../types/game';
import { getLevelDef } from '../engine/gameEngine';
import {
  RotateCcw,
  Undo2,
  Volume2,
  VolumeX,
  Pause,
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
    objectiveText = 'Retrieve the Key to unlock the security door';
  } else if (state.doors.some((d) => !d.isOpen)) {
    objectiveText = 'Coordinate with your ghost on pressure plates to open gates';
  } else if (state.exit.requiresKey && !state.exit.isUnlocked) {
    objectiveText = 'Use your collected key to open the Exit';
  } else {
    objectiveText = 'The path is clear — reach the Exit portal!';
  }

  const stepPercentage = (state.currentStep / state.maxSteps) * 100;
  const isLowSteps = stepsRemaining <= 4;

  return (
    <div className="w-full flex flex-col gap-2.5 select-none">
      {/* Top Header Card */}
      <div className="bg-slate-900/90 backdrop-blur-md border border-slate-800 rounded-xl px-4 py-2.5 shadow-lg flex flex-wrap items-center justify-between gap-3">
        {/* Level Title & Subtitle */}
        <div className="flex items-center gap-3">
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-cyan-400 bg-cyan-950/60 border border-cyan-800/60 px-2 py-0.5 rounded-full font-mono">
                CHAMBER 0{level.id}
              </span>
              <h1 className="text-base sm:text-lg font-bold text-slate-100 tracking-tight">
                {level.title}
              </h1>
            </div>
            <p className="text-xs text-slate-400 hidden sm:block mt-0.5">
              {level.subtitle}
            </p>
          </div>
        </div>

        {/* Dynamic Objective Banner */}
        <div className="flex items-center gap-2 bg-slate-950/70 border border-slate-800/80 px-3 py-1.5 rounded-lg text-xs max-w-md text-slate-300">
          <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse shrink-0" />
          <span className="font-medium truncate">{objectiveText}</span>
        </div>

        {/* Quick Utility Actions */}
        <div className="flex items-center gap-1.5">
          {/* Path Preview Toggle */}
          <button
            onClick={onTogglePathPreview}
            title={showPathPreview ? 'Hide Ghost Path Preview (P)' : 'Show Ghost Path Preview (P)'}
            className={`p-2 rounded-lg transition border cursor-pointer ${
              showPathPreview
                ? 'bg-cyan-950/70 text-cyan-400 border-cyan-700/80 shadow-sm shadow-cyan-950/40'
                : 'bg-slate-800/80 text-slate-400 hover:text-slate-200 border-slate-700/60'
            }`}
          >
            {showPathPreview ? <Eye size={16} /> : <EyeOff size={16} />}
          </button>

          <button
            onClick={onToggleMute}
            title={isMuted ? 'Unmute Audio' : 'Mute Audio'}
            className="p-2 rounded-lg bg-slate-800/80 hover:bg-slate-700/80 text-slate-300 hover:text-cyan-400 transition border border-slate-700/60 cursor-pointer"
          >
            {isMuted ? <VolumeX size={16} /> : <Volume2 size={16} />}
          </button>
          <button
            onClick={onHelp}
            title="How to Play"
            className="p-2 rounded-lg bg-slate-800/80 hover:bg-slate-700/80 text-slate-300 hover:text-cyan-400 transition border border-slate-700/60 cursor-pointer"
          >
            <HelpCircle size={16} />
          </button>
          <button
            onClick={onPause}
            title="Pause Menu (Esc)"
            className="p-2 rounded-lg bg-slate-800/80 hover:bg-slate-700/80 text-slate-300 hover:text-cyan-400 transition border border-slate-700/60 cursor-pointer"
          >
            <Pause size={16} />
          </button>
        </div>
      </div>

      {/* Primary Status & Telemetry Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {/* Steps Remaining Card */}
        <div className="bg-slate-900/80 backdrop-blur border border-slate-800 rounded-xl p-3 flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs text-slate-400 font-medium">
            <span>Steps Left</span>
            <span className={isLowSteps ? 'text-amber-400 font-bold animate-pulse' : 'text-slate-300'}>
              {state.currentStep} / {state.maxSteps}
            </span>
          </div>
          <div className="flex items-baseline gap-2 mt-1">
            <span
              className={`text-2xl font-black tracking-tight ${
                isLowSteps ? 'text-amber-400' : 'text-cyan-400'
              }`}
            >
              {stepsRemaining}
            </span>
            <span className="text-xs text-slate-500">remaining</span>
          </div>
          <div className="w-full h-1.5 bg-slate-800 rounded-full mt-2 overflow-hidden">
            <div
              className={`h-full transition-all duration-300 ${
                isLowSteps ? 'bg-amber-500' : 'bg-cyan-400 shadow-sm shadow-cyan-400'
              }`}
              style={{ width: `${100 - stepPercentage}%` }}
            />
          </div>
        </div>

        {/* Current Loop / Timeline Card */}
        <div className="bg-slate-900/80 backdrop-blur border border-slate-800 rounded-xl p-3 flex flex-col justify-between">
          <span className="text-xs text-slate-400 font-medium">Timeline / Loop</span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-2xl font-black text-purple-400 tracking-tight">
              {state.currentLoop}
            </span>
            <span className="text-xs text-slate-500">of {state.maxLoops}</span>
          </div>
          <div className="flex gap-1.5 mt-2">
            {Array.from({ length: state.maxLoops }).map((_, i) => (
              <div
                key={i}
                className={`h-1.5 flex-1 rounded-full transition-colors ${
                  i < state.currentLoop
                    ? i === 0
                      ? 'bg-cyan-400 shadow-sm shadow-cyan-400'
                      : i === 1
                      ? 'bg-purple-400 shadow-sm shadow-purple-400'
                      : 'bg-amber-400 shadow-sm shadow-amber-400'
                    : 'bg-slate-800'
                }`}
              />
            ))}
          </div>
        </div>

        {/* Key Inventory Card */}
        <div className="bg-slate-900/80 backdrop-blur border border-slate-800 rounded-xl p-3 flex flex-col justify-between">
          <span className="text-xs text-slate-400 font-medium">Inventory Keys</span>
          <div className="flex items-center gap-2 mt-1">
            {state.keys.length === 0 ? (
              <span className="text-xs text-slate-500 italic">None required</span>
            ) : (
              state.keys.map((key) => (
                <div
                  key={key.id}
                  className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold border transition ${
                    key.isCollected
                      ? 'bg-amber-950/80 border-amber-500/80 text-amber-300 shadow-md shadow-amber-950/50'
                      : 'bg-slate-950/60 border-slate-800 text-slate-600'
                  }`}
                >
                  <Key size={13} className={key.isCollected ? 'text-amber-400 animate-pulse' : 'text-slate-600'} />
                  <span>{key.isCollected ? 'Carrying Key' : 'Key Unfound'}</span>
                </div>
              ))
            )}
          </div>
          <span className="text-[11px] text-slate-500 mt-2 truncate">
            {state.exit.requiresKey
              ? state.exit.isUnlocked
                ? 'Exit portal unlocked'
                : 'Exit portal sealed'
              : 'Direct exit available'}
          </span>
        </div>

        {/* Action Controls Bar */}
        <div className="bg-slate-900/80 backdrop-blur border border-slate-800 rounded-xl p-2 flex items-center justify-around gap-1.5">
          {/* End Loop Button */}
          <button
            onClick={onEndLoop}
            disabled={!canEndLoop}
            className={`flex-1 flex flex-col items-center justify-center py-1.5 px-2 rounded-lg font-medium text-xs transition border cursor-pointer ${
              canEndLoop
                ? 'bg-purple-950/60 hover:bg-purple-900/80 text-purple-300 border-purple-800/80 hover:border-purple-600 shadow-sm shadow-purple-900/30'
                : 'bg-slate-900 text-slate-600 border-slate-800 cursor-not-allowed opacity-50'
            }`}
            title="Record path and rewind timeline to spawn ghost (Enter)"
          >
            <div className="flex items-center gap-1">
              <FastForward size={14} />
              <span className="font-semibold">End Loop</span>
            </div>
            <span className="text-[10px] text-purple-400/80 mt-0.5">Enter</span>
          </button>

          {/* Wait Button */}
          <button
            onClick={onWait}
            disabled={state.gameStatus !== 'PLAYING'}
            className="flex flex-col items-center justify-center py-1.5 px-2 rounded-lg font-medium text-xs transition border bg-slate-800/80 hover:bg-slate-700/80 text-slate-300 hover:text-cyan-300 border-slate-700/60 cursor-pointer"
            title="Pass turn in place (Space)"
          >
            <span className="font-semibold">Wait</span>
            <span className="text-[10px] text-slate-400 mt-0.5">Space</span>
          </button>

          {/* Undo Button */}
          <button
            onClick={onUndo}
            disabled={!canUndo}
            className={`flex flex-col items-center justify-center py-1.5 px-2 rounded-lg font-medium text-xs transition border cursor-pointer ${
              canUndo
                ? 'bg-slate-800/80 hover:bg-slate-700/80 text-slate-300 hover:text-cyan-300 border-slate-700/60'
                : 'bg-slate-900 text-slate-600 border-slate-800 cursor-not-allowed opacity-50'
            }`}
            title="Undo last move (Z)"
          >
            <Undo2 size={14} />
            <span className="text-[10px] text-slate-400 mt-0.5">Z</span>
          </button>

          {/* Restart Button */}
          <button
            onClick={onRestart}
            className="flex flex-col items-center justify-center py-1.5 px-2 rounded-lg font-medium text-xs transition border bg-slate-800/80 hover:bg-slate-700/80 text-slate-300 hover:text-rose-400 border-slate-700/60 cursor-pointer"
            title="Restart Level completely (R)"
          >
            <RotateCcw size={14} />
            <span className="text-[10px] text-slate-400 mt-0.5">R</span>
          </button>
        </div>
      </div>

      {/* Ghost Timeline Bar - Showing recorded movement count, identity, and live status */}
      {state.ghosts.length > 0 && (
        <div className="bg-slate-900/70 border border-slate-800 rounded-xl px-3 py-2 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 text-slate-400 font-medium">
            <Radio size={14} className="text-purple-400 animate-pulse" />
            <span className="text-[11px] uppercase tracking-wider text-slate-400 font-semibold">
              Echo Timelines:
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {state.ghosts.map((ghost) => {
              const totalMoves = ghost.path.length - 1;
              const isStationed = state.currentStep >= totalMoves;
              const curGhostStep = Math.min(state.currentStep, totalMoves);

              return (
                <div
                  key={ghost.id}
                  className="flex items-center gap-2 bg-slate-950/80 border rounded-lg px-2.5 py-1"
                  style={{ borderColor: `${ghost.color}66` }}
                >
                  <span
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: ghost.color }}
                  />
                  <span className="font-bold" style={{ color: ghost.color }}>
                    Echo {ghost.id}
                  </span>
                  <span className="text-slate-500">|</span>
                  <span className="text-slate-300 font-mono text-[11px]">
                    Recorded: {totalMoves} moves
                  </span>
                  <span className="text-slate-500">|</span>
                  {isStationed ? (
                    <span className="flex items-center gap-1 text-emerald-400 text-[11px] font-semibold">
                      <Anchor size={11} /> Stationed
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 text-cyan-300 text-[11px] font-semibold">
                      <Play size={10} className="fill-cyan-300" /> Step {curGhostStep}/{totalMoves}
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
