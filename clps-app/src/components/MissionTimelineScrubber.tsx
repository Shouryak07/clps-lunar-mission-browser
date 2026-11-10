import { useState, useEffect } from 'react';
import { Play, Pause, RotateCcw, FastForward, Rewind, Radio, Navigation, Gauge, Clock } from 'lucide-react';
import type { CLPSMission, TelemetryMilestone } from '../data/clpsMissions';

interface MissionTimelineScrubberProps {
  mission: CLPSMission;
  progress: number;
  onProgressChange: (newProgress: number) => void;
  isPlaying: boolean;
  onTogglePlay: () => void;
}

export default function MissionTimelineScrubber({
  mission,
  progress,
  onProgressChange,
  isPlaying,
  onTogglePlay,
}: MissionTimelineScrubberProps) {
  // Find closest milestone to current progress
  const currentMilestone: TelemetryMilestone = (() => {
    let best = mission.milestones[0];
    let minDiff = Infinity;
    for (const m of mission.milestones) {
      const diff = Math.abs(m.progress - progress);
      if (diff < minDiff) {
        minDiff = diff;
        best = m;
      }
    }
    return best;
  })();

  // Linear interpolation for velocity and distance between milestones
  const interpolatedTelemetry = (() => {
    const ms = mission.milestones;
    if (progress <= ms[0].progress) return ms[0];
    if (progress >= ms[ms.length - 1].progress) return ms[ms.length - 1];

    for (let i = 0; i < ms.length - 1; i++) {
      if (progress >= ms[i].progress && progress <= ms[i + 1].progress) {
        const span = ms[i + 1].progress - ms[i].progress;
        const alpha = span > 0 ? (progress - ms[i].progress) / span : 0;
        return {
          velocityKmS: ms[i].velocityKmS + (ms[i + 1].velocityKmS - ms[i].velocityKmS) * alpha,
          earthDistKm: Math.round(ms[i].earthDistKm + (ms[i + 1].earthDistKm - ms[i].earthDistKm) * alpha),
          moonDistKm: Math.round(ms[i].moonDistKm + (ms[i + 1].moonDistKm - ms[i].moonDistKm) * alpha),
          signalDelayMs: +(ms[i].signalDelayMs + (ms[i + 1].signalDelayMs - ms[i].signalDelayMs) * alpha).toFixed(1),
          met: currentMilestone.met,
          phase: currentMilestone.phase,
        };
      }
    }
    return ms[0];
  })();

  const jumpPrevMilestone = () => {
    const past = mission.milestones.filter((m) => m.progress < progress - 0.02);
    if (past.length > 0) {
      onProgressChange(past[past.length - 1].progress);
    } else {
      onProgressChange(0);
    }
  };

  const jumpNextMilestone = () => {
    const future = mission.milestones.filter((m) => m.progress > progress + 0.02);
    if (future.length > 0) {
      onProgressChange(future[0].progress);
    } else {
      onProgressChange(1);
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto bg-[#080911]/90 backdrop-blur-md border border-white/15 rounded-2xl p-4 shadow-2xl pointer-events-auto select-none space-y-3 transition-all">
      {/* Top Telemetry Data Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 pb-3 border-b border-white/10 text-xs font-mono">
        {/* Phase & MET */}
        <div className="col-span-2 sm:col-span-1 flex flex-col justify-center">
          <div className="text-[10px] text-zinc-500 uppercase tracking-widest font-semibold flex items-center gap-1">
            <Clock className="w-3 h-3 text-amber-400" />
            <span>Timeline</span>
          </div>
          <div className="text-white font-bold text-sm tracking-wide mt-0.5">
            {interpolatedTelemetry.met}
          </div>
          <div className="text-[10px] text-amber-400 truncate font-sans font-medium">
            {interpolatedTelemetry.phase}
          </div>
        </div>

        {/* Velocity */}
        <div className="flex flex-col justify-center">
          <div className="text-[10px] text-zinc-500 uppercase tracking-widest font-semibold flex items-center gap-1">
            <Gauge className="w-3 h-3 text-sky-400" />
            <span>Velocity</span>
          </div>
          <div className="text-white font-bold text-sm tabular-nums mt-0.5">
            {interpolatedTelemetry.velocityKmS.toFixed(2)}{' '}
            <span className="text-[10px] text-zinc-400 font-normal">km/s</span>
          </div>
          <div className="text-[10px] text-zinc-400 tabular-nums">
            {(interpolatedTelemetry.velocityKmS * 3600).toLocaleString()}{' '}
            <span className="text-[9px]">km/h</span>
          </div>
        </div>

        {/* Earth Distance */}
        <div className="flex flex-col justify-center">
          <div className="text-[10px] text-zinc-500 uppercase tracking-widest font-semibold flex items-center gap-1">
            <Navigation className="w-3 h-3 text-blue-400" />
            <span>From Earth</span>
          </div>
          <div className="text-white font-bold text-sm tabular-nums mt-0.5">
            {interpolatedTelemetry.earthDistKm.toLocaleString()}
          </div>
          <div className="text-[10px] text-zinc-400">Kilometers</div>
        </div>

        {/* Moon Distance */}
        <div className="flex flex-col justify-center">
          <div className="text-[10px] text-zinc-500 uppercase tracking-widest font-semibold flex items-center gap-1">
            <Navigation className="w-3 h-3 text-emerald-400" />
            <span>To Moon</span>
          </div>
          <div className="text-white font-bold text-sm tabular-nums mt-0.5">
            {interpolatedTelemetry.moonDistKm.toLocaleString()}
          </div>
          <div className="text-[10px] text-zinc-400">Kilometers</div>
        </div>

        {/* Radio Signal Delay */}
        <div className="flex flex-col justify-center">
          <div className="text-[10px] text-zinc-500 uppercase tracking-widest font-semibold flex items-center gap-1">
            <Radio className="w-3 h-3 text-purple-400 animate-pulse" />
            <span>Light Delay</span>
          </div>
          <div className="text-white font-bold text-sm tabular-nums mt-0.5">
            {interpolatedTelemetry.signalDelayMs}{' '}
            <span className="text-[10px] text-zinc-400 font-normal">ms</span>
          </div>
          <div className="text-[10px] text-zinc-400">One-way DSN</div>
        </div>
      </div>

      {/* Scrubber Control Row */}
      <div className="flex items-center gap-3">
        {/* Playback Controls */}
        <div className="flex items-center gap-1">
          <button
            onClick={() => onProgressChange(0)}
            title="Reset to Liftoff"
            className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
          <button
            onClick={jumpPrevMilestone}
            title="Previous Milestone"
            className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <Rewind className="w-4 h-4" />
          </button>
          <button
            onClick={onTogglePlay}
            title={isPlaying ? 'Pause Simulation' : 'Play Trajectory Animation'}
            className="p-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-black font-bold transition-all shadow-md active:scale-95"
          >
            {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 fill-black" />}
          </button>
          <button
            onClick={jumpNextMilestone}
            title="Next Milestone"
            className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <FastForward className="w-4 h-4" />
          </button>
        </div>

        {/* Range Slider with Custom Ticks */}
        <div className="relative flex-1 flex items-center">
          <input
            type="range"
            min={0}
            max={1}
            step={0.002}
            value={progress}
            onChange={(e) => onProgressChange(parseFloat(e.target.value))}
            className="w-full h-2 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-amber-400 focus:outline-none"
          />

          {/* Milestone markers along slider */}
          <div className="absolute inset-x-0 pointer-events-none flex justify-between px-1">
            {mission.milestones.map((m) => (
              <div
                key={m.progress}
                style={{ left: `${m.progress * 100}%` }}
                className="absolute -top-1 w-1.5 h-4 -ml-0.5 rounded-full bg-white/30"
                title={`${m.label} (${m.met})`}
              />
            ))}
          </div>
        </div>

        {/* Percentage Display */}
        <div className="text-xs font-mono text-zinc-300 tabular-nums w-12 text-right">
          {(progress * 100).toFixed(0)}%
        </div>
      </div>

      {/* Current Milestone Detail Banner */}
      <div className="text-[11px] font-sans text-zinc-300 bg-white/5 rounded-lg px-3 py-1.5 flex items-center justify-between gap-4">
        <div className="flex items-center gap-2 truncate">
          <span className="w-2 h-2 rounded-full bg-amber-400 shrink-0" />
          <span className="font-semibold text-white truncate font-['Space_Grotesk']">
            {currentMilestone.label}:
          </span>
          <span className="text-zinc-300 truncate">{currentMilestone.description}</span>
        </div>
        <span className="text-[10px] font-mono text-zinc-400 shrink-0 uppercase tracking-widest">
          {mission.callsign}
        </span>
      </div>
    </div>
  );
}
