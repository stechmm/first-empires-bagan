import { io } from 'socket.io-client';
import { Villager } from '../entities/Villager.js';
import { Swordsman } from '../entities/Swordsman.js';
import { Archer } from '../entities/Archer.js';
import { Spearman } from '../entities/Spearman.js';
import { Cavalry } from '../entities/Cavalry.js';
import { WarElephant } from '../entities/WarElephant.js';
import { General } from '../entities/General.js';

export class MultiplayerClient {
  constructor(game) {
    this.game = game;
    this.socket = null;
    this.isConnected = false;
    this.isMultiplayer = false;

    this.roomId = null;
    this.role = null; // 'host' (player) or 'guest' (enemy)
    this.myFaction = 'player';
    this.opponentFaction = 'enemy';
    this.playerName = 'မင်းလောင်း';
    this.opponentName = 'ပြိုင်ဘက်မင်း';

    this.ping = 0;
    this.pingInterval = null;

    // Callbacks for Lobby UI
    this.onRoomCreated = null;
    this.onRoomJoined = null;
    this.onGuestJoined = null;
    this.onBattleStart = null;
    this.onJoinError = null;
    this.onMatchmakingQueued = null;
    this.onMatchmakingCancelled = null;
    this.onOpponentLeft = null;
    this.onChatMessage = null;
  }

  connect(serverUrl = window.location.origin) {
    if (this.socket && this.isConnected) return;

    this.socket = io(serverUrl, {
      path: '/socket.io/',
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 5,
      timeout: 10000
    });

    this.socket.on('connect', () => {
      this.isConnected = true;
      console.log(`🏰 [Multiplayer] Connected to server: ${this.socket.id}`);
      this.startPingMeasurement();
    });

    this.socket.on('disconnect', () => {
      this.isConnected = false;
      console.log('🏰 [Multiplayer] Disconnected from server');
      this.stopPingMeasurement();
    });

    // -------------------------------------------------------------
    // Lobby & Matchmaking Events
    // -------------------------------------------------------------
    this.socket.on('room-created', (data) => {
      this.roomId = data.roomId;
      this.role = data.role;
      this.myFaction = data.faction; // 'player'
      this.opponentFaction = 'enemy';
      if (this.onRoomCreated) this.onRoomCreated(data);
    });

    this.socket.on('room-joined', (data) => {
      this.roomId = data.roomId;
      this.role = data.role;
      this.myFaction = data.faction; // 'enemy'
      this.opponentFaction = 'player';
      if (this.onRoomJoined) this.onRoomJoined(data);
    });

    this.socket.on('guest-joined', (data) => {
      this.opponentName = data.guest.name;
      if (this.onGuestJoined) this.onGuestJoined(data);
    });

    this.socket.on('join-error', (data) => {
      if (this.onJoinError) this.onJoinError(data);
    });

    this.socket.on('matchmaking-queued', (data) => {
      if (this.onMatchmakingQueued) this.onMatchmakingQueued(data);
    });

    this.socket.on('matchmaking-cancelled', () => {
      if (this.onMatchmakingCancelled) this.onMatchmakingCancelled();
    });

    this.socket.on('battle-start', (data) => {
      this.isMultiplayer = true;
      if (this.role === 'host') {
        this.myFaction = 'player';
        this.opponentFaction = 'enemy';
        this.opponentName = data.guest.name;
      } else {
        this.myFaction = 'enemy';
        this.opponentFaction = 'player';
        this.opponentName = data.host.name;
      }
      if (this.onBattleStart) this.onBattleStart(data);
    });

    this.socket.on('opponent-left', (data) => {
      if (this.onOpponentLeft) this.onOpponentLeft(data);
      if (this.game.hud) {
        this.game.hud.showNotification(data.message, 'success');
      }
    });

    // -------------------------------------------------------------
    // In-Game Replication Receivers
    // -------------------------------------------------------------
    this.socket.on('mp:building-placed', (data) => {
      this.handleRemoteBuildingPlaced(data);
    });

    this.socket.on('mp:building-upgraded', (data) => {
      this.handleRemoteBuildingUpgraded(data);
    });

    this.socket.on('mp:defense-tower-added', (data) => {
      this.handleRemoteDefenseTowerAdded(data);
    });

    this.socket.on('mp:unit-trained', (data) => {
      this.handleRemoteUnitTrained(data);
    });

    this.socket.on('mp:unit-moved', (data) => {
      this.handleRemoteUnitMoved(data);
    });

    this.socket.on('mp:unit-attacked', (data) => {
      this.handleRemoteUnitAttacked(data);
    });

    this.socket.on('mp:hero-war-cry-triggered', (data) => {
      this.handleRemoteHeroWarCry(data);
    });

    this.socket.on('mp:entity-damaged', (data) => {
      this.handleRemoteEntityDamaged(data);
    });

    this.socket.on('mp:entity-destroyed', (data) => {
      this.handleRemoteEntityDestroyed(data);
    });

    this.socket.on('mp:chat-message', (data) => {
      if (this.onChatMessage) this.onChatMessage(data);
      if (this.game.hud) {
        this.game.hud.showFloatingText(`💬 ${data.senderName}: ${data.text}`, { x: 0, y: 5, z: 0 }, '#f1c40f');
      }
    });

    this.socket.on('mp:pong', (startTs) => {
      this.ping = Math.round(Date.now() - startTs);
      const pingEl = document.getElementById('mp-ping-display');
      if (pingEl) pingEl.textContent = `${this.ping}ms`;
    });
  }

  startPingMeasurement() {
    this.stopPingMeasurement();
    this.pingInterval = setInterval(() => {
      if (this.socket && this.isConnected) {
        this.socket.emit('mp:ping', Date.now());
      }
    }, 4000);
  }

  stopPingMeasurement() {
    if (this.pingInterval) {
      clearInterval(this.pingInterval);
      this.pingInterval = null;
    }
  }

  // -------------------------------------------------------------
  // Lobby Actions
  // -------------------------------------------------------------
  createRoom(playerName) {
    this.playerName = playerName || 'မင်းလောင်း';
    this.connect();
    this.socket.emit('create-room', { playerName: this.playerName });
  }

  joinRoom(roomId, playerName) {
    this.playerName = playerName || 'ပြိုင်ဘက်မင်း';
    this.connect();
    this.socket.emit('join-room', { roomId, playerName: this.playerName });
  }

  quickMatch(playerName) {
    this.playerName = playerName || 'သူရဲကောင်း';
    this.connect();
    this.socket.emit('quick-match', { playerName: this.playerName });
  }

  cancelQuickMatch() {
    if (this.socket) {
      this.socket.emit('cancel-quick-match');
    }
  }

  // -------------------------------------------------------------
  // Outbound Emitters (Called by Player actions in Game)
  // -------------------------------------------------------------
  sendBuildingPlaced(building) {
    if (!this.isMultiplayer || !this.socket) return;
    this.socket.emit('mp:place-building', {
      id: building.id,
      type: building.type,
      x: building.mesh.position.x,
      z: building.mesh.position.z,
      faction: this.myFaction,
      tier: building.tier || 1
    });
  }

  sendBuildingUpgraded(building) {
    if (!this.isMultiplayer || !this.socket) return;
    this.socket.emit('mp:upgrade-building', {
      id: building.id,
      tier: building.tier
    });
  }

  sendDefenseTowerAdded(building, slotIndex) {
    if (!this.isMultiplayer || !this.socket) return;
    this.socket.emit('mp:add-defense-tower', {
      buildingId: building.id,
      slotIndex
    });
  }

  sendUnitTrained(unit) {
    if (!this.isMultiplayer || !this.socket) return;
    this.socket.emit('mp:train-unit', {
      id: unit.id,
      type: unit.type,
      subType: unit.subType || null,
      x: unit.mesh.position.x,
      z: unit.mesh.position.z,
      faction: this.myFaction
    });
  }

  sendUnitMove(unitIds, targetPos) {
    if (!this.isMultiplayer || !this.socket) return;
    this.socket.emit('mp:unit-move', {
      unitIds,
      targetPos: { x: targetPos.x, z: targetPos.z }
    });
  }

  sendUnitAttack(unitIds, targetEntityId) {
    if (!this.isMultiplayer || !this.socket) return;
    this.socket.emit('mp:unit-attack', {
      unitIds,
      targetEntityId
    });
  }

  sendHeroWarCry(unitId) {
    if (!this.isMultiplayer || !this.socket) return;
    this.socket.emit('mp:hero-war-cry', { unitId });
  }

  sendDamage(targetId, isUnit, newHp, damageAmount, isCrit) {
    if (!this.isMultiplayer || !this.socket) return;
    this.socket.emit('mp:entity-damage', {
      targetId,
      isUnit,
      newHp,
      damageAmount,
      isCrit
    });
  }

  sendEntityDie(entityId, isUnit) {
    if (!this.isMultiplayer || !this.socket) return;
    this.socket.emit('mp:entity-die', {
      entityId,
      isUnit
    });
  }

  sendChat(text) {
    if (!this.isMultiplayer || !this.socket) return;
    this.socket.emit('mp:chat', {
      text,
      senderName: this.playerName
    });
  }

  // -------------------------------------------------------------
  // Inbound Handlers (Replicate Opponent's Actions Locally)
  // -------------------------------------------------------------
  handleRemoteBuildingPlaced(data) {
    // Construct opponent's building in the game world
    const placementSystem = this.game.buildingPlacementSystem;
    if (!placementSystem) return;

    const buildingClass = placementSystem.getBuildingClass(data.type);
    if (!buildingClass) return;

    const building = new buildingClass(this.game, {
      id: data.id,
      x: data.x,
      z: data.z,
      faction: this.opponentFaction,
      tier: data.tier || 1,
      underConstruction: true
    });

    this.game.buildings.push(building);
    if (this.game.soundSystem) this.game.soundSystem.playHammer();
    if (this.game.hud) {
      this.game.hud.showNotification(`⚔️ ပြိုင်ဘက်က ${building.name} အသစ် စတင်ဆောက်လုပ်နေသည်!`, 'warning');
    }
  }

  handleRemoteBuildingUpgraded(data) {
    const building = this.game.buildings.find(b => b.id === data.id);
    if (building && building.upgrade) {
      building.tier = data.tier - 1; // prepare for upgrade call
      building.upgrade();
    }
  }

  handleRemoteDefenseTowerAdded(data) {
    const building = this.game.buildings.find(b => b.id === data.buildingId);
    if (building && building.addDefenseTower) {
      building.addDefenseTower();
    }
  }

  handleRemoteUnitTrained(data) {
    const unitOpts = {
      id: data.id,
      x: data.x,
      z: data.z,
      faction: this.opponentFaction,
      subType: data.subType
    };

    let unit = null;
    const uType = data.type;
    if (uType === 'villager') unit = new Villager(this.game, unitOpts);
    else if (uType === 'swordsman') unit = new Swordsman(this.game, unitOpts);
    else if (uType === 'archer') unit = new Archer(this.game, unitOpts);
    else if (uType === 'spearman') unit = new Spearman(this.game, unitOpts);
    else if (uType === 'cavalry') unit = new Cavalry(this.game, unitOpts);
    else if (uType === 'elephant') unit = new WarElephant(this.game, unitOpts);
    else if (uType === 'general') unit = new General(this.game, unitOpts);

    if (unit) {
      this.game.units.push(unit);
      if (this.game.hud) {
        this.game.hud.showNotification(`⚔️ ပြိုင်ဘက်က ${unit.name} စစ်သည် အသစ် ထုတ်လုပ်လိုက်သည်!`, 'warning');
      }
    }
  }

  handleRemoteUnitMoved(data) {
    if (!data.unitIds || !data.targetPos) return;
    data.unitIds.forEach(id => {
      const unit = this.game.units.find(u => u.id === id);
      if (unit) {
        unit.moveTo(data.targetPos);
      }
    });
  }

  handleRemoteUnitAttacked(data) {
    const target = this.game.units.find(u => u.id === data.targetEntityId) ||
                   this.game.buildings.find(b => b.id === data.targetEntityId);
    if (!target) return;

    data.unitIds.forEach(id => {
      const attacker = this.game.units.find(u => u.id === id);
      if (attacker) {
        attacker.attackTarget(target);
      }
    });
  }

  handleRemoteHeroWarCry(data) {
    const general = this.game.units.find(u => u.id === data.unitId);
    if (general && general.triggerWarCry) {
      general.triggerWarCry();
    }
  }

  handleRemoteEntityDamaged(data) {
    const entity = data.isUnit
      ? this.game.units.find(u => u.id === data.targetId)
      : this.game.buildings.find(b => b.id === data.targetId);

    if (entity) {
      entity.hp = data.newHp;
      if (entity.updateHpBar) entity.updateHpBar();
    }
  }

  handleRemoteEntityDestroyed(data) {
    const entity = data.isUnit
      ? this.game.units.find(u => u.id === data.entityId)
      : this.game.buildings.find(b => b.id === data.entityId);

    if (entity && entity.destroy) {
      entity.destroy();
    }
  }
}
