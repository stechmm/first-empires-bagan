import * as THREE from 'three';
import { EventBus } from './EventBus.js';
import { Terrain } from '../engine/Terrain.js';
import { CameraController } from '../engine/CameraController.js';
import { SelectionSystem } from '../systems/SelectionSystem.js';
import { BuildingPlacementSystem } from '../systems/BuildingPlacementSystem.js';
import { EconomySystem } from '../systems/EconomySystem.js';
import { HUD } from '../ui/HUD.js';
import { MenuManager } from '../ui/MenuManager.js';
import { EnemyCommanderAI } from '../ai/EnemyCommanderAI.js';
import { CombatVFXSystem } from '../systems/CombatVFXSystem.js';
import { SoundSystem } from '../audio/SoundSystem.js';
import { FogOfWarSystem } from '../systems/FogOfWarSystem.js';
import { FactionPowersSystem } from '../systems/FactionPowersSystem.js';
import { CampaignManager } from './CampaignManager.js';
import { TechTreeSystem } from '../systems/TechTreeSystem.js';
import { MultiplayerClient } from '../multiplayer/MultiplayerClient.js';
import { MultiplayerLobby } from '../ui/MultiplayerLobby.js';

// Entities
import { Palace } from '../entities/buildings/Palace.js';
import { Barracks } from '../entities/buildings/Barracks.js';
import { Pagoda } from '../entities/buildings/Pagoda.js';
import { Stables } from '../entities/buildings/Stables.js';
import { WarElephant } from '../entities/WarElephant.js';
import { Swordsman } from '../entities/Swordsman.js';
import { Archer } from '../entities/Archer.js';
import { Villager } from '../entities/Villager.js';
import { ResourceNode } from '../entities/ResourceNode.js';

export class Game {
  constructor() {
    this.container = document.getElementById('game-container');
    this.eventBus = new EventBus();

    this.units = [];
    this.buildings = [];
    this.resourceNodes = [];

    this.isGameRunning = false;
    this.stats = {
      startTime: 0,
      elapsedTime: 0,
      enemiesKilled: 0,
      unitsTrained: 0,
      resourcesHarvested: 0
    };

    this.clock = new THREE.Clock();

    this.initScene();
    this.initLights();
    this.initSystems();
    this.spawnInitialBaseAndArmy();

    window.addEventListener('resize', () => this.onWindowResize());
    this.animate();
  }

  initScene() {
    this.scene = new THREE.Scene();
    // Warm Bagan Golden Hour Sunrise Sky
    this.scene.background = new THREE.Color(0xca6f1e).lerp(new THREE.Color(0x7e5109), 0.35);
    this.scene.fog = new THREE.FogExp2(0x935116, 0.005); // Bagan atmospheric golden mist

    this.camera = new THREE.PerspectiveCamera(
      45,
      window.innerWidth / window.innerHeight,
      0.5,
      1000
    );

    this.renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.15;

    this.container.appendChild(this.renderer.domElement);

    this.cameraController = new CameraController(this.camera, this.renderer.domElement);
  }

  initLights() {
    // Warm tropical ambient light
    this.ambientLight = new THREE.AmbientLight(0xfff3e0, 0.85);
    this.scene.add(this.ambientLight);

    // Bagan Golden Sun (Warm directional sunlight casting soft shadows)
    this.sunLight = new THREE.DirectionalLight(0xfffae5, 1.5);
    this.sunLight.position.set(70, 95, 55);
    this.sunLight.castShadow = true;
    this.sunLight.shadow.mapSize.width = 2048;
    this.sunLight.shadow.mapSize.height = 2048;
    this.sunLight.shadow.camera.near = 10;
    this.sunLight.shadow.camera.far = 280;
    const d = 85;
    this.sunLight.shadow.camera.left = -d;
    this.sunLight.shadow.camera.right = d;
    this.sunLight.shadow.camera.top = d;
    this.sunLight.shadow.camera.bottom = -d;
    this.sunLight.shadow.bias = -0.0004;

    this.scene.add(this.sunLight);

    // Subtle sky bounce light from opposite angle
    const skyFill = new THREE.DirectionalLight(0xf9e79f, 0.4);
    skyFill.position.set(-60, 40, -40);
    this.scene.add(skyFill);
  }

  initSystems() {
    this.terrain = new Terrain(this.scene, 220);
    this.economySystem = new EconomySystem(this);
    this.placementSystem = new BuildingPlacementSystem(this);
    this.selectionSystem = new SelectionSystem(this);
    this.fogOfWar = new FogOfWarSystem(this, 220);
    this.factionPowers = new FactionPowersSystem(this);
    this.campaignManager = new CampaignManager(this);
    this.hud = new HUD(this);
    this.soundSystem = new SoundSystem(this);
    this.combatVFX = new CombatVFXSystem(this);
    this.techTree = new TechTreeSystem(this);
    this.enemyAI = new EnemyCommanderAI(this);
    this.menuManager = new MenuManager(this);
    this.mpClient = new MultiplayerClient(this);
    this.mpLobby = new MultiplayerLobby(this, this.mpClient);
  }

  spawnInitialBaseAndArmy() {
    // 1. Starting Royal Base - Main Building (Palace)
    const palace = new Palace(this, { x: 0, z: -5 });
    this.buildings.push(palace);

    // 2. Starting Villagers (အစပျိုး မြို့တည်လုပ်သား ၃ ဦး - နန်းတော်ရှေ့တွင် နေရာချထားသည်)
    const v1 = new Villager(this, { x: 3, z: 2, faction: 'player' });
    const v2 = new Villager(this, { x: -3, z: 2, faction: 'player' });
    const v3 = new Villager(this, { x: 0, z: 4.5, faction: 'player' });
    this.units.push(v1, v2, v3);

    // Update starting population
    if (this.economySystem) {
      this.economySystem.resources.population = 3;
      this.economySystem.updateHUD();
    }

    // Auto-select starting villager on start so player immediately has build controls active
    setTimeout(() => {
      if (this.selectionSystem && this.units.includes(v1)) {
        this.selectionSystem.selectUnit(v1);
      }
    }, 150);

    // 3. Resource Nodes organized cleanly along the base perimeter
    const gold1 = new ResourceNode(this, { resourceType: 'gold', x: -28, z: -24, amount: 4000 });
    const gold2 = new ResourceNode(this, { resourceType: 'gold', x: 42, z: 28, amount: 3500 });

    const stone1 = new ResourceNode(this, { resourceType: 'stone', x: -26, z: 26, amount: 3000 });
    const stone2 = new ResourceNode(this, { resourceType: 'stone', x: 38, z: -32, amount: 3500 });

    const wood1 = new ResourceNode(this, { resourceType: 'wood', x: 30, z: -26, amount: 4500 });
    const wood2 = new ResourceNode(this, { resourceType: 'wood', x: -38, z: 8, amount: 5000 });
    const wood3 = new ResourceNode(this, { resourceType: 'wood', x: 36, z: 14, amount: 4000 });

    const food1 = new ResourceNode(this, { resourceType: 'food', x: -18, z: -32, amount: 2500 });
    const food2 = new ResourceNode(this, { resourceType: 'food', x: 24, z: 28, amount: 2500 });

    this.resourceNodes.push(gold1, gold2, stone1, stone2, wood1, wood2, wood3, food1, food2);
  }

  startSkirmish(options = {}) {
    this.resetBattlefield();

    const difficulty = typeof options === 'string' ? options : (options.difficulty || 'normal');
    const playerFaction = options.playerFaction || 'bagan';
    const enemyFaction = options.enemyFaction || 'chinese';
    const resources = options.resources || 'standard';

    this.playerFaction = playerFaction;
    if (this.fogOfWar) this.fogOfWar.reset();
    if (this.factionPowers) {
      this.factionPowers.cooldownTimer = 0;
      this.factionPowers.updateUI();
    }

    // Set starting resources: enough for 10 villagers (500f) + Barracks (120w, 50s) + 3 soldiers (150f, 60w)
    const startingPop = this.units.filter(u => u.faction === 'player').length || 3;
    if (resources === 'high') {
      this.economySystem.resources = { food: 1800, wood: 1200, stone: 1000, gold: 800, population: startingPop, maxPopulation: 35 };
    } else {
      this.economySystem.resources = { food: 800, wood: 450, stone: 250, gold: 200, population: startingPop, maxPopulation: 15 };
    }
    this.economySystem.updateHUD();

    this.stats = {
      startTime: this.clock.getElapsedTime(),
      elapsedTime: 0,
      enemiesKilled: 0,
      unitsTrained: 0,
      resourcesHarvested: 0
    };

    // Configure and start Enemy AI with selected faction
    this.enemyAI.difficulty = difficulty;
    this.enemyAI.config = this.enemyAI.getDifficultyConfig(difficulty);
    this.enemyAI.start(enemyFaction);

    this.isGameRunning = true;

    // Reset camera position to player's central palace
    this.cameraController.target.set(0, 0, 0);
    this.cameraController.zoom = 35;
    this.cameraController.updateCameraPosition();

    // Start Bagan War Drums & Music
    if (this.soundSystem) {
      this.soundSystem.startWarDrums();
    }

    // Announcement
    const enemyName = this.enemyAI.factionConfig ? this.enemyAI.factionConfig.name : 'ရန်သူ့တပ်';
    this.hud.showFloatingText(`⚔️ စစ်ပွဲ စတင်ပါပြီ! (${enemyName} ကို ချေမှုန်းပါ)`, new THREE.Vector3(0, 5, 0), '#f1c40f');
  }

  startMultiplayerMatch(data) {
    this.resetBattlefield();

    // Disable single-player AI
    if (this.enemyAI) {
      this.enemyAI.isWaveDisabled = true;
      this.enemyAI.enabled = false;
      this.enemyAI.stop();
    }

    const isHost = (this.mpClient.role === 'host');
    const mySpawn = isHost ? data.hostSpawn : data.guestSpawn;
    const enemySpawn = isHost ? data.guestSpawn : data.hostSpawn;

    // 1. My Palace & Starting Villagers
    const myPalace = new Palace(this, { x: mySpawn.x, z: mySpawn.z, faction: 'player' });
    this.buildings.push(myPalace);

    const v1 = new Villager(this, { x: mySpawn.x + 3, z: mySpawn.z + 2, faction: 'player' });
    const v2 = new Villager(this, { x: mySpawn.x - 3, z: mySpawn.z + 2, faction: 'player' });
    const v3 = new Villager(this, { x: mySpawn.x, z: mySpawn.z + 4.5, faction: 'player' });
    this.units.push(v1, v2, v3);

    // 2. Rival Palace & Starting Villagers
    const enemyPalace = new Palace(this, { x: enemySpawn.x, z: enemySpawn.z, faction: 'enemy' });
    this.buildings.push(enemyPalace);

    const ev1 = new Villager(this, { x: enemySpawn.x + 3, z: enemySpawn.z + 2, faction: 'enemy' });
    const ev2 = new Villager(this, { x: enemySpawn.x - 3, z: enemySpawn.z + 2, faction: 'enemy' });
    const ev3 = new Villager(this, { x: enemySpawn.x, z: enemySpawn.z + 4.5, faction: 'enemy' });
    this.units.push(ev1, ev2, ev3);

    // 3. Balanced Resource Nodes across the battlefield
    const nodes = [
      new ResourceNode(this, { resourceType: 'gold', x: 0, z: -16, amount: 6000 }),
      new ResourceNode(this, { resourceType: 'gold', x: 0, z: 16, amount: 6000 }),
      new ResourceNode(this, { resourceType: 'stone', x: 0, z: 0, amount: 5000 }),

      new ResourceNode(this, { resourceType: 'food', x: -32, z: -12, amount: 3000 }),
      new ResourceNode(this, { resourceType: 'wood', x: -44, z: 0, amount: 5000 }),
      new ResourceNode(this, { resourceType: 'gold', x: -36, z: 14, amount: 4000 }),
      new ResourceNode(this, { resourceType: 'stone', x: -26, z: -20, amount: 3500 }),

      new ResourceNode(this, { resourceType: 'food', x: 32, z: -12, amount: 3000 }),
      new ResourceNode(this, { resourceType: 'wood', x: 44, z: 0, amount: 5000 }),
      new ResourceNode(this, { resourceType: 'gold', x: 36, z: 14, amount: 4000 }),
      new ResourceNode(this, { resourceType: 'stone', x: 26, z: -20, amount: 3500 })
    ];
    this.resourceNodes.push(...nodes);

    // 4. Starting Resources
    this.economySystem.resources = {
      food: 800,
      wood: 450,
      stone: 250,
      gold: 200,
      population: 3,
      maxPopulation: 15
    };
    this.economySystem.updateHUD();

    // 5. Position Camera over My Base
    this.cameraController.target.set(mySpawn.x, 0, mySpawn.z);
    this.cameraController.zoom = 35;
    this.cameraController.updateCameraPosition();

    // 6. Reset Fog of War
    if (this.fogOfWar) this.fogOfWar.reset();

    // 7. Start War Music
    if (this.soundSystem) {
      this.soundSystem.startWarDrums();
    }

    this.isGameRunning = true;
    if (this.hud) {
      this.hud.showNotification(`⚔️ စစ်ပွဲစတင်ပါပြီ! ပြိုင်ဘက်နန်းတော်ကို ဖြိုခွင်းလော့!`, 'success');
    }
  }

  stopBattle() {
    this.isGameRunning = false;
    this.enemyAI.stop();
    if (this.soundSystem) {
      this.soundSystem.stopWarDrums();
    }
  }

  onVictory() {
    this.isGameRunning = false;
    this.enemyAI.stop();
    if (this.soundSystem) {
      this.soundSystem.stopWarDrums();
    }
    this.stats.elapsedTime = this.clock.getElapsedTime() - this.stats.startTime;
    this.menuManager.showVictoryModal(this.stats);
  }

  onDefeat() {
    this.isGameRunning = false;
    this.enemyAI.stop();
    if (this.soundSystem) {
      this.soundSystem.stopWarDrums();
    }
    this.stats.elapsedTime = this.clock.getElapsedTime() - this.stats.startTime;
    this.menuManager.showDefeatModal(this.stats);
  }

  resetBattlefield() {
    // 1. Remove all existing units
    [...this.units].forEach(u => {
      this.scene.remove(u.mesh);
    });
    this.units = [];

    // 2. Remove all existing buildings
    [...this.buildings].forEach(b => {
      this.scene.remove(b.mesh);
    });
    this.buildings = [];

    // 2b. Remove existing resource nodes before re-seeding
    [...this.resourceNodes].forEach(r => {
      this.scene.remove(r.mesh);
    });
    this.resourceNodes = [];

    // 3. Remove watchtowers if any
    if (this.enemyAI.tower1) this.scene.remove(this.enemyAI.tower1);
    if (this.enemyAI.tower2) this.scene.remove(this.enemyAI.tower2);

    // 4. Clear selections and Tech Tree
    this.selectionSystem.clearSelection();
    if (this.techTree) this.techTree.reset();

    // 5. Reset Economy: Food 800, Wood 450, Stone 250, Gold 200, Population 3, MaxPop 15
    this.economySystem.resources = { food: 800, wood: 450, stone: 250, gold: 200, population: 3, maxPopulation: 15 };
    this.economySystem.updateHUD();

    // 6. Respawn Player Base
    this.spawnInitialBaseAndArmy();
  }

  removeResourceNode(node) {
    this.resourceNodes = this.resourceNodes.filter(n => n !== node);
    if (this.selectionSystem.selectedResource === node) {
      this.selectionSystem.clearSelection();
    }
  }

  removeUnit(unit) {
    this.units = this.units.filter(u => u !== unit);
    this.selectionSystem.selectedUnits = this.selectionSystem.selectedUnits.filter(u => u !== unit);
    if (this.selectionSystem.selectedUnits.length === 0) {
      this.selectionSystem.clearSelection();
    }
  }

  removeBuilding(bld) {
    this.buildings = this.buildings.filter(b => b !== bld);
    if (this.selectionSystem.selectedBuilding === bld) {
      this.selectionSystem.clearSelection();
    }
  }

  onWindowResize() {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
  }

  animate() {
    requestAnimationFrame(() => this.animate());

    const delta = Math.min(this.clock.getDelta(), 0.1);

    // Update camera pan
    this.cameraController.update(delta);

    // Update Enemy Commander AI during active battle
    if (this.isGameRunning && this.enemyAI) {
      this.enemyAI.update(delta);
    }

    // Update terrain & atmosphere (river shimmer, drifting hot air balloons, rocking boats)
    if (this.terrain && this.terrain.update) {
      this.terrain.update(delta, this.clock.getElapsedTime());
    }

    // Update combat visual effects (flying arrows, stomp shockwaves, slash arcs, sparks)
    if (this.combatVFX && this.combatVFX.update) {
      this.combatVFX.update(delta);
    }

    // Update units
    for (let i = 0; i < this.units.length; i++) {
      this.units[i].update(delta);
    }

    // Update buildings
    for (let i = 0; i < this.buildings.length; i++) {
      this.buildings[i].update(delta);
    }

    // Update resource nodes
    for (let i = 0; i < this.resourceNodes.length; i++) {
      this.resourceNodes[i].update(delta);
    }

    // Update Fog of War & Vision System
    if (this.fogOfWar) {
      this.fogOfWar.update(delta);
    }

    // Update Faction Powers Cooldowns
    if (this.isGameRunning && this.factionPowers) {
      this.factionPowers.update(delta);
    }

    // Update Dynamic Day/Night Lighting Cycle
    this.updateDayNightCycle(delta);

    // Update minimap
    this.hud.updateMinimap();

    // Render frame
    this.renderer.render(this.scene, this.camera);
  }

  updateDayNightCycle(delta) {
    if (!this.sunLight || !this.ambientLight || !this.scene.fog) return;

    this.dayTime = ((this.dayTime || 0) + delta * 0.35) % 240;
    const progress = this.dayTime / 240;
    const angle = progress * Math.PI * 2;

    const sunDist = 110;
    this.sunLight.position.x = Math.cos(angle) * sunDist;
    this.sunLight.position.y = Math.max(14, Math.sin(angle) * sunDist);
    this.sunLight.position.z = 45;

    // Smooth lighting & sky transitions
    const sinT = Math.sin(angle);
    if (sinT > 0.3) {
      // Daytime (Sunrise -> Noon -> Afternoon)
      this.sunLight.intensity = THREE.MathUtils.lerp(1.2, 1.55, sinT);
      this.ambientLight.intensity = THREE.MathUtils.lerp(0.75, 0.92, sinT);
      this.sunLight.color.setHex(0xfffae5);
      this.scene.background = new THREE.Color(0xca6f1e).lerp(new THREE.Color(0x87ceeb), sinT * 0.45);
      this.scene.fog.color = new THREE.Color(0x935116).lerp(new THREE.Color(0xd4ac0d), sinT * 0.5);
    } else if (sinT > -0.15) {
      // Golden Hour & Crimson Dusk
      this.sunLight.intensity = 1.0;
      this.ambientLight.intensity = 0.65;
      this.sunLight.color.setHex(0xf39c12);
      this.scene.background = new THREE.Color(0x922b21).lerp(new THREE.Color(0xca6f1e), 0.5);
      this.scene.fog.color = new THREE.Color(0x78281f);
    } else {
      // Atmospheric Starlit Night / Moonlit Bagan
      this.sunLight.intensity = 0.55;
      this.ambientLight.intensity = 0.5;
      this.sunLight.color.setHex(0x5dade2); // Cool moonlight
      this.scene.background = new THREE.Color(0x1a252f);
      this.scene.fog.color = new THREE.Color(0x17202a);
    }
  }
}
