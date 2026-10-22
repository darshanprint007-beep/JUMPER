/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import * as THREE from 'three';

export const TRACK_WIDTH = 8.0;
export const LANE_WIDTH = 2.4;
export const LANES = [-2.4, 0, 2.4]; // Left, Center, Right lanes
export const CHUNK_LENGTH = 60;
export const TOTAL_CHUNKS = 6;

export class Environment {
  public group: THREE.Group;
  private chunks: THREE.Group[] = [];
  private buildingMaterials: THREE.MeshStandardMaterial[] = [];
  private neonMaterials: THREE.MeshStandardMaterial[] = [];
  private trackMaterial: THREE.MeshStandardMaterial;
  private curbMaterial: THREE.MeshStandardMaterial;
  private laneDividerMaterial: THREE.MeshStandardMaterial;

  constructor(scene: THREE.Scene) {
    this.group = new THREE.Group();
    scene.add(this.group);

    // Procedural asphalt texture with subtle grip grid
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 256;
    const ctx = canvas.getContext('2d')!;
    ctx.fillStyle = '#111322';
    ctx.fillRect(0, 0, 256, 256);

    // Subtle cyber grid lines
    ctx.strokeStyle = '#1e2238';
    ctx.lineWidth = 2;
    for (let x = 0; x < 256; x += 32) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, 256);
      ctx.stroke();
    }
    for (let y = 0; y < 256; y += 32) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(256, y);
      ctx.stroke();
    }

    const roadTexture = new THREE.CanvasTexture(canvas);
    roadTexture.wrapS = THREE.RepeatWrapping;
    roadTexture.wrapT = THREE.RepeatWrapping;
    roadTexture.repeat.set(2, 8);
    roadTexture.colorSpace = THREE.SRGBColorSpace;

    this.trackMaterial = new THREE.MeshStandardMaterial({
      map: roadTexture,
      roughness: 0.7,
      metalness: 0.15,
    });

    this.curbMaterial = new THREE.MeshStandardMaterial({
      color: 0x00f0ff,
      emissive: 0x00f0ff,
      emissiveIntensity: 0.8,
      roughness: 0.2,
    });

    this.laneDividerMaterial = new THREE.MeshStandardMaterial({
      color: 0xff007f,
      emissive: 0xff007f,
      emissiveIntensity: 0.7,
      roughness: 0.2,
    });

    // Building materials
    this.buildingMaterials = [
      new THREE.MeshStandardMaterial({ color: 0x0d1117, roughness: 0.8, metalness: 0.2 }),
      new THREE.MeshStandardMaterial({ color: 0x161b22, roughness: 0.7, metalness: 0.3 }),
      new THREE.MeshStandardMaterial({ color: 0x1a2333, roughness: 0.8, metalness: 0.2 }),
    ];

    this.neonMaterials = [
      new THREE.MeshStandardMaterial({ color: 0x00ffff, emissive: 0x00ffff, emissiveIntensity: 1.2, roughness: 0.1 }),
      new THREE.MeshStandardMaterial({ color: 0xff00ff, emissive: 0xff00ff, emissiveIntensity: 1.2, roughness: 0.1 }),
      new THREE.MeshStandardMaterial({ color: 0xffea00, emissive: 0xffea00, emissiveIntensity: 1.2, roughness: 0.1 }),
    ];

    // Build initial chunks
    for (let i = 0; i < TOTAL_CHUNKS; i++) {
      const chunk = this.createChunk(i);
      chunk.position.z = -i * CHUNK_LENGTH;
      this.chunks.push(chunk);
      this.group.add(chunk);
    }
  }

  private createChunk(index: number): THREE.Group {
    const chunk = new THREE.Group();

    // 1. Road Bed
    const roadGeo = new THREE.PlaneGeometry(TRACK_WIDTH, CHUNK_LENGTH);
    const road = new THREE.Mesh(roadGeo, this.trackMaterial);
    road.rotation.x = -Math.PI / 2;
    road.position.set(0, 0, -CHUNK_LENGTH / 2);
    road.receiveShadow = true;
    chunk.add(road);

    // 2. Left & Right Glowing Curbs
    const curbGeo = new THREE.BoxGeometry(0.35, 0.25, CHUNK_LENGTH);
    const leftCurb = new THREE.Mesh(curbGeo, this.curbMaterial);
    leftCurb.position.set(-TRACK_WIDTH / 2, 0.1, -CHUNK_LENGTH / 2);
    chunk.add(leftCurb);

    const rightCurb = new THREE.Mesh(curbGeo, this.curbMaterial);
    rightCurb.position.set(TRACK_WIDTH / 2, 0.1, -CHUNK_LENGTH / 2);
    chunk.add(rightCurb);

    // 3. Lane Dash Lines (between lane 1 & 2, and 2 & 3)
    const dashDividerGeo = new THREE.BoxGeometry(0.08, 0.02, 3.5);
    const dashSpacing = 7.0;
    const dashesCount = Math.floor(CHUNK_LENGTH / dashSpacing);

    for (let d = 0; d < dashesCount; d++) {
      const zOffset = -d * dashSpacing - 2;

      // Divider between Lane -1 and Lane 0 (x = -1.2)
      const d1 = new THREE.Mesh(dashDividerGeo, this.laneDividerMaterial);
      d1.position.set(-1.2, 0.015, zOffset);
      chunk.add(d1);

      // Divider between Lane 0 and Lane 1 (x = 1.2)
      const d2 = new THREE.Mesh(dashDividerGeo, this.laneDividerMaterial);
      d2.position.set(1.2, 0.015, zOffset);
      chunk.add(d2);
    }

    // 4. Futuristic City Buildings on both sides
    const buildingCount = 8;
    for (let b = 0; b < buildingCount; b++) {
      const bSide = b % 2 === 0 ? -1 : 1;
      const bDist = (TRACK_WIDTH / 2 + 3.5) + Math.random() * 8;
      const bHeight = 15 + Math.random() * 35;
      const bWidth = 6 + Math.random() * 7;
      const bDepth = 6 + Math.random() * 6;
      const bZ = -(b / buildingCount) * CHUNK_LENGTH - (Math.random() * 4);

      const bGeo = new THREE.BoxGeometry(bWidth, bHeight, bDepth);
      const bMat = this.buildingMaterials[Math.floor(Math.random() * this.buildingMaterials.length)];
      const building = new THREE.Mesh(bGeo, bMat);
      building.position.set(bSide * bDist, bHeight / 2 - 0.5, bZ);
      chunk.add(building);

      // Add Glowing Neon Window Strips / Roof antenna
      if (Math.random() > 0.4) {
        const neonStripGeo = new THREE.BoxGeometry(0.2, bHeight * 0.8, 0.2);
        const neonMat = this.neonMaterials[Math.floor(Math.random() * this.neonMaterials.length)];
        const neonStrip = new THREE.Mesh(neonStripGeo, neonMat);
        neonStrip.position.set(bSide * (bDist - bWidth / 2 - 0.1), bHeight / 2, bZ);
        chunk.add(neonStrip);
      }
    }

    // 5. Overhead Cyber Arch Gate on every alternate chunk
    if (index % 2 === 1) {
      const archGroup = new THREE.Group();
      archGroup.position.set(0, 0, -CHUNK_LENGTH / 2);

      const postGeo = new THREE.BoxGeometry(0.5, 6, 0.5);
      const beamGeo = new THREE.BoxGeometry(TRACK_WIDTH + 1.2, 0.5, 0.5);

      const leftPost = new THREE.Mesh(postGeo, this.curbMaterial);
      leftPost.position.set(-(TRACK_WIDTH / 2 + 0.3), 3, 0);
      archGroup.add(leftPost);

      const rightPost = new THREE.Mesh(postGeo, this.curbMaterial);
      rightPost.position.set(TRACK_WIDTH / 2 + 0.3, 3, 0);
      archGroup.add(rightPost);

      const crossBeam = new THREE.Mesh(beamGeo, this.laneDividerMaterial);
      crossBeam.position.set(0, 5.8, 0);
      archGroup.add(crossBeam);

      // Floating Hologram Billboard Sign
      const canvasSign = document.createElement('canvas');
      canvasSign.width = 512;
      canvasSign.height = 128;
      const sCtx = canvasSign.getContext('2d')!;
      sCtx.fillStyle = '#0f172a';
      sCtx.fillRect(0, 0, 512, 128);
      sCtx.strokeStyle = '#00f0ff';
      sCtx.lineWidth = 8;
      sCtx.strokeRect(4, 4, 504, 120);

      const titles = ['THE HIGH JUMPER', 'HYPERSPEED RUN', 'JUMP & SLIDE', 'NEON HORIZON'];
      const title = titles[(index + Math.floor(Math.random() * 4)) % titles.length];

      sCtx.fillStyle = '#ffffff';
      sCtx.font = 'bold 44px sans-serif';
      sCtx.textAlign = 'center';
      sCtx.textBaseline = 'middle';
      sCtx.fillText(title, 256, 64);

      const signTex = new THREE.CanvasTexture(canvasSign);
      signTex.colorSpace = THREE.SRGBColorSpace;
      const signMat = new THREE.MeshStandardMaterial({
        map: signTex,
        emissive: 0x00f0ff,
        emissiveIntensity: 0.6,
        roughness: 0.2,
      });
      const signGeo = new THREE.PlaneGeometry(5.5, 1.35);
      const signMesh = new THREE.Mesh(signGeo, signMat);
      signMesh.position.set(0, 4.6, 0);
      archGroup.add(signMesh);

      chunk.add(archGroup);
    }

    return chunk;
  }

  /**
   * Recycles chunks smoothly as player advances down the track
   */
  public update(playerZ: number) {
    for (const chunk of this.chunks) {
      // If chunk is far behind player, recycle it ahead of the furthest chunk
      if (chunk.position.z > playerZ + CHUNK_LENGTH) {
        // Find most negative chunk z
        let minZ = 0;
        for (const c of this.chunks) {
          if (c.position.z < minZ) {
            minZ = c.position.z;
          }
        }
        chunk.position.z = minZ - CHUNK_LENGTH;
      }
    }
  }

  public reset() {
    for (let i = 0; i < TOTAL_CHUNKS; i++) {
      this.chunks[i].position.z = -i * CHUNK_LENGTH;
    }
  }

  public dispose() {
    this.trackMaterial.dispose();
    this.curbMaterial.dispose();
    this.laneDividerMaterial.dispose();
    this.buildingMaterials.forEach(m => m.dispose());
    this.neonMaterials.forEach(m => m.dispose());
  }
}
