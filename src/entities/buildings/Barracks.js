import * as THREE from 'three';
import { Building } from '../Building.js';

export class Barracks extends Building {
  constructor(game, options = {}) {
    super(game, {
      ...options,
      name: options.name || 'စစ်သည်တပ်ရုံ (Infantry Barracks)',
      type: 'barracks',
      hp: options.hp || 950,
      size: 4
    });

    this.createBarracks3DModel();
  }

  rebuildModel() {
    const keep = new Set([
      this.hpBarGroup,
      this.selectionBoxMesh,
      this.rallyFlagGroup,
      this.scaffoldGroup,
      this.constructionUIGroup
    ]);
    const toRemove = this.mesh.children.filter(c => !keep.has(c));
    toRemove.forEach(c => this.mesh.remove(c));
    this.modelGroup = null;
    this.createBarracks3DModel();
  }

  createBarracks3DModel() {
    this.modelGroup = new THREE.Group();

    if (!this.tier || this.tier === 1) {
      this._buildBarracksTier1();
    } else if (this.tier === 2) {
      this._buildBarracksTier2();
    } else {
      this._buildBarracksTier3();
    }

    this.mesh.add(this.modelGroup);
    this.createHpBar(2.6 + (this.tier - 1) * 0.4, 0.18, 4.2 + (this.tier - 1) * 0.9);
  }

  _buildBarracksTier1() {
    const brickMat = new THREE.MeshStandardMaterial({
      color: this.faction === 'enemy' ? 0x2c3e50 : 0x873600,
      roughness: 0.85
    });
    const teakMat = new THREE.MeshStandardMaterial({
      color: this.faction === 'enemy' ? 0x1c2833 : 0x4a2311,
      roughness: 0.8
    });
    const thatchMat = new THREE.MeshStandardMaterial({
      color: this.faction === 'enemy' ? 0x512e5f : 0x935116,
      roughness: 0.9
    });
    const bannerMat = new THREE.MeshStandardMaterial({
      color: this.faction === 'enemy' ? 0x922b21 : 0xd35400,
      side: THREE.DoubleSide
    });
    const woodMat = new THREE.MeshStandardMaterial({ color: 0x5d4037, roughness: 0.8 });
    const targetMat = new THREE.MeshStandardMaterial({ color: 0xf39c12, roughness: 0.9 });

    // 1. Brick Base Foundation & Dirt Training Yard
    const baseGeo = new THREE.BoxGeometry(4.8, 0.3, 4.4);
    const base = new THREE.Mesh(baseGeo, brickMat);
    base.position.y = 0.15;
    base.receiveShadow = true;
    this.modelGroup.add(base);

    // 2. Main Wooden Barracks Quarters
    const hallGeo = new THREE.BoxGeometry(3.6, 1.4, 2.2);
    const hall = new THREE.Mesh(hallGeo, teakMat);
    hall.position.set(0, 1.0, -0.6);
    hall.castShadow = true;
    this.modelGroup.add(hall);

    // Front Colonnade Pillars for Veranda
    [-1.5, -0.5, 0.5, 1.5].forEach(x => {
      const pGeo = new THREE.CylinderGeometry(0.08, 0.08, 1.4, 6);
      const pillar = new THREE.Mesh(pGeo, woodMat);
      pillar.position.set(x, 1.0, 0.6);
      pillar.castShadow = true;
      this.modelGroup.add(pillar);
    });

    // 3. Multi-tier Sloped Roof
    const roofGeo = new THREE.BoxGeometry(4.2, 0.35, 3.2);
    const roof = new THREE.Mesh(roofGeo, thatchMat);
    roof.position.set(0, 1.85, -0.1);
    roof.castShadow = true;
    this.modelGroup.add(roof);

    const gableGeo = new THREE.ConeGeometry(1.8, 0.9, 4);
    const gable = new THREE.Mesh(gableGeo, thatchMat);
    gable.position.set(0, 2.3, -0.1);
    gable.rotation.y = Math.PI / 4;
    gable.castShadow = true;
    this.modelGroup.add(gable);

    // 4. Training Yard Dummies & Weapon Racks
    const targetStand = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 1.1, 6), woodMat);
    targetStand.position.set(1.4, 0.55, 1.3);
    this.modelGroup.add(targetStand);

    const targetStraw = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.35, 0.12, 12), targetMat);
    targetStraw.position.set(1.4, 0.85, 1.3);
    targetStraw.rotation.x = Math.PI / 2;
    this.modelGroup.add(targetStraw);

    const rackBeam = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.08, 0.1), woodMat);
    rackBeam.position.set(-1.2, 0.7, 1.2);
    this.modelGroup.add(rackBeam);

    [-1.6, -1.2, -0.8].forEach(x => {
      const spear = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 1.4, 4), woodMat);
      spear.position.set(x, 0.7, 1.2);
      spear.rotation.z = 0.1;
      this.modelGroup.add(spear);
    });

    // 5. Tall Royal Banner Pole with Golden Finial
    const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 3.8, 6), woodMat);
    pole.position.set(-1.9, 1.9, 1.6);
    this.modelGroup.add(pole);

    const spearTip = new THREE.Mesh(new THREE.ConeGeometry(0.08, 0.25, 6), new THREE.MeshStandardMaterial({ color: 0xf1c40f }));
    spearTip.position.set(-1.9, 3.9, 1.6);
    this.modelGroup.add(spearTip);

    const banner = new THREE.Mesh(new THREE.PlaneGeometry(0.75, 1.5), bannerMat);
    banner.position.set(-1.5, 3.0, 1.6);
    this.modelGroup.add(banner);

    // 6. Two Flaming Military Fire Braziers
    [[-1.8, 0.8], [1.8, 0.8]].forEach(([bx, bz]) => {
      const stand = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.12, 0.9, 6), woodMat);
      stand.position.set(bx, 0.45, bz);
      this.modelGroup.add(stand);

      const bowl = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.1, 0.16, 8), new THREE.MeshStandardMaterial({ color: 0x222222, metalness: 0.8 }));
      bowl.position.set(bx, 0.95, bz);
      this.modelGroup.add(bowl);

      const fire = new THREE.Mesh(new THREE.ConeGeometry(0.14, 0.35, 6), new THREE.MeshBasicMaterial({ color: 0xff6600 }));
      fire.position.set(bx, 1.15, bz);
      this.modelGroup.add(fire);
    });
  }

  _buildBarracksTier2() {
    const isEnemy = this.faction === 'enemy';
    const brickMat = new THREE.MeshStandardMaterial({
      color: isEnemy ? 0x243342 : 0x7b241c,
      roughness: 0.75
    });
    const stoneMat = new THREE.MeshStandardMaterial({ color: 0x5d6d7e, roughness: 0.85 });
    const teakMat = new THREE.MeshStandardMaterial({
      color: isEnemy ? 0x1b2631 : 0x3e1f0e,
      roughness: 0.7
    });
    const roofMat = new THREE.MeshStandardMaterial({
      color: isEnemy ? 0x4a235a : 0x935116,
      roughness: 0.65
    });
    const goldMat = new THREE.MeshStandardMaterial({ color: 0xd4ac0d, metalness: 0.8, roughness: 0.3 });
    const woodMat = new THREE.MeshStandardMaterial({ color: 0x4e342e, roughness: 0.8 });
    const bannerMat = new THREE.MeshStandardMaterial({
      color: isEnemy ? 0x78281f : 0xb03a2e,
      side: THREE.DoubleSide
    });

    // 1. Raised Stone & Brick Terrace Foundation with 3 steps
    const terraceGeo = new THREE.BoxGeometry(5.2, 0.5, 4.8);
    const terrace = new THREE.Mesh(terraceGeo, stoneMat);
    terrace.position.y = 0.25;
    terrace.receiveShadow = true;
    this.modelGroup.add(terrace);

    // Front Stone Steps
    for (let i = 0; i < 3; i++) {
      const step = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.12, 0.3), stoneMat);
      step.position.set(0, 0.06 + i * 0.12, 2.4 + (2 - i) * 0.25);
      this.modelGroup.add(step);
    }

    // 2. Fortified Main Garrison Hall (Heavy brick with timber framing)
    const hall = new THREE.Mesh(new THREE.BoxGeometry(4.2, 1.8, 2.8), brickMat);
    hall.position.set(0, 1.4, -0.6);
    hall.castShadow = true;
    this.modelGroup.add(hall);

    // 6 Sturdy Teak Pillars along the Front Colonnade
    [-1.8, -1.1, -0.4, 0.4, 1.1, 1.8].forEach(x => {
      const pillar = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.14, 1.8, 8), teakMat);
      pillar.position.set(x, 1.4, 0.9);
      pillar.castShadow = true;
      this.modelGroup.add(pillar);
    });

    // 3. Double-tiered Bagan Eaved Roof
    const roof1 = new THREE.Mesh(new THREE.BoxGeometry(4.8, 0.35, 3.6), roofMat);
    roof1.position.set(0, 2.4, 0.1);
    roof1.castShadow = true;
    this.modelGroup.add(roof1);

    const roof2 = new THREE.Mesh(new THREE.ConeGeometry(2.2, 1.2, 4), roofMat);
    roof2.position.set(0, 3.1, 0.1);
    roof2.rotation.y = Math.PI / 4;
    roof2.castShadow = true;
    this.modelGroup.add(roof2);

    // Spire with gold finial
    const finial = new THREE.Mesh(new THREE.ConeGeometry(0.25, 0.9, 8), goldMat);
    finial.position.set(0, 4.0, 0.1);
    this.modelGroup.add(finial);

    // 4. Military Weapon Racks on both sides
    [-1.6, 1.6].forEach(sideX => {
      const rack = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.8, 0.25), woodMat);
      rack.position.set(sideX, 0.8, 1.5);
      this.modelGroup.add(rack);
      // Crossed spears
      const s1 = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 1.6, 4), woodMat);
      s1.position.set(sideX, 1.0, 1.5);
      s1.rotation.z = 0.35;
      this.modelGroup.add(s1);
      const s2 = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 1.6, 4), woodMat);
      s2.position.set(sideX, 1.0, 1.5);
      s2.rotation.z = -0.35;
      this.modelGroup.add(s2);
    });

    // 5. Dual War Banners
    [[-2.2, 1.8], [2.2, 1.8]].forEach(([px, pz]) => {
      const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 4.4, 6), teakMat);
      pole.position.set(px, 2.2, pz);
      this.modelGroup.add(pole);

      const banner = new THREE.Mesh(new THREE.PlaneGeometry(0.85, 1.8), bannerMat);
      banner.position.set(px > 0 ? px - 0.45 : px + 0.45, 3.2, pz);
      this.modelGroup.add(banner);

      const tip = new THREE.Mesh(new THREE.ConeGeometry(0.1, 0.3, 6), goldMat);
      tip.position.set(px, 4.5, pz);
      this.modelGroup.add(tip);
    });

    // 6. Royal War Gong (ကြေးစည်တော်) Stand
    const gongStand = new THREE.Mesh(new THREE.BoxGeometry(0.9, 1.2, 0.1), woodMat);
    gongStand.position.set(-1.4, 1.0, 0.9);
    this.modelGroup.add(gongStand);
    const gong = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.32, 0.06, 12), goldMat);
    gong.position.set(-1.4, 1.0, 0.98);
    gong.rotation.x = Math.PI / 2;
    this.modelGroup.add(gong);
  }

  _buildBarracksTier3() {
    const isEnemy = this.faction === 'enemy';
    const stoneDarkMat = new THREE.MeshStandardMaterial({ color: isEnemy ? 0x1b2631 : 0x424949, roughness: 0.8 });
    const redBrickMat = new THREE.MeshStandardMaterial({
      color: isEnemy ? 0x2c3e50 : 0x78281f,
      roughness: 0.7
    });
    const teakMat = new THREE.MeshStandardMaterial({
      color: isEnemy ? 0x17202a : 0x3e1f0e,
      roughness: 0.65
    });
    const roofMat = new THREE.MeshStandardMaterial({
      color: isEnemy ? 0x512e5f : 0xa04000,
      roughness: 0.6
    });
    const goldMat = new THREE.MeshStandardMaterial({ color: 0xf1c40f, metalness: 0.85, roughness: 0.25 });
    const fireMat = new THREE.MeshBasicMaterial({ color: 0xff5500 });
    const bannerMat = new THREE.MeshStandardMaterial({
      color: isEnemy ? 0x900c3f : 0xc0392b,
      side: THREE.DoubleSide
    });

    // 1. Massive Stone Bastion Platform with crenellated borders
    const plinth = new THREE.Mesh(new THREE.BoxGeometry(5.8, 0.7, 5.4), stoneDarkMat);
    plinth.position.y = 0.35;
    plinth.receiveShadow = true;
    this.modelGroup.add(plinth);

    // Monumental Stone Stairway
    for (let i = 0; i < 4; i++) {
      const step = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.16, 0.3), stoneDarkMat);
      step.position.set(0, 0.08 + i * 0.16, 2.7 + (3 - i) * 0.26);
      this.modelGroup.add(step);
    }

    // 2. Fortified Main Keep (Red Brick Fortress)
    const keep = new THREE.Mesh(new THREE.BoxGeometry(4.6, 2.4, 3.2), redBrickMat);
    keep.position.set(0, 1.9, -0.6);
    keep.castShadow = true;
    this.modelGroup.add(keep);

    // Corner Watch Turrets with Arrow Slits
    [[-2.2, -1.9], [2.2, -1.9], [-2.2, 0.7], [2.2, 0.7]].forEach(([tx, tz]) => {
      const turret = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.42, 3.2, 8), stoneDarkMat);
      turret.position.set(tx, 2.2, tz);
      this.modelGroup.add(turret);

      const tRoof = new THREE.Mesh(new THREE.ConeGeometry(0.5, 0.8, 8), roofMat);
      tRoof.position.set(tx, 4.0, tz);
      this.modelGroup.add(tRoof);

      const tSpire = new THREE.Mesh(new THREE.ConeGeometry(0.1, 0.4, 6), goldMat);
      tSpire.position.set(tx, 4.5, tz);
      this.modelGroup.add(tSpire);
    });

    // 3. 3-Tier Imperial Pyatthat Roof (နန်းမတော် ဘုံဆင့် ၃ ဆင့်)
    const tier1 = new THREE.Mesh(new THREE.BoxGeometry(5.2, 0.4, 3.8), roofMat);
    tier1.position.set(0, 3.2, -0.4);
    this.modelGroup.add(tier1);

    const tier2 = new THREE.Mesh(new THREE.BoxGeometry(3.6, 0.35, 2.6), roofMat);
    tier2.position.set(0, 3.8, -0.4);
    this.modelGroup.add(tier2);

    const crownCone = new THREE.Mesh(new THREE.ConeGeometry(2.0, 1.4, 4), roofMat);
    crownCone.position.set(0, 4.6, -0.4);
    crownCone.rotation.y = Math.PI / 4;
    this.modelGroup.add(crownCone);

    // Multi-tier Golden Royal Spire
    const spire1 = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.28, 0.7, 8), goldMat);
    spire1.position.set(0, 5.5, -0.4);
    this.modelGroup.add(spire1);

    const spire2 = new THREE.Mesh(new THREE.ConeGeometry(0.28, 1.4, 8), goldMat);
    spire2.position.set(0, 6.4, -0.4);
    this.modelGroup.add(spire2);

    const goldOrb = new THREE.Mesh(new THREE.SphereGeometry(0.12, 8, 8), goldMat);
    goldOrb.position.set(0, 7.2, -0.4);
    this.modelGroup.add(goldOrb);

    // 4. Grand Entrance Portal with Golden Royal Shield
    const arch = new THREE.Mesh(new THREE.BoxGeometry(1.6, 1.6, 0.2), teakMat);
    arch.position.set(0, 1.5, 1.02);
    this.modelGroup.add(arch);

    const shield = new THREE.Mesh(new THREE.CylinderGeometry(0.38, 0.38, 0.08, 16), goldMat);
    shield.position.set(0, 2.5, 1.05);
    shield.rotation.x = Math.PI / 2;
    this.modelGroup.add(shield);

    // 5. Four Royal Banners & 4 Blazing Braziers
    [[-2.5, 2.2], [2.5, 2.2], [-2.5, -2.2], [2.5, -2.2]].forEach(([bx, bz]) => {
      const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 5.0, 6), teakMat);
      pole.position.set(bx, 2.5, bz);
      this.modelGroup.add(pole);

      const banner = new THREE.Mesh(new THREE.PlaneGeometry(0.9, 2.2), bannerMat);
      banner.position.set(bx > 0 ? bx - 0.48 : bx + 0.48, 3.6, bz);
      this.modelGroup.add(banner);

      const tip = new THREE.Mesh(new THREE.ConeGeometry(0.12, 0.4, 6), goldMat);
      tip.position.set(bx, 5.2, bz);
      this.modelGroup.add(tip);
    });

    [[-1.6, 2.2], [1.6, 2.2]].forEach(([fx, fz]) => {
      const brazier = new THREE.Mesh(new THREE.CylinderGeometry(0.25, 0.15, 0.9, 8), goldMat);
      brazier.position.set(fx, 0.8, fz);
      this.modelGroup.add(brazier);

      const flame = new THREE.Mesh(new THREE.ConeGeometry(0.2, 0.5, 8), fireMat);
      flame.position.set(fx, 1.4, fz);
      this.modelGroup.add(flame);
    });
  }
}
