import * as THREE from 'three';
import { Building } from '../Building.js';

export class Stables extends Building {
  constructor(game, options = {}) {
    super(game, {
      ...options,
      name: options.name || 'မြင်းတပ်စခန်း (Cavalry Stables)',
      type: 'stables',
      hp: options.hp || 900,
      size: 4
    });

    this.createStables3DModel();
  }

  createStables3DModel() {
    // Remove old model if exists
    if (this.modelGroup) { this.mesh.remove(this.modelGroup); }
    this.modelGroup = new THREE.Group();

    if (this.tier === 2) { this._buildStablesTier2(); }
    else if (this.tier === 3) { this._buildStablesTier3(); }
    else { this._buildStablesTier1(); }

    this.mesh.add(this.modelGroup);
    this.createHpBar(2.6, 0.18, 4.0 + (this.tier || 1) * 0.4);
  }

  rebuildModel() { this.createStables3DModel(); }

  // ——— Tier 1: မြင်းတပ်စခန်း — Original Stables ———
  _buildStablesTier1() {
    const woodMat  = new THREE.MeshStandardMaterial({ color: 0x4e342e, roughness: 0.8 });
    const fenceMat = new THREE.MeshStandardMaterial({ color: 0x6e2c00, roughness: 0.75 });
    const thatchMat = new THREE.MeshStandardMaterial({
      color: this.faction === 'enemy' ? 0x34495e : 0xa04000,
      roughness: 0.9
    });
    const hayMat   = new THREE.MeshStandardMaterial({ color: 0xd4ac0d, roughness: 0.95 });
    const waterMat = new THREE.MeshStandardMaterial({ color: 0x2980b9, roughness: 0.2 });

    // 1. Dirt Ground Base
    const baseGeo = new THREE.BoxGeometry(4.8, 0.2, 4.8);
    const baseMat = new THREE.MeshStandardMaterial({ color: 0x784212, roughness: 0.95 });
    const base    = new THREE.Mesh(baseGeo, baseMat);
    base.position.y = 0.1;
    this.modelGroup.add(base);

    // 2. Open Stall Timber Pillars (6 posts)
    const pillarGeo = new THREE.CylinderGeometry(0.12, 0.12, 2.2, 6);
    const posts = [
      [-1.8, 1.2, -1.6], [0, 1.2, -1.6], [1.8, 1.2, -1.6],
      [-1.8, 1.2,  0.4], [0, 1.2,  0.4], [1.8, 1.2,  0.4]
    ];
    posts.forEach(p => {
      const pillar = new THREE.Mesh(pillarGeo, woodMat);
      pillar.position.set(p[0], p[1], p[2]);
      pillar.castShadow = true;
      this.modelGroup.add(pillar);
    });

    // 3. Stables Sloped Thatched Roof
    const roofGeo = new THREE.BoxGeometry(4.6, 0.3, 2.8);
    const roof    = new THREE.Mesh(roofGeo, thatchMat);
    roof.position.set(0, 2.35, -0.6);
    roof.rotation.x = 0.15;
    roof.castShadow = true;
    this.modelGroup.add(roof);

    // 4. Wooden Fences for Horse Corral (ရှေ့ခြံစည်းရိုး)
    const makeFenceRail = (w, x, y, z, rotY = 0) => {
      const rail = new THREE.Mesh(new THREE.BoxGeometry(w, 0.12, 0.08), fenceMat);
      rail.position.set(x, y, z);
      rail.rotation.y = rotY;
      this.modelGroup.add(rail);
    };
    makeFenceRail(4.2, 0, 0.4,  2.0);
    makeFenceRail(4.2, 0, 0.8,  2.0);
    makeFenceRail(2.0, 2.0,  0.4, 1.0, Math.PI / 2);
    makeFenceRail(2.0, 2.0,  0.8, 1.0, Math.PI / 2);
    makeFenceRail(2.0, -2.0, 0.4, 1.0, Math.PI / 2);
    makeFenceRail(2.0, -2.0, 0.8, 1.0, Math.PI / 2);

    // 5. Hay Bales & Water Trough
    const hay1 = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.6, 0.7), hayMat);
    hay1.position.set(1.3, 0.4, -0.6);
    this.modelGroup.add(hay1);

    const hay2 = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.5, 0.6), hayMat);
    hay2.position.set(1.4, 0.85, -0.5);
    hay2.rotation.y = 0.3;
    this.modelGroup.add(hay2);

    const troughBox = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.4, 0.6), woodMat);
    troughBox.position.set(-1.2, 0.3, 1.2);
    this.modelGroup.add(troughBox);

    const water = new THREE.Mesh(new THREE.PlaneGeometry(1.0, 0.4),
      new THREE.MeshStandardMaterial({ color: 0x2980b9, roughness: 0.2 }));
    water.position.set(-1.2, 0.45, 1.2);
    water.rotation.x = -Math.PI / 2;
    this.modelGroup.add(water);
  }

  // ——— Tier 2: ကျောက်တပ်မြင်းစခန်း — Stone Stables ———
  _buildStablesTier2() {
    const woodMat   = new THREE.MeshStandardMaterial({ color: 0x4e342e, roughness: 0.8 });
    const fenceMat  = new THREE.MeshStandardMaterial({ color: 0x6e2c00, roughness: 0.75 });
    const stoneMat  = new THREE.MeshStandardMaterial({ color: 0x7f8c8d, roughness: 0.9 });
    const thatchMat = new THREE.MeshStandardMaterial({
      color: this.faction === 'enemy' ? 0x34495e : 0xa04000,
      roughness: 0.9
    });
    const hayMat    = new THREE.MeshStandardMaterial({ color: 0xd4ac0d, roughness: 0.95 });
    const waterMat  = new THREE.MeshStandardMaterial({ color: 0x2980b9, roughness: 0.2 });
    const bannerMat = new THREE.MeshStandardMaterial({
      color: this.faction === 'enemy' ? 0x922b21 : 0xd4ac0d,
      side: THREE.DoubleSide
    });

    // Stone base platform
    const platform = new THREE.Mesh(new THREE.BoxGeometry(5.5, 0.3, 5.5), stoneMat);
    platform.position.y = 0.15;
    platform.castShadow = true;
    this.modelGroup.add(platform);

    // Dirt floor inside
    const dirt = new THREE.Mesh(new THREE.BoxGeometry(5.0, 0.1, 4.5), new THREE.MeshStandardMaterial({ color: 0x784212, roughness: 0.95 }));
    dirt.position.set(0, 0.35, -0.25);
    this.modelGroup.add(dirt);

    // 8 pillars forming proper stall structure
    const pillarGeo = new THREE.CylinderGeometry(0.14, 0.16, 2.6, 8);
    const pillarPositions = [
      [-2.2, -1.8], [-0.73, -1.8], [0.73, -1.8], [2.2, -1.8],
      [-2.2,  0.9], [-0.73,  0.9], [0.73,  0.9], [2.2,  0.9]
    ];
    pillarPositions.forEach(([px, pz]) => {
      const pillar = new THREE.Mesh(pillarGeo, woodMat);
      pillar.position.set(px, 1.6, pz);
      pillar.castShadow = true;
      this.modelGroup.add(pillar);
    });

    // Full thatch roof with ridge beam
    const roofBase = new THREE.Mesh(new THREE.BoxGeometry(5.4, 0.2, 3.6), thatchMat);
    roofBase.position.set(0, 2.9, -0.45);
    roofBase.rotation.x = 0.1;
    roofBase.castShadow = true;
    this.modelGroup.add(roofBase);

    const ridgeBeam = new THREE.Mesh(new THREE.BoxGeometry(5.4, 0.18, 0.2), woodMat);
    ridgeBeam.position.set(0, 3.1, -0.45);
    this.modelGroup.add(ridgeBeam);

    // 2 horse stall dividers (planks)
    [-0.73, 0.73].forEach(px => {
      const divider = new THREE.Mesh(new THREE.BoxGeometry(0.1, 1.2, 2.5), fenceMat);
      divider.position.set(px, 0.9, -0.9);
      this.modelGroup.add(divider);
    });

    // Fence rails at front
    const makeFence = (w, x, y, z, rotY = 0) => {
      const rail = new THREE.Mesh(new THREE.BoxGeometry(w, 0.12, 0.08), fenceMat);
      rail.position.set(x, y, z);
      rail.rotation.y = rotY;
      this.modelGroup.add(rail);
    };
    makeFence(5.0, 0, 0.5,  2.6);
    makeFence(5.0, 0, 0.9,  2.6);
    makeFence(2.5, -2.4, 0.5, 1.4, Math.PI / 2);
    makeFence(2.5, -2.4, 0.9, 1.4, Math.PI / 2);
    makeFence(2.5,  2.4, 0.5, 1.4, Math.PI / 2);
    makeFence(2.5,  2.4, 0.9, 1.4, Math.PI / 2);

    // Water trough (elongated box)
    const trough = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.45, 0.65), woodMat);
    trough.position.set(-1.6, 0.42, 1.8);
    this.modelGroup.add(trough);
    const troughWater = new THREE.Mesh(new THREE.PlaneGeometry(1.4, 0.5), waterMat);
    troughWater.position.set(-1.6, 0.6, 1.8);
    troughWater.rotation.x = -Math.PI / 2;
    this.modelGroup.add(troughWater);

    // Hay bales (stacked cubes, golden-yellow)
    const hayStack = [
      [1.6, 0.35, -0.3, 0.9, 0.65, 0.75],
      [1.65, 0.85, -0.25, 0.75, 0.55, 0.65],
      [1.5, 1.25, -0.2, 0.6, 0.45, 0.55]
    ];
    hayStack.forEach(([x, y, z, w, h, d]) => {
      const hay = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), hayMat);
      hay.position.set(x, y, z);
      this.modelGroup.add(hay);
    });

    // Hitching post at front with rope detail
    const hitchPost = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.09, 1.3, 6), woodMat);
    hitchPost.position.set(0, 0.8, 2.6);
    this.modelGroup.add(hitchPost);
    const ropeMat = new THREE.MeshStandardMaterial({ color: 0xc19a6b, roughness: 0.9 });
    const rope = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 1.2, 6), ropeMat);
    rope.rotation.z = Math.PI / 2;
    rope.position.set(0, 1.2, 2.6);
    this.modelGroup.add(rope);

    // Decorative banner with horse-motif color (gold/enemy-dark)
    const bannerPole = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 2.5, 6), woodMat);
    bannerPole.position.set(2.0, 1.95, -1.8);
    this.modelGroup.add(bannerPole);
    const banner = new THREE.Mesh(new THREE.PlaneGeometry(0.75, 0.48), bannerMat);
    banner.position.set(2.38, 2.6, -1.8);
    this.modelGroup.add(banner);
  }

  // ——— Tier 3: နန်းတော် မြင်းစခန်းတော် — Royal Stables ———
  _buildStablesTier3() {
    const brickMat  = new THREE.MeshStandardMaterial({ color: 0x922b21, roughness: 0.9 });
    const stoneMat  = new THREE.MeshStandardMaterial({ color: 0x7f8c8d, roughness: 0.9 });
    const woodMat   = new THREE.MeshStandardMaterial({ color: 0x4e342e, roughness: 0.8 });
    const goldMat   = new THREE.MeshStandardMaterial({ color: 0xd4ac0d, metalness: 0.6, roughness: 0.3 });
    const roofMat   = new THREE.MeshStandardMaterial({
      color: this.faction === 'enemy' ? 0x2c3e50 : 0xa04000,
      roughness: 0.8
    });
    const hayMat    = new THREE.MeshStandardMaterial({ color: 0xd4ac0d, roughness: 0.95 });
    const waterMat  = new THREE.MeshStandardMaterial({ color: 0x1a7abf, roughness: 0.2 });
    const fireMat   = new THREE.MeshStandardMaterial({ color: 0xff6600, emissive: 0xff6600, emissiveIntensity: 1.0, roughness: 0.3 });
    const bannerCols= [0xd4ac0d, 0x922b21, 0xa04000, 0x7f8c8d];

    // Large brick base platform
    const platform = new THREE.Mesh(new THREE.BoxGeometry(7.0, 0.4, 7.0), stoneMat);
    platform.position.y = 0.2;
    platform.castShadow = true;
    this.modelGroup.add(platform);

    // Brick perimeter walls (6.5 x 6.5 structure)
    const walls = new THREE.Mesh(new THREE.BoxGeometry(6.5, 2.2, 6.5), brickMat);
    walls.position.y = 1.5;
    walls.castShadow = true;
    this.modelGroup.add(walls);

    // Interior floor
    const innerFloor = new THREE.Mesh(new THREE.BoxGeometry(5.8, 0.1, 5.8), new THREE.MeshStandardMaterial({ color: 0x6d4c41, roughness: 0.95 }));
    innerFloor.position.y = 0.45;
    this.modelGroup.add(innerFloor);

    // 8 ornate pillars with golden caps
    const pillarGeo = new THREE.CylinderGeometry(0.17, 0.2, 2.5, 8);
    const capGeo    = new THREE.ConeGeometry(0.22, 0.4, 8);
    const pillarPos = [
      [-2.5, -2.5], [0, -2.5], [2.5, -2.5],
      [-2.5,  0  ], [2.5,  0  ],
      [-2.5,  2.5], [0,  2.5], [2.5,  2.5]
    ];
    pillarPos.forEach(([px, pz]) => {
      const pillar = new THREE.Mesh(pillarGeo, stoneMat);
      pillar.position.set(px, 1.65, pz);
      pillar.castShadow = true;
      this.modelGroup.add(pillar);
      const cap = new THREE.Mesh(capGeo, goldMat);
      cap.position.set(px, 3.1, pz);
      this.modelGroup.add(cap);
    });

    // 4 horse stall sections (dividers)
    [-1.8, -0.6, 0.6, 1.8].forEach(px => {
      const divider = new THREE.Mesh(new THREE.BoxGeometry(0.1, 1.5, 3.0), woodMat);
      divider.position.set(px, 1.15, 0);
      this.modelGroup.add(divider);
      // Stall back wall
      const stallBack = new THREE.Mesh(new THREE.BoxGeometry(1.1, 1.5, 0.1), woodMat);
      stallBack.position.set(px + 0.6, 1.15, -1.5);
      this.modelGroup.add(stallBack);
    });

    // Water troughs
    [[-2.5, 2.8], [2.5, 2.8]].forEach(([tx, tz]) => {
      const trough = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.5, 0.65), woodMat);
      trough.position.set(tx, 0.5, tz);
      this.modelGroup.add(trough);
      const troughWater = new THREE.Mesh(new THREE.PlaneGeometry(1.6, 0.5), waterMat);
      troughWater.position.set(tx, 0.7, tz);
      troughWater.rotation.x = -Math.PI / 2;
      this.modelGroup.add(troughWater);
    });

    // Hay bales
    [[2.2, 0.35, -2.2], [2.3, 0.85, -2.1], [2.1, 1.25, -2.3]].forEach(([x, y, z]) => {
      const hay = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.65, 0.8), hayMat);
      hay.position.set(x, y, z);
      this.modelGroup.add(hay);
    });

    // Multi-tier pagoda-style roof
    const roofData = [
      { w: 7.4, y: 2.6 }, { r: 4.0, h: 1.2, y: 3.0 },
      { r: 3.0, h: 1.0, y: 3.9 },
      { r: 2.0, h: 0.85, y: 4.7 },
      { r: 1.2, h: 0.65, y: 5.4 }
    ];
    // Eave bases and cone tiers
    [[4.0, 0.2, 7.4, 2.75], [3.0, 0.2, 6.2, 3.65], [2.0, 0.18, 4.4, 4.5], [1.2, 0.15, 2.6, 5.2]].forEach(([r, bh, bw, by]) => {
      const eave = new THREE.Mesh(new THREE.BoxGeometry(bw, bh, bw), roofMat);
      eave.position.y = by; eave.castShadow = true;
      this.modelGroup.add(eave);
    });
    [[4.0, 1.2, 3.1], [3.0, 1.0, 4.0], [2.0, 0.85, 4.75], [1.2, 0.65, 5.3]].forEach(([r, h, y]) => {
      const cone = new THREE.Mesh(new THREE.ConeGeometry(r, h, 4), roofMat);
      cone.position.y = y; cone.rotation.y = Math.PI / 4; cone.castShadow = true;
      this.modelGroup.add(cone);
    });

    // Golden horse statue on roof (sphere body + box head)
    const horseBody = new THREE.Mesh(new THREE.SphereGeometry(0.3, 10, 10), goldMat);
    horseBody.position.y = 6.1;
    this.modelGroup.add(horseBody);
    const horseHead = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.22, 0.28), goldMat);
    horseHead.position.set(0.2, 6.3, 0);
    this.modelGroup.add(horseHead);
    const horseNeck = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.13, 0.25, 6), goldMat);
    horseNeck.position.set(0.1, 6.22, 0); horseNeck.rotation.z = Math.PI / 6;
    this.modelGroup.add(horseNeck);

    // 2 fire braziers at entrance
    [[-0.9, 2.8], [0.9, 2.8]].forEach(([bx, bz]) => {
      const stand = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.16, 1.2, 8), stoneMat);
      stand.position.set(bx, 1.0, bz);
      this.modelGroup.add(stand);
      const bowl = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.14, 0.3, 8), stoneMat);
      bowl.position.set(bx, 1.75, bz);
      this.modelGroup.add(bowl);
      const flame = new THREE.Mesh(new THREE.SphereGeometry(0.18, 8, 8), fireMat);
      flame.position.set(bx, 2.0, bz);
      this.modelGroup.add(flame);
    });

    // Decorative carved beams (crossbeams under roof)
    [[-2.5, 2.65, 0], [2.5, 2.65, 0], [0, 2.65, -2.5], [0, 2.65, 2.5]].forEach(([bx, by, bz]) => {
      const isZ = bz !== 0;
      const beamGeo = isZ
        ? new THREE.BoxGeometry(5.5, 0.14, 0.18)
        : new THREE.BoxGeometry(0.18, 0.14, 5.5);
      const beam = new THREE.Mesh(beamGeo, woodMat);
      beam.position.set(isZ ? 0 : bx, by, isZ ? bz : 0);
      this.modelGroup.add(beam);
    });

    // Royal banner poles with colored flags (4 corners)
    [[-3.0, -3.0], [3.0, -3.0], [-3.0, 3.0], [3.0, 3.0]].forEach(([px, pz], i) => {
      const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 3.0, 6), woodMat);
      pole.position.set(px, 3.9, pz);
      this.modelGroup.add(pole);
      const fMat = new THREE.MeshStandardMaterial({ color: bannerCols[i], side: THREE.DoubleSide });
      const flag = new THREE.Mesh(new THREE.PlaneGeometry(0.75, 0.48), fMat);
      flag.position.set(px + 0.38, 4.75, pz);
      this.modelGroup.add(flag);
    });
  }
}
