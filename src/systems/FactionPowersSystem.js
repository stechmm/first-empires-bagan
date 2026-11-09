import * as THREE from 'three';

export class FactionPowersSystem {
  constructor(game) {
    this.game = game;
    this.cooldownTimer = 0;
    this.cooldownDuration = 45; // seconds
    this.isTargeting = false;
    this.activePower = null;

    this.powers = {
      bagan: {
        id: 'bagan_horn',
        name: 'တော်ဝင်စည်တော်သံ',
        desc: 'တပ်ဖွဲ့အားလုံး သွေး +35 တိုးပြီး တိုက်ခိုက်နှုန်း +30% တိုးစေသည်',
        icon: '📯',
        cooldown: 45,
        targetMode: 'instant'
      },
      chinese: {
        id: 'fire_arrows',
        name: 'မီးမြားမိုး စစ်ဆင်ရေး',
        desc: 'ပစ်မှတ်ဧရိယာဆီသို့ မီးမြားများ ရွာသွန်းတိုက်ခိုက်သည် (AoE 80 Damage)',
        icon: '☄️',
        cooldown: 40,
        targetMode: 'ground_target'
      },
      ari: {
        id: 'battle_trance',
        name: 'သစ္စာဓိဋ္ဌာန် ထိုးစစ်',
        desc: 'စစ်သည်များ အရှိန်နှင့် ခုတ်အား +60% မြန်ဆန်ပြင်းထန်လာသည်',
        icon: '📿',
        cooldown: 40,
        targetMode: 'instant'
      }
    };
  }

  getCurrentPower() {
    const f = this.game.playerFaction || 'bagan';
    return this.powers[f] || this.powers.bagan;
  }

  canActivate() {
    return this.cooldownTimer <= 0;
  }

  triggerPower() {
    if (!this.canActivate()) {
      alert(`စွမ်းရည် အသုံးပြုရန် ${Math.ceil(this.cooldownTimer)} စက္ကန့် စောင့်ဆိုင်းပါ!`);
      return;
    }

    const power = this.getCurrentPower();
    if (power.targetMode === 'instant') {
      this.executePower(power);
    } else if (power.targetMode === 'ground_target') {
      this.isTargeting = true;
      if (this.game.hud) {
        this.game.hud.showFloatingText('🎯 ပစ်ခတ်မည့် မြေပြင်ကို နှိပ်ပါ', new THREE.Vector3(0, 5, 0), '#e74c3c');
      }
    }
  }

  executePower(power, targetPos = null) {
    this.cooldownTimer = power.cooldown;

    if (power.id === 'bagan_horn') {
      // 1. Bagan War Horn: Mass heal + Buff
      if (this.game.soundSystem) {
        this.game.soundSystem.playElephantTrumpet();
      }

      this.game.units.forEach(u => {
        if (u.faction === 'player') {
          u.hp = Math.min(u.maxHp, u.hp + 35);
          u.updateHpBar();
          // Boost speed for 12 seconds
          const origSpeed = u.speed;
          u.speed *= 1.25;
          setTimeout(() => { u.speed = origSpeed; }, 12000);
        }
      });

      if (this.game.hud) {
        this.game.hud.showFloatingText('📯 တော်ဝင်စည်တော်သံ ထိုးစစ်! (HP +35, Speed +25%)', new THREE.Vector3(0, 6, 0), '#f1c40f');
      }
    } else if (power.id === 'fire_arrows') {
      // 2. Fire Arrow Rain at target position
      const center = targetPos || new THREE.Vector3(0, 0, 0);
      for (let i = 0; i < 18; i++) {
        setTimeout(() => {
          const rx = center.x + (Math.random() - 0.5) * 14;
          const rz = center.z + (Math.random() - 0.5) * 14;
          const dummyOrigin = { mesh: { position: new THREE.Vector3(rx, 30, rz - 15) } };
          const dummyTarget = {
            mesh: { position: new THREE.Vector3(rx, 0, rz) },
            takeDamage: () => {}
          };
          if (this.game.combatVFX) {
            this.game.combatVFX.spawnArrow(dummyOrigin, dummyTarget, 0);
          }
        }, i * 140);
      }

      // Deal AoE damage to enemy units and buildings in area
      setTimeout(() => {
        this.game.units.forEach(u => {
          if (u.faction === 'enemy' && u.mesh.position.distanceTo(center) < 10) {
            u.takeDamage(75);
          }
        });
        this.game.buildings.forEach(b => {
          if (b.faction === 'enemy' && b.mesh.position.distanceTo(center) < 12) {
            b.takeDamage(120);
          }
        });
      }, 800);

      if (this.game.hud) {
        this.game.hud.showFloatingText('☄️ မီးမြားမိုး စစ်ဆင်ရေး ကျရောက်ပြီ!', center, '#e74c3c');
      }
    } else if (power.id === 'battle_trance') {
      // 3. Ari Monk Battle Trance: Ferocious melee fury
      this.game.units.forEach(u => {
        if (u.faction === 'player') {
          const origDmg = u.attackDamage;
          const origSpeed = u.speed;
          u.attackDamage = Math.round(origDmg * 1.6);
          u.speed *= 1.35;

          setTimeout(() => {
            u.attackDamage = origDmg;
            u.speed = origSpeed;
          }, 14000);
        }
      });

      if (this.game.hud) {
        this.game.hud.showFloatingText('📿 သစ္စာဓိဋ္ဌာန်! (Damage +60%, Speed +35%)', new THREE.Vector3(0, 6, 0), '#9b59b6');
      }
    }

    this.isTargeting = false;
  }

  update(delta) {
    if (this.cooldownTimer > 0) {
      this.cooldownTimer = Math.max(0, this.cooldownTimer - delta);
      this.updateUI();
    }
  }

  updateUI() {
    const btn = document.getElementById('btn-faction-power');
    const timerEl = document.getElementById('power-cooldown-timer');
    if (!btn) return;

    const power = this.getCurrentPower();
    btn.querySelector('.power-icon').textContent = power.icon;
    btn.querySelector('.power-title').textContent = power.name;

    if (this.cooldownTimer > 0) {
      btn.classList.add('disabled');
      if (timerEl) {
        timerEl.textContent = `${Math.ceil(this.cooldownTimer)}s`;
        timerEl.classList.remove('hidden');
      }
    } else {
      btn.classList.remove('disabled');
      if (timerEl) timerEl.classList.add('hidden');
    }
  }
}
