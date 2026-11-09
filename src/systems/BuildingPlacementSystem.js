import * as THREE from 'three';
import { House } from '../entities/buildings/House.js';
import { Palace } from '../entities/buildings/Palace.js';
import { Barracks } from '../entities/buildings/Barracks.js';
import { Blacksmith } from '../entities/buildings/Blacksmith.js';
import { Stables } from '../entities/buildings/Stables.js';
import { ElephantPen } from '../entities/buildings/ElephantPen.js';
import { Pagoda } from '../entities/buildings/Pagoda.js';
import { Watchtower } from '../entities/buildings/Watchtower.js';
import { Wall } from '../entities/buildings/Wall.js';
import { Gate } from '../entities/buildings/Gate.js';

export class BuildingPlacementSystem {
  constructor(game) {
    this.game = game;
    this.isPlacing = false;
    this.currentBuildingType = null;
    this.ghostMesh = null;

    this.raycaster = new THREE.Raycaster();
    this.mouse = new THREE.Vector2();

    this.setupListeners();
  }

  setupListeners() {
    window.addEventListener('mousemove', (e) => {
      if (!this.isPlacing || !this.ghostMesh) return;

      this.mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
      this.mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;
      this.raycaster.setFromCamera(this.mouse, this.game.camera);

      const hit = this.raycaster.intersectObject(this.game.terrain.groundMesh);
      if (hit.length > 0) {
        // Snap to grid (2x2 units)
        const snap = 2;
        const x = Math.round(hit[0].point.x / snap) * snap;
        const z = Math.round(hit[0].point.z / snap) * snap;
        this.ghostMesh.position.set(x, 0, z);
      }
    });

    window.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.isPlacing) {
        this.cancelPlacement();
      }
    });
  }

  checkPrerequisites(type) {
    const playerBuildings = this.game.buildings.filter(b => b.faction === 'player');
    const hasType = (t) => playerBuildings.some(b => b.type === t);

    if (type === 'house' || type === 'barracks' || type === 'wall') {
      if (!hasType('palace')) return { allowed: false, reqName: 'ရွှေနန်းတော်', reason: 'ရွှေနန်းတော် (Palace) လိုအပ်ပါသည်!' };
    } else if (type === 'watchtower' || type === 'gate') {
      if (!hasType('barracks')) return { allowed: false, reqName: 'စစ်သည်တပ်ရုံ', reason: 'စစ်သည်တပ်ရုံ (Barracks) အရင်ဆောက်ရန် လိုအပ်ပါသည်!' };
    } else if (type === 'blacksmith') {
      if (!hasType('barracks')) return { allowed: false, reqName: 'စစ်သည်တပ်ရုံ', reason: 'စစ်သည်တပ်ရုံ (Barracks) အရင်ဆောက်ရန် လိုအပ်ပါသည်!' };
    } else if (type === 'stables') {
      if (!hasType('barracks')) return { allowed: false, reqName: 'စစ်သည်တပ်ရုံ', reason: 'စစ်သည်တပ်ရုံ (Barracks) အရင်ဆောက်ရန် လိုအပ်ပါသည်!' };
      if (!hasType('blacksmith')) return { allowed: false, reqName: 'ပန်းပဲဖို', reason: 'ပန်းပဲဖိုနှင့် လက်နက်တိုက် (Blacksmith) လိုအပ်ပါသည်!' };
    } else if (type === 'elephant_pen') {
      if (!hasType('stables')) return { allowed: false, reqName: 'မြင်းတပ်စခန်း', reason: 'မြင်းတပ်စခန်း (Stables) အရင်ဆောက်ရန် လိုအပ်ပါသည်!' };
      if (!hasType('blacksmith')) return { allowed: false, reqName: 'ပန်းပဲဖို', reason: 'ပန်းပဲဖိုနှင့် လက်နက်တိုက် (Blacksmith) လိုအပ်ပါသည်!' };
    } else if (type === 'pagoda') {
      if (!hasType('barracks')) return { allowed: false, reqName: 'စစ်သည်တပ်ရုံ', reason: 'စစ်သည်တပ်ရုံ (Barracks) အရင်ဆောက်ရန် လိုအပ်ပါသည်!' };
    }
    return { allowed: true };
  }

  startPlacement(type) {
    // Check tech tree prerequisite
    const req = this.checkPrerequisites(type);
    if (!req.allowed) {
      if (this.game.hud) {
        this.game.hud.showNotification(`🔒 ${req.reason}`, 'warning');
      } else {
        alert(`အဆောက်အအုံ လိုအပ်ချက်: ${req.reason}`);
      }
      return;
    }

    if (!this.game.economySystem.canAfford(type)) {
      if (this.game.hud) {
        this.game.hud.showNotification('⚠️ ကုန်ကြမ်း သယံဇာတ မလုံလောက်သေးပါ!', 'warning');
      } else {
        alert('စားနပ်ရိက္ခာ (သို့မဟုတ်) သစ်/ကျောက်/ရွှေ မလုံလောက်ပါ!');
      }
      return;
    }

    this.cancelPlacement();
    this.isPlacing = true;
    this.currentBuildingType = type;

    // Create semi-transparent green ghost preview
    const size = (type === 'palace' || type === 'elephant_pen') ? 5 : (type === 'pagoda' || type === 'stables' ? 4 : (type === 'gate' ? 3.5 : (type === 'watchtower' ? 3.0 : (type === 'wall' ? 2.0 : (type === 'house' ? 2.5 : 3.5)))));
    const geo = new THREE.BoxGeometry(size, 2.5, size);
    const mat = new THREE.MeshBasicMaterial({
      color: 0x2ecc71,
      transparent: true,
      opacity: 0.5,
      wireframe: false
    });

    this.ghostMesh = new THREE.Mesh(geo, mat);
    this.ghostMesh.position.y = 1.25;
    this.game.scene.add(this.ghostMesh);

    // Highlight button in UI
    document.querySelectorAll('.build-card').forEach(btn => {
      if (btn.dataset.build === type) btn.classList.add('active');
    });
  }

  confirmPlacement() {
    if (!this.isPlacing || !this.ghostMesh) return;

    if (!this.game.economySystem.deduct(this.currentBuildingType)) {
      this.cancelPlacement();
      return;
    }

    const pos = this.ghostMesh.position;
    let newBuilding = null;

    const durationByType = {
      wall: 2.5,
      gate: 4.5,
      house: 5.5,
      watchtower: 6.5,
      barracks: 7.5,
      blacksmith: 8.0,
      stables: 8.5,
      elephant_pen: 10.0,
      pagoda: 10.0,
      palace: 12.0
    };
    const dur = durationByType[this.currentBuildingType] || 6.0;
    const bOpts = { x: pos.x, z: pos.z, underConstruction: true, constructionDuration: dur };

    switch (this.currentBuildingType) {
      case 'house':
        newBuilding = new House(this.game, bOpts);
        break;
      case 'palace':
        newBuilding = new Palace(this.game, bOpts);
        break;
      case 'barracks':
        newBuilding = new Barracks(this.game, bOpts);
        break;
      case 'blacksmith':
        newBuilding = new Blacksmith(this.game, bOpts);
        break;
      case 'stables':
        newBuilding = new Stables(this.game, bOpts);
        break;
      case 'elephant_pen':
        newBuilding = new ElephantPen(this.game, bOpts);
        break;
      case 'pagoda':
        newBuilding = new Pagoda(this.game, bOpts);
        break;
      case 'watchtower':
        newBuilding = new Watchtower(this.game, bOpts);
        break;
      case 'wall':
        newBuilding = new Wall(this.game, bOpts);
        break;
      case 'gate':
        newBuilding = new Gate(this.game, bOpts);
        break;
    }

    if (newBuilding) {
      this.game.buildings.push(newBuilding);
      this.playPlacementEffect(pos);

      // Assign builder villager(s)
      let builders = [];
      if (this.game.selectionSystem && this.game.selectionSystem.selectedUnits.length > 0) {
        builders = this.game.selectionSystem.selectedUnits.filter(u => u.type === 'villager');
      }
      if (builders.length === 0) {
        let closestV = null;
        let minD = Infinity;
        for (const u of this.game.units) {
          if (u.faction === 'player' && u.type === 'villager') {
            const d = u.mesh.position.distanceTo(pos);
            if (d < minD) {
              minD = d;
              closestV = u;
            }
          }
        }
        if (closestV) builders.push(closestV);
      }

      builders.forEach(v => {
        v.assignBuild(newBuilding);
      });

      if (this.game.hud) {
        this.game.hud.showNotification(`🔨 ${builders.length > 0 ? 'လုပ်သားများ' : ''} ${newBuilding.name} စတင်ဆောက်လုပ်နေပါသည်`, 'info');
      }

      // Refresh HUD if a villager is currently selected so newly unlocked buildings become active immediately
      if (this.game.selectionSystem && this.game.hud) {
        this.game.hud.updateSelectionPanel({
          selectedUnits: this.game.selectionSystem.selectedUnits,
          selectedBuilding: this.game.selectionSystem.selectedBuilding,
          selectedResource: this.game.selectionSystem.selectedResource
        });
      }
    }

    this.cancelPlacement();
  }

  cancelPlacement() {
    this.isPlacing = false;
    this.currentBuildingType = null;

    if (this.ghostMesh) {
      this.game.scene.remove(this.ghostMesh);
      this.ghostMesh.geometry.dispose();
      this.ghostMesh.material.dispose();
      this.ghostMesh = null;
    }

    document.querySelectorAll('.build-card').forEach(b => b.classList.remove('active'));
  }

  playPlacementEffect(pos) {
    // Dust ring burst effect
    const ringGeo = new THREE.RingGeometry(2, 4.5, 32);
    const ringMat = new THREE.MeshBasicMaterial({
      color: 0xf5b041,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.8
    });
    const dust = new THREE.Mesh(ringGeo, ringMat);
    dust.rotation.x = -Math.PI / 2;
    dust.position.set(pos.x, 0.1, pos.z);
    this.game.scene.add(dust);

    let op = 0.8;
    const interval = setInterval(() => {
      op -= 0.08;
      dust.scale.multiplyScalar(1.05);
      ringMat.opacity = op;
      if (op <= 0) {
        clearInterval(interval);
        this.game.scene.remove(dust);
      }
    }, 30);
  }
}
