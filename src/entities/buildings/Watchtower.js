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

    if (!this.tier) this.tier = 1;
    this.buildMesh();
  }

  buildMesh() {
    if (!this.tier) this.tier = 1;
    if (this.tier === 2) this._buildTower2();
    else if (this.tier === 3) this._buildTower3();
    else this._buildTower1();
  }

  rebuildModel() {
    // Clear existing meshes (keep selection box, hp bar, rally flag, scaffold, constructionUI)
    const toKeep = [];
    this.mesh.children.forEach(c => {
      if (
        c === this.selectionBoxMesh ||
        c === this.hpBarGroup ||
        c === this.rallyFlagGroup ||
        c === this.scaffoldGroup ||
        c === this.constructionUIGroup
      ) {
        toKeep.push(c);
      }
    });
    this.mesh.children.length = 0;
    toKeep.forEach(c => this.mesh.add(c));
    this.buildMesh();
  }

  // ——— Tier 1: ပုဂံ ကင်းစင် — Original Watchtower ———
  _buildTower1() {
    const isEnemy = this.faction === 'enemy';
    const woodColor  = isEnemy ? 0x212f3d : 0x5d4037;
    const brickColor = isEnemy ? 0x34495e : 0x935116;
    const roofColor  = isEnemy ? 0x78281f : 0xa04000;
    const goldColor  = isEnemy ? 0x922b21 : 0xd4ac0d;

    const woodMat  = new THREE.MeshStandardMaterial({ color: woodColor, roughness: 0.85 });
    const brickMat = new THREE.MeshStandardMaterial({ color: brickColor, roughness: 0.9 });
    const roofMat  = new THREE.MeshStandardMaterial({ color: roofColor, roughness: 0.7 });
    const goldMat  = new THREE.MeshStandardMaterial({ color: goldColor, metalness: 0.5, roughness: 0.4 });

    // 1. Terracotta Brick Base Pedestal
    const baseGeo  = new THREE.BoxGeometry(3.2, 0.8, 3.2);
    const baseMesh = new THREE.Mesh(baseGeo, brickMat);
    baseMesh.position.y = 0.4;
    baseMesh.castShadow = true;
    baseMesh.receiveShadow = true;
    this.mesh.add(baseMesh);

    // 2. Four Heavy Teak Support Stilts
    const postGeo = new THREE.CylinderGeometry(0.18, 0.22, 6.2, 8);
    const postPositions = [[-1.1, -1.1], [1.1, -1.1], [-1.1, 1.1], [1.1, 1.1]];
    postPositions.forEach(([px, pz]) => {
      const post = new THREE.Mesh(postGeo, woodMat);
      post.position.set(px, 3.5, pz);
      post.castShadow = true;
      this.mesh.add(post);
    });

    // Cross Braces
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
    const deck    = new THREE.Mesh(deckGeo, woodMat);
    deck.position.y = 6.6;
    deck.castShadow = true;
    this.mesh.add(deck);

    // Balustrade Railings
    const railGeo = new THREE.BoxGeometry(3.3, 0.85, 0.12);
    const railN = new THREE.Mesh(railGeo, woodMat); railN.position.set(0, 7.1, -1.6); this.mesh.add(railN);
    const railS = new THREE.Mesh(railGeo, woodMat); railS.position.set(0, 7.1,  1.6); this.mesh.add(railS);
    const railGeoV = new THREE.BoxGeometry(3.3, 0.85, 0.12);
    const railW = new THREE.Mesh(railGeoV, woodMat); railW.rotation.y = Math.PI / 2; railW.position.set(-1.6, 7.1, 0); this.mesh.add(railW);
    const railE = new THREE.Mesh(railGeoV, woodMat); railE.rotation.y = Math.PI / 2; railE.position.set( 1.6, 7.1, 0); this.mesh.add(railE);

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
    const rt1 = new THREE.Mesh(new THREE.ConeGeometry(2.6, 1.2, 4), roofMat);
    rt1.position.y = 2.4; rt1.rotation.y = Math.PI / 4; rt1.castShadow = true;
    this.turretGroup.add(rt1);

    // Upper Roof Tier
    const rt2 = new THREE.Mesh(new THREE.ConeGeometry(1.7, 1.0, 4), roofMat);
    rt2.position.y = 3.2; rt2.rotation.y = Math.PI / 4; rt2.castShadow = true;
    this.turretGroup.add(rt2);

    // Golden Finial Spire
    const spire = new THREE.Mesh(new THREE.ConeGeometry(0.35, 1.2, 8), goldMat);
    spire.position.y = 4.1;
    this.turretGroup.add(spire);

    // Royal War Pennant Flag
    const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 2.0, 6), woodMat);
    pole.position.set(1.2, 2.8, -1.2);
    this.turretGroup.add(pole);

    const flagMat = new THREE.MeshStandardMaterial({ color: goldColor, side: THREE.DoubleSide });
    const flag = new THREE.Mesh(new THREE.PlaneGeometry(0.7, 0.45), flagMat);
    flag.position.set(1.55, 3.4, -1.2);
    this.turretGroup.add(flag);

    this.createHpBar(3.0, 0.28, 9.5);
  }

  // ——— Tier 2: ကျောက်ကင်းစင် — Stone Watchtower ———
  _buildTower2() {
    this.attackRange  = 22.0;
    this.attackDamage = 28;

    const isEnemy    = this.faction === 'enemy';
    const stoneColor = isEnemy ? 0x34495e : 0x7f8c8d;
    const woodColor  = isEnemy ? 0x212f3d : 0x5d4037;
    const roofColor  = isEnemy ? 0x78281f : 0xa04000;
    const goldColor  = isEnemy ? 0x922b21 : 0xd4ac0d;

    const stoneMat = new THREE.MeshStandardMaterial({ color: stoneColor, roughness: 0.9 });
    const woodMat  = new THREE.MeshStandardMaterial({ color: woodColor, roughness: 0.85 });
    const roofMat  = new THREE.MeshStandardMaterial({ color: roofColor, roughness: 0.7 });
    const goldMat  = new THREE.MeshStandardMaterial({ color: goldColor, metalness: 0.5, roughness: 0.4 });

    // Wider stone base (3.8 x 3.8 x 1.0)
    const base = new THREE.Mesh(new THREE.BoxGeometry(3.8, 1.0, 3.8), stoneMat);
    base.position.y = 0.5;
    base.castShadow = true;
    base.receiveShadow = true;
    this.mesh.add(base);

    // 6 support pillars
    const postGeo = new THREE.CylinderGeometry(0.2, 0.25, 6.5, 8);
    const pillarPos = [
      [-1.3, -1.3], [0, -1.3], [1.3, -1.3],
      [-1.3,  1.3], [0,  1.3], [1.3,  1.3]
    ];
    pillarPos.forEach(([px, pz]) => {
      const post = new THREE.Mesh(postGeo, woodMat);
      post.position.set(px, 4.25, pz);
      post.castShadow = true;
      this.mesh.add(post);
    });

    // Cross braces
    const braceGeo = new THREE.CylinderGeometry(0.08, 0.08, 3.6, 6);
    [[0, Math.PI / 4], [0, -Math.PI / 4]].forEach(([, rz]) => {
      const b = new THREE.Mesh(braceGeo, woodMat);
      b.position.set(0, 4.0, 0);
      b.rotation.z = rz;
      this.mesh.add(b);
    });

    // Wider deck (4.0 x 0.4)
    const deck = new THREE.Mesh(new THREE.BoxGeometry(4.0, 0.4, 4.0), woodMat);
    deck.position.y = 7.7;
    deck.castShadow = true;
    this.mesh.add(deck);

    // Railings
    const railGeo = new THREE.BoxGeometry(3.9, 0.9, 0.12);
    [[-1.9, 0], [1.9, 0]].forEach(([rz, ry]) => {
      const rN = new THREE.Mesh(railGeo, woodMat);
      rN.position.set(0, 8.25, rz); this.mesh.add(rN);
    });
    const railGeoV = new THREE.BoxGeometry(3.9, 0.9, 0.12);
    [[-1.9], [1.9]].forEach(([rx]) => {
      const r = new THREE.Mesh(railGeoV, woodMat);
      r.rotation.y = Math.PI / 2; r.position.set(rx, 8.25, 0); this.mesh.add(r);
    });

    this.turretGroup = new THREE.Group();
    this.turretGroup.position.set(0, 8.1, 0);
    this.mesh.add(this.turretGroup);

    // Roof posts for tier 2
    const rPostGeo = new THREE.CylinderGeometry(0.13, 0.13, 2.4, 8);
    [[-1.2, -1.2], [1.2, -1.2], [-1.2, 1.2], [1.2, 1.2]].forEach(([px, pz]) => {
      const rp = new THREE.Mesh(rPostGeo, woodMat);
      rp.position.set(px, 1.2, pz);
      this.turretGroup.add(rp);
    });

    // 3-tier roof
    [[2.9, 1.3, 2.5], [2.1, 1.1, 3.4], [1.3, 0.85, 4.2]].forEach(([r, h, y]) => {
      const c = new THREE.Mesh(new THREE.ConeGeometry(r, h, 4), roofMat);
      c.position.y = y; c.rotation.y = Math.PI / 4; c.castShadow = true;
      this.turretGroup.add(c);
    });

    // Golden spire
    const spire = new THREE.Mesh(new THREE.ConeGeometry(0.3, 1.1, 8), goldMat);
    spire.position.y = 5.1;
    this.turretGroup.add(spire);

    // Two flag poles with banners
    [[-1.3, -1.3], [1.3, -1.3]].forEach(([px, pz]) => {
      const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 2.2, 6), woodMat);
      pole.position.set(px, 3.0, pz);
      this.turretGroup.add(pole);
      const flagMat = new THREE.MeshStandardMaterial({ color: goldColor, side: THREE.DoubleSide });
      const flag = new THREE.Mesh(new THREE.PlaneGeometry(0.7, 0.45), flagMat);
      flag.position.set(px + 0.35, 3.6, pz);
      this.turretGroup.add(flag);
    });

    this.createHpBar(3.5, 0.28, 11.0);
  }

  // ——— Tier 3: နန်းကင်းစင်တော် — Royal Watch Fortress ———
  _buildTower3() {
    this.attackRange  = 28.0;
    this.attackDamage = 38;

    const isEnemy   = this.faction === 'enemy';
    const stoneCol  = isEnemy ? 0x34495e : 0x7f8c8d;
    const stoneDark = isEnemy ? 0x212f3d : 0x626567;
    const goldCol   = isEnemy ? 0x922b21 : 0xd4ac0d;
    const roofCol   = isEnemy ? 0x78281f : 0xa04000;
    const woodCol   = isEnemy ? 0x1a2530 : 0x4e342e;
    const fireCol   = 0xff6600;

    const stoneMat  = new THREE.MeshStandardMaterial({ color: stoneCol, roughness: 0.9 });
    const stoneDark2= new THREE.MeshStandardMaterial({ color: stoneDark, roughness: 0.95 });
    const goldMat   = new THREE.MeshStandardMaterial({ color: goldCol, metalness: 0.65, roughness: 0.3 });
    const roofMat   = new THREE.MeshStandardMaterial({ color: roofCol, roughness: 0.7 });
    const woodMat   = new THREE.MeshStandardMaterial({ color: woodCol, roughness: 0.85 });
    const brazierMat= new THREE.MeshStandardMaterial({ color: fireCol, emissive: fireCol, emissiveIntensity: 1.0, roughness: 0.3 });

    // Heavy stone tower body (3.0 x 8.0 x 3.0)
    const tower = new THREE.Mesh(new THREE.BoxGeometry(3.0, 8.0, 3.0), stoneMat);
    tower.position.y = 4.0;
    tower.castShadow = true;
    tower.receiveShadow = true;
    this.mesh.add(tower);

    // Stone base platform
    const base = new THREE.Mesh(new THREE.BoxGeometry(4.0, 0.6, 4.0), stoneDark2);
    base.position.y = 0.3;
    base.castShadow = true;
    this.mesh.add(base);

    // Arrow slit windows (tall thin slots on each wall face)
    const slitGeo = new THREE.BoxGeometry(0.25, 1.0, 0.1);
    const slitMat = new THREE.MeshStandardMaterial({ color: 0x1a252f, roughness: 0.5 });
    [[0, 3.5, 1.52], [0, 5.5, 1.52],
     [0, 3.5, -1.52], [0, 5.5, -1.52],
     [1.52, 3.5, 0], [1.52, 5.5, 0],
     [-1.52, 3.5, 0], [-1.52, 5.5, 0]].forEach(([x, y, z]) => {
      const slit = new THREE.Mesh(slitGeo, slitMat);
      if (z === 0) slit.rotation.y = Math.PI / 2;
      slit.position.set(x, y, z);
      this.mesh.add(slit);
    });

    // Battlement crenellations on top (alternating raised blocks)
    const merlonMat = stoneDark2;
    for (let side = 0; side < 4; side++) {
      for (let i = -1; i <= 1; i++) {
        const merlon = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.6, 0.4), merlonMat);
        const angle = side * Math.PI / 2;
        const r = 1.5;
        merlon.position.set(
          Math.sin(angle) * r + Math.cos(angle) * i * 0.75,
          8.3,
          Math.cos(angle) * r - Math.sin(angle) * i * 0.75
        );
        merlon.castShadow = true;
        this.mesh.add(merlon);
      }
    }

    // Walkway/top deck
    const topDeck = new THREE.Mesh(new THREE.BoxGeometry(3.4, 0.25, 3.4), stoneDark2);
    topDeck.position.y = 8.12;
    this.mesh.add(topDeck);

    // Roof group (turret)
    this.turretGroup = new THREE.Group();
    this.turretGroup.position.set(0, 8.25, 0);
    this.mesh.add(this.turretGroup);

    // Large ornate roof with golden spire
    const r1 = new THREE.Mesh(new THREE.ConeGeometry(2.6, 1.4, 4), roofMat);
    r1.position.y = 1.5; r1.rotation.y = Math.PI / 4; r1.castShadow = true;
    this.turretGroup.add(r1);

    const r2 = new THREE.Mesh(new THREE.ConeGeometry(1.9, 1.1, 4), roofMat);
    r2.position.y = 2.5; r2.rotation.y = Math.PI / 4; r2.castShadow = true;
    this.turretGroup.add(r2);

    const r3 = new THREE.Mesh(new THREE.ConeGeometry(1.3, 0.9, 4), roofMat);
    r3.position.y = 3.3; r3.rotation.y = Math.PI / 4; r3.castShadow = true;
    this.turretGroup.add(r3);

    // Main golden spire
    const mainSpire = new THREE.Mesh(new THREE.ConeGeometry(0.3, 1.5, 8), goldMat);
    mainSpire.position.y = 4.1;
    this.turretGroup.add(mainSpire);
    const spireBall = new THREE.Mesh(new THREE.SphereGeometry(0.14, 8, 8), goldMat);
    spireBall.position.y = 4.9;
    this.turretGroup.add(spireBall);

    // 4 corner mini-spires
    [[-1.0, -1.0], [1.0, -1.0], [-1.0, 1.0], [1.0, 1.0]].forEach(([px, pz]) => {
      const ms = new THREE.Mesh(new THREE.ConeGeometry(0.14, 0.7, 6), goldMat);
      ms.position.set(px, 1.6, pz);
      this.turretGroup.add(ms);
    });

    // 4 flag poles with colored banners
    [[-1.3, -1.3], [1.3, -1.3], [-1.3, 1.3], [1.3, 1.3]].forEach(([px, pz], idx) => {
      const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 2.5, 6), woodMat);
      pole.position.set(px, 2.5, pz);
      this.turretGroup.add(pole);
      const bannerColors = [0xd4ac0d, 0x922b21, 0xa04000, 0x7f8c8d];
      const fMat = new THREE.MeshStandardMaterial({ color: bannerColors[idx], side: THREE.DoubleSide });
      const banner = new THREE.Mesh(new THREE.PlaneGeometry(0.65, 0.42), fMat);
      banner.position.set(px + 0.33, 3.2, pz);
      this.turretGroup.add(banner);
    });

    // Searchlight-like brazier at top (emissive orange sphere)
    const brazierBase = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.28, 0.3, 8), stoneMat);
    brazierBase.position.y = 1.0;
    this.turretGroup.add(brazierBase);
    const brazier = new THREE.Mesh(new THREE.SphereGeometry(0.22, 10, 10), brazierMat);
    brazier.position.y = 1.3;
    this.turretGroup.add(brazier);

    this.createHpBar(3.5, 0.28, 13.0);
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
    let closestDist   = this.attackRange;

    // Scan opposing units first (higher threat)
    for (const u of this.game.units) {
      if (u.faction === opposingFaction && u.hp > 0) {
        const d = this.mesh.position.distanceTo(u.mesh.position);
        if (d < closestDist) { closestDist = d; closestTarget = u; }
      }
    }

    // If no units, scan opposing buildings
    if (!closestTarget) {
      for (const b of this.game.buildings) {
        if (b.faction === opposingFaction && b.hp > 0) {
          const d = this.mesh.position.distanceTo(b.mesh.position);
          if (d < closestDist) { closestDist = d; closestTarget = b; }
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
