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

    this.createElephantPen3DModel();
  }

  createElephantPen3DModel() {
    const heavyLogMat = new THREE.MeshStandardMaterial({ color: 0x3e2723, roughness: 0.85 });
    const woodMat = new THREE.MeshStandardMaterial({ color: 0x5d4037, roughness: 0.8 });
    const stoneMat = new THREE.MeshStandardMaterial({ color: 0x7f8c8d, roughness: 0.9 });
    const leafMat = new THREE.MeshStandardMaterial({ color: 0x1e8449, roughness: 0.6 });
    const goldMat = new THREE.MeshStandardMaterial({ color: 0xf1c40f, metalness: 0.6, roughness: 0.3 });
    const bannerMat = new THREE.MeshStandardMaterial({
      color: this.faction === 'enemy' ? 0x922b21 : 0xb03a2e,
      side: THREE.DoubleSide
    });

    this.modelGroup = new THREE.Group();

    // 1. Heavy Stone Curb Base
    const baseGeo = new THREE.BoxGeometry(5.6, 0.25, 5.6);
    const base = new THREE.Mesh(baseGeo, stoneMat);
    base.position.y = 0.125;
    this.modelGroup.add(base);

    // 2. Giant Elephant Tethering Logs (Huge vertical trunk posts)
    const logGeo = new THREE.CylinderGeometry(0.28, 0.32, 3.2, 8);
    const cornerPosts = [
      [-2.3, 1.6, -2.3], [2.3, 1.6, -2.3],
      [-2.3, 1.6, 2.3], [2.3, 1.6, 2.3],
      [-2.3, 1.6, 0], [2.3, 1.6, 0]
    ];
    cornerPosts.forEach(pos => {
      const log = new THREE.Mesh(logGeo, heavyLogMat);
      log.position.set(pos[0], pos[1], pos[2]);
      log.castShadow = true;
      this.modelGroup.add(log);

      // Gold cap on main posts
      const cap = new THREE.Mesh(new THREE.ConeGeometry(0.32, 0.3, 6), goldMat);
      cap.position.set(pos[0], 3.35, pos[2]);
      this.modelGroup.add(cap);
    });

    // Heavy Horizontal Barricade Timbers (To hold giant elephants)
    const makeBeam = (w, x, y, z, rotY = 0) => {
      const beam = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.14, w, 6), heavyLogMat);
      beam.position.set(x, y, z);
      beam.rotation.z = Math.PI / 2;
      beam.rotation.y = rotY;
      beam.castShadow = true;
      this.modelGroup.add(beam);
    };

    // Rear barricades (3 tiers)
    makeBeam(4.6, 0, 1.0, -2.3);
    makeBeam(4.6, 0, 1.8, -2.3);
    makeBeam(4.6, 0, 2.6, -2.3);

    // Side barricades
    [1.0, 1.8, 2.6].forEach(y => {
      makeBeam(4.6, -2.3, y, 0, Math.PI / 2);
      makeBeam(4.6, 2.3, y, 0, Math.PI / 2);
    });

    // 3. High Elephant Mounting Platform & Staging Deck (ဆင်တက်စင်မြင့်)
    const platGeo = new THREE.BoxGeometry(2.4, 0.25, 2.0);
    const platform = new THREE.Mesh(platGeo, woodMat);
    platform.position.set(0, 2.2, -1.2);
    this.modelGroup.add(platform);

    // Stairs up to platform
    for (let i = 0; i < 4; i++) {
      const s = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.35, 0.4), woodMat);
      s.position.set(0, (i + 0.5) * 0.45, 0.2 + i * 0.35);
      this.modelGroup.add(s);
    }

    // 4. Elephant Fodder & Feed Manger (ဆင်စာ စားခွက်)
    const manger = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.6, 1.0), woodMat);
    manger.position.set(-1.0, 0.4, 1.5);
    this.modelGroup.add(manger);

    // Banana Leaves / Palm Foliage in manger
    for (let i = 0; i < 5; i++) {
      const leaf = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.08, 0.3), leafMat);
      leaf.position.set(-1.0 + (i - 2) * 0.25, 0.75, 1.5 + (i % 2) * 0.15);
      leaf.rotation.z = (i - 2) * 0.2;
      this.modelGroup.add(leaf);
    }

    // 5. Royal War Banner on High Post
    const banner = new THREE.Mesh(new THREE.PlaneGeometry(0.9, 2.0), bannerMat);
    banner.position.set(2.3, 3.4, 1.8);
    this.modelGroup.add(banner);

    this.mesh.add(this.modelGroup);
    this.createHpBar(3.2, 0.2, 4.8);
  }
}
