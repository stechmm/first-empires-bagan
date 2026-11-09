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
    const woodMat = new THREE.MeshStandardMaterial({ color: 0x4e342e, roughness: 0.8 });
    const fenceMat = new THREE.MeshStandardMaterial({ color: 0x6e2c00, roughness: 0.75 });
    const thatchMat = new THREE.MeshStandardMaterial({
      color: this.faction === 'enemy' ? 0x34495e : 0xa04000,
      roughness: 0.9
    });
    const hayMat = new THREE.MeshStandardMaterial({ color: 0xd4ac0d, roughness: 0.95 });
    const waterMat = new THREE.MeshStandardMaterial({ color: 0x2980b9, roughness: 0.2 });

    this.modelGroup = new THREE.Group();

    // 1. Dirt Ground Base
    const baseGeo = new THREE.BoxGeometry(4.8, 0.2, 4.8);
    const baseMat = new THREE.MeshStandardMaterial({ color: 0x784212, roughness: 0.95 });
    const base = new THREE.Mesh(baseGeo, baseMat);
    base.position.y = 0.1;
    this.modelGroup.add(base);

    // 2. Open Stall Timber Pillars (6 posts)
    const pillarGeo = new THREE.CylinderGeometry(0.12, 0.12, 2.2, 6);
    const posts = [
      [-1.8, 1.2, -1.6], [0, 1.2, -1.6], [1.8, 1.2, -1.6],
      [-1.8, 1.2, 0.4], [0, 1.2, 0.4], [1.8, 1.2, 0.4]
    ];
    posts.forEach(p => {
      const pillar = new THREE.Mesh(pillarGeo, woodMat);
      pillar.position.set(p[0], p[1], p[2]);
      pillar.castShadow = true;
      this.modelGroup.add(pillar);
    });

    // 3. Stables Sloped Thatched Roof
    const roofGeo = new THREE.BoxGeometry(4.6, 0.3, 2.8);
    const roof = new THREE.Mesh(roofGeo, thatchMat);
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

    // Front fence rails
    makeFenceRail(4.2, 0, 0.4, 2.0);
    makeFenceRail(4.2, 0, 0.8, 2.0);
    // Side fence rails
    makeFenceRail(2.0, 2.0, 0.4, 1.0, Math.PI / 2);
    makeFenceRail(2.0, 2.0, 0.8, 1.0, Math.PI / 2);
    makeFenceRail(2.0, -2.0, 0.4, 1.0, Math.PI / 2);
    makeFenceRail(2.0, -2.0, 0.8, 1.0, Math.PI / 2);

    // 5. Hay Bales & Water Trough
    // Straw Bales (ကောက်ရိုးပုံများ)
    const hay1 = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.6, 0.7), hayMat);
    hay1.position.set(1.3, 0.4, -0.6);
    this.modelGroup.add(hay1);

    const hay2 = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.5, 0.6), hayMat);
    hay2.position.set(1.4, 0.85, -0.5);
    hay2.rotation.y = 0.3;
    this.modelGroup.add(hay2);

    // Wooden Water Trough (ရေသောက်ခွက်)
    const troughBox = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.4, 0.6), woodMat);
    troughBox.position.set(-1.2, 0.3, 1.2);
    this.modelGroup.add(troughBox);

    const water = new THREE.Mesh(new THREE.PlaneGeometry(1.0, 0.4), waterMat);
    water.position.set(-1.2, 0.45, 1.2);
    water.rotation.x = -Math.PI / 2;
    this.modelGroup.add(water);

    this.mesh.add(this.modelGroup);
    this.createHpBar(2.6, 0.18, 4.0);
  }
}
