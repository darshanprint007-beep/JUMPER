/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { AnimeCharacter, CharacterSkin } from './character.ts';
import { Environment, LANES } from './environment.ts';
import { WorldObjectsManager, Obstacle, Coin, PowerupItem, PowerupType } from './worldObjects.ts';
import { ParticleSystem } from './particles.ts';
import { soundManager } from '../audio/soundManager.ts';

export type GameState = 'menu' | 'playing' | 'paused' | 'gameover';

export interface GameStats {
  score: number;
  coins: number;
  distance: number;
  speed: number;
  highScore: number;
  activePowerups: {
    magnet: number; // remaining seconds
    shield: boolean;
    multiplier: number;
    spring: number;
  };
}

export class GameEngine {
  private container: HTMLDivElement;
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private renderer: THREE.WebGLRenderer;
  private clock: THREE.Clock;
  private frameId: number = 0;

  // Subsystems
  public character: AnimeCharacter;
  private environment: Environment;
  private worldObjects: WorldObjectsManager;
  private particles: ParticleSystem;

  // Game state
  public state: GameState = 'menu';
  private currentSkin: CharacterSkin = 'sakura';
  private stats: GameStats = {
    score: 0,
    coins: 0,
    distance: 0,
    speed: 18,
    highScore: 0,
    activePowerups: {
      magnet: 0,
      shield: false,
      multiplier: 0,
      spring: 0,
    },
  };

  // Player physics
  private currentLane: number = 0; // -1 = left, 0 = center, 1 = right
  private playerX: number = 0;
  private playerY: number = 0;
  private playerZ: number = 0;
  private velocityY: number = 0;
  private isGrounded: boolean = true;
  private canDoubleJump: boolean = false;
  private isDoubleJumping: boolean = false;
  private isSliding: boolean = false;
  private slideTimer: number = 0;
  private readonly SLIDE_DURATION: number = 0.72; // seconds
  private readonly GRAVITY: number = 34;
  private readonly JUMP_VELOCITY: number = 13.0;
  private readonly DOUBLE_JUMP_VELOCITY: number = 11.5;

  // Invincibility after shield pop
  private invincibilityTimer: number = 0;

  // Camera dynamics
  private cameraTargetX: number = 0;
  private cameraTargetY: number = 3.2;
  private screenShakeAmount: number = 0;

  // Reusable bounding box for player
  private playerBbox: THREE.Box3 = new THREE.Box3();

  // Callbacks
  private onStatsChange: (stats: GameStats) => void;
  private onStateChange: (state: GameState) => void;

  // Shield Visual Bubble
  private shieldMesh: THREE.Mesh;

  constructor(
    container: HTMLDivElement,
    onStatsChange: (stats: GameStats) => void,
    onStateChange: (state: GameState) => void,
    initialSkin: CharacterSkin = 'sakura'
  ) {
    this.container = container;
    this.onStatsChange = onStatsChange;
    this.onStateChange = onStateChange;
    this.currentSkin = initialSkin;

    // Load High Score from localStorage
    try {
      const saved = localStorage.getItem('high_jumper_best_score');
      if (saved) this.stats.highScore = parseInt(saved, 10) || 0;
    } catch {
      // LocalStorage access fallback
    }

    // 1. Scene & Camera
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x0a0c1b);
    this.scene.fog = new THREE.FogExp2(0x0a0c1b, 0.016);

    const aspect = container.clientWidth / (container.clientHeight || 1);
    this.camera = new THREE.PerspectiveCamera(62, aspect, 0.1, 400);
    this.camera.position.set(0, 3.4, 6.2);

    // 2. Renderer with Software GL detection & High Performance settings
    const isSoftwareGl = (() => {
      const gl = document.createElement('canvas').getContext('webgl2');
      if (!gl) return true;
      const ext = gl.getExtension('WEBGL_debug_renderer_info');
      const param = ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER;
      const gpu = String(gl.getParameter(param));
      gl.getExtension('WEBGL_lose_context')?.loseContext();
      return /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu);
    })();

    this.renderer = new THREE.WebGLRenderer({
      antialias: !isSoftwareGl,
      powerPreference: 'high-performance',
      stencil: false,
    });
    this.renderer.setSize(container.clientWidth, container.clientHeight);
    this.renderer.setPixelRatio(isSoftwareGl ? 1 : Math.min(window.devicePixelRatio, 2));
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.15;
    this.renderer.shadowMap.enabled = !isSoftwareGl;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    container.appendChild(this.renderer.domElement);

    // 3. Studio Environment Reflection via RoomEnvironment
    const pmremGenerator = new THREE.PMREMGenerator(this.renderer);
    this.scene.environment = pmremGenerator.fromScene(new RoomEnvironment(), 0.04).texture;
    pmremGenerator.dispose();

    // 4. Studio Lighting Rig (Warm Key Light, Cool Sky Hemisphere, Rim Light)
    const hemiLight = new THREE.HemisphereLight(0x38bdf8, 0x0f172a, 0.9);
    this.scene.add(hemiLight);

    const dirLight = new THREE.DirectionalLight(0xfff0dd, 2.2);
    dirLight.position.set(10, 20, 10);
    dirLight.castShadow = !isSoftwareGl;
    if (dirLight.shadow) {
      dirLight.shadow.mapSize.width = 1024;
      dirLight.shadow.mapSize.height = 1024;
      dirLight.shadow.camera.near = 0.5;
      dirLight.shadow.camera.far = 60;
      const d = 16;
      dirLight.shadow.camera.left = -d;
      dirLight.shadow.camera.right = d;
      dirLight.shadow.camera.top = d;
      dirLight.shadow.camera.bottom = -d;
      dirLight.shadow.bias = -0.0005;
      dirLight.shadow.normalBias = 0.02;
    }
    this.scene.add(dirLight);

    const rimLight = new THREE.DirectionalLight(0xd946ef, 1.2);
    rimLight.position.set(-10, 12, -15);
    this.scene.add(rimLight);

    // 5. Initialize Subsystems
    this.environment = new Environment(this.scene);
    this.worldObjects = new WorldObjectsManager(this.scene);
    this.particles = new ParticleSystem(this.scene);
    this.character = new AnimeCharacter(this.currentSkin);
    this.scene.add(this.character.group);

    // 6. Shield Hologram Sphere
    const shieldGeo = new THREE.SphereGeometry(1.2, 24, 24);
    const shieldMat = new THREE.MeshBasicMaterial({
      color: 0x10b981,
      transparent: true,
      opacity: 0.35,
      wireframe: true,
    });
    this.shieldMesh = new THREE.Mesh(shieldGeo, shieldMat);
    this.shieldMesh.visible = false;
    this.scene.add(this.shieldMesh);

    // 7. Clock & Loop
    this.clock = new THREE.Clock();
    this.bindEvents();
    this.tick();
  }

  // --- CONTROLS & INPUT ---
  public jump() {
    if (this.state !== 'playing') return;

    if (this.isGrounded) {
      // First jump
      const boost = this.stats.activePowerups.spring > 0 ? 1.35 : 1.0;
      this.velocityY = this.JUMP_VELOCITY * boost;
      this.isGrounded = false;
      this.canDoubleJump = true;
      this.isDoubleJumping = false;
      this.isSliding = false; // Cancel slide into jump
      soundManager.playJump();
    } else if (this.canDoubleJump) {
      // Double jump!
      const boost = this.stats.activePowerups.spring > 0 ? 1.35 : 1.0;
      this.velocityY = this.DOUBLE_JUMP_VELOCITY * boost;
      this.canDoubleJump = false;
      this.isDoubleJumping = true;
      soundManager.playDoubleJump();
      this.particles.spawnPowerupBurst(new THREE.Vector3(this.playerX, this.playerY + 0.5, this.playerZ), 0x00f0ff);
    }
  }

  public slide() {
    if (this.state !== 'playing') return;

    // Fast-drop if in air, and enter slide
    if (!this.isGrounded) {
      this.velocityY = -18; // Quick dive to ground
    }
    this.isSliding = true;
    this.slideTimer = this.SLIDE_DURATION;
    soundManager.playSlide();
  }

  public moveLeft() {
    if (this.state !== 'playing') return;
    if (this.currentLane > -1) {
      this.currentLane--;
    }
  }

  public moveRight() {
    if (this.state !== 'playing') return;
    if (this.currentLane < 1) {
      this.currentLane++;
    }
  }

  public setSkin(skin: CharacterSkin) {
    this.currentSkin = skin;
    this.character.setSkin(skin);
  }

  public startRun() {
    this.resetRunState();
    this.state = 'playing';
    this.onStateChange('playing');
    soundManager.startBGM();
  }

  public pauseGame() {
    if (this.state === 'playing') {
      this.state = 'paused';
      this.onStateChange('paused');
    }
  }

  public resumeGame() {
    if (this.state === 'paused') {
      this.state = 'playing';
      this.clock.getDelta(); // clear delta accumulation
      this.onStateChange('playing');
    }
  }

  public restartRun() {
    this.startRun();
  }

  private resetRunState() {
    this.currentLane = 0;
    this.playerX = 0;
    this.playerY = 0;
    this.playerZ = 0;
    this.velocityY = 0;
    this.isGrounded = true;
    this.canDoubleJump = false;
    this.isDoubleJumping = false;
    this.isSliding = false;
    this.slideTimer = 0;
    this.invincibilityTimer = 0;

    this.stats = {
      score: 0,
      coins: 0,
      distance: 0,
      speed: 19,
      highScore: this.stats.highScore,
      activePowerups: {
        magnet: 0,
        shield: false,
        multiplier: 0,
        spring: 0,
      },
    };

    this.character.group.position.set(0, 0, 0);
    this.character.group.visible = true;
    this.shieldMesh.visible = false;
    this.environment.reset();
    this.worldObjects.reset();
    this.particles.clear();

    this.onStatsChange(this.stats);
  }

  private bindEvents() {
    // Keyboard controls
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.repeat && e.code !== 'Space') return;

      if (e.code === 'Space' || e.code === 'ArrowUp' || e.code === 'KeyW') {
        e.preventDefault();
        if (this.state === 'menu' || this.state === 'gameover') {
          this.startRun();
        } else {
          this.jump();
        }
      } else if (e.code === 'ArrowDown' || e.code === 'KeyS') {
        e.preventDefault();
        this.slide();
      } else if (e.code === 'ArrowLeft' || e.code === 'KeyA') {
        e.preventDefault();
        this.moveLeft();
      } else if (e.code === 'ArrowRight' || e.code === 'KeyD') {
        e.preventDefault();
        this.moveRight();
      } else if (e.code === 'KeyP' || e.code === 'Escape') {
        e.preventDefault();
        if (this.state === 'playing') this.pauseGame();
        else if (this.state === 'paused') this.resumeGame();
      } else if (e.code === 'KeyM') {
        soundManager.toggleMute();
      }
    };
    window.addEventListener('keydown', onKeyDown);

    // Touch and swipe gesture handling for mobile
    let touchStartX = 0;
    let touchStartY = 0;
    let touchStartTime = 0;

    const onTouchStart = (e: TouchEvent) => {
      if (e.touches.length > 0) {
        touchStartX = e.touches[0].clientX;
        touchStartY = e.touches[0].clientY;
        touchStartTime = Date.now();
      }
    };

    const onTouchEnd = (e: TouchEvent) => {
      if (e.changedTouches.length === 0) return;
      const touchEndX = e.changedTouches[0].clientX;
      const touchEndY = e.changedTouches[0].clientY;
      const dx = touchEndX - touchStartX;
      const dy = touchEndY - touchStartY;
      const duration = Date.now() - touchStartTime;

      const absX = Math.abs(dx);
      const absY = Math.abs(dy);

      // Swipe detected (moved at least 30px)
      if (Math.max(absX, absY) > 30) {
        if (absY > absX) {
          // Vertical swipe
          if (dy > 0) {
            // Swipe Down -> Slide!
            this.slide();
          } else {
            // Swipe Up -> Jump!
            this.jump();
          }
        } else {
          // Horizontal swipe -> Lane change!
          if (dx < 0) {
            this.moveLeft();
          } else {
            this.moveRight();
          }
        }
      } else if (duration < 280) {
        // Quick Tap -> Jump!
        if (this.state === 'menu' || this.state === 'gameover') {
          this.startRun();
        } else if (this.state === 'playing') {
          this.jump();
        }
      }
    };

    this.container.addEventListener('touchstart', onTouchStart, { passive: true });
    this.container.addEventListener('touchend', onTouchEnd, { passive: true });

    // Window resize handler
    const onResize = () => {
      if (!this.container) return;
      const width = this.container.clientWidth;
      const height = this.container.clientHeight || 1;
      this.camera.aspect = width / height;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(width, height);
    };
    window.addEventListener('resize', onResize);
  }

  // --- MAIN GAME LOOP ---
  private tick = () => {
    this.frameId = requestAnimationFrame(this.tick);

    const rawDelta = this.clock.getDelta();
    const delta = Math.min(rawDelta, 0.05); // Prevent huge delta spikes on tab focus

    if (this.state === 'playing') {
      this.updatePlaying(delta);
    } else if (this.state === 'menu' || this.state === 'gameover') {
      this.updateIdle(delta);
    }

    this.particles.update(delta);
    this.renderer.render(this.scene, this.camera);
  };

  private updatePlaying(delta: number) {
    // 1. Difficulty & Speed Acceleration
    // Base speed = 19, ramps up smoothly with distance up to 42 units/sec
    const distanceMeters = Math.floor(Math.abs(this.playerZ));
    const targetSpeed = Math.min(42, 19 + (distanceMeters / 90) * 1.1);
    this.stats.speed = THREE.MathUtils.damp(this.stats.speed, targetSpeed, 2, delta);

    // Advance forward down track (-Z direction)
    const forwardStep = this.stats.speed * delta;
    this.playerZ -= forwardStep;
    this.stats.distance = Math.floor(Math.abs(this.playerZ));

    // Score accumulates with distance + 2x multiplier if active
    const scoreMultiplier = this.stats.activePowerups.multiplier > 0 ? 2 : 1;
    this.stats.score += Math.round(forwardStep * 1.5 * scoreMultiplier);

    // 2. Horizontal Lane Physics (Smooth spring/lerp to target lane)
    const targetX = LANES[this.currentLane + 1];
    this.playerX = THREE.MathUtils.damp(this.playerX, targetX, 15, delta);

    // 3. Vertical Jump & Gravity Physics
    if (!this.isGrounded) {
      this.velocityY -= this.GRAVITY * delta;
      this.playerY += this.velocityY * delta;

      // Check ground landing
      if (this.playerY <= 0) {
        this.playerY = 0;
        this.velocityY = 0;
        this.isGrounded = true;
        this.canDoubleJump = false;
        this.isDoubleJumping = false;
      }
    }

    // 4. Slide Timer
    if (this.isSliding) {
      this.slideTimer -= delta;
      // Emit slide sparks at feet
      this.particles.spawnSlideSparks(new THREE.Vector3(this.playerX, 0, this.playerZ), -1);

      if (this.slideTimer <= 0) {
        this.isSliding = false;
      }
    }

    // 5. Update Powerup Countdown Timers
    if (this.stats.activePowerups.magnet > 0) {
      this.stats.activePowerups.magnet = Math.max(0, this.stats.activePowerups.magnet - delta);
    }
    if (this.stats.activePowerups.multiplier > 0) {
      this.stats.activePowerups.multiplier = Math.max(0, this.stats.activePowerups.multiplier - delta);
    }
    if (this.stats.activePowerups.spring > 0) {
      this.stats.activePowerups.spring = Math.max(0, this.stats.activePowerups.spring - delta);
    }
    if (this.invincibilityTimer > 0) {
      this.invincibilityTimer = Math.max(0, this.invincibilityTimer - delta);
      // Flash character transparency during invincibility
      this.character.group.visible = Math.floor(Date.now() / 80) % 2 === 0;
    } else {
      this.character.group.visible = true;
    }

    // 6. Shield visual sync
    if (this.stats.activePowerups.shield) {
      this.shieldMesh.visible = true;
      this.shieldMesh.position.set(this.playerX, this.playerY + 0.9, this.playerZ);
      this.shieldMesh.rotation.y += delta * 2;
      this.shieldMesh.rotation.x += delta * 1.5;
    } else {
      this.shieldMesh.visible = false;
    }

    // 7. Update Character Transform & Animations
    this.character.group.position.set(this.playerX, this.playerY, this.playerZ);

    let charState: 'running' | 'jumping' | 'sliding' | 'crashed' = 'running';
    if (!this.isGrounded) charState = 'jumping';
    else if (this.isSliding) charState = 'sliding';

    this.character.update(delta, charState, this.stats.speed, 0, this.isDoubleJumping);

    // 8. Update Environment & Subsystems
    this.environment.update(this.playerZ);

    const difficultyFactor = 1.0 + (this.stats.distance / 300);
    this.worldObjects.generateAhead(this.playerZ, difficultyFactor);
    this.worldObjects.update(
      delta,
      this.playerX,
      this.playerY,
      this.playerZ,
      this.stats.activePowerups.magnet > 0
    );

    // 9. Calculate Player Collision Bounding Box
    // If sliding: low compact box! (Under high hurdles!)
    // If standing/jumping: tall box
    if (this.isSliding) {
      this.playerBbox.min.set(this.playerX - 0.35, 0, this.playerZ - 0.45);
      this.playerBbox.max.set(this.playerX + 0.35, 0.65, this.playerZ + 0.45);
    } else {
      this.playerBbox.min.set(this.playerX - 0.35, this.playerY, this.playerZ - 0.3);
      this.playerBbox.max.set(this.playerX + 0.35, this.playerY + 1.85, this.playerZ + 0.3);
    }

    // 10. Check Collisions
    this.worldObjects.checkCollisions(
      this.playerBbox,
      (coin: Coin) => {
        // Collect Coin!
        const mult = this.stats.activePowerups.multiplier > 0 ? 2 : 1;
        this.stats.coins++;
        this.stats.score += 20 * mult;
        soundManager.playCoin();
        this.particles.spawnCoinBurst(coin.mesh.position);
      },
      (powerup: PowerupItem) => {
        // Collect Powerup!
        soundManager.playPowerup();
        const pType = powerup.type;
        if (pType === 'magnet') {
          this.stats.activePowerups.magnet = 12; // 12 seconds
        } else if (pType === 'shield') {
          this.stats.activePowerups.shield = true;
        } else if (pType === 'multiplier') {
          this.stats.activePowerups.multiplier = 14;
        } else if (pType === 'spring') {
          this.stats.activePowerups.spring = 10;
        }
        this.particles.spawnPowerupBurst(powerup.mesh.position, 0xffff00);
      },
      (obstacle: Obstacle) => {
        // Player hit obstacle!
        if (this.invincibilityTimer > 0) return; // Skip if currently recovering

        if (this.stats.activePowerups.shield) {
          // Shield absorbs the crash!
          this.stats.activePowerups.shield = false;
          this.invincibilityTimer = 1.4; // 1.4s safety buffer
          soundManager.playShieldBreak();
          this.particles.spawnCrashExplosion(obstacle.mesh.position);
          obstacle.passed = true;
          this.screenShakeAmount = 0.35;
        } else {
          // Crash & Game Over!
          this.handleCrash(obstacle);
        }
      }
    );

    // 11. Camera Follow with Dynamic Speed FOV and Smooth Spring
    const targetCamX = this.playerX * 0.6;
    const targetCamY = 3.2 + this.playerY * 0.35;
    const targetCamZ = this.playerZ + 6.2;

    this.camera.position.x = THREE.MathUtils.damp(this.camera.position.x, targetCamX, 8, delta);
    this.camera.position.y = THREE.MathUtils.damp(this.camera.position.y, targetCamY, 8, delta);
    this.camera.position.z = THREE.MathUtils.damp(this.camera.position.z, targetCamZ, 12, delta);

    // Screen Shake decay
    if (this.screenShakeAmount > 0) {
      this.camera.position.x += (Math.random() - 0.5) * this.screenShakeAmount;
      this.camera.position.y += (Math.random() - 0.5) * this.screenShakeAmount;
      this.screenShakeAmount = Math.max(0, this.screenShakeAmount - delta * 2.5);
    }

    // Dynamic FOV based on speed (exhilarating speed rush!)
    const targetFov = 62 + ((this.stats.speed - 19) / 23) * 10;
    this.camera.fov = THREE.MathUtils.damp(this.camera.fov, targetFov, 2, delta);
    this.camera.updateProjectionMatrix();

    this.camera.lookAt(this.playerX * 0.3, this.playerY * 0.5 + 1.2, this.playerZ - 12);

    // Broadcast stats to HUD
    this.onStatsChange({ ...this.stats });
  }

  private handleCrash(obstacle: Obstacle) {
    this.state = 'gameover';
    soundManager.stopBGM();
    soundManager.playCrash();
    this.character.update(0.016, 'crashed', 0);
    this.particles.spawnCrashExplosion(new THREE.Vector3(this.playerX, this.playerY + 0.8, this.playerZ));
    this.screenShakeAmount = 0.8;

    // Check High Score
    if (this.stats.score > this.stats.highScore) {
      this.stats.highScore = this.stats.score;
      try {
        localStorage.setItem('high_jumper_best_score', this.stats.highScore.toString());
      } catch {
        // Storage error
      }
    }

    this.onStatsChange({ ...this.stats });
    this.onStateChange('gameover');
  }

  private updateIdle(delta: number) {
    // Menu or Game Over idle orbit/breathe
    this.character.update(delta, this.state === 'gameover' ? 'crashed' : 'idle', 0);

    if (this.state === 'menu') {
      // Gentle cinematic camera pan
      const time = Date.now() * 0.0008;
      this.camera.position.x = Math.sin(time) * 1.8;
      this.camera.position.y = 2.4 + Math.cos(time * 0.7) * 0.3;
      this.camera.position.z = this.playerZ + 4.8;
      this.camera.lookAt(0, 1.1, this.playerZ - 1);
    }
  }

  public dispose() {
    cancelAnimationFrame(this.frameId);
    window.removeEventListener('resize', () => {});
    this.character.dispose();
    this.environment.dispose();
    this.worldObjects.dispose();
    this.particles.dispose();
    this.renderer.dispose();
  }
}
