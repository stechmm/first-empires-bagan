import * as THREE from 'three';
import { Palace } from '../entities/buildings/Palace.js';
import { Barracks } from '../entities/buildings/Barracks.js';
import { Swordsman } from '../entities/Swordsman.js';
import { Archer } from '../entities/Archer.js';
import { WarElephant } from '../entities/WarElephant.js';
import { Watchtower } from '../entities/buildings/Watchtower.js';

export class EnemyCommanderAI {
  constructor(game, options = {}) {
    this.game = game;
    this.difficulty = options.difficulty || 'normal'; // 'easy', 'normal', 'hard'
    this.isActive = false;

    // Difficulty Configuration
    this.config = this.getDifficultyConfig(this.difficulty);

    this.enemyBuildings = [];
    this.enemyUnits = [];
    this.garrison = [];
    this.activeWaveUnits = [];

    this.waveNumber = 0;
    this.waveTimer = this.config.initialDelay;
    this.waveInterval = this.config.waveInterval;

    this.campCenter = new THREE.Vector3(55, 0, 45);
    this.isDefeated = false;

    // Temporarily disabled enemy waves for peaceful construction & training
    this.isWaveDisabled = true;
  }

  getDifficultyConfig(diff) {
    switch (diff) {
      case 'easy':
        return {
          initialDelay: 75,
          waveInterval: 70,
          speedMult: 0.85,
          damageMult: 0.8,
          hpMult: 0.85,
          strongholdHp: 1200,
          label: 'လွယ်ကူ (Easy)'
        };
      case 'hard':
        return {
          initialDelay: 35,
          waveInterval: 35,
          speedMult: 1.15,
          damageMult: 1.25,
          hpMult: 1.25,
          strongholdHp: 2200,
          label: 'ခက်ခဲ (Hard)'
        };
      case 'normal':
      default:
        return {
          initialDelay: 50,
          waveInterval: 50,
          speedMult: 1.0,
          damageMult: 1.0,
          hpMult: 1.0,
          strongholdHp: 1600,
          label: 'သာမန် (Normal)'
        };
    }
  }

  getFactionConfig(f) {
    switch (f) {
      case 'chinese':
        return {
          id: 'chinese',
          name: 'တရုတ်မန်ချူးတပ်',
          strongholdName: 'မန်ချူး စစ်ခံတပ် (Manchu Fortress)',
          barracksName: 'မန်ချူး စစ်တန်းလျား',
          swordsmanName: 'မန်ချူး ဓားရှည်စစ်သည်',
          archerName: 'မန်ချူး ဒူးလေးစစ်သည်',
          elephantName: 'မန်ချူး သံချပ်ကာ တိုက်ဆင်ကြီး',
          baseColor: 0x1b2631, // Imperial Dark Steel
          accentColor: 0x922b21, // Imperial Crimson
          flagColor: 0x922b21
        };
      case 'ari':
        return {
          id: 'ari',
          name: 'အရည်းကြီးတပ်',
          strongholdName: 'အရည်းကြီး ဂိုဏ်းချုပ်ကျောင်း (Ari Sanctuary)',
          barracksName: 'အရည်းကြီး သိုင်းတိုက်',
          swordsmanName: 'အရည်းကြီး တုတ်ကိုင်စစ်သည်',
          archerName: 'အရည်းကြီး လေးမြှားစစ်သည်',
          elephantName: 'အရည်းကြီး မာတင်္ဂ ဆင်တပ်',
          baseColor: 0x2c1503, // Dark teak
          accentColor: 0x6c3483, // Esoteric Purple/Saffron
          flagColor: 0x78281f
        };
      case 'bagan':
      default:
        return {
          id: 'bagan',
          name: 'ပုဂံတပ်တော်',
          strongholdName: 'ပုဂံ တော်ဝင်ခံတပ်',
          barracksName: 'ပုဂံ စစ်တန်းလျား',
          swordsmanName: 'ပုဂံ ဓားစစ်သည်',
          archerName: 'ပုဂံ လေးသည်တော်',
          elephantName: 'ပုဂံ တိုက်ဆင်ကြီး',
          baseColor: 0x5d4037, // Royal wood
          accentColor: 0xb7950b, // Royal gold
          flagColor: 0xb7950b
        };
    }
  }

  start(faction = 'chinese') {
    this.isActive = true;
    this.isDefeated = false;
    this.waveNumber = 0;
    this.waveTimer = this.config.initialDelay;
    this.factionConfig = this.getFactionConfig(faction);

    this.buildEnemyCamp();
  }

  stop() {
    this.isActive = false;
  }

  buildEnemyCamp() {
    // 1. Enemy Stronghold
    this.stronghold = new Palace(this.game, {
      x: this.campCenter.x,
      z: this.campCenter.z,
      faction: 'enemy',
      name: this.factionConfig.strongholdName,
      hp: this.config.strongholdHp
    });

    // Style stronghold with faction colors
    this.applyEnemyStyling(this.stronghold.mesh, this.factionConfig.baseColor, this.factionConfig.accentColor);
    this.game.buildings.push(this.stronghold);
    this.enemyBuildings.push(this.stronghold);

    // 2. Enemy Barracks
    this.barracks = new Barracks(this.game, {
      x: this.campCenter.x - 12,
      z: this.campCenter.z - 6,
      faction: 'enemy',
      name: this.factionConfig.barracksName,
      hp: 850
    });
    this.applyEnemyStyling(this.barracks.mesh, this.factionConfig.baseColor, this.factionConfig.accentColor);
    this.game.buildings.push(this.barracks);
    this.enemyBuildings.push(this.barracks);

    // 3. Enemy Guard Watchposts (Active Defensive Towers)
    this.tower1 = new Watchtower(this.game, {
      x: this.campCenter.x - 18,
      z: this.campCenter.z - 16,
      faction: 'enemy',
      name: 'ရန်သူ့ မြှားပစ်ကင်းစင် (Enemy Tower)',
      hp: 550
    });
    this.game.buildings.push(this.tower1);
    this.enemyBuildings.push(this.tower1);

    this.tower2 = new Watchtower(this.game, {
      x: this.campCenter.x - 12,
      z: this.campCenter.z + 14,
      faction: 'enemy',
      name: 'ရန်သူ့ မြှားပစ်ကင်းစင် (Enemy Tower)',
      hp: 550
    });
    this.game.buildings.push(this.tower2);
    this.enemyBuildings.push(this.tower2);

    // 4. Initial Garrison Guards defending the camp
    const guardCount = this.difficulty === 'hard' ? 4 : (this.difficulty === 'normal' ? 3 : 2);
    for (let i = 0; i < guardCount; i++) {
      const angle = (i / guardCount) * Math.PI * 2;
      const gx = this.campCenter.x + Math.cos(angle) * 9;
      const gz = this.campCenter.z + Math.sin(angle) * 9;

      const guard = new Swordsman(this.game, {
        x: gx,
        z: gz,
        faction: 'enemy',
        name: `${this.factionConfig.swordsmanName} (ကင်းစောင့်)`,
        hp: Math.round(120 * this.config.hpMult)
      });
      this.styleEnemyUnit(guard);
      this.game.units.push(guard);
      this.garrison.push(guard);
    }
  }

  createWatchtower(x, z) {
    const towerGroup = new THREE.Group();
    towerGroup.position.set(x, 0, z);

    const stoneMat = new THREE.MeshStandardMaterial({ color: 0x34495e, roughness: 0.8 });
    const woodMat = new THREE.MeshStandardMaterial({ color: 0x17202a, roughness: 0.9 });
    const flagMat = new THREE.MeshStandardMaterial({ color: 0x922b21 });

    // Tower Pillars
    const postGeo = new THREE.CylinderGeometry(0.5, 0.7, 6.0, 8);
    const post = new THREE.Mesh(postGeo, stoneMat);
    post.position.y = 3.0;
    towerGroup.add(post);

    // Top Platform
    const platGeo = new THREE.BoxGeometry(2.8, 0.4, 2.8);
    const plat = new THREE.Mesh(platGeo, woodMat);
    plat.position.y = 6.0;
    towerGroup.add(plat);

    // Spire Roof
    const roofGeo = new THREE.ConeGeometry(2.0, 1.8, 4);
    const roof = new THREE.Mesh(roofGeo, flagMat);
    roof.position.y = 7.2;
    roof.rotation.y = Math.PI / 4;
    towerGroup.add(roof);

    // Enemy Flag
    const flagGeo = new THREE.PlaneGeometry(0.8, 1.4);
    const flag = new THREE.Mesh(flagGeo, flagMat);
    flag.position.set(0, 8.2, 0);
    towerGroup.add(flag);

    this.game.scene.add(towerGroup);
    return towerGroup;
  }

  applyEnemyStyling(mesh, baseColor, accentColor) {
    mesh.traverse(child => {
      if (child.isMesh && child.material) {
        // Skip textured meshes to preserve artwork
        if (child.material.map) return;

        child.material = child.material.clone();
        if (child.geometry && child.geometry.type.includes('Cone')) {
          child.material.color.setHex(accentColor);
        } else {
          child.material.color.setHex(baseColor);
        }
      }
    });
  }

  styleEnemyUnit(unit) {
    unit.mesh.traverse(child => {
      if (child.isMesh && child.material) {
        child.material = child.material.clone();
        child.material.color.setHex(0x1c2833); // Dark menacing armor
      }
    });
    // Set HP bar color to red
    if (unit.hpFillMat) {
      unit.hpFillMat.color.setHex(0xe74c3c);
    }
  }

  spawnRaidWave() {
    this.waveNumber++;
    const spawnOrigin = {
      x: this.campCenter.x - 14,
      z: this.campCenter.z - 8
    };

    const newWave = [];

    // Determine squad size and composition based on wave and difficulty
    let swordsmenCount = 2;
    let archersCount = 1;
    let elephantsCount = 0;

    if (this.difficulty === 'easy') {
      swordsmenCount = Math.min(4, 2 + Math.floor(this.waveNumber * 0.5));
      archersCount = this.waveNumber >= 2 ? 1 : 0;
    } else if (this.difficulty === 'normal') {
      swordsmenCount = 2 + this.waveNumber;
      archersCount = 1 + Math.floor(this.waveNumber * 0.8);
      if (this.waveNumber >= 3) {
        elephantsCount = 1;
      }
    } else if (this.difficulty === 'hard') {
      swordsmenCount = 3 + this.waveNumber * 2;
      archersCount = 2 + this.waveNumber;
      elephantsCount = this.waveNumber >= 2 ? Math.min(3, Math.floor(this.waveNumber * 0.8)) : 0;
    }

    // Spawn Swordsmen
    for (let i = 0; i < swordsmenCount; i++) {
      const u = new Swordsman(this.game, {
        x: spawnOrigin.x + (Math.random() - 0.5) * 5,
        z: spawnOrigin.z + (Math.random() - 0.5) * 5,
        faction: 'enemy',
        name: `${this.factionConfig.swordsmanName} #${i + 1}`,
        hp: Math.round(100 * this.config.hpMult),
        damage: Math.round(15 * this.config.damageMult),
        speed: 4.5 * this.config.speedMult
      });
      this.styleEnemyUnit(u);
      this.game.units.push(u);
      newWave.push(u);
    }

    // Spawn Archers
    for (let i = 0; i < archersCount; i++) {
      const u = new Archer(this.game, {
        x: spawnOrigin.x + (Math.random() - 0.5) * 5,
        z: spawnOrigin.z + (Math.random() - 0.5) * 5,
        faction: 'enemy',
        name: `${this.factionConfig.archerName} #${i + 1}`,
        hp: Math.round(80 * this.config.hpMult),
        damage: Math.round(12 * this.config.damageMult),
        speed: 4.8 * this.config.speedMult
      });
      this.styleEnemyUnit(u);
      this.game.units.push(u);
      newWave.push(u);
    }

    // Spawn War Elephants
    for (let i = 0; i < elephantsCount; i++) {
      const u = new WarElephant(this.game, {
        x: spawnOrigin.x + (Math.random() - 0.5) * 6,
        z: spawnOrigin.z + (Math.random() - 0.5) * 6,
        faction: 'enemy',
        name: `${this.factionConfig.elephantName} #${i + 1}`,
        hp: Math.round(450 * this.config.hpMult),
        damage: Math.round(40 * this.config.damageMult),
        speed: 3.5 * this.config.speedMult
      });
      this.styleEnemyUnit(u);
      this.game.units.push(u);
      newWave.push(u);
    }

    this.activeWaveUnits.push(...newWave);

    // Announce Wave to Player
    const alertMsg = `⚠️ သတိပေးချက်: ${this.factionConfig.name} ကျူးကျော်လာနေပြီ! (Wave ${this.waveNumber} - စစ်သည် ${newWave.length} ဦး)`;
    this.game.eventBus.emit('enemy-wave-launched', {
      wave: this.waveNumber,
      count: newWave.length,
      message: alertMsg
    });

    // Send the wave towards the player base
    this.orderWaveAttack(newWave);
  }

  orderWaveAttack(waveUnits) {
    // Find player targets
    const playerBase = this.game.buildings.find(b => b.faction === 'player' && b.type === 'palace') ||
                       this.game.buildings.find(b => b.faction === 'player');

    const targetPos = playerBase ? playerBase.mesh.position : new THREE.Vector3(0, 0, 0);

    waveUnits.forEach((unit, idx) => {
      const row = Math.floor(idx / 3);
      const col = idx % 3;
      const offsetX = (col - 1) * 2.8;
      const offsetZ = (row - 1) * 2.8;

      unit.moveTo({
        x: targetPos.x + offsetX,
        z: targetPos.z + offsetZ + 4
      });
    });
  }

  update(delta) {
    if (!this.isActive) return;

    // 1. Check Victory Condition: Did the player destroy the Enemy Stronghold?
    if (this.stronghold && this.stronghold.hp <= 0 && !this.isDefeated) {
      this.isDefeated = true;
      this.game.onVictory();
      return;
    }

    // 2. Check Defeat Condition: Did the enemy destroy the Player Palace?
    const playerPalace = this.game.buildings.find(b => b.faction === 'player' && b.type === 'palace');
    if ((!playerPalace || playerPalace.hp <= 0) && !this.isDefeated) {
      this.game.onDefeat();
      return;
    }

    // 3. Countdown Wave Timer (If waves enabled)
    if (!this.isWaveDisabled) {
      this.waveTimer -= delta;
      this.game.eventBus.emit('wave-timer-tick', {
        timeRemaining: Math.max(0, Math.ceil(this.waveTimer)),
        waveNumber: this.waveNumber + 1
      });

      if (this.waveTimer <= 0) {
        this.waveTimer = this.waveInterval;
        this.spawnRaidWave();
      }
    } else {
      // Emit peaceful builder status (waves paused)
      this.game.eventBus.emit('wave-timer-tick', {
        isPaused: true,
        statusText: 'စစ်ဘေး ငြိမ်းချမ်းရေး (Wave ပိတ်ထားသည်)'
      });
    }

    // 4. AI Combat Aggro: If enemy wave units or garrison see player units, attack them!
    const allEnemyUnits = this.game.units.filter(u => u.faction === 'enemy');
    const playerUnits = this.game.units.filter(u => u.faction === 'player');
    const playerBuildings = this.game.buildings.filter(b => b.faction === 'player');

    for (const enemy of allEnemyUnits) {
      // If idle, look for nearby player units or buildings to attack
      if (!enemy.targetEntity && (!enemy.targetPos || enemy.mesh.position.distanceTo(enemy.targetPos) < 1.0)) {
        let closestTarget = null;
        let closestDist = 18.0; // Aggro vision radius

        // Check player units first
        for (const pu of playerUnits) {
          const d = enemy.mesh.position.distanceTo(pu.mesh.position);
          if (d < closestDist) {
            closestDist = d;
            closestTarget = pu;
          }
        }

        // If no units nearby, check player buildings
        if (!closestTarget) {
          for (const pb of playerBuildings) {
            const d = enemy.mesh.position.distanceTo(pb.mesh.position);
            if (d < 25.0) {
              closestTarget = pb;
              break;
            }
          }
        }

        if (closestTarget) {
          enemy.attackTarget(closestTarget);
        }
      }
    }
  }
}
