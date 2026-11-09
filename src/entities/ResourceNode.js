import * as THREE from 'three';

export class ResourceNode {
  constructor(game, options = {}) {
    this.game = game;
    this.id = options.id || Math.random().toString(36).substr(2, 9);
    this.resourceType = options.resourceType || 'gold'; // 'gold', 'stone', 'wood', 'food'
    this.amount = options.amount || 2500;
    this.maxAmount = this.amount;
    this.isSelected = false;

    this.mesh = new THREE.Group();
    this.mesh.position.set(options.x || 0, 0, options.z || 0);

    this.initNode();
    this.createSelectionRing();
    this.createFloatingLabel();

    this.game.scene.add(this.mesh);
  }

  initNode() {
    switch (this.resourceType) {
      case 'gold':
        this.name = 'ရွှေတွင်း (Gold Mine)';
        this.icon = '🪙';
        this.createGoldMineModel();
        break;
      case 'stone':
        this.name = 'ကျောက်ထုတ်စခန်း (Stone Quarry)';
        this.icon = '🧱';
        this.createStoneQuarryModel();
        break;
      case 'wood':
        this.name = 'ထင်း/သစ်တော (Timber Forest)';
        this.icon = '🪵';
        this.createTimberForestModel();
        break;
      case 'food':
        this.name = 'စပါးခင်း (Paddy Field)';
        this.icon = '🌾';
        this.createPaddyFieldModel();
        break;
    }
  }

  createGoldMineModel() {
    const rockMat = new THREE.MeshStandardMaterial({ color: 0x424949, roughness: 0.85 });
    const goldMat = new THREE.MeshStandardMaterial({ color: 0xf1c40f, metalness: 0.9, roughness: 0.2 });
    const woodMat = new THREE.MeshStandardMaterial({ color: 0x6e2c00, roughness: 0.8 });

    // Central Ore Mound
    const moundGeo = new THREE.DodecahedronGeometry(2.4, 1);
    const mound = new THREE.Mesh(moundGeo, rockMat);
    mound.position.y = 1.2;
    mound.scale.set(1.4, 0.8, 1.2);
    this.mesh.add(mound);

    // Sparkling Gold Nuggets protruding from rock
    for (let i = 0; i < 7; i++) {
      const nuggetGeo = new THREE.DodecahedronGeometry(0.45 + Math.random() * 0.3);
      const nugget = new THREE.Mesh(nuggetGeo, goldMat);
      const angle = (i / 7) * Math.PI * 2;
      nugget.position.set(Math.cos(angle) * 1.8, 0.8 + Math.random() * 1.2, Math.sin(angle) * 1.6);
      this.mesh.add(nugget);
    }

    // Wooden Mine Rig / Scaffold
    const postGeo = new THREE.CylinderGeometry(0.12, 0.12, 2.8, 6);
    const leftPost = new THREE.Mesh(postGeo, woodMat);
    leftPost.position.set(-1.2, 1.4, 1.6);
    this.mesh.add(leftPost);

    const rightPost = new THREE.Mesh(postGeo, woodMat);
    rightPost.position.set(1.2, 1.4, 1.6);
    this.mesh.add(rightPost);

    const beamGeo = new THREE.BoxGeometry(2.6, 0.2, 0.2);
    const beam = new THREE.Mesh(beamGeo, woodMat);
    beam.position.set(0, 2.7, 1.6);
    this.mesh.add(beam);
  }

  createStoneQuarryModel() {
    const graniteMat = new THREE.MeshStandardMaterial({ color: 0x7f8c8d, roughness: 0.9, flatShading: true });
    const cutStoneMat = new THREE.MeshStandardMaterial({ color: 0x95a5a6, roughness: 0.7 });

    // Large jagged boulders
    const b1Geo = new THREE.DodecahedronGeometry(2.0);
    const b1 = new THREE.Mesh(b1Geo, graniteMat);
    b1.position.set(-0.8, 1.1, -0.5);
    b1.rotation.set(0.4, 0.2, 0.1);
    this.mesh.add(b1);

    const b2Geo = new THREE.DodecahedronGeometry(1.6);
    const b2 = new THREE.Mesh(b2Geo, graniteMat);
    b2.position.set(1.2, 0.9, 0.6);
    this.mesh.add(b2);

    // Squared cut stone blocks (for building pagodas)
    for (let i = 0; i < 4; i++) {
      const blockGeo = new THREE.BoxGeometry(0.8, 0.5, 0.8);
      const block = new THREE.Mesh(blockGeo, cutStoneMat);
      block.position.set(-1.2 + i * 0.7, 0.25, 1.5);
      this.mesh.add(block);
    }
  }

  createTimberForestModel() {
    const woodMat = new THREE.MeshStandardMaterial({ color: 0x4e342e, roughness: 0.8 });
    const leafMat = new THREE.MeshStandardMaterial({ color: 0x145a32, roughness: 0.6 });

    // Cluster of 3 Teak & Palm Trees
    const treePositions = [[-1.2, -1.0], [1.3, -0.8], [0.2, 1.2]];
    treePositions.forEach(([x, z]) => {
      const trunkGeo = new THREE.CylinderGeometry(0.2, 0.35, 4.2, 6);
      const trunk = new THREE.Mesh(trunkGeo, woodMat);
      trunk.position.set(x, 2.1, z);
      this.mesh.add(trunk);

      const foliageGeo = new THREE.ConeGeometry(1.8, 2.4, 7);
      const foliage = new THREE.Mesh(foliageGeo, leafMat);
      foliage.position.set(x, 4.4, z);
      this.mesh.add(foliage);
    });

    // Stacked Timber Logs (သစ်တုံးပုံ)
    const logGeo = new THREE.CylinderGeometry(0.18, 0.18, 1.8, 6);
    logGeo.rotateZ(Math.PI / 2);
    const logMat = new THREE.MeshStandardMaterial({ color: 0x6e2c00 });

    const log1 = new THREE.Mesh(logGeo, logMat);
    log1.position.set(0, 0.2, 0);
    this.mesh.add(log1);

    const log2 = new THREE.Mesh(logGeo, logMat);
    log2.position.set(0, 0.2, 0.35);
    this.mesh.add(log2);

    const log3 = new THREE.Mesh(logGeo, logMat);
    log3.position.set(0, 0.5, 0.17);
    this.mesh.add(log3);
  }

  createPaddyFieldModel() {
    const paddyMat = new THREE.MeshStandardMaterial({ color: 0xd4ac0d, roughness: 0.8 }); // Golden rice
    const strawMat = new THREE.MeshStandardMaterial({ color: 0xf4d03f, roughness: 0.9 });

    // Terraced rice paddy plot
    const fieldGeo = new THREE.BoxGeometry(4.5, 0.3, 4.5);
    const field = new THREE.Mesh(fieldGeo, paddyMat);
    field.position.y = 0.15;
    this.mesh.add(field);

    // Traditional Bagan Haystack / Straw Dome (ကောက်ရိုးပုံ)
    const haystackGeo = new THREE.ConeGeometry(1.2, 1.8, 8);
    const haystack = new THREE.Mesh(haystackGeo, strawMat);
    haystack.position.set(1.2, 1.0, 1.2);
    this.mesh.add(haystack);
  }

  createSelectionRing() {
    const ringGeo = new THREE.RingGeometry(2.8, 3.1, 32);
    const ringMat = new THREE.MeshBasicMaterial({
      color: 0xf1c40f,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.8
    });
    this.selectionRing = new THREE.Mesh(ringGeo, ringMat);
    this.selectionRing.rotation.x = -Math.PI / 2;
    this.selectionRing.position.y = 0.08;
    this.selectionRing.visible = false;
    this.mesh.add(this.selectionRing);
  }

  createFloatingLabel() {
    // 3D Billboard Resource Amount Indicator
    this.labelGroup = new THREE.Group();
    this.labelGroup.position.y = 4.2;

    const bgGeo = new THREE.PlaneGeometry(2.4, 0.5);
    const bgMat = new THREE.MeshBasicMaterial({ color: 0x111111, side: THREE.DoubleSide, transparent: true, opacity: 0.85 });
    const bg = new THREE.Mesh(bgGeo, bgMat);
    this.labelGroup.add(bg);

    // Visual resource color stripe
    const colors = { gold: 0xf1c40f, stone: 0xbdc3c7, wood: 0x27ae60, food: 0xe67e22 };
    const barGeo = new THREE.PlaneGeometry(2.3, 0.12);
    const barMat = new THREE.MeshBasicMaterial({ color: colors[this.resourceType], side: THREE.DoubleSide });
    const bar = new THREE.Mesh(barGeo, barMat);
    bar.position.set(0, -0.15, 0.01);
    this.labelGroup.add(bar);

    this.mesh.add(this.labelGroup);
  }

  setSelected(selected) {
    this.isSelected = selected;
    this.selectionRing.visible = selected;
  }

  harvest(amount) {
    const gathered = Math.min(this.amount, amount);
    this.amount -= gathered;
    if (this.amount <= 0) {
      this.amount = 0;
      this.deplete();
    }
    return gathered;
  }

  deplete() {
    this.game.scene.remove(this.mesh);
    this.game.removeResourceNode(this);
  }

  update(delta) {
    if (this.labelGroup && this.game.camera) {
      this.labelGroup.quaternion.copy(this.game.camera.quaternion);
    }
  }
}
