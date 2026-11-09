import * as THREE from 'three';
import { Building } from '../Building.js';

export class ElephantPen extends Building {
  constructor(game, options = {}) {
    super(game, {
      ...options,
      name: options.name || 'ဆင်တင်းတော် (Elephant Stables)',
      type: 'elephant_pen',
      hp: options.hp || 1400,
      size: 5
    });

    this.tier = options.tier || 1;
    this.createElephantPen3DModel();
  }

  createElephantPen3DModel() {
    if (this.tier === 3) {
      this._buildElephantPenTier3();
    } else if (this.tier === 2) {
      this._buildElephantPenTier2();
    } else {
      this._buildElephantPenTier1();
    }
  }

  // ─── Tier 1: Original wooden pen ─────────────────────────────────────────
  _buildElephantPenTier1() {
    const heavyLogMat = new THREE.MeshStandardMaterial({ color: 0x3e2723, roughness: 0.85 });
    const woodMat     = new THREE.MeshStandardMaterial({ color: 0x5d4037, roughness: 0.8 });
    const stoneMat    = new THREE.MeshStandardMaterial({ color: 0x7f8c8d, roughness: 0.9 });
    const leafMat     = new THREE.MeshStandardMaterial({ color: 0x1e8449, roughness: 0.6 });
    const goldMat     = new THREE.MeshStandardMaterial({ color: 0xf1c40f, metalness: 0.6, roughness: 0.3 });
    const bannerMat   = new THREE.MeshStandardMaterial({
      color: this.faction === 'enemy' ? 0x922b21 : 0xb03a2e,
      side: THREE.DoubleSide
    });

    this.modelGroup = new THREE.Group();

    // Heavy Stone Curb Base
    const base = new THREE.Mesh(new THREE.BoxGeometry(5.6, 0.25, 5.6), stoneMat);
    base.position.y = 0.125;
    this.modelGroup.add(base);

    // Giant Elephant Tethering Logs
    const logGeo = new THREE.CylinderGeometry(0.28, 0.32, 3.2, 8);
    const cornerPosts = [
      [-2.3, 1.6, -2.3], [2.3, 1.6, -2.3],
      [-2.3, 1.6, 2.3],  [2.3, 1.6, 2.3],
      [-2.3, 1.6, 0],    [2.3, 1.6, 0]
    ];
    cornerPosts.forEach(pos => {
      const log = new THREE.Mesh(logGeo, heavyLogMat);
      log.position.set(pos[0], pos[1], pos[2]);
      log.castShadow = true;
      this.modelGroup.add(log);

      const cap = new THREE.Mesh(new THREE.ConeGeometry(0.32, 0.3, 6), goldMat);
      cap.position.set(pos[0], 3.35, pos[2]);
      this.modelGroup.add(cap);
    });

    // Horizontal Barricade Timbers
    const makeBeam = (w, x, y, z, rotY = 0) => {
      const beam = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.14, w, 6), heavyLogMat);
      beam.position.set(x, y, z);
      beam.rotation.z = Math.PI / 2;
      beam.rotation.y = rotY;
      beam.castShadow = true;
      this.modelGroup.add(beam);
    };

    makeBeam(4.6, 0, 1.0, -2.3);
    makeBeam(4.6, 0, 1.8, -2.3);
    makeBeam(4.6, 0, 2.6, -2.3);

    [1.0, 1.8, 2.6].forEach(y => {
      makeBeam(4.6, -2.3, y, 0, Math.PI / 2);
      makeBeam(4.6, 2.3,  y, 0, Math.PI / 2);
    });

    // Elephant Mounting Platform & Staging Deck
    const platform = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.25, 2.0), woodMat);
    platform.position.set(0, 2.2, -1.2);
    this.modelGroup.add(platform);

    for (let i = 0; i < 4; i++) {
      const s = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.35, 0.4), woodMat);
      s.position.set(0, (i + 0.5) * 0.45, 0.2 + i * 0.35);
      this.modelGroup.add(s);
    }

    // Fodder Manger
    const manger = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.6, 1.0), woodMat);
    manger.position.set(-1.0, 0.4, 1.5);
    this.modelGroup.add(manger);

    for (let i = 0; i < 5; i++) {
      const leaf = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.08, 0.3), leafMat);
      leaf.position.set(-1.0 + (i - 2) * 0.25, 0.75, 1.5 + (i % 2) * 0.15);
      leaf.rotation.z = (i - 2) * 0.2;
      this.modelGroup.add(leaf);
    }

    // Royal War Banner
    const banner = new THREE.Mesh(new THREE.PlaneGeometry(0.9, 2.0), bannerMat);
    banner.position.set(2.3, 3.4, 1.8);
    this.modelGroup.add(banner);

    this.mesh.add(this.modelGroup);
    this.createHpBar(3.2, 0.2, 4.8);
  }

  // ─── Tier 2: ကျောက်ဆင်တင်းတော် (Stone Elephant Pen) ────────────────────
  _buildElephantPenTier2() {
    const stoneMat  = new THREE.MeshStandardMaterial({ color: 0x7f8c8d, roughness: 0.9 });
    const woodMat   = new THREE.MeshStandardMaterial({ color: 0x4e342e, roughness: 0.8 });
    const goldMat   = new THREE.MeshStandardMaterial({ color: 0xd4ac0d, metalness: 0.8, roughness: 0.2 });
    const waterMat  = new THREE.MeshStandardMaterial({ color: 0x1abc9c, roughness: 0.1, transparent: true, opacity: 0.8 });
    const hayMat    = new THREE.MeshStandardMaterial({ color: 0xd4a017, roughness: 0.95 });
    const roofMat   = new THREE.MeshStandardMaterial({ color: 0xa04000, roughness: 0.65 });

    this.modelGroup = new THREE.Group();

    // Stone base (larger 6x6)
    const base = new THREE.Mesh(new THREE.BoxGeometry(6.6, 0.3, 6.6), stoneMat);
    base.position.y = 0.15;
    this.modelGroup.add(base);

    // Stone pillar corners + wooden fence rails
    const pillarPositions = [
      [-2.9, -2.9], [2.9, -2.9], [-2.9, 2.9], [2.9, 2.9]
    ];
    pillarPositions.forEach(([px, pz]) => {
      const pillar = new THREE.Mesh(new THREE.BoxGeometry(0.5, 2.6, 0.5), stoneMat);
      pillar.position.set(px, 1.45, pz);
      this.modelGroup.add(pillar);

      const cap = new THREE.Mesh(new THREE.ConeGeometry(0.32, 0.4, 5), goldMat);
      cap.position.set(px, 2.95, pz);
      this.modelGroup.add(cap);
    });

    // Wooden fence rails (3 tiers each side)
    const makeRail = (len, x, y, z, rotY = 0) => {
      const rail = new THREE.Mesh(new THREE.BoxGeometry(len, 0.12, 0.1), woodMat);
      rail.position.set(x, y, z);
      rail.rotation.y = rotY;
      this.modelGroup.add(rail);
    };
    [0.8, 1.4, 2.0].forEach(y => {
      makeRail(5.8, 0, y, -2.9);
      makeRail(5.8, 0, y, 2.9);
      makeRail(5.8, -2.9, y, 0, Math.PI / 2);
      makeRail(5.8, 2.9,  y, 0, Math.PI / 2);
    });

    // Water trough (long box, cyan-ish)
    const trough = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.4, 0.6), woodMat);
    trough.position.set(0.5, 0.35, 1.8);
    this.modelGroup.add(trough);

    const water = new THREE.Mesh(new THREE.PlaneGeometry(2.2, 0.5), waterMat);
    water.rotation.x = -Math.PI / 2;
    water.position.set(0.5, 0.52, 1.8);
    this.modelGroup.add(water);

    // Hay/bamboo fodder pile
    const hayPile = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.5, 0.8), hayMat);
    hayPile.position.set(-1.5, 0.45, 1.8);
    this.modelGroup.add(hayPile);

    // Shade canopy over part of pen (poles + flat roof)
    [[-1.6, -1.0], [1.6, -1.0]].forEach(([px, pz]) => {
      const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.07, 2.2, 6), woodMat);
      pole.position.set(px, 1.1, pz);
      this.modelGroup.add(pole);
    });
    const canopy = new THREE.Mesh(new THREE.BoxGeometry(3.5, 0.15, 1.6), roofMat);
    canopy.position.set(0, 2.25, -1.0);
    this.modelGroup.add(canopy);

    // Elephant bathing area (blue-tinted plane)
    const pool = new THREE.Mesh(new THREE.BoxGeometry(2.0, 0.08, 1.4), waterMat);
    pool.position.set(1.5, 0.32, -1.5);
    this.modelGroup.add(pool);

    // 2 decorative carved elephant heads on gate posts (sphere + box)
    [-1.0, 1.0].forEach(px => {
      // Head
      const head = new THREE.Mesh(new THREE.SphereGeometry(0.28, 8, 8), stoneMat);
      head.position.set(px, 2.5, -2.95);
      this.modelGroup.add(head);

      // Trunk (small box)
      const trunk = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.4, 0.1), stoneMat);
      trunk.position.set(px, 2.15, -2.95);
      this.modelGroup.add(trunk);

      // Ears (flat boxes)
      const ear = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.28, 0.06), stoneMat);
      ear.position.set(px, 2.5, -2.95);
      this.modelGroup.add(ear);
    });

    this.mesh.add(this.modelGroup);
    this.createHpBar(3.6, 0.2, 5.4);
  }

  // ─── Tier 3: နန်းဆင်ကျောင်း (Royal Elephant Palace) ────────────────────
  _buildElephantPenTier3() {
    const stoneMat  = new THREE.MeshStandardMaterial({ color: 0x7f8c8d, roughness: 0.9 });
    const brickMat  = new THREE.MeshStandardMaterial({ color: 0x922b21, roughness: 0.85 });
    const woodMat   = new THREE.MeshStandardMaterial({ color: 0x4e342e, roughness: 0.8 });
    const goldMat   = new THREE.MeshStandardMaterial({ color: 0xd4ac0d, metalness: 0.8, roughness: 0.2 });
    const waterMat  = new THREE.MeshStandardMaterial({ color: 0x1a6fa8, roughness: 0.05, transparent: true, opacity: 0.85 });
    const roofMat   = new THREE.MeshStandardMaterial({ color: 0xa04000, roughness: 0.6 });
    const flagMat   = new THREE.MeshStandardMaterial({ color: 0x922b21, side: THREE.DoubleSide });

    this.modelGroup = new THREE.Group();

    // Grand stone base (7.5 x 7.5)
    const base = new THREE.Mesh(new THREE.BoxGeometry(8.0, 0.4, 8.0), stoneMat);
    base.position.y = 0.2;
    this.modelGroup.add(base);

    // Thick enclosure walls (0.6 wide)
    const wallData = [
      { size: [8.0, 2.4, 0.6], pos: [0, 1.4, -3.7] },   // back
      { size: [8.0, 2.4, 0.6], pos: [0, 1.4, 3.7] },    // front
      { size: [0.6, 2.4, 8.0], pos: [-3.7, 1.4, 0] },   // left
      { size: [0.6, 2.4, 8.0], pos: [3.7, 1.4, 0] },    // right
    ];
    wallData.forEach(w => {
      const wall = new THREE.Mesh(new THREE.BoxGeometry(...w.size), brickMat);
      wall.position.set(...w.pos);
      this.modelGroup.add(wall);
    });

    // Battlements on walls
    for (let i = -3; i <= 3; i++) {
      [[-3.7, 2.7, i * 1.0], [3.7, 2.7, i * 1.0]].forEach(([mx, my, mz]) => {
        const merlon = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.45, 0.4), stoneMat);
        merlon.position.set(mx, my, mz);
        this.modelGroup.add(merlon);
      });
      [[ i * 1.0, 2.7, -3.7], [ i * 1.0, 2.7, 3.7]].forEach(([mx, my, mz]) => {
        const merlon = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.45, 0.5), stoneMat);
        merlon.position.set(mx, my, mz);
        this.modelGroup.add(merlon);
      });
    }

    // Ornate gateway with 2-tier pyatthat roof (front center)
    const gatePillarL = new THREE.Mesh(new THREE.BoxGeometry(0.7, 3.0, 0.7), stoneMat);
    gatePillarL.position.set(-1.2, 1.9, 3.75);
    this.modelGroup.add(gatePillarL);

    const gatePillarR = new THREE.Mesh(new THREE.BoxGeometry(0.7, 3.0, 0.7), stoneMat);
    gatePillarR.position.set(1.2, 1.9, 3.75);
    this.modelGroup.add(gatePillarR);

    // Pyatthat roof tier 1 (wide base)
    const roof1 = new THREE.Mesh(new THREE.BoxGeometry(3.2, 0.25, 1.4), roofMat);
    roof1.position.set(0, 3.5, 3.75);
    this.modelGroup.add(roof1);

    // Pyatthat roof tier 2 (narrower upper)
    const roof2 = new THREE.Mesh(new THREE.BoxGeometry(2.0, 0.2, 0.9), roofMat);
    roof2.position.set(0, 4.0, 3.75);
    this.modelGroup.add(roof2);

    const roofSpire = new THREE.Mesh(new THREE.ConeGeometry(0.25, 0.8, 6), goldMat);
    roofSpire.position.set(0, 4.5, 3.75);
    this.modelGroup.add(roofSpire);

    // 4 corner guardian towers (mini)
    [[-3.5, -3.5], [3.5, -3.5], [-3.5, 3.5], [3.5, 3.5]].forEach(([tx, tz]) => {
      const tower = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.55, 3.2, 8), stoneMat);
      tower.position.set(tx, 1.9, tz);
      this.modelGroup.add(tower);

      const towerRoof = new THREE.Mesh(new THREE.ConeGeometry(0.6, 0.8, 8), roofMat);
      towerRoof.position.set(tx, 3.7, tz);
      this.modelGroup.add(towerRoof);

      // Golden finial on each corner tower
      const finial = new THREE.Mesh(new THREE.ConeGeometry(0.1, 0.5, 6), goldMat);
      finial.position.set(tx, 4.3, tz);
      this.modelGroup.add(finial);
    });

    // Royal pool for elephants (recessed blue plane)
    const pool = new THREE.Mesh(new THREE.BoxGeometry(2.8, 0.1, 2.0), waterMat);
    pool.position.set(1.0, 0.42, -1.0);
    this.modelGroup.add(pool);

    // Decorative elephant statues at gate
    [-0.6, 0.6].forEach(px => {
      const ebody = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.45, 0.6), stoneMat);
      ebody.position.set(px, 0.65, 3.0);
      this.modelGroup.add(ebody);

      const ehead = new THREE.Mesh(new THREE.SphereGeometry(0.22, 8, 8), stoneMat);
      ehead.position.set(px, 1.0, 3.3);
      this.modelGroup.add(ehead);

      const etrunk = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.3, 0.08), stoneMat);
      etrunk.position.set(px, 0.76, 3.5);
      this.modelGroup.add(etrunk);
    });

    // Covered royal howdah storage pavilion inside (ornate posts + tiered roof)
    [[-1.8, -1.0], [1.8, -1.0], [-1.8, -2.6], [1.8, -2.6]].forEach(([px, pz]) => {
      const pav = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.12, 2.0, 6), woodMat);
      pav.position.set(px, 1.1, pz);
      this.modelGroup.add(pav);
    });

    const pavRoof = new THREE.Mesh(new THREE.BoxGeometry(4.2, 0.2, 2.2), roofMat);
    pavRoof.position.set(0, 2.2, -1.8);
    this.modelGroup.add(pavRoof);

    const pavRoof2 = new THREE.Mesh(new THREE.BoxGeometry(3.0, 0.15, 1.5), roofMat);
    pavRoof2.position.set(0, 2.5, -1.8);
    this.modelGroup.add(pavRoof2);

    // Mahout training ground marker flags
    [[0, 0.3], [1.5, 0.3], [-1.5, 0.3]].forEach(([fx, fz]) => {
      const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 1.4, 5), woodMat);
      pole.position.set(fx, 1.1, fz);
      this.modelGroup.add(pole);

      const flag = new THREE.Mesh(new THREE.PlaneGeometry(0.4, 0.3), flagMat);
      flag.position.set(fx + 0.2, 1.65, fz);
      this.modelGroup.add(flag);
    });

    this.mesh.add(this.modelGroup);
    this.createHpBar(4.0, 0.2, 6.5);
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
    this.createElephantPen3DModel();
  }
}
