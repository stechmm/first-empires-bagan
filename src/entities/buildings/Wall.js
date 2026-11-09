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

    this.createPalisadeModel();
  }

  createPalisadeModel() {
    const isEnemy = this.faction === 'enemy';
    const woodColor = isEnemy ? 0x212f3d : 0x5d4037;
    const ropeColor = isEnemy ? 0x17202a : 0x873600;
    const moundColor = isEnemy ? 0x34495e : 0x6e2c00;

    const woodMat = new THREE.MeshStandardMaterial({ color: woodColor, roughness: 0.85 });
    const ropeMat = new THREE.MeshStandardMaterial({ color: ropeColor, roughness: 0.9 });
    const moundMat = new THREE.MeshStandardMaterial({ color: moundColor, roughness: 0.95 });

    // 1. Earthen Foundation Mound
    const moundGeo = new THREE.BoxGeometry(2.1, 0.35, 1.2);
    const mound = new THREE.Mesh(moundGeo, moundMat);
    mound.position.y = 0.17;
    mound.castShadow = true;
    mound.receiveShadow = true;
    this.mesh.add(mound);

    // 2. Heavy Sharpened Teak Logs (Palisade Pales)
    const logGeo = new THREE.CylinderGeometry(0.18, 0.22, 2.6, 7);
    const tipGeo = new THREE.ConeGeometry(0.18, 0.5, 7);

    // 4 logs standing side by side
    const logXPositions = [-0.75, -0.25, 0.25, 0.75];
    logXPositions.forEach((lx, i) => {
      const logGroup = new THREE.Group();
      const logHeight = 2.4 + (i % 2 === 0 ? 0.3 : 0);

      const post = new THREE.Mesh(logGeo, woodMat);
      post.position.y = logHeight / 2;
      post.castShadow = true;
      logGroup.add(post);

      // Sharpened Spearhead Tip
      const tip = new THREE.Mesh(tipGeo, woodMat);
      tip.position.y = logHeight + 0.25;
      tip.castShadow = true;
      logGroup.add(tip);

      logGroup.position.set(lx, 0.25, (Math.random() - 0.5) * 0.1);
      logGroup.rotation.z = (Math.random() - 0.5) * 0.05;
      this.mesh.add(logGroup);
    });

    // 3. Horizontal Support Binding Timbers & Rattan Ropes
    const crossbeamGeo = new THREE.BoxGeometry(2.0, 0.15, 0.15);
    const topCross = new THREE.Mesh(crossbeamGeo, woodMat);
    topCross.position.set(0, 1.8, 0.24);
    this.mesh.add(topCross);

    const bottomCross = new THREE.Mesh(crossbeamGeo, woodMat);
    bottomCross.position.set(0, 0.9, 0.24);
    this.mesh.add(bottomCross);

    // Rattan Rope Bindings (Cross lashings)
    logXPositions.forEach(lx => {
      const rope = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.22, 0.32), ropeMat);
      rope.position.set(lx, 1.8, 0.12);
      this.mesh.add(rope);
    });

    // HP Bar
    this.createHpBar(1.8, 0.15, 3.6);
  }
}
