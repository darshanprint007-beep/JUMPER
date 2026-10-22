/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import * as THREE from 'three';

interface Particle {
  position: THREE.Vector3;
  velocity: THREE.Vector3;
  color: THREE.Color;
  size: number;
  life: number;
  maxLife: number;
  alpha: number;
}

export class ParticleSystem {
  public points: THREE.Points;
  private geometry: THREE.BufferGeometry;
  private material: THREE.PointsMaterial;
  private particles: Particle[] = [];
  private maxParticles: number = 600;

  // Attribute buffers
  private positions: Float32Array;
  private colors: Float32Array;

  constructor(scene: THREE.Scene) {
    this.geometry = new THREE.BufferGeometry();
    this.positions = new Float32Array(this.maxParticles * 3);
    this.colors = new Float32Array(this.maxParticles * 3);

    this.geometry.setAttribute('position', new THREE.BufferAttribute(this.positions, 3));
    this.geometry.setAttribute('color', new THREE.BufferAttribute(this.colors, 3));

    // Create glowing circle particle texture procedurally
    const canvas = document.createElement('canvas');
    canvas.width = 64;
    canvas.height = 64;
    const ctx = canvas.getContext('2d')!;
    const grad = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
    grad.addColorStop(0, 'rgba(255, 255, 255, 1)');
    grad.addColorStop(0.3, 'rgba(255, 255, 255, 0.8)');
    grad.addColorStop(0.8, 'rgba(255, 255, 255, 0.2)');
    grad.addColorStop(1, 'rgba(255, 255, 255, 0)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 64, 64);

    const texture = new THREE.CanvasTexture(canvas);

    this.material = new THREE.PointsMaterial({
      size: 0.35,
      map: texture,
      vertexColors: true,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });

    this.points = new THREE.Points(this.geometry, this.material);
    scene.add(this.points);
  }

  // Coin collect burst
  public spawnCoinBurst(pos: THREE.Vector3) {
    const goldColor = new THREE.Color(0xffd700);
    const orangeColor = new THREE.Color(0xff8800);
    const count = 18;

    for (let i = 0; i < count; i++) {
      if (this.particles.length >= this.maxParticles) break;
      const angle = Math.random() * Math.PI * 2;
      const elevation = (Math.random() - 0.3) * Math.PI;
      const speed = 3.5 + Math.random() * 4;

      this.particles.push({
        position: pos.clone().add(new THREE.Vector3((Math.random() - 0.5) * 0.2, (Math.random() - 0.5) * 0.2, (Math.random() - 0.5) * 0.2)),
        velocity: new THREE.Vector3(
          Math.cos(angle) * Math.cos(elevation) * speed,
          Math.sin(elevation) * speed + 2.5,
          Math.sin(angle) * Math.cos(elevation) * speed
        ),
        color: Math.random() > 0.4 ? goldColor.clone() : orangeColor.clone(),
        size: 0.4 + Math.random() * 0.3,
        life: 0,
        maxLife: 0.5 + Math.random() * 0.3,
        alpha: 1,
      });
    }
  }

  // Sliding sparks at character feet
  public spawnSlideSparks(pos: THREE.Vector3, dirZ: number) {
    if (this.particles.length >= this.maxParticles) return;
    const sparkColor = new THREE.Color(0x00f0ff);
    const whiteColor = new THREE.Color(0xffffff);
    const count = 3;

    for (let i = 0; i < count; i++) {
      this.particles.push({
        position: new THREE.Vector3(
          pos.x + (Math.random() - 0.5) * 0.3,
          0.05 + Math.random() * 0.1,
          pos.z + (Math.random() - 0.5) * 0.2
        ),
        velocity: new THREE.Vector3(
          (Math.random() - 0.5) * 3,
          1.5 + Math.random() * 2,
          dirZ * (2 + Math.random() * 4)
        ),
        color: Math.random() > 0.5 ? sparkColor.clone() : whiteColor.clone(),
        size: 0.25 + Math.random() * 0.2,
        life: 0,
        maxLife: 0.25 + Math.random() * 0.2,
        alpha: 1,
      });
    }
  }

  // Crash explosion burst
  public spawnCrashExplosion(pos: THREE.Vector3) {
    const redColor = new THREE.Color(0xff1744);
    const yellowColor = new THREE.Color(0xffea00);
    const count = 60;

    for (let i = 0; i < count; i++) {
      if (this.particles.length >= this.maxParticles) break;
      const angle = Math.random() * Math.PI * 2;
      const speed = 4 + Math.random() * 9;

      this.particles.push({
        position: pos.clone().add(new THREE.Vector3(0, 0.8, 0)),
        velocity: new THREE.Vector3(
          Math.cos(angle) * speed,
          (Math.random() * 2 - 0.5) * speed + 3,
          Math.sin(angle) * speed
        ),
        color: Math.random() > 0.5 ? redColor.clone() : yellowColor.clone(),
        size: 0.5 + Math.random() * 0.5,
        life: 0,
        maxLife: 0.8 + Math.random() * 0.4,
        alpha: 1,
      });
    }
  }

  // Powerup collection sparkle
  public spawnPowerupBurst(pos: THREE.Vector3, hexColor: number) {
    const col = new THREE.Color(hexColor);
    const count = 28;

    for (let i = 0; i < count; i++) {
      if (this.particles.length >= this.maxParticles) break;
      const angle = Math.random() * Math.PI * 2;
      const speed = 5 + Math.random() * 6;

      this.particles.push({
        position: pos.clone().add(new THREE.Vector3(0, 0.6, 0)),
        velocity: new THREE.Vector3(
          Math.cos(angle) * speed,
          (Math.random() - 0.5) * speed + 2,
          Math.sin(angle) * speed
        ),
        color: col.clone(),
        size: 0.45 + Math.random() * 0.35,
        life: 0,
        maxLife: 0.7 + Math.random() * 0.3,
        alpha: 1,
      });
    }
  }

  public update(delta: number) {
    let activeCount = 0;

    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.life += delta;

      if (p.life >= p.maxLife) {
        this.particles.splice(i, 1);
        continue;
      }

      // Physics
      p.velocity.y -= 14 * delta; // Gravity
      p.position.addScaledVector(p.velocity, delta);

      // Bounce off ground
      if (p.position.y < 0.05) {
        p.position.y = 0.05;
        p.velocity.y *= -0.4;
      }

      const lifeRatio = 1 - p.life / p.maxLife;

      this.positions[activeCount * 3] = p.position.x;
      this.positions[activeCount * 3 + 1] = p.position.y;
      this.positions[activeCount * 3 + 2] = p.position.z;

      this.colors[activeCount * 3] = p.color.r * lifeRatio;
      this.colors[activeCount * 3 + 1] = p.color.g * lifeRatio;
      this.colors[activeCount * 3 + 2] = p.color.b * lifeRatio;

      activeCount++;
    }

    // Zero out unused
    for (let i = activeCount; i < this.maxParticles; i++) {
      this.positions[i * 3 + 1] = -9999;
    }

    this.geometry.attributes.position.needsUpdate = true;
    this.geometry.attributes.color.needsUpdate = true;
    this.geometry.setDrawRange(0, activeCount);
  }

  public clear() {
    this.particles = [];
    this.geometry.setDrawRange(0, 0);
  }

  public dispose() {
    this.geometry.dispose();
    this.material.dispose();
  }
}
