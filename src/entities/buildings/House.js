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
    const woodMat = new THREE.MeshStandardMaterial({ color: 0x4a2311, roughness: 0.8 });
    const plankMat = new THREE.MeshStandardMaterial({ color: 0x6e2c00, roughness: 0.75 });
    const thatchMat = new THREE.MeshStandardMaterial({
      color: this.faction === 'enemy' ? 0x2c3e50 : 0xa04000,
      roughness: 0.95
    });
    const stoneMat = new THREE.MeshStandardMaterial({ color: 0x7f8c8d, roughness: 0.9 });
    const lanternMat = new THREE.MeshStandardMaterial({
      color: 0xf39c12,
      emissive: 0xf39c12,
      emissiveIntensity: 0.6,
      roughness: 0.3
    });

    this.modelGroup = new THREE.Group();

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

    const clayPot = new THREE.Mesh(new THREE.SphereGeometry(0.14, 8, 8), new THREE.MeshStandardMaterial({ color: 0xba4a00, roughness: 0.9 }));
    clayPot.position.set(-0.8, 1.35, 1.0);
    this.modelGroup.add(clayPot);

    // 6. Warm Hanging Porch Lantern (မီးအိမ်ငယ်)
    const lantern = new THREE.Mesh(new THREE.BoxGeometry(0.15, 0.2, 0.15), lanternMat);
    lantern.position.set(0.45, 2.1, 1.2);
    this.modelGroup.add(lantern);

    this.mesh.add(this.modelGroup);
    this.createHpBar(2.0, 0.16, 3.4);
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
