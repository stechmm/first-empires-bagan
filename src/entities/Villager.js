import * as THREE from 'three';
import { Unit } from './Unit.js';

export class Villager extends Unit {
  constructor(game, options = {}) {
    super(game, {
      ...options,
      name: 'လုပ်သား/လယ်သမား (Villager)',
      type: 'villager',
      hp: 75,
      speed: 4.6,
      damage: 8,
      range: 1.8,
      cooldown: 1.2
    });

    // Gathering & Economy state
    this.state = 'idle'; // 'idle', 'moving_to_resource', 'gathering', 'returning_to_base'
    this.targetResource = null;
    this.carrying = { type: null, amount: 0, maxCapacity: 20 };
    this.gatherRate = 5; // resources per tick
    this.gatherTimer = 0;
    this.gatherInterval = 1.0; // seconds per harvest strike

    this.createVillagerModel();
  }

  createVillagerModel() {
    const skinMat = new THREE.MeshStandardMaterial({ color: 0xd4a373, roughness: 0.75 });
    const clothMat = new THREE.MeshStandardMaterial({ color: 0x8d6e63 }); // Brown rustic cloth
    const hatMat = new THREE.MeshStandardMaterial({ color: 0xd4ac0d, roughness: 0.9 }); // Bamboo Straw Khamauk Hat
    const toolMat = new THREE.MeshStandardMaterial({ color: 0x7f8c8d, metalness: 0.7, roughness: 0.3 });
    const woodMat = new THREE.MeshStandardMaterial({ color: 0x5d4037 });

    // 1. Body Root Group
    this.bodyGroup = new THREE.Group();
    this.mesh.add(this.bodyGroup);

    // Torso / Body
    const torsoGeo = new THREE.BoxGeometry(0.5, 0.7, 0.35);
    this.torsoMesh = new THREE.Mesh(torsoGeo, clothMat);
    this.torsoMesh.position.y = 0.95;
    this.torsoMesh.castShadow = true;
    this.bodyGroup.add(this.torsoMesh);

    // Head
    this.headGroup = new THREE.Group();
    this.headGroup.position.set(0, 1.45, 0);

    const headGeo = new THREE.SphereGeometry(0.22, 8, 8);
    const head = new THREE.Mesh(headGeo, skinMat);
    this.headGroup.add(head);

    // Traditional Myanmar Conical Straw Hat (ခမောက်)
    const hatGeo = new THREE.ConeGeometry(0.55, 0.28, 12);
    const hat = new THREE.Mesh(hatGeo, hatMat);
    hat.position.y = 0.17;
    this.headGroup.add(hat);

    this.bodyGroup.add(this.headGroup);

    // 2. Legs with Hip Pivots (y = 0.6)
    const legGeo = new THREE.CylinderGeometry(0.1, 0.1, 0.6, 6);
    legGeo.translate(0, -0.3, 0);

    this.leftLegPivot = new THREE.Group();
    this.leftLegPivot.position.set(0.14, 0.6, 0);
    const leftLegMesh = new THREE.Mesh(legGeo, clothMat);
    this.leftLegPivot.add(leftLegMesh);
    this.mesh.add(this.leftLegPivot);

    this.rightLegPivot = new THREE.Group();
    this.rightLegPivot.position.set(-0.14, 0.6, 0);
    const rightLegMesh = new THREE.Mesh(legGeo, clothMat);
    this.rightLegPivot.add(rightLegMesh);
    this.mesh.add(this.rightLegPivot);

    // 3. Arms with Shoulder Pivots (y = 1.2)
    const armGeo = new THREE.CylinderGeometry(0.08, 0.08, 0.55, 6);
    armGeo.translate(0, -0.28, 0);

    this.leftArmPivot = new THREE.Group();
    this.leftArmPivot.position.set(-0.35, 1.2, 0);
    const leftArmMesh = new THREE.Mesh(armGeo, skinMat);
    this.leftArmPivot.add(leftArmMesh);
    this.bodyGroup.add(this.leftArmPivot);

    this.rightArmPivot = new THREE.Group();
    this.rightArmPivot.position.set(0.35, 1.2, 0);
    const rightArmMesh = new THREE.Mesh(armGeo, skinMat);
    this.rightArmPivot.add(rightArmMesh);

    // Multi-purpose Harvesting Tool (Sickle / Pickaxe / Hoe)
    this.toolGroup = new THREE.Group();
    this.toolGroup.position.set(0, -0.45, 0.1);

    const handleGeo = new THREE.CylinderGeometry(0.035, 0.035, 0.9, 6);
    const handle = new THREE.Mesh(handleGeo, woodMat);
    handle.position.y = 0.1;
    this.toolGroup.add(handle);

    const bladeGeo = new THREE.BoxGeometry(0.35, 0.1, 0.04);
    const blade = new THREE.Mesh(bladeGeo, toolMat);
    blade.position.set(0.15, 0.45, 0);
    blade.rotation.z = Math.PI / 4;
    this.toolGroup.add(blade);

    this.toolGroup.rotation.x = Math.PI / 3;
    this.rightArmPivot.add(this.toolGroup);
    this.bodyGroup.add(this.rightArmPivot);

    // 4. Resource Carrying Basket / Sack on Back
    const sackGeo = new THREE.BoxGeometry(0.42, 0.55, 0.38);
    this.sackMat = new THREE.MeshStandardMaterial({ color: 0x935116, roughness: 0.9 });
    this.sack = new THREE.Mesh(sackGeo, this.sackMat);
    this.sack.position.set(0, 0.98, -0.32);
    this.sack.visible = false;
    this.bodyGroup.add(this.sack);

    // HP Bar
    this.createHpBar(1.1, 0.14, 2.0);
  }

  assignGather(resourceNode) {
    this.targetResource = resourceNode;
    this.targetBuilding = null;
    this.state = 'moving_to_resource';
    this.targetPos = new THREE.Vector3(resourceNode.mesh.position.x, 0, resourceNode.mesh.position.z);
    this.targetEntity = null;
  }

  assignBuild(building) {
    this.targetBuilding = building;
    this.targetResource = null;
    this.targetEntity = null;
    this.state = 'moving_to_build';
    this.targetPos = new THREE.Vector3(building.mesh.position.x, 0, building.mesh.position.z);
    this.buildTimer = 0;
  }

  moveTo(point) {
    super.moveTo(point);
    this.state = 'idle';
    this.targetResource = null;
    this.targetBuilding = null;
  }

  findDropoffBuilding() {
    let closest = null;
    let minDist = Infinity;
    for (const b of this.game.buildings) {
      if (b.type === 'palace' || b.type === 'granary') {
        const d = this.mesh.position.distanceTo(b.mesh.position);
        if (d < minDist) {
          minDist = d;
          closest = b;
        }
      }
    }
    return closest;
  }

  depositResources() {
    if (this.carrying.amount > 0 && this.carrying.type) {
      this.game.economySystem.addResource(this.carrying.type, this.carrying.amount);

      this.game.hud.showFloatingText(
        `+${this.carrying.amount} ${this.getResourceIcon(this.carrying.type)}`,
        this.mesh.position
      );

      if (this.game.soundSystem) {
        this.game.soundSystem.playHarvestChime();
      }

      this.carrying.amount = 0;
      this.carrying.type = null;
      this.sack.visible = false;
    }
  }

  getResourceIcon(type) {
    switch (type) {
      case 'food': return '🌾';
      case 'wood': return '🪵';
      case 'stone': return '🧱';
      case 'gold': return '🪙';
      default: return '📦';
    }
  }

  update(delta) {
    super.update(delta);

    // Automated Gathering Loop
    if (this.state === 'moving_to_resource') {
      if (!this.targetResource || this.targetResource.amount <= 0) {
        this.state = 'idle';
        this.targetPos = null;
        return;
      }

      const dist = this.mesh.position.distanceTo(this.targetResource.mesh.position);
      if (dist <= 2.6) {
        this.state = 'gathering';
        this.targetPos = null;
        this.mesh.lookAt(this.targetResource.mesh.position.x, this.mesh.position.y, this.targetResource.mesh.position.z);
      }
    } else if (this.state === 'gathering') {
      if (!this.targetResource || this.targetResource.amount <= 0) {
        if (this.carrying.amount > 0) {
          this.returnToBase();
        } else {
          this.state = 'idle';
        }
        return;
      }

      // Gathering cycle logic
      this.gatherTimer += delta;
      if (this.gatherTimer >= this.gatherInterval) {
        this.gatherTimer = 0;
        const harvested = this.targetResource.harvest(this.gatherRate);
        this.carrying.type = this.targetResource.resourceType;
        this.carrying.amount += harvested;

        // Authentic procedural sound FX per resource type
        if (this.game.soundSystem) {
          if (this.carrying.type === 'wood') {
            this.game.soundSystem.playWoodChop();
          } else if (this.carrying.type === 'stone') {
            this.game.soundSystem.playStoneMine();
          } else if (this.carrying.type === 'gold') {
            this.game.soundSystem.playGoldMine();
          } else if (this.carrying.type === 'food') {
            this.game.soundSystem.playCropHarvest();
          }
        }

        // Show backpack
        this.sack.visible = true;
        const colors = { gold: 0xf1c40f, stone: 0x95a5a6, wood: 0x5d4037, food: 0xd4ac0d };
        this.sackMat.color.setHex(colors[this.carrying.type] || 0x935116);

        if (this.carrying.amount >= this.carrying.maxCapacity || this.targetResource.amount <= 0) {
          this.returnToBase();
        }
      }
    } else if (this.state === 'returning_to_base') {
      const dropoff = this.findDropoffBuilding();
      if (!dropoff) {
        this.state = 'idle';
        return;
      }

      const dist = this.mesh.position.distanceTo(dropoff.mesh.position);
      if (dist > 3.5) {
        this.moveTowards(dropoff.mesh.position, delta);
        this.isMoving = true;
      } else {
        this.depositResources();
        if (this.targetResource && this.targetResource.amount > 0) {
          this.assignGather(this.targetResource);
        } else {
          this.state = 'idle';
        }
      }
    } else if (this.state === 'moving_to_build') {
      if (!this.targetBuilding || !this.targetBuilding.underConstruction) {
        this.state = 'idle';
        this.targetPos = null;
        this.targetBuilding = null;
        return;
      }

      const dist = this.mesh.position.distanceTo(this.targetBuilding.mesh.position);
      const stopDist = Math.max(2.0, (this.targetBuilding.size || 3) * 0.5 + 0.9);
      if (dist <= stopDist) {
        this.state = 'building';
        this.targetPos = null;
        this.isMoving = false;
        this.mesh.lookAt(this.targetBuilding.mesh.position.x, this.mesh.position.y, this.targetBuilding.mesh.position.z);
      }
    } else if (this.state === 'building') {
      if (!this.targetBuilding || !this.targetBuilding.underConstruction) {
        this.state = 'idle';
        this.targetBuilding = null;
        return;
      }

      this.mesh.lookAt(this.targetBuilding.mesh.position.x, this.mesh.position.y, this.targetBuilding.mesh.position.z);

      this.buildTimer = (this.buildTimer || 0) + delta;
      const buildInterval = 0.55;

      if (this.buildTimer >= buildInterval) {
        this.buildTimer = 0;

        if (this.game.soundSystem && this.game.soundSystem.playHammer) {
          this.game.soundSystem.playHammer();
        }

        if (this.game.combatVFX && this.game.combatVFX.spawnSparks) {
          const sparkPos = new THREE.Vector3(
            this.mesh.position.x + (this.targetBuilding.mesh.position.x - this.mesh.position.x) * 0.45,
            0.9,
            this.mesh.position.z + (this.targetBuilding.mesh.position.z - this.mesh.position.z) * 0.45
          );
          this.game.combatVFX.spawnSparks(sparkPos);
        }

        const buildRate = buildInterval / (this.targetBuilding.constructionDuration || 6.0);
        this.targetBuilding.addBuildProgress(buildRate);

        if (!this.targetBuilding.underConstruction) {
          this.state = 'idle';
          this.targetBuilding = null;
        }
      }
    }
  }

  updateProceduralAnimation(delta) {
    if (!this.bodyGroup || !this.leftLegPivot || !this.rightLegPivot) return;

    if (this.state === 'gathering') {
      // Powerful Rhythmic Chopping/Mining Strike Animation
      const strikeCycle = (this.gatherTimer / this.gatherInterval) * Math.PI * 2;
      const strikeProgress = (this.gatherTimer / this.gatherInterval);

      if (strikeProgress < 0.6) {
        // High Wind-Up
        const t = strikeProgress / 0.6;
        this.rightArmPivot.rotation.x = -1.6 * t;
        this.rightArmPivot.rotation.z = 0.3 * t;
        this.bodyGroup.rotation.x = -0.15 * t; // Arch spine backward
      } else {
        // Slam Down Strike
        const t = (strikeProgress - 0.6) / 0.4;
        this.rightArmPivot.rotation.x = -1.6 + 2.5 * t;
        this.rightArmPivot.rotation.z = 0.3 - 0.4 * t;
        this.bodyGroup.rotation.x = 0.25 * Math.sin(t * Math.PI); // Spine flex forward
      }

      // Stable harvesting footing
      this.leftLegPivot.rotation.x = 0.2;
      this.rightLegPivot.rotation.x = -0.2;
      this.leftArmPivot.rotation.x = 0.3;
    } else if (this.state === 'building') {
      // Powerful Construction Hammering Animation
      const strikeProgress = ((this.buildTimer || 0) / 0.55);
      if (strikeProgress < 0.5) {
        const t = strikeProgress / 0.5;
        this.rightArmPivot.rotation.x = -1.75 * t;
        this.rightArmPivot.rotation.z = 0.25 * t;
        this.bodyGroup.rotation.x = -0.15 * t;
      } else {
        const t = (strikeProgress - 0.5) / 0.5;
        this.rightArmPivot.rotation.x = -1.75 + 2.65 * t;
        this.rightArmPivot.rotation.z = 0.25 - 0.35 * t;
        this.bodyGroup.rotation.x = 0.22 * Math.sin(t * Math.PI);
      }
      this.leftLegPivot.rotation.x = 0.2;
      this.rightLegPivot.rotation.x = -0.2;
      this.leftArmPivot.rotation.x = 0.25;
    } else if (this.isMoving) {
      // Locomotion (with extra forward lean if carrying heavy sack)
      const walkSpeed = this.speed * 2.5;
      const walkCycle = this.animTime * walkSpeed;
      const legSwing = Math.sin(walkCycle) * 0.65;

      this.leftLegPivot.rotation.x = legSwing;
      this.rightLegPivot.rotation.x = -legSwing;

      this.leftArmPivot.rotation.x = -legSwing * 0.7;
      this.rightArmPivot.rotation.x = legSwing * 0.6;

      const isLoaded = (this.carrying.amount > 0);
      this.bodyGroup.position.y = Math.abs(Math.sin(walkCycle)) * 0.07;
      this.bodyGroup.rotation.x = isLoaded ? 0.22 : 0.12; // Extra forward lean when loaded
      this.bodyGroup.rotation.z = Math.sin(walkCycle) * 0.05;
      this.headGroup.rotation.x = isLoaded ? -0.12 : -0.06;
    } else {
      // Idle Farmer Stance
      this.leftLegPivot.rotation.x = THREE.MathUtils.lerp(this.leftLegPivot.rotation.x, 0, 0.15);
      this.rightLegPivot.rotation.x = THREE.MathUtils.lerp(this.rightLegPivot.rotation.x, 0, 0.15);

      const breath = Math.sin(this.animTime * 2.0);
      this.bodyGroup.position.y = breath * 0.015;
      this.bodyGroup.scale.set(1 + breath * 0.015, 1 + breath * 0.02, 1 + breath * 0.015);

      this.bodyGroup.rotation.x = THREE.MathUtils.lerp(this.bodyGroup.rotation.x, 0, 0.1);
      this.bodyGroup.rotation.z = THREE.MathUtils.lerp(this.bodyGroup.rotation.z, 0, 0.1);

      this.rightArmPivot.rotation.x = THREE.MathUtils.lerp(this.rightArmPivot.rotation.x, 0.2, 0.1);
      this.leftArmPivot.rotation.x = THREE.MathUtils.lerp(this.leftArmPivot.rotation.x, 0.1, 0.1);
    }
  }

  returnToBase() {
    this.state = 'returning_to_base';
    this.targetPos = null;
  }
}
