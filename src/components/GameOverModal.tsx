/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect } from 'react';
import confetti from 'canvas-confetti';
import { RotateCcw, Trophy, Award, Flame } from 'lucide-react';
import { GameStats } from '../game/gameEngine.ts';

interface GameOverModalProps {
  stats: GameStats;
  onRestart: () => void;
  onMenu: () => void;
}

export const GameOverModal: React.FC<GameOverModalProps> = ({
  stats,
  onRestart,
  onMenu,
}) => {
  const isNewRecord = stats.score > 0 && stats.score >= stats.highScore;

  useEffect(() => {
    if (isNewRecord) {
      // Fire festive victory confetti!
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#06b6d4', '#f43f5e', '#fbbf24', '#a855f7'],
      });
    }
  }, [isNewRecord]);

  return (
    <div className="absolute inset-0 z-40 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs select-none">
      <div className="w-full max-w-md bg-gradient-to-b from-slate-900 to-slate-950 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl flex flex-col items-center text-center animate-in fade-in zoom-in duration-200">
        {/* Crash Badge */}
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-500/20 border border-rose-500/40 text-rose-400 text-xs font-black uppercase tracking-wider mb-2">
          <Flame className="w-4 h-4" /> Crash!
        </div>

        <h2 className="text-3xl sm:text-4xl font-black uppercase tracking-tight text-white mb-1">
          Run Finished
        </h2>

        {isNewRecord && (
          <div className="my-2 px-4 py-1.5 rounded-full bg-amber-500/20 border border-amber-400/50 text-amber-300 font-black text-sm flex items-center gap-2 animate-bounce">
            <Trophy className="w-4 h-4 text-amber-400" /> NEW HIGH SCORE!
          </div>
        )}

        {/* Stats Grid */}
        <div className="w-full grid grid-cols-2 gap-3 my-5">
          {/* Final Score */}
          <div className="col-span-2 bg-slate-950/60 border border-slate-800 rounded-2xl p-4 flex flex-col items-center">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Final Score</span>
            <span className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-pink-400 mt-0.5">
              {stats.score.toLocaleString()}
            </span>
          </div>

          {/* Distance */}
          <div className="bg-slate-950/60 border border-slate-800 rounded-2xl p-3 flex flex-col items-center">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Distance</span>
            <span className="text-xl font-black text-cyan-400 mt-0.5">
              {stats.distance} m
            </span>
          </div>

          {/* Coins */}
          <div className="bg-slate-950/60 border border-slate-800 rounded-2xl p-3 flex flex-col items-center">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Coins</span>
            <span className="text-xl font-black text-amber-400 mt-0.5">
              ★ {stats.coins}
            </span>
          </div>
        </div>

        {/* High Score Banner */}
        <div className="w-full flex items-center justify-between px-4 py-2.5 bg-slate-950/40 border border-slate-800/80 rounded-xl mb-6 text-xs">
          <span className="text-slate-400 font-bold flex items-center gap-1.5">
            <Award className="w-4 h-4 text-amber-400" /> All-Time Record:
          </span>
          <span className="font-black text-amber-400 text-sm">
            {stats.highScore.toLocaleString()}
          </span>
        </div>

        {/* Action Buttons */}
        <div className="w-full flex flex-col gap-2.5">
          <button
            onClick={onRestart}
            className="w-full py-4 rounded-2xl font-black text-base sm:text-lg uppercase tracking-wider text-slate-950 bg-gradient-to-r from-amber-400 via-pink-400 to-cyan-400 shadow-[0_0_24px_rgba(244,63,94,0.4)] hover:scale-102 active:scale-98 transition transform flex items-center justify-center gap-2 cursor-pointer"
          >
            <RotateCcw className="w-5 h-5" /> Play Again
          </button>
          <button
            onClick={onMenu}
            className="w-full py-3 rounded-xl font-bold text-sm uppercase tracking-wider text-slate-300 hover:text-white bg-slate-800/50 hover:bg-slate-800 border border-slate-700/50 transition cursor-pointer"
          >
            Main Menu & Skins
          </button>
        </div>

        {/* Pro Tip */}
        <p className="mt-4 text-xs text-slate-400 leading-relaxed">
          <strong className="text-pink-400">Tip:</strong> Press <kbd className="px-1.5 py-0.5 bg-slate-800 rounded border border-slate-700 text-slate-200">↓</kbd> or swipe down to slide safely underneath high laser signs!
        </p>
      </div>
    </div>
  );
};
