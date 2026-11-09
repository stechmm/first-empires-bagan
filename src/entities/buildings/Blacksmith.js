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

    this.createBlacksmith3DModel();
  }

  createBlacksmith3DModel() {
    const brickMat = new THREE.MeshStandardMaterial({ color: 0x873600, roughness: 0.85 });
    const woodMat = new THREE.MeshStandardMaterial({ color: 0x4a2311, roughness: 0.8 });
    const ironMat = new THREE.MeshStandardMaterial({ color: 0x2c3e50, metalness: 0.85, roughness: 0.3 });
    const fireMat = new THREE.MeshStandardMaterial({
      color: 0xff3300,
      emissive: 0xff2200,
      emissiveIntensity: 0.8,
      roughness: 0.2
    });
    const roofMat = new THREE.MeshStandardMaterial({ color: 0x78281f, roughness: 0.6 });

    this.modelGroup = new THREE.Group();

    // 1. Stone/Brick Base
    const baseGeo = new THREE.BoxGeometry(4.4, 0.25, 4.4);
    const base = new THREE.Mesh(baseGeo, brickMat);
    base.position.y = 0.125;
    this.modelGroup.add(base);

    // 2. Brick Smelting Furnace & Chimney (မီးဖိုနှင့် မီးခိုးခေါင်းတိုင်)
    const furnace = new THREE.Mesh(new THREE.BoxGeometry(1.6, 1.4, 1.6), brickMat);
    furnace.position.set(-1.0, 0.8, -1.0);
    this.modelGroup.add(furnace);

    const chimney = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.45, 2.2, 8), brickMat);
    chimney.position.set(-1.0, 2.4, -1.0);
    this.modelGroup.add(chimney);

    // Glowing Forge Fire Interior
    const fire = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.5, 0.8), fireMat);
    fire.position.set(-1.0, 0.5, -0.4);
    this.modelGroup.add(fire);

    // 3. Blacksmith Anvil (သံပေတုံး)
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

    // 4. Quenching Water Trough (ဓားသံထည့်သော ရေကန်)
    const trough = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.4, 1.2), woodMat);
    trough.position.set(1.4, 0.3, -0.4);
    this.modelGroup.add(trough);

    const water = new THREE.Mesh(new THREE.PlaneGeometry(0.5, 1.0), new THREE.MeshStandardMaterial({ color: 0x1b4f72, roughness: 0.1 }));
    water.rotation.x = -Math.PI / 2;
    water.position.set(1.4, 0.48, -0.4);
    this.modelGroup.add(water);

    // Glowing Red Hot Sword on Anvil
    const hotSword = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.04, 0.6), new THREE.MeshStandardMaterial({
      color: 0xff3300,
      emissive: 0xff4400,
      emissiveIntensity: 0.8
    }));
    hotSword.position.set(0.6, 0.88, 0.4);
    this.modelGroup.add(hotSword);

    // 5. Open-Sided Roof over the work area
    const posts = [[-1.8, 1.0, 1.8], [1.8, 1.0, 1.8], [1.8, 1.0, -1.8]];
    posts.forEach(p => {
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
}
