/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import * as THREE from 'three';
import { LANES } from './environment.ts';

export type ObstacleType = 'low_hurdle' | 'high_barrier' | 'full_blockade' | 'spinning_spike';
export type PowerupType = 'magnet' | 'shield' | 'multiplier' | 'spring';

export interface Obstacle {
  id: number;
  type: ObstacleType;
  lane: number; // -1, 0, 1
  x: number;
  z: number;
  mesh: THREE.Group;
  bbox: THREE.Box3;
  passed: boolean;
}

export interface Coin {
  id: number;
  lane: number;
  x: number;
  y: number;
  z: number;
  mesh: THREE.Group;
  collected: boolean;
  baseY: number;
}

export interface PowerupItem {
  id: number;
  type: PowerupType;
  lane: number;
  x: number;
  y: number;
  z: number;
  mesh: THREE.Group;
  collected: boolean;
}

export class WorldObjectsManager {
  public group: THREE.Group;
  public obstacles: Obstacle[] = [];
  public coins: Coin[] = [];
  public powerups: PowerupItem[] = [];

  private nextId: number = 0;
  private spawnZ: number = -40; // Spawns ahead of player
  private sharedMaterials: {
    lowBarrierPost: THREE.MeshStandardMaterial;
    lowBarrierNeon: THREE.MeshStandardMaterial;
    highBarrierSign: THREE.MeshStandardMaterial;
    highBarrierBeam: THREE.MeshStandardMaterial;
    blockadeMain: THREE.MeshStandardMaterial;
    blockadeAccent: THREE.MeshStandardMaterial;
    coinGold: THREE.MeshStandardMaterial;
    coinRim: THREE.MeshStandardMaterial;
    magnetMat: THREE.MeshStandardMaterial;
    shieldMat: THREE.MeshStandardMaterial;
    multMat: THREE.MeshStandardMaterial;
    springMat: THREE.MeshStandardMaterial;
  };

  // Reusable bounding box for zero-GC collision checking
  private tempBox: THREE.Box3 = new THREE.Box3();

  constructor(scene: THREE.Scene) {
    this.group = new THREE.Group();
    scene.add(this.group);

    // Initialize shared reusable materials
    this.sharedMaterials = {
      lowBarrierPost: new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.5 }),
      lowBarrierNeon: new THREE.MeshStandardMaterial({
        color: 0xff0055,
        emissive: 0xff0055,
        emissiveIntensity: 1.4,
        roughness: 0.1,
      }),
      highBarrierSign: new THREE.MeshStandardMaterial({
        color: 0xf59e0b,
        emissive: 0xd97706,
        emissiveIntensity: 0.9,
        roughness: 0.2,
      }),
      highBarrierBeam: new THREE.MeshStandardMaterial({
        color: 0x0284c7,
        emissive: 0x0284c7,
        emissiveIntensity: 1.0,
      }),
      blockadeMain: new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.6 }),
      blockadeAccent: new THREE.MeshStandardMaterial({
        color: 0xef4444,
        emissive: 0xdc2626,
        emissiveIntensity: 1.2,
      }),
      coinGold: new THREE.MeshStandardMaterial({
        color: 0xffd700,
        metalness: 0.85,
        roughness: 0.2,
        emissive: 0xffb700,
        emissiveIntensity: 0.35,
      }),
      coinRim: new THREE.MeshStandardMaterial({
        color: 0xfff080,
        metalness: 0.9,
        roughness: 0.15,
        emissive: 0xffea00,
        emissiveIntensity: 0.5,
      }),
      magnetMat: new THREE.MeshStandardMaterial({
        color: 0x00ffff,
        emissive: 0x00ffff,
        emissiveIntensity: 1.2,
        roughness: 0.1,
      }),
      shieldMat: new THREE.MeshStandardMaterial({
        color: 0x10b981,
        emissive: 0x059669,
        emissiveIntensity: 1.2,
        roughness: 0.1,
      }),
      multMat: new THREE.MeshStandardMaterial({
        color: 0x8b5cf6,
        emissive: 0x7c3aed,
        emissiveIntensity: 1.2,
        roughness: 0.1,
      }),
      springMat: new THREE.MeshStandardMaterial({
        color: 0xf59e0b,
        emissive: 0xd97706,
        emissiveIntensity: 1.2,
        roughness: 0.1,
      }),
    };
  }

  // --- OBSTACLE FACTORIES ---
  private createLowHurdleMesh(): THREE.Group {
    const group = new THREE.Group();

    // Side metal posts
    const postGeo = new THREE.CylinderGeometry(0.08, 0.08, 0.9, 8);
    const leftPost = new THREE.Mesh(postGeo, this.sharedMaterials.lowBarrierPost);
    leftPost.position.set(-0.95, 0.45, 0);
    leftPost.castShadow = true;
    group.add(leftPost);

    const rightPost = new THREE.Mesh(postGeo, this.sharedMaterials.lowBarrierPost);
    rightPost.position.set(0.95, 0.45, 0);
    rightPost.castShadow = true;
    group.add(rightPost);

    // Glowing Neon Crossbar (jump over!)
    const barGeo = new THREE.BoxGeometry(2.0, 0.15, 0.15);
    const barMesh = new THREE.Mesh(barGeo, this.sharedMaterials.lowBarrierNeon);
    barMesh.position.set(0, 0.78, 0);
    barMesh.castShadow = true;
    group.add(barMesh);

    // Hazard stripes / jump indicator arrow
    const jumpArrowGeo = new THREE.ConeGeometry(0.18, 0.25, 4);
    jumpArrowGeo.rotateZ(0);
    const jumpArrow = new THREE.Mesh(jumpArrowGeo, this.sharedMaterials.lowBarrierNeon);
    jumpArrow.position.set(0, 0.98, 0);
    group.add(jumpArrow);

    return group;
  }

  private createHighBarrierMesh(): THREE.Group {
    const group = new THREE.Group();

    // High overhead beams that allow sliding underneath
    const sidePoleGeo = new THREE.CylinderGeometry(0.09, 0.09, 3.2, 8);
    const lPole = new THREE.Mesh(sidePoleGeo, this.sharedMaterials.lowBarrierPost);
    lPole.position.set(-1.0, 1.6, 0);
    lPole.castShadow = true;
    group.add(lPole);

    const rPole = new THREE.Mesh(sidePoleGeo, this.sharedMaterials.lowBarrierPost);
    rPole.position.set(1.0, 1.6, 0);
    rPole.castShadow = true;
    group.add(rPole);

    // Suspended Overhead Hazard Sign (Height: y=1.2 to 2.4 - slide under!)
    const signGeo = new THREE.BoxGeometry(2.1, 1.1, 0.22);
    const signMesh = new THREE.Mesh(signGeo, this.sharedMaterials.highBarrierSign);
    signMesh.position.set(0, 1.9, 0);
    signMesh.castShadow = true;
    group.add(signMesh);

    // Glowing Laser Bar at bottom of sign (y = 1.35)
    const laserBeamGeo = new THREE.BoxGeometry(2.15, 0.1, 0.25);
    const laserBeam = new THREE.Mesh(laserBeamGeo, this.sharedMaterials.highBarrierBeam);
    laserBeam.position.set(0, 1.3, 0);
    group.add(laserBeam);

    // Downward arrow indicating SLIDE!
    const arrowGeo = new THREE.ConeGeometry(0.18, 0.25, 4);
    arrowGeo.rotateZ(Math.PI);
    const arrowMesh = new THREE.Mesh(arrowGeo, this.sharedMaterials.highBarrierBeam);
    arrowMesh.position.set(0, 1.15, 0);
    group.add(arrowMesh);

    return group;
  }

  private createFullBlockadeMesh(): THREE.Group {
    const group = new THREE.Group();

    // Heavy cyber barricade blocking the lane
    const baseGeo = new THREE.BoxGeometry(2.2, 2.8, 0.7);
    const baseMesh = new THREE.Mesh(baseGeo, this.sharedMaterials.blockadeMain);
    baseMesh.position.set(0, 1.4, 0);
    baseMesh.castShadow = true;
    group.add(baseMesh);

    // Neon hazard cross
    const crossGeo = new THREE.BoxGeometry(1.6, 0.16, 0.74);
    const cross1 = new THREE.Mesh(crossGeo, this.sharedMaterials.blockadeAccent);
    cross1.position.set(0, 1.4, 0);
    cross1.rotation.z = Math.PI / 4;
    group.add(cross1);

    const cross2 = new THREE.Mesh(crossGeo, this.sharedMaterials.blockadeAccent);
    cross2.position.set(0, 1.4, 0);
    cross2.rotation.z = -Math.PI / 4;
    group.add(cross2);

    return group;
  }

  private createSpinningSpikeMesh(): THREE.Group {
    const group = new THREE.Group();

    // Low rotating spiked roller (jump over!)
    const cylinderGeo = new THREE.CylinderGeometry(0.25, 0.25, 2.0, 12);
    cylinderGeo.rotateZ(Math.PI / 2);
    const cylinder = new THREE.Mesh(cylinderGeo, this.sharedMaterials.lowBarrierPost);
    cylinder.position.set(0, 0.35, 0);
    cylinder.castShadow = true;
    group.add(cylinder);

    // Spikes around cylinder
    for (let i = 0; i < 6; i++) {
      const spikeGeo = new THREE.ConeGeometry(0.1, 0.25, 5);
      spikeGeo.rotateX(Math.PI / 2);
      const spike = new THREE.Mesh(spikeGeo, this.sharedMaterials.lowBarrierNeon);
      const angle = (i / 6) * Math.PI * 2;
      spike.position.set((Math.random() - 0.5) * 1.4, 0.35 + Math.sin(angle) * 0.3, Math.cos(angle) * 0.3);
      group.add(spike);
    }

    return group;
  }

  // --- COIN FACTORY ---
  private createCoinMesh(): THREE.Group {
    const group = new THREE.Group();

    // Beveled 3D Gold Coin with Star
    const coinGeo = new THREE.CylinderGeometry(0.35, 0.35, 0.08, 16);
    coinGeo.rotateX(Math.PI / 2);
    const coinBody = new THREE.Mesh(coinGeo, this.sharedMaterials.coinGold);
    coinBody.castShadow = true;
    group.add(coinBody);

    // Glowing rim
    const rimGeo = new THREE.TorusGeometry(0.36, 0.03, 8, 16);
    const rimMesh = new THREE.Mesh(rimGeo, this.sharedMaterials.coinRim);
    group.add(rimMesh);

    // Center star / diamond
    const starGeo = new THREE.OctahedronGeometry(0.16, 0);
    const starMesh = new THREE.Mesh(starGeo, this.sharedMaterials.coinRim);
    group.add(starMesh);

    return group;
  }

  // --- POWERUP FACTORY ---
  private createPowerupMesh(type: PowerupType): THREE.Group {
    const group = new THREE.Group();

    // Outer floating holographic energy orb
    const sphereGeo = new THREE.SphereGeometry(0.4, 16, 16);
    let orbMat = this.sharedMaterials.magnetMat;
    if (type === 'shield') orbMat = this.sharedMaterials.shieldMat;
    if (type === 'multiplier') orbMat = this.sharedMaterials.multMat;
    if (type === 'spring') orbMat = this.sharedMaterials.springMat;

    const orbMesh = new THREE.Mesh(sphereGeo, orbMat);
    group.add(orbMesh);

    // Inner icon symbol
    if (type === 'magnet') {
      const uGeo = new THREE.TorusGeometry(0.2, 0.06, 6, 12, Math.PI);
      const uMesh = new THREE.Mesh(uGeo, this.sharedMaterials.coinRim);
      uMesh.rotation.z = Math.PI;
      group.add(uMesh);
    } else if (type === 'shield') {
      const shieldIconGeo = new THREE.ConeGeometry(0.22, 0.4, 4);
      shieldIconGeo.rotateZ(Math.PI);
      const shieldIcon = new THREE.Mesh(shieldIconGeo, this.sharedMaterials.coinRim);
      group.add(shieldIcon);
    } else if (type === 'multiplier') {
      const starGeo = new THREE.DodecahedronGeometry(0.22);
      const star = new THREE.Mesh(starGeo, this.sharedMaterials.coinRim);
      group.add(star);
    } else if (type === 'spring') {
      const springGeo = new THREE.TorusGeometry(0.18, 0.05, 8, 12);
      const sMesh = new THREE.Mesh(springGeo, this.sharedMaterials.coinRim);
      group.add(sMesh);
    }

    return group;
  }

  /**
   * Spawns obstacles, coin trails, and powerups ahead of the player
   */
  public generateAhead(playerZ: number, difficultyFactor: number) {
    const targetZ = playerZ - 200; // Keep generating 200 units ahead

    while (this.spawnZ > targetZ) {
      this.spawnPattern(this.spawnZ, difficultyFactor);
      // Spacing between obstacle patterns decreases slightly with difficulty
      const patternSpacing = Math.max(16, 26 - difficultyFactor * 3.5);
      this.spawnZ -= patternSpacing;
    }
  }

  private spawnPattern(zPos: number, difficultyFactor: number) {
    // Pick 1 or 2 lanes for obstacles (always leave at least 1 clear lane or jumpable/slideable)
    const availableLanes = [-1, 0, 1];
    const shuffleLanes = availableLanes.sort(() => Math.random() - 0.5);

    // Types probability:
    // Low hurdle (jump!): 35%
    // High barrier (slide!): 35%
    // Full blockade (change lane): 20%
    // Spikes: 10%
    const rand = Math.random();
    let type1: ObstacleType = 'low_hurdle';
    if (rand < 0.35) {
      type1 = 'low_hurdle';
    } else if (rand < 0.70) {
      type1 = 'high_barrier';
    } else if (rand < 0.88) {
      type1 = 'full_blockade';
    } else {
      type1 = 'spinning_spike';
    }

    const lane1 = shuffleLanes[0];
    this.addObstacle(type1, lane1, zPos);

    // At higher difficulty, add a 2nd obstacle in another lane
    if (difficultyFactor > 1.4 && Math.random() < 0.5) {
      const lane2 = shuffleLanes[1];
      // If first is full blockade, 2nd should be jumpable or slideable so player has options
      let type2: ObstacleType = type1 === 'full_blockade' ? 'low_hurdle' : (Math.random() > 0.5 ? 'high_barrier' : 'low_hurdle');
      this.addObstacle(type2, lane2, zPos);
    }

    // Spawn Coins!
    // If low hurdle, spawn jump arc coins over it
    if (type1 === 'low_hurdle' || type1 === 'spinning_spike') {
      this.spawnCoinArc(lane1, zPos);
    } else if (type1 === 'high_barrier') {
      // Spawn low sliding trail under the high barrier
      this.spawnCoinSlideTrail(lane1, zPos);
    } else {
      // In clear lane, spawn ground coin line
      const clearLane = shuffleLanes[2];
      this.spawnCoinLine(clearLane, zPos);
    }

    // Occasional Powerup in a clear lane (approx every 6-8 patterns)
    if (Math.random() < 0.16) {
      const powerupLane = shuffleLanes[2];
      const pTypes: PowerupType[] = ['magnet', 'shield', 'multiplier', 'spring'];
      const pType = pTypes[Math.floor(Math.random() * pTypes.length)];
      this.addPowerup(pType, powerupLane, zPos - 4);
    }
  }

  private addObstacle(type: ObstacleType, lane: number, z: number) {
    const x = LANES[lane + 1];
    let mesh: THREE.Group;
    const bbox = new THREE.Box3();

    if (type === 'low_hurdle') {
      mesh = this.createLowHurdleMesh();
      bbox.min.set(x - 0.95, 0, z - 0.2);
      bbox.max.set(x + 0.95, 0.95, z + 0.2);
    } else if (type === 'high_barrier') {
      mesh = this.createHighBarrierMesh();
      // Notice: Bounding box starts at y = 1.15! Sliding player (y < 0.65) misses this box completely!
      bbox.min.set(x - 1.0, 1.15, z - 0.2);
      bbox.max.set(x + 1.0, 2.5, z + 0.2);
    } else if (type === 'full_blockade') {
      mesh = this.createFullBlockadeMesh();
      bbox.min.set(x - 1.05, 0, z - 0.35);
      bbox.max.set(x + 1.05, 2.8, z + 0.35);
    } else {
      mesh = this.createSpinningSpikeMesh();
      bbox.min.set(x - 0.9, 0, z - 0.3);
      bbox.max.set(x + 0.9, 0.65, z + 0.3);
    }

    mesh.position.set(x, 0, z);
    this.group.add(mesh);

    this.obstacles.push({
      id: this.nextId++,
      type,
      lane,
      x,
      z,
      mesh,
      bbox,
      passed: false,
    });
  }

  // Spawns arc of coins rewarding a well-timed jump
  private spawnCoinArc(lane: number, centerZ: number) {
    const x = LANES[lane + 1];
    const steps = 5;
    for (let i = 0; i < steps; i++) {
      const t = (i / (steps - 1)) * 2 - 1; // -1 to 1
      const coinZ = centerZ + t * 4;
      // Parabolic jump arc height: peak at y = 1.9 over hurdle
      const coinY = 0.6 + (1 - t * t) * 1.35;
      this.addCoin(lane, x, coinY, coinZ);
    }
  }

  // Spawns flat ground coins under overhead barrier rewarding sliding
  private spawnCoinSlideTrail(lane: number, centerZ: number) {
    const x = LANES[lane + 1];
    for (let i = -2; i <= 2; i++) {
      const coinZ = centerZ + i * 1.8;
      this.addCoin(lane, x, 0.35, coinZ);
    }
  }

  // Spawns straight line of coins
  private spawnCoinLine(lane: number, centerZ: number) {
    const x = LANES[lane + 1];
    for (let i = -2; i <= 2; i++) {
      const coinZ = centerZ + i * 2.2;
      this.addCoin(lane, x, 0.7, coinZ);
    }
  }

  private addCoin(lane: number, x: number, y: number, z: number) {
    const mesh = this.createCoinMesh();
    mesh.position.set(x, y, z);
    this.group.add(mesh);

    this.coins.push({
      id: this.nextId++,
      lane,
      x,
      y,
      z,
      mesh,
      collected: false,
      baseY: y,
    });
  }

  private addPowerup(type: PowerupType, lane: number, z: number) {
    const x = LANES[lane + 1];
    const y = 0.9;
    const mesh = this.createPowerupMesh(type);
    mesh.position.set(x, y, z);
    this.group.add(mesh);

    this.powerups.push({
      id: this.nextId++,
      type,
      lane,
      x,
      y,
      z,
      mesh,
      collected: false,
    });
  }

  /**
   * Update active world objects:
   * - Rotates coins and powerups
   * - Magnet pulls nearby coins to player
   * - Removes objects that are far behind the player to maintain high FPS
   */
  public update(
    delta: number,
    playerX: number,
    playerY: number,
    playerZ: number,
    hasMagnet: boolean
  ) {
    // 1. Animate coins & handle magnet attraction
    const coinSpin = delta * 5.0;
    const magnetPullSpeed = 24 * delta;

    for (let i = this.coins.length - 1; i >= 0; i--) {
      const coin = this.coins[i];

      // Remove coins that passed behind player
      if (coin.mesh.position.z > playerZ + 15) {
        this.group.remove(coin.mesh);
        this.coins.splice(i, 1);
        continue;
      }

      if (coin.collected) continue;

      coin.mesh.rotation.y += coinSpin;

      // Magnet attraction logic
      if (hasMagnet) {
        const dx = playerX - coin.mesh.position.x;
        const dy = (playerY + 0.8) - coin.mesh.position.y;
        const dz = playerZ - coin.mesh.position.z;
        const distSq = dx * dx + dy * dy + dz * dz;

        // Magnet attraction radius: ~10 units
        if (distSq < 100) {
          const dist = Math.sqrt(distSq);
          coin.mesh.position.x += (dx / dist) * magnetPullSpeed;
          coin.mesh.position.y += (dy / dist) * magnetPullSpeed;
          coin.mesh.position.z += (dz / dist) * magnetPullSpeed;
        }
      } else {
        // Gentle hover bob
        coin.mesh.position.y = coin.baseY + Math.sin(Date.now() * 0.005 + coin.id) * 0.08;
      }
    }

    // 2. Animate powerups
    for (let i = this.powerups.length - 1; i >= 0; i--) {
      const p = this.powerups[i];
      if (p.mesh.position.z > playerZ + 15) {
        this.group.remove(p.mesh);
        this.powerups.splice(i, 1);
        continue;
      }
      p.mesh.rotation.y += delta * 3;
      p.mesh.position.y = 0.9 + Math.sin(Date.now() * 0.004 + p.id) * 0.12;
    }

    // 3. Remove old obstacles
    for (let i = this.obstacles.length - 1; i >= 0; i--) {
      const obs = this.obstacles[i];
      if (obs.z > playerZ + 15) {
        this.group.remove(obs.mesh);
        this.obstacles.splice(i, 1);
      }
    }
  }

  public checkCollisions(
    playerBox: THREE.Box3,
    onCoinCollect: (coin: Coin) => void,
    onPowerupCollect: (powerup: PowerupItem) => void,
    onCrash: (obstacle: Obstacle) => void
  ) {
    // 1. Check Coins
    for (const coin of this.coins) {
      if (coin.collected) continue;
      this.tempBox.min.set(coin.mesh.position.x - 0.4, coin.mesh.position.y - 0.4, coin.mesh.position.z - 0.4);
      this.tempBox.max.set(coin.mesh.position.x + 0.4, coin.mesh.position.y + 0.4, coin.mesh.position.z + 0.4);

      if (playerBox.intersectsBox(this.tempBox)) {
        coin.collected = true;
        this.group.remove(coin.mesh);
        onCoinCollect(coin);
      }
    }

    // 2. Check Powerups
    for (const p of this.powerups) {
      if (p.collected) continue;
      this.tempBox.min.set(p.mesh.position.x - 0.5, p.mesh.position.y - 0.5, p.mesh.position.z - 0.5);
      this.tempBox.max.set(p.mesh.position.x + 0.5, p.mesh.position.y + 0.5, p.mesh.position.z + 0.5);

      if (playerBox.intersectsBox(this.tempBox)) {
        p.collected = true;
        this.group.remove(p.mesh);
        onPowerupCollect(p);
      }
    }

    // 3. Check Obstacles
    for (const obs of this.obstacles) {
      if (obs.passed) continue;

      if (playerBox.intersectsBox(obs.bbox)) {
        onCrash(obs);
        break;
      }
    }
  }

  public reset() {
    this.obstacles.forEach(o => this.group.remove(o.mesh));
    this.coins.forEach(c => this.group.remove(c.mesh));
    this.powerups.forEach(p => this.group.remove(p.mesh));
    this.obstacles = [];
    this.coins = [];
    this.powerups = [];
    this.spawnZ = -40;
    this.nextId = 0;
  }

  public dispose() {
    this.reset();
    Object.values(this.sharedMaterials).forEach(m => m.dispose());
  }
}
