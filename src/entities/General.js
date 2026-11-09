import * as THREE from 'three';
import { Unit } from './Unit.js';

export class General extends Unit {
  constructor(game, options = {}) {
    super(game, {
      ...options,
      name: options.name || 'ကျန်စစ်သား စစ်သူကြီး (General Kyansittha)',
      type: 'general',
      hp: options.hp || 850,
      damage: options.damage || 45,
      range: 2.8,
      speed: 5.5,
      cooldown: 1.1,
      faction: options.faction || 'player'
    });

    this.auraRadius = 14.0;
    this.warCryCooldown = 30.0;
    this.warCryTimer = 0;
    this.warCryActive = false;

    this.createHero3DModel();
    this.createCommandAuraMesh();
  }

  createHero3DModel() {
    const horseWhiteMat = new THREE.MeshStandardMaterial({ color: 0xfdfefe, roughness: 0.7 });
    const goldMat = new THREE.MeshStandardMaterial({ color: 0xf1c40f, metalness: 0.8, roughness: 0.25 });
    const crimsonMat = new THREE.MeshStandardMaterial({ color: 0x922b21, roughness: 0.5 });
    const skinMat = new THREE.MeshStandardMaterial({ color: 0xd4a373, roughness: 0.8 });
    const steelMat = new THREE.MeshStandardMaterial({ color: 0xd5d8dc, metalness: 0.9, roughness: 0.2 });

    // 1. Royal Charger Horse Group
    this.horseGroup = new THREE.Group();

    // Horse Body
    const bodyGeo = new THREE.BoxGeometry(1.0, 1.1, 2.2);
    const body = new THREE.Mesh(bodyGeo, horseWhiteMat);
    body.position.y = 1.35;
    body.castShadow = true;
    this.horseGroup.add(body);

    // Golden Royal Saddle Cloth (ကုန်းနှီး)
    const saddleGeo = new THREE.BoxGeometry(1.06, 0.5, 1.2);
    const saddle = new THREE.Mesh(saddleGeo, crimsonMat);
    saddle.position.set(0, 1.45, -0.1);
    this.horseGroup.add(saddle);

    // Horse Neck & Head
    const neckGeo = new THREE.BoxGeometry(0.5, 1.2, 0.7);
    const neck = new THREE.Mesh(neckGeo, horseWhiteMat);
    neck.position.set(0, 2.0, 0.85);
    neck.rotation.x = -Math.PI / 4;
    neck.castShadow = true;
    this.horseGroup.add(neck);

    const headGeo = new THREE.BoxGeometry(0.52, 0.55, 0.95);
    const head = new THREE.Mesh(headGeo, horseWhiteMat);
    head.position.set(0, 2.35, 1.35);
    this.horseGroup.add(head);

    // Golden Champron (Horse Head Armor)
    const champron = new THREE.Mesh(new THREE.BoxGeometry(0.54, 0.56, 0.5), goldMat);
    champron.position.set(0, 2.38, 1.35);
    this.horseGroup.add(champron);

    // Horse Legs
    this.legs = [];
    const legGeo = new THREE.CylinderGeometry(0.12, 0.1, 1.2, 6);
    const legPos = [
      [-0.4, 0.6, 0.8],
      [0.4, 0.6, 0.8],
      [-0.4, 0.6, -0.8],
      [0.4, 0.6, -0.8]
    ];
    legPos.forEach(([lx, ly, lz]) => {
      const legPivot = new THREE.Group();
      legPivot.position.set(lx, 1.2, lz);
      const legMesh = new THREE.Mesh(legGeo, horseWhiteMat);
      legMesh.position.y = -0.6;
      legMesh.castShadow = true;
      legPivot.add(legMesh);
      this.horseGroup.add(legPivot);
      this.legs.push(legPivot);
    });

    this.mesh.add(this.horseGroup);

    // 2. Royal General Kyansittha (Heroic Bagan Commander)
    this.riderGroup = new THREE.Group();
    this.riderGroup.position.set(0, 1.85, -0.1);

    // Torso in Imperial Bagan Golden Scaled Armor
    const torso = new THREE.Mesh(new THREE.BoxGeometry(0.66, 0.82, 0.46), goldMat);
    torso.position.y = 0.42;
    torso.castShadow = true;
    this.riderGroup.add(torso);

    // Royal Ruby Heart Emblem on Breastplate (ပတ္တမြား ရင်ဘတ်တော်)
    const rubyMat = new THREE.MeshStandardMaterial({
      color: 0x900c3f,
      emissive: 0x581845,
      emissiveIntensity: 0.6,
      roughness: 0.1
    });
    const ruby = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 0.48, 8), rubyMat);
    ruby.rotation.x = Math.PI / 2;
    ruby.position.set(0, 0.52, 0.04);
    this.riderGroup.add(ruby);

    // Golden Shoulder Pauldrons (ပခုံးသံချပ်များ)
    [-0.38, 0.38].forEach(x => {
      const pauldron = new THREE.Mesh(new THREE.SphereGeometry(0.18, 8, 8), goldMat);
      pauldron.position.set(x, 0.72, 0);
      this.riderGroup.add(pauldron);
    });

    // Flowing Crimson Silk Royal Cape
    const capeGeo = new THREE.PlaneGeometry(0.9, 1.6);
    const cape = new THREE.Mesh(capeGeo, new THREE.MeshStandardMaterial({
      color: 0x78281f,
      side: THREE.DoubleSide,
      roughness: 0.4
    }));
    cape.position.set(0, 0.22, -0.29);
    cape.rotation.x = 0.22;
    this.riderGroup.add(cape);

    // Head & Royal Kyansittha Golden Crown (မင်းခေါင်းပေါင်း / ရွှေမကိုဋ်)
    const generalHead = new THREE.Mesh(new THREE.SphereGeometry(0.23, 10, 10), skinMat);
    generalHead.position.y = 1.02;
    this.riderGroup.add(generalHead);

    // Tiered Golden Crown
    const crownBase = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.26, 0.22, 10), goldMat);
    crownBase.position.y = 1.15;
    this.riderGroup.add(crownBase);

    const crownSpire = new THREE.Mesh(new THREE.ConeGeometry(0.18, 0.55, 8), goldMat);
    crownSpire.position.y = 1.48;
    this.riderGroup.add(crownSpire);

    // Royal Peacock Feather Plume (ဒေါင်းမြီး)
    const plume = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.06, 0.45, 4), new THREE.MeshBasicMaterial({ color: 0x117a65 }));
    plume.position.set(0, 1.82, -0.06);
    plume.rotation.x = -0.3;
    this.riderGroup.add(plume);

    // Golden Spear / Royal Dragon Lance with Bagan Pennant Flag
    const spearPole = new THREE.Mesh(new THREE.CylinderGeometry(0.038, 0.038, 3.4, 6), goldMat);
    spearPole.position.set(0.55, 0.65, 0.4);
    spearPole.rotation.x = Math.PI / 4.2;
    this.riderGroup.add(spearPole);

    const spearTip = new THREE.Mesh(new THREE.ConeGeometry(0.12, 0.55, 6), steelMat);
    spearTip.position.set(0.55, 1.8, 1.55);
    spearTip.rotation.x = Math.PI / 4.2;
    this.riderGroup.add(spearTip);

    // Royal Crimson Streamer Pennant Flag under spearhead
    const lanceFlag = new THREE.Mesh(new THREE.PlaneGeometry(0.65, 0.35), new THREE.MeshStandardMaterial({
      color: 0x922b21,
      side: THREE.DoubleSide
    }));
    lanceFlag.position.set(0.55, 1.55, 1.3);
    lanceFlag.rotation.y = Math.PI / 2;
    this.riderGroup.add(lanceFlag);

    this.mesh.add(this.riderGroup);

    // HP Bar
    this.createHpBar(2.4, 0.2, 3.8);
  }

  createCommandAuraMesh() {
    // Glowing golden command aura circle on the ground
    const auraGeo = new THREE.RingGeometry(this.auraRadius - 0.4, this.auraRadius, 48);
    auraGeo.rotateX(-Math.PI / 2);
    const auraMat = new THREE.MeshBasicMaterial({
      color: 0xf1c40f,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.4
    });
    this.auraMesh = new THREE.Mesh(auraGeo, auraMat);
    this.auraMesh.position.y = 0.08;
    this.mesh.add(this.auraMesh);
  }

  update(delta) {
    super.update(delta);

    // Animate horse galloping if moving
    if (this.isMoving && this.legs) {
      const legFreq = this.animTime * 14.0;
      this.legs[0].rotation.x = Math.sin(legFreq) * 0.65;
      this.legs[1].rotation.x = -Math.sin(legFreq) * 0.65;
      this.legs[2].rotation.x = -Math.sin(legFreq) * 0.65;
      this.legs[3].rotation.x = Math.sin(legFreq) * 0.65;

      this.horseGroup.position.y = Math.abs(Math.sin(legFreq * 2)) * 0.15;
    } else if (this.legs) {
      this.legs.forEach(l => (l.rotation.x = 0));
      this.horseGroup.position.y = 0;
    }

    // Command Aura Logic (Passive Buff to nearby friendly units)
    this.auraTimer = (this.auraTimer || 0) + delta;
    if (this.auraTimer >= 0.5) {
      this.auraTimer = 0;
      this.applyCommandAura();
    }

    // Slowly rotate aura ring
    if (this.auraMesh) {
      this.auraMesh.rotation.y += delta * 0.4;
    }
  }

  applyCommandAura() {
    const myPos = this.mesh.position;
    this.game.units.forEach(u => {
      if (u.faction === this.faction && u !== this && u.hp > 0) {
        const d = myPos.distanceTo(u.mesh.position);
        if (d <= this.auraRadius) {
          // Grant aura buff: +20% damage bonus
          if (!u.hasCommandAura) {
            u.hasCommandAura = true;
            u.originalDamage = u.attackDamage;
            u.attackDamage = Math.round(u.attackDamage * 1.2);
          }
        } else if (u.hasCommandAura) {
          u.hasCommandAura = false;
          if (u.originalDamage) u.attackDamage = u.originalDamage;
        }
      }
    });
  }

  triggerWarCry() {
    if (this.warCryTimer > 0) return;

    this.warCryTimer = this.warCryCooldown;
    const myPos = this.mesh.position;

    // Audio SFX
    if (this.game.soundSystem) {
      this.game.soundSystem.playWarGong();
    }

    // Visual Announcement
    this.game.hud.showFloatingText('👑 စစ်သူကြီး ကြုံးဝါးသံ! (+80 HP & +40% Speed)', myPos.clone().add(new THREE.Vector3(0, 3.5, 0)), '#f1c40f', true);

    // Shockwave burst
    if (this.game.combatVFX) {
      this.game.combatVFX.spawnDustBurst(myPos, 16);
    }

    // Heal & speed up all allies in aura
    this.game.units.forEach(u => {
      if (u.faction === this.faction && u.hp > 0) {
        if (myPos.distanceTo(u.mesh.position) <= this.auraRadius) {
          u.hp = Math.min(u.maxHp, u.hp + 80);
          u.updateHpBar();
          this.game.hud.showFloatingText('+80 HP', u.mesh.position, '#2ecc71');

          const origSpeed = u.speed;
          u.speed = origSpeed * 1.4;
          setTimeout(() => {
            u.speed = origSpeed;
          }, 8000);
        }
      }
    });
  }
}
