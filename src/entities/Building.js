import * as THREE from 'three';
import { Villager } from './Villager.js';
import { Swordsman } from './Swordsman.js';
import { Archer } from './Archer.js';
import { Spearman } from './Spearman.js';
import { Cavalry } from './Cavalry.js';
import { WarElephant } from './WarElephant.js';
import { General } from './General.js';

export class Building {
  constructor(game, options = {}) {
    this.game = game;
    this.id = options.id || Math.random().toString(36).substr(2, 9);
    this.name = options.name || 'အဆောက်အအုံ';
    this.type = options.type || 'building';
    this.faction = options.faction || 'player';

    this.maxHp = options.hp || 800;
    this.hp = this.maxHp;
    this.size = options.size || 4; // Footprint grid size

    this.isSelected = false;

    // Unit Production Queue (Max 10)
    this.trainingQueue = [];
    this.maxQueue = 10;
    this.trainingTimer = 0;
    this.trainingDuration = 2.2; // 2.2s per unit

    const startX = options.x || 0;
    const startZ = options.z || 0;
    this.rallyPoint = new THREE.Vector3(startX, 0, startZ + (this.size / 2 + 5));
    this.rallyFlagGroup = null;

    // Construction Progress State
    this.underConstruction = options.underConstruction || false;
    this.buildProgress = this.underConstruction ? 0.05 : 1.0;
    this.constructionDuration = options.constructionDuration || 6.0;
    this.scaffoldGroup = null;
    this.constructionUIGroup = null;

    this.tier = options.tier || 1;
    this.maxTier = 3;
    this.defenseSlots = []; // array of attached defense towers
    this.maxDefenseSlots = 2; // most buildings get 2 defense slots

    this.mesh = new THREE.Group();
    this.mesh.position.set(startX, 0, startZ);

    this.createSelectionBox();
    this.createHpBar();
    if (['palace', 'barracks', 'stables', 'elephant_pen'].includes(this.type)) {
      this.createRallyFlag();
    }
    if (this.underConstruction) {
      this.createConstructionVisuals();
    }
    this.game.scene.add(this.mesh);
  }

  createConstructionVisuals() {
    // 1. Bamboo/Timber Scaffolding Framing the Footprint
    this.scaffoldGroup = new THREE.Group();
    const half = (this.size || 3) * 0.5 + 0.35;
    const height = 3.2;

    const woodMat = new THREE.MeshStandardMaterial({ color: 0x8d6e63, roughness: 0.9 });
    const poleGeo = new THREE.CylinderGeometry(0.07, 0.07, height, 6);

    const corners = [
      [-half, height / 2, -half],
      [half, height / 2, -half],
      [-half, height / 2, half],
      [half, height / 2, half]
    ];

    corners.forEach(p => {
      const pole = new THREE.Mesh(poleGeo, woodMat);
      pole.position.set(p[0], p[1], p[2]);
      this.scaffoldGroup.add(pole);
    });

    // Horizontal bamboo beams
    const barGeoX = new THREE.BoxGeometry(half * 2, 0.08, 0.08);
    const barGeoZ = new THREE.BoxGeometry(0.08, 0.08, half * 2);

    const bar1 = new THREE.Mesh(barGeoX, woodMat);
    bar1.position.set(0, height * 0.6, -half);
    this.scaffoldGroup.add(bar1);

    const bar2 = new THREE.Mesh(barGeoX, woodMat);
    bar2.position.set(0, height * 0.6, half);
    this.scaffoldGroup.add(bar2);

    const bar3 = new THREE.Mesh(barGeoZ, woodMat);
    bar3.position.set(-half, height * 0.6, 0);
    this.scaffoldGroup.add(bar3);

    const bar4 = new THREE.Mesh(barGeoZ, woodMat);
    bar4.position.set(half, height * 0.6, 0);
    this.scaffoldGroup.add(bar4);

    this.mesh.add(this.scaffoldGroup);

    // 2. 3D Floating Construction Loading Bar
    this.constructionUIGroup = new THREE.Group();
    this.constructionUIGroup.position.y = height + 1.4;

    const bgGeo = new THREE.PlaneGeometry(2.6, 0.36);
    const bgMat = new THREE.MeshBasicMaterial({ color: 0x140e0a, side: THREE.DoubleSide });
    const bg = new THREE.Mesh(bgGeo, bgMat);
    this.constructionUIGroup.add(bg);

    const fillGeo = new THREE.PlaneGeometry(2.5, 0.26);
    this.constructionFillMat = new THREE.MeshBasicMaterial({ color: 0xf39c12, side: THREE.DoubleSide });
    this.constructionFillMesh = new THREE.Mesh(fillGeo, this.constructionFillMat);
    this.constructionFillMesh.position.z = 0.02;
    this.constructionUIGroup.add(this.constructionFillMesh);

    // Hammer Icon Billboard Indicator
    const hammerCanvas = document.createElement('canvas');
    hammerCanvas.width = 64;
    hammerCanvas.height = 64;
    const hCtx = hammerCanvas.getContext('2d');
    hCtx.font = '40px sans-serif';
    hCtx.textAlign = 'center';
    hCtx.textBaseline = 'middle';
    hCtx.fillText('🔨', 32, 32);
    const hTex = new THREE.CanvasTexture(hammerCanvas);
    const hMat = new THREE.MeshBasicMaterial({ map: hTex, transparent: true, side: THREE.DoubleSide });
    const hMesh = new THREE.Mesh(new THREE.PlaneGeometry(0.5, 0.5), hMat);
    hMesh.position.set(-1.55, 0, 0.03);
    this.constructionUIGroup.add(hMesh);

    this.mesh.add(this.constructionUIGroup);
    this.updateConstructionUI();

    if (this.hpBarGroup) {
      this.hpBarGroup.visible = false;
    }
  }

  updateConstructionUI() {
    if (!this.constructionFillMesh) return;
    const pct = Math.max(0.04, Math.min(1.0, this.buildProgress));
    this.constructionFillMesh.scale.x = pct;
    this.constructionFillMesh.position.x = -((1.0 - pct) * 2.5) / 2;

    if (pct > 0.8) {
      this.constructionFillMat.color.setHex(0x2ecc71);
    } else if (pct > 0.4) {
      this.constructionFillMat.color.setHex(0xf1c40f);
    } else {
      this.constructionFillMat.color.setHex(0xe67e22);
    }
  }

  addBuildProgress(amount) {
    if (!this.underConstruction) return;
    this.buildProgress += amount;
    this.updateConstructionUI();

    if (this.buildProgress >= 1.0) {
      this.finishConstruction();
    }
  }

  finishConstruction() {
    this.underConstruction = false;
    this.buildProgress = 1.0;

    if (this.scaffoldGroup) {
      this.mesh.remove(this.scaffoldGroup);
      this.scaffoldGroup = null;
    }
    if (this.constructionUIGroup) {
      this.mesh.remove(this.constructionUIGroup);
      this.constructionUIGroup = null;
    }
    if (this.hpBarGroup) {
      this.hpBarGroup.visible = true;
    }

    if (this.type === 'house' && this.faction === 'player' && this.game.economySystem) {
      this.game.economySystem.resources.maxPopulation += 10;
      this.game.economySystem.updateUI();
      if (this.game.hud) {
        this.game.hud.showFloatingText('+10 👥 လူဦးရေ', this.mesh.position, '#2ecc71');
      }
    }

    if (this.faction === 'player') {
      if (this.game.hud) {
        this.game.hud.showFloatingText(`✨ ${this.name} တည်ဆောက်ပြီး!`, this.mesh.position, '#2ecc71');
      }
      if (this.game.soundSystem) {
        this.game.soundSystem.playHarvestChime();
      }
      if (this.game.placementSystem) {
        this.game.placementSystem.playPlacementEffect(this.mesh.position);
      }
      if (this.game.selectionSystem && this.game.hud) {
        this.game.hud.updateSelectionPanel({
          selectedUnits: this.game.selectionSystem.selectedUnits,
          selectedBuilding: this.game.selectionSystem.selectedBuilding,
          selectedResource: this.game.selectionSystem.selectedResource
        });
      }
    }
  }

  createRallyFlag() {
    this.rallyFlagGroup = new THREE.Group();
    this.rallyFlagGroup.position.copy(this.rallyPoint);

    // Golden Ground Base Ring
    const ringGeo = new THREE.RingGeometry(0.7, 0.95, 24);
    ringGeo.rotateX(-Math.PI / 2);
    const ringMat = new THREE.MeshBasicMaterial({ color: 0xf1c40f, side: THREE.DoubleSide });
    const ring = new THREE.Mesh(ringGeo, ringMat);
    ring.position.y = 0.05;
    this.rallyFlagGroup.add(ring);

    // Teak Flagpole
    const poleGeo = new THREE.CylinderGeometry(0.06, 0.06, 3.2, 8);
    const poleMat = new THREE.MeshStandardMaterial({ color: 0x5d4037, roughness: 0.8 });
    const pole = new THREE.Mesh(poleGeo, poleMat);
    pole.position.y = 1.6;
    this.rallyFlagGroup.add(pole);

    // Golden Spearhead Finial
    const tipGeo = new THREE.ConeGeometry(0.12, 0.4, 6);
    const goldMat = new THREE.MeshStandardMaterial({ color: 0xf1c40f, metalness: 0.8, roughness: 0.3 });
    const tip = new THREE.Mesh(tipGeo, goldMat);
    tip.position.y = 3.35;
    this.rallyFlagGroup.add(tip);

    // Royal Bagan Pennant Flag (Triangular crimson & gold)
    const flagGeo = new THREE.PlaneGeometry(1.2, 0.7);
    const flagMat = new THREE.MeshStandardMaterial({
      color: this.faction === 'enemy' ? 0x922b21 : 0xd4ac0d,
      side: THREE.DoubleSide
    });
    const flag = new THREE.Mesh(flagGeo, flagMat);
    flag.position.set(0.6, 2.7, 0);
    this.rallyFlagGroup.add(flag);

    this.rallyFlagGroup.visible = false;
    this.game.scene.add(this.rallyFlagGroup);
  }

  setRallyPoint(targetPos) {
    this.rallyPoint.set(targetPos.x, 0, targetPos.z);
    if (!this.rallyFlagGroup) {
      this.createRallyFlag();
    }
    this.rallyFlagGroup.position.copy(this.rallyPoint);
    this.rallyFlagGroup.visible = true;

    if (this.game.hud && this.game.hud.showFloatingText) {
      this.game.hud.showFloatingText('🚩 စုရပ်အလံ သတ်မှတ်ပြီး!', this.rallyPoint, '#f1c40f');
    }
    if (this.game.soundSystem) {
      this.game.soundSystem.playHarvestChime();
    }
  }

  createSelectionBox() {
    const boxGeo = new THREE.RingGeometry(this.size * 0.8, this.size * 0.95, 4);
    const boxMat = new THREE.MeshBasicMaterial({
      color: 0xf39c12,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.85
    });
    this.selectionRing = new THREE.Mesh(boxGeo, boxMat);
    this.selectionRing.rotation.x = -Math.PI / 2;
    this.selectionRing.rotation.z = Math.PI / 4;
    this.selectionRing.position.y = 0.08;
    this.selectionRing.visible = false;
    this.mesh.add(this.selectionRing);
  }

  createHpBar(width = 3.2, height = 0.22, yOffset = 5.6) {
    this.hpBarWidth = width;
    this.hpBarGroup = new THREE.Group();
    this.hpBarGroup.position.y = yOffset;

    const bgGeo = new THREE.PlaneGeometry(width + 0.1, height + 0.08);
    const bgMat = new THREE.MeshBasicMaterial({ color: 0x111111, side: THREE.DoubleSide });
    const bg = new THREE.Mesh(bgGeo, bgMat);
    this.hpBarGroup.add(bg);

    const fillGeo = new THREE.PlaneGeometry(width, height);
    this.hpFillMat = new THREE.MeshBasicMaterial({ color: 0x2ecc71, side: THREE.DoubleSide });
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

    if (pct > 0.5) this.hpFillMat.color.setHex(0x2ecc71);
    else if (pct > 0.25) this.hpFillMat.color.setHex(0xf39c12);
    else this.hpFillMat.color.setHex(0xe74c3c);
  }

  setSelected(selected) {
    this.isSelected = selected;
    this.selectionRing.visible = selected;
    if (this.rallyFlagGroup) {
      this.rallyFlagGroup.visible = selected;
    }
  }

  takeDamage(amount, attacker = null, isCrit = false) {
    this.hp -= amount;
    this.updateHpBar();

    if (this.game.hud && this.game.hud.showFloatingText) {
      const textColor = this.faction === 'enemy' ? (isCrit ? '#ffd700' : '#ff4757') : '#ff7f50';
      const text = isCrit ? `💥 CRIT! -${Math.round(amount)}` : `-${Math.round(amount)}`;
      this.game.hud.showFloatingText(text, this.mesh.position, textColor, isCrit);
    }

    if (this.hp <= 0) {
      this.hp = 0;
      this.destroy();
    }
    this.game.eventBus.emit('building-hp-changed', this);
  }

  queueUnit(type) {
    if (this.underConstruction) {
      if (this.game.hud) {
        this.game.hud.showNotification('🔨 အဆောက်အအုံ ဆောက်လုပ်ဆဲ ဖြစ်ပါသည်!', 'warning');
      }
      return false;
    }
    if (this.trainingQueue.length >= this.maxQueue) {
      return false; // Max 10 reached
    }
    if (!this.game.economySystem.deduct(type)) {
      alert('ရိက္ခာ (သို့မဟုတ်) ရွှေ မလုံလောက်ပါ!');
      return false;
    }
    this.trainingQueue.push(type);
    this.game.eventBus.emit('training-queue-updated', { building: this, count: this.trainingQueue.length });
    return true;
  }

  spawnTrainedUnit(type) {
    const spawnPos = {
      x: this.mesh.position.x + (Math.random() - 0.5) * 3,
      z: this.mesh.position.z + (this.size / 2 + 3) + Math.random() * 2
    };

    let unit = null;
    const unitOpts = { x: spawnPos.x, z: spawnPos.z, faction: this.faction };
    if (type === 'villager') unit = new Villager(this.game, unitOpts);
    else if (type === 'swordsman') unit = new Swordsman(this.game, unitOpts);
    else if (type === 'archer') unit = new Archer(this.game, unitOpts);
    else if (type === 'spearman') unit = new Spearman(this.game, unitOpts);
    else if (type === 'cavalry_raider') unit = new Cavalry(this.game, { ...unitOpts, subType: 'raider' });
    else if (type === 'cavalry_lancer') unit = new Cavalry(this.game, { ...unitOpts, subType: 'lancer' });
    else if (type === 'horse_archer') unit = new Cavalry(this.game, { ...unitOpts, subType: 'archer' });
    else if (type === 'elephant') unit = new WarElephant(this.game, { ...unitOpts, subType: 'stomp' });
    else if (type === 'elephant_archer') unit = new WarElephant(this.game, { ...unitOpts, subType: 'archer' });
    else if (type === 'royal_elephant') unit = new WarElephant(this.game, { ...unitOpts, subType: 'armored' });
    else if (type === 'general') unit = new General(this.game, unitOpts);

    if (unit) {
      if (this.faction === 'player' && this.game.stats) {
        this.game.stats.unitsTrained++;
      }
      if (this.faction === 'player' && this.game.soundSystem) {
        this.game.soundSystem.playRecruitChime();
      }
      this.game.units.push(unit);
      const dest = this.rallyPoint ? { x: this.rallyPoint.x, z: this.rallyPoint.z } : { x: spawnPos.x, z: spawnPos.z + 4 };
      unit.moveTo(dest);
      this.game.hud.showFloatingText(`+1 ${unit.name.split(' ')[0]}`, this.mesh.position, '#2ecc71');

      // Replicate trained unit to opponent in multiplayer
      if (this.game.mpClient && this.game.mpClient.isMultiplayer && this.faction === 'player') {
        this.game.mpClient.sendUnitTrained(unit);
      }
    }
  }

  destroy() {
    this.game.scene.remove(this.mesh);
    if (this.rallyFlagGroup) {
      this.game.scene.remove(this.rallyFlagGroup);
    }
    this.game.removeBuilding(this);

    // If completed house was destroyed, reduce population cap
    if (this.type === 'house' && this.faction === 'player' && !this.underConstruction) {
      if (this.game.economySystem) {
        this.game.economySystem.resources.maxPopulation = Math.max(15, this.game.economySystem.resources.maxPopulation - 10);
        this.game.economySystem.updateUI();
      }
    }

    // End game conditions
    if (this.type === 'palace') {
      if (this.faction === 'player' && this.game.onDefeat) {
        this.game.onDefeat();
      } else if (this.faction === 'enemy' && this.game.onVictory) {
        this.game.onVictory();
      }
    }
  }

  update(delta) {
    if (this.hpBarGroup && this.game.camera) {
      this.hpBarGroup.quaternion.copy(this.game.camera.quaternion);
    }
    if (this.constructionUIGroup && this.game.camera) {
      this.constructionUIGroup.quaternion.copy(this.game.camera.quaternion);
    }

    // Process training queue
    if (this.trainingQueue.length > 0) {
      this.trainingTimer += delta;
      const progress = Math.min(1, this.trainingTimer / this.trainingDuration);
      this.game.eventBus.emit('training-progress', { building: this, progress, count: this.trainingQueue.length });

      if (this.trainingTimer >= this.trainingDuration) {
        this.trainingTimer = 0;
        const unitType = this.trainingQueue.shift();
        this.spawnTrainedUnit(unitType);
        this.game.eventBus.emit('training-queue-updated', { building: this, count: this.trainingQueue.length });
      }
    } else {
      this.trainingTimer = 0;
    }

    this._updateDefenseTowers(delta);
  }

  getUpgradeCost() {
    const nextTier = this.tier + 1;
    if (nextTier > this.maxTier) return null;
    const costs = {
      2: { wood: 200, stone: 100, gold: 50 },
      3: { wood: 350, stone: 200, gold: 120 }
    };
    return costs[nextTier];
  }

  canUpgrade() {
    if (this.tier >= this.maxTier) return false;
    if (this.underConstruction) return false;
    const cost = this.getUpgradeCost();
    if (!cost) return false;
    const res = this.game.economySystem.resources;
    return res.wood >= cost.wood && res.stone >= cost.stone && res.gold >= cost.gold;
  }

  upgrade() {
    if (!this.canUpgrade()) return false;
    const cost = this.getUpgradeCost();
    const res = this.game.economySystem.resources;
    res.wood -= cost.wood;
    res.stone -= cost.stone;
    res.gold -= cost.gold;
    this.game.economySystem.updateUI();

    this.tier++;
    this.maxHp = Math.round(this.maxHp * 1.4);
    this.hp = Math.min(this.hp + Math.round(this.maxHp * 0.3), this.maxHp);

    // Rebuild model - remove old modelGroup
    if (this.modelGroup) {
      this.mesh.remove(this.modelGroup);
      this.modelGroup = null;
    }
    // Call subclass rebuild
    if (this.rebuildModel) this.rebuildModel();

    if (this.game.hud) {
      this.game.hud.showNotification(`🏗️ ${this.name} — အဆင့် ${this.tier} အဆင့်မြင့်တင်ပြီး!`, 'success');
      this.game.hud.showFloatingText(`⬆️ Tier ${this.tier}`, this.mesh.position, '#f1c40f');
    }
    if (this.game.soundSystem) this.game.soundSystem.playHammer();

    if (this.game.mpClient && this.game.mpClient.isMultiplayer && this.faction === 'player') {
      this.game.mpClient.sendBuildingUpgraded(this);
    }
    return true;
  }

  // Defense tower attachment
  addDefenseTower() {
    if (this.defenseSlots.length >= this.maxDefenseSlots) {
      if (this.game.hud) this.game.hud.showNotification('ကာကွယ်ရေးစင် အများဆုံး ' + this.maxDefenseSlots + ' ခုသာထည့်နိုင်သည်!', 'warning');
      return false;
    }
    // Cost: wood 80, stone 40
    const res = this.game.economySystem.resources;
    if (res.wood < 80 || res.stone < 40) {
      if (this.game.hud) this.game.hud.showNotification('🪵80 🧱40 လိုအပ်သည်!', 'warning');
      return false;
    }
    res.wood -= 80;
    res.stone -= 40;
    this.game.economySystem.updateUI();

    // Create mini archer tower mesh attached to building corner
    const slot = this.defenseSlots.length;
    const towerGroup = this._buildDefenseTowerMesh(slot);
    this.mesh.add(towerGroup);

    // Defense tower attack logic
    const defTower = {
      group: towerGroup,
      attackRange: 14 + this.tier * 2,
      attackDamage: 12 + this.tier * 4,
      attackCooldown: 1.8,
      attackTimer: 0,
      scanTimer: 0,
      currentTarget: null
    };
    this.defenseSlots.push(defTower);

    if (this.game.hud) {
      this.game.hud.showNotification('🏹 ကာကွယ်ရေးစင် တပ်ဆင်ပြီး!', 'success');
      this.game.hud.showFloatingText('🏹 +ကာကွယ်ရေးစင်', this.mesh.position, '#e67e22');
    }

    if (this.game.mpClient && this.game.mpClient.isMultiplayer && this.faction === 'player') {
      this.game.mpClient.sendDefenseTowerAdded(this, slot);
    }
    return true;
  }

  _buildDefenseTowerMesh(slotIndex) {
    const g = new THREE.Group();
    // Position at building corners
    const half = (this.size || 4) * 0.5 + 0.3;
    const corners = [[-half, half], [half, half], [-half, -half], [half, -half]];
    const [cx, cz] = corners[slotIndex % 4];
    g.position.set(cx, 0, cz);

    const woodMat = new THREE.MeshStandardMaterial({ color: 0x5d4037, roughness: 0.8 });
    const stoneMat = new THREE.MeshStandardMaterial({ color: 0x935116, roughness: 0.9 });
    const roofMat = new THREE.MeshStandardMaterial({ color: 0xa04000, roughness: 0.7 });

    // Base pillar
    const pil = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.28, 3.5, 8), stoneMat);
    pil.position.y = 1.75;
    pil.castShadow = true;
    g.add(pil);

    // Platform
    const plat = new THREE.Mesh(new THREE.BoxGeometry(1.1, 0.2, 1.1), woodMat);
    plat.position.y = 3.6;
    g.add(plat);

    // Railing
    const railGeo = new THREE.BoxGeometry(1.0, 0.5, 0.1);
    [0, Math.PI/2, Math.PI, -Math.PI/2].forEach((rot, i) => {
      const r = new THREE.Mesh(railGeo, woodMat);
      r.rotation.y = rot;
      r.position.set(Math.sin(rot)*0.5, 4.0, Math.cos(rot)*0.5);
      g.add(r);
    });

    // Roof cone
    const roof = new THREE.Mesh(new THREE.ConeGeometry(0.9, 0.9, 4), roofMat);
    roof.position.y = 4.7;
    roof.rotation.y = Math.PI/4;
    g.add(roof);

    // Finial
    const fin = new THREE.Mesh(new THREE.ConeGeometry(0.12, 0.5, 6), new THREE.MeshStandardMaterial({ color: 0xd4ac0d, metalness: 0.8 }));
    fin.position.y = 5.3;
    g.add(fin);

    return g;
  }

  _updateDefenseTowers(delta) {
    if (!this.defenseSlots.length) return;
    const opposingFaction = this.faction === 'player' ? 'enemy' : 'player';

    this.defenseSlots.forEach(dt => {
      dt.scanTimer += delta;
      if (dt.scanTimer >= 0.5) {
        dt.scanTimer = 0;
        let best = null, bestDist = dt.attackRange;
        for (const u of this.game.units) {
          if (u.faction === opposingFaction && u.hp > 0) {
            const d = this.mesh.position.distanceTo(u.mesh.position);
            if (d < bestDist) { bestDist = d; best = u; }
          }
        }
        dt.currentTarget = best;
      }

      if (dt.currentTarget && dt.currentTarget.hp > 0) {
        dt.attackTimer += delta;
        if (dt.attackTimer >= dt.attackCooldown) {
          dt.attackTimer = 0;
          const src = { mesh: { position: this.mesh.position.clone().add(dt.group.position).add(new THREE.Vector3(0, 4.5, 0)) }, faction: this.faction };
          if (this.game.combatVFX) this.game.combatVFX.spawnArrow(src, dt.currentTarget, dt.attackDamage);
        }
      }
    });
  }
}
