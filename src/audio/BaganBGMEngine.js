/**
 * BaganBGMEngine - Procedural Royal Bagan Background Music Synthesizer
 * 
 * Synthesizes authentic traditional Myanmar classical music (မဟာဂီတ / ပုဂံခေတ် တေးသံ):
 * 1. Saung Gauk (မြန်မာ့စောင်းတော် - Burmese Harp)
 * 2. Pattala (ပတ္တလား - Bamboo Xylophone)
 * 3. Palwe (ပလွေ - Bamboo Flute)
 * 4. Kyayzi & Si (ကြေးစည် - Spinning Bronze Triangle Gong)
 * 5. Pat Ma Gyi (ပတ်မကြီး - Royal Bass War Drum)
 */

export class BaganBGMEngine {
  constructor(soundSystem) {
    this.ss = soundSystem;
    this.isPlaying = false;
    this.theme = 'peace'; // 'peace' or 'war'
    this.step = 0;
    this.timer = null;

    // Traditional Bagan Pentatonic Scale (D Major Pentatonic): D, E, F#, A, B
    this.notes = {
      D2: 73.42,  A2: 110.00,
      D3: 146.83, E3: 164.81, Fs3: 185.00, A3: 220.00, B3: 246.94,
      D4: 293.66, E4: 329.63, Fs4: 369.99, A4: 440.00, B4: 493.88,
      D5: 587.33, E5: 659.25, Fs5: 739.99, A5: 880.00, B5: 987.77
    };

    // 16-bar melodic phrase pattern for Peaceful Builder Mode
    // [Saung notes, Pattala note, Palwe note, Kyayzi gong, PatMa drum]
    this.peaceScores = [
      // Bar 1 - Royal Entrance
      { saung: ['D3', 'A3', 'D4'], pattala: null, palwe: 'D5', gong: true, drum: 'heavy' },
      { saung: null, pattala: 'Fs4', palwe: null, gong: false, drum: null },
      { saung: ['Fs4'], pattala: null, palwe: null, gong: false, drum: null },
      { saung: null, pattala: 'A4', palwe: 'E5', gong: false, drum: 'soft' },

      // Bar 2 - Saung & Pattala Flourish
      { saung: ['E3', 'B3'], pattala: 'B4', palwe: null, gong: false, drum: null },
      { saung: null, pattala: 'A4', palwe: 'Fs5', gong: false, drum: null },
      { saung: ['Fs4', 'A4'], pattala: null, palwe: null, gong: false, drum: null },
      { saung: null, pattala: 'E4', palwe: 'E5', gong: false, drum: 'soft' },

      // Bar 3 - Kyayzi Shimmer & Palwe Soaring
      { saung: ['B2', 'Fs3', 'D4'], pattala: 'D4', palwe: 'D5', gong: true, drum: 'heavy' },
      { saung: null, pattala: 'E4', palwe: null, gong: false, drum: null },
      { saung: ['Fs4'], pattala: null, palwe: 'B4', gong: false, drum: null },
      { saung: null, pattala: 'A4', palwe: null, gong: false, drum: 'soft' },

      // Bar 4 - Cadence 1
      { saung: ['A2', 'E3', 'A3'], pattala: 'Fs4', palwe: 'A4', gong: false, drum: null },
      { saung: null, pattala: 'E4', palwe: null, gong: false, drum: null },
      { saung: ['D4'], pattala: 'D4', palwe: 'D4', gong: false, drum: null },
      { saung: null, pattala: null, palwe: null, gong: false, drum: null },

      // Bar 5 - Soaring Upper Register
      { saung: ['D3', 'A3', 'Fs4'], pattala: null, palwe: 'Fs5', gong: true, drum: 'heavy' },
      { saung: null, pattala: 'A4', palwe: null, gong: false, drum: null },
      { saung: ['A4', 'D5'], pattala: 'B4', palwe: 'A5', gong: false, drum: null },
      { saung: null, pattala: 'D5', palwe: null, gong: false, drum: 'soft' },

      // Bar 6 - Gentle River Meditation
      { saung: ['G2', 'D3', 'B3'], pattala: 'B4', palwe: 'Fs5', gong: false, drum: null },
      { saung: null, pattala: 'A4', palwe: null, gong: false, drum: null },
      { saung: ['D4'], pattala: 'Fs4', palwe: 'E5', gong: false, drum: null },
      { saung: null, pattala: 'E4', palwe: null, gong: false, drum: 'soft' },

      // Bar 7 - Pre-Resolution
      { saung: ['A2', 'E3', 'A3'], pattala: 'D4', palwe: 'D5', gong: true, drum: 'heavy' },
      { saung: null, pattala: 'E4', palwe: 'B4', gong: false, drum: null },
      { saung: ['Fs4'], pattala: 'Fs4', palwe: 'A4', gong: false, drum: null },
      { saung: null, pattala: 'E4', palwe: null, gong: false, drum: 'soft' },

      // Bar 8 - Peaceful Resolution
      { saung: ['D3', 'A3', 'D4', 'Fs4'], pattala: 'D4', palwe: 'D4', gong: true, drum: 'heavy' },
      { saung: null, pattala: null, palwe: null, gong: false, drum: null },
      { saung: null, pattala: 'A3', palwe: null, gong: false, drum: null },
      { saung: null, pattala: 'D4', palwe: null, gong: false, drum: null }
    ];

    // War March Rhythm & Battle Horn Calls
    this.warScores = [
      { drum: 'heavy', gong: true, horn: 'D3', pattala: 'D4', tempoBump: 0 },
      { drum: 'march', gong: false, horn: null, pattala: 'Fs4', tempoBump: 0 },
      { drum: 'double', gong: false, horn: 'Fs3', pattala: 'A4', tempoBump: 0 },
      { drum: 'march', gong: true, horn: null, pattala: 'D5', tempoBump: 0 },
      { drum: 'heavy', gong: false, horn: 'A3', pattala: 'B4', tempoBump: 0 },
      { drum: 'march', gong: false, horn: null, pattala: 'A4', tempoBump: 0 },
      { drum: 'double', gong: true, horn: 'D4', pattala: 'Fs4', tempoBump: 0 },
      { drum: 'march', gong: false, horn: null, pattala: 'D4', tempoBump: 0 }
    ];
  }

  get ctx() {
    return this.ss.audioCtx;
  }

  get dest() {
    return this.ss.musicGain;
  }

  start(theme = 'peace') {
    if (this.isPlaying) {
      if (this.theme !== theme) this.setTheme(theme);
      return;
    }
    this.ss.resumeAudio();
    this.isPlaying = true;
    this.theme = theme;
    this.step = 0;
    this.scheduleNextStep();
  }

  stop() {
    this.isPlaying = false;
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }
  }

  toggle() {
    if (this.isPlaying) {
      this.stop();
      return false;
    } else {
      this.start(this.theme || 'peace');
      return true;
    }
  }

  setTheme(theme) {
    this.theme = theme;
  }

  scheduleNextStep() {
    if (!this.isPlaying || !this.ctx) return;

    const interval = this.theme === 'war' ? 310 : 420; // ms per step

    this.playStep(this.step);

    if (this.theme === 'war') {
      this.step = (this.step + 1) % this.warScores.length;
    } else {
      this.step = (this.step + 1) % this.peaceScores.length;
    }

    this.timer = setTimeout(() => {
      this.scheduleNextStep();
    }, interval);
  }

  playStep(stepIndex) {
    if (!this.ctx || this.ss.isMuted) return;

    if (this.theme === 'war') {
      const data = this.warScores[stepIndex];
      if (!data) return;

      if (data.drum) this.playPatMa(data.drum);
      if (data.gong) this.playKyayzi(0.18);
      if (data.horn) this.playWarHorn(this.notes[data.horn]);
      if (data.pattala) this.playPattala(this.notes[data.pattala], 0.22);
    } else {
      const data = this.peaceScores[stepIndex];
      if (!data) return;

      if (data.saung) {
        data.saung.forEach((n, idx) => {
          setTimeout(() => {
            if (this.isPlaying) this.playSaung(this.notes[n], 1.6, 0.2);
          }, idx * 45); // Delicate arpeggiation delay
        });
      }

      if (data.pattala) {
        this.playPattala(this.notes[data.pattala], 0.16);
      }

      if (data.palwe) {
        this.playPalwe(this.notes[data.palwe], 0.85, 0.14);
      }

      if (data.gong) {
        this.playKyayzi(0.15);
      }

      if (data.drum) {
        this.playPatMa(data.drum, 0.18);
      }
    }
  }

  // ========================================================
  // INSTRUMENT SYNTHESISERS
  // ========================================================

  /**
   * 1. Saung Gauk (မြန်မာ့စောင်းတော် - Burmese Harp)
   * Plucked silk/nylon harp strings with warm resonant decay
   */
  playSaung(freq, duration = 1.4, volume = 0.2) {
    if (!this.ctx || !freq || this.ss.isMuted) return;
    const t = this.ctx.currentTime;

    const osc1 = this.ctx.createOscillator();
    const osc2 = this.ctx.createOscillator();
    const filter = this.ctx.createBiquadFilter();
    const gain = this.ctx.createGain();

    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(freq, t);
    // Micro-pitch settling (+7 cents initially settling down like a plucked harp string)
    osc1.frequency.exponentialRampToValueAtTime(freq * 1.004, t + 0.04);
    osc1.frequency.setValueAtTime(freq, t + 0.08);

    osc2.type = 'triangle';
    osc2.frequency.setValueAtTime(freq * 2, t); // Octave overtone

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(2600, t);
    filter.frequency.exponentialRampToValueAtTime(600, t + duration);

    const actualVol = volume * this.ss.musicVolume;
    gain.gain.setValueAtTime(0.001, t);
    gain.gain.linearRampToValueAtTime(actualVol, t + 0.015); // Fast plucked attack
    gain.gain.exponentialRampToValueAtTime(0.001, t + duration);

    osc1.connect(filter);
    osc2.connect(filter);
    filter.connect(gain);
    gain.connect(this.dest);

    osc1.start(t);
    osc2.start(t);
    osc1.stop(t + duration);
    osc2.stop(t + duration);
  }

  /**
   * 2. Pattala (ပတ္တလား - Burmese Bamboo Xylophone)
   * Struck bamboo bars with crisp wooden attack and resonant fundamental
   */
  playPattala(freq, volume = 0.18) {
    if (!this.ctx || !freq || this.ss.isMuted) return;
    const t = this.ctx.currentTime;
    const dur = 0.32;

    const osc = this.ctx.createOscillator();
    const overtone = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, t);

    overtone.type = 'sine';
    overtone.frequency.setValueAtTime(freq * 2.76, t); // Bamboo physical harmonic

    const actualVol = volume * this.ss.musicVolume;
    gain.gain.setValueAtTime(actualVol, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + dur);

    osc.connect(gain);
    overtone.connect(gain);
    gain.connect(this.dest);

    osc.start(t);
    overtone.start(t);
    osc.stop(t + dur);
    overtone.stop(t + dur);
  }

  /**
   * 3. Palwe (ပုဂံပလွေ - Ancient Burmese Bamboo Flute)
   * Breathy soaring tone with warm vibrato
   */
  playPalwe(freq, duration = 0.8, volume = 0.15) {
    if (!this.ctx || !freq || this.ss.isMuted) return;
    const t = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const filter = this.ctx.createBiquadFilter();
    const gain = this.ctx.createGain();

    // Gentle vibrato LFO
    const lfo = this.ctx.createOscillator();
    const lfoGain = this.ctx.createGain();
    lfo.type = 'sine';
    lfo.frequency.setValueAtTime(5.2, t);
    lfoGain.gain.setValueAtTime(4.5, t); // 4.5Hz depth vibrato
    lfo.connect(osc.frequency);

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(freq, t);

    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(freq * 1.5, t);
    filter.Q.setValueAtTime(1.8, t);

    const actualVol = volume * this.ss.musicVolume;
    gain.gain.setValueAtTime(0.001, t);
    gain.gain.linearRampToValueAtTime(actualVol, t + 0.08); // Breathy onset
    gain.gain.setValueAtTime(actualVol * 0.8, t + duration * 0.7);
    gain.gain.exponentialRampToValueAtTime(0.001, t + duration);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.dest);

    lfo.start(t + 0.1);
    osc.start(t);
    lfo.stop(t + duration);
    osc.stop(t + duration);
  }

  /**
   * 4. Kyayzi (ကြေးစည် - Burmese Spinning Triangle Gong)
   * Shimmering metallic resonance with dual acoustic pulsing
   */
  playKyayzi(volume = 0.15) {
    if (!this.ctx || this.ss.isMuted) return;
    const t = this.ctx.currentTime;
    const dur = 2.8;

    const osc1 = this.ctx.createOscillator();
    const osc2 = this.ctx.createOscillator();
    const tremolo = this.ctx.createOscillator();
    const tremoloGain = this.ctx.createGain();
    const gain = this.ctx.createGain();

    // Two high resonant bronze chime frequencies
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(1760, t); // A6
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(2349, t); // D7

    // Spinning gong amplitude wobble (3.2Hz tremolo)
    tremolo.type = 'sine';
    tremolo.frequency.setValueAtTime(3.2, t);
    tremoloGain.gain.setValueAtTime(0.3, t);
    tremolo.connect(gain.gain);

    const actualVol = volume * this.ss.musicVolume;
    gain.gain.setValueAtTime(actualVol, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + dur);

    osc1.connect(gain);
    osc2.connect(gain);
    gain.connect(this.dest);

    osc1.start(t);
    osc2.start(t);
    tremolo.start(t);
    osc1.stop(t + dur);
    osc2.stop(t + dur);
    tremolo.stop(t + dur);
  }

  /**
   * 5. Pat Ma Gyi (ပတ်မကြီး - Imperial Royal Bass Drum)
   */
  playPatMa(type = 'heavy', volume = 0.24) {
    if (!this.ctx || this.ss.isMuted) return;
    const t = this.ctx.currentTime;
    const dur = type === 'heavy' ? 0.45 : 0.25;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    const startPitch = type === 'heavy' ? 95 : 125;
    const endPitch = type === 'heavy' ? 36 : 48;

    osc.type = 'sine';
    osc.frequency.setValueAtTime(startPitch, t);
    osc.frequency.exponentialRampToValueAtTime(endPitch, t + dur * 0.8);

    const actualVol = volume * this.ss.musicVolume;
    gain.gain.setValueAtTime(actualVol, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + dur);

    osc.connect(gain);
    gain.connect(this.dest);

    osc.start(t);
    osc.stop(t + dur);
  }

  /**
   * 6. War Horn (ခရာစည်တော်)
   */
  playWarHorn(freq) {
    if (!this.ctx || !freq || this.ss.isMuted) return;
    const t = this.ctx.currentTime;
    const dur = 0.65;

    const osc = this.ctx.createOscillator();
    const filter = this.ctx.createBiquadFilter();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(freq * 0.98, t);
    osc.frequency.exponentialRampToValueAtTime(freq, t + 0.1);

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(1200, t);

    const actualVol = 0.18 * this.ss.musicVolume;
    gain.gain.setValueAtTime(0.001, t);
    gain.gain.linearRampToValueAtTime(actualVol, t + 0.08);
    gain.gain.exponentialRampToValueAtTime(0.001, t + dur);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.dest);

    osc.start(t);
    osc.stop(t + dur);
  }
}
