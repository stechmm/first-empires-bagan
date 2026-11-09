import * as THREE from 'three';
import { Building } from '../Building.js';

export class Wall extends Building {
  constructor(game, options = {}) {
    super(game, {
      ...options,
      name: options.name || 'သစ်တပ်မြို့ရိုး (Palisade Wall)',
      type: 'wall',
      hp: options.hp || 450,
      size: 2.0,
      faction: options.faction || 'player'
    });

    this.tier = options.tier || 1;
    this._applyTierStats();
    this.createWallModel();
  }

  _applyTierStats() {
    if (this.tier === 3 && !this.options?.hp) {
      this.hp = Math.max(this.hp, 1800);
      this.maxHp = Math.max(this.maxHp, 1800);
    } else if (this.tier === 2 && !this.options?.hp) {
      this.hp = Math.max(this.hp, 1200);
      this.maxHp = Math.max(this.maxHp, 1200);
    }
  }

  createWallModel() {
    if (this.tier === 3) {
      this._buildWallTier3();
    } else if (this.tier === 2) {
      this._buildWallTier2();
    } else {
      this._buildWallTier1();
    }
  }

  // ─── Tier 1: Bamboo / Wood Palisade (original) ───────────────────────────
  _buildWallTier1() {
    const isEnemy   = this.faction === 'enemy';
    const woodColor  = isEnemy ? 0x212f3d : 0x5d4037;
    const ropeColor  = isEnemy ? 0x17202a : 0x873600;
    const moundColor = isEnemy ? 0x34495e : 0x6e2c00;

    const woodMat  = new THREE.MeshStandardMaterial({ color: woodColor, roughness: 0.85 });
    const ropeMat  = new THREE.MeshStandardMaterial({ color: ropeColor, roughness: 0.9 });
    const moundMat = new THREE.MeshStandardMaterial({ color: moundColor, roughness: 0.95 });

    // Earthen Foundation Mound
    const mound = new THREE.Mesh(new THREE.BoxGeometry(2.1, 0.35, 1.2), moundMat);
    mound.position.y = 0.17;
    mound.castShadow = true;
    mound.receiveShadow = true;
    this.mesh.add(mound);

    // Sharpened Teak Logs (Palisade Pales)
    const logGeo = new THREE.CylinderGeometry(0.18, 0.22, 2.6, 7);
    const tipGeo = new THREE.ConeGeometry(0.18, 0.5, 7);

    const logXPositions = [-0.75, -0.25, 0.25, 0.75];
    logXPositions.forEach((lx, i) => {
      const logGroup = new THREE.Group();
      const logHeight = 2.4 + (i % 2 === 0 ? 0.3 : 0);

      const post = new THREE.Mesh(logGeo, woodMat);
      post.position.y = logHeight / 2;
      post.castShadow = true;
      logGroup.add(post);

      const tip = new THREE.Mesh(tipGeo, woodMat);
      tip.position.y = logHeight + 0.25;
      tip.castShadow = true;
      logGroup.add(tip);

      logGroup.position.set(lx, 0.25, (Math.random() - 0.5) * 0.1);
      logGroup.rotation.z = (Math.random() - 0.5) * 0.05;
      this.mesh.add(logGroup);
    });

    // Horizontal Support Binding Timbers
    const crossbeamGeo = new THREE.BoxGeometry(2.0, 0.15, 0.15);
    const topCross = new THREE.Mesh(crossbeamGeo, woodMat);
    topCross.position.set(0, 1.8, 0.24);
    this.mesh.add(topCross);

    const bottomCross = new THREE.Mesh(crossbeamGeo, woodMat);
    bottomCross.position.set(0, 0.9, 0.24);
    this.mesh.add(bottomCross);

    // Rattan Rope Bindings
    logXPositions.forEach(lx => {
      const rope = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.22, 0.32), ropeMat);
      rope.position.set(lx, 1.8, 0.12);
      this.mesh.add(rope);
    });

    this.createHpBar(1.8, 0.15, 3.6);
  }

  // ─── Tier 2: ကျောက်တပ်မြို့ရိုး (Stone Wall) — HP 1200 ──────────────────
  _buildWallTier2() {
    const isEnemy  = this.faction === 'enemy';
    const stoneCol = isEnemy ? 0x4a4a4a : 0x7f6e57;
    const stoneMat = new THREE.MeshStandardMaterial({ color: stoneCol, roughness: 0.9 });
    const darkMat  = new THREE.MeshStandardMaterial({ color: 0x5a4a3a, roughness: 0.95 });

    // Earthen base
    const mound = new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.4, 1.4), darkMat);
    mound.position.y = 0.2;
    this.mesh.add(mound);

    // Thick stone wall body (0.9 wide)
    const wallBody = new THREE.Mesh(new THREE.BoxGeometry(2.0, 2.4, 0.9), stoneMat);
    wallBody.position.set(0, 1.5, 0);
    this.mesh.add(wallBody);

    // Top walkway platform
    const walkway = new THREE.Mesh(new THREE.BoxGeometry(2.1, 0.15, 1.1), stoneMat);
    walkway.position.set(0, 2.75, 0);
    this.mesh.add(walkway);

    // Merlons (crenellations) — alternating raised blocks on top
    const merlonPositions = [-0.6, 0.0, 0.6];
    merlonPositions.forEach((mx, i) => {
      if (i % 2 === 0) {
        const merlon = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.5, 0.95), stoneMat);
        merlon.position.set(mx, 3.1, 0);
        this.mesh.add(merlon);
      }
    });

    this.createHpBar(1.9, 0.15, 3.8);
  }

  // ─── Tier 3: ကျောက်ရိုးတော် (Fortress Wall) — HP 1800 ───────────────────
  _buildWallTier3() {
    const isEnemy  = this.faction === 'enemy';
    const stoneCol = isEnemy ? 0x3c3c3c : 0x7f6e57;
    const stoneMat = new THREE.MeshStandardMaterial({ color: stoneCol, roughness: 0.9 });
    const darkMat  = new THREE.MeshStandardMaterial({ color: 0x4a3a2a, roughness: 0.95 });
    const torchMat = new THREE.MeshStandardMaterial({
      color: 0xff9900, emissive: 0xff6600, emissiveIntensity: 0.6
    });

    // Massive base
    const mound = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.5, 1.6), darkMat);
    mound.position.y = 0.25;
    this.mesh.add(mound);

    // Massive wall body (1.2 wide, taller)
    const wallBody = new THREE.Mesh(new THREE.BoxGeometry(2.0, 3.0, 1.2), stoneMat);
    wallBody.position.set(0, 1.9, 0);
    this.mesh.add(wallBody);

    // Full battlements
    [-0.65, -0.0, 0.65].forEach((mx, i) => {
      if (i % 2 === 0) {
        const merlon = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.55, 1.25), stoneMat);
        merlon.position.set(mx, 3.7, 0);
        this.mesh.add(merlon);
      }
    });

    // Arrow slit openings (thin dark boxes inset in wall)
    [-0.5, 0.5].forEach(sx => {
      const slit = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.5, 0.25), darkMat);
      slit.position.set(sx, 2.2, 0);
      this.mesh.add(slit);
    });

    // Stone buttresses on outer face every ~1 unit
    [-0.7, 0.0, 0.7].forEach(bx => {
      const buttress = new THREE.Mesh(new THREE.BoxGeometry(0.28, 2.6, 0.5), stoneMat);
      buttress.position.set(bx, 1.8, -0.75);
      this.mesh.add(buttress);
    });

    // Walkway on top
    const walkway = new THREE.Mesh(new THREE.BoxGeometry(2.1, 0.18, 1.3), stoneMat);
    walkway.position.set(0, 3.42, 0);
    this.mesh.add(walkway);

    // Emissive torches along wall at intervals
    [-0.6, 0.6].forEach(tx => {
      const torchPole = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.5, 5), darkMat);
      torchPole.position.set(tx, 2.6, -0.65);
      this.mesh.add(torchPole);

      const flame = new THREE.Mesh(new THREE.SphereGeometry(0.1, 6, 6), torchMat);
      flame.position.set(tx, 2.95, -0.65);
      this.mesh.add(flame);
    });

    this.createHpBar(2.1, 0.15, 4.5);
  }

  // ─── Rebuild model (for tier upgrades) ───────────────────────────────────
  rebuildModel() {
    const keep = new Set([
      this.hpBarGroup, this.selectionBoxMesh,
      this.rallyFlagGroup, this.scaffoldGroup, this.constructionUIGroup
    ]);
    const toRemove = this.mesh.children.filter(c => !keep.has(c));
    toRemove.forEach(c => this.mesh.remove(c));
    this._applyTierStats();
    this.createWallModel();
  }
}
