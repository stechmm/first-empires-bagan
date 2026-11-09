import * as THREE from 'three';

export class FogOfWarSystem {
  constructor(game, worldSize = 220, resolution = 128) {
    this.game = game;
    this.worldSize = worldSize;
    this.res = resolution;

    // Grid states: 0 = Unexplored (Black), 1 = Explored (Fog), 2 = Active Vision (Clear)
    this.grid = new Uint8Array(this.res * this.res);

    // Offscreen Canvas for dynamic texture
    this.canvas = document.createElement('canvas');
    this.canvas.width = this.res;
    this.canvas.height = this.res;
    this.ctx = this.canvas.getContext('2d');

    // Fill initial canvas with black (unexplored)
    this.ctx.fillStyle = '#000000';
    this.ctx.fillRect(0, 0, this.res, this.res);

    this.texture = new THREE.CanvasTexture(this.canvas);
    this.texture.generateMipmaps = false;
    this.texture.minFilter = THREE.LinearFilter;
    this.texture.magFilter = THREE.LinearFilter;

    // Do NOT add an ugly flat black plane on the 3D battlefield.
    // The 3D world stays clean, visible, and atmospheric.
    // Fog of war is used for hiding enemy units/buildings and rendering the minimap shroud.
    this.fogMesh = null;

    this.updateTimer = 0;
    this.updateInterval = 0.08; // ~12 fps for smooth performance
  }

  worldToGrid(wx, wz) {
    const half = this.worldSize / 2;
    const gx = Math.floor(((wx + half) / this.worldSize) * this.res);
    const gy = Math.floor(((wz + half) / this.worldSize) * this.res);
    return {
      x: THREE.MathUtils.clamp(gx, 0, this.res - 1),
      y: THREE.MathUtils.clamp(gy, 0, this.res - 1)
    };
  }

  isInVision(wx, wz) {
    const pt = this.worldToGrid(wx, wz);
    return this.grid[pt.y * this.res + pt.x] === 2;
  }

  isExplored(wx, wz) {
    const pt = this.worldToGrid(wx, wz);
    return this.grid[pt.y * this.res + pt.x] >= 1;
  }

  revealArea(wx, wz, radiusMeters) {
    const center = this.worldToGrid(wx, wz);
    const gridRadius = Math.ceil((radiusMeters / this.worldSize) * this.res);
    const r2 = gridRadius * gridRadius;

    for (let dy = -gridRadius; dy <= gridRadius; dy++) {
      const gy = center.y + dy;
      if (gy < 0 || gy >= this.res) continue;

      for (let dx = -gridRadius; dx <= gridRadius; dx++) {
        const gx = center.x + dx;
        if (gx < 0 || gx >= this.res) continue;

        if (dx * dx + dy * dy <= r2) {
          const idx = gy * this.res + gx;
          this.grid[idx] = 2; // Active Vision
        }
      }
    }
  }

  update(delta) {
    this.updateTimer += delta;
    if (this.updateTimer < this.updateInterval) return;
    this.updateTimer = 0;

    // Step 1: Demote active vision (2) to explored fog (1)
    for (let i = 0; i < this.grid.length; i++) {
      if (this.grid[i] === 2) {
        this.grid[i] = 1;
      }
    }

    // Step 2: Reveal vision around player units
    for (const unit of this.game.units) {
      if (unit.faction !== 'player') continue;
      let visionRange = 16;
      if (unit.type === 'cavalry') visionRange = 26; // High scout vision
      else if (unit.type === 'archer') visionRange = 20;
      else if (unit.type === 'elephant') visionRange = 18;
      else if (unit.type === 'villager') visionRange = 14;

      this.revealArea(unit.mesh.position.x, unit.mesh.position.z, visionRange);
    }

    // Reveal vision around player buildings
    for (const bld of this.game.buildings) {
      if (bld.faction !== 'player') continue;
      const bVision = bld.type === 'palace' ? 28 : (bld.type === 'watchtower' ? 32 : 20);
      this.revealArea(bld.mesh.position.x, bld.mesh.position.z, bVision);
    }

    // Step 3: Redraw Canvas Image Data
    const imgData = this.ctx.createImageData(this.res, this.res);
    const data = imgData.data;

    for (let i = 0; i < this.grid.length; i++) {
      const state = this.grid[i];
      const p = i * 4;
      data[p] = 16;     // R
      data[p + 1] = 12; // G
      data[p + 2] = 8;  // B

      if (state === 0) {
        // Unexplored (soft atmospheric parchment shadow on minimap)
        data[p + 3] = 125;
      } else if (state === 1) {
        // Explored but in fog (semi-transparent veil)
        data[p + 3] = 45;
      } else {
        // Active Vision (fully transparent clear terrain)
        data[p + 3] = 0;
      }
    }

    this.ctx.putImageData(imgData, 0, 0);
    this.texture.needsUpdate = true;

    // Step 4: Hide enemy units that are not inside active vision
    for (const unit of this.game.units) {
      if (unit.faction === 'enemy') {
        const inSight = this.isInVision(unit.mesh.position.x, unit.mesh.position.z);
        unit.mesh.visible = inSight;
        if (unit.selectionRing) unit.selectionRing.visible = inSight && unit.isSelected;
      }
    }

    // Enemy buildings are visible if explored at least once
    for (const bld of this.game.buildings) {
      if (bld.faction === 'enemy') {
        const explored = this.isExplored(bld.mesh.position.x, bld.mesh.position.z);
        bld.mesh.visible = explored;
      }
    }
  }

  reset() {
    this.grid.fill(0);
    this.ctx.fillStyle = '#000000';
    this.ctx.fillRect(0, 0, this.res, this.res);
    this.texture.needsUpdate = true;
  }
}
