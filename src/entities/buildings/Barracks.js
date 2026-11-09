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

  createBarracks3DModel() {
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

    this.modelGroup = new THREE.Group();

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
    // Archery Straw Target
    const targetStand = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 1.1, 6), woodMat);
    targetStand.position.set(1.4, 0.55, 1.3);
    this.modelGroup.add(targetStand);

    const targetStraw = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.35, 0.12, 12), targetMat);
    targetStraw.position.set(1.4, 0.85, 1.3);
    targetStraw.rotation.x = Math.PI / 2;
    this.modelGroup.add(targetStraw);

    // Wooden Weapon Rack with Spears
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

    // 6. Two Flaming Military Fire Braziers (စစ်ဘက် မီးဒုတ်တိုင်များ)
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

    this.mesh.add(this.modelGroup);
    this.createHpBar(2.6, 0.18, 4.2);
  }
}
