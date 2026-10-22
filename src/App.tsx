/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect, useRef, useState } from 'react';
import { GameEngine, GameState, GameStats } from './game/gameEngine.ts';
import { CharacterSkin } from './game/character.ts';
import { StartScreen } from './components/StartScreen.tsx';
import { GameHUD } from './components/GameHUD.tsx';
import { GameOverModal } from './components/GameOverModal.tsx';
import { PauseModal } from './components/PauseModal.tsx';

export default function App() {
  const mountRef = useRef<HTMLDivElement>(null);
  const engineRef = useRef<GameEngine | null>(null);

  const [gameState, setGameState] = useState<GameState>('menu');
  const [selectedSkin, setSelectedSkin] = useState<CharacterSkin>('sakura');
  const [stats, setStats] = useState<GameStats>({
    score: 0,
    coins: 0,
    distance: 0,
    speed: 19,
    highScore: 0,
    activePowerups: {
      magnet: 0,
      shield: false,
      multiplier: 0,
      spring: 0,
    },
  });

  useEffect(() => {
    if (!mountRef.current) return;

    const engine = new GameEngine(
      mountRef.current,
      (newStats) => setStats(newStats),
      (newState) => setGameState(newState),
      selectedSkin
    );
    engineRef.current = engine;

    return () => {
      engine.dispose();
      engineRef.current = null;
    };
  }, []);

  const handleStartRun = () => {
    if (engineRef.current) {
      engineRef.current.startRun();
    }
  };

  const handleRestartRun = () => {
    if (engineRef.current) {
      engineRef.current.restartRun();
    }
  };

  const handlePause = () => {
    if (engineRef.current) {
      engineRef.current.pauseGame();
    }
  };

  const handleResume = () => {
    if (engineRef.current) {
      engineRef.current.resumeGame();
    }
  };

  const handleMenu = () => {
    setGameState('menu');
    if (engineRef.current) {
      engineRef.current.state = 'menu';
    }
  };

  const handleSelectSkin = (skin: CharacterSkin) => {
    setSelectedSkin(skin);
    if (engineRef.current) {
      engineRef.current.setSkin(skin);
    }
  };

  const handleJump = () => {
    engineRef.current?.jump();
  };

  const handleSlide = () => {
    engineRef.current?.slide();
  };

  const handleMoveLeft = () => {
    engineRef.current?.moveLeft();
  };

  const handleMoveRight = () => {
    engineRef.current?.moveRight();
  };

  return (
    <main className="relative w-screen h-screen overflow-hidden bg-slate-950 font-game">
      {/* 3D WebGL Canvas Container */}
      <div
        ref={mountRef}
        className="absolute inset-0 w-full h-full cursor-grab active:cursor-grabbing touch-none"
      />

      {/* Start / Menu Screen */}
      {gameState === 'menu' && (
        <StartScreen
          onStart={handleStartRun}
          selectedSkin={selectedSkin}
          onSelectSkin={handleSelectSkin}
          highScore={stats.highScore}
        />
      )}

      {/* In-Game HUD & Mobile Touch Controls */}
      {(gameState === 'playing' || gameState === 'paused') && (
        <GameHUD
          stats={stats}
          onPause={handlePause}
          onJump={handleJump}
          onSlide={handleSlide}
          onMoveLeft={handleMoveLeft}
          onMoveRight={handleMoveRight}
        />
      )}

      {/* Pause Modal */}
      {gameState === 'paused' && (
        <PauseModal
          onResume={handleResume}
          onRestart={handleRestartRun}
          onMenu={handleMenu}
        />
      )}

      {/* Game Over / Crash Modal */}
      {gameState === 'gameover' && (
        <GameOverModal
          stats={stats}
          onRestart={handleRestartRun}
          onMenu={handleMenu}
        />
      )}
    </main>
  );
}
