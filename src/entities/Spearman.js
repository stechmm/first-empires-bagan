import * as THREE from 'three';
import { Unit } from './Unit.js';

export class Spearman extends Unit {
  constructor(game, options = {}) {
    super(game, {
      ...options,
      name: 'လှံရှည်စစ်သည် (Spearman)',
      type: 'spearman',
      hp: 110,
      speed: 4.6,
      damage: 18,
      range: 2.6, // Longer melee reach
      cooldown: 1.1
    });

    this.attackAnimDuration = 0.35;
    this.createSpearmanModel();
  }

  createSpearmanModel() {
    const isEnemy = this.faction === 'enemy';
    const skinMat = new THREE.MeshStandardMaterial({ color: 0xd4a373, roughness: 0.75 });
    const clothMat = new THREE.MeshStandardMaterial({
      color: isEnemy ? 0x243342 : 0xb7950b, // Bagan Ochre Gold / Enemy Navy
      roughness: 0.6
    });
    const armorRattanMat = new THREE.MeshStandardMaterial({
      color: isEnemy ? 0x5d6d7e : 0xa04000,
      roughness: 0.8
    });
    const bronzeMat = new THREE.MeshStandardMaterial({
      color: 0xd35400,
      metalness: 0.75,
      roughness: 0.35
    });
    const steelMat = new THREE.MeshStandardMaterial({
      color: 0xecf0f1,
      metalness: 0.95,
      roughness: 0.18
    });
    const woodMat = new THREE.MeshStandardMaterial({ color: 0x4a2e18, roughness: 0.75 });
    const redMat = new THREE.MeshBasicMaterial({ color: 0x922b21 });

    // 1. Body Root Group
    this.bodyGroup = new THREE.Group();
    this.mesh.add(this.bodyGroup);

    // Torso / Body with Rattan Plate Armor
    const torsoGeo = new THREE.BoxGeometry(0.56, 0.76, 0.36);
    this.torsoMesh = new THREE.Mesh(torsoGeo, clothMat);
    this.torsoMesh.position.y = 1.08;
    this.torsoMesh.castShadow = true;
    this.bodyGroup.add(this.torsoMesh);

    // Woven Rattan Breastplate (ကြိမ်သံချပ်ကာ)
    const rattanVest = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.46, 0.4), armorRattanMat);
    rattanVest.position.set(0, 1.2, 0);
    this.bodyGroup.add(rattanVest);

    // Head with Bagan Warrior Headband
    this.headGroup = new THREE.Group();
    this.headGroup.position.set(0, 1.6, 0);

    const headGeo = new THREE.SphereGeometry(0.22, 10, 10);
    const head = new THREE.Mesh(headGeo, skinMat);
    this.headGroup.add(head);

    // Conical Bamboo Warrior Cap
    const capGeo = new THREE.ConeGeometry(0.26, 0.22, 8);
    const cap = new THREE.Mesh(capGeo, bronzeMat);
    cap.position.y = 0.16;
    this.headGroup.add(cap);

    this.bodyGroup.add(this.headGroup);

    // 2. Legs with Greaves
    const legGeo = new THREE.CylinderGeometry(0.1, 0.095, 0.7, 6);
    legGeo.translate(0, -0.35, 0);

    this.leftLegPivot = new THREE.Group();
    this.leftLegPivot.position.set(0.16, 0.7, 0);
    const leftLegMesh = new THREE.Mesh(legGeo, clothMat);
    leftLegMesh.castShadow = true;
    this.leftLegPivot.add(leftLegMesh);
    this.mesh.add(this.leftLegPivot);

    this.rightLegPivot = new THREE.Group();
    this.rightLegPivot.position.set(-0.16, 0.7, 0);
    const rightLegMesh = new THREE.Mesh(legGeo, clothMat);
    rightLegMesh.castShadow = true;
    this.rightLegPivot.add(rightLegMesh);
    this.mesh.add(this.rightLegPivot);

    // 3. Left Arm with Bronze Boss Buckler Shield
    const armGeo = new THREE.CylinderGeometry(0.075, 0.075, 0.56, 6);
    armGeo.translate(0, -0.28, 0);

    this.leftArmPivot = new THREE.Group();
    this.leftArmPivot.position.set(-0.35, 1.32, 0);
    const leftArmMesh = new THREE.Mesh(armGeo, skinMat);
    this.leftArmPivot.add(leftArmMesh);

    const shieldGeo = new THREE.CylinderGeometry(0.34, 0.34, 0.06, 12);
    const shield = new THREE.Mesh(shieldGeo, bronzeMat);
    shield.position.set(-0.06, -0.3, 0.15);
    shield.rotation.y = Math.PI / 2;
    shield.rotation.z = Math.PI / 2;
    this.leftArmPivot.add(shield);
    this.bodyGroup.add(this.leftArmPivot);

    // 4. Right Arm with Royal Long Spear (ပုဂံလှံရှည်)
    this.rightArmPivot = new THREE.Group();
    this.rightArmPivot.position.set(0.35, 1.32, 0);
    const rightArmMesh = new THREE.Mesh(armGeo, skinMat);
    this.rightArmPivot.add(rightArmMesh);

    // Long Spear Group (2.5m)
    this.spearGroup = new THREE.Group();
    this.spearGroup.position.set(0, -0.35, 0.1);

    // Teak Shaft
    const shaftGeo = new THREE.CylinderGeometry(0.03, 0.03, 2.5, 6);
    const shaft = new THREE.Mesh(shaftGeo, woodMat);
    this.spearGroup.add(shaft);

    // Steel Leaf Spearhead (လှံသွား)
    const tipGeo = new THREE.ConeGeometry(0.09, 0.52, 6);
    const tip = new THREE.Mesh(tipGeo, steelMat);
    tip.position.y = 1.45;
    this.spearGroup.add(tip);

    // Red Horsehair Tassel (လှံဆံပင်စ)
    const tasselGeo = new THREE.CylinderGeometry(0.055, 0.035, 0.22, 6);
    const tassel = new THREE.Mesh(tasselGeo, redMat);
    tassel.position.y = 1.15;
    this.spearGroup.add(tassel);

    // Angle spear naturally upright
    this.spearGroup.rotation.x = Math.PI / 4.2;
    this.rightArmPivot.add(this.spearGroup);
    this.bodyGroup.add(this.rightArmPivot);
  }

  performAttack(target) {
    // Spearman deals +50% bonus damage to mounted cavalry and elephants!
    let dmg = this.attackDamage;
    if (target.type === 'cavalry' || target.type === 'elephant' || target.name.includes('ဆင်') || target.name.includes('မြင်း')) {
      dmg = Math.round(dmg * 1.6);
      if (this.game.hud) {
        this.game.hud.showFloatingText('CRITICAL! +60%', this.mesh.position, '#f39c12');
      }
    }

    target.takeDamage(dmg);
    this.isAttacking = true;
    this.attackAnimTimer = 0;
    this.attackAnimProgress = 0;
    this.lunge();

    if (this.game.combatVFX) {
      this.game.combatVFX.spawnSlashEffect(this, target);
    }
  }

  updateProceduralAnimation(delta) {
    if (!this.bodyGroup || !this.leftLegPivot || !this.rightLegPivot) return;

    if (this.isAttacking) {
      // 3-Phase Spear Thrust Animation
      const p = this.attackAnimProgress;
      if (p < 0.35) {
        // Wind-up: Pull spear back
        const t = p / 0.35;
        this.rightArmPivot.rotation.x = -0.5 * t;
        this.spearGroup.position.z = -0.4 * t;
        this.bodyGroup.position.z = -0.1 * t;
      } else if (p < 0.75) {
        // Powerful Forward Thrust
        const t = (p - 0.35) / 0.4;
        this.rightArmPivot.rotation.x = -0.5 + 1.2 * t;
        this.spearGroup.position.z = -0.4 + 0.8 * t;
        this.bodyGroup.position.z = 0.3 * Math.sin(t * Math.PI);
      } else {
        // Recovery
        const t = (p - 0.75) / 0.25;
        this.rightArmPivot.rotation.x = THREE.MathUtils.lerp(this.rightArmPivot.rotation.x, 0.4, t);
        this.spearGroup.position.z = THREE.MathUtils.lerp(this.spearGroup.position.z, 0.1, t);
        this.bodyGroup.position.z = THREE.MathUtils.lerp(this.bodyGroup.position.z, 0, t);
      }
    } else if (this.isMoving) {
      const walkSpeed = this.speed * 2.5;
      const walkCycle = this.animTime * walkSpeed;
      const legSwing = Math.sin(walkCycle) * 0.65;

      this.leftLegPivot.rotation.x = legSwing;
      this.rightLegPivot.rotation.x = -legSwing;

      this.leftArmPivot.rotation.x = -legSwing * 0.6;
      this.rightArmPivot.rotation.x = 0.3 + Math.sin(walkCycle) * 0.2;

      this.bodyGroup.position.y = Math.abs(Math.sin(walkCycle)) * 0.07;
      this.bodyGroup.rotation.x = 0.12;
      this.bodyGroup.rotation.z = Math.sin(walkCycle) * 0.04;
    } else {
      // Idle Ready Stance
      this.leftLegPivot.rotation.x = THREE.MathUtils.lerp(this.leftLegPivot.rotation.x, 0, 0.15);
      this.rightLegPivot.rotation.x = THREE.MathUtils.lerp(this.rightLegPivot.rotation.x, 0, 0.15);

      const breath = Math.sin(this.animTime * 2.0);
      this.bodyGroup.position.y = breath * 0.018;
      this.bodyGroup.scale.set(1 + breath * 0.015, 1 + breath * 0.02, 1 + breath * 0.015);

      this.rightArmPivot.rotation.x = THREE.MathUtils.lerp(this.rightArmPivot.rotation.x, 0.4, 0.1);
      this.spearGroup.position.z = 0.1;
    }
  }
}
