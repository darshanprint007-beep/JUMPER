/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Play, RotateCcw, Home, Volume2, VolumeX } from 'lucide-react';
import { soundManager } from '../audio/soundManager.ts';

interface PauseModalProps {
  onResume: () => void;
  onRestart: () => void;
  onMenu: () => void;
}

export const PauseModal: React.FC<PauseModalProps> = ({
  onResume,
  onRestart,
  onMenu,
}) => {
  const [muted, setMuted] = React.useState(soundManager.getMuted());

  const handleToggleMute = () => {
    const nextMuted = soundManager.toggleMute();
    setMuted(nextMuted);
  };

  return (
    <div className="absolute inset-0 z-40 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs select-none">
      <div className="w-full max-w-sm bg-gradient-to-b from-slate-900 to-slate-950 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl flex flex-col items-center text-center animate-in fade-in zoom-in duration-150">
        <h2 className="text-3xl font-black uppercase tracking-tight text-white mb-2">
          Game Paused
        </h2>
        <p className="text-xs text-slate-400 mb-6">Take a breath, runner!</p>

        <div className="w-full flex flex-col gap-3">
          <button
            onClick={onResume}
            className="w-full py-3.5 rounded-2xl font-black text-base uppercase tracking-wider text-slate-950 bg-gradient-to-r from-cyan-400 to-amber-300 shadow-[0_0_20px_rgba(6,182,212,0.4)] hover:scale-102 active:scale-98 transition flex items-center justify-center gap-2 cursor-pointer"
          >
            <Play className="w-5 h-5 fill-slate-950" /> Resume Run
          </button>

          <button
            onClick={onRestart}
            className="w-full py-3 rounded-xl font-bold text-sm uppercase tracking-wider text-slate-200 hover:text-white bg-slate-800/80 hover:bg-slate-700 border border-slate-700/60 transition flex items-center justify-center gap-2 cursor-pointer"
          >
            <RotateCcw className="w-4 h-4" /> Restart Run
          </button>

          <button
            onClick={handleToggleMute}
            className="w-full py-3 rounded-xl font-bold text-sm uppercase tracking-wider text-slate-300 hover:text-white bg-slate-800/50 hover:bg-slate-800 border border-slate-700/50 transition flex items-center justify-center gap-2 cursor-pointer"
          >
            {muted ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4 text-emerald-400" />}
            {muted ? 'Unmute Audio' : 'Mute Audio'}
          </button>

          <button
            onClick={onMenu}
            className="w-full py-2.5 rounded-xl font-medium text-xs uppercase tracking-wider text-slate-400 hover:text-slate-200 transition flex items-center justify-center gap-2 cursor-pointer mt-1"
          >
            <Home className="w-4 h-4" /> Exit to Main Menu
          </button>
        </div>
      </div>
    </div>
  );
};
