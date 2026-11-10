export class MultiplayerLobby {
  constructor(game, mpClient) {
    this.game = game;
    this.mpClient = mpClient;
    this.modalEl = null;

    this.createLobbyModal();
    this.setupListeners();
    this.addHeaderButton();
  }

  addHeaderButton() {
    const controls = document.querySelector('.system-controls');
    if (!controls) return;

    const mpBtn = document.createElement('button');
    mpBtn.id = 'btn-multiplayer-lobby';
    mpBtn.className = 'ctrl-btn';
    mpBtn.title = 'ကစားသူအချင်းချင်း အွန်လိုင်းတိုက်ခိုက်ခြင်း (Multiplayer Battle)';
    mpBtn.style.cssText = 'background: linear-gradient(135deg, #78281f 0%, #b7950b 100%); border-color: #f1c40f; color: #fff; font-weight: bold; font-size: 0.75rem; padding: 4px 10px; display: flex; align-items: center; gap: 4px;';
    mpBtn.innerHTML = '⚔️ <span class="hide-mobile">အွန်လိုင်းတိုက်ပွဲ</span>';
    mpBtn.onclick = () => this.open();

    controls.insertBefore(mpBtn, controls.firstChild);
  }

  createLobbyModal() {
    this.modalEl = document.createElement('div');
    this.modalEl.id = 'mp-lobby-modal';
    this.modalEl.className = 'mp-modal-backdrop hidden';
    this.modalEl.innerHTML = `
      <div class="mp-modal-box">
        <div class="mp-modal-header">
          <div class="mp-modal-title">⚔️ ပုဂံအင်ပါယာ အွန်လိုင်းတိုက်ပွဲ (Multiplayer Battle)</div>
          <button class="mp-close-btn" id="mp-close-btn">✖</button>
        </div>

        <div class="mp-modal-body">
          <!-- Player Profile Input -->
          <div class="mp-player-row">
            <label for="mp-player-name">မင်း၏အမည် (Player Name):</label>
            <input type="text" id="mp-player-name" value="မင်းလောင်း" maxlength="20" placeholder="အမည်ရိုက်ထည့်ပါ..." />
          </div>

          <!-- Lobby Tabs -->
          <div class="mp-mode-grid">
            <!-- 1. Quick Match -->
            <div class="mp-card" id="mp-card-quick">
              <div class="mp-card-icon">⚡</div>
              <div class="mp-card-title">အမြန်ရှာဖွေ (Quick 1v1)</div>
              <div class="mp-card-desc">စစ်ပွဲစောင့်နေသော အခြားကစားသမားနှင့် ချက်ချင်းတွဲပေးမည်</div>
              <button class="mp-btn mp-btn-gold" id="mp-btn-quick">တိုက်ခိုက်ရန် ရှာဖွေမည်</button>
              <div id="mp-quick-status" class="mp-status-text hidden">🔄 ပြိုင်ဘက် ရှာဖွေနေပါသည်... <button id="mp-btn-cancel-quick" class="mp-btn-cancel">ပယ်ဖျက်</button></div>
            </div>

            <!-- 2. Create Room -->
            <div class="mp-card" id="mp-card-create">
              <div class="mp-card-icon">👑</div>
              <div class="mp-card-title">အခန်းသစ်ဖွင့် (Create Room)</div>
              <div class="mp-card-desc">သူငယ်ချင်းများနှင့် သီးသန့်အခန်းဖွင့်၍ အတူဆော့ကစားမည်</div>
              <button class="mp-btn mp-btn-red" id="mp-btn-create">အခန်းသစ် ဖွင့်မည်</button>
              <div id="mp-create-status" class="mp-status-text hidden">
                <div>အခန်းကုဒ်: <span id="mp-room-code-display" class="mp-code-badge">BAGAN-XXXX</span></div>
                <div style="font-size: 0.72rem; color: #f39c12; margin-top: 4px;">ပြိုင်ဘက် ဝင်ရောက်လာရန် စောင့်ဆိုင်းနေပါသည်...</div>
              </div>
            </div>

            <!-- 3. Join Room -->
            <div class="mp-card" id="mp-card-join">
              <div class="mp-card-icon">🚪</div>
              <div class="mp-card-title">အခန်းကုဒ်ဖြင့်ဝင် (Join Room)</div>
              <div class="mp-card-desc">သူငယ်ချင်း ပေးပို့သော အခန်းကုဒ်ဖြင့် အခန်းထဲဝင်ရောက်မည်</div>
              <input type="text" id="mp-join-code-input" class="mp-input-code" placeholder="BAGAN-XXXX" maxlength="12" />
              <button class="mp-btn mp-btn-blue" id="mp-btn-join">အခန်းထဲ ဝင်မည်</button>
            </div>
          </div>

          <!-- Connection Status Footer -->
          <div class="mp-footer">
            <div class="mp-status-pill">
              <span class="mp-dot online"></span>
              <span id="mp-status-label">ဆာဗာချိတ်ဆက်ထားသည်</span>
              <span id="mp-ping-display" class="mp-ping">--ms</span>
            </div>
          </div>
        </div>
      </div>
    `;

    document.body.appendChild(this.modalEl);
  }

  setupListeners() {
    const closeBtn = document.getElementById('mp-close-btn');
    if (closeBtn) closeBtn.onclick = () => this.close();

    const playerNameInput = document.getElementById('mp-player-name');

    // 1. Quick Match
    const quickBtn = document.getElementById('mp-btn-quick');
    const quickStatus = document.getElementById('mp-quick-status');
    const cancelQuickBtn = document.getElementById('mp-btn-cancel-quick');

    if (quickBtn) {
      quickBtn.onclick = () => {
        const name = playerNameInput.value.trim() || 'သူရဲကောင်း';
        quickBtn.classList.add('hidden');
        quickStatus.classList.remove('hidden');
        this.mpClient.quickMatch(name);
      };
    }

    if (cancelQuickBtn) {
      cancelQuickBtn.onclick = () => {
        this.mpClient.cancelQuickMatch();
        quickStatus.classList.add('hidden');
        quickBtn.classList.remove('hidden');
      };
    }

    // 2. Create Room
    const createBtn = document.getElementById('mp-btn-create');
    const createStatus = document.getElementById('mp-create-status');
    const codeDisplay = document.getElementById('mp-room-code-display');

    if (createBtn) {
      createBtn.onclick = () => {
        const name = playerNameInput.value.trim() || 'မင်းလောင်း';
        this.mpClient.createRoom(name);
        createBtn.classList.add('hidden');
        createStatus.classList.remove('hidden');
      };
    }

    // 3. Join Room
    const joinBtn = document.getElementById('mp-btn-join');
    const joinInput = document.getElementById('mp-join-code-input');

    if (joinBtn) {
      joinBtn.onclick = () => {
        const code = (joinInput.value || '').trim();
        if (!code) {
          alert('ကျေးဇူးပြု၍ အခန်းကုဒ် ရိုက်ထည့်ပါ!');
          return;
        }
        const name = playerNameInput.value.trim() || 'ပြိုင်ဘက်မင်း';
        this.mpClient.joinRoom(code, name);
      };
    }

    // -------------------------------------------------------------
    // Multiplayer Client Callbacks
    // -------------------------------------------------------------
    this.mpClient.onRoomCreated = (data) => {
      if (codeDisplay) codeDisplay.textContent = data.roomId;
    };

    this.mpClient.onRoomJoined = (data) => {
      if (this.game.hud) {
        this.game.hud.showNotification(`⚔️ အခန်း ${data.roomId} သို့ အောင်မြင်စွာ ဝင်ရောက်ပြီးပါပြီ!`, 'success');
      }
    };

    this.mpClient.onGuestJoined = (data) => {
      if (this.game.hud) {
        this.game.hud.showNotification(`⚔️ ပြိုင်ဘက် [${data.guest.name}] စစ်မြေပြင်သို့ ရောက်ရှိလာပါပြီ!`, 'success');
      }
    };

    this.mpClient.onJoinError = (data) => {
      alert(data.message || 'အခန်းဝင်ရောက်မှု မအောင်မြင်ပါ!');
    };

    this.mpClient.onBattleStart = (data) => {
      this.close();
      this.showInGameBattleBanner(data);
      this.game.startMultiplayerMatch(data);
    };
  }

  showInGameBattleBanner(data) {
    let banner = document.getElementById('mp-battle-banner');
    if (!banner) {
      banner = document.createElement('div');
      banner.id = 'mp-battle-banner';
      banner.className = 'mp-battle-banner';
      document.body.appendChild(banner);
    }

    const myRole = this.mpClient.role === 'host' ? 'မဟာမင်းတရား (Host)' : 'ပြိုင်ဘက်စစ်သူကြီး (Challenger)';
    banner.innerHTML = `
      <div class="mp-banner-inner">
        <span class="mp-banner-badge">⚔️ အွန်လိုင်းတိုက်ပွဲ</span>
        <span>${data.roomId}</span>
        <span style="color:#d4ac0d;">|</span>
        <span>${myRole}</span>
        <span style="color:#d4ac0d;">vs</span>
        <span style="color:#e74c3c;">${this.mpClient.opponentName}</span>
      </div>
    `;
    banner.classList.remove('hidden');
  }

  open() {
    this.mpClient.connect();
    if (this.modalEl) this.modalEl.classList.remove('hidden');
  }

  close() {
    if (this.modalEl) this.modalEl.classList.add('hidden');
  }
}
