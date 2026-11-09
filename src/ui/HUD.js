import { Swordsman } from '../entities/Swordsman.js';
import { Archer } from '../entities/Archer.js';
import { WarElephant } from '../entities/WarElephant.js';
import { Villager } from '../entities/Villager.js';

export class HUD {
  constructor(game) {
    this.game = game;

    this.minimapCanvas = document.getElementById('minimap-canvas');
    this.minimapCtx = this.minimapCanvas ? this.minimapCanvas.getContext('2d') : null;

    this.noSelectionEl = document.getElementById('no-selection');
    this.entityDetailsEl = document.getElementById('entity-details');
    this.entityNameEl = document.getElementById('entity-name');
    this.entityTypeEl = document.getElementById('entity-type');
    this.entityAvatarEl = document.getElementById('entity-avatar');
    this.entityHpBarEl = document.getElementById('entity-hp-bar');
    this.entityHpTextEl = document.getElementById('entity-hp-text');
    this.entitySubinfoEl = document.getElementById('entity-subinfo');
    this.entityActionsEl = document.getElementById('entity-actions');

    this.setupListeners();
    this.setupBuildButtons();
    this.setupMobileDock();
    this.setupTacticalDock();
  }

  setupListeners() {
    // Quick select buttons when idle
    const quickPalaceBtn = document.getElementById('btn-quick-palace');
    const quickVillagerBtn = document.getElementById('btn-quick-villager');

    quickPalaceBtn?.addEventListener('click', () => {
      const palace = this.game.buildings.find(b => b.faction === 'player' && b.type === 'palace');
      if (palace) {
        this.game.selectionSystem.selectBuilding(palace);
        this.game.cameraController.target.x = palace.mesh.position.x;
        this.game.cameraController.target.z = palace.mesh.position.z;
        this.game.cameraController.updateCameraPosition();
      }
    });

    quickVillagerBtn?.addEventListener('click', () => {
      const villager = this.game.units.find(u => u.faction === 'player' && u.type === 'villager');
      if (villager) {
        this.game.selectionSystem.selectUnit(villager);
        this.game.cameraController.target.x = villager.mesh.position.x;
        this.game.cameraController.target.z = villager.mesh.position.z;
        this.game.cameraController.updateCameraPosition();
      } else {
        alert('လက်ရှိတွင် လုပ်သားမရှိသေးပါ။ နန်းတော်မှ အလုပ်သမား ထုတ်လုပ်ပါ!');
      }
    });

    this.game.eventBus.on('selection-changed', (data) => {
      this.updateSelectionPanel(data);
    });

    this.game.eventBus.on('unit-hp-changed', (unit) => {
      if (this.game.selectionSystem.selectedUnits.includes(unit)) {
        this.updateHealthDisplay(unit);
      }
    });

    // Training Queue and Progress Listeners for all unit types
    const ALL_TRAINABLE_UNITS = [
      'villager', 'general', 'swordsman', 'archer', 'spearman',
      'cavalry_raider', 'cavalry_lancer', 'horse_archer',
      'elephant', 'elephant_archer', 'royal_elephant'
    ];

    this.game.eventBus.on('training-queue-updated', (data) => {
      if (this.game.selectionSystem.selectedBuilding === data.building) {
        ALL_TRAINABLE_UNITS.forEach(type => {
          const badge = document.getElementById(`queue-badge-${type}`);
          if (badge) {
            const count = data.building.trainingQueue.filter(t => t === type).length;
            if (count > 0) {
              badge.textContent = count;
              badge.classList.remove('hidden');
            } else {
              badge.classList.add('hidden');
            }
          }
        });
      }
    });

    this.game.eventBus.on('training-progress', (data) => {
      if (this.game.selectionSystem.selectedBuilding === data.building) {
        const currentType = data.building.trainingQueue[0];
        ALL_TRAINABLE_UNITS.forEach(type => {
          const bar = document.getElementById(`queue-progress-bar-${type}`);
          if (bar) {
            bar.style.width = (type === currentType) ? `${data.progress * 100}%` : '0%';
          }
        });
      }
    });

    // Minimap Click to Pan Camera
    if (this.minimapCanvas) {
      this.minimapCanvas.addEventListener('click', (e) => {
        const rect = this.minimapCanvas.getBoundingClientRect();
        const clickX = e.clientX - rect.left;
        const clickY = e.clientY - rect.top;

        const mapRatioX = (clickX / rect.width) - 0.5;
        const mapRatioY = (clickY / rect.height) - 0.5;

        const worldSize = this.game.terrain.size;
        this.game.cameraController.target.x = mapRatioX * worldSize;
        this.game.cameraController.target.z = mapRatioY * worldSize;
        this.game.cameraController.updateCameraPosition();
      });
    }

    // Fullscreen toggle
    const fsBtn = document.getElementById('btn-fullscreen');
    if (fsBtn) {
      fsBtn.addEventListener('click', () => {
        if (!document.fullscreenElement) {
          document.documentElement.requestFullscreen().catch(() => {});
        } else {
          document.exitFullscreen().catch(() => {});
        }
      });
    }

    // Help modal toggle
    const helpBtn = document.getElementById('btn-help');
    const helpModal = document.getElementById('help-modal');
    const closeHelpBtn = document.getElementById('btn-close-help');

    if (helpBtn && helpModal) {
      helpBtn.addEventListener('click', () => helpModal.classList.remove('hidden'));
    }
    if (closeHelpBtn && helpModal) {
      closeHelpBtn.addEventListener('click', () => helpModal.classList.add('hidden'));
    }
  }

  setupBuildButtons() {
    document.querySelectorAll('.build-card').forEach(btn => {
      btn.addEventListener('click', () => {
        const buildType = btn.dataset.build;
        if (buildType) {
          this.game.placementSystem.startPlacement(buildType);
        }
      });
    });
  }

  setupMobileDock() {
    const selectBtn = document.getElementById('btn-touch-select');
    const boxBtn = document.getElementById('btn-touch-box');
    const attackBtn = document.getElementById('btn-touch-attack');

    const setMode = (mode, activeBtn) => {
      this.game.selectionSystem.touchMode = mode;
      [selectBtn, boxBtn, attackBtn].forEach(b => b?.classList.remove('active'));
      activeBtn?.classList.add('active');
    };

    selectBtn?.addEventListener('click', () => setMode('select', selectBtn));
    boxBtn?.addEventListener('click', () => setMode('box', boxBtn));
    attackBtn?.addEventListener('click', () => setMode('attack', attackBtn));
  }

  setupTacticalDock() {
    const powerBtn = document.getElementById('btn-faction-power');
    powerBtn?.addEventListener('click', () => {
      if (this.game.factionPowers) {
        this.game.factionPowers.triggerPower();
      }
    });

    const fLine = document.getElementById('btn-form-line');
    const fWedge = document.getElementById('btn-form-wedge');
    const fBox = document.getElementById('btn-form-box');

    const setFormation = (f, btn) => {
      this.game.selectionSystem.setFormation(f);
      [fLine, fWedge, fBox].forEach(b => b?.classList.remove('active'));
      btn?.classList.add('active');
    };

    fLine?.addEventListener('click', () => setFormation('line', fLine));
    fWedge?.addEventListener('click', () => setFormation('wedge', fWedge));
    fBox?.addEventListener('click', () => setFormation('box', fBox));

    const sAgg = document.getElementById('btn-stance-agg');
    const sDef = document.getElementById('btn-stance-def');
    const sHold = document.getElementById('btn-stance-hold');

    const setStance = (s, btn) => {
      this.game.selectionSystem.setStance(s);
      [sAgg, sDef, sHold].forEach(b => b?.classList.remove('active'));
      btn?.classList.add('active');
    };

    sAgg?.addEventListener('click', () => setStance('aggressive', sAgg));
    sDef?.addEventListener('click', () => setStance('defensive', sDef));
    sHold?.addEventListener('click', () => setStance('stand_ground', sHold));
  }

  updateSelectionPanel(data) {
    const { units, building, resource } = data;

    if ((!units || units.length === 0) && !building && !resource) {
      this.noSelectionEl?.classList.remove('hidden');
      this.entityDetailsEl?.classList.add('hidden');
      if (this.entitySubinfoEl) this.entitySubinfoEl.innerHTML = '';
      return;
    }

    this.noSelectionEl?.classList.add('hidden');
    this.entityDetailsEl?.classList.remove('hidden');
    this.entityActionsEl.innerHTML = '';
    if (this.entitySubinfoEl) this.entitySubinfoEl.innerHTML = '';

    if (units && units.length > 0) {
      const primary = units[0];
      const count = units.length;
      this.entityNameEl.textContent = count > 1 ? `${primary.name} (${count} ဦး)` : primary.name;
      this.entityTypeEl.textContent = count > 1 ? 'အုပ်စုလိုက် တပ်ဖွဲ့များ' : (primary.type === 'general' ? 'တော်ဝင် စစ်သူကြီး (Hero)' : (primary.type === 'villager' ? 'မြို့တည်လုပ်သား' : primary.type));
      
      if (primary.type === 'villager') {
        this.entityAvatarEl.innerHTML = `<img src="./assets/icons/villager.jpg" class="avatar-img" alt="Villager" />`;
        if (this.entitySubinfoEl) {
          this.entitySubinfoEl.innerHTML = '<span style="color:#2ecc71; font-size:0.62rem; font-weight:600;">🔨 ဆောက်လုပ်ရေးအတွက် အဆင်သင့်</span>';
        }

        // Render Build Menu in the center command deck
        const wrapper = document.createElement('div');
        wrapper.className = 'build-deck-wrapper';

        const header = document.createElement('div');
        header.className = 'build-deck-header';
        header.innerHTML = '<span>🔨 ဆောက်လုပ်ရေး မီနူး (ဆောက်မည့် အဆောက်အအုံ ရွေးချယ်ပါ)</span>';
        wrapper.appendChild(header);

        const grid = document.createElement('div');
        grid.className = 'build-deck-grid';

        const BUILD_ITEMS = [
          { id: 'house', name: 'လူနေအိမ်', cost: '🪵60 (+10👥)', icon: '🏡', title: 'လူနေအိမ် - သစ်: 60 (လူဦးရေ အကန့်အသတ် +10 တိုးပေးသည်)' },
          { id: 'barracks', name: 'စစ်သည်တပ်ရုံ', cost: '🪵120 🧱50', icon: '⛺', title: 'စစ်သည်တပ်ရုံ - သစ်: 120, ကျောက်: 50' },
          { id: 'watchtower', name: 'ကင်းစင်', cost: '🪵100 🧱40', icon: '🏹', title: 'ကင်းစင် - သစ်: 100, ကျောက်: 40 (အလိုအလျောက် မြှားပစ် ခံစစ်တာဝါ)' },
          { id: 'blacksmith', name: 'ပန်းပဲဖို', cost: '🪵140 🧱80 🪙30', icon: '🔥', title: 'ပန်းပဲဖို - သစ်: 140, ကျောက်: 80, ရွှေ: 30' },
          { id: 'stables', name: 'မြင်းတပ်စခန်း', cost: '🪵160 🧱60 🪙40', icon: '🐎', title: 'မြင်းတပ်စခန်း - သစ်: 160, ကျောက်: 60, ရွှေ: 40' },
          { id: 'elephant_pen', name: 'ဆင်တင်းတော်', cost: '🪵220 🧱100 🪙80', icon: '🐘', title: 'ဆင်တင်းတော် - သစ်: 220, ကျောက်: 100, ရွှေ: 80' },
          { id: 'pagoda', name: 'မဟာစေတီ', cost: '🧱150 🪙60', icon: '🛕', title: 'မဟာစေတီတော် - ကျောက်: 150, ရွှေ: 60' },
          { id: 'wall', name: 'မြို့ရိုး', cost: '🪵10', icon: '🪵', title: 'သစ်တပ်မြို့ရိုး - သစ်: 10 (ရန်သူများ ဝင်ရောက်မှု တားဆီးရန်)' },
          { id: 'gate', name: 'မြို့တံခါး', cost: '🪵50 🧱20', icon: '⛩️', title: 'သစ်တပ် တံခါးကြီး - သစ်: 50, ကျောက်: 20' }
        ];

        BUILD_ITEMS.forEach(b => {
          const btn = document.createElement('button');
          const req = this.game.placementSystem ? this.game.placementSystem.checkPrerequisites(b.id) : { allowed: true };
          const isUnlocked = req.allowed;
          const isPlacingThis = this.game.placementSystem && this.game.placementSystem.isPlacing && this.game.placementSystem.currentBuildingType === b.id;

          btn.className = `build-card ${isPlacingThis ? 'active' : ''} ${!isUnlocked ? 'locked' : ''}`;
          btn.dataset.build = b.id;

          if (isUnlocked) {
            btn.title = b.title;
            btn.innerHTML = `
              <span class="build-icon">${b.icon}</span>
              <div class="build-info-text">
                <span class="build-name">${b.name}</span>
                <span class="build-cost">${b.cost}</span>
              </div>
            `;
            btn.onclick = (e) => {
              e.stopPropagation();
              this.game.placementSystem.startPlacement(b.id);
              grid.querySelectorAll('.build-card').forEach(c => c.classList.remove('active'));
              btn.classList.add('active');
            };
          } else {
            // Locked / Dimmed card state (ဆောက်လုပ်ခွင့်မပွင့်သေးပါက မှိန်ထားရန်)
            btn.title = `🔒 မပွင့်သေးပါ (${req.reason})`;
            btn.innerHTML = `
              <div class="build-icon-container">
                <span class="build-icon locked-icon">${b.icon}</span>
                <span class="lock-badge">🔒</span>
              </div>
              <div class="build-info-text">
                <span class="build-name locked-name">${b.name}</span>
                <span class="build-req-tag">🔒 ${req.reqName || 'ကြိုတင်'} လိုအပ်</span>
              </div>
            `;
            btn.onclick = (e) => {
              e.stopPropagation();
              this.showNotification(`🔒 ${b.name} မပွင့်သေးပါ (${req.reason})`, 'warning');
              btn.classList.add('shake-lock');
              setTimeout(() => btn.classList.remove('shake-lock'), 400);
            };
          }

          grid.appendChild(btn);
        });

        wrapper.appendChild(grid);
        this.entityActionsEl.appendChild(wrapper);
      } else if (primary.type === 'swordsman') {
        this.entityAvatarEl.innerHTML = `<img src="./assets/icons/swordsman.png" class="avatar-img" alt="Swordsman" />`;
      } else {
        this.entityAvatarEl.textContent = primary.type === 'general' ? '👑' : (primary.type === 'elephant' ? '🐘' : (primary.type === 'archer' ? '🏹' : (primary.type === 'cavalry' ? '🐎' : '🗡️')));
      }

      this.updateHealthDisplay(primary);

      // Hero General Active Ability Button & Subinfo
      if (primary.type === 'general') {
        if (this.entitySubinfoEl) {
          this.entitySubinfoEl.innerHTML = '<span style="color:#f1c40f; font-size:0.62rem; font-weight:600;">👑 တပ်မဟာ အမိန့်ပေး အရှိန်အဝါ (+20% တိုက်ခိုက်ရေး)</span>';
        }
        if (primary.triggerWarCry) {
          const warCryBtn = document.createElement('button');
          warCryBtn.className = 'action-btn unit-recruit-card';
          warCryBtn.style.background = 'linear-gradient(135deg, #78281f 0%, #b7950b 100%)';
          warCryBtn.innerHTML = `
            <div class="thumb-container">
              <span style="font-size: 20px;">👑</span>
            </div>
            <div class="recruit-text-box">
              <span class="recruit-title">စစ်သူကြီး ကြုံးဝါးသံ</span>
              <span class="recruit-cost">+80 HP & +40% အမြန်နှုန်း</span>
            </div>
          `;
          warCryBtn.onclick = () => {
            primary.triggerWarCry();
          };
          this.entityActionsEl.appendChild(warCryBtn);
        }
      } else if (primary.type !== 'villager') {
        if (this.entitySubinfoEl) {
          this.entitySubinfoEl.innerHTML = `<span style="color:#bdc3c7; font-size:0.62rem;">⚔️ တိုက်ခိုက်မှု: ${primary.attackDamage || 15} | အကွာအဝေး: ${primary.attackRange || 2}m</span>`;
        }
      }
    } else if (building) {
      this.entityNameEl.textContent = building.name;
      this.entityTypeEl.textContent = 'တော်ဝင် အဆောက်အအုံ';
      this.entityAvatarEl.textContent = building.type === 'palace' ? '🏛️' : (building.type === 'pagoda' ? '🛕' : (building.type === 'stables' ? '🐎' : (building.type === 'elephant_pen' ? '🐘' : (building.type === 'blacksmith' ? '🔥' : (building.type === 'watchtower' ? '🏹' : '⛺')))));
      this.updateHealthDisplay(building);

      // Show 3D Rally Flag tip for production buildings
      if (['palace', 'barracks', 'stables', 'elephant_pen'].includes(building.type)) {
        if (this.entitySubinfoEl) {
          this.entitySubinfoEl.innerHTML = '<span class="rally-point-indicator" title="မြေပြင်ပေါ် Right-Click (သို့မဟုတ် Tap) နှိပ်၍ စစ်သည်စုရပ်နေရာ ရွှေ့ပါ">🚩 စုရပ်အလံ: မြေပြင်ပေါ် Right-Click နှိပ်ပါ</span>';
        }
      }

      const makeRecruitBtn = (unitType, label, costStr, icon) => {
        const btn = document.createElement('button');
        btn.className = 'action-btn unit-recruit-card';
        btn.id = `recruit-btn-${unitType}`;
        const queueCount = building.trainingQueue ? building.trainingQueue.filter(t => t === unitType).length : 0;
        btn.innerHTML = `
          <div class="thumb-container">
            <span style="font-size: 20px;">${icon}</span>
            <div id="queue-badge-${unitType}" class="queue-badge ${queueCount > 0 ? '' : 'hidden'}">${queueCount}</div>
            <div id="queue-progress-bar-${unitType}" class="queue-progress-bar"></div>
          </div>
          <div class="recruit-text-box">
            <span class="recruit-title">${label}</span>
            <span class="recruit-cost">${costStr}</span>
          </div>
        `;
        btn.onclick = () => {
          if (building.trainingQueue.length >= 10) {
            alert('အများဆုံး ၁၀ ယောက်အထိသာ တန်းစီနိုင်ပါသည်!');
            return;
          }
          building.queueUnit(unitType);
        };
        this.entityActionsEl.appendChild(btn);
      };

      // Production Buttons per Building Type
      if (building.type === 'palace') {
        makeRecruitBtn('villager', '+ လုပ်သား', '🌾50', '🌾');

        // General Kyansittha hero unit (Requires Blacksmith, max 1)
        const hasBlacksmith = this.game.buildings.some(b => b.faction === 'player' && b.type === 'blacksmith');
        const hasGeneral = this.game.units.some(u => u.faction === 'player' && u.type === 'general') ||
                           building.trainingQueue.includes('general');

        if (hasBlacksmith && !hasGeneral) {
          makeRecruitBtn('general', '+ ကျန်စစ်သား စစ်သူကြီး', '🌾150 🪵80 🪙100', '👑');
        }
      } else if (building.type === 'barracks') {
        makeRecruitBtn('swordsman', '+ ဓားကိုင်', '🌾50 🪵20', '🗡️');
        makeRecruitBtn('archer', '+ လေးသည်', '🌾40 🪵45', '🏹');
        makeRecruitBtn('spearman', '+ လှံရှည်တပ်', '🌾50 🪵30', '🔱');
      } else if (building.type === 'stables') {
        makeRecruitBtn('cavalry_raider', '+ ဓားကိုင်မြင်း', '🌾70 🪵30 🪙20', '🐎');
        makeRecruitBtn('cavalry_lancer', '+ လှံကိုင်မြင်း', '🌾80 🪵45 🪙30', '🏇');
        makeRecruitBtn('horse_archer', '+ မြင်းစီးလေး', '🌾60 🪵60 🪙25', '🏹');
      } else if (building.type === 'elephant_pen') {
        makeRecruitBtn('elephant', '+ ပုဂံတိုက်ဆင်', '🌾120 🪵50 🪙60', '🐘');
        makeRecruitBtn('elephant_archer', '+ မြားပစ်ဆင်', '🌾130 🪵80 🪙70', '🎪');
        makeRecruitBtn('royal_elephant', '+ သံချပ်ကာဆင်', '🌾180 🪵100 🪙120', '👑');
      } else if (building.type === 'blacksmith') {
        const techTree = this.game.techTree;
        if (techTree) {
          Object.values(techTree.upgrades).forEach(tech => {
            const isDone = techTree.isResearched(tech.id);
            const btn = document.createElement('button');
            btn.className = `action-btn unit-recruit-card ${isDone ? 'researched' : ''}`;
            btn.style.opacity = isDone ? '0.7' : '1.0';
            btn.innerHTML = `
              <div class="thumb-container">
                <span style="font-size: 20px;">${tech.icon}</span>
              </div>
              <div class="recruit-text-box">
                <span class="recruit-title">${tech.name} ${isDone ? '✓' : ''}</span>
                <span class="recruit-cost">${isDone ? 'သုတေသန ပြီးပါပြီ' : tech.costStr}</span>
              </div>
            `;
            if (!isDone) {
              btn.onclick = () => {
                techTree.research(tech.id);
              };
            }
            this.entityActionsEl.appendChild(btn);
          });
        }
      } else if (building.type === 'house') {
        const info = document.createElement('div');
        info.style.cssText = 'color: #2ecc71; font-size: 13px; padding: 6px; font-weight: bold;';
        info.textContent = '🏡 လူနေအိမ် (လူဦးရေ အကန့်အသတ် +၁၀ ယောက် ထောက်ပံ့ပေးထားပါသည်)';
        this.entityActionsEl.appendChild(info);
      } else if (building.type === 'watchtower') {
        const info = document.createElement('div');
        info.style.cssText = 'color: #f39c12; font-size: 13px; padding: 6px; font-weight: bold;';
        info.textContent = '🏹 ကင်းစင် (အကွာအဝေး ၁၈ မီတာအတွင်း ရန်သူများကို အလိုအလျောက် မြှားပစ် ကာကွယ်ပေးသည်)';
        this.entityActionsEl.appendChild(info);
      } else if (building.type === 'wall') {
        const info = document.createElement('div');
        info.style.cssText = 'color: #d4ac0d; font-size: 13px; padding: 6px; font-weight: bold;';
        info.textContent = '🪵 သစ်တပ်မြို့ရိုး (ရန်သူများ ကျူးကျော်ဝင်ရောက်မှု တားဆီးရန် ခံစစ်မြို့ရိုး)';
        this.entityActionsEl.appendChild(info);
      } else if (building.type === 'gate') {
        const info = document.createElement('div');
        info.style.cssText = 'color: #e67e22; font-size: 13px; padding: 6px; font-weight: bold;';
        info.textContent = '⛩️ သစ်တပ် တံခါးကြီး (မဟာမိတ်များအတွက် အလိုအလျောက် ပွင့်ပေးပြီး ရန်သူများကို ပိတ်ဆို့တားဆီးသည်)';
        this.entityActionsEl.appendChild(info);
      }
    } else if (resource) {
      this.entityNameEl.textContent = resource.name;
      this.entityTypeEl.textContent = 'သဘာဝ အရင်းအမြစ် စခန်း';
      this.entityAvatarEl.textContent = resource.icon;
      const pct = Math.max(0, (resource.amount / resource.maxAmount) * 100);
      if (this.entityHpBarEl) {
        this.entityHpBarEl.style.width = `${pct}%`;
        this.entityHpBarEl.style.background = '#f1c40f';
      }
      if (this.entityHpTextEl) {
        this.entityHpTextEl.textContent = `ကျန်ရှိ ပမာဏ: ${resource.amount} / ${resource.maxAmount}`;
      }
    }
  }

  recruitUnit(type, building) {
    if (!this.game.economySystem.deduct(type)) {
      alert('ရိက္ခာ (သို့မဟုတ်) ရွှေ မလုံလောက်ပါ!');
      return;
    }

    const spawnPos = {
      x: building.mesh.position.x + (Math.random() - 0.5) * 3,
      z: building.mesh.position.z + 4 + Math.random() * 2
    };

    let unit = null;
    if (type === 'villager') unit = new Villager(this.game, { x: spawnPos.x, z: spawnPos.z });
    else if (type === 'swordsman') unit = new Swordsman(this.game, { x: spawnPos.x, z: spawnPos.z });
    else if (type === 'archer') unit = new Archer(this.game, { x: spawnPos.x, z: spawnPos.z });
    else if (type === 'elephant') unit = new WarElephant(this.game, { x: spawnPos.x, z: spawnPos.z });

    if (unit) {
      this.game.units.push(unit);
      unit.moveTo({ x: spawnPos.x, z: spawnPos.z + 3 });
    }
  }

  showFloatingText(text, worldPos, color = '#f1c40f', isCrit = false) {
    if (!this.game.camera) return;

    const screenPos = worldPos.clone().project(this.game.camera);
    // Discard if behind camera
    if (screenPos.z > 1.0) return;

    const jitterX = (Math.random() - 0.5) * 32;
    const x = ((screenPos.x + 1) * window.innerWidth) / 2 + jitterX;
    const y = ((-screenPos.y + 1) * window.innerHeight) / 2;

    const el = document.createElement('div');
    el.textContent = text;
    el.style.position = 'fixed';
    el.style.left = `${x}px`;
    el.style.top = `${y}px`;
    el.style.transform = isCrit ? 'translate(-50%, -50%) scale(1.4)' : 'translate(-50%, -50%) scale(1.15)';
    el.style.color = isCrit ? '#ffd700' : color;
    el.style.fontWeight = '900';
    el.style.fontSize = isCrit ? '1.45rem' : '1.18rem';
    el.style.fontFamily = 'Cinzel, Padauk, sans-serif';
    el.style.letterSpacing = '0.5px';
    el.style.textShadow = isCrit
      ? '0 0 10px rgba(255, 215, 0, 0.9), 0 2px 6px #000, 0 0 2px #fff'
      : '0 0 6px rgba(0,0,0,0.95), 0 2px 4px #000';
    el.style.pointerEvents = 'none';
    el.style.zIndex = '1200';
    el.style.transition = 'all 1.0s cubic-bezier(0.2, 0.9, 0.3, 1.2)';
    document.body.appendChild(el);

    requestAnimationFrame(() => {
      el.style.top = `${y - (isCrit ? 60 : 42)}px`;
      el.style.transform = 'translate(-50%, -50%) scale(0.9)';
      el.style.opacity = '0';
    });

    setTimeout(() => {
      if (el.parentNode) el.parentNode.removeChild(el);
    }, 1050);
  }

  showNotification(message, type = 'info') {
    let toast = document.getElementById('bagan-hud-toast');
    if (!toast) {
      toast = document.createElement('div');
      toast.id = 'bagan-hud-toast';
      document.body.appendChild(toast);
    }

    toast.className = `bagan-hud-toast ${type} show`;
    toast.textContent = message;

    if (this._toastTimer) clearTimeout(this._toastTimer);
    this._toastTimer = setTimeout(() => {
      toast.classList.remove('show');
    }, 2800);
  }

  updateHealthDisplay(entity) {
    const pct = Math.max(0, (entity.hp / entity.maxHp) * 100);
    if (this.entityHpBarEl) this.entityHpBarEl.style.width = `${pct}%`;
    if (this.entityHpTextEl) this.entityHpTextEl.textContent = `HP: ${Math.round(entity.hp)} / ${entity.maxHp}`;
  }

  updateMinimap() {
    if (!this.minimapCtx) return;
    const ctx = this.minimapCtx;
    const w = this.minimapCanvas.width;
    const h = this.minimapCanvas.height;
    const worldSize = this.game.terrain.size;

    // Helper to map world coords to minimap coords
    const toMapX = (x) => ((x / worldSize) + 0.5) * w;
    const toMapY = (z) => ((z / worldSize) + 0.5) * h;

    // 1. Base Terrain: Rich textured Bagan Soil & Vegetation
    const terrainGrad = ctx.createLinearGradient(0, 0, w, h);
    terrainGrad.addColorStop(0, '#78350f'); // Warm terracotta clay
    terrainGrad.addColorStop(0.5, '#92400e');
    terrainGrad.addColorStop(1, '#6b2d0b');
    ctx.fillStyle = terrainGrad;
    ctx.fillRect(0, 0, w, h);

    // Green vegetative savannah patches
    ctx.fillStyle = 'rgba(46, 125, 50, 0.35)';
    ctx.beginPath();
    ctx.ellipse(w * 0.45, h * 0.5, w * 0.35, h * 0.32, 0, 0, Math.PI * 2);
    ctx.fill();

    // 2. Majestic Ayeyarwady River on the West
    const riverWidth = w * 0.22;
    // Riverbed shadow
    ctx.fillStyle = '#154360';
    ctx.fillRect(0, 0, riverWidth, h);

    // Flowing River Gradient
    const waterGrad = ctx.createLinearGradient(0, 0, riverWidth, 0);
    waterGrad.addColorStop(0, '#1b4f72');
    waterGrad.addColorStop(0.7, '#2471a3');
    waterGrad.addColorStop(1, '#5499c7'); // Shimmering water edge
    ctx.fillStyle = waterGrad;
    ctx.fillRect(0, 0, riverWidth - 2, h);

    // Golden sandy shoreline
    ctx.strokeStyle = '#d4ac0d';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(riverWidth - 1, 0);
    ctx.lineTo(riverWidth - 1, h);
    ctx.stroke();

    // 3. Mount Popa contours in North-East
    ctx.fillStyle = 'rgba(52, 73, 94, 0.45)';
    ctx.beginPath();
    ctx.ellipse(w * 0.78, h * 0.16, w * 0.18, h * 0.12, -0.2, 0, Math.PI * 2);
    ctx.fill();

    // 4. Paved Royal Roadways from center
    ctx.strokeStyle = 'rgba(235, 152, 78, 0.45)';
    ctx.lineWidth = 3;
    const cx0 = toMapX(0);
    const cy0 = toMapY(0);
    // Road to river dock
    ctx.beginPath();
    ctx.moveTo(cx0, cy0);
    ctx.lineTo(riverWidth + 6, cy0);
    // Road to north
    ctx.moveTo(cx0, cy0);
    ctx.lineTo(cx0, h * 0.15);
    // Road to east
    ctx.moveTo(cx0, cy0);
    ctx.lineTo(w * 0.85, cy0);
    // Road to south
    ctx.moveTo(cx0, cy0);
    ctx.lineTo(cx0, h * 0.85);
    ctx.stroke();

    // 5. Resource Nodes with Distinct Crisp Emblems
    for (const r of this.game.resourceNodes) {
      const rx = toMapX(r.mesh.position.x);
      const ry = toMapY(r.mesh.position.z);

      if (r.resourceType === 'gold') {
        // Gold Mine: Bright golden diamond with dark border
        ctx.fillStyle = '#f1c40f';
        ctx.strokeStyle = '#7d6608';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(rx, ry - 4.5);
        ctx.lineTo(rx + 4.5, ry);
        ctx.lineTo(rx, ry + 4.5);
        ctx.lineTo(rx - 4.5, ry);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
      } else if (r.resourceType === 'stone') {
        // Stone Quarry: Solid slate-grey square with border
        ctx.fillStyle = '#bdc3c7';
        ctx.strokeStyle = '#2c3e50';
        ctx.lineWidth = 1.2;
        ctx.fillRect(rx - 3.5, ry - 3.5, 7, 7);
        ctx.strokeRect(rx - 3.5, ry - 3.5, 7, 7);
      } else if (r.resourceType === 'wood') {
        // Forest: Deep emerald green tree circle
        ctx.fillStyle = '#27ae60';
        ctx.strokeStyle = '#145a32';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(rx, ry, 4.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
      } else {
        // Paddy Field: Amber golden plot
        ctx.fillStyle = '#f39c12';
        ctx.strokeStyle = '#7e5109';
        ctx.lineWidth = 1.2;
        ctx.fillRect(rx - 4, ry - 4, 8, 8);
        ctx.strokeRect(rx - 4, ry - 4, 8, 8);
      }
    }

    // 6. Buildings
    for (const b of this.game.buildings) {
      if (b.faction === 'enemy' && this.game.fogOfWar && !this.game.fogOfWar.isExplored(b.mesh.position.x, b.mesh.position.z)) continue;
      const bx = toMapX(b.mesh.position.x);
      const by = toMapY(b.mesh.position.z);
      const isPlayer = b.faction === 'player';

      if (b.type === 'palace') {
        // Palace: Grand royal citadel marker
        ctx.fillStyle = isPlayer ? '#f1c40f' : '#c0392b';
        ctx.strokeStyle = isPlayer ? '#ffffff' : '#f9e79f';
        ctx.lineWidth = 2;
        ctx.fillRect(bx - 6, by - 6, 12, 12);
        ctx.strokeRect(bx - 6, by - 6, 12, 12);
        // Inner royal crest
        ctx.fillStyle = isPlayer ? '#78281f' : '#1b2631';
        ctx.fillRect(bx - 2.5, by - 2.5, 5, 5);
      } else if (b.type === 'watchtower') {
        // Tower: Diamond sentinel
        ctx.fillStyle = isPlayer ? '#e67e22' : '#922b21';
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.moveTo(bx, by - 4);
        ctx.lineTo(bx + 4, by);
        ctx.lineTo(bx, by + 4);
        ctx.lineTo(bx - 4, by);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
      } else if (b.type === 'wall') {
        // Palisade Wall segment on Minimap
        ctx.fillStyle = isPlayer ? '#784212' : '#212f3d';
        ctx.fillRect(bx - 2, by - 2, 4, 4);
      } else if (b.type === 'gate') {
        // Gate on Minimap
        ctx.fillStyle = isPlayer ? '#d35400' : '#78281f';
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1;
        ctx.fillRect(bx - 3.5, by - 3.5, 7, 7);
        ctx.strokeRect(bx - 3.5, by - 3.5, 7, 7);
      } else {
        // Standard Building
        ctx.fillStyle = isPlayer ? '#f39c12' : '#e74c3c';
        ctx.strokeStyle = isPlayer ? '#d4ac0d' : '#922b21';
        ctx.lineWidth = 1.2;
        ctx.fillRect(bx - 4, by - 4, 8, 8);
        ctx.strokeRect(bx - 4, by - 4, 8, 8);
      }
    }

    // 7. Units
    for (const u of this.game.units) {
      if (u.faction === 'enemy' && this.game.fogOfWar && !this.game.fogOfWar.isInVision(u.mesh.position.x, u.mesh.position.z)) continue;
      const ux = toMapX(u.mesh.position.x);
      const uy = toMapY(u.mesh.position.z);
      const isPlayer = u.faction === 'player';

      ctx.fillStyle = isPlayer ? '#2ecc71' : '#e74c3c';
      ctx.strokeStyle = isPlayer ? '#145a32' : '#641e16';
      ctx.lineWidth = 1;
      const radius = u.type === 'elephant' ? 4 : (u.type === 'cavalry' ? 3 : 2.2);

      ctx.beginPath();
      ctx.arc(ux, uy, radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // White inner pip for player
      if (isPlayer) {
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(ux, uy, 0.9, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // 8. Soft Fog of War shroud on Minimap (Semi-transparent ancient chart look during active battle)
    if (this.game.isGameRunning && this.game.fogOfWar && this.game.fogOfWar.canvas) {
      ctx.save();
      ctx.globalAlpha = 0.4;
      ctx.drawImage(this.game.fogOfWar.canvas, 0, 0, w, h);
      ctx.restore();
    }

    // 9. Camera Viewport Box (Golden/White Field of View)
    const camTarget = this.game.cameraController.target;
    const cx = toMapX(camTarget.x);
    const cy = toMapY(camTarget.z);

    ctx.strokeStyle = '#f1c40f';
    ctx.lineWidth = 1.8;
    ctx.shadowColor = 'rgba(0, 0, 0, 0.8)';
    ctx.shadowBlur = 4;
    ctx.strokeRect(cx - 16, cy - 12, 32, 24);
    ctx.shadowBlur = 0;

    // Center target pip
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(cx - 1, cy - 1, 2, 2);

    // 10. Cardinal North Indicator
    ctx.fillStyle = '#f1c40f';
    ctx.font = 'bold 9px Cinzel, Padauk, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('▲ N', w / 2, 10);
  }
}
