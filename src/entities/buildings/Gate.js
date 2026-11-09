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

    this.isOpen = false;
    this.targetDoorAngle = 0;
    this.currentDoorAngle = 0;
    this.scanTimer = 0;

    this.createFortifiedGateModel();
  }

  createFortifiedGateModel() {
    const isEnemy = this.faction === 'enemy';
    const woodColor = isEnemy ? 0x212f3d : 0x5d4037;
    const ironColor = isEnemy ? 0x17202a : 0x2c3e50;
    const roofColor = isEnemy ? 0x78281f : 0xa04000;
    const brickColor = isEnemy ? 0x34495e : 0x873600;

    const woodMat = new THREE.MeshStandardMaterial({ color: woodColor, roughness: 0.85 });
    const ironMat = new THREE.MeshStandardMaterial({ color: ironColor, metalness: 0.8, roughness: 0.3 });
    const roofMat = new THREE.MeshStandardMaterial({ color: roofColor, roughness: 0.65 });
    const brickMat = new THREE.MeshStandardMaterial({ color: brickColor, roughness: 0.9 });

    // 1. Brick Pedestals for Left and Right Gate Towers
    [-1.6, 1.6].forEach(px => {
      const pedestal = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.6, 1.4), brickMat);
      pedestal.position.set(px, 0.3, 0);
      pedestal.castShadow = true;
      this.mesh.add(pedestal);

      // Heavy Timber Tower Posts
      const post = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.35, 4.2, 8), woodMat);
      post.position.set(px, 2.4, 0);
      post.castShadow = true;
      this.mesh.add(post);

      // Hipped Roof on Gate Tower
      const roof = new THREE.Mesh(new THREE.ConeGeometry(1.1, 0.9, 4), roofMat);
      roof.position.set(px, 4.9, 0);
      roof.rotation.y = Math.PI / 4;
      roof.castShadow = true;
      this.mesh.add(roof);
    });

    // 2. Heavy Overhead Lintel Timber (Archway)
    const lintel = new THREE.Mesh(new THREE.BoxGeometry(3.6, 0.4, 0.5), woodMat);
    lintel.position.set(0, 4.2, 0);
    lintel.castShadow = true;
    this.mesh.add(lintel);

    // 3. Double Swinging Gate Doors
    // Left Door & Hinge
    this.leftHinge = new THREE.Group();
    this.leftHinge.position.set(-1.4, 0, 0);

    const doorGeo = new THREE.BoxGeometry(1.3, 3.4, 0.18);
    const leftDoor = new THREE.Mesh(doorGeo, woodMat);
    leftDoor.position.set(0.65, 2.0, 0);
    leftDoor.castShadow = true;
    this.leftHinge.add(leftDoor);

    // Iron Studs on Left Door
    for (let sy = 0.8; sy <= 3.2; sy += 0.8) {
      const stud = new THREE.Mesh(new THREE.SphereGeometry(0.08, 6, 6), ironMat);
      stud.position.set(0.65, sy, 0.1);
      this.leftHinge.add(stud);
    }
    this.mesh.add(this.leftHinge);

    // Right Door & Hinge
    this.rightHinge = new THREE.Group();
    this.rightHinge.position.set(1.4, 0, 0);

    const rightDoor = new THREE.Mesh(doorGeo, woodMat);
    rightDoor.position.set(-0.65, 2.0, 0);
    rightDoor.castShadow = true;
    this.rightHinge.add(rightDoor);

    // Iron Studs on Right Door
    for (let sy = 0.8; sy <= 3.2; sy += 0.8) {
      const stud = new THREE.Mesh(new THREE.SphereGeometry(0.08, 6, 6), ironMat);
      stud.position.set(-0.65, sy, 0.1);
      this.rightHinge.add(stud);
    }
    this.mesh.add(this.rightHinge);

    // HP Bar
    this.createHpBar(2.6, 0.2, 5.8);
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
        this.targetDoorAngle = Math.PI * 0.48; // Open 90 degrees
      }
    } else {
      if (this.isOpen) {
        this.isOpen = false;
        this.targetDoorAngle = 0; // Close shut
      }
    }
  }
}
