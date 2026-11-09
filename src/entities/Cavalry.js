import * as THREE from 'three';
import { Unit } from './Unit.js';

export class Cavalry extends Unit {
  constructor(game, options = {}) {
    const subType = options.subType || 'raider'; // 'raider', 'lancer', 'archer'
    
    let name = 'ဓားကိုင်မြင်းသည်တော် (Cavalry Raider)';
    let hp = 150;
    let speed = 7.0;
    let damage = 20;
    let range = 2.0;
    let cooldown = 1.0;

    if (subType === 'lancer') {
      name = 'လှံကိုင်မြင်းသည်တော် (Lancer Cavalry)';
      hp = 180;
      speed = 6.6;
      damage = 28;
      range = 2.5;
      cooldown = 1.3;
    } else if (subType === 'archer') {
      name = 'မြင်းစီးလေးသည်တော် (Horse Archer)';
      hp = 120;
      speed = 7.2;
      damage = 15;
      range = 10.0;
      cooldown = 1.2;
    }

    super(game, {
      ...options,
      name,
      type: 'cavalry',
      hp,
      speed,
      damage,
      range,
      cooldown
    });

    this.subType = subType;
    this.createCavalryModel();
  }

  createCavalryModel() {
    const isEnemy = this.faction === 'enemy';
    const horseBrownMat = new THREE.MeshStandardMaterial({ color: isEnemy ? 0x212f3d : 0x5d4037, roughness: 0.75 });
    const horseManeMat = new THREE.MeshStandardMaterial({ color: 0x17202a, roughness: 0.9 });
    const saddleRedMat = new THREE.MeshStandardMaterial({ color: isEnemy ? 0x922b21 : 0x78281f, roughness: 0.55 });
    const goldMat = new THREE.MeshStandardMaterial({ color: 0xf1c40f, metalness: 0.85, roughness: 0.22 });
    const steelMat = new THREE.MeshStandardMaterial({ color: 0xecf0f1, metalness: 0.95, roughness: 0.18 });
    const skinMat = new THREE.MeshStandardMaterial({ color: 0xd4a373, roughness: 0.75 });
    const woodMat = new THREE.MeshStandardMaterial({ color: 0x4a2e18, roughness: 0.75 });

    this.cavalryGroup = new THREE.Group();
    this.mesh.add(this.cavalryGroup);

    // -------------------------------------------------------------
    // 1. HORSE BODY
    // -------------------------------------------------------------
    // Torso / Barrel
    const bodyGeo = new THREE.BoxGeometry(0.9, 0.9, 1.8);
    const horseBody = new THREE.Mesh(bodyGeo, horseBrownMat);
    horseBody.position.y = 1.1;
    horseBody.castShadow = true;
    this.cavalryGroup.add(horseBody);

    // Neck & Head
    this.neckGroup = new THREE.Group();
    this.neckGroup.position.set(0, 1.3, 0.8);

    const neckGeo = new THREE.BoxGeometry(0.5, 0.9, 0.6);
    neckGeo.translate(0, 0.35, 0.2);
    const neck = new THREE.Mesh(neckGeo, horseBrownMat);
    neck.rotation.x = -Math.PI / 6;
    this.neckGroup.add(neck);

    const headGeo = new THREE.BoxGeometry(0.42, 0.45, 0.8);
    const head = new THREE.Mesh(headGeo, horseBrownMat);
    head.position.set(0, 0.75, 0.65);
    head.rotation.x = Math.PI / 8;
    this.neckGroup.add(head);

    // Pointed Ears
    const earGeo = new THREE.ConeGeometry(0.08, 0.2, 4);
    const leftEar = new THREE.Mesh(earGeo, horseBrownMat);
    leftEar.position.set(0.14, 1.05, 0.45);
    this.neckGroup.add(leftEar);

    const rightEar = new THREE.Mesh(earGeo, horseBrownMat);
    rightEar.position.set(-0.14, 1.05, 0.45);
    this.neckGroup.add(rightEar);

    // Dark Mane
    const maneGeo = new THREE.BoxGeometry(0.12, 0.8, 0.3);
    const mane = new THREE.Mesh(maneGeo, horseManeMat);
    mane.position.set(0, 0.5, -0.05);
    this.neckGroup.add(mane);

    this.cavalryGroup.add(this.neckGroup);

    // Tail
    const tailGeo = new THREE.CylinderGeometry(0.08, 0.04, 0.9, 6);
    tailGeo.translate(0, -0.45, 0);
    this.tail = new THREE.Mesh(tailGeo, horseManeMat);
    this.tail.position.set(0, 1.3, -0.9);
    this.tail.rotation.x = Math.PI / 5;
    this.cavalryGroup.add(this.tail);

    // Saddle & Royal Saddle Blanket
    const saddleGeo = new THREE.BoxGeometry(0.95, 0.25, 0.9);
    const saddle = new THREE.Mesh(saddleGeo, saddleRedMat);
    saddle.position.set(0, 1.55, 0);
    this.cavalryGroup.add(saddle);

    // -------------------------------------------------------------
    // 2. FOUR HORSE LEGS (Gallop Pivots at y = 0.9)
    // -------------------------------------------------------------
    const legGeo = new THREE.CylinderGeometry(0.12, 0.1, 0.95, 6);
    legGeo.translate(0, -0.47, 0);

    this.legFL = new THREE.Group();
    this.legFL.position.set(0.32, 0.9, 0.65);
    this.legFL.add(new THREE.Mesh(legGeo, horseBrownMat));
    this.mesh.add(this.legFL);

    this.legFR = new THREE.Group();
    this.legFR.position.set(-0.32, 0.9, 0.65);
    this.legFR.add(new THREE.Mesh(legGeo, horseBrownMat));
    this.mesh.add(this.legFR);

    this.legBL = new THREE.Group();
    this.legBL.position.set(0.32, 0.9, -0.65);
    this.legBL.add(new THREE.Mesh(legGeo, horseBrownMat));
    this.mesh.add(this.legBL);

    this.legBR = new THREE.Group();
    this.legBR.position.set(-0.32, 0.9, -0.65);
    this.legBR.add(new THREE.Mesh(legGeo, horseBrownMat));
    this.mesh.add(this.legBR);

    // -------------------------------------------------------------
    // 3. RIDER ON HORSEBACK
    // -------------------------------------------------------------
    this.riderGroup = new THREE.Group();
    this.riderGroup.position.set(0, 1.6, 0.05);

    // Rider Torso
    const riderTorsoGeo = new THREE.BoxGeometry(0.5, 0.65, 0.35);
    const riderTorso = new THREE.Mesh(riderTorsoGeo, saddleRedMat);
    riderTorso.position.y = 0.45;
    this.riderGroup.add(riderTorso);

    // Rider Head & Helmet
    const riderHeadGeo = new THREE.SphereGeometry(0.2, 8, 8);
    const riderHead = new THREE.Mesh(riderHeadGeo, skinMat);
    riderHead.position.y = 0.95;
    this.riderGroup.add(riderHead);

    const helmetGeo = new THREE.ConeGeometry(0.24, 0.35, 8);
    const helmet = new THREE.Mesh(helmetGeo, goldMat);
    helmet.position.y = 1.15;
    this.riderGroup.add(helmet);

    // Rider Right Arm (Weapon Arm)
    const armGeo = new THREE.CylinderGeometry(0.07, 0.07, 0.5, 6);
    armGeo.translate(0, -0.25, 0);

    this.rightArmPivot = new THREE.Group();
    this.rightArmPivot.position.set(0.32, 0.65, 0);
    this.rightArmPivot.add(new THREE.Mesh(armGeo, skinMat));

    // Weapon based on subtype
    if (this.subType === 'raider') {
      // Cavalry Curved Dha Sword
      const swordBlade = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.8, 0.04), steelMat);
      swordBlade.position.set(0, -0.4, 0.25);
      swordBlade.rotation.x = Math.PI / 3;
      this.rightArmPivot.add(swordBlade);
    } else if (this.subType === 'lancer') {
      // Heavy Cavalry Lance (2.6m)
      const lanceShaft = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 2.4, 6), woodMat);
      lanceShaft.position.set(0, -0.2, 0.9);
      lanceShaft.rotation.x = Math.PI / 2.2;
      this.rightArmPivot.add(lanceShaft);

      const lanceTip = new THREE.Mesh(new THREE.ConeGeometry(0.08, 0.4, 6), steelMat);
      lanceTip.position.set(0, -0.2, 2.15);
      lanceTip.rotation.x = Math.PI / 2;
      this.rightArmPivot.add(lanceTip);
    } else if (this.subType === 'archer') {
      // Recurve Bow
      const bow = new THREE.Mesh(new THREE.TorusGeometry(0.45, 0.03, 6, 12, Math.PI), goldMat);
      bow.position.set(0, -0.3, 0.25);
      bow.rotation.y = Math.PI / 2;
      this.rightArmPivot.add(bow);
    }

    this.riderGroup.add(this.rightArmPivot);
    this.cavalryGroup.add(this.riderGroup);

    // HP Bar
    this.createHpBar(1.5, 0.16, 3.2);
  }

  performAttack(target) {
    this.isAttacking = true;
    this.attackAnimTimer = 0;
    this.attackAnimProgress = 0;

    if (this.subType === 'archer') {
      if (this.game.combatVFX) {
        this.game.combatVFX.spawnArrow(this, target, this.attackDamage);
      } else {
        target.takeDamage(this.attackDamage);
      }
    } else {
      let dmg = this.attackDamage;
      // Lancer does +50% charge damage
      if (this.subType === 'lancer') {
        dmg = Math.round(dmg * 1.5);
      }
      target.takeDamage(dmg);
      this.lunge();

      if (this.game.combatVFX) {
        this.game.combatVFX.spawnSlashEffect(this, target);
      }
    }
  }

  updateProceduralAnimation(delta) {
    if (!this.cavalryGroup || !this.legFL) return;

    if (this.isMoving) {
      // Realistic 4-beat horse canter/gallop with natural footfall phase offsets
      const gallopSpeed = this.speed * 2.8;
      const t = this.animTime * gallopSpeed;

      const swingFL = Math.sin(t) * 0.7;
      const swingFR = Math.sin(t - 0.5) * 0.65;
      const swingBL = Math.sin(t + Math.PI - 0.4) * 0.65;
      const swingBR = Math.sin(t + Math.PI) * 0.7;

      this.legFL.rotation.x = swingFL;
      this.legFR.rotation.x = swingFR;
      this.legBL.rotation.x = swingBL;
      this.legBR.rotation.x = swingBR;

      // Gallop vertical bounce & pitching
      this.cavalryGroup.position.y = Math.max(0, Math.sin(t * 2)) * 0.14;
      this.cavalryGroup.rotation.x = Math.sin(t) * 0.10;
      this.cavalryGroup.rotation.z = Math.sin(t * 0.5) * 0.04;

      // Horse neck bobs counter to torso pitch
      this.neckGroup.rotation.x = -Math.cos(t) * 0.12;
      this.neckGroup.rotation.y = Math.sin(t * 0.5) * 0.05;

      // Flowing tail in the wind
      this.tail.rotation.x = 0.35 + Math.sin(t) * 0.25;
      this.tail.rotation.z = Math.sin(t * 1.4) * 0.22;

      // Rider dynamic equestrian posture
      this.riderGroup.rotation.x = -this.cavalryGroup.rotation.x * 0.75;
      this.riderGroup.position.y = this.cavalryGroup.position.y * 0.4;
      this.riderGroup.rotation.z = -this.cavalryGroup.rotation.z * 0.5;
    } else {
      this.legFL.rotation.x = THREE.MathUtils.lerp(this.legFL.rotation.x, 0, 0.12);
      this.legFR.rotation.x = THREE.MathUtils.lerp(this.legFR.rotation.x, 0, 0.12);
      this.legBL.rotation.x = THREE.MathUtils.lerp(this.legBL.rotation.x, 0, 0.12);
      this.legBR.rotation.x = THREE.MathUtils.lerp(this.legBR.rotation.x, 0, 0.12);

      this.cavalryGroup.rotation.x = THREE.MathUtils.lerp(this.cavalryGroup.rotation.x, 0, 0.1);
      this.cavalryGroup.rotation.z = THREE.MathUtils.lerp(this.cavalryGroup.rotation.z, 0, 0.1);
      this.riderGroup.rotation.x = THREE.MathUtils.lerp(this.riderGroup.rotation.x, 0, 0.1);

      // Living idle: gentle breathing & casual tail flick
      const breath = Math.sin(this.animTime * 1.8);
      this.cavalryGroup.position.y = breath * 0.025;
      this.neckGroup.rotation.x = breath * 0.045;
      this.neckGroup.rotation.y = Math.sin(this.animTime * 0.6) * 0.06;
      this.tail.rotation.x = 0.1 + Math.sin(this.animTime * 2.2) * 0.08;
      this.tail.rotation.z = Math.sin(this.animTime * 2.8) * 0.18;
    }
  }
}
