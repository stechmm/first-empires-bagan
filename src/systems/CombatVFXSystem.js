import * as THREE from 'three';

export class CombatVFXSystem {
  constructor(game) {
    this.game = game;

    this.activeArrows = [];
    this.activeShockwaves = [];
    this.activeSlashArcs = [];
    this.activeParticles = [];

    // Reusable Materials & Geometries for efficiency
    this.initSharedAssets();
  }

  initSharedAssets() {
    // Arrow Shaft & Head
    this.shaftGeo = new THREE.CylinderGeometry(0.03, 0.03, 1.1, 5);
    this.shaftMat = new THREE.MeshBasicMaterial({ color: 0x5d4037 });

    this.arrowHeadGeo = new THREE.ConeGeometry(0.08, 0.25, 5);
    this.arrowHeadMat = new THREE.MeshBasicMaterial({ color: 0xd5d8dc });

    this.fletchGeo = new THREE.PlaneGeometry(0.12, 0.2);
    this.fletchMat = new THREE.MeshBasicMaterial({ color: 0xfdfefe, side: THREE.DoubleSide });

    // Shockwave Material
    this.shockwaveGeo = new THREE.RingGeometry(0.8, 1.35, 32);
    this.shockwaveGeo.rotateX(-Math.PI / 2);

    // Slash Arc Material
    this.slashGeo = new THREE.RingGeometry(1.2, 1.7, 24, 1, 0, Math.PI * 0.75);
    this.slashGeo.rotateX(-Math.PI / 2);
    this.slashMat = new THREE.MeshBasicMaterial({
      color: 0xf9e79f,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.95
    });

    // Spark Particle
    this.sparkGeo = new THREE.PlaneGeometry(0.12, 0.12);
    this.sparkMat = new THREE.MeshBasicMaterial({
      color: 0xf39c12,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 1.0
    });
  }

  // ========================================================
  // 1. ARCHER FLYING ARROWS
  // ========================================================
  spawnArrow(sourceUnit, targetEntity, damage) {
    if (!sourceUnit || !targetEntity) return;

    const arrowGroup = new THREE.Group();

    // Fire Arrow Tech Check
    const isFireArrow = !!(this.game.techTree && this.game.techTree.isResearched('fire_arrows') && sourceUnit.faction === 'player');

    // Assemble Arrow
    const shaft = new THREE.Mesh(this.shaftGeo, this.shaftMat);
    shaft.rotation.x = Math.PI / 2;
    arrowGroup.add(shaft);

    const headMat = isFireArrow ? new THREE.MeshBasicMaterial({ color: 0xff3300 }) : this.arrowHeadMat;
    const head = new THREE.Mesh(this.arrowHeadGeo, headMat);
    head.rotation.x = Math.PI / 2;
    head.position.z = 0.65;
    arrowGroup.add(head);

    if (isFireArrow) {
      const flameMesh = new THREE.Mesh(new THREE.SphereGeometry(0.16, 6, 6), new THREE.MeshBasicMaterial({ color: 0xffa500 }));
      flameMesh.position.z = 0.72;
      arrowGroup.add(flameMesh);
    }

    const fletch1 = new THREE.Mesh(this.fletchGeo, this.fletchMat);
    fletch1.position.z = -0.5;
    arrowGroup.add(fletch1);

    const fletch2 = new THREE.Mesh(this.fletchGeo, this.fletchMat);
    fletch2.position.z = -0.5;
    fletch2.rotation.z = Math.PI / 2;
    arrowGroup.add(fletch2);

    // Initial Coordinates
    const startPos = sourceUnit.mesh.position.clone().add(new THREE.Vector3(0, 1.5, 0));
    const targetOffset = targetEntity.size ? targetEntity.size * 0.3 : 0.8;
    const endPos = targetEntity.mesh.position.clone().add(new THREE.Vector3(0, targetOffset, 0));

    arrowGroup.position.copy(startPos);
    this.game.scene.add(arrowGroup);

    // Distance & Flight Duration (Speed ~ 25 m/s)
    const dist = startPos.distanceTo(endPos);
    const duration = Math.max(0.25, Math.min(0.75, dist / 26.0));
    const arcHeight = Math.min(3.5, 0.8 + dist * 0.18);

    this.activeArrows.push({
      mesh: arrowGroup,
      startPos,
      endPos,
      targetEntity,
      damage,
      duration,
      elapsed: 0,
      arcHeight,
      isFireArrow
    });

    // Sound FX
    if (this.game.soundSystem) {
      this.game.soundSystem.playArrowWhoosh();
    }

    // Bow recoil animation on archer
    if (sourceUnit.lunge) {
      sourceUnit.lunge();
    }
  }

  // ========================================================
  // 2. ELEPHANT AOE STOMP & RADIAL SHOCKWAVE
  // ========================================================
  spawnElephantStomp(elephant, primaryTarget, damage) {
    if (!elephant) return;

    const origin = elephant.mesh.position.clone();

    // 1. Visual Shockwave Ring expanding on terrain
    const shockMat = new THREE.MeshBasicMaterial({
      color: 0xd4ac0d,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.95
    });
    const shockRing = new THREE.Mesh(this.shockwaveGeo, shockMat);
    shockRing.position.set(origin.x, 0.12, origin.z);
    this.game.scene.add(shockRing);

    this.activeShockwaves.push({
      mesh: shockRing,
      mat: shockMat,
      elapsed: 0,
      duration: 0.55,
      maxScale: 5.5
    });

    // 2. Radial Dust Particles
    this.spawnDustBurst(origin, 14);

    // Audio SFX
    if (this.game.soundSystem) {
      this.game.soundSystem.playElephantStomp();
      this.game.soundSystem.playElephantTrumpet();
    }

    // 3. Elephant Physical Stomp Motion
    const body = elephant.mesh;
    const origY = body.position.y;
    // Rear up
    body.position.y = origY + 0.45;
    body.rotation.x = -0.12;
    setTimeout(() => {
      body.position.y = origY;
      body.rotation.x = 0;
    }, 140);

    // 4. AoE Damage calculation: Damage primary target + all opposing units within radius 6.5
    const opposingFaction = elephant.faction === 'player' ? 'enemy' : 'player';
    const aoeRadius = 6.5;

    // Damage primary target first
    if (primaryTarget && primaryTarget.hp > 0) {
      primaryTarget.takeDamage(damage);
      this.applyHitFlash(primaryTarget);
    }

    // Splash damage to other nearby opposing units
    const potentialTargets = this.game.units.filter(u => u.faction === opposingFaction && u !== primaryTarget);
    potentialTargets.forEach(u => {
      if (origin.distanceTo(u.mesh.position) <= aoeRadius) {
        const splashDmg = Math.round(damage * 0.6); // 60% splash damage
        u.takeDamage(splashDmg);
        this.applyHitFlash(u);
      }
    });

    // Splash damage to nearby enemy buildings
    const opposingBuildings = this.game.buildings.filter(b => b.faction === opposingFaction && b !== primaryTarget);
    opposingBuildings.forEach(b => {
      if (origin.distanceTo(b.mesh.position) <= (aoeRadius + (b.size || 4) * 0.5)) {
        b.takeDamage(Math.round(damage * 0.7));
        this.applyHitFlash(b);
      }
    });

    // Floating text indicator
    this.game.hud.showFloatingText('💥 ခြေဆောင့်တိုက်ခိုက်မှု!', origin.clone().add(new THREE.Vector3(0, 3.2, 0)), '#f39c12');
  }

  // ========================================================
  // 3. SWORD SLASH ARCS & HIT SPARKS
  // ========================================================
  spawnSlashEffect(swordsman, target) {
    if (!swordsman || !target) return;

    // 1. Slash Arc
    const mat = this.slashMat.clone();
    const arc = new THREE.Mesh(this.slashGeo, mat);

    // Position arc slightly in front of swordsman at waist/chest height
    const forward = new THREE.Vector3(0, 0, 1.1).applyQuaternion(swordsman.mesh.quaternion);
    arc.position.copy(swordsman.mesh.position).add(forward);
    arc.position.y = 1.25;
    arc.quaternion.copy(swordsman.mesh.quaternion);
    arc.rotateY(-Math.PI / 3);

    this.game.scene.add(arc);

    this.activeSlashArcs.push({
      mesh: arc,
      mat: mat,
      elapsed: 0,
      duration: 0.16
    });

    // 2. Hit Sparks at contact point
    const impactPos = target.mesh.position.clone();
    impactPos.y = 1.3;
    this.spawnHitSparks(impactPos, 8);

    // 3. Hit Flash
    this.applyHitFlash(target);

    // Audio SFX
    if (this.game.soundSystem) {
      this.game.soundSystem.playSwordClash();
    }
  }

  spawnHitSparks(pos, count = 8) {
    for (let i = 0; i < count; i++) {
      const mat = this.sparkMat.clone();
      const spark = new THREE.Mesh(this.sparkGeo, mat);
      spark.position.copy(pos);

      // Random burst velocity in 3D
      const angle = Math.random() * Math.PI * 2;
      const speed = 3.5 + Math.random() * 4.0;
      const vel = new THREE.Vector3(
        Math.cos(angle) * speed,
        2.5 + Math.random() * 3.5,
        Math.sin(angle) * speed
      );

      this.game.scene.add(spark);

      this.activeParticles.push({
        mesh: spark,
        mat: mat,
        vel: vel,
        gravity: 12.0,
        elapsed: 0,
        duration: 0.28 + Math.random() * 0.12
      });
    }
  }

  spawnDustBurst(origin, count = 12) {
    const dustMat = new THREE.MeshBasicMaterial({
      color: 0xb7950b,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.85
    });

    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2 + (Math.random() - 0.5) * 0.4;
      const speed = 4.0 + Math.random() * 4.5;
      const mesh = new THREE.Mesh(this.sparkGeo, dustMat.clone());
      mesh.position.set(origin.x, 0.2, origin.z);
      mesh.scale.setScalar(2.0);

      this.game.scene.add(mesh);

      this.activeParticles.push({
        mesh: mesh,
        mat: mesh.material,
        vel: new THREE.Vector3(Math.cos(angle) * speed, 1.2 + Math.random() * 1.5, Math.sin(angle) * speed),
        gravity: 4.0,
        elapsed: 0,
        duration: 0.45
      });
    }
  }

  // ========================================================
  // 4. HIT FLASH EFFECT (RED FLASH ON DAMAGED UNITS)
  // ========================================================
  applyHitFlash(entity) {
    if (!entity || !entity.mesh) return;

    const originalColors = [];
    entity.mesh.traverse(child => {
      if (child.isMesh && child.material && child !== entity.hpFillMesh && child !== entity.selectionRing) {
        if (!child.userData.origColor) {
          child.userData.origColor = child.material.color.getHex();
        }
        child.material.color.setHex(0xff3838); // Bright red flash
      }
    });

    setTimeout(() => {
      entity.mesh.traverse(child => {
        if (child.isMesh && child.material && child.userData.origColor !== undefined) {
          child.material.color.setHex(child.userData.origColor);
        }
      });
    }, 90);
  }

  // ========================================================
  // FRAME UPDATE LOOP
  // ========================================================
  update(delta) {
    // 1. Update Flying Arrows
    for (let i = this.activeArrows.length - 1; i >= 0; i--) {
      const a = this.activeArrows[i];
      a.elapsed += delta;
      const t = Math.min(1.0, a.elapsed / a.duration);

      // Parabolic flight trajectory
      const currentPos = new THREE.Vector3().lerpVectors(a.startPos, a.endPos, t);
      currentPos.y += Math.sin(t * Math.PI) * a.arcHeight;

      // Next position for tangent orientation
      const nextT = Math.min(1.0, t + 0.05);
      const nextPos = new THREE.Vector3().lerpVectors(a.startPos, a.endPos, nextT);
      nextPos.y += Math.sin(nextT * Math.PI) * a.arcHeight;

      a.mesh.position.copy(currentPos);
      a.mesh.lookAt(nextPos);

      if (t >= 1.0) {
        // Arrow arrived at target
        if (a.targetEntity && a.targetEntity.hp > 0) {
          const isCrit = Math.random() < 0.15;
          let finalDmg = isCrit ? Math.round(a.damage * 1.6) : a.damage;

          // Fire Arrow Siege Bonus (+50% vs Buildings)
          if (a.isFireArrow && a.targetEntity.trainingQueue !== undefined) {
            finalDmg = Math.round(finalDmg * 1.5);
            this.game.hud.showFloatingText('🔥 မီးလောင်ကျွမ်းခြင်း!', a.endPos, '#e67e22');
          }

          a.targetEntity.takeDamage(finalDmg, null, isCrit);
          this.spawnHitSparks(a.endPos, a.isFireArrow ? 14 : (isCrit ? 10 : 5));
          this.applyHitFlash(a.targetEntity);
          if (this.game.soundSystem) {
            this.game.soundSystem.playArrowHit();
          }
        }
        this.game.scene.remove(a.mesh);
        this.activeArrows.splice(i, 1);
      }
    }

    // 2. Update Expanding Shockwaves
    for (let i = this.activeShockwaves.length - 1; i >= 0; i--) {
      const s = this.activeShockwaves[i];
      s.elapsed += delta;
      const t = Math.min(1.0, s.elapsed / s.duration);

      const scale = 1.0 + t * (s.maxScale - 1.0);
      s.mesh.scale.set(scale, scale, 1);
      s.mat.opacity = (1.0 - t) * 0.9;

      if (t >= 1.0) {
        this.game.scene.remove(s.mesh);
        s.mat.dispose();
        this.activeShockwaves.splice(i, 1);
      }
    }

    // 3. Update Slash Arcs
    for (let i = this.activeSlashArcs.length - 1; i >= 0; i--) {
      const sl = this.activeSlashArcs[i];
      sl.elapsed += delta;
      const t = Math.min(1.0, sl.elapsed / sl.duration);

      sl.mesh.rotateY(delta * 8.0);
      sl.mat.opacity = (1.0 - t);

      if (t >= 1.0) {
        this.game.scene.remove(sl.mesh);
        sl.mat.dispose();
        this.activeSlashArcs.splice(i, 1);
      }
    }

    // 4. Update Particle Bursts (Sparks & Dust)
    for (let i = this.activeParticles.length - 1; i >= 0; i--) {
      const p = this.activeParticles[i];
      p.elapsed += delta;
      const t = Math.min(1.0, p.elapsed / p.duration);

      // Velocity & Gravity
      p.vel.y -= p.gravity * delta;
      p.mesh.position.addScaledVector(p.vel, delta);
      p.mat.opacity = 1.0 - t;

      if (t >= 1.0) {
        this.game.scene.remove(p.mesh);
        p.mat.dispose();
        this.activeParticles.splice(i, 1);
      }
    }
  }
}
