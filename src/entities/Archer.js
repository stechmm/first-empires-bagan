import * as THREE from 'three';
import { Unit } from './Unit.js';

export class Archer extends Unit {
  constructor(game, options = {}) {
    super(game, {
      ...options,
      name: 'လေးသည်တော် (Bagan Archer)',
      type: 'archer',
      hp: 85,
      speed: 5.0,
      damage: 14,
      range: 12.0, // Long ranged attack
      cooldown: 1.4
    });

    this.attackAnimDuration = 0.45;
    this.createArcherModel();
  }

  createArcherModel() {
    const isEnemy = this.faction === 'enemy';
    const skinMat = new THREE.MeshStandardMaterial({ color: 0xd4a373, roughness: 0.75 });
    const clothMat = new THREE.MeshStandardMaterial({
      color: isEnemy ? 0x641e16 : 0x196f3d, // Bagan Forest Green / Enemy Crimson
      roughness: 0.6
    });
    const leatherMat = new THREE.MeshStandardMaterial({ color: 0x4a2e18, roughness: 0.8 });
    const woodMat = new THREE.MeshStandardMaterial({ color: 0x5d4037, roughness: 0.7 });
    const bowMat = new THREE.MeshStandardMaterial({ color: 0xb7950b, metalness: 0.5, roughness: 0.35 });
    const goldMat = new THREE.MeshStandardMaterial({ color: 0xf1c40f, metalness: 0.8, roughness: 0.25 });
    const featherMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
    const fletchMat = new THREE.MeshBasicMaterial({ color: isEnemy ? 0x922b21 : 0xd35400 });

    // 1. Body Root Group
    this.bodyGroup = new THREE.Group();
    this.mesh.add(this.bodyGroup);

    // Torso with Leather Archer's Harness
    const torsoGeo = new THREE.BoxGeometry(0.54, 0.76, 0.36);
    this.torsoMesh = new THREE.Mesh(torsoGeo, clothMat);
    this.torsoMesh.position.y = 1.08;
    this.torsoMesh.castShadow = true;
    this.bodyGroup.add(this.torsoMesh);

    // Leather Chest Harness Strap (cross belt for quiver)
    const strapGeo = new THREE.BoxGeometry(0.56, 0.1, 0.38);
    const strap = new THREE.Mesh(strapGeo, leatherMat);
    strap.position.set(0, 1.15, 0);
    strap.rotation.z = Math.PI / 4.5;
    this.bodyGroup.add(strap);

    // Leather Belt & Quiver Slung diagonally
    const belt = new THREE.Mesh(new THREE.BoxGeometry(0.56, 0.1, 0.38), leatherMat);
    belt.position.set(0, 0.86, 0);
    this.bodyGroup.add(belt);

    // Head with Burmese Topknot (သျှောင်ထုံး) & Warrior Headband
    this.headGroup = new THREE.Group();
    this.headGroup.position.set(0, 1.58, 0);

    const headGeo = new THREE.SphereGeometry(0.22, 10, 10);
    const head = new THREE.Mesh(headGeo, skinMat);
    this.headGroup.add(head);

    // Warrior Headband (ခေါင်းစည်း)
    const bandGeo = new THREE.CylinderGeometry(0.23, 0.23, 0.08, 10);
    const headband = new THREE.Mesh(bandGeo, clothMat);
    headband.position.y = 0.04;
    this.headGroup.add(headband);

    // Topknot (သျှောင်ထုံး) with Golden Pin
    const topknotGeo = new THREE.SphereGeometry(0.09, 8, 8);
    const topknot = new THREE.Mesh(topknotGeo, new THREE.MeshBasicMaterial({ color: 0x111111 }));
    topknot.position.set(0, 0.22, -0.04);
    this.headGroup.add(topknot);

    const pinGeo = new THREE.CylinderGeometry(0.015, 0.015, 0.25, 4);
    const pin = new THREE.Mesh(pinGeo, goldMat);
    pin.rotation.z = Math.PI / 3;
    pin.position.set(0, 0.22, -0.04);
    this.headGroup.add(pin);

    this.bodyGroup.add(this.headGroup);

    // Bamboo Quiver on Back with Arrows & Fletchings
    const quiverGroup = new THREE.Group();
    quiverGroup.position.set(0.14, 1.15, -0.24);
    quiverGroup.rotation.z = Math.PI / 5.5;
    quiverGroup.rotation.x = -0.22;

    const quiverGeo = new THREE.CylinderGeometry(0.09, 0.08, 0.72, 8);
    const quiver = new THREE.Mesh(quiverGeo, leatherMat);
    quiverGroup.add(quiver);

    // 4 Feathered Arrow Fletchings sticking out of quiver
    [[-0.03, 0.42, -0.02], [0.03, 0.44, -0.02], [-0.02, 0.45, 0.03], [0.03, 0.41, 0.03]].forEach(([ax, ay, az]) => {
      const shaft = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.35, 4), woodMat);
      shaft.position.set(ax, ay, az);
      quiverGroup.add(shaft);

      const fletch = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.12, 0.01), fletchMat);
      fletch.position.set(ax, ay + 0.14, az);
      quiverGroup.add(fletch);
    });

    this.bodyGroup.add(quiverGroup);

    // 2. Legs with Leather Archer's Boots
    const legGeo = new THREE.CylinderGeometry(0.1, 0.09, 0.68, 6);
    legGeo.translate(0, -0.34, 0);

    this.leftLegPivot = new THREE.Group();
    this.leftLegPivot.position.set(0.16, 0.68, 0);
    const leftLegMesh = new THREE.Mesh(legGeo, clothMat);
    leftLegMesh.castShadow = true;
    this.leftLegPivot.add(leftLegMesh);
    this.mesh.add(this.leftLegPivot);

    this.rightLegPivot = new THREE.Group();
    this.rightLegPivot.position.set(-0.16, 0.68, 0);
    const rightLegMesh = new THREE.Mesh(legGeo, clothMat);
    rightLegMesh.castShadow = true;
    this.rightLegPivot.add(rightLegMesh);
    this.mesh.add(this.rightLegPivot);

    // 3. Left Arm with Bamboo Recurve Bow (သရိုးလေး)
    const armGeo = new THREE.CylinderGeometry(0.075, 0.075, 0.56, 6);
    armGeo.translate(0, -0.28, 0);

    this.leftArmPivot = new THREE.Group();
    this.leftArmPivot.position.set(-0.35, 1.32, 0);
    const leftArmMesh = new THREE.Mesh(armGeo, skinMat);
    this.leftArmPivot.add(leftArmMesh);

    // Leather Armguard / Bracer on Left Forearm
    const bracer = new THREE.Mesh(new THREE.CylinderGeometry(0.085, 0.08, 0.2, 6), leatherMat);
    bracer.position.y = -0.3;
    this.leftArmPivot.add(bracer);

    // Recurve Bow Group attached to left hand
    this.bowGroup = new THREE.Group();
    this.bowGroup.position.set(0, -0.42, 0.16);

    // Curved Upper & Lower Limb (Torus Arc)
    const bowUpper = new THREE.Mesh(new THREE.TorusGeometry(0.48, 0.028, 6, 12, Math.PI * 0.55), bowMat);
    bowUpper.position.set(0, 0.18, 0);
    bowUpper.rotation.z = -Math.PI / 3.8;
    this.bowGroup.add(bowUpper);

    const bowLower = new THREE.Mesh(new THREE.TorusGeometry(0.48, 0.028, 6, 12, Math.PI * 0.55), bowMat);
    bowLower.position.set(0, -0.18, 0);
    bowLower.rotation.z = Math.PI / 1.35;
    this.bowGroup.add(bowLower);

    // Bow Grip Handle wrapped in leather
    const grip = new THREE.Mesh(new THREE.CylinderGeometry(0.038, 0.038, 0.16, 6), leatherMat);
    this.bowGroup.add(grip);

    // Bowstring
    const stringGeo = new THREE.CylinderGeometry(0.008, 0.008, 0.92, 4);
    const bowstring = new THREE.Mesh(stringGeo, new THREE.MeshBasicMaterial({ color: 0xffffff }));
    bowstring.position.set(0.12, 0, 0);
    this.bowGroup.add(bowstring);

    this.leftArmPivot.add(this.bowGroup);
    this.bodyGroup.add(this.leftArmPivot);

    // 4. Right Arm (Arrow Drawing Arm)
    this.rightArmPivot = new THREE.Group();
    this.rightArmPivot.position.set(0.35, 1.32, 0);
    const rightArmMesh = new THREE.Mesh(armGeo, skinMat);
    this.rightArmPivot.add(rightArmMesh);

    // An arrow held in right hand during aim
    const arrowGeo = new THREE.CylinderGeometry(0.02, 0.02, 0.7, 4);
    arrowGeo.translate(0, 0.35, 0);
    arrowGeo.rotateX(Math.PI / 2);
    this.arrowMesh = new THREE.Mesh(arrowGeo, woodMat);
    this.arrowMesh.position.set(0, -0.35, 0);
    this.arrowMesh.visible = false;
    this.rightArmPivot.add(this.arrowMesh);

    this.bodyGroup.add(this.rightArmPivot);
  }

  performAttack(target) {
    this.isAttacking = true;
    this.attackAnimTimer = 0;
    this.attackAnimProgress = 0;

    if (this.game.combatVFX) {
      this.game.combatVFX.spawnArrow(this, target, this.attackDamage);
    } else {
      target.takeDamage(this.attackDamage);
      this.lunge();
    }
  }

  updateProceduralAnimation(delta) {
    if (!this.bodyGroup || !this.leftLegPivot || !this.rightLegPivot) return;

    if (this.isAttacking) {
      // 3-Phase Archer Draw, Hold, and Loose Motion
      const p = this.attackAnimProgress;
      this.arrowMesh.visible = (p < 0.7);

      if (p < 0.6) {
        // Phase 1: Draw Bow & Pull String to Cheek
        const t = p / 0.6;
        // Torso turns into side profile stance
        this.bodyGroup.rotation.y = -0.45 * t;

        // Left arm extends bow towards target
        this.leftArmPivot.rotation.x = -Math.PI / 2 * t;
        this.leftArmPivot.rotation.y = 0.3 * t;
        this.leftArmPivot.rotation.z = -0.1 * t;

        // Right arm pulls string back
        this.rightArmPivot.rotation.x = -Math.PI / 2.3 * t;
        this.rightArmPivot.rotation.y = -0.4 * t;
        this.rightArmPivot.rotation.z = 0.3 * t;

        // Archery stance leg spread
        this.leftLegPivot.rotation.x = 0.25 * t;
        this.rightLegPivot.rotation.x = -0.25 * t;
      } else if (p < 0.75) {
        // Phase 2: Loose / Release Recoil
        const t = (p - 0.6) / 0.15;
        this.arrowMesh.visible = false;
        // Right hand snaps back with string recoil
        this.rightArmPivot.rotation.x = -Math.PI / 2.3 - 0.2 * (1 - t);
        this.rightArmPivot.rotation.z = 0.6 * (1 - t);
        // Bow twangs
        this.leftArmPivot.rotation.y = 0.3 - 0.15 * Math.sin(t * Math.PI);
      } else {
        // Phase 3: Lower bow and recover
        const t = (p - 0.75) / 0.25;
        this.bodyGroup.rotation.y = THREE.MathUtils.lerp(this.bodyGroup.rotation.y, 0, t);
        this.leftArmPivot.rotation.x = THREE.MathUtils.lerp(this.leftArmPivot.rotation.x, 0.2, t);
        this.leftArmPivot.rotation.y = THREE.MathUtils.lerp(this.leftArmPivot.rotation.y, 0, t);
        this.rightArmPivot.rotation.x = THREE.MathUtils.lerp(this.rightArmPivot.rotation.x, 0, t);
        this.rightArmPivot.rotation.y = THREE.MathUtils.lerp(this.rightArmPivot.rotation.y, 0, t);
        this.leftLegPivot.rotation.x = THREE.MathUtils.lerp(this.leftLegPivot.rotation.x, 0, t);
        this.rightLegPivot.rotation.x = THREE.MathUtils.lerp(this.rightLegPivot.rotation.x, 0, t);
      }
    } else if (this.isMoving) {
      this.arrowMesh.visible = false;
      const walkSpeed = this.speed * 2.6;
      const walkCycle = this.animTime * walkSpeed;
      const legSwing = Math.sin(walkCycle) * 0.65;

      this.leftLegPivot.rotation.x = legSwing;
      this.rightLegPivot.rotation.x = -legSwing;

      // Arm movements with bow held at hip
      this.leftArmPivot.rotation.x = -legSwing * 0.6;
      this.leftArmPivot.rotation.y = 0;
      this.leftArmPivot.rotation.z = -0.2;

      this.rightArmPivot.rotation.x = legSwing * 0.7;
      this.rightArmPivot.rotation.y = 0;
      this.rightArmPivot.rotation.z = 0.15;

      this.bodyGroup.position.y = Math.sin(walkCycle * 2) * 0.045;
      this.bodyGroup.rotation.x = 0.12;
      this.bodyGroup.rotation.y = -Math.sin(walkCycle) * 0.05;
      this.bodyGroup.rotation.z = Math.sin(walkCycle) * 0.04;
      this.headGroup.rotation.x = -0.06;
    } else {
      this.arrowMesh.visible = false;
      // Idle Stance & Breathing
      this.leftLegPivot.rotation.x = THREE.MathUtils.lerp(this.leftLegPivot.rotation.x, 0, 0.15);
      this.rightLegPivot.rotation.x = THREE.MathUtils.lerp(this.rightLegPivot.rotation.x, 0, 0.15);

      const breath = Math.sin(this.animTime * 2.0);
      this.bodyGroup.position.y = breath * 0.018;
      this.bodyGroup.scale.set(1 + breath * 0.015, 1 + breath * 0.02, 1 + breath * 0.015);

      this.bodyGroup.rotation.x = THREE.MathUtils.lerp(this.bodyGroup.rotation.x, 0, 0.1);
      this.bodyGroup.rotation.y = THREE.MathUtils.lerp(this.bodyGroup.rotation.y, 0, 0.1);
      this.bodyGroup.rotation.z = THREE.MathUtils.lerp(this.bodyGroup.rotation.z, 0, 0.1);

      this.leftArmPivot.rotation.x = THREE.MathUtils.lerp(this.leftArmPivot.rotation.x, 0.25, 0.1);
      this.leftArmPivot.rotation.z = THREE.MathUtils.lerp(this.leftArmPivot.rotation.z, -0.2 - breath * 0.02, 0.1);
      this.rightArmPivot.rotation.x = THREE.MathUtils.lerp(this.rightArmPivot.rotation.x, 0.15, 0.1);
      this.rightArmPivot.rotation.z = THREE.MathUtils.lerp(this.rightArmPivot.rotation.z, 0.15 + breath * 0.02, 0.1);
    }
  }
}
