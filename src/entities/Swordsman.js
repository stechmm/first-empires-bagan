import * as THREE from 'three';
import { Unit } from './Unit.js';

export class Swordsman extends Unit {
  constructor(game, options = {}) {
    super(game, {
      ...options,
      name: 'ဓားကိုင်စစ်သည် (Swordsman)',
      type: 'swordsman',
      hp: 120,
      speed: 4.8,
      damage: 16,
      range: 1.8,
      cooldown: 1.0
    });

    this.attackAnimDuration = 0.32;
    this.createSwordsmanModel();
  }

  createSwordsmanModel() {
    const isEnemy = this.faction === 'enemy';
    const skinMat = new THREE.MeshStandardMaterial({ color: 0xd4a373, roughness: 0.75 });
    const clothMat = new THREE.MeshStandardMaterial({
      color: isEnemy ? 0x243342 : 0x871c1c, // Bagan Royal Crimson / Enemy Slate Blue
      roughness: 0.6
    });
    const armorBronzeMat = new THREE.MeshStandardMaterial({
      color: isEnemy ? 0x7f8c8d : 0xbf6516,
      metalness: 0.75,
      roughness: 0.32
    });
    const goldMat = new THREE.MeshStandardMaterial({
      color: 0xf1c40f,
      metalness: 0.85,
      roughness: 0.25
    });
    const steelMat = new THREE.MeshStandardMaterial({
      color: 0xecf0f1,
      metalness: 0.95,
      roughness: 0.18
    });
    const leatherMat = new THREE.MeshStandardMaterial({ color: 0x4a2e18, roughness: 0.8 });

    // 1. Body Root Group
    this.bodyGroup = new THREE.Group();
    this.mesh.add(this.bodyGroup);

    // Torso / Body (Layered Burmese Cuirass)
    const torsoGeo = new THREE.BoxGeometry(0.58, 0.78, 0.38);
    this.torsoMesh = new THREE.Mesh(torsoGeo, clothMat);
    this.torsoMesh.position.y = 1.1;
    this.torsoMesh.castShadow = true;
    this.bodyGroup.add(this.torsoMesh);

    // Scaled Bronze Breastplate over chest
    const chestPlate = new THREE.Mesh(new THREE.BoxGeometry(0.62, 0.48, 0.42), armorBronzeMat);
    chestPlate.position.set(0, 1.22, 0);
    this.bodyGroup.add(chestPlate);

    // Golden Central Pectoral Emblem
    const emblem = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 0.44, 8), goldMat);
    emblem.rotation.x = Math.PI / 2;
    emblem.position.set(0, 1.26, 0.02);
    this.bodyGroup.add(emblem);

    // Royal Sash / Belt with Golden Buckle
    const belt = new THREE.Mesh(new THREE.BoxGeometry(0.62, 0.12, 0.42), leatherMat);
    belt.position.set(0, 0.88, 0);
    this.bodyGroup.add(belt);

    const buckle = new THREE.Mesh(new THREE.BoxGeometry(0.15, 0.14, 0.46), goldMat);
    buckle.position.set(0, 0.88, 0);
    this.bodyGroup.add(buckle);

    // Royal Paso Apron Loincloth flap (ပုဆိုးရှေ့ဖုံး)
    const flap = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.45, 0.08), clothMat);
    flap.position.set(0, 0.65, 0.18);
    this.bodyGroup.add(flap);

    // Head & Traditional Bagan Spired Helmet
    this.headGroup = new THREE.Group();
    this.headGroup.position.set(0, 1.62, 0);

    const headGeo = new THREE.SphereGeometry(0.22, 10, 10);
    const head = new THREE.Mesh(headGeo, skinMat);
    this.headGroup.add(head);

    // Traditional Bagan conical battle helmet with ear flaps
    const helmetGeo = new THREE.ConeGeometry(0.28, 0.38, 10);
    const helmet = new THREE.Mesh(helmetGeo, armorBronzeMat);
    helmet.position.y = 0.18;
    this.headGroup.add(helmet);

    // Golden Spire on Helmet (သံခမောက်ထိပ်ဖူး)
    const spireGeo = new THREE.CylinderGeometry(0.02, 0.06, 0.22, 6);
    const spire = new THREE.Mesh(spireGeo, goldMat);
    spire.position.y = 0.42;
    this.headGroup.add(spire);

    // Helmet Neck Guard (လည်ပင်းကာ)
    const neckGuard = new THREE.Mesh(new THREE.BoxGeometry(0.36, 0.18, 0.28), leatherMat);
    neckGuard.position.set(0, 0.02, -0.06);
    this.headGroup.add(neckGuard);

    this.bodyGroup.add(this.headGroup);

    // 2. Legs with Greaves
    const legGeo = new THREE.CylinderGeometry(0.11, 0.1, 0.72, 6);
    legGeo.translate(0, -0.36, 0);

    this.leftLegPivot = new THREE.Group();
    this.leftLegPivot.position.set(0.17, 0.72, 0);
    const leftLegMesh = new THREE.Mesh(legGeo, clothMat);
    leftLegMesh.castShadow = true;
    this.leftLegPivot.add(leftLegMesh);

    // Bronze Greave on Shin
    const greaveGeo = new THREE.CylinderGeometry(0.12, 0.11, 0.35, 6);
    const leftGreave = new THREE.Mesh(greaveGeo, armorBronzeMat);
    leftGreave.position.y = -0.42;
    this.leftLegPivot.add(leftGreave);
    this.mesh.add(this.leftLegPivot);

    this.rightLegPivot = new THREE.Group();
    this.rightLegPivot.position.set(-0.17, 0.72, 0);
    const rightLegMesh = new THREE.Mesh(legGeo, clothMat);
    rightLegMesh.castShadow = true;
    this.rightLegPivot.add(rightLegMesh);

    const rightGreave = new THREE.Mesh(greaveGeo, armorBronzeMat);
    rightGreave.position.y = -0.42;
    this.rightLegPivot.add(rightGreave);
    this.mesh.add(this.rightLegPivot);

    // 3. Left Arm with Embossed Bagan Shield
    const armGeo = new THREE.CylinderGeometry(0.08, 0.08, 0.58, 6);
    armGeo.translate(0, -0.29, 0);

    this.leftArmPivot = new THREE.Group();
    this.leftArmPivot.position.set(-0.36, 1.34, 0);
    const leftArmMesh = new THREE.Mesh(armGeo, skinMat);
    this.leftArmPivot.add(leftArmMesh);

    // Bronze Bracer on Forearm
    const bracerGeo = new THREE.CylinderGeometry(0.09, 0.085, 0.22, 6);
    const leftBracer = new THREE.Mesh(bracerGeo, armorBronzeMat);
    leftBracer.position.y = -0.32;
    this.leftArmPivot.add(leftBracer);

    // Royal Bagan Round Shield with Tiered Gold Boss
    const shieldGroup = new THREE.Group();
    shieldGroup.position.set(-0.08, -0.32, 0.16);
    shieldGroup.rotation.y = Math.PI / 2;
    shieldGroup.rotation.z = Math.PI / 2;

    const shieldOuter = new THREE.Mesh(new THREE.CylinderGeometry(0.38, 0.38, 0.06, 16), armorBronzeMat);
    shieldGroup.add(shieldOuter);

    const shieldRing = new THREE.Mesh(new THREE.TorusGeometry(0.28, 0.025, 6, 16), goldMat);
    shieldRing.rotation.x = Math.PI / 2;
    shieldGroup.add(shieldRing);

    const shieldBoss = new THREE.Mesh(new THREE.ConeGeometry(0.12, 0.1, 10), goldMat);
    shieldBoss.rotation.x = -Math.PI / 2;
    shieldBoss.position.y = 0.05;
    shieldGroup.add(shieldBoss);

    this.leftArmPivot.add(shieldGroup);
    this.bodyGroup.add(this.leftArmPivot);

    // 4. Right Arm with Authentic Bagan Dha Sword
    this.rightArmPivot = new THREE.Group();
    this.rightArmPivot.position.set(0.36, 1.34, 0);
    const rightArmMesh = new THREE.Mesh(armGeo, skinMat);
    this.rightArmPivot.add(rightArmMesh);

    const rightBracer = new THREE.Mesh(bracerGeo, armorBronzeMat);
    rightBracer.position.y = -0.32;
    this.rightArmPivot.add(rightBracer);

    // Myanmar Dha Sword (ငှက်ကြီးတောင် ဓား)
    this.swordGroup = new THREE.Group();
    this.swordGroup.position.set(0, -0.42, 0.1);

    // Wrapped Hilt
    const swordHiltGeo = new THREE.CylinderGeometry(0.035, 0.035, 0.24, 6);
    const swordHilt = new THREE.Mesh(swordHiltGeo, leatherMat);
    swordHilt.position.y = -0.1;
    this.swordGroup.add(swordHilt);

    // Golden Guard Disc & Pommel
    const guardDisc = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 0.03, 8), goldMat);
    guardDisc.position.y = 0.02;
    this.swordGroup.add(guardDisc);

    const pommel = new THREE.Mesh(new THREE.SphereGeometry(0.045, 6, 6), goldMat);
    pommel.position.y = -0.22;
    this.swordGroup.add(pommel);

    // Red Pommel Tassel (ဓားကြိုးစ)
    const tassel = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.04, 0.14, 4), clothMat);
    tassel.position.set(0, -0.31, 0);
    this.swordGroup.add(tassel);

    // Curved Steel Blade
    const swordBladeGeo = new THREE.BoxGeometry(0.075, 0.88, 0.025);
    const swordBlade = new THREE.Mesh(swordBladeGeo, steelMat);
    swordBlade.position.set(0.02, 0.46, 0);
    swordBlade.rotation.z = -0.04;
    this.swordGroup.add(swordBlade);

    // Angle sword in hand
    this.swordGroup.rotation.x = Math.PI / 3;
    this.rightArmPivot.add(this.swordGroup);
    this.bodyGroup.add(this.rightArmPivot);
  }

  updateProceduralAnimation(delta) {
    if (!this.bodyGroup || !this.leftLegPivot || !this.rightLegPivot) return;

    if (this.isAttacking) {
      // 3-Phase Dynamic Melee Slash Animation
      const p = this.attackAnimProgress;
      if (p < 0.35) {
        // Phase 1: High Wind-up
        const t = p / 0.35;
        this.rightArmPivot.rotation.x = -1.7 * t;
        this.rightArmPivot.rotation.y = 0.5 * t;
        this.rightArmPivot.rotation.z = 0.4 * t;
        this.bodyGroup.rotation.y = 0.35 * t;
        this.leftArmPivot.rotation.x = 0.6 * t; // Raise shield
        this.bodyGroup.position.z = -0.1 * t;
      } else if (p < 0.75) {
        // Phase 2: Decisive Diagonal Slash Arc
        const t = (p - 0.35) / 0.4;
        this.rightArmPivot.rotation.x = -1.7 + 2.8 * t;
        this.rightArmPivot.rotation.y = 0.5 - 1.2 * t;
        this.rightArmPivot.rotation.z = 0.4 - 0.9 * t;
        this.bodyGroup.rotation.y = 0.35 - 0.7 * t;
        this.bodyGroup.position.z = 0.25 * Math.sin(t * Math.PI);
      } else {
        // Phase 3: Recoil & Return to Guard
        const t = (p - 0.75) / 0.25;
        this.rightArmPivot.rotation.x = THREE.MathUtils.lerp(this.rightArmPivot.rotation.x, 0.3, t);
        this.rightArmPivot.rotation.y = THREE.MathUtils.lerp(this.rightArmPivot.rotation.y, 0, t);
        this.rightArmPivot.rotation.z = THREE.MathUtils.lerp(this.rightArmPivot.rotation.z, 0.1, t);
        this.bodyGroup.rotation.y = THREE.MathUtils.lerp(this.bodyGroup.rotation.y, 0, t);
        this.bodyGroup.position.z = THREE.MathUtils.lerp(this.bodyGroup.position.z, 0, t);
      }

      // Keep legs stable during attack
      this.leftLegPivot.rotation.x = THREE.MathUtils.lerp(this.leftLegPivot.rotation.x, 0.2, 0.2);
      this.rightLegPivot.rotation.x = THREE.MathUtils.lerp(this.rightLegPivot.rotation.x, -0.2, 0.2);
    } else if (this.isMoving) {
      // Sprint / Walk Locomotion Cycle
      const walkSpeed = this.speed * 2.5;
      const walkCycle = this.animTime * walkSpeed;
      const legSwing = Math.sin(walkCycle) * 0.68;

      // Leg swings
      this.leftLegPivot.rotation.x = legSwing;
      this.rightLegPivot.rotation.x = -legSwing;

      // Arm counter-swings
      this.leftArmPivot.rotation.x = -legSwing * 0.75;
      this.leftArmPivot.rotation.y = 0;
      this.leftArmPivot.rotation.z = -0.15;

      this.rightArmPivot.rotation.x = legSwing * 0.75;
      this.rightArmPivot.rotation.y = 0;
      this.rightArmPivot.rotation.z = 0.15;

      // Torso athletic bounce & forward sprint lean
      this.bodyGroup.position.y = Math.abs(Math.sin(walkCycle)) * 0.08;
      this.bodyGroup.position.z = 0;
      this.bodyGroup.rotation.x = 0.14; // Forward lean
      this.bodyGroup.rotation.y = 0;
      this.bodyGroup.rotation.z = Math.sin(walkCycle) * 0.05; // Hip sway
      this.headGroup.rotation.x = -0.08; // Head looks ahead
    } else {
      // Idle Stance with Breathing & Subtle Posture Shift
      this.leftLegPivot.rotation.x = THREE.MathUtils.lerp(this.leftLegPivot.rotation.x, 0, 0.15);
      this.rightLegPivot.rotation.x = THREE.MathUtils.lerp(this.rightLegPivot.rotation.x, 0, 0.15);

      const breath = Math.sin(this.animTime * 2.2);
      this.bodyGroup.position.y = breath * 0.02;
      this.bodyGroup.position.z = 0;
      this.bodyGroup.scale.set(1 + breath * 0.015, 1 + breath * 0.02, 1 + breath * 0.015);

      this.bodyGroup.rotation.x = THREE.MathUtils.lerp(this.bodyGroup.rotation.x, 0, 0.1);
      this.bodyGroup.rotation.y = THREE.MathUtils.lerp(this.bodyGroup.rotation.y, 0, 0.1);
      this.bodyGroup.rotation.z = THREE.MathUtils.lerp(this.bodyGroup.rotation.z, 0, 0.1);
      this.headGroup.rotation.x = breath * 0.03;

      // Guard stance arm positions
      this.rightArmPivot.rotation.x = THREE.MathUtils.lerp(this.rightArmPivot.rotation.x, 0.35, 0.1);
      this.rightArmPivot.rotation.y = THREE.MathUtils.lerp(this.rightArmPivot.rotation.y, 0.1, 0.1);
      this.rightArmPivot.rotation.z = THREE.MathUtils.lerp(this.rightArmPivot.rotation.z, 0.15 + breath * 0.02, 0.1);

      this.leftArmPivot.rotation.x = THREE.MathUtils.lerp(this.leftArmPivot.rotation.x, 0.25, 0.1);
      this.leftArmPivot.rotation.y = THREE.MathUtils.lerp(this.leftArmPivot.rotation.y, -0.1, 0.1);
      this.leftArmPivot.rotation.z = THREE.MathUtils.lerp(this.leftArmPivot.rotation.z, -0.2 - breath * 0.02, 0.1);
    }
  }
}
