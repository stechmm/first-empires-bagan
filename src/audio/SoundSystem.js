import { BaganBGMEngine } from './BaganBGMEngine.js';

export class SoundSystem {
  constructor(game) {
    this.game = game;
    this.audioCtx = null;

    // Volume levels (0.0 to 1.0)
    this.masterVolume = 0.8;
    this.sfxVolume = 0.9;
    this.musicVolume = 0.65;

    this.isMuted = false;
    this.isDrumsPlaying = false;
    this.drumTimer = null;
    this.drumBeat = 0;
    this.bgmEngine = null;

    this.initAudioContext();
    this.setupEventListeners();
  }

  initAudioContext() {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (AudioContext) {
      this.audioCtx = new AudioContext();

      // Master Gain Node
      this.masterGain = this.audioCtx.createGain();
      this.masterGain.gain.setValueAtTime(this.masterVolume, this.audioCtx.currentTime);

      // SFX Gain Node
      this.sfxGain = this.audioCtx.createGain();
      this.sfxGain.gain.setValueAtTime(this.sfxVolume, this.audioCtx.currentTime);
      this.sfxGain.connect(this.masterGain);

      // Music Gain Node
      this.musicGain = this.audioCtx.createGain();
      this.musicGain.gain.setValueAtTime(this.musicVolume, this.audioCtx.currentTime);
      this.musicGain.connect(this.masterGain);

      this.masterGain.connect(this.audioCtx.destination);

      // Procedural Royal Bagan BGM Synthesizer Engine
      this.bgmEngine = new BaganBGMEngine(this);

      // Pre-generate noise buffer for physical sound synthesis (stone crunch, debris, wind)
      this.getNoiseBuffer();
    }
  }

  getNoiseBuffer() {
    if (!this.audioCtx) return null;
    if (!this.noiseBuffer) {
      const bufferSize = Math.floor(this.audioCtx.sampleRate * 1.0);
      this.noiseBuffer = this.audioCtx.createBuffer(1, bufferSize, this.audioCtx.sampleRate);
      const output = this.noiseBuffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        output[i] = Math.random() * 2 - 1;
      }
    }
    return this.noiseBuffer;
  }

  resumeAudio() {
    if (this.audioCtx && this.audioCtx.state === 'suspended') {
      this.audioCtx.resume();
    }
  }

  setupEventListeners() {
    // Resume audio and start Royal Bagan BGM on first user gesture
    const unlockAudio = () => {
      this.resumeAudio();
      this.startBGM('peace');
      window.removeEventListener('click', unlockAudio);
      window.removeEventListener('touchstart', unlockAudio);
    };
    window.addEventListener('click', unlockAudio);
    window.addEventListener('touchstart', unlockAudio);

    // BGM Mute/Unmute Toggle Button in Top HUD
    const btnBgm = document.getElementById('btn-bgm-toggle');
    if (btnBgm) {
      btnBgm.addEventListener('click', (e) => {
        e.stopPropagation();
        this.resumeAudio();
        const active = this.toggleBGM();
        btnBgm.textContent = active ? '🎵' : '🔇';
        btnBgm.classList.toggle('active', active);

        if (this.game.hud && this.game.hud.showNotification) {
          this.game.hud.showNotification(
            active ? '🎵 ပုဂံတော်ဝင်တေးသံစဉ် ဖွင့်ထားပါသည်' : '🔇 တေးသံစဉ် ပိတ်ထားပါသည်',
            active ? 'info' : 'warning'
          );
        }
      });
    }

    // Bind Volume Sliders from Settings Panel
    const sldMaster = document.getElementById('vol-master');
    const sldSfx = document.getElementById('vol-sfx');
    const sldMusic = document.getElementById('vol-music');

    if (sldMaster) {
      sldMaster.addEventListener('input', (e) => {
        this.setMasterVolume(e.target.value / 100);
      });
    }
    if (sldSfx) {
      sldSfx.addEventListener('input', (e) => {
        this.setSfxVolume(e.target.value / 100);
      });
    }
    if (sldMusic) {
      sldMusic.addEventListener('input', (e) => {
        this.setMusicVolume(e.target.value / 100);
      });
    }

    // Battle launch event - transition to war march
    this.game.eventBus.on('enemy-wave-launched', () => {
      this.playWarGong();
      this.setMusicTheme('war');
    });

    // When skirmish or peace prevails
    this.game.eventBus.on('battle-peace', () => {
      this.setMusicTheme('peace');
    });
  }

  startBGM(theme = 'peace') {
    if (this.bgmEngine) {
      this.bgmEngine.start(theme);
    }
  }

  stopBGM() {
    if (this.bgmEngine) {
      this.bgmEngine.stop();
    }
  }

  toggleBGM() {
    if (this.bgmEngine) {
      return this.bgmEngine.toggle();
    }
    return false;
  }

  setMusicTheme(theme) {
    if (this.bgmEngine) {
      this.bgmEngine.setTheme(theme);
    }
  }

  setMasterVolume(val) {
    this.masterVolume = Math.max(0, Math.min(1, val));
    if (this.masterGain && this.audioCtx) {
      this.masterGain.gain.setValueAtTime(this.masterVolume, this.audioCtx.currentTime);
    }
  }

  setSfxVolume(val) {
    this.sfxVolume = Math.max(0, Math.min(1, val));
    if (this.sfxGain && this.audioCtx) {
      this.sfxGain.gain.setValueAtTime(this.sfxVolume, this.audioCtx.currentTime);
    }
  }

  setMusicVolume(val) {
    this.musicVolume = Math.max(0, Math.min(1, val));
    if (this.musicGain && this.audioCtx) {
      this.musicGain.gain.setValueAtTime(this.musicVolume, this.audioCtx.currentTime);
    }
  }

  // ========================================================
  // COMBAT SOUND EFFECTS (Web Audio Synthesis)
  // ========================================================

  playSwordClash() {
    if (!this.audioCtx || this.isMuted) return;
    this.resumeAudio();

    const t = this.audioCtx.currentTime;
    const osc = this.audioCtx.createOscillator();
    const gain = this.audioCtx.createGain();

    // High metal clink frequency with pitch jitter
    const freq = 1200 + (Math.random() - 0.5) * 300;
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(freq, t);
    osc.frequency.exponentialRampToValueAtTime(320, t + 0.12);

    gain.gain.setValueAtTime(0.35, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.18);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(t);
    osc.stop(t + 0.18);
  }

  playArrowWhoosh() {
    if (!this.audioCtx || this.isMuted) return;
    this.resumeAudio();

    const t = this.audioCtx.currentTime;
    const osc = this.audioCtx.createOscillator();
    const gain = this.audioCtx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(450, t);
    osc.frequency.exponentialRampToValueAtTime(850, t + 0.08);
    osc.frequency.exponentialRampToValueAtTime(220, t + 0.22);

    gain.gain.setValueAtTime(0.01, t);
    gain.gain.linearRampToValueAtTime(0.2, t + 0.06);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.22);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(t);
    osc.stop(t + 0.22);
  }

  playArrowHit() {
    if (!this.audioCtx || this.isMuted) return;
    this.resumeAudio();

    const t = this.audioCtx.currentTime;
    const osc = this.audioCtx.createOscillator();
    const gain = this.audioCtx.createGain();

    // Sharp wooden impact
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(280 + (Math.random() - 0.5) * 50, t);
    osc.frequency.exponentialRampToValueAtTime(60, t + 0.1);

    gain.gain.setValueAtTime(0.4, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.12);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(t);
    osc.stop(t + 0.12);
  }

  playElephantStomp() {
    if (!this.audioCtx || this.isMuted) return;
    this.resumeAudio();

    const t = this.audioCtx.currentTime;
    const osc = this.audioCtx.createOscillator();
    const gain = this.audioCtx.createGain();

    // Sub-bass earthquake thud
    osc.type = 'sine';
    osc.frequency.setValueAtTime(110, t);
    osc.frequency.exponentialRampToValueAtTime(24, t + 0.45);

    gain.gain.setValueAtTime(0.8, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.5);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(t);
    osc.stop(t + 0.5);
  }

  playElephantTrumpet() {
    if (!this.audioCtx || this.isMuted) return;
    this.resumeAudio();

    const t = this.audioCtx.currentTime;
    const osc = this.audioCtx.createOscillator();
    const gain = this.audioCtx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(320, t);
    osc.frequency.linearRampToValueAtTime(540, t + 0.15);
    osc.frequency.linearRampToValueAtTime(420, t + 0.35);

    gain.gain.setValueAtTime(0.25, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.4);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(t);
    osc.stop(t + 0.4);
  }

  // ========================================================
  // ECONOMIC & UI SOUNDS
  // ========================================================

  playWoodChop() {
    if (!this.audioCtx || this.isMuted) return;
    this.resumeAudio();

    const t = this.audioCtx.currentTime;
    const osc = this.audioCtx.createOscillator();
    const gain = this.audioCtx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(190 + (Math.random() - 0.5) * 40, t);
    osc.frequency.exponentialRampToValueAtTime(75, t + 0.08);

    gain.gain.setValueAtTime(0.25, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.09);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(t);
    osc.stop(t + 0.09);
  }

  playHammer() {
    if (!this.audioCtx || this.isMuted) return;
    this.resumeAudio();

    const t = this.audioCtx.currentTime;
    // Wood & metal construction hammer strike
    const osc = this.audioCtx.createOscillator();
    const gain = this.audioCtx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(520 + (Math.random() - 0.5) * 60, t);
    osc.frequency.exponentialRampToValueAtTime(120, t + 0.08);

    gain.gain.setValueAtTime(0.3, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.09);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(t);
    osc.stop(t + 0.09);
  }

  // ========================================================
  // REALISTIC MINING & HARVESTING SOUNDS
  // ========================================================

  playStoneMine() {
    if (!this.audioCtx || this.isMuted) return;
    this.resumeAudio();

    const t = this.audioCtx.currentTime;
    const jitter = (Math.random() - 0.5) * 40;

    // 1. Heavy dense stone quarry thud (deep bedrock resonance)
    const oscThud = this.audioCtx.createOscillator();
    const gainThud = this.audioCtx.createGain();
    oscThud.type = 'triangle';
    oscThud.frequency.setValueAtTime(145 + jitter, t);
    oscThud.frequency.exponentialRampToValueAtTime(42, t + 0.08);

    gainThud.gain.setValueAtTime(0.42, t);
    gainThud.gain.exponentialRampToValueAtTime(0.001, t + 0.095);

    oscThud.connect(gainThud);
    gainThud.connect(this.sfxGain);
    oscThud.start(t);
    oscThud.stop(t + 0.095);

    // 2. Sharp iron pickaxe tip strike click (transient impact on mineral)
    const oscClick = this.audioCtx.createOscillator();
    const gainClick = this.audioCtx.createGain();
    oscClick.type = 'triangle';
    oscClick.frequency.setValueAtTime(980 + jitter * 2, t);
    oscClick.frequency.exponentialRampToValueAtTime(310, t + 0.025);

    gainClick.gain.setValueAtTime(0.3, t);
    gainClick.gain.exponentialRampToValueAtTime(0.001, t + 0.035);

    oscClick.connect(gainClick);
    gainClick.connect(this.sfxGain);
    oscClick.start(t);
    oscClick.stop(t + 0.035);

    // 3. Fractured rock debris crunch (sandstone chips & gravel flying)
    const noiseBuf = this.getNoiseBuffer();
    if (noiseBuf) {
      const noise = this.audioCtx.createBufferSource();
      noise.buffer = noiseBuf;

      const filter = this.audioCtx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(720 + jitter * 3, t);
      filter.Q.setValueAtTime(1.3, t);

      const noiseGain = this.audioCtx.createGain();
      noiseGain.gain.setValueAtTime(0.25, t);
      noiseGain.gain.exponentialRampToValueAtTime(0.001, t + 0.085);

      noise.connect(filter);
      filter.connect(noiseGain);
      noiseGain.connect(this.sfxGain);

      noise.start(t);
      noise.stop(t + 0.085);
    }
  }

  playGoldMine() {
    if (!this.audioCtx || this.isMuted) return;
    this.resumeAudio();

    const t = this.audioCtx.currentTime;
    const pitchVar = (Math.random() - 0.5) * 60;

    // 1. Crisp pickaxe-to-metal ore transient click
    const oscClick = this.audioCtx.createOscillator();
    const gainClick = this.audioCtx.createGain();
    oscClick.type = 'triangle';
    oscClick.frequency.setValueAtTime(1420 + pitchVar, t);
    oscClick.frequency.exponentialRampToValueAtTime(500, t + 0.03);

    gainClick.gain.setValueAtTime(0.24, t);
    gainClick.gain.exponentialRampToValueAtTime(0.001, t + 0.04);

    oscClick.connect(gainClick);
    gainClick.connect(this.sfxGain);
    oscClick.start(t);
    oscClick.stop(t + 0.04);

    // 2. Solid nugget body resonance (mid-low weight)
    const oscBody = this.audioCtx.createOscillator();
    const gainBody = this.audioCtx.createGain();
    oscBody.type = 'sine';
    oscBody.frequency.setValueAtTime(360 + pitchVar * 0.3, t);
    oscBody.frequency.exponentialRampToValueAtTime(180, t + 0.07);

    gainBody.gain.setValueAtTime(0.2, t);
    gainBody.gain.exponentialRampToValueAtTime(0.001, t + 0.08);

    oscBody.connect(gainBody);
    gainBody.connect(this.sfxGain);
    oscBody.start(t);
    oscBody.stop(t + 0.08);

    // 3. First golden harmonic chime (G6 ~ 1975 Hz) - bright resonant ring
    const oscChime1 = this.audioCtx.createOscillator();
    const gainChime1 = this.audioCtx.createGain();
    oscChime1.type = 'sine';
    oscChime1.frequency.setValueAtTime(1975 + pitchVar, t);

    gainChime1.gain.setValueAtTime(0.28, t);
    gainChime1.gain.exponentialRampToValueAtTime(0.001, t + 0.28);

    oscChime1.connect(gainChime1);
    gainChime1.connect(this.sfxGain);
    oscChime1.start(t);
    oscChime1.stop(t + 0.28);

    // 4. Delayed secondary micro-ping at t + 0.032s (B6 ~ 2489 Hz) creating signature "Ching-ting!"
    const t2 = t + 0.032;
    const oscChime2 = this.audioCtx.createOscillator();
    const gainChime2 = this.audioCtx.createGain();
    oscChime2.type = 'sine';
    oscChime2.frequency.setValueAtTime(2489 + pitchVar * 1.2, t2);

    gainChime2.gain.setValueAtTime(0.22, t2);
    gainChime2.gain.exponentialRampToValueAtTime(0.001, t2 + 0.32);

    oscChime2.connect(gainChime2);
    gainChime2.connect(this.sfxGain);
    oscChime2.start(t2);
    oscChime2.stop(t2 + 0.32);

    // 5. Delicate high sparkle overtone (E7 ~ 3300 Hz)
    const oscSparkle = this.audioCtx.createOscillator();
    const gainSparkle = this.audioCtx.createGain();
    oscSparkle.type = 'sine';
    oscSparkle.frequency.setValueAtTime(3300 + pitchVar * 1.5, t);

    gainSparkle.gain.setValueAtTime(0.08, t);
    gainSparkle.gain.exponentialRampToValueAtTime(0.001, t + 0.2);

    oscSparkle.connect(gainSparkle);
    gainSparkle.connect(this.sfxGain);
    oscSparkle.start(t);
    oscSparkle.stop(t + 0.2);
  }

  playCropHarvest() {
    if (!this.audioCtx || this.isMuted) return;
    this.resumeAudio();

    const t = this.audioCtx.currentTime;
    const noiseBuf = this.getNoiseBuffer();
    if (noiseBuf) {
      // Swish of sickle cutting through dry paddy stalks
      const noise = this.audioCtx.createBufferSource();
      noise.buffer = noiseBuf;

      const filter = this.audioCtx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(1350, t);
      filter.frequency.exponentialRampToValueAtTime(420, t + 0.11);
      filter.Q.setValueAtTime(2.2, t);

      const gain = this.audioCtx.createGain();
      gain.gain.setValueAtTime(0.22, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.13);

      noise.connect(filter);
      filter.connect(gain);
      gain.connect(this.sfxGain);

      noise.start(t);
      noise.stop(t + 0.13);
    }
  }

  playPickaxe() {
    // Backward compatibility default
    this.playStoneMine();
  }

  playHarvestChime() {
    if (!this.audioCtx || this.isMuted) return;
    this.resumeAudio();

    const t = this.audioCtx.currentTime;
    const osc = this.audioCtx.createOscillator();
    const gain = this.audioCtx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(520, t);
    osc.frequency.exponentialRampToValueAtTime(780, t + 0.15);

    gain.gain.setValueAtTime(0.18, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.25);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(t);
    osc.stop(t + 0.25);
  }

  playRecruitChime() {
    if (!this.audioCtx || this.isMuted) return;
    this.resumeAudio();

    const notes = [440, 554, 659]; // Royal triad A - C# - E
    notes.forEach((freq, i) => {
      const t = this.audioCtx.currentTime + i * 0.09;
      const osc = this.audioCtx.createOscillator();
      const gain = this.audioCtx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, t);

      gain.gain.setValueAtTime(0.2, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.35);

      osc.connect(gain);
      gain.connect(this.sfxGain);

      osc.start(t);
      osc.stop(t + 0.35);
    });
  }

  // ========================================================
  // BAGAN WAR DRUMS & BRONZE GONG AMBIANCE
  // ========================================================

  playWarGong() {
    if (!this.audioCtx || this.isMuted) return;
    this.resumeAudio();

    const t = this.audioCtx.currentTime;
    // Ancient Burmese Bronze Gong (Kyayzi / Gong)
    const freqs = [180, 365, 545];
    freqs.forEach((freq, idx) => {
      const osc = this.audioCtx.createOscillator();
      const gain = this.audioCtx.createGain();

      osc.type = idx === 0 ? 'sine' : 'triangle';
      osc.frequency.setValueAtTime(freq, t);

      const vol = 0.35 / (idx + 1);
      gain.gain.setValueAtTime(vol, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 2.5);

      osc.connect(gain);
      gain.connect(this.sfxGain);

      osc.start(t);
      osc.stop(t + 2.5);
    });
  }

  startWarDrums() {
    if (this.isDrumsPlaying) return;
    this.isDrumsPlaying = true;
    this.drumBeat = 0;

    // Bagan rhythmic march: 120 BPM (~500ms per beat)
    this.drumTimer = setInterval(() => {
      this.playDrumStep(this.drumBeat);
      this.drumBeat = (this.drumBeat + 1) % 8;
    }, 480);
  }

  stopWarDrums() {
    this.isDrumsPlaying = false;
    if (this.drumTimer) {
      clearInterval(this.drumTimer);
      this.drumTimer = null;
    }
  }

  playDrumStep(beat) {
    if (!this.audioCtx || this.isMuted || !this.isDrumsPlaying) return;

    const t = this.audioCtx.currentTime;

    // Beat 0: Heavy war drum
    // Beat 2, 4, 6: Syncopated march drums
    // Beat 7: Anticipation double strike
    if (beat === 0 || beat === 3 || beat === 6) {
      const osc = this.audioCtx.createOscillator();
      const gain = this.audioCtx.createGain();

      const pitch = beat === 0 ? 80 : 105;
      osc.type = 'sine';
      osc.frequency.setValueAtTime(pitch, t);
      osc.frequency.exponentialRampToValueAtTime(32, t + 0.3);

      const vol = beat === 0 ? 0.3 : 0.18;
      gain.gain.setValueAtTime(vol, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.35);

      osc.connect(gain);
      gain.connect(this.musicGain);

      osc.start(t);
      osc.stop(t + 0.35);
    }
  }
}
