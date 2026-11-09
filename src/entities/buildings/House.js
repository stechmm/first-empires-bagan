import * as THREE from 'three';
import { Building } from '../Building.js';

export class House extends Building {
  constructor(game, options = {}) {
    super(game, {
      ...options,
      name: options.name || 'လူနေအိမ် (Bagan House)',
      type: 'house',
      hp: options.hp || 450,
      size: 3
    });

    this.createHouse3DModel();

    // Increase player population cap by 10 upon construction (only if already built/not under construction)
    if (!this.underConstruction && this.faction === 'player' && this.game.economySystem) {
      this.game.economySystem.resources.maxPopulation += 10;
      this.game.economySystem.updateUI();

      if (this.game.hud) {
        this.game.hud.showFloatingText('+10 👥 လူဦးရေ', this.mesh.position, '#2ecc71');
      }
    }
  }

  createHouse3DModel() {
    // Remove old model if exists
    if (this.modelGroup) { this.mesh.remove(this.modelGroup); }
    this.modelGroup = new THREE.Group();

    if (this.tier === 2) { this._buildHouseTier2(); }
    else if (this.tier === 3) { this._buildHouseTier3(); }
    else { this._buildHouseTier1(); }

    this.mesh.add(this.modelGroup);
    this.createHpBar(2.0, 0.16, 3.4 + (this.tier || 1) * 0.5);
  }

  rebuildModel() { this.createHouse3DModel(); }

  // ——— Tier 1: ဝါးအိမ် — Bamboo Hut ———
  _buildHouseTier1() {
    const woodMat = new THREE.MeshStandardMaterial({ color: 0x4a2311, roughness: 0.8 });
    const plankMat = new THREE.MeshStandardMaterial({ color: 0x6e2c00, roughness: 0.75 });
    const thatchMat = new THREE.MeshStandardMaterial({
      color: this.faction === 'enemy' ? 0x2c3e50 : 0xa04000,
      roughness: 0.95
    });
    const lanternMat = new THREE.MeshStandardMaterial({
      color: 0xf39c12,
      emissive: 0xf39c12,
      emissiveIntensity: 0.6,
      roughness: 0.3
    });

    // 1. Four Corner Wooden Stilts (မြေစိုက် တိုင်ထောင်များ)
    const stiltGeo = new THREE.CylinderGeometry(0.08, 0.08, 1.0, 6);
    const stiltPositions = [
      [-1.1, 0.5, -1.1], [1.1, 0.5, -1.1],
      [-1.1, 0.5, 1.1], [1.1, 0.5, 1.1]
    ];
    stiltPositions.forEach(pos => {
      const stilt = new THREE.Mesh(stiltGeo, woodMat);
      stilt.position.set(pos[0], pos[1], pos[2]);
      this.modelGroup.add(stilt);
    });

    // 2. Raised Wooden Plank Floor & Chamber (ကြမ်းပြင်နှင့် ပျဉ်ထောင်နံရံ)
    const floorGeo = new THREE.BoxGeometry(2.4, 0.15, 2.4);
    const floor = new THREE.Mesh(floorGeo, plankMat);
    floor.position.y = 1.0;
    floor.castShadow = true;
    this.modelGroup.add(floor);

    const roomGeo = new THREE.BoxGeometry(2.1, 1.2, 2.1);
    const room = new THREE.Mesh(roomGeo, plankMat);
    room.position.set(0, 1.65, 0);
    room.castShadow = true;
    this.modelGroup.add(room);

    // Front Wooden Door
    const doorGeo = new THREE.BoxGeometry(0.6, 0.9, 0.1);
    const door = new THREE.Mesh(doorGeo, woodMat);
    door.position.set(0, 1.5, 1.06);
    this.modelGroup.add(door);

    // Side window
    const winGeo = new THREE.BoxGeometry(0.1, 0.5, 0.5);
    const win = new THREE.Mesh(winGeo, woodMat);
    win.position.set(1.06, 1.7, 0);
    this.modelGroup.add(win);

    // 3. Wooden Access Ladder at Front (ရှေ့လှေကားငယ်)
    for (let i = 0; i < 3; i++) {
      const rung = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.08, 0.25), woodMat);
      rung.position.set(0, (i + 0.5) * 0.3, 1.25 + i * 0.2);
      this.modelGroup.add(rung);
    }

    // 4. Overhanging Thatched Gable Roof (ဓနိ/သက်ကယ်မိုး)
    const roofBaseGeo = new THREE.BoxGeometry(2.6, 0.2, 2.6);
    const roofBase = new THREE.Mesh(roofBaseGeo, thatchMat);
    roofBase.position.y = 2.3;
    roofBase.castShadow = true;
    this.modelGroup.add(roofBase);

    const roofGableGeo = new THREE.ConeGeometry(1.6, 0.9, 4);
    const roofGable = new THREE.Mesh(roofGableGeo, thatchMat);
    roofGable.position.y = 2.8;
    roofGable.rotation.y = Math.PI / 4;
    roofGable.castShadow = true;
    this.modelGroup.add(roofGable);

    // 5. Traditional Burmese Clay Water Pot on Veranda (ရေအိုးစင်)
    const potStand = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.25, 0.35), woodMat);
    potStand.position.set(-0.8, 1.15, 1.0);
    this.modelGroup.add(potStand);

    const clayPot = new THREE.Mesh(
      new THREE.SphereGeometry(0.14, 8, 8),
      new THREE.MeshStandardMaterial({ color: 0xba4a00, roughness: 0.9 })
    );
    clayPot.position.set(-0.8, 1.35, 1.0);
    this.modelGroup.add(clayPot);

    // 6. Warm Hanging Porch Lantern (မီးအိမ်ငယ်)
    const lantern = new THREE.Mesh(new THREE.BoxGeometry(0.15, 0.2, 0.15), lanternMat);
    lantern.position.set(0.45, 2.1, 1.2);
    this.modelGroup.add(lantern);
  }

  // ——— Tier 2: သစ်သားအိမ် — Teak Wood House ———
  _buildHouseTier2() {
    const woodMat     = new THREE.MeshStandardMaterial({ color: 0x4e342e, roughness: 0.8 });
    const teakMat     = new THREE.MeshStandardMaterial({ color: 0x3e2723, roughness: 0.75 });
    const thatchMat   = new THREE.MeshStandardMaterial({
      color: this.faction === 'enemy' ? 0x2c3e50 : 0xa04000,
      roughness: 0.9
    });
    const stoneMat    = new THREE.MeshStandardMaterial({ color: 0x7f8c8d, roughness: 0.9 });
    const lanternMat  = new THREE.MeshStandardMaterial({ color: 0xf39c12, emissive: 0xf39c12, emissiveIntensity: 0.7, roughness: 0.3 });
    const goldMat     = new THREE.MeshStandardMaterial({ color: 0xd4ac0d, metalness: 0.4, roughness: 0.5 });
    const clayMat     = new THREE.MeshStandardMaterial({ color: 0xba4a00, roughness: 0.9 });
    const flowerMat   = new THREE.MeshStandardMaterial({ color: 0xe74c3c, roughness: 0.8 });

    // Stone foundation blocks (instead of stilts)
    for (let i = -1; i <= 1; i += 2) {
      for (let j = -1; j <= 1; j += 2) {
        const block = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.4, 0.6), stoneMat);
        block.position.set(i * 1.2, 0.2, j * 1.2);
        this.modelGroup.add(block);
      }
    }

    // Wider floor platform
    const floor = new THREE.Mesh(new THREE.BoxGeometry(2.8, 0.14, 2.8), teakMat);
    floor.position.y = 0.47;
    floor.castShadow = true;
    this.modelGroup.add(floor);

    // Taller walls
    const room = new THREE.Mesh(new THREE.BoxGeometry(2.6, 1.6, 2.6), teakMat);
    room.position.set(0, 1.27, 0);
    room.castShadow = true;
    this.modelGroup.add(room);

    // Front veranda (covered porch)
    const verandaFloor = new THREE.Mesh(new THREE.BoxGeometry(2.8, 0.1, 0.8), teakMat);
    verandaFloor.position.set(0, 0.47, 1.8);
    this.modelGroup.add(verandaFloor);

    // 2 veranda pillars
    const pillarGeo = new THREE.CylinderGeometry(0.1, 0.12, 1.65, 8);
    [-0.9, 0.9].forEach(px => {
      const pillar = new THREE.Mesh(pillarGeo, woodMat);
      pillar.position.set(px, 1.3, 1.8);
      pillar.castShadow = true;
      this.modelGroup.add(pillar);
    });

    // Veranda roof beam
    const verandaRoof = new THREE.Mesh(new THREE.BoxGeometry(2.8, 0.14, 0.9), thatchMat);
    verandaRoof.position.set(0, 2.1, 1.75);
    this.modelGroup.add(verandaRoof);

    // Decorative carved wood trim under roof
    const trim = new THREE.Mesh(new THREE.BoxGeometry(2.9, 0.12, 2.9), goldMat);
    trim.position.set(0, 2.09, 0);
    this.modelGroup.add(trim);

    // Front door
    const door = new THREE.Mesh(new THREE.BoxGeometry(0.65, 1.1, 0.1), woodMat);
    door.position.set(0, 0.95, 1.31);
    this.modelGroup.add(door);

    // 2 windows with shutters on each side wall
    const shutterMat = woodMat;
    [[-1.31, 0], [1.31, 0]].forEach(([wx, wz]) => {
      const winFrame = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.6, 0.65), stoneMat);
      winFrame.position.set(wx, 1.3, wz);
      this.modelGroup.add(winFrame);
      // Shutter panels
      const shutL = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.55, 0.28), shutterMat);
      shutL.position.set(wx + (wx < 0 ? 0.04 : -0.04), 1.3, wz - 0.17);
      this.modelGroup.add(shutL);
      const shutR = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.55, 0.28), shutterMat);
      shutR.position.set(wx + (wx < 0 ? 0.04 : -0.04), 1.3, wz + 0.17);
      this.modelGroup.add(shutR);
    });
    // Also back wall window
    const backWin = new THREE.Mesh(new THREE.BoxGeometry(0.65, 0.5, 0.08), stoneMat);
    backWin.position.set(0, 1.3, -1.31);
    this.modelGroup.add(backWin);

    // Double-layered thatch roof (wider overhang)
    const roofLow = new THREE.Mesh(new THREE.BoxGeometry(3.2, 0.2, 3.2), thatchMat);
    roofLow.position.y = 2.15;
    roofLow.castShadow = true;
    this.modelGroup.add(roofLow);

    const roofCone1 = new THREE.Mesh(new THREE.ConeGeometry(2.0, 1.1, 4), thatchMat);
    roofCone1.position.y = 2.7;
    roofCone1.rotation.y = Math.PI / 4;
    roofCone1.castShadow = true;
    this.modelGroup.add(roofCone1);

    const roofCone2 = new THREE.Mesh(new THREE.ConeGeometry(1.3, 0.75, 4), thatchMat);
    roofCone2.position.y = 3.4;
    roofCone2.rotation.y = Math.PI / 4;
    roofCone2.castShadow = true;
    this.modelGroup.add(roofCone2);

    // 2 clay pots
    [-0.9, 0.9].forEach(px => {
      const pot = new THREE.Mesh(new THREE.SphereGeometry(0.14, 8, 8), clayMat);
      pot.position.set(px, 0.65, 2.0);
      this.modelGroup.add(pot);
    });

    // Hanging lantern above veranda
    const lantern = new THREE.Mesh(new THREE.BoxGeometry(0.17, 0.22, 0.17), lanternMat);
    lantern.position.set(0, 2.0, 1.75);
    this.modelGroup.add(lantern);

    // Flower pots on each side of door
    [-0.5, 0.5].forEach(px => {
      const pot = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.08, 0.2, 8), clayMat);
      pot.position.set(px, 0.57, 1.45);
      this.modelGroup.add(pot);
      const flower = new THREE.Mesh(new THREE.SphereGeometry(0.1, 6, 6), flowerMat);
      flower.position.set(px, 0.73, 1.45);
      this.modelGroup.add(flower);
    });
  }

  // ——— Tier 3: ကျောက်ခဲအိမ်ကြီး — Brick Mansion ———
  _buildHouseTier3() {
    const brickMat  = new THREE.MeshStandardMaterial({ color: 0x922b21, roughness: 0.9 });
    const stoneMat  = new THREE.MeshStandardMaterial({ color: 0x7f8c8d, roughness: 0.9 });
    const goldMat   = new THREE.MeshStandardMaterial({ color: 0xd4ac0d, metalness: 0.6, roughness: 0.3 });
    const woodMat   = new THREE.MeshStandardMaterial({ color: 0x4e342e, roughness: 0.8 });
    const torchMat  = new THREE.MeshStandardMaterial({ color: 0xff6600, emissive: 0xff6600, emissiveIntensity: 0.9, roughness: 0.3 });
    const roofMat   = new THREE.MeshStandardMaterial({ color: this.faction === 'enemy' ? 0x2c3e50 : 0xa04000, roughness: 0.75 });
    const stoneDark = new THREE.MeshStandardMaterial({ color: 0x626567, roughness: 0.95 });

    // Stone base platform (raised 0.3)
    const platform = new THREE.Mesh(new THREE.BoxGeometry(3.8, 0.3, 3.8), stoneMat);
    platform.position.y = 0.15;
    platform.castShadow = true;
    this.modelGroup.add(platform);

    // Large brick walls
    const walls = new THREE.Mesh(new THREE.BoxGeometry(3.2, 1.8, 3.2), brickMat);
    walls.position.y = 1.2;
    walls.castShadow = true;
    this.modelGroup.add(walls);

    // 4 corner decorative posts with golden caps
    const postGeo = new THREE.CylinderGeometry(0.12, 0.14, 2.0, 8);
    const capGeo  = new THREE.ConeGeometry(0.18, 0.3, 8);
    [[-1.6, -1.6], [1.6, -1.6], [-1.6, 1.6], [1.6, 1.6]].forEach(([px, pz]) => {
      const post = new THREE.Mesh(postGeo, stoneDark);
      post.position.set(px, 1.3, pz);
      post.castShadow = true;
      this.modelGroup.add(post);
      const cap = new THREE.Mesh(capGeo, goldMat);
      cap.position.set(px, 2.45, pz);
      this.modelGroup.add(cap);
    });

    // Front staircase: 3 stone steps
    for (let s = 0; s < 3; s++) {
      const stepW = 1.6 - s * 0.2;
      const step = new THREE.Mesh(new THREE.BoxGeometry(stepW, 0.1, 0.4), stoneMat);
      step.position.set(0, 0.3 + s * 0.1, 1.9 - s * 0.4);
      this.modelGroup.add(step);
    }

    // Multi-panel carved door with golden handle
    const door = new THREE.Mesh(new THREE.BoxGeometry(0.9, 1.4, 0.1), woodMat);
    door.position.set(0, 0.9, 1.61);
    this.modelGroup.add(door);
    const handle = new THREE.Mesh(new THREE.SphereGeometry(0.06, 6, 6), goldMat);
    handle.position.set(0.25, 0.9, 1.67);
    this.modelGroup.add(handle);

    // 3 ornate windows with stone frames
    const winData = [[-1.62, 1.2, 0], [1.62, 1.2, 0], [0, 1.2, -1.62]];
    winData.forEach(([wx, wy, wz]) => {
      const isZWall = wz !== 0;
      const frameGeo = isZWall
        ? new THREE.BoxGeometry(0.9, 0.7, 0.1)
        : new THREE.BoxGeometry(0.1, 0.7, 0.9);
      const frame = new THREE.Mesh(frameGeo, stoneMat);
      frame.position.set(wx, wy, wz);
      this.modelGroup.add(frame);
      const innerGeo = isZWall
        ? new THREE.BoxGeometry(0.65, 0.5, 0.08)
        : new THREE.BoxGeometry(0.08, 0.5, 0.65);
      const inner = new THREE.Mesh(innerGeo,
        new THREE.MeshStandardMaterial({ color: 0x1a252f, roughness: 0.5 }));
      inner.position.set(wx, wy, wz);
      this.modelGroup.add(inner);
    });

    // Ornamental 3-tier pagoda-style roof
    const roofTiers = [
      { r: 2.4, h: 0.9, y: 2.15 },
      { r: 1.8, h: 0.75, y: 2.75 },
      { r: 1.2, h: 0.65, y: 3.3 }
    ];
    roofTiers.forEach(({ r, h, y }) => {
      const eave = new THREE.Mesh(new THREE.BoxGeometry(r * 2 + 0.2, 0.15, r * 2 + 0.2), roofMat);
      eave.position.y = y;
      eave.castShadow = true;
      this.modelGroup.add(eave);
      const cone = new THREE.Mesh(new THREE.ConeGeometry(r, h, 4), roofMat);
      cone.position.y = y + h / 2 + 0.1;
      cone.rotation.y = Math.PI / 4;
      cone.castShadow = true;
      this.modelGroup.add(cone);
    });

    // Golden finial on top
    const finial = new THREE.Mesh(new THREE.ConeGeometry(0.2, 0.9, 8), goldMat);
    finial.position.y = 4.1;
    this.modelGroup.add(finial);
    const finialBall = new THREE.Mesh(new THREE.SphereGeometry(0.14, 8, 8), goldMat);
    finialBall.position.y = 4.6;
    this.modelGroup.add(finialBall);

    // Exterior wall-mounted torches (emissive orange)
    [[1.65, 1.1, 0.8], [-1.65, 1.1, 0.8]].forEach(([tx, ty, tz]) => {
      const torch = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.4, 6), woodMat);
      torch.position.set(tx, ty, tz);
      this.modelGroup.add(torch);
      const flame = new THREE.Mesh(new THREE.SphereGeometry(0.1, 6, 6), torchMat);
      flame.position.set(tx, ty + 0.28, tz);
      this.modelGroup.add(flame);
    });

    // Two guardian chinthe lion statues flanking door
    [[-0.65, 0], [0.65, 0]].forEach(([cx, cz]) => {
      // Body (sphere)
      const body = new THREE.Mesh(new THREE.SphereGeometry(0.2, 8, 8), stoneMat);
      body.position.set(cx, 0.5, 1.72);
      this.modelGroup.add(body);
      // Head
      const head = new THREE.Mesh(new THREE.SphereGeometry(0.14, 8, 8), stoneMat);
      head.position.set(cx, 0.72, 1.82);
      this.modelGroup.add(head);
      // Base
      const base = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.1, 0.3), stoneDark);
      base.position.set(cx, 0.35, 1.72);
      this.modelGroup.add(base);
    });
  }

  destroy() {
    // If destroyed, reduce player population cap by 10
    if (this.faction === 'player' && this.game.economySystem) {
      this.game.economySystem.resources.maxPopulation = Math.max(15, this.game.economySystem.resources.maxPopulation - 10);
      this.game.economySystem.updateUI();

      if (this.game.hud) {
        this.game.hud.showFloatingText('-10 👥 လူဦးရေ', this.mesh.position, '#e74c3c');
      }
    }

    super.destroy();
  }
}
