import * as THREE from 'three';
import { Unit } from './Unit.js';

export class WarElephant extends Unit {
  constructor(game, options = {}) {
    const subType = options.subType || 'stomp'; // 'stomp', 'archer', 'armored'

    let name = 'ပုဂံတိုက်ဆင် (War Elephant)';
    let hp = 450;
    let speed = 3.2;
    let damage = 35;
    let range = 2.8;
    let cooldown = 1.5;

    if (subType === 'archer') {
      name = 'ပြာသာဒ်တင် မြားပစ်ဆင် (Elephant Archer)';
      hp = 420;
      speed = 3.3;
      damage = 22;
      range = 11.0;
      cooldown = 1.2;
    } else if (subType === 'armored') {
      name = 'သံချပ်ကာ တိုက်ဆင်မင်း (Armored Royal Elephant)';
      hp = 680;
      speed = 3.0;
      damage = 50;
      range = 3.0;
      cooldown = 1.6;
    }

    super(game, {
      ...options,
      name,
      type: 'elephant',
      hp,
      speed,
      damage,
      range,
      cooldown
    });

    this.subType = subType;
    this.attackAnimDuration = 0.65;
    this.createElephantModel();
  }

  createElephantModel() {
    const isEnemy = this.faction === 'enemy';
    const skinMat = new THREE.MeshStandardMaterial({
      color: 0x515a5a,
      roughness: 0.82
    });
    const clothMat = new THREE.MeshStandardMaterial({
      color: isEnemy ? 0x1b2631 : (this.subType === 'armored' ? 0x511010 : 0x78281f),
      roughness: 0.55
    });
    const goldMat = new THREE.MeshStandardMaterial({
      color: 0xf1c40f,
      metalness: 0.85,
      roughness: 0.22
    });
    const bronzeMat = new THREE.MeshStandardMaterial({
      color: 0xd35400,
      metalness: 0.7,
      roughness: 0.35
    });
    const steelMat = new THREE.MeshStandardMaterial({
      color: 0xd5d8dc,
      metalness: 0.95,
      roughness: 0.18
    });
    const tuskMat = new THREE.MeshStandardMaterial({
      color: 0xfffcf0,
      roughness: 0.25
    });
    const teakMat = new THREE.MeshStandardMaterial({
      color: 0x3e2723,
      roughness: 0.7
    });

    // 1. Elephant Body Root Group
    this.bodyGroup = new THREE.Group();
    this.mesh.add(this.bodyGroup);

    // Elephant Torso (Massive curved body)
    const bodyGeo = new THREE.BoxGeometry(2.1, 1.9, 3.3);
    const body = new THREE.Mesh(bodyGeo, skinMat);
    body.position.y = 1.95;
    body.castShadow = true;
    this.bodyGroup.add(body);

    // Elephant Spine Ridge curve
    const spineGeo = new THREE.BoxGeometry(1.4, 0.4, 2.6);
    const spine = new THREE.Mesh(spineGeo, skinMat);
    spine.position.set(0, 2.9, -0.1);
    this.bodyGroup.add(spine);

    // Royal Bagan Embroidered Caparison Blanket (ကျောက်စီ ကုန်းနှီးကော်ဇော)
    const clothGeo = new THREE.BoxGeometry(2.22, 1.35, 2.5);
    const cloth = new THREE.Mesh(clothGeo, clothMat);
    cloth.position.y = 2.15;
    this.bodyGroup.add(cloth);

    // Golden Fringe along blanket bottom edge
    const fringeGeo = new THREE.BoxGeometry(2.26, 0.12, 2.54);
    const fringe = new THREE.Mesh(fringeGeo, goldMat);
    fringe.position.y = 1.48;
    this.bodyGroup.add(fringe);

    // Hanging Bronze Bells along flanks (ခေါင်းလောင်းငယ်များ)
    [-1.15, 1.15].forEach(x => {
      [-0.8, -0.2, 0.4, 1.0].forEach(z => {
        const bell = new THREE.Mesh(new THREE.ConeGeometry(0.08, 0.14, 6), bronzeMat);
        bell.position.set(x, 1.38, z);
        this.bodyGroup.add(bell);
      });
    });

    // Armored Elephant Flank Iron Plates
    if (this.subType === 'armored') {
      const plateGeo = new THREE.BoxGeometry(2.32, 0.95, 2.3);
      const armorPlate = new THREE.Mesh(plateGeo, steelMat);
      armorPlate.position.y = 2.05;
      this.bodyGroup.add(armorPlate);
    }

    // Head Group
    this.headGroup = new THREE.Group();
    this.headGroup.position.set(0, 2.45, 1.8);

    const headGeo = new THREE.BoxGeometry(1.5, 1.45, 1.5);
    const head = new THREE.Mesh(headGeo, skinMat);
    this.headGroup.add(head);

    // Golden Frontal Battle Headplate (နဖူးသံချပ်နှင့် ရွှေပန်းခွေ)
    const headPlateGeo = new THREE.BoxGeometry(1.56, 0.9, 0.35);
    const headPlate = new THREE.Mesh(headPlateGeo, this.subType === 'armored' ? steelMat : goldMat);
    headPlate.position.set(0, 0.35, 0.72);
    this.headGroup.add(headPlate);

    const headSpire = new THREE.Mesh(new THREE.ConeGeometry(0.12, 0.35, 6), goldMat);
    headSpire.position.set(0, 0.92, 0.4);
    this.headGroup.add(headSpire);

    // Trunk Pivot
    this.trunkPivot = new THREE.Group();
    this.trunkPivot.position.set(0, -0.42, 0.72);

    const trunkGeo = new THREE.CylinderGeometry(0.24, 0.13, 1.9, 8);
    trunkGeo.translate(0, -0.95, 0);
    this.trunkMesh = new THREE.Mesh(trunkGeo, skinMat);
    this.trunkPivot.add(this.trunkMesh);
    this.trunkPivot.rotation.x = Math.PI / 4.2;
    this.headGroup.add(this.trunkPivot);

    // Grand Curved Ivory Tusks
    const tuskGeo = new THREE.ConeGeometry(0.12, 1.3, 8);
    tuskGeo.translate(0, 0.65, 0);

    const leftTusk = new THREE.Mesh(tuskGeo, tuskMat);
    leftTusk.position.set(0.52, -0.28, 0.72);
    leftTusk.rotation.x = Math.PI / 2.7;
    leftTusk.rotation.z = -0.16;
    this.headGroup.add(leftTusk);

    const rightTusk = new THREE.Mesh(tuskGeo, tuskMat);
    rightTusk.position.set(-0.52, -0.28, 0.72);
    rightTusk.rotation.x = Math.PI / 2.7;
    rightTusk.rotation.z = 0.16;
    this.headGroup.add(rightTusk);

    // Golden / Steel Tusk Spear Caps (ဆင်စွယ်စွပ်)
    const capGeo = new THREE.ConeGeometry(0.13, 0.45, 6);
    capGeo.translate(0, 1.35, 0);
    const leftCap = new THREE.Mesh(capGeo, this.subType === 'armored' ? steelMat : goldMat);
    leftCap.position.copy(leftTusk.position);
    leftCap.rotation.copy(leftTusk.rotation);
    this.headGroup.add(leftCap);

    const rightCap = new THREE.Mesh(capGeo, this.subType === 'armored' ? steelMat : goldMat);
    rightCap.position.copy(rightTusk.position);
    rightCap.rotation.copy(rightTusk.rotation);
    this.headGroup.add(rightCap);

    // Flapping Broad Fan Ears
    const earGeo = new THREE.BoxGeometry(0.08, 1.1, 0.85);
    this.leftEar = new THREE.Mesh(earGeo, skinMat);
    this.leftEar.position.set(0.88, 0.05, 0);
    this.headGroup.add(this.leftEar);

    this.rightEar = new THREE.Mesh(earGeo, skinMat);
    this.rightEar.position.set(-0.88, 0.05, 0);
    this.headGroup.add(this.rightEar);

    // Elephant Mahout Rider on Neck (ဆင်ဦးစီး စစ်သည်)
    const mahoutGroup = new THREE.Group();
    mahoutGroup.position.set(0, 0.95, -0.2);

    const mahoutBody = new THREE.Mesh(new THREE.BoxGeometry(0.48, 0.55, 0.35), clothMat);
    mahoutGroup.add(mahoutBody);

    const mahoutHead = new THREE.Mesh(new THREE.SphereGeometry(0.18, 8, 8), new THREE.MeshStandardMaterial({ color: 0xd4a373 }));
    mahoutHead.position.y = 0.42;
    mahoutGroup.add(mahoutHead);

    const mahoutKhamauk = new THREE.Mesh(new THREE.ConeGeometry(0.35, 0.18, 8), new THREE.MeshStandardMaterial({ color: 0xd4ac0d }));
    mahoutKhamauk.position.y = 0.54;
    mahoutGroup.add(mahoutKhamauk);

    // Elephant Goad (ချွန်း)
    const goadGeo = new THREE.CylinderGeometry(0.03, 0.03, 0.7, 4);
    const goad = new THREE.Mesh(goadGeo, bronzeMat);
    goad.position.set(0.32, 0.2, 0.18);
    goad.rotation.x = Math.PI / 4;
    mahoutGroup.add(goad);

    this.headGroup.add(mahoutGroup);
    this.bodyGroup.add(this.headGroup);

    // 2. Royal Bagan Battle Howdah (ဆင်ပြာသာဒ် ကုန်းထီး)
    this.howdahGroup = new THREE.Group();
    this.howdahGroup.position.set(0, 3.25, -0.2);

    // Teak Wood Pavilion Base
    const howdahBase = new THREE.Mesh(new THREE.BoxGeometry(1.65, 0.75, 1.7), teakMat);
    this.howdahGroup.add(howdahBase);

    // 4 Corner Gilded Pillars
    const pillarGeo = new THREE.CylinderGeometry(0.06, 0.06, 1.0, 6);
    const pillarPos = [
      [-0.7, 0.75, -0.7],
      [0.7, 0.75, -0.7],
      [-0.7, 0.75, 0.7],
      [0.7, 0.75, 0.7]
    ];
    pillarPos.forEach(([px, py, pz]) => {
      const pillar = new THREE.Mesh(pillarGeo, goldMat);
      pillar.position.set(px, py, pz);
      this.howdahGroup.add(pillar);
    });

    // Tiered Bagan Roof Canopy with Gilded Finial
    const roofGeo = new THREE.ConeGeometry(1.15, 0.65, 8);
    const roof = new THREE.Mesh(roofGeo, clothMat);
    roof.position.y = 1.45;
    this.howdahGroup.add(roof);

    const roofGold = new THREE.Mesh(new THREE.ConeGeometry(0.45, 0.5, 6), goldMat);
    roofGold.position.y = 1.95;
    this.howdahGroup.add(roofGold);

    // Royal Bagan Pennant Flag
    const flagGeo = new THREE.PlaneGeometry(0.9, 0.5);
    const flag = new THREE.Mesh(flagGeo, new THREE.MeshStandardMaterial({
      color: isEnemy ? 0x922b21 : 0xd4ac0d,
      side: THREE.DoubleSide
    }));
    flag.position.set(0.45, 2.2, 0);
    this.howdahGroup.add(flag);

    // If Elephant Archer: two stationed archers aiming from howdah
    if (this.subType === 'archer') {
      [-0.45, 0.45].forEach(x => {
        const archerMesh = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.55, 0.3), new THREE.MeshStandardMaterial({ color: 0x196f3d }));
        archerMesh.position.set(x, 0.6, 0);
        this.howdahGroup.add(archerMesh);

        const bowMesh = new THREE.Mesh(new THREE.TorusGeometry(0.28, 0.025, 6, 10, Math.PI), goldMat);
        bowMesh.position.set(x, 0.65, 0.35);
        bowMesh.rotation.z = Math.PI / 2;
        this.howdahGroup.add(bowMesh);
      });
    }

    this.bodyGroup.add(this.howdahGroup);

    // 3. Four Massive Muscular Legs with Knees & Ankles
    const legGeo = new THREE.CylinderGeometry(0.36, 0.42, 1.45, 8);
    legGeo.translate(0, -0.72, 0);

    this.legFL = new THREE.Group();
    this.legFL.position.set(0.72, 1.45, 1.05);
    this.legFL.add(new THREE.Mesh(legGeo, skinMat));
    this.mesh.add(this.legFL);

    this.legFR = new THREE.Group();
    this.legFR.position.set(-0.72, 1.45, 1.05);
    this.legFR.add(new THREE.Mesh(legGeo, skinMat));
    this.mesh.add(this.legFR);

    this.legBL = new THREE.Group();
    this.legBL.position.set(0.72, 1.45, -1.05);
    this.legBL.add(new THREE.Mesh(legGeo, skinMat));
    this.mesh.add(this.legBL);

    this.legBR = new THREE.Group();
    this.legBR.position.set(-0.72, 1.45, -1.05);
    this.legBR.add(new THREE.Mesh(legGeo, skinMat));
    this.mesh.add(this.legBR);

    this.selectionRing.geometry.dispose();
    this.selectionRing.geometry = new THREE.RingGeometry(2.2, 2.5, 32);

    this.createHpBar(2.4, 0.24, 5.2);
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
      if (this.game.combatVFX) {
        this.game.combatVFX.spawnElephantStomp(this, target, this.attackDamage);
      } else {
        target.takeDamage(this.attackDamage);
        this.lunge();
      }
    }
  }

  updateProceduralAnimation(delta) {
    if (!this.bodyGroup || !this.legFL || !this.legFR) return;

    if (this.isAttacking) {
      const p = this.attackAnimProgress;
      if (p < 0.45) {
        const t = p / 0.45;
        this.bodyGroup.rotation.x = -0.38 * t;
        this.bodyGroup.position.y = 0.3 * t;
        this.legFL.rotation.x = -0.65 * t;
        this.legFR.rotation.x = -0.65 * t;
        this.legBL.rotation.x = 0.25 * t;
        this.legBR.rotation.x = 0.25 * t;
        this.trunkPivot.rotation.x = (Math.PI / 4) - 0.7 * t;
        this.headGroup.rotation.x = -0.25 * t;
      } else if (p < 0.75) {
        const t = (p - 0.45) / 0.3;
        this.bodyGroup.rotation.x = -0.38 + 0.48 * t;
        this.bodyGroup.position.y = 0.3 - 0.45 * t;
        this.legFL.rotation.x = -0.65 + 0.75 * t;
        this.legFR.rotation.x = -0.65 + 0.75 * t;
        this.trunkPivot.rotation.x = (Math.PI / 4) + 0.4 * Math.sin(t * Math.PI);
        this.headGroup.rotation.x = 0.2 * Math.sin(t * Math.PI);
      } else {
        const t = (p - 0.75) / 0.25;
        this.bodyGroup.rotation.x = THREE.MathUtils.lerp(this.bodyGroup.rotation.x, 0, t);
        this.bodyGroup.position.y = THREE.MathUtils.lerp(this.bodyGroup.position.y, 0, t);
        this.legFL.rotation.x = THREE.MathUtils.lerp(this.legFL.rotation.x, 0, t);
        this.legFR.rotation.x = THREE.MathUtils.lerp(this.legFR.rotation.x, 0, t);
        this.trunkPivot.rotation.x = THREE.MathUtils.lerp(this.trunkPivot.rotation.x, Math.PI / 4, t);
        this.headGroup.rotation.x = THREE.MathUtils.lerp(this.headGroup.rotation.x, 0, t);
      }
    } else if (this.isMoving) {
      const walkSpeed = this.speed * 2.2;
      const walkCycle = this.animTime * walkSpeed;
      const swing = Math.sin(walkCycle) * 0.42;

      this.legFL.rotation.x = swing;
      this.legBR.rotation.x = swing;
      this.legFR.rotation.x = -swing;
      this.legBL.rotation.x = -swing;

      this.bodyGroup.position.y = Math.abs(Math.sin(walkCycle)) * 0.08;
      this.bodyGroup.rotation.z = Math.sin(walkCycle) * 0.04;

      this.howdahGroup.rotation.z = -Math.sin(walkCycle) * 0.06;
      this.howdahGroup.rotation.x = Math.cos(walkCycle * 2) * 0.03;

      this.trunkPivot.rotation.z = Math.sin(walkCycle * 0.8) * 0.28;
      this.trunkPivot.rotation.x = (Math.PI / 4) + Math.cos(walkCycle) * 0.12;
      this.leftEar.rotation.y = Math.sin(walkCycle * 1.5) * 0.18;
      this.rightEar.rotation.y = -Math.sin(walkCycle * 1.5) * 0.18;
      this.headGroup.rotation.x = Math.sin(walkCycle) * 0.06;
    } else {
      this.legFL.rotation.x = THREE.MathUtils.lerp(this.legFL.rotation.x, 0, 0.1);
      this.legFR.rotation.x = THREE.MathUtils.lerp(this.legFR.rotation.x, 0, 0.1);
      this.legBL.rotation.x = THREE.MathUtils.lerp(this.legBL.rotation.x, 0, 0.1);
      this.legBR.rotation.x = THREE.MathUtils.lerp(this.legBR.rotation.x, 0, 0.1);

      const breath = Math.sin(this.animTime * 1.6);
      this.bodyGroup.position.y = breath * 0.025;
      this.bodyGroup.rotation.x = THREE.MathUtils.lerp(this.bodyGroup.rotation.x, 0, 0.1);
      this.bodyGroup.rotation.z = THREE.MathUtils.lerp(this.bodyGroup.rotation.z, 0, 0.1);

      this.trunkPivot.rotation.z = Math.sin(this.animTime * 1.2) * 0.15;
      this.trunkPivot.rotation.x = (Math.PI / 4) + breath * 0.08;
      this.leftEar.rotation.y = Math.sin(this.animTime * 2.5) * 0.1;
      this.rightEar.rotation.y = -Math.sin(this.animTime * 2.5) * 0.1;
    }
  }
}
