import * as THREE from 'three';
import { Building } from '../Building.js';

export class Blacksmith extends Building {
  constructor(game, options = {}) {
    super(game, {
      ...options,
      name: options.name || 'ပန်းပဲဖိုနှင့် လက်နက်တိုက် (Blacksmith)',
      type: 'blacksmith',
      hp: options.hp || 800,
      size: 4
    });

    this.tier = options.tier || 1;
    this.createBlacksmith3DModel();
  }

  createBlacksmith3DModel() {
    if (this.tier === 3) {
      this._buildBlacksmithTier3();
    } else if (this.tier === 2) {
      this._buildBlacksmithTier2();
    } else {
      this._buildBlacksmithTier1();
    }
  }

  // ─── Tier 1: Original wooden blacksmith ───────────────────────────────────
  _buildBlacksmithTier1() {
    const brickMat = new THREE.MeshStandardMaterial({ color: 0x873600, roughness: 0.85 });
    const woodMat  = new THREE.MeshStandardMaterial({ color: 0x4a2311, roughness: 0.8 });
    const ironMat  = new THREE.MeshStandardMaterial({ color: 0x2c3e50, metalness: 0.85, roughness: 0.3 });
    const fireMat  = new THREE.MeshStandardMaterial({
      color: 0xff3300, emissive: 0xff2200, emissiveIntensity: 0.8, roughness: 0.2
    });
    const roofMat  = new THREE.MeshStandardMaterial({ color: 0x78281f, roughness: 0.6 });

    this.modelGroup = new THREE.Group();

    // Stone/Brick Base
    const base = new THREE.Mesh(new THREE.BoxGeometry(4.4, 0.25, 4.4), brickMat);
    base.position.y = 0.125;
    this.modelGroup.add(base);

    // Furnace & Chimney
    const furnace = new THREE.Mesh(new THREE.BoxGeometry(1.6, 1.4, 1.6), brickMat);
    furnace.position.set(-1.0, 0.8, -1.0);
    this.modelGroup.add(furnace);

    const chimney = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.45, 2.2, 8), brickMat);
    chimney.position.set(-1.0, 2.4, -1.0);
    this.modelGroup.add(chimney);

    const fire = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.5, 0.8), fireMat);
    fire.position.set(-1.0, 0.5, -0.4);
    this.modelGroup.add(fire);

    // Anvil
    const stump = new THREE.Mesh(new THREE.CylinderGeometry(0.4, 0.45, 0.6, 8), woodMat);
    stump.position.set(0.6, 0.4, 0.4);
    this.modelGroup.add(stump);

    const anvilBase = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.2, 0.7), ironMat);
    anvilBase.position.set(0.6, 0.75, 0.4);
    this.modelGroup.add(anvilBase);

    const anvilHorn = new THREE.Mesh(new THREE.ConeGeometry(0.12, 0.4, 6), ironMat);
    anvilHorn.position.set(0.6, 0.78, 0.8);
    anvilHorn.rotation.x = Math.PI / 2;
    this.modelGroup.add(anvilHorn);

    // Quenching Trough
    const trough = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.4, 1.2), woodMat);
    trough.position.set(1.4, 0.3, -0.4);
    this.modelGroup.add(trough);

    const water = new THREE.Mesh(new THREE.PlaneGeometry(0.5, 1.0),
      new THREE.MeshStandardMaterial({ color: 0x1b4f72, roughness: 0.1 }));
    water.rotation.x = -Math.PI / 2;
    water.position.set(1.4, 0.48, -0.4);
    this.modelGroup.add(water);

    // Hot Sword on Anvil
    const hotSword = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.04, 0.6),
      new THREE.MeshStandardMaterial({ color: 0xff3300, emissive: 0xff4400, emissiveIntensity: 0.8 }));
    hotSword.position.set(0.6, 0.88, 0.4);
    this.modelGroup.add(hotSword);

    // Roof posts
    [[-1.8, 1.0, 1.8], [1.8, 1.0, 1.8], [1.8, 1.0, -1.8]].forEach(p => {
      const post = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 2.0, 6), woodMat);
      post.position.set(p[0], p[1], p[2]);
      this.modelGroup.add(post);
    });

    const roof = new THREE.Mesh(new THREE.BoxGeometry(4.2, 0.25, 4.2), roofMat);
    roof.position.set(0, 2.1, 0);
    roof.rotation.x = 0.08;
    this.modelGroup.add(roof);

    this.mesh.add(this.modelGroup);
    this.createHpBar(2.6, 0.18, 3.8);
  }

  // ─── Tier 2: ကျောက်ပန်းပဲဖို (Stone Forge) ───────────────────────────────
  _buildBlacksmithTier2() {
    const stoneMat  = new THREE.MeshStandardMaterial({ color: 0x7f8c8d, roughness: 0.9 });
    const brickMat  = new THREE.MeshStandardMaterial({ color: 0x922b21, roughness: 0.85 });
    const woodMat   = new THREE.MeshStandardMaterial({ color: 0x4e342e, roughness: 0.8 });
    const ironMat   = new THREE.MeshStandardMaterial({ color: 0x2c3e50, metalness: 0.85, roughness: 0.3 });
    const forgeMat  = new THREE.MeshStandardMaterial({
      color: 0xff9900, emissive: 0xff6600, emissiveIntensity: 0.6, roughness: 0.2
    });
    const smokeMat  = new THREE.MeshStandardMaterial({
      color: 0x555555, emissive: 0x333333, emissiveIntensity: 0.3,
      transparent: true, opacity: 0.7
    });
    const roofMat   = new THREE.MeshStandardMaterial({ color: 0x78281f, roughness: 0.65 });

    this.modelGroup = new THREE.Group();

    // Wide stone base
    const base = new THREE.Mesh(new THREE.BoxGeometry(4.6, 0.3, 4.6), stoneMat);
    base.position.y = 0.15;
    this.modelGroup.add(base);

    // Stone walls (4.0 x 2.0 x 4.0 box — open front)
    const wallBack = new THREE.Mesh(new THREE.BoxGeometry(4.0, 2.0, 0.3), stoneMat);
    wallBack.position.set(0, 1.3, -1.85);
    this.modelGroup.add(wallBack);

    const wallLeft = new THREE.Mesh(new THREE.BoxGeometry(0.3, 2.0, 4.0), stoneMat);
    wallLeft.position.set(-1.85, 1.3, 0);
    this.modelGroup.add(wallLeft);

    const wallRight = new THREE.Mesh(new THREE.BoxGeometry(0.3, 2.0, 4.0), stoneMat);
    wallRight.position.set(1.85, 1.3, 0);
    this.modelGroup.add(wallRight);

    // Large chimney / smokestack
    const chimneyBody = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.5, 2.8, 8), brickMat);
    chimneyBody.position.set(-1.2, 2.3, -1.5);
    this.modelGroup.add(chimneyBody);

    // Smoke particle sphere on top
    const smokeTop = new THREE.Mesh(new THREE.SphereGeometry(0.4, 8, 8), smokeMat);
    smokeTop.position.set(-1.2, 3.85, -1.5);
    this.modelGroup.add(smokeTop);

    // Second smaller chimney / vent
    const vent = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.25, 1.4, 8), brickMat);
    vent.position.set(0.6, 2.4, -1.5);
    this.modelGroup.add(vent);

    // Forge pit with emissive glow
    const forgeBox = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.6, 1.4), stoneMat);
    forgeBox.position.set(-1.0, 0.6, -0.8);
    this.modelGroup.add(forgeBox);

    const forgeFire = new THREE.Mesh(new THREE.BoxGeometry(1.0, 0.35, 1.0), forgeMat);
    forgeFire.position.set(-1.0, 0.75, -0.8);
    this.modelGroup.add(forgeFire);

    // Weapon rack — swords (thin boxes)
    for (let i = 0; i < 4; i++) {
      const blade = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.6, 0.04), ironMat);
      blade.position.set(1.5, 1.2 + i * 0.1, -1.5 + i * 0.3);
      blade.rotation.z = -0.15 + i * 0.1;
      this.modelGroup.add(blade);
    }

    // Rack back board
    const rack = new THREE.Mesh(new THREE.BoxGeometry(0.08, 1.0, 1.4), woodMat);
    rack.position.set(1.6, 1.0, -1.2);
    this.modelGroup.add(rack);

    // Anvil (larger, two-part)
    const anvilTop = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.18, 0.95), ironMat);
    anvilTop.position.set(0.5, 1.0, 0.5);
    this.modelGroup.add(anvilTop);

    const anvilTaper = new THREE.Mesh(new THREE.BoxGeometry(0.45, 0.6, 0.6), ironMat);
    anvilTaper.position.set(0.5, 0.65, 0.5);
    this.modelGroup.add(anvilTaper);

    // Shield shelving on wall
    const shelf = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.1, 0.25), woodMat);
    shelf.position.set(1.5, 1.4, -1.65);
    this.modelGroup.add(shelf);

    for (let i = 0; i < 2; i++) {
      const shield = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.28, 0.06, 8), ironMat);
      shield.position.set(1.5 - 0.5 + i * 0.65, 1.7, -1.6);
      shield.rotation.x = Math.PI / 2;
      this.modelGroup.add(shield);
    }

    // Roof with two vents
    const roofPanel = new THREE.Mesh(new THREE.BoxGeometry(4.2, 0.2, 4.2), roofMat);
    roofPanel.position.set(0, 2.4, 0);
    this.modelGroup.add(roofPanel);

    for (let i = 0; i < 2; i++) {
      const ventHole = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.25, 0.5), stoneMat);
      ventHole.position.set(-0.8 + i * 1.6, 2.6, 0.2);
      this.modelGroup.add(ventHole);
    }

    this.mesh.add(this.modelGroup);
    this.createHpBar(2.8, 0.18, 4.2);
  }

  // ─── Tier 3: နန်းတော် လက်နက်ဆိုင် (Royal Armory) ─────────────────────────
  _buildBlacksmithTier3() {
    const stoneMat  = new THREE.MeshStandardMaterial({ color: 0x7f8c8d, roughness: 0.9 });
    const brickMat  = new THREE.MeshStandardMaterial({ color: 0x922b21, roughness: 0.85 });
    const woodMat   = new THREE.MeshStandardMaterial({ color: 0x4e342e, roughness: 0.8 });
    const ironMat   = new THREE.MeshStandardMaterial({ color: 0x2c3e50, metalness: 0.85, roughness: 0.3 });
    const goldMat   = new THREE.MeshStandardMaterial({ color: 0xd4ac0d, metalness: 0.8, roughness: 0.2 });
    const forgeMat  = new THREE.MeshStandardMaterial({
      color: 0xff6600, emissive: 0xff4400, emissiveIntensity: 0.8, roughness: 0.1
    });
    const torchMat  = new THREE.MeshStandardMaterial({
      color: 0xff9900, emissive: 0xff6600, emissiveIntensity: 0.6
    });
    const roofMat   = new THREE.MeshStandardMaterial({ color: 0xa04000, roughness: 0.65 });

    this.modelGroup = new THREE.Group();

    // Large base platform
    const base = new THREE.Mesh(new THREE.BoxGeometry(5.6, 0.35, 5.6), stoneMat);
    base.position.y = 0.175;
    this.modelGroup.add(base);

    // Main armory building body (5.0 x 2.5 x 4.5)
    const building = new THREE.Mesh(new THREE.BoxGeometry(5.0, 2.5, 4.5), brickMat);
    building.position.set(0, 1.6, 0);
    this.modelGroup.add(building);

    // Crenellations on roof wall — alternating raised blocks
    for (let i = -2; i <= 2; i++) {
      if (i === 0) continue; // doorway gap
      const merlon = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.5, 0.3), stoneMat);
      merlon.position.set(i * 0.9, 3.1, -2.1);
      this.modelGroup.add(merlon);

      const merlonBack = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.5, 0.3), stoneMat);
      merlonBack.position.set(i * 0.9, 3.1, 2.1);
      this.modelGroup.add(merlonBack);
    }
    for (let i = -2; i <= 2; i++) {
      const merlonSide = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.5, 0.5), stoneMat);
      merlonSide.position.set(-2.5, 3.1, i * 0.75);
      this.modelGroup.add(merlonSide);

      const merlonSide2 = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.5, 0.5), stoneMat);
      merlonSide2.position.set(2.5, 3.1, i * 0.75);
      this.modelGroup.add(merlonSide2);
    }

    // Two massive chimneys with glow
    [[-1.4, -1.8], [1.0, -1.8]].forEach(([cx, cz]) => {
      const ch = new THREE.Mesh(new THREE.CylinderGeometry(0.38, 0.52, 3.2, 8), brickMat);
      ch.position.set(cx, 3.2, cz);
      this.modelGroup.add(ch);

      const glow = new THREE.Mesh(new THREE.SphereGeometry(0.3, 8, 8), torchMat);
      glow.position.set(cx, 4.9, cz);
      this.modelGroup.add(glow);
    });

    // Ornate carved doorway with golden arch
    const doorFrame = new THREE.Mesh(new THREE.BoxGeometry(1.4, 2.6, 0.2), stoneMat);
    doorFrame.position.set(0, 1.6, -2.15);
    this.modelGroup.add(doorFrame);

    const archTop = new THREE.Mesh(new THREE.CylinderGeometry(0.65, 0.65, 0.2, 12, 1, false, 0, Math.PI), goldMat);
    archTop.rotation.z = Math.PI / 2;
    archTop.rotation.y = Math.PI / 2;
    archTop.position.set(0, 2.9, -2.15);
    this.modelGroup.add(archTop);

    // Royal seal / emblem above door
    const seal = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.35, 0.08, 12), goldMat);
    seal.rotation.x = Math.PI / 2;
    seal.position.set(0, 3.5, -2.2);
    this.modelGroup.add(seal);

    // Display weapons on exterior walls — crossed swords
    for (let side = -1; side <= 1; side += 2) {
      const sword1 = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.8, 0.04), ironMat);
      sword1.position.set(side * 1.8, 2.0, -2.2);
      sword1.rotation.z = 0.4 * side;
      this.modelGroup.add(sword1);

      const sword2 = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.8, 0.04), ironMat);
      sword2.position.set(side * 1.8, 2.0, -2.2);
      sword2.rotation.z = -0.4 * side;
      this.modelGroup.add(sword2);

      const extShield = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.3, 0.07, 10), ironMat);
      extShield.rotation.x = Math.PI / 2;
      extShield.position.set(side * 2.2, 1.5, -2.2);
      this.modelGroup.add(extShield);
    }

    // Large war forge with intense glow
    const forgeBody = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.8, 1.6), stoneMat);
    forgeBody.position.set(-1.5, 0.75, 0.5);
    this.modelGroup.add(forgeBody);

    const forgeGlow = new THREE.Mesh(new THREE.BoxGeometry(1.1, 0.4, 1.1), forgeMat);
    forgeGlow.position.set(-1.5, 0.95, 0.5);
    this.modelGroup.add(forgeGlow);

    // Storage chests
    [[-0.5, 0.35, 1.5], [0.5, 0.35, 1.5], [1.5, 0.35, 0.5]].forEach(([cx, cy, cz]) => {
      const chest = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.45, 0.4), woodMat);
      chest.position.set(cx, cy, cz);
      this.modelGroup.add(chest);

      const lid = new THREE.Mesh(new THREE.BoxGeometry(0.62, 0.12, 0.42), woodMat);
      lid.position.set(cx, cy + 0.28, cz);
      this.modelGroup.add(lid);
    });

    // Decorative pillars at entrance with gold caps
    [-1.0, 1.0].forEach(px => {
      const pillar = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.22, 2.8, 8), stoneMat);
      pillar.position.set(px, 1.6, -2.5);
      this.modelGroup.add(pillar);

      const cap = new THREE.Mesh(new THREE.BoxGeometry(0.45, 0.2, 0.45), goldMat);
      cap.position.set(px, 3.1, -2.5);
      this.modelGroup.add(cap);
    });

    // 4 corner torches (emissive orange)
    [[-2.3, -2.1], [2.3, -2.1], [-2.3, 2.1], [2.3, 2.1]].forEach(([tx, tz]) => {
      const torchPole = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.6, 6), woodMat);
      torchPole.position.set(tx, 2.0, tz);
      this.modelGroup.add(torchPole);

      const flame = new THREE.Mesh(new THREE.SphereGeometry(0.14, 6, 6), torchMat);
      flame.position.set(tx, 2.4, tz);
      this.modelGroup.add(flame);
    });

    // Roof
    const roofPanel = new THREE.Mesh(new THREE.BoxGeometry(5.2, 0.25, 4.7), roofMat);
    roofPanel.position.set(0, 2.9, 0);
    this.modelGroup.add(roofPanel);

    this.mesh.add(this.modelGroup);
    this.createHpBar(3.2, 0.18, 4.8);
  }

  // ─── Rebuild model (for tier upgrades) ───────────────────────────────────
  rebuildModel() {
    const keep = new Set([
      this.hpBarGroup, this.selectionBoxMesh,
      this.rallyFlagGroup, this.scaffoldGroup, this.constructionUIGroup
    ]);
    const toRemove = this.mesh.children.filter(c => !keep.has(c));
    toRemove.forEach(c => this.mesh.remove(c));
    if (this.modelGroup) this.modelGroup = null;
    this.createBlacksmith3DModel();
  }
}
