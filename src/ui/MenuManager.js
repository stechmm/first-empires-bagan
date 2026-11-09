export class MenuManager {
  constructor(game) {
    this.game = game;
    this.selectedDifficulty = 'normal';
    this.selectedMap = 'ayeyarwady';
    this.playerCount = 4;

    this.cacheElements();
    this.setupEventListeners();
    this.setupGameResultListeners();
    this.setupSettingsEvents();
  }

  cacheElements() {
    this.menuOverlay = document.getElementById('main-menu-overlay');
    this.menuContainer = document.querySelector('.menu-container');
    this.mainButtons = document.getElementById('main-menu-buttons');

    // Panels
    this.skirmishPanel = document.getElementById('skirmish-panel');
    this.campaignPanel = document.getElementById('campaign-panel');
    this.multiplayerPanel = document.getElementById('multiplayer-panel');
    this.settingsPanel = document.getElementById('settings-panel');

    // Main Buttons
    this.btnSingleplayer = document.getElementById('btn-menu-singleplayer');
    this.btnCampaign = document.getElementById('btn-menu-campaign');
    this.btnMultiplayer = document.getElementById('btn-menu-multiplayer');
    this.btnSettings = document.getElementById('btn-menu-settings');

    // Back buttons
    this.btnBackSkirmish = document.getElementById('btn-back-from-skirmish');
    this.btnBackCampaign = document.getElementById('btn-back-from-campaign');
    this.btnBackMp = document.getElementById('btn-back-from-mp');
    this.btnBackSettings = document.getElementById('btn-back-from-settings');

    // Skirmish Lobby controls
    this.btnStartGame = document.getElementById('btn-start-game');
    this.selectPlayerCount = document.getElementById('select-player-count');
    this.selectMap = document.getElementById('select-map');
    this.slot2AiDiff = document.getElementById('slot2-ai-diff');
    this.slot3Row = document.getElementById('slot-3-row');
    this.slot4Row = document.getElementById('slot-4-row');
    this.mapNameDisplay = document.getElementById('map-name-display');

    // Wave indicator & alert banner
    this.waveIndicator = document.getElementById('wave-indicator');
    this.waveTimerText = document.getElementById('wave-timer-text');
    this.waveNumBadge = document.getElementById('wave-num-badge');
    this.battleAlertBanner = document.getElementById('battle-alert-banner');
    this.alertBannerText = document.getElementById('alert-banner-text');

    // Game Result modal
    this.resultModal = document.getElementById('game-result-modal');
    this.resultIcon = document.getElementById('result-icon');
    this.resultTitle = document.getElementById('result-title');
    this.resultSubtitle = document.getElementById('result-subtitle');
    this.statTime = document.getElementById('stat-time');
    this.statKills = document.getElementById('stat-kills');
    this.statTrained = document.getElementById('stat-trained');
    this.btnRestartGame = document.getElementById('btn-restart-game');
    this.btnReturnMenu = document.getElementById('btn-return-menu');
  }

  setupEventListeners() {
    // 1. Open Singleplayer Lobby
    if (this.btnSingleplayer) {
      this.btnSingleplayer.addEventListener('click', () => {
        this.openPanel(this.skirmishPanel, true);
      });
    }

    // Open Campaign Missions
    if (this.btnCampaign) {
      this.btnCampaign.addEventListener('click', () => {
        this.openPanel(this.campaignPanel, true);
      });
    }

    // Campaign Card Clicks
    document.querySelectorAll('.campaign-card').forEach(card => {
      card.addEventListener('click', () => {
        const mIdx = parseInt(card.dataset.mission, 10);
        this.menuOverlay.classList.add('hidden');
        if (this.game.campaignManager) {
          this.game.campaignManager.startMission(mIdx);
        }
      });
    });

    if (this.btnBackCampaign) {
      this.btnBackCampaign.addEventListener('click', () => this.showMainMenu());
    }

    // 2. Open Multiplayer Lobby
    if (this.btnMultiplayer) {
      this.btnMultiplayer.addEventListener('click', () => {
        this.openPanel(this.multiplayerPanel, true);
      });
    }

    // 3. Open Settings Screen
    if (this.btnSettings) {
      this.btnSettings.addEventListener('click', () => {
        this.openPanel(this.settingsPanel, true);
      });
    }

    // Back Buttons
    if (this.btnBackSkirmish) {
      this.btnBackSkirmish.addEventListener('click', () => this.showMainMenu());
    }
    if (this.btnBackMp) {
      this.btnBackMp.addEventListener('click', () => this.showMainMenu());
    }
    if (this.btnBackSettings) {
      this.btnBackSettings.addEventListener('click', () => this.showMainMenu());
    }

    // Player Count Selector (1v1 vs 2v2)
    if (this.selectPlayerCount) {
      this.selectPlayerCount.addEventListener('change', (e) => {
        const count = parseInt(e.target.value, 10);
        this.playerCount = count;
        if (count === 2) {
          if (this.slot3Row) this.slot3Row.classList.add('hidden');
          if (this.slot4Row) this.slot4Row.classList.add('hidden');
        } else {
          if (this.slot3Row) this.slot3Row.classList.remove('hidden');
          if (this.slot4Row) this.slot4Row.classList.remove('hidden');
        }
      });
    }

    // Map Selector
    if (this.selectMap) {
      this.selectMap.addEventListener('change', (e) => {
        this.selectedMap = e.target.value;
        if (this.mapNameDisplay) {
          if (this.selectedMap === 'ayeyarwady') {
            this.mapNameDisplay.textContent = 'ဧရာဝတီ မြစ်ဝှမ်း (Ayeyarwady Basin)';
          } else if (this.selectedMap === 'plains') {
            this.mapNameDisplay.textContent = 'ပုဂံ ရှေးဟောင်း လွင်ပြင် (Bagan Ancient Plains)';
          } else if (this.selectedMap === 'popa') {
            this.mapNameDisplay.textContent = 'ပုပ္ပါး တောင်စောင်း (Mount Popa Foothills)';
          }
        }
      });
    }

    // AI Difficulty select
    if (this.slot2AiDiff) {
      this.slot2AiDiff.addEventListener('change', (e) => {
        this.selectedDifficulty = e.target.value;
      });
    }

    // Start Game from Lobby
    if (this.btnStartGame) {
      this.btnStartGame.addEventListener('click', () => {
        this.launchBattle();
      });
    }

    // Multiplayer room buttons
    const btnHost = document.getElementById('btn-host-room');
    const btnJoin = document.getElementById('btn-join-room');
    const mpStatus = document.getElementById('mp-status-msg');

    if (btnHost) {
      btnHost.addEventListener('click', () => {
        if (mpStatus) {
          mpStatus.innerHTML = '🏰 <strong>အခန်းနံပါတ် #BAGAN-7701 ဖွင့်လှစ်ပြီးပါပြီ!</strong> အခြား Player များအား Local Wi-Fi မှ ချိတ်ဆက်ရန် စောင့်ဆိုင်းနေပါသည်...';
        }
      });
    }

    if (btnJoin) {
      btnJoin.addEventListener('click', () => {
        if (mpStatus) {
          mpStatus.innerHTML = '🔍 <strong>Local Network (Wi-Fi) အတွင်း အခန်းများ ရှာဖွေနေပါသည်...</strong>';
          setTimeout(() => {
            mpStatus.innerHTML = '⚠️ အနီးအနားတွင် အခြားအခန်း မတွေ့ရှိသေးပါ။ "Create Room" ဖြင့် အခန်းသစ် ဖွင့်လှစ်နိုင်ပါသည်!';
          }, 1200);
        }
      });
    }
  }

  setupSettingsEvents() {
    const bindSlider = (id, valId) => {
      const slider = document.getElementById(id);
      const valText = document.getElementById(valId);
      if (slider && valText) {
        slider.addEventListener('input', (e) => {
          valText.textContent = `${e.target.value}%`;
        });
      }
    };

    bindSlider('vol-master', 'vol-master-val');
    bindSlider('vol-sfx', 'vol-sfx-val');
    bindSlider('vol-music', 'vol-music-val');

    const btnFs = document.getElementById('btn-settings-fullscreen');
    if (btnFs) {
      btnFs.addEventListener('click', () => {
        if (!document.fullscreenElement) {
          document.documentElement.requestFullscreen().catch(() => {});
        } else {
          document.exitFullscreen().catch(() => {});
        }
      });
    }
  }

  setupGameResultListeners() {
    // Wave Timer Event
    this.game.eventBus.on('wave-timer-tick', (data) => {
      if (data.isPaused) {
        if (this.waveTimerText) {
          this.waveTimerText.textContent = `ငြိမ်းချမ်းရေး (Builder Mode)`;
        }
        if (this.waveNumBadge) {
          this.waveNumBadge.textContent = `Wave Off`;
        }
        return;
      }
      if (this.waveTimerText) {
        this.waveTimerText.textContent = `ကျူးကျော်ရန်: ${data.timeRemaining}s`;
      }
      if (this.waveNumBadge) {
        this.waveNumBadge.textContent = `Wave ${data.waveNumber}`;
      }
    });

    // Enemy Wave Launched Event
    this.game.eventBus.on('enemy-wave-launched', (data) => {
      if (this.battleAlertBanner && this.alertBannerText) {
        this.alertBannerText.textContent = data.message;
        this.battleAlertBanner.classList.remove('hidden');
        setTimeout(() => {
          this.battleAlertBanner.classList.add('hidden');
        }, 3600);
      }
    });

    // Restart game
    if (this.btnRestartGame) {
      this.btnRestartGame.addEventListener('click', () => {
        this.resultModal.classList.add('hidden');
        this.launchBattle();
      });
    }

    // Return to main menu
    if (this.btnReturnMenu) {
      this.btnReturnMenu.addEventListener('click', () => {
        this.resultModal.classList.add('hidden');
        this.showMainMenu();
      });
    }
  }

  openPanel(panel, expand = false) {
    this.mainButtons.classList.add('hidden');
    this.skirmishPanel.classList.add('hidden');
    this.multiplayerPanel.classList.add('hidden');
    this.settingsPanel.classList.add('hidden');

    panel.classList.remove('hidden');
    if (expand && this.menuContainer) {
      this.menuContainer.classList.add('expanded-lobby');
    }
  }

  showMainMenu() {
    this.menuOverlay.classList.remove('hidden');
    this.skirmishPanel.classList.add('hidden');
    this.multiplayerPanel.classList.add('hidden');
    this.settingsPanel.classList.add('hidden');
    this.mainButtons.classList.remove('hidden');

    if (this.menuContainer) {
      this.menuContainer.classList.remove('expanded-lobby');
    }

    this.game.stopBattle();
  }

  launchBattle() {
    this.menuOverlay.classList.add('hidden');
    this.skirmishPanel.classList.add('hidden');
    this.mainButtons.classList.remove('hidden');

    if (this.menuContainer) {
      this.menuContainer.classList.remove('expanded-lobby');
    }

    const diff = this.slot2AiDiff ? this.slot2AiDiff.value : this.selectedDifficulty;
    const playerFaction = document.getElementById('slot1-faction')?.value || 'bagan';
    const enemyFaction = document.getElementById('slot2-faction')?.value || 'chinese';
    const map = this.selectMap?.value || 'ayeyarwady';
    const resources = document.getElementById('select-starting-resources')?.value || 'standard';

    this.game.startSkirmish({
      difficulty: diff,
      playerFaction,
      enemyFaction,
      map,
      resources
    });
  }

  showVictoryModal(stats) {
    if (!this.resultModal) return;

    this.resultIcon.textContent = '🏆';
    this.resultTitle.textContent = 'အောင်ပွဲ ရရှိပါသည်!';
    this.resultTitle.style.color = '#f1c40f';
    this.resultSubtitle.textContent = 'ရန်သူ့စစ်ခံတပ်ကို အောင်မြင်စွာ သိမ်းပိုက်ချေမှုန်းနိုင်ခဲ့သည်!';

    this.populateStats(stats);
    this.resultModal.classList.remove('hidden');
  }

  showDefeatModal(stats) {
    if (!this.resultModal) return;

    this.resultIcon.textContent = '☠️';
    this.resultTitle.textContent = 'နန်းတော် ကျဆုံးသွားပါသည်!';
    this.resultTitle.style.color = '#e74c3c';
    this.resultSubtitle.textContent = 'ပုဂံရွှေနန်းတော် ပျက်စီးသွားသဖြင့် တိုက်ပွဲရှုံးနိမ့်ပါသည်...';

    this.populateStats(stats);
    this.resultModal.classList.remove('hidden');
  }

  populateStats(stats) {
    const elapsedSec = Math.floor(stats.elapsedTime || 0);
    const mins = Math.floor(elapsedSec / 60).toString().padStart(2, '0');
    const secs = (elapsedSec % 60).toString().padStart(2, '0');

    if (this.statTime) this.statTime.textContent = `${mins}:${secs}`;
    if (this.statKills) this.statKills.textContent = stats.enemiesKilled || 0;
    if (this.statTrained) this.statTrained.textContent = stats.unitsTrained || 0;
  }
}
