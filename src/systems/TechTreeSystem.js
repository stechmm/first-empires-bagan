import * as THREE from 'three';

export class TechTreeSystem {
  constructor(game) {
    this.game = game;

    this.researched = {
      forged_blades: false,
      bronze_armor: false,
      fire_arrows: false,
      elephant_armor: false
    };

    this.upgrades = {
      forged_blades: {
        id: 'forged_blades',
        name: 'ဓားသွားသွေးခြင်း',
        cost: { wood: 100, stone: 0, gold: 50, food: 0 },
        costStr: '🪵100 🪙50',
        icon: '🗡️',
        desc: 'ခြေလျင်နှင့် မြင်းတပ်များ တိုက်ခိုက်အား +25%',
        apply: () => {
          this.researched.forged_blades = true;
          // Apply to existing player units
          this.game.units.forEach(u => {
            if (u.faction === 'player' && (u.type === 'swordsman' || u.type === 'spearman' || (u.type === 'cavalry' && u.subType !== 'archer'))) {
              u.attackDamage = Math.round(u.attackDamage * 1.25);
            }
          });
        }
      },
      bronze_armor: {
        id: 'bronze_armor',
        name: 'ကြေးချပ်ဝတ် တန်ဆာ',
        cost: { wood: 80, stone: 80, gold: 40, food: 0 },
        costStr: '🪵80 🧱80 🪙40',
        icon: '🛡️',
        desc: 'စစ်သည်အားလုံး အသက် (HP) +30%',
        apply: () => {
          this.researched.bronze_armor = true;
          // Apply to existing player units
          this.game.units.forEach(u => {
            if (u.faction === 'player' && u.type !== 'villager') {
              const extraHp = Math.round(u.maxHp * 0.3);
              u.maxHp += extraHp;
              u.hp += extraHp;
              u.updateHpBar();
            }
          });
        }
      },
      fire_arrows: {
        id: 'fire_arrows',
        name: 'မီးမြှား သုတေသန',
        cost: { wood: 120, stone: 0, gold: 80, food: 0 },
        costStr: '🪵120 🪙80',
        icon: '🔥',
        desc: 'လေးသည်များနှင့် ကင်းစင်များ မီးမြှားပစ်ခတ်နိုင်သည် (အဆောက်အအုံများ +50% ပျက်စီး)',
        apply: () => {
          this.researched.fire_arrows = true;
        }
      },
      elephant_armor: {
        id: 'elephant_armor',
        name: 'တော်ဝင်ဆင်ကုန်းနှီး',
        cost: { wood: 150, stone: 0, gold: 100, food: 0 },
        costStr: '🪵150 🪙100',
        icon: '🐘',
        desc: 'တိုက်ဆင်ကြီးများ အသက် +200 နှင့် အမြန်နှုန်း +25%',
        apply: () => {
          this.researched.elephant_armor = true;
          // Apply to existing player elephants
          this.game.units.forEach(u => {
            if (u.faction === 'player' && u.type === 'elephant') {
              u.maxHp += 200;
              u.hp += 200;
              u.speed = (u.speed || 3.5) * 1.25;
              u.updateHpBar();
            }
          });
        }
      }
    };
  }

  isResearched(techId) {
    return !!this.researched[techId];
  }

  canAfford(techId) {
    const tech = this.upgrades[techId];
    if (!tech) return false;
    const res = this.game.economySystem.resources;
    if (tech.cost.wood && res.wood < tech.cost.wood) return false;
    if (tech.cost.stone && res.stone < tech.cost.stone) return false;
    if (tech.cost.gold && res.gold < tech.cost.gold) return false;
    if (tech.cost.food && res.food < tech.cost.food) return false;
    return true;
  }

  research(techId) {
    if (this.isResearched(techId)) return false;
    const tech = this.upgrades[techId];
    if (!tech) return false;

    if (!this.canAfford(techId)) {
      alert('သယံဇာတ မလုံလောက်ပါ! (သစ်၊ ကျောက် သို့မဟုတ် ရွှေ လိုအပ်ပါသည်)');
      return false;
    }

    // Deduct cost
    const res = this.game.economySystem.resources;
    if (tech.cost.wood) res.wood -= tech.cost.wood;
    if (tech.cost.stone) res.stone -= tech.cost.stone;
    if (tech.cost.gold) res.gold -= tech.cost.gold;
    if (tech.cost.food) res.food -= tech.cost.food;
    this.game.economySystem.updateUI();

    // Apply technology
    tech.apply();

    // Audio SFX
    if (this.game.soundSystem) {
      this.game.soundSystem.playWarGong();
      this.game.soundSystem.playRecruitChime();
    }

    // Floating Announcement
    const playerBase = this.game.buildings.find(b => b.faction === 'player' && b.type === 'palace');
    const pos = playerBase ? playerBase.mesh.position.clone().add(new THREE.Vector3(0, 5, 0)) : new THREE.Vector3(0, 5, 0);
    this.game.hud.showFloatingText(`✨ ${tech.name} ပြီးမြောက်ပါပြီ!`, pos, '#f1c40f', true);

    // Refresh Selection Panel if Blacksmith is currently selected
    this.game.hud.updateSelectionPanel({
      units: this.game.selectionSystem.selectedUnits,
      building: this.game.selectionSystem.selectedBuilding,
      resource: this.game.selectionSystem.selectedResource
    });

    return true;
  }

  reset() {
    this.researched.forged_blades = false;
    this.researched.bronze_armor = false;
    this.researched.fire_arrows = false;
    this.researched.elephant_armor = false;
  }
}
