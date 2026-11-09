import * as THREE from 'three';
import { Building } from '../Building.js';

export class Gate extends Building {
  constructor(game, options = {}) {
    super(game, {
      ...options,
      name: options.name || 'သစ်တပ် မြို့တံခါးကြီး (Fortified Gate)',
      type: 'gate',
      hp: options.hp || 800,
      size: 3.5,
      faction: options.faction || 'player'
    });

    this.tier = options.tier || 1;
    this.isOpen = false;
    this.targetDoorAngle = 0;
    this.currentDoorAngle = 0;
    this.scanTimer = 0;

    this._applyTierStats();
    this.createGateModel();
  }

  _applyTierStats() {
    if (this.tier === 3 && !this.options?.hp) {
      this.hp = Math.max(this.hp, 2000);
      this.maxHp = Math.max(this.maxHp, 2000);
    }
  }

  createGateModel() {
    if (this.tier === 3) {
      this._buildGateTier3();
    } else if (this.tier === 2) {
      this._buildGateTier2();
    } else {
      this._buildGateTier1();
    }
  }

  // ─── Tier 1: Wooden Fortified Gate (original) ────────────────────────────
  _buildGateTier1() {
    const isEnemy   = this.faction === 'enemy';
    const woodColor  = isEnemy ? 0x212f3d : 0x5d4037;
    const ironColor  = isEnemy ? 0x17202a : 0x2c3e50;
    const roofColor  = isEnemy ? 0x78281f : 0xa04000;
    const brickColor = isEnemy ? 0x34495e : 0x873600;

    const woodMat  = new THREE.MeshStandardMaterial({ color: woodColor, roughness: 0.85 });
    const ironMat  = new THREE.MeshStandardMaterial({ color: ironColor, metalness: 0.8, roughness: 0.3 });
    const roofMat  = new THREE.MeshStandardMaterial({ color: roofColor, roughness: 0.65 });
    const brickMat = new THREE.MeshStandardMaterial({ color: brickColor, roughness: 0.9 });

    // Brick Pedestals for Left and Right Gate Towers
    [-1.6, 1.6].forEach(px => {
      const pedestal = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.6, 1.4), brickMat);
      pedestal.position.set(px, 0.3, 0);
      pedestal.castShadow = true;
      this.mesh.add(pedestal);

      const post = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.35, 4.2, 8), woodMat);
      post.position.set(px, 2.4, 0);
      post.castShadow = true;
      this.mesh.add(post);

      const roof = new THREE.Mesh(new THREE.ConeGeometry(1.1, 0.9, 4), roofMat);
      roof.position.set(px, 4.9, 0);
      roof.rotation.y = Math.PI / 4;
      roof.castShadow = true;
      this.mesh.add(roof);
    });

    // Heavy Overhead Lintel Timber (Archway)
    const lintel = new THREE.Mesh(new THREE.BoxGeometry(3.6, 0.4, 0.5), woodMat);
    lintel.position.set(0, 4.2, 0);
    lintel.castShadow = true;
    this.mesh.add(lintel);

    // Double Swinging Gate Doors — Left
    this.leftHinge = new THREE.Group();
    this.leftHinge.position.set(-1.4, 0, 0);

    const doorGeo = new THREE.BoxGeometry(1.3, 3.4, 0.18);
    const leftDoor = new THREE.Mesh(doorGeo, woodMat);
    leftDoor.position.set(0.65, 2.0, 0);
    leftDoor.castShadow = true;
    this.leftHinge.add(leftDoor);

    for (let sy = 0.8; sy <= 3.2; sy += 0.8) {
      const stud = new THREE.Mesh(new THREE.SphereGeometry(0.08, 6, 6), ironMat);
      stud.position.set(0.65, sy, 0.1);
      this.leftHinge.add(stud);
    }
    this.mesh.add(this.leftHinge);

    // Right Door
    this.rightHinge = new THREE.Group();
    this.rightHinge.position.set(1.4, 0, 0);

    const rightDoor = new THREE.Mesh(doorGeo, woodMat);
    rightDoor.position.set(-0.65, 2.0, 0);
    rightDoor.castShadow = true;
    this.rightHinge.add(rightDoor);

    for (let sy = 0.8; sy <= 3.2; sy += 0.8) {
      const stud = new THREE.Mesh(new THREE.SphereGeometry(0.08, 6, 6), ironMat);
      stud.position.set(-0.65, sy, 0.1);
      this.rightHinge.add(stud);
    }
    this.mesh.add(this.rightHinge);

    this.createHpBar(2.6, 0.2, 5.8);
  }

  // ─── Tier 2: ကျောက်တံခါးကြီး (Stone Gate) ───────────────────────────────
  _buildGateTier2() {
    const isEnemy  = this.faction === 'enemy';
    const stoneMat = new THREE.MeshStandardMaterial({
      color: isEnemy ? 0x4a4a4a : 0x7f6e57, roughness: 0.9
    });
    const woodMat  = new THREE.MeshStandardMaterial({ color: 0x4e342e, roughness: 0.8 });
    const ironMat  = new THREE.MeshStandardMaterial({ color: 0x2c3e50, metalness: 0.75, roughness: 0.3 });
    const bannerMat = new THREE.MeshStandardMaterial({
      color: isEnemy ? 0x922b21 : 0xd4ac0d,
      side: THREE.DoubleSide
    });
    const torchMat = new THREE.MeshStandardMaterial({
      color: 0xff9900, emissive: 0xff6600, emissiveIntensity: 0.6
    });

    // Two flanking stone towers
    [-1.8, 1.8].forEach(px => {
      const towerBase = new THREE.Mesh(new THREE.BoxGeometry(1.1, 0.5, 1.3), stoneMat);
      towerBase.position.set(px, 0.25, 0);
      this.mesh.add(towerBase);

      const tower = new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.62, 2.5, 8), stoneMat);
      tower.position.set(px, 1.65, 0);
      this.mesh.add(tower);

      const towerTop = new THREE.Mesh(new THREE.ConeGeometry(0.65, 0.7, 8), stoneMat);
      towerTop.position.set(px, 3.1, 0);
      this.mesh.add(towerTop);
    });

    // Stone arch gateway — arch made from BoxGeometry segments
    const archSegments = 7;
    const archRadius = 1.6;
    for (let i = 0; i <= archSegments; i++) {
      const angle = (Math.PI / archSegments) * i;
      const ax = Math.cos(angle) * archRadius;
      const ay = Math.sin(angle) * archRadius + 1.5;
      const seg = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.5, 0.55), stoneMat);
      seg.position.set(ax, ay, 0);
      seg.rotation.z = -angle + Math.PI / 2;
      this.mesh.add(seg);
    }

    // Arch side pillars
    const pillarGeo = new THREE.BoxGeometry(0.5, 1.5, 0.55);
    [-1.6, 1.6].forEach(px => {
      const pillar = new THREE.Mesh(pillarGeo, stoneMat);
      pillar.position.set(px, 0.75, 0);
      this.mesh.add(pillar);
    });

    // Portcullis visible — vertical bars in grid
    for (let col = -1; col <= 1; col++) {
      const bar = new THREE.Mesh(new THREE.BoxGeometry(0.08, 2.4, 0.08), ironMat);
      bar.position.set(col * 0.55, 1.2, 0.0);
      this.mesh.add(bar);
    }
    for (let row = 0; row <= 2; row++) {
      const hBar = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.08, 0.08), ironMat);
      hBar.position.set(0, 0.5 + row * 0.75, 0.0);
      this.mesh.add(hBar);
    }

    // Two torches at entrance
    [-0.9, 0.9].forEach(tx => {
      const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.6, 5), woodMat);
      pole.position.set(tx, 1.5, 0.3);
      this.mesh.add(pole);

      const flame = new THREE.Mesh(new THREE.SphereGeometry(0.14, 6, 6), torchMat);
      flame.position.set(tx, 1.95, 0.3);
      this.mesh.add(flame);
    });

    // Royal banner above arch
    const banner = new THREE.Mesh(new THREE.PlaneGeometry(0.7, 1.2), bannerMat);
    banner.position.set(0, 4.0, 0);
    this.mesh.add(banner);

    // Swinging gate doors (kept functional)
    this.leftHinge = new THREE.Group();
    this.leftHinge.position.set(-1.1, 0, 0);

    const leftDoor = new THREE.Mesh(new THREE.BoxGeometry(1.1, 2.6, 0.14), woodMat);
    leftDoor.position.set(0.55, 1.5, 0);
    this.leftHinge.add(leftDoor);
    this.mesh.add(this.leftHinge);

    this.rightHinge = new THREE.Group();
    this.rightHinge.position.set(1.1, 0, 0);

    const rightDoor = new THREE.Mesh(new THREE.BoxGeometry(1.1, 2.6, 0.14), woodMat);
    rightDoor.position.set(-0.55, 1.5, 0);
    this.rightHinge.add(rightDoor);
    this.mesh.add(this.rightHinge);

    this.createHpBar(2.8, 0.2, 5.8);
  }

  // ─── Tier 3: နန်းတော်တံခါးတော် (Royal Palace Gate) — HP 2000 ─────────────
  _buildGateTier3() {
    const isEnemy  = this.faction === 'enemy';
    const stoneMat = new THREE.MeshStandardMaterial({
      color: isEnemy ? 0x3c3c3c : 0x7f6e57, roughness: 0.9
    });
    const brickMat = new THREE.MeshStandardMaterial({ color: 0x922b21, roughness: 0.85 });
    const woodMat  = new THREE.MeshStandardMaterial({ color: 0x4e342e, roughness: 0.8 });
    const ironMat  = new THREE.MeshStandardMaterial({ color: 0x2c3e50, metalness: 0.8, roughness: 0.3 });
    const goldMat  = new THREE.MeshStandardMaterial({ color: 0xd4ac0d, metalness: 0.8, roughness: 0.2 });
    const torchMat = new THREE.MeshStandardMaterial({
      color: 0xff6600, emissive: 0xff4400, emissiveIntensity: 0.8
    });
    const bannerMat = new THREE.MeshStandardMaterial({
      color: isEnemy ? 0x922b21 : 0xd4ac0d, side: THREE.DoubleSide
    });

    // Wide stone gatehouse base
    const base = new THREE.Mesh(new THREE.BoxGeometry(6.5, 0.4, 2.0), stoneMat);
    base.position.y = 0.2;
    this.mesh.add(base);

    // Two massive side towers (4.0 tall)
    [-2.6, 2.6].forEach(px => {
      const tower = new THREE.Mesh(new THREE.BoxGeometry(1.4, 4.0, 1.6), brickMat);
      tower.position.set(px, 2.2, 0);
      this.mesh.add(tower);

      // Tower battlements
      [-0.4, 0.0, 0.4].forEach(bx => {
        const merlon = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.5, 0.5), stoneMat);
        merlon.position.set(px + bx, 4.45, 0);
        this.mesh.add(merlon);
      });

      // 4 golden spires at tower tops
      const spire = new THREE.Mesh(new THREE.ConeGeometry(0.18, 0.9, 6), goldMat);
      spire.position.set(px, 4.85, 0);
      this.mesh.add(spire);
    });

    // Connecting wall above arch
    const archWall = new THREE.Mesh(new THREE.BoxGeometry(3.6, 1.6, 1.0), brickMat);
    archWall.position.set(0, 3.6, 0);
    this.mesh.add(archWall);

    // Wide arch (5.0) — arch segments
    const archSegments = 9;
    const archRadius = 2.0;
    for (let i = 0; i <= archSegments; i++) {
      const angle = (Math.PI / archSegments) * i;
      const ax = Math.cos(angle) * archRadius;
      const ay = Math.sin(angle) * archRadius + 1.4;
      const seg = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.6, 1.05), stoneMat);
      seg.position.set(ax, ay, 0);
      seg.rotation.z = -angle + Math.PI / 2;
      this.mesh.add(seg);
    }

    // Arch side pillars
    [-2.0, 2.0].forEach(px => {
      const pillar = new THREE.Mesh(new THREE.BoxGeometry(0.6, 1.4, 1.05), stoneMat);
      pillar.position.set(px, 0.7, 0);
      this.mesh.add(pillar);
    });

    // 3-tier pyatthat roof over gateway
    const tiers = [
      { w: 4.6, h: 0.25, d: 1.4, y: 4.5 },
      { w: 3.4, h: 0.2,  d: 1.1, y: 5.0 },
      { w: 2.2, h: 0.18, d: 0.8, y: 5.4 }
    ];
    tiers.forEach(t => {
      const tier = new THREE.Mesh(new THREE.BoxGeometry(t.w, t.h, t.d), woodMat);
      tier.position.set(0, t.y, 0);
      this.mesh.add(tier);
    });

    const roofSpire = new THREE.Mesh(new THREE.ConeGeometry(0.18, 0.75, 6), goldMat);
    roofSpire.position.set(0, 5.72, 0);
    this.mesh.add(roofSpire);

    // Portcullis bars
    for (let col = -2; col <= 2; col++) {
      const bar = new THREE.Mesh(new THREE.BoxGeometry(0.1, 2.8, 0.1), ironMat);
      bar.position.set(col * 0.55, 1.4, 0.0);
      this.mesh.add(bar);
    }
    for (let row = 0; row <= 3; row++) {
      const hBar = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.1, 0.1), ironMat);
      hBar.position.set(0, 0.4 + row * 0.7, 0.0);
      this.mesh.add(hBar);
    }

    // Royal emblem above arch (golden disc)
    const emblem = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.42, 0.1, 12), goldMat);
    emblem.rotation.x = Math.PI / 2;
    emblem.position.set(0, 4.1, -0.5);
    this.mesh.add(emblem);

    // Decorative carved elephants/lions flanking entrance
    [-1.5, 1.5].forEach(px => {
      const body = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.5, 0.65), stoneMat);
      body.position.set(px, 0.55, 0.9);
      this.mesh.add(body);

      const head = new THREE.Mesh(new THREE.SphereGeometry(0.24, 8, 8), stoneMat);
      head.position.set(px, 0.95, 1.22);
      this.mesh.add(head);

      const trunk = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.3, 0.08), stoneMat);
      trunk.position.set(px, 0.65, 1.42);
      this.mesh.add(trunk);
    });

    // Two large braziers (emissive fire)
    [-1.1, 1.1].forEach(px => {
      const bowl = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.18, 0.4, 8), stoneMat);
      bowl.position.set(px, 1.0, 0.95);
      this.mesh.add(bowl);

      const stand = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.1, 0.8, 6), ironMat);
      stand.position.set(px, 0.55, 0.95);
      this.mesh.add(stand);

      const fire = new THREE.Mesh(new THREE.SphereGeometry(0.22, 8, 8), torchMat);
      fire.position.set(px, 1.3, 0.95);
      this.mesh.add(fire);
    });

    // Royal banner above arch
    const banner = new THREE.Mesh(new THREE.PlaneGeometry(1.0, 1.6), bannerMat);
    banner.position.set(0, 5.0, -0.55);
    this.mesh.add(banner);

    // Swinging gate doors (functional)
    this.leftHinge = new THREE.Group();
    this.leftHinge.position.set(-1.3, 0, 0);

    const leftDoor = new THREE.Mesh(new THREE.BoxGeometry(1.4, 2.8, 0.18), woodMat);
    leftDoor.position.set(0.7, 1.6, 0);
    this.leftHinge.add(leftDoor);
    this.mesh.add(this.leftHinge);

    this.rightHinge = new THREE.Group();
    this.rightHinge.position.set(1.3, 0, 0);

    const rightDoor = new THREE.Mesh(new THREE.BoxGeometry(1.4, 2.8, 0.18), woodMat);
    rightDoor.position.set(-0.7, 1.6, 0);
    this.rightHinge.add(rightDoor);
    this.mesh.add(this.rightHinge);

    this.createHpBar(3.2, 0.2, 7.0);
  }

  // ─── Rebuild model (for tier upgrades) ───────────────────────────────────
  rebuildModel() {
    const keep = new Set([
      this.hpBarGroup, this.selectionBoxMesh,
      this.rallyFlagGroup, this.scaffoldGroup, this.constructionUIGroup
    ]);
    const toRemove = this.mesh.children.filter(c => !keep.has(c));
    toRemove.forEach(c => this.mesh.remove(c));
    // Reset door hinges
    this.leftHinge = null;
    this.rightHinge = null;
    this._applyTierStats();
    this.createGateModel();
  }

  update(delta) {
    super.update(delta);

    // Scan for nearby friendly units to open automatically
    this.scanTimer += delta;
    if (this.scanTimer >= 0.2) {
      this.scanTimer = 0;
      this.checkProximity();
    }

    // Smoothly animate door hinges
    this.currentDoorAngle = THREE.MathUtils.lerp(this.currentDoorAngle, this.targetDoorAngle, 0.18);
    if (this.leftHinge && this.rightHinge) {
      this.leftHinge.rotation.y = -this.currentDoorAngle;
      this.rightHinge.rotation.y = this.currentDoorAngle;
    }
  }

  checkProximity() {
    const myPos = this.mesh.position;
    let hasNearbyAlly = false;

    for (const u of this.game.units) {
      if (u.faction === this.faction && u.hp > 0) {
        const d = myPos.distanceTo(u.mesh.position);
        if (d < 4.8) {
          hasNearbyAlly = true;
          break;
        }
      }
    }

    if (hasNearbyAlly) {
      if (!this.isOpen) {
        this.isOpen = true;
        this.targetDoorAngle = Math.PI * 0.48;
      }
    } else {
      if (this.isOpen) {
        this.isOpen = false;
        this.targetDoorAngle = 0;
      }
    }
  }
}
