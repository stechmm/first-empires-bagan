import * as THREE from 'three';

export class Unit {
  constructor(game, options = {}) {
    this.game = game;
    this.id = options.id || Math.random().toString(36).substr(2, 9);
    this.name = options.name || 'ယူနစ်';
    this.type = options.type || 'unit';
    this.faction = options.faction || 'player'; // 'player' or 'enemy'

    this.maxHp = options.hp || 100;
    this.hp = this.maxHp;
    this.speed = options.speed || 4.5;
    this.attackRange = options.range || 2.0;
    this.attackDamage = options.damage || 15;
    this.attackCooldown = options.cooldown || 1.2;
    this.attackTimer = 0;

    this.targetPos = null;
    this.targetEntity = null;
    this.isSelected = false;
    this.stance = 'aggressive'; // 'aggressive', 'defensive', 'stand_ground'

    // 3D Root Object
    this.mesh = new THREE.Group();
    this.mesh.position.set(options.x || 0, 0, options.z || 0);

    // Visual Selection Indicator Ring
    this.createSelectionRing();
    this.createHpBar();

    // Generous Click Hitbox for reliable raycast selection on PC and Touch
    const clickGeo = new THREE.CylinderGeometry(1.2, 1.2, 2.5, 8);
    const clickMat = new THREE.MeshBasicMaterial({ transparent: true, opacity: 0 });
    this.clickHitbox = new THREE.Mesh(clickGeo, clickMat);
    this.clickHitbox.position.y = 1.25;
    this.mesh.add(this.clickHitbox);

    this.game.scene.add(this.mesh);

    // Procedural Animation State
    this.animTime = Math.random() * 10;
    this.isMoving = false;
    this.isAttacking = false;
    this.attackAnimProgress = 0;
    this.attackAnimDuration = 0.35;
    this.attackAnimTimer = 0;
  }

  createSelectionRing() {
    const ringGeo = new THREE.RingGeometry(1.0, 1.15, 32);
    const ringMat = new THREE.MeshBasicMaterial({
      color: 0x2ecc71,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.8
    });
    this.selectionRing = new THREE.Mesh(ringGeo, ringMat);
    this.selectionRing.rotation.x = -Math.PI / 2;
    this.selectionRing.position.y = 0.05;
    this.selectionRing.visible = false;
    this.mesh.add(this.selectionRing);
  }

  createHpBar(width = 1.2, height = 0.15, yOffset = 2.2) {
    if (this.hpBarGroup) {
      this.mesh.remove(this.hpBarGroup);
    }
    this.hpBarWidth = width;
    this.hpBarGroup = new THREE.Group();
    this.hpBarGroup.position.y = yOffset;

    // Dark border/background
    const bgGeo = new THREE.PlaneGeometry(width + 0.08, height + 0.06);
    const bgMat = new THREE.MeshBasicMaterial({ color: 0x111111, side: THREE.DoubleSide });
    const bg = new THREE.Mesh(bgGeo, bgMat);
    this.hpBarGroup.add(bg);

    // HP Fill bar
    const fillGeo = new THREE.PlaneGeometry(width, height);
    this.hpFillMat = new THREE.MeshBasicMaterial({
      color: this.faction === 'enemy' ? 0xe74c3c : 0x2ecc71,
      side: THREE.DoubleSide
    });
    this.hpFillMesh = new THREE.Mesh(fillGeo, this.hpFillMat);
    this.hpFillMesh.position.z = 0.01;
    this.hpBarGroup.add(this.hpFillMesh);

    this.mesh.add(this.hpBarGroup);
  }

  updateHpBar() {
    if (!this.hpFillMesh) return;
    const pct = Math.max(0, Math.min(1, this.hp / this.maxHp));
    this.hpFillMesh.scale.x = pct;
    this.hpFillMesh.position.x = -((1 - pct) * this.hpBarWidth) / 2;

    if (this.faction === 'player') {
      if (pct > 0.5) this.hpFillMat.color.setHex(0x2ecc71); // Green
      else if (pct > 0.25) this.hpFillMat.color.setHex(0xf39c12); // Yellow
      else this.hpFillMat.color.setHex(0xe74c3c); // Red
    }
  }

  setSelected(selected) {
    this.isSelected = selected;
    this.selectionRing.visible = selected;
  }

  moveTo(point) {
    this.targetPos = new THREE.Vector3(point.x, 0, point.z);
    this.targetEntity = null;
  }

  attackTarget(entity) {
    this.targetEntity = entity;
    this.targetPos = null;
  }

  takeDamage(amount, attacker = null, isCrit = false) {
    this.hp -= amount;
    this.updateHpBar();

    if (this.game.hud && this.game.hud.showFloatingText) {
      const textColor = this.faction === 'enemy' ? (isCrit ? '#ffd700' : '#ff4757') : '#ff7f50';
      const text = isCrit ? `💥 CRIT! -${Math.round(amount)}` : `-${Math.round(amount)}`;
      this.game.hud.showFloatingText(text, this.mesh.position, textColor, isCrit);
    }

    // Auto-retaliate if idle or without active target
    if (attacker && !this.targetEntity && this.hp > 0 && attacker.hp > 0 && attacker.faction !== this.faction) {
      if (this.stance !== 'stand_ground') {
        this.targetEntity = attacker;
      }
    }

    if (this.hp <= 0) {
      this.hp = 0;
      if (this.faction === 'enemy' && this.game.stats) {
        this.game.stats.enemiesKilled++;
      }
      this.die();
    }
    this.game.eventBus.emit('unit-hp-changed', this);
  }

  lunge() {
    // Quick forward procedural attack lunge and return
    const forward = new THREE.Vector3(0, 0, 0.4).applyQuaternion(this.mesh.quaternion);
    this.mesh.position.add(forward);
    setTimeout(() => {
      this.mesh.position.sub(forward);
    }, 120);
  }

  die() {
    this.game.scene.remove(this.mesh);
    this.game.removeUnit(this);
  }

  performAttack(target) {
    const isCrit = Math.random() < 0.16;
    const finalDmg = isCrit ? Math.round(this.attackDamage * 1.65) : this.attackDamage;

    target.takeDamage(finalDmg, this, isCrit);
    this.isAttacking = true;
    this.attackAnimTimer = 0;
    this.attackAnimProgress = 0;
    this.lunge();

    // Spawn slash arc and sparks for melee units
    if (this.game.combatVFX && this.type !== 'archer' && this.type !== 'elephant') {
      this.game.combatVFX.spawnSlashEffect(this, target);
      if (isCrit) {
        this.game.combatVFX.spawnHitSparks(target.mesh.position, 12);
      }
    }
  }

  scanForAggroTarget() {
    // Villagers don't auto-aggro (focus on gathering)
    if (this.type === 'villager' || this.state === 'gathering' || this.state === 'returning_to_base') return;

    // Already fighting a live target
    if (this.targetEntity && this.targetEntity.hp > 0) return;

    const opposingFaction = this.faction === 'player' ? 'enemy' : 'player';
    let aggroRange = 10.5;
    if (this.type === 'archer') aggroRange = 16.0;
    else if (this.type === 'cavalry') aggroRange = 13.5;
    else if (this.type === 'elephant') aggroRange = 11.5;

    let closestEnemy = null;
    let closestDist = aggroRange;

    // 1. Scan opposing units
    for (const u of this.game.units) {
      if (u.faction === opposingFaction && u.hp > 0) {
        const d = this.mesh.position.distanceTo(u.mesh.position);
        if (d < closestDist) {
          closestDist = d;
          closestEnemy = u;
        }
      }
    }

    // 2. Scan opposing buildings if no unit threat
    if (!closestEnemy) {
      for (const b of this.game.buildings) {
        if (b.faction === opposingFaction && b.hp > 0) {
          const d = this.mesh.position.distanceTo(b.mesh.position);
          if (d < closestDist) {
            closestDist = d;
            closestEnemy = b;
          }
        }
      }
    }

    if (closestEnemy) {
      this.targetEntity = closestEnemy;
    }
  }

  update(delta) {
    // Billboard HP bar towards camera
    if (this.hpBarGroup && this.game.camera) {
      this.hpBarGroup.quaternion.copy(this.game.camera.quaternion);
    }

    let moved = false;

    // Periodic tactical battlefield threat scanning
    this.aggroScanTimer = (this.aggroScanTimer || 0) + delta;
    if (this.aggroScanTimer >= 0.45) {
      this.aggroScanTimer = 0;
      this.scanForAggroTarget();
    }

    // Combat logic
    if (this.targetEntity) {
      if (this.targetEntity.hp <= 0) {
        this.targetEntity = null;
      } else {
        const targetRadius = (this.targetEntity.size ? this.targetEntity.size * 0.5 : 0);
        const dist = this.mesh.position.distanceTo(this.targetEntity.mesh.position);
        if (dist > (this.attackRange + targetRadius)) {
          // If in stand_ground stance, do not pursue
          if (this.stance !== 'stand_ground') {
            this.moveTowards(this.targetEntity.mesh.position, delta);
            moved = true;
          }
        } else {
          // In range, attack
          this.mesh.lookAt(this.targetEntity.mesh.position.x, this.mesh.position.y, this.targetEntity.mesh.position.z);
          this.attackTimer += delta;
          if (this.attackTimer >= this.attackCooldown) {
            this.attackTimer = 0;
            this.performAttack(this.targetEntity);
          }
        }
      }
    } else if (this.targetPos) {
      // Normal movement logic
      const dist = this.mesh.position.distanceTo(this.targetPos);
      if (dist > 0.2) {
        this.moveTowards(this.targetPos, delta);
        moved = true;
      } else {
        this.targetPos = null;
      }
    }

    this.isMoving = moved;

    // Advance attack animation progress if active
    if (this.isAttacking) {
      this.attackAnimTimer += delta;
      this.attackAnimProgress = Math.min(1.0, this.attackAnimTimer / this.attackAnimDuration);
      if (this.attackAnimProgress >= 1.0) {
        this.isAttacking = false;
        this.attackAnimProgress = 0;
      }
    }

    // Advance general animation time
    this.animTime += delta;

    // Update procedural animations
    this.updateProceduralAnimation(delta);
  }

  updateProceduralAnimation(delta) {
    // Overridden by subclasses with limbs and joints
  }

  moveTowards(dest, delta) {
    const dir = new THREE.Vector3().subVectors(dest, this.mesh.position);
    dir.y = 0;
    dir.normalize();

    // Rotate unit towards movement direction smoothly
    const targetAngle = Math.atan2(dir.x, dir.z);
    this.mesh.rotation.y = THREE.MathUtils.lerp(this.mesh.rotation.y, targetAngle, 0.2);

    const stepDist = this.speed * delta;
    const nextPos = this.mesh.position.clone().addScaledVector(dir, stepDist);

    // Barrier check: closed walls or gates
    let blocked = false;
    for (const b of this.game.buildings) {
      if ((b.type === 'wall' || (b.type === 'gate' && !b.isOpen)) && b.hp > 0) {
        const d = nextPos.distanceTo(b.mesh.position);
        const barrierDist = (b.size || 2.0) * 0.55;
        if (d < barrierDist) {
          // If hostile barrier, attack it to breach!
          if (this.faction !== b.faction && !this.targetEntity) {
            this.attackTarget(b);
          }
          blocked = true;
          break;
        }
      }
    }

    if (!blocked) {
      this.mesh.position.copy(nextPos);
    }
  }
}
