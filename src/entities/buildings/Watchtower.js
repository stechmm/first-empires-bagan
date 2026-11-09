import * as THREE from 'three';
import { Building } from '../Building.js';

export class Watchtower extends Building {
  constructor(game, options = {}) {
    super(game, {
      ...options,
      type: 'watchtower',
      name: options.name || 'ပုဂံ ကင်းစင် (Watchtower)',
      hp: options.hp || 650,
      size: 3.0,
      faction: options.faction || 'player'
    });

    this.attackRange = 18.0;
    this.attackDamage = 20;
    this.attackCooldown = 1.4;
    this.attackTimer = 0;
    this.scanTimer = 0;
    this.currentTarget = null;

    this.buildMesh();
  }

  buildMesh() {
    const isEnemy = this.faction === 'enemy';
    const woodColor = isEnemy ? 0x212f3d : 0x5d4037;
    const brickColor = isEnemy ? 0x34495e : 0x935116;
    const roofColor = isEnemy ? 0x78281f : 0xa04000;
    const goldColor = isEnemy ? 0x922b21 : 0xd4ac0d;

    const woodMat = new THREE.MeshStandardMaterial({ color: woodColor, roughness: 0.85 });
    const brickMat = new THREE.MeshStandardMaterial({ color: brickColor, roughness: 0.9 });
    const roofMat = new THREE.MeshStandardMaterial({ color: roofColor, roughness: 0.7 });
    const goldMat = new THREE.MeshStandardMaterial({ color: goldColor, metalness: 0.5, roughness: 0.4 });

    // 1. Terracotta Brick Base Pedestal
    const baseGeo = new THREE.BoxGeometry(3.2, 0.8, 3.2);
    const baseMesh = new THREE.Mesh(baseGeo, brickMat);
    baseMesh.position.y = 0.4;
    baseMesh.castShadow = true;
    baseMesh.receiveShadow = true;
    this.mesh.add(baseMesh);

    // 2. Four Heavy Teak Support Stilts
    const postGeo = new THREE.CylinderGeometry(0.18, 0.22, 6.2, 8);
    const postPositions = [
      [-1.1, -1.1],
      [1.1, -1.1],
      [-1.1, 1.1],
      [1.1, 1.1]
    ];
    postPositions.forEach(([px, pz]) => {
      const post = new THREE.Mesh(postGeo, woodMat);
      post.position.set(px, 3.5, pz);
      post.castShadow = true;
      this.mesh.add(post);
    });

    // Cross Braces (X-bracing between stilts)
    const braceGeo = new THREE.CylinderGeometry(0.08, 0.08, 3.2, 6);
    const brace1 = new THREE.Mesh(braceGeo, woodMat);
    brace1.position.set(0, 3.5, -1.1);
    brace1.rotation.z = Math.PI / 4;
    this.mesh.add(brace1);

    const brace2 = new THREE.Mesh(braceGeo, woodMat);
    brace2.position.set(0, 3.5, -1.1);
    brace2.rotation.z = -Math.PI / 4;
    this.mesh.add(brace2);

    // 3. Elevated Guard Deck Platform
    const deckGeo = new THREE.BoxGeometry(3.4, 0.35, 3.4);
    const deck = new THREE.Mesh(deckGeo, woodMat);
    deck.position.y = 6.6;
    deck.castShadow = true;
    this.mesh.add(deck);

    // Balustrade Railings & Arrow Slits
    const railMat = woodMat;
    const railGeo = new THREE.BoxGeometry(3.3, 0.85, 0.12);
    // North rail
    const railN = new THREE.Mesh(railGeo, railMat);
    railN.position.set(0, 7.1, -1.6);
    this.mesh.add(railN);
    // South rail
    const railS = new THREE.Mesh(railGeo, railMat);
    railS.position.set(0, 7.1, 1.6);
    this.mesh.add(railS);
    // West rail
    const railW = new THREE.Mesh(railGeo, railMat);
    railW.rotation.y = Math.PI / 2;
    railW.position.set(-1.6, 7.1, 0);
    this.mesh.add(railW);
    // East rail
    const railE = new THREE.Mesh(railGeo, railMat);
    railE.rotation.y = Math.PI / 2;
    railE.position.set(1.6, 7.1, 0);
    this.mesh.add(railE);

    // Guard Station Roof Group (Pyatthat hipped roof)
    this.turretGroup = new THREE.Group();
    this.turretGroup.position.set(0, 7.2, 0);
    this.mesh.add(this.turretGroup);

    // 4 Roof Posts
    const roofPostGeo = new THREE.CylinderGeometry(0.12, 0.12, 2.2, 6);
    postPositions.forEach(([px, pz]) => {
      const rp = new THREE.Mesh(roofPostGeo, woodMat);
      rp.position.set(px * 0.9, 1.1, pz * 0.9);
      this.turretGroup.add(rp);
    });

    // Lower Roof Tier
    const roofTier1Geo = new THREE.ConeGeometry(2.6, 1.2, 4);
    const roofTier1 = new THREE.Mesh(roofTier1Geo, roofMat);
    roofTier1.position.y = 2.4;
    roofTier1.rotation.y = Math.PI / 4;
    roofTier1.castShadow = true;
    this.turretGroup.add(roofTier1);

    // Upper Roof Tier
    const roofTier2Geo = new THREE.ConeGeometry(1.7, 1.0, 4);
    const roofTier2 = new THREE.Mesh(roofTier2Geo, roofMat);
    roofTier2.position.y = 3.2;
    roofTier2.rotation.y = Math.PI / 4;
    roofTier2.castShadow = true;
    this.turretGroup.add(roofTier2);

    // Golden Finial Spire
    const spireGeo = new THREE.ConeGeometry(0.35, 1.2, 8);
    const spire = new THREE.Mesh(spireGeo, goldMat);
    spire.position.y = 4.1;
    this.turretGroup.add(spire);

    // Royal War Pennant Flag
    const poleGeo = new THREE.CylinderGeometry(0.04, 0.04, 2.0, 6);
    const pole = new THREE.Mesh(poleGeo, woodMat);
    pole.position.set(1.2, 2.8, -1.2);
    this.turretGroup.add(pole);

    const flagGeo = new THREE.PlaneGeometry(0.7, 0.45);
    const flagMat = new THREE.MeshStandardMaterial({
      color: goldColor,
      side: THREE.DoubleSide
    });
    const flag = new THREE.Mesh(flagGeo, flagMat);
    flag.position.set(1.55, 3.4, -1.2);
    this.turretGroup.add(flag);

    // HP Bar above tower
    this.createHpBar(3.0, 0.28, 9.5);
  }

  update(delta) {
    super.update(delta);

    // Scan for hostile targets
    this.scanTimer += delta;
    if (this.scanTimer >= 0.4) {
      this.scanTimer = 0;
      this.findTarget();
    }

    // Auto-fire arrows if target in range
    if (this.currentTarget) {
      if (this.currentTarget.hp <= 0) {
        this.currentTarget = null;
        return;
      }

      const dist = this.mesh.position.distanceTo(this.currentTarget.mesh.position);
      if (dist > this.attackRange) {
        this.currentTarget = null;
        return;
      }

      // Smoothly rotate turret roof/slits towards target
      if (this.turretGroup) {
        const targetWorld = this.currentTarget.mesh.position;
        const angle = Math.atan2(
          targetWorld.x - this.mesh.position.x,
          targetWorld.z - this.mesh.position.z
        );
        this.turretGroup.rotation.y = THREE.MathUtils.lerp(this.turretGroup.rotation.y, angle, 0.15);
      }

      this.attackTimer += delta;
      if (this.attackTimer >= this.attackCooldown) {
        this.attackTimer = 0;
        this.fireArrow(this.currentTarget);
      }
    }
  }

  findTarget() {
    const opposingFaction = this.faction === 'player' ? 'enemy' : 'player';
    let closestTarget = null;
    let closestDist = this.attackRange;

    // Scan opposing units first (higher threat)
    for (const u of this.game.units) {
      if (u.faction === opposingFaction && u.hp > 0) {
        const d = this.mesh.position.distanceTo(u.mesh.position);
        if (d < closestDist) {
          closestDist = d;
          closestTarget = u;
        }
      }
    }

    // If no units, scan opposing buildings
    if (!closestTarget) {
      for (const b of this.game.buildings) {
        if (b.faction === opposingFaction && b.hp > 0) {
          const d = this.mesh.position.distanceTo(b.mesh.position);
          if (d < closestDist) {
            closestDist = d;
            closestTarget = b;
          }
        }
      }
    }

    this.currentTarget = closestTarget;
  }

  fireArrow(target) {
    if (!target || !this.game.combatVFX) return;

    // Spawn arrow from the elevated tower platform (Y ~ 7.5)
    const towerVirtualSource = {
      mesh: {
        position: this.mesh.position.clone().add(new THREE.Vector3(0, 6.0, 0))
      },
      faction: this.faction
    };

    this.game.combatVFX.spawnArrow(towerVirtualSource, target, this.attackDamage);
  }
}
