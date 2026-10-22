/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Pause, Volume2, VolumeX, Shield, Zap, Compass, Magnet, ArrowLeft, ArrowRight, ArrowUp, ArrowDown } from 'lucide-react';
import { GameStats } from '../game/gameEngine.ts';
import { soundManager } from '../audio/soundManager.ts';

interface GameHUDProps {
  stats: GameStats;
  onPause: () => void;
  onJump: () => void;
  onSlide: () => void;
  onMoveLeft: () => void;
  onMoveRight: () => void;
}

export const GameHUD: React.FC<GameHUDProps> = ({
  stats,
  onPause,
  onJump,
  onSlide,
  onMoveLeft,
  onMoveRight,
}) => {
  const [muted, setMuted] = React.useState(soundManager.getMuted());

  const handleToggleMute = (e: React.MouseEvent) => {
    e.stopPropagation();
    const nextMuted = soundManager.toggleMute();
    setMuted(nextMuted);
  };

  // Speed Tier
  const getSpeedTier = (speed: number) => {
    if (speed < 24) return { label: 'CRUISE', color: 'text-cyan-400 bg-cyan-950/60 border-cyan-500/40' };
    if (speed < 30) return { label: 'SPRINT', color: 'text-emerald-400 bg-emerald-950/60 border-emerald-500/40' };
    if (speed < 36) return { label: 'HYPER', color: 'text-amber-400 bg-amber-950/60 border-amber-500/40' };
    return { label: 'MAX BOOST', color: 'text-rose-400 bg-rose-950/60 border-rose-500/40 animate-pulse' };
  };

  const speedTier = getSpeedTier(stats.speed);

  return (
    <div className="absolute inset-0 pointer-events-none flex flex-col justify-between p-3 sm:p-5 select-none z-20">
      {/* Top HUD Bar */}
      <div className="w-full flex items-start justify-between gap-2">
        {/* Left: Score & Multiplier */}
        <div className="flex flex-col gap-1 pointer-events-auto">
          <div className="flex items-center gap-2 bg-slate-900/80 backdrop-blur-xs border border-slate-700/60 px-4 py-2 rounded-2xl shadow-lg">
            <div>
              <div className="text-[10px] font-black uppercase tracking-wider text-slate-400">Score</div>
              <div className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                {stats.score.toLocaleString()}
              </div>
            </div>
            {stats.activePowerups.multiplier > 0 && (
              <div className="ml-2 px-2 py-0.5 rounded-lg bg-purple-500 text-white font-black text-xs tracking-wider uppercase shadow-[0_0_12px_rgba(168,85,247,0.8)] animate-bounce">
                2X
              </div>
            )}
          </div>
        </div>

        {/* Center: Distance & Speed Badge */}
        <div className="flex flex-col items-center pointer-events-auto">
          <div className="bg-slate-900/80 backdrop-blur-xs border border-slate-700/60 px-4 py-1.5 rounded-2xl shadow-lg flex items-center gap-3">
            <div className="flex items-center gap-1.5 text-cyan-400 font-bold text-sm">
              <Compass className="w-4 h-4" />
              <span>{stats.distance} m</span>
            </div>
            <div className="h-4 w-px bg-slate-700" />
            <div className={`px-2 py-0.5 rounded-md text-[10px] font-black border tracking-wider uppercase ${speedTier.color}`}>
              {speedTier.label}
            </div>
          </div>
        </div>

        {/* Right: Coins, Pause, Audio */}
        <div className="flex items-center gap-2 pointer-events-auto">
          {/* Coin Counter */}
          <div className="flex items-center gap-2 bg-slate-900/80 backdrop-blur-xs border border-amber-500/30 px-3.5 py-2 rounded-2xl shadow-lg">
            <div className="w-5 h-5 rounded-full bg-amber-400 flex items-center justify-center text-slate-950 font-black text-xs shadow-[0_0_10px_rgba(251,191,36,0.6)]">
              ★
            </div>
            <span className="text-lg sm:text-xl font-black text-amber-400">
              {stats.coins}
            </span>
          </div>

          {/* Audio Mute Button */}
          <button
            onClick={handleToggleMute}
            className="p-2.5 rounded-2xl bg-slate-900/80 backdrop-blur-xs border border-slate-700/60 text-slate-300 hover:text-white transition shadow-lg active:scale-95 cursor-pointer"
            title={muted ? 'Unmute' : 'Mute'}
            aria-label="Toggle Mute"
          >
            {muted ? <VolumeX className="w-5 h-5 text-rose-400" /> : <Volume2 className="w-5 h-5 text-emerald-400" />}
          </button>

          {/* Pause Button */}
          <button
            onClick={onPause}
            className="p-2.5 rounded-2xl bg-slate-900/80 backdrop-blur-xs border border-slate-700/60 text-slate-300 hover:text-white transition shadow-lg active:scale-95 cursor-pointer"
            title="Pause Game"
            aria-label="Pause Game"
          >
            <Pause className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Active Powerups Tray (Floating left side) */}
      <div className="flex flex-col gap-2 pointer-events-none mt-2 self-start">
        {/* Magnet Powerup */}
        {stats.activePowerups.magnet > 0 && (
          <div className="flex items-center gap-2 bg-cyan-950/80 border border-cyan-500/50 px-3 py-1.5 rounded-xl shadow-lg text-cyan-300 text-xs font-bold">
            <Magnet className="w-4 h-4 text-cyan-400 animate-spin" />
            <span>Coin Magnet ({Math.ceil(stats.activePowerups.magnet)}s)</span>
          </div>
        )}

        {/* Shield Powerup */}
        {stats.activePowerups.shield && (
          <div className="flex items-center gap-2 bg-emerald-950/80 border border-emerald-500/50 px-3 py-1.5 rounded-xl shadow-lg text-emerald-300 text-xs font-bold">
            <Shield className="w-4 h-4 text-emerald-400" />
            <span>Shield Active</span>
          </div>
        )}

        {/* 2X Multiplier */}
        {stats.activePowerups.multiplier > 0 && (
          <div className="flex items-center gap-2 bg-purple-950/80 border border-purple-500/50 px-3 py-1.5 rounded-xl shadow-lg text-purple-300 text-xs font-bold">
            <Zap className="w-4 h-4 text-purple-400 animate-pulse" />
            <span>2X Points ({Math.ceil(stats.activePowerups.multiplier)}s)</span>
          </div>
        )}

        {/* Super Spring High Jumper */}
        {stats.activePowerups.spring > 0 && (
          <div className="flex items-center gap-2 bg-amber-950/80 border border-amber-500/50 px-3 py-1.5 rounded-xl shadow-lg text-amber-300 text-xs font-bold">
            <span className="text-sm">🚀</span>
            <span>Super Jump ({Math.ceil(stats.activePowerups.spring)}s)</span>
          </div>
        )}
      </div>

      {/* Bottom Mobile / Touch On-Screen Controls */}
      <div className="w-full flex items-end justify-between pointer-events-auto pb-1 sm:pb-2">
        {/* Left Thumb: Steering Arrows */}
        <div className="flex items-center gap-2 sm:gap-3">
          <button
            onPointerDown={(e) => {
              e.preventDefault();
              onMoveLeft();
            }}
            className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-slate-900/70 active:bg-cyan-600/80 border-2 border-slate-700/60 active:border-cyan-400 text-white flex items-center justify-center shadow-2xl active:scale-95 transition-transform backdrop-blur-xs touch-none cursor-pointer"
            aria-label="Move Left"
          >
            <ArrowLeft className="w-7 h-7 sm:w-8 sm:h-8" />
          </button>
          <button
            onPointerDown={(e) => {
              e.preventDefault();
              onMoveRight();
            }}
            className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-slate-900/70 active:bg-cyan-600/80 border-2 border-slate-700/60 active:border-cyan-400 text-white flex items-center justify-center shadow-2xl active:scale-95 transition-transform backdrop-blur-xs touch-none cursor-pointer"
            aria-label="Move Right"
          >
            <ArrowRight className="w-7 h-7 sm:w-8 sm:h-8" />
          </button>
        </div>

        {/* Right Thumb: Jump & Slide Action Buttons */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Slide Button */}
          <button
            onPointerDown={(e) => {
              e.preventDefault();
              onSlide();
            }}
            className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-slate-900/70 active:bg-pink-600/80 border-2 border-slate-700/60 active:border-pink-400 text-white flex flex-col items-center justify-center shadow-2xl active:scale-95 transition-transform backdrop-blur-xs touch-none cursor-pointer"
            aria-label="Slide"
          >
            <ArrowDown className="w-6 h-6 sm:w-7 sm:h-7 text-pink-400" />
            <span className="text-[9px] font-black tracking-wider uppercase text-pink-300">Slide</span>
          </button>

          {/* Jump Button (Prominent & Glowing) */}
          <button
            onPointerDown={(e) => {
              e.preventDefault();
              onJump();
            }}
            className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-br from-amber-400 to-amber-600 active:from-amber-300 active:to-amber-500 border-2 border-amber-300 text-slate-950 flex flex-col items-center justify-center shadow-[0_0_20px_rgba(251,191,36,0.6)] active:scale-95 transition-transform backdrop-blur-xs touch-none cursor-pointer"
            aria-label="Jump"
          >
            <ArrowUp className="w-7 h-7 sm:w-9 sm:h-9 stroke-[3]" />
            <span className="text-[10px] sm:text-xs font-black tracking-wider uppercase">Jump</span>
          </button>
        </div>
      </div>
    </div>
  );
};
