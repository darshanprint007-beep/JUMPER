/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import * as THREE from 'three';

export type CharacterSkin = 'sakura' | 'cyber' | 'solar';

export interface SkinPalette {
  name: string;
  hair: number;
  jacket: number;
  jacketAccent: number;
  skin: number;
  pants: number;
  shoes: number;
  shoeSole: number;
  glow: number;
}

export const SKINS: Record<CharacterSkin, SkinPalette> = {
  sakura: {
    name: 'Sakura Spark',
    hair: 0xff66aa, // vibrant anime pink
    jacket: 0x06b6d4, // cyan
    jacketAccent: 0xf43f5e, // neon rose
    skin: 0xffdfd0, // soft anime peach
    pants: 0x1e1e2e, // deep indigo
    shoes: 0xd946ef, // magenta
    shoeSole: 0x38bdf8, // glowing sky blue
    glow: 0xec4899,
  },
  cyber: {
    name: 'Cyber Runner',
    hair: 0x00d2ff, // electric neon blue
    jacket: 0x111827, // obsidian black
    jacketAccent: 0xfacc15, // electric yellow
    skin: 0xffe2d1, // anime skin
    pants: 0x1f2937, // dark gray
    shoes: 0xfacc15, // gold
    shoeSole: 0x00f0ff, // cyan neon
    glow: 0x00ffff,
  },
  solar: {
    name: 'Solar Blaze',
    hair: 0xff4500, // fiery crimson orange
    jacket: 0xf8fafc, // pure white
    jacketAccent: 0xe11d48, // ruby crimson
    skin: 0xffe4cc,
    pants: 0x0f172a, // dark navy
    shoes: 0xe11d48, // crimson
    shoeSole: 0xffaa00, // bright amber
    glow: 0xff6600,
  },
};

// Generates procedural canvas texture for cute anime face with sparkling eyes
function createAnimeFaceTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d')!;

  // Background skin tone
  ctx.fillStyle = '#ffdfd0';
  ctx.fillRect(0, 0, 512, 512);

  // Soft anime blush
  const blushGradL = ctx.createRadialGradient(160, 310, 10, 160, 310, 55);
  blushGradL.addColorStop(0, 'rgba(255, 105, 180, 0.55)');
  blushGradL.addColorStop(1, 'rgba(255, 105, 180, 0)');
  ctx.fillStyle = blushGradL;
  ctx.beginPath();
  ctx.arc(160, 310, 55, 0, Math.PI * 2);
  ctx.fill();

  const blushGradR = ctx.createRadialGradient(352, 310, 10, 352, 310, 55);
  blushGradR.addColorStop(0, 'rgba(255, 105, 180, 0.55)');
  blushGradR.addColorStop(1, 'rgba(255, 105, 180, 0)');
  ctx.fillStyle = blushGradR;
  ctx.beginPath();
  ctx.arc(352, 310, 55, 0, Math.PI * 2);
  ctx.fill();

  // Draw expressive anime eyes
  const drawEye = (centerX: number, centerY: number) => {
    // Eyelash line (dark anime curve)
    ctx.lineWidth = 14;
    ctx.strokeStyle = '#1e1b4b';
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.arc(centerX, centerY - 25, 45, Math.PI * 1.1, Math.PI * 1.9);
    ctx.stroke();

    // Upper outer wing
    ctx.lineWidth = 9;
    ctx.beginPath();
    const dir = centerX < 256 ? -1 : 1;
    ctx.moveTo(centerX + dir * 42, centerY - 25);
    ctx.lineTo(centerX + dir * 55, centerY - 32);
    ctx.stroke();

    // Eye Sclera (White base)
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.ellipse(centerX, centerY, 38, 48, 0, 0, Math.PI * 2);
    ctx.fill();

    // Iris (Deep anime gradient)
    const irisGrad = ctx.createLinearGradient(centerX, centerY - 45, centerX, centerY + 45);
    irisGrad.addColorStop(0, '#0284c7'); // Top deep cyan/blue
    irisGrad.addColorStop(0.6, '#38bdf8'); // Middle bright
    irisGrad.addColorStop(1, '#a7f3d0'); // Bottom mint glow
    ctx.fillStyle = irisGrad;
    ctx.beginPath();
    ctx.ellipse(centerX, centerY + 2, 30, 42, 0, 0, Math.PI * 2);
    ctx.fill();

    // Pupil
    ctx.fillStyle = '#0f172a';
    ctx.beginPath();
    ctx.ellipse(centerX, centerY, 15, 22, 0, 0, Math.PI * 2);
    ctx.fill();

    // Sparkling highlights (anime sparkle)
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.ellipse(centerX - 10, centerY - 14, 11, 14, -0.3, 0, Math.PI * 2);
    ctx.fill();

    ctx.beginPath();
    ctx.arc(centerX + 12, centerY + 14, 6, 0, Math.PI * 2);
    ctx.fill();

    // Tiny twinkle star
    ctx.beginPath();
    ctx.arc(centerX - 8, centerY + 18, 3.5, 0, Math.PI * 2);
    ctx.fill();
  };

  drawEye(170, 240);
  drawEye(342, 240);

  // Tiny cute anime nose
  ctx.fillStyle = '#f472b6';
  ctx.beginPath();
  ctx.arc(256, 315, 3.5, 0, Math.PI * 2);
  ctx.fill();

  // Cute cheerful anime mouth
  ctx.strokeStyle = '#e11d48';
  ctx.lineWidth = 5;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.arc(256, 335, 16, 0.2, Math.PI - 0.2);
  ctx.stroke();

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

export class AnimeCharacter {
  public group: THREE.Group;
  private skinPalette: SkinPalette;

  // Hierarchical body parts for smooth natural kinematics
  private rootPivot: THREE.Group;
  private hips: THREE.Group;
  private torso: THREE.Group;
  private head: THREE.Group;
  private hairBangs: THREE.Group;
  private leftPigtail: THREE.Group;
  private rightPigtail: THREE.Group;

  private leftArmPivot: THREE.Group;
  private rightArmPivot: THREE.Group;
  private leftLegPivot: THREE.Group;
  private rightLegPivot: THREE.Group;
  private leftForeleg: THREE.Group;
  private rightForeleg: THREE.Group;

  // Thruster glow & slide spark meshes
  private leftThruster: THREE.Mesh;
  private rightThruster: THREE.Mesh;
  private slideAura: THREE.Mesh;

  // Materials map for dynamic skin switching
  private materials: {
    hair: THREE.MeshStandardMaterial;
    jacket: THREE.MeshStandardMaterial;
    jacketAccent: THREE.MeshStandardMaterial;
    skin: THREE.MeshStandardMaterial;
    face: THREE.MeshStandardMaterial;
    pants: THREE.MeshStandardMaterial;
    shoes: THREE.MeshStandardMaterial;
    shoeSole: THREE.MeshStandardMaterial;
    visor: THREE.MeshStandardMaterial;
  };

  // Animation cycle states
  private runTime: number = 0;
  private flipAngle: number = 0;

  constructor(skinKey: CharacterSkin = 'sakura') {
    this.group = new THREE.Group();
    this.skinPalette = SKINS[skinKey];

    // Build materials
    const faceTexture = createAnimeFaceTexture();
    this.materials = {
      hair: new THREE.MeshStandardMaterial({
        color: this.skinPalette.hair,
        roughness: 0.35,
        metalness: 0.1,
      }),
      jacket: new THREE.MeshStandardMaterial({
        color: this.skinPalette.jacket,
        roughness: 0.4,
        metalness: 0.2,
      }),
      jacketAccent: new THREE.MeshStandardMaterial({
        color: this.skinPalette.jacketAccent,
        roughness: 0.25,
        metalness: 0.3,
        emissive: this.skinPalette.jacketAccent,
        emissiveIntensity: 0.4,
      }),
      skin: new THREE.MeshStandardMaterial({
        color: this.skinPalette.skin,
        roughness: 0.6,
      }),
      face: new THREE.MeshStandardMaterial({
        map: faceTexture,
        roughness: 0.6,
      }),
      pants: new THREE.MeshStandardMaterial({
        color: this.skinPalette.pants,
        roughness: 0.5,
      }),
      shoes: new THREE.MeshStandardMaterial({
        color: this.skinPalette.shoes,
        roughness: 0.3,
        metalness: 0.2,
      }),
      shoeSole: new THREE.MeshStandardMaterial({
        color: this.skinPalette.shoeSole,
        emissive: this.skinPalette.shoeSole,
        emissiveIntensity: 0.7,
        roughness: 0.2,
      }),
      visor: new THREE.MeshStandardMaterial({
        color: 0x00f0ff,
        emissive: 0x00f0ff,
        emissiveIntensity: 0.6,
        roughness: 0.1,
        transparent: true,
        opacity: 0.85,
      }),
    };

    // Construct hierarchical character rig
    this.rootPivot = new THREE.Group();
    this.group.add(this.rootPivot);

    // Hips
    this.hips = new THREE.Group();
    this.hips.position.y = 0.95;
    this.rootPivot.add(this.hips);

    const hipsGeo = new THREE.BoxGeometry(0.38, 0.22, 0.28);
    const hipsMesh = new THREE.Mesh(hipsGeo, this.materials.pants);
    hipsMesh.castShadow = true;
    this.hips.add(hipsMesh);

    // Torso (Anime sports hoodie/jacket)
    this.torso = new THREE.Group();
    this.torso.position.y = 0.2;
    this.hips.add(this.torso);

    const torsoGeo = new THREE.BoxGeometry(0.44, 0.5, 0.3);
    const torsoMesh = new THREE.Mesh(torsoGeo, this.materials.jacket);
    torsoMesh.position.y = 0.22;
    torsoMesh.castShadow = true;
    this.torso.add(torsoMesh);

    // Cyber Runner Backpack / Jetpack
    const packGeo = new THREE.BoxGeometry(0.28, 0.32, 0.16);
    const packMesh = new THREE.Mesh(packGeo, this.materials.jacketAccent);
    packMesh.position.set(0, 0.24, -0.2);
    packMesh.castShadow = true;
    this.torso.add(packMesh);

    // Collar / Hoodie trim
    const collarGeo = new THREE.TorusGeometry(0.18, 0.05, 8, 16);
    const collarMesh = new THREE.Mesh(collarGeo, this.materials.jacketAccent);
    collarMesh.rotation.x = Math.PI / 2;
    collarMesh.position.set(0, 0.48, 0);
    this.torso.add(collarMesh);

    // Head
    this.head = new THREE.Group();
    this.head.position.y = 0.52;
    this.torso.add(this.head);

    // Anime Head Sphere/Cube
    const headGeo = new THREE.SphereGeometry(0.24, 16, 16);
    headGeo.scale(1, 1.05, 0.95);
    const headMesh = new THREE.Mesh(headGeo, this.materials.face);
    headMesh.position.y = 0.22;
    headMesh.castShadow = true;
    this.head.add(headMesh);

    // Anime Visor / Sports Headband
    const visorGeo = new THREE.CylinderGeometry(0.26, 0.26, 0.08, 16, 1, true, 0, Math.PI);
    const visorMesh = new THREE.Mesh(visorGeo, this.materials.visor);
    visorMesh.rotation.y = -Math.PI / 2;
    visorMesh.position.set(0, 0.29, 0.06);
    this.head.add(visorMesh);

    // Anime Hair Group
    this.hairBangs = new THREE.Group();
    this.head.add(this.hairBangs);

    // Main Hair Cap
    const hairCapGeo = new THREE.SphereGeometry(0.265, 16, 14, 0, Math.PI * 2, 0, Math.PI * 0.65);
    const hairCapMesh = new THREE.Mesh(hairCapGeo, this.materials.hair);
    hairCapMesh.position.y = 0.24;
    this.hairBangs.add(hairCapMesh);

    // Anime Hair Tufts / Bangs (Front spikes)
    for (let i = -2; i <= 2; i++) {
      const tuftGeo = new THREE.ConeGeometry(0.06, 0.2, 5);
      const tuftMesh = new THREE.Mesh(tuftGeo, this.materials.hair);
      tuftMesh.rotation.x = -Math.PI * 0.85;
      tuftMesh.rotation.z = (i * 0.2);
      tuftMesh.position.set(i * 0.08, 0.32, 0.22);
      this.hairBangs.add(tuftMesh);
    }

    // Dynamic Anime Twin-tails / Ponytails
    this.leftPigtail = new THREE.Group();
    this.leftPigtail.position.set(-0.25, 0.32, -0.05);
    this.head.add(this.leftPigtail);

    this.rightPigtail = new THREE.Group();
    this.rightPigtail.position.set(0.25, 0.32, -0.05);
    this.head.add(this.rightPigtail);

    // Left pigtail hair segments
    const ptRibbonGeo = new THREE.TorusGeometry(0.05, 0.02, 6, 12);
    const lRibbon = new THREE.Mesh(ptRibbonGeo, this.materials.jacketAccent);
    this.leftPigtail.add(lRibbon);
    const rRibbon = new THREE.Mesh(ptRibbonGeo, this.materials.jacketAccent);
    this.rightPigtail.add(rRibbon);

    const ptHairGeo = new THREE.ConeGeometry(0.09, 0.42, 6);
    ptHairGeo.translate(0, -0.21, 0);

    const lPtMesh = new THREE.Mesh(ptHairGeo, this.materials.hair);
    lPtMesh.rotation.z = 0.35;
    lPtMesh.rotation.x = -0.2;
    this.leftPigtail.add(lPtMesh);

    const rPtMesh = new THREE.Mesh(ptHairGeo, this.materials.hair);
    rPtMesh.rotation.z = -0.35;
    rPtMesh.rotation.x = -0.2;
    this.rightPigtail.add(rPtMesh);

    // ARMS
    this.leftArmPivot = new THREE.Group();
    this.leftArmPivot.position.set(-0.28, 0.4, 0);
    this.torso.add(this.leftArmPivot);

    this.rightArmPivot = new THREE.Group();
    this.rightArmPivot.position.set(0.28, 0.4, 0);
    this.torso.add(this.rightArmPivot);

    const armGeo = new THREE.BoxGeometry(0.12, 0.45, 0.12);
    armGeo.translate(0, -0.2, 0);

    const lArmMesh = new THREE.Mesh(armGeo, this.materials.jacket);
    lArmMesh.castShadow = true;
    this.leftArmPivot.add(lArmMesh);

    const rArmMesh = new THREE.Mesh(armGeo, this.materials.jacket);
    rArmMesh.castShadow = true;
    this.rightArmPivot.add(rArmMesh);

    // Gloves
    const gloveGeo = new THREE.BoxGeometry(0.14, 0.12, 0.14);
    gloveGeo.translate(0, -0.38, 0);
    const lGlove = new THREE.Mesh(gloveGeo, this.materials.jacketAccent);
    this.leftArmPivot.add(lGlove);
    const rGlove = new THREE.Mesh(gloveGeo, this.materials.jacketAccent);
    this.rightArmPivot.add(rGlove);

    // LEGS
    this.leftLegPivot = new THREE.Group();
    this.leftLegPivot.position.set(-0.14, 0, 0);
    this.hips.add(this.leftLegPivot);

    this.rightLegPivot = new THREE.Group();
    this.rightLegPivot.position.set(0.14, 0, 0);
    this.hips.add(this.rightLegPivot);

    const upperLegGeo = new THREE.BoxGeometry(0.14, 0.45, 0.15);
    upperLegGeo.translate(0, -0.22, 0);

    const lUpperLeg = new THREE.Mesh(upperLegGeo, this.materials.pants);
    lUpperLeg.castShadow = true;
    this.leftLegPivot.add(lUpperLeg);

    const rUpperLeg = new THREE.Mesh(upperLegGeo, this.materials.pants);
    rUpperLeg.castShadow = true;
    this.rightLegPivot.add(rUpperLeg);

    // Forelegs / Shins
    this.leftForeleg = new THREE.Group();
    this.leftForeleg.position.set(0, -0.44, 0);
    this.leftLegPivot.add(this.leftForeleg);

    this.rightForeleg = new THREE.Group();
    this.rightForeleg.position.set(0, -0.44, 0);
    this.rightLegPivot.add(this.rightForeleg);

    const shinGeo = new THREE.BoxGeometry(0.13, 0.45, 0.14);
    shinGeo.translate(0, -0.22, 0);
    const lShin = new THREE.Mesh(shinGeo, this.materials.pants);
    lShin.castShadow = true;
    this.leftForeleg.add(lShin);

    const rShin = new THREE.Mesh(shinGeo, this.materials.pants);
    rShin.castShadow = true;
    this.rightForeleg.add(rShin);

    // Futuristic Anime Running Sneakers
    const shoeGeo = new THREE.BoxGeometry(0.16, 0.18, 0.32);
    shoeGeo.translate(0, -0.44, 0.06);
    const lShoe = new THREE.Mesh(shoeGeo, this.materials.shoes);
    lShoe.castShadow = true;
    this.leftForeleg.add(lShoe);

    const rShoe = new THREE.Mesh(shoeGeo, this.materials.shoes);
    rShoe.castShadow = true;
    this.rightForeleg.add(rShoe);

    // Glowing Neon Soles
    const soleGeo = new THREE.BoxGeometry(0.17, 0.05, 0.33);
    soleGeo.translate(0, -0.52, 0.06);
    const lSole = new THREE.Mesh(soleGeo, this.materials.shoeSole);
    this.leftForeleg.add(lSole);

    const rSole = new THREE.Mesh(soleGeo, this.materials.shoeSole);
    this.rightForeleg.add(rSole);

    // Thruster Jets behind shoes
    const thrusterGeo = new THREE.ConeGeometry(0.04, 0.12, 6);
    thrusterGeo.rotateX(-Math.PI / 2);

    this.leftThruster = new THREE.Mesh(thrusterGeo, this.materials.shoeSole);
    this.leftThruster.position.set(0, -0.48, -0.15);
    this.leftForeleg.add(this.leftThruster);

    this.rightThruster = new THREE.Mesh(thrusterGeo, this.materials.shoeSole);
    this.rightThruster.position.set(0, -0.48, -0.15);
    this.rightForeleg.add(this.rightThruster);

    // Sliding energy aura (activated when sliding)
    const auraGeo = new THREE.CylinderGeometry(0.45, 0.6, 0.2, 12);
    const auraMat = new THREE.MeshBasicMaterial({
      color: this.skinPalette.glow,
      transparent: true,
      opacity: 0,
      wireframe: true,
    });
    this.slideAura = new THREE.Mesh(auraGeo, auraMat);
    this.slideAura.position.set(0, 0.1, 0);
    this.group.add(this.slideAura);

    // Ensure character faces forward along +Z or -Z (running into scene = towards -Z or along +Z)
    // Game is viewed from behind, character runs along -Z (or hurdles approach along +Z)
    this.group.rotation.y = Math.PI; // Face down the track
  }

  public setSkin(skinKey: CharacterSkin) {
    this.skinPalette = SKINS[skinKey];
    this.materials.hair.color.setHex(this.skinPalette.hair);
    this.materials.jacket.color.setHex(this.skinPalette.jacket);
    this.materials.jacketAccent.color.setHex(this.skinPalette.jacketAccent);
    this.materials.jacketAccent.emissive.setHex(this.skinPalette.jacketAccent);
    this.materials.pants.color.setHex(this.skinPalette.pants);
    this.materials.shoes.color.setHex(this.skinPalette.shoes);
    this.materials.shoeSole.color.setHex(this.skinPalette.shoeSole);
    this.materials.shoeSole.emissive.setHex(this.skinPalette.shoeSole);
    (this.slideAura.material as THREE.MeshBasicMaterial).color.setHex(this.skinPalette.glow);
  }

  /**
   * Update animation state based on gameplay mode
   */
  public update(
    delta: number,
    state: 'running' | 'jumping' | 'sliding' | 'crashed' | 'idle',
    speed: number,
    jumpProgress: number = 0, // 0..1 in jump arc
    isDoubleJump: boolean = false
  ) {
    const runFreq = speed * 0.55; // Legs step faster at high speeds
    this.runTime += delta * runFreq;

    if (state === 'running') {
      this.flipAngle = 0;
      this.rootPivot.position.y = 0;
      this.rootPivot.rotation.x = 0.15; // Sleek forward athletic lean
      this.rootPivot.rotation.z = 0;
      (this.slideAura.material as THREE.MeshBasicMaterial).opacity = 0;

      // Leg swing
      const legAngle = Math.sin(this.runTime) * 0.75;
      this.leftLegPivot.rotation.x = legAngle;
      this.rightLegPivot.rotation.x = -legAngle;

      // Knee bend on back swing
      this.leftForeleg.rotation.x = Math.max(0, -legAngle * 1.2);
      this.rightForeleg.rotation.x = Math.max(0, legAngle * 1.2);

      // Arm swing in opposition
      this.leftArmPivot.rotation.x = -legAngle * 0.9;
      this.rightArmPivot.rotation.x = legAngle * 0.9;
      this.leftArmPivot.rotation.z = -0.2;
      this.rightArmPivot.rotation.z = 0.2;

      // Head and torso natural bounce
      const bounce = Math.abs(Math.sin(this.runTime * 2)) * 0.08;
      this.hips.position.y = 0.95 + bounce;
      this.torso.rotation.y = Math.sin(this.runTime) * 0.12;
      this.head.rotation.x = -0.15 - bounce * 0.5;

      // Dynamic hair flutter
      const hairSway = Math.sin(this.runTime * 2) * 0.15;
      this.leftPigtail.rotation.x = -0.4 - hairSway;
      this.rightPigtail.rotation.x = -0.4 - hairSway;

    } else if (state === 'jumping') {
      (this.slideAura.material as THREE.MeshBasicMaterial).opacity = 0;

      if (isDoubleJump) {
        // Dramatic 360 front flip!
        this.flipAngle += delta * 12;
        this.rootPivot.rotation.x = this.flipAngle;
        this.rootPivot.position.y = 0;

        // Tuck limbs during flip
        this.leftLegPivot.rotation.x = 1.3;
        this.rightLegPivot.rotation.x = 1.3;
        this.leftForeleg.rotation.x = 1.6;
        this.rightForeleg.rotation.x = 1.6;
        this.leftArmPivot.rotation.x = 1.5;
        this.rightArmPivot.rotation.x = 1.5;
      } else {
        this.flipAngle = 0;
        this.rootPivot.rotation.x = -0.1;
        this.rootPivot.position.y = 0;

        // Dynamic jump pose: one leg tucked, one trailing, arms up
        this.leftLegPivot.rotation.x = -0.6;
        this.rightLegPivot.rotation.x = 0.8;
        this.leftForeleg.rotation.x = 0.2;
        this.rightForeleg.rotation.x = 1.3;

        this.leftArmPivot.rotation.x = -1.6; // Arms thrown forward/up
        this.rightArmPivot.rotation.x = -1.4;
        this.leftArmPivot.rotation.z = -0.3;
        this.rightArmPivot.rotation.z = 0.3;

        // Hair flows backwards in the wind
        this.leftPigtail.rotation.x = -0.9;
        this.rightPigtail.rotation.x = -0.9;
      }

    } else if (state === 'sliding') {
      this.flipAngle = 0;
      // Drop low to the ground and lean back
      this.rootPivot.position.y = -0.55; // Character drops low
      this.rootPivot.rotation.x = -0.85; // Recline back for athletic slide
      this.rootPivot.rotation.z = 0.15;

      // Slide aura glow
      (this.slideAura.material as THREE.MeshBasicMaterial).opacity = 0.6;
      this.slideAura.rotation.y += delta * 10;

      // Front leg extended forward, back knee bent
      this.leftLegPivot.rotation.x = -1.4;
      this.leftForeleg.rotation.x = 0.1;

      this.rightLegPivot.rotation.x = 0.6;
      this.rightForeleg.rotation.x = 1.8;

      // Arms balanced outwards
      this.leftArmPivot.rotation.x = 0.4;
      this.leftArmPivot.rotation.z = -0.7;
      this.rightArmPivot.rotation.x = -0.8;
      this.rightArmPivot.rotation.z = 0.6;

      // Head looks forward under the obstacle
      this.head.rotation.x = 0.7;

      // Hair trails along the ground
      this.leftPigtail.rotation.x = 0.3;
      this.rightPigtail.rotation.x = 0.3;

    } else if (state === 'crashed') {
      // Reeling back tumble
      this.rootPivot.position.y = -0.4;
      this.rootPivot.rotation.x = THREE.MathUtils.damp(this.rootPivot.rotation.x, -1.8, 10, delta);
      this.rootPivot.rotation.z = THREE.MathUtils.damp(this.rootPivot.rotation.z, 0.8, 8, delta);
      (this.slideAura.material as THREE.MeshBasicMaterial).opacity = 0;

      // Limbs splay
      this.leftArmPivot.rotation.set(-1.2, 0, -1.0);
      this.rightArmPivot.rotation.set(-1.4, 0, 1.0);
      this.leftLegPivot.rotation.set(0.8, 0, -0.6);
      this.rightLegPivot.rotation.set(-0.5, 0, 0.6);

    } else if (state === 'idle') {
      this.flipAngle = 0;
      this.rootPivot.position.y = 0;
      this.rootPivot.rotation.set(0, 0, 0);
      (this.slideAura.material as THREE.MeshBasicMaterial).opacity = 0;

      // Gentle anime idle breath
      const idle = Math.sin(this.runTime * 0.8) * 0.05;
      this.hips.position.y = 0.95 + idle;
      this.torso.rotation.set(0, 0, 0);
      this.head.rotation.set(idle * 0.5, 0, 0);

      this.leftArmPivot.rotation.set(0.1, 0, -0.2);
      this.rightArmPivot.rotation.set(0.1, 0, 0.2);
      this.leftLegPivot.rotation.set(0, 0, 0);
      this.rightLegPivot.rotation.set(0, 0, 0);
      this.leftForeleg.rotation.set(0, 0, 0);
      this.rightForeleg.rotation.set(0, 0, 0);
      this.leftPigtail.rotation.set(-0.2, 0, 0);
      this.rightPigtail.rotation.set(-0.2, 0, 0);
    }
  }

  public dispose() {
    Object.values(this.materials).forEach(mat => {
      if (mat.map) mat.map.dispose();
      mat.dispose();
    });
  }
}
