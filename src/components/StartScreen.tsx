/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Trophy, Volume2, VolumeX, Sparkles, Play, ArrowDown, ArrowUp, ArrowLeft, ArrowRight } from 'lucide-react';
import { CharacterSkin, SKINS } from '../game/character.ts';
import { soundManager } from '../audio/soundManager.ts';

interface StartScreenProps {
  onStart: () => void;
  selectedSkin: CharacterSkin;
  onSelectSkin: (skin: CharacterSkin) => void;
  highScore: number;
}

export const StartScreen: React.FC<StartScreenProps> = ({
  onStart,
  selectedSkin,
  onSelectSkin,
  highScore,
}) => {
  const [muted, setMuted] = React.useState(soundManager.getMuted());

  const handleToggleMute = (e: React.MouseEvent) => {
    e.stopPropagation();
    const nextMuted = soundManager.toggleMute();
    setMuted(nextMuted);
  };

  return (
    <div 
      onClick={onStart}
      className="absolute inset-0 z-30 flex flex-col justify-between p-4 sm:p-6 md:p-8 bg-gradient-to-t from-slate-950/90 via-slate-950/40 to-slate-950/70 backdrop-blur-xs select-none cursor-pointer"
    >
      {/* Top Header */}
      <div className="w-full flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-slate-900/80 border border-amber-500/30 px-3.5 py-1.5 rounded-full shadow-lg">
            <Trophy className="w-4 h-4 text-amber-400" />
            <span className="text-xs uppercase tracking-wider text-slate-300 font-bold">Best Score:</span>
            <span className="text-sm font-black text-amber-400">{highScore.toLocaleString()}</span>
          </div>
        </div>

        <button
          onClick={handleToggleMute}
          className="p-2.5 rounded-full bg-slate-900/80 border border-slate-700/60 text-slate-300 hover:text-white hover:bg-slate-800 transition shadow-lg active:scale-95"
          title={muted ? 'Unmute Audio' : 'Mute Audio'}
          aria-label="Toggle Audio"
        >
          {muted ? <VolumeX className="w-5 h-5 text-rose-400" /> : <Volume2 className="w-5 h-5 text-emerald-400" />}
        </button>
      </div>

      {/* Center Branding & Hero */}
      <div className="flex flex-col items-center text-center my-auto px-4 max-w-xl mx-auto">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/20 border border-cyan-400/40 text-cyan-300 text-xs font-black tracking-widest uppercase mb-3 shadow-sm">
          <Sparkles className="w-3.5 h-3.5" /> 3D Anime Endless Runner
        </div>

        <h1 className="text-4xl sm:text-6xl font-black italic tracking-tight uppercase text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 via-pink-400 to-amber-300 drop-shadow-[0_4px_24px_rgba(236,72,153,0.4)]">
          The High Jumper
        </h1>
        <p className="text-slate-300 text-sm sm:text-base mt-2 max-w-md font-medium">
          Dodge barriers, slide under hazard lasers, collect gold coins, and jump higher than ever!
        </p>

        {/* Character Skin Selector */}
        <div 
          onClick={(e) => e.stopPropagation()} 
          className="mt-6 w-full bg-slate-900/80 border border-slate-700/60 rounded-2xl p-3 shadow-xl"
        >
          <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2.5">
            Select Runner Style
          </div>
          <div className="grid grid-cols-3 gap-2">
            {(Object.keys(SKINS) as CharacterSkin[]).map((skinKey) => {
              const skin = SKINS[skinKey];
              const isSelected = selectedSkin === skinKey;
              return (
                <button
                  key={skinKey}
                  onClick={() => onSelectSkin(skinKey)}
                  className={`flex flex-col items-center p-2 rounded-xl border transition cursor-pointer ${
                    isSelected
                      ? 'bg-cyan-950/60 border-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.35)] scale-102'
                      : 'bg-slate-800/40 border-slate-700/60 hover:bg-slate-800 hover:border-slate-600'
                  }`}
                >
                  <div
                    className="w-5 h-5 rounded-full mb-1.5 border border-white/40 shadow-inner"
                    style={{ backgroundColor: '#' + skin.hair.toString(16).padStart(6, '0') }}
                  />
                  <span className="text-xs font-bold text-white truncate max-w-full">
                    {skin.name}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Big Start Button */}
        <button
          onClick={onStart}
          className="mt-6 w-full max-w-sm py-4 px-8 rounded-2xl font-black text-lg sm:text-xl tracking-wider uppercase text-slate-950 bg-gradient-to-r from-amber-400 via-pink-400 to-cyan-400 shadow-[0_0_30px_rgba(244,63,94,0.5)] hover:scale-103 active:scale-97 transition transform flex items-center justify-center gap-3 cursor-pointer"
        >
          <Play className="w-6 h-6 fill-slate-950" /> Start Running
        </button>
        <span className="text-xs text-slate-400 mt-2 font-semibold">Press Space or Tap to Play</span>
      </div>

      {/* Bottom Controls Info Card */}
      <div 
        onClick={onStart}
        className="w-full max-w-2xl mx-auto bg-slate-900/80 border border-slate-800/80 rounded-2xl p-3 sm:p-4 shadow-xl cursor-pointer hover:border-cyan-500/50 transition"
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          {/* Desktop Controls */}
          <div className="flex flex-col gap-1.5 p-2 bg-slate-950/50 rounded-xl border border-slate-800/60">
            <span className="font-bold text-cyan-400 uppercase tracking-wide flex items-center gap-1.5">
              💻 Desktop / Laptop Controls
            </span>
            <div className="flex items-center justify-between text-slate-300">
              <span>Jump / Double Jump:</span>
              <kbd className="px-2 py-0.5 bg-slate-800 rounded border border-slate-600 font-mono text-white text-[11px]">Space / ↑</kbd>
            </div>
            <div className="flex items-center justify-between text-slate-300">
              <span>Slide Under Lasers:</span>
              <kbd className="px-2 py-0.5 bg-slate-800 rounded border border-slate-600 font-mono text-white text-[11px]">↓ Arrow / S</kbd>
            </div>
            <div className="flex items-center justify-between text-slate-300">
              <span>Switch Lanes:</span>
              <kbd className="px-2 py-0.5 bg-slate-800 rounded border border-slate-600 font-mono text-white text-[11px]">← / → Arrows</kbd>
            </div>
          </div>

          {/* Mobile Controls */}
          <div className="flex flex-col gap-1.5 p-2 bg-slate-950/50 rounded-xl border border-slate-800/60">
            <span className="font-bold text-pink-400 uppercase tracking-wide flex items-center gap-1.5">
              📱 Mobile / Tablet Controls
            </span>
            <div className="flex items-center justify-between text-slate-300">
              <span>Jump:</span>
              <span className="font-bold text-amber-300">Tap screen or Swipe Up</span>
            </div>
            <div className="flex items-center justify-between text-slate-300">
              <span>Slide:</span>
              <span className="font-bold text-amber-300">Swipe Down</span>
            </div>
            <div className="flex items-center justify-between text-slate-300">
              <span>Steer:</span>
              <span className="font-bold text-amber-300">Swipe Left / Right</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
