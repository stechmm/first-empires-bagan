import * as THREE from 'three';

export class SelectionSystem {
  constructor(game) {
    this.game = game;
    this.raycaster = new THREE.Raycaster();
    this.mouse = new THREE.Vector2();

    this.isDragging = false;
    this.dragStart = { x: 0, y: 0 };
    this.dragEnd = { x: 0, y: 0 };
    this.boxEl = document.getElementById('selection-box');

    this.selectedUnits = [];
    this.selectedBuilding = null;

    this.touchMode = 'select'; // 'select', 'box', 'attack'
    this.currentFormation = 'line'; // 'line', 'wedge', 'box'
    this.currentStance = 'aggressive'; // 'aggressive', 'defensive', 'stand_ground'

    this.setupMouseEvents();
  }

  setFormation(f) {
    this.currentFormation = f;
    const names = { line: 'တန်းစီစစ်ဗျူဟာ (Line)', wedge: 'ဆင်စွယ်စစ်ဗျူဟာ (Wedge)', box: 'အကာအကွယ် စစ်ဗျူဟာ (Box)' };
    if (this.game.hud) {
      this.game.hud.showFloatingText(`စစ်ဗျူဟာ: ${names[f] || f}`, new THREE.Vector3(0, 5, 0), '#f1c40f');
    }
  }

  setStance(s) {
    this.currentStance = s;
    this.selectedUnits.forEach(u => {
      u.stance = s;
    });
    const names = { aggressive: 'တိုက်ခိုက်စစ် (Aggressive)', defensive: 'နယ်မြေစောင့် (Defensive)', stand_ground: 'နေရာမရွေ့ (Stand)' };
    if (this.game.hud) {
      this.game.hud.showFloatingText(`အမိန့်: ${names[s] || s}`, new THREE.Vector3(0, 5, 0), '#2ecc71');
    }
  }

  setupMouseEvents() {
    const dom = this.game.renderer.domElement;

    // Desktop Mouse Down
    dom.addEventListener('mousedown', (e) => {
      if (e.button === 0) { // Left Click
        if (this.game.placementSystem.isPlacing) {
          this.game.placementSystem.confirmPlacement();
          return;
        }

        this.isDragging = true;
        this.dragStart = { x: e.clientX, y: e.clientY };
        this.dragEnd = { x: e.clientX, y: e.clientY };
        this.updateBoxElement();
        this.boxEl.classList.remove('hidden');
      } else if (e.button === 2) { // Right Click
        e.preventDefault();
        if (this.game.placementSystem.isPlacing) {
          this.game.placementSystem.cancelPlacement();
          return;
        }
        this.handleRightClick(e.clientX, e.clientY);
      }
    });

    // Mouse Move
    window.addEventListener('mousemove', (e) => {
      if (this.isDragging) {
        this.dragEnd = { x: e.clientX, y: e.clientY };
        this.updateBoxElement();
      }
    });

    // Mouse Up
    window.addEventListener('mouseup', (e) => {
      if (e.button === 0 && this.isDragging) {
        this.isDragging = false;
        this.boxEl.classList.add('hidden');

        const dist = Math.hypot(this.dragEnd.x - this.dragStart.x, this.dragEnd.y - this.dragStart.y);
        if (dist > 8) {
          // Box Selection
          this.selectUnitsInBox(this.dragStart, this.dragEnd);
        } else {
          // Single Click Selection
          this.handleSingleClick(e.clientX, e.clientY);
        }
      }
    });

    // Prevent context menu
    dom.addEventListener('contextmenu', (e) => e.preventDefault());

    // Mobile / Touch Tap handling
    dom.addEventListener('touchstart', (e) => {
      if (e.touches.length === 1) {
        const touch = e.touches[0];
        this.dragStart = { x: touch.clientX, y: touch.clientY };
        this.dragEnd = { x: touch.clientX, y: touch.clientY };

        if (this.touchMode === 'box') {
          this.isDragging = true;
          this.updateBoxElement();
          this.boxEl.classList.remove('hidden');
        }
      }
    });

    dom.addEventListener('touchmove', (e) => {
      if (e.touches.length === 1 && this.isDragging && this.touchMode === 'box') {
        const touch = e.touches[0];
        this.dragEnd = { x: touch.clientX, y: touch.clientY };
        this.updateBoxElement();
      }
    });

    dom.addEventListener('touchend', (e) => {
      if (this.isDragging && this.touchMode === 'box') {
        this.isDragging = false;
        this.boxEl.classList.add('hidden');
        this.selectUnitsInBox(this.dragStart, this.dragEnd);
      } else if (e.changedTouches.length === 1) {
        const touch = e.changedTouches[0];
        const dist = Math.hypot(touch.clientX - this.dragStart.x, touch.clientY - this.dragStart.y);
        if (dist < 10) {
          if (this.game.placementSystem.isPlacing) {
            this.game.placementSystem.confirmPlacement();
          } else if (this.selectedUnits.length > 0) {
            // If already have units selected, tap orders them to move
            this.handleRightClick(touch.clientX, touch.clientY);
          } else {
            this.handleSingleClick(touch.clientX, touch.clientY);
          }
        }
      }
    });
  }

  updateBoxElement() {
    const x = Math.min(this.dragStart.x, this.dragEnd.x);
    const y = Math.min(this.dragStart.y, this.dragEnd.y);
    const w = Math.abs(this.dragEnd.x - this.dragStart.x);
    const h = Math.abs(this.dragEnd.y - this.dragStart.y);

    this.boxEl.style.left = `${x}px`;
    this.boxEl.style.top = `${y}px`;
    this.boxEl.style.width = `${w}px`;
    this.boxEl.style.height = `${h}px`;
  }

  handleSingleClick(screenX, screenY) {
    this.clearSelection();

    this.mouse.x = (screenX / window.innerWidth) * 2 - 1;
    this.mouse.y = -(screenY / window.innerHeight) * 2 + 1;
    this.raycaster.setFromCamera(this.mouse, this.game.camera);

    // Check units first
    for (const unit of this.game.units) {
      const intersects = this.raycaster.intersectObjects(unit.mesh.children, true);
      if (intersects.length > 0) {
        this.selectUnit(unit);
        return;
      }
    }

    // Check buildings
    for (const bld of this.game.buildings) {
      const intersects = this.raycaster.intersectObjects(bld.mesh.children, true);
      if (intersects.length > 0) {
        this.selectBuilding(bld);
        return;
      }
    }

    // Check resource nodes
    for (const res of this.game.resourceNodes) {
      const intersects = this.raycaster.intersectObjects(res.mesh.children, true);
      if (intersects.length > 0) {
        this.selectResource(res);
        return;
      }
    }
  }

  selectUnitsInBox(start, end) {
    this.clearSelection();

    const minX = Math.min(start.x, end.x);
    const maxX = Math.max(start.x, end.x);
    const minY = Math.min(start.y, end.y);
    const maxY = Math.max(start.y, end.y);

    const camera = this.game.camera;
    const width = window.innerWidth;
    const height = window.innerHeight;

    for (const unit of this.game.units) {
      if (unit.faction !== 'player') continue;

      const screenPos = unit.mesh.position.clone().project(camera);
      const x = ((screenPos.x + 1) * width) / 2;
      const y = ((-screenPos.y + 1) * height) / 2;

      if (x >= minX && x <= maxX && y >= minY && y <= maxY) {
        this.selectUnit(unit, true);
      }
    }

    this.game.eventBus.emit('selection-changed', {
      units: this.selectedUnits,
      building: null
    });
  }

  selectUnit(unit, isMulti = false) {
    if (!isMulti) this.clearSelection();
    unit.setSelected(true);
    this.selectedUnits.push(unit);

    this.game.eventBus.emit('selection-changed', {
      units: this.selectedUnits,
      building: null
    });
  }

  selectBuilding(building) {
    this.clearSelection();
    building.setSelected(true);
    this.selectedBuilding = building;

    this.game.eventBus.emit('selection-changed', {
      units: [],
      building: this.selectedBuilding
    });
  }

  selectResource(resource) {
    this.clearSelection();
    resource.setSelected(true);
    this.selectedResource = resource;

    this.game.eventBus.emit('selection-changed', {
      units: [],
      building: null,
      resource: this.selectedResource
    });
  }

  clearSelection() {
    this.selectedUnits.forEach(u => u.setSelected(false));
    this.selectedUnits = [];

    if (this.selectedBuilding) {
      this.selectedBuilding.setSelected(false);
      this.selectedBuilding = null;
    }

    if (this.selectedResource) {
      this.selectedResource.setSelected(false);
      this.selectedResource = null;
    }

    this.game.eventBus.emit('selection-changed', { units: [], building: null, resource: null });
  }

  handleRightClick(screenX, screenY) {
    this.mouse.x = (screenX / window.innerWidth) * 2 - 1;
    this.mouse.y = -(screenY / window.innerHeight) * 2 + 1;
    this.raycaster.setFromCamera(this.mouse, this.game.camera);

    // If a production building is selected, right-click sets the Rally Point!
    if (this.selectedBuilding && this.selectedBuilding.faction === 'player' && this.selectedBuilding.setRallyPoint) {
      const hitTerrain = this.raycaster.intersectObject(this.game.terrain.groundMesh);
      if (hitTerrain.length > 0) {
        this.selectedBuilding.setRallyPoint(hitTerrain[0].point);
        this.createTargetMarker(hitTerrain[0].point, 0xf1c40f);
        return;
      }
    }

    if (this.selectedUnits.length === 0) return;

    // Check if right-clicked on an enemy unit
    for (const target of this.game.units) {
      if (target.faction === 'enemy') {
        const hit = this.raycaster.intersectObjects(target.mesh.children, true);
        if (hit.length > 0) {
          this.selectedUnits.forEach(u => u.attackTarget(target));
          this.createTargetMarker(target.mesh.position, 0xe74c3c); // Red target ring
          if (this.game.mpClient && this.game.mpClient.isMultiplayer) {
            this.game.mpClient.sendUnitAttack(this.selectedUnits.map(u => u.id), target.id);
          }
          return;
        }
      }
    }

    // Check if right-clicked on an enemy building
    for (const target of this.game.buildings) {
      if (target.faction === 'enemy') {
        const hit = this.raycaster.intersectObjects(target.mesh.children, true);
        if (hit.length > 0) {
          this.selectedUnits.forEach(u => u.attackTarget(target));
          this.createTargetMarker(target.mesh.position, 0xe74c3c); // Red target ring
          if (this.game.mpClient && this.game.mpClient.isMultiplayer) {
            this.game.mpClient.sendUnitAttack(this.selectedUnits.map(u => u.id), target.id);
          }
          return;
        }
      }
    }

    // Check if right-clicked on an unfinished Player Building (Build order for villagers)
    for (const bld of this.game.buildings) {
      if (bld.faction === 'player' && bld.underConstruction) {
        const hit = this.raycaster.intersectObjects(bld.mesh.children, true);
        if (hit.length > 0) {
          this.selectedUnits.forEach(u => {
            if (u.type === 'villager' && u.assignBuild) {
              u.assignBuild(bld);
            } else {
              u.moveTo(bld.mesh.position);
            }
          });
          this.createTargetMarker(bld.mesh.position, 0xf39c12); // Amber build ring
          return;
        }
      }
    }

    // Check if right-clicked on a Resource Node (Gather order for villagers)
    for (const res of this.game.resourceNodes) {
      const hit = this.raycaster.intersectObjects(res.mesh.children, true);
      if (hit.length > 0) {
        this.selectedUnits.forEach(u => {
          if (u.type === 'villager') {
            u.assignGather(res);
          } else {
            u.moveTo(res.mesh.position);
          }
        });
        this.createTargetMarker(res.mesh.position, 0xf1c40f); // Gold gather ring
        return;
      }
    }

    // Otherwise move to ground location
    const intersects = this.raycaster.intersectObject(this.game.terrain.groundMesh);
    if (intersects.length > 0) {
      const targetPoint = intersects[0].point;
      this.createTargetMarker(targetPoint, 0x2ecc71); // Green move ring

      // Tactical Formations offset calculation
      const count = this.selectedUnits.length;
      const spacing = 2.4;

      this.selectedUnits.forEach((u, i) => {
        let offsetX = 0;
        let offsetZ = 0;

        if (this.currentFormation === 'line') {
          // Double-rank wide line formation
          const rank = i % 2;
          const col = Math.floor(i / 2) - Math.floor(count / 4);
          offsetX = col * spacing;
          offsetZ = rank * (spacing * 1.2);
        } else if (this.currentFormation === 'wedge') {
          // Arrowhead / V-shape Cavalry Wedge formation
          if (i === 0) {
            offsetX = 0;
            offsetZ = 0;
          } else {
            const side = (i % 2 === 1) ? 1 : -1;
            const rank = Math.ceil(i / 2);
            offsetX = side * rank * spacing;
            offsetZ = rank * spacing;
          }
        } else if (this.currentFormation === 'box') {
          // Guard Box formation
          const angle = (i / count) * Math.PI * 2;
          const radius = Math.max(2.5, Math.sqrt(count) * 1.5);
          offsetX = Math.cos(angle) * radius;
          offsetZ = Math.sin(angle) * radius;
        } else {
          const rowSize = Math.ceil(Math.sqrt(count));
          const row = Math.floor(i / rowSize);
          const col = i % rowSize;
          offsetX = (col - rowSize / 2) * spacing;
          offsetZ = (row - rowSize / 2) * spacing;
        }

        const destPos = {
          x: targetPoint.x + offsetX,
          z: targetPoint.z + offsetZ
        };
        u.moveTo(destPos);

        if (this.game.mpClient && this.game.mpClient.isMultiplayer) {
          this.game.mpClient.sendUnitMove([u.id], destPos);
        }
      });
    }
  }

  createTargetMarker(pos, color) {
    const ringGeo = new THREE.RingGeometry(0.6, 0.8, 16);
    const ringMat = new THREE.MeshBasicMaterial({ color, side: THREE.DoubleSide, transparent: true, opacity: 0.9 });
    const marker = new THREE.Mesh(ringGeo, ringMat);
    marker.rotation.x = -Math.PI / 2;
    marker.position.set(pos.x, 0.1, pos.z);
    this.game.scene.add(marker);

    // Fade out and remove marker
    let opacity = 0.9;
    const fadeInterval = setInterval(() => {
      opacity -= 0.1;
      ringMat.opacity = opacity;
      marker.scale.multiplyScalar(1.04);
      if (opacity <= 0) {
        clearInterval(fadeInterval);
        this.game.scene.remove(marker);
        ringGeo.dispose();
        ringMat.dispose();
      }
    }, 40);
  }
}
