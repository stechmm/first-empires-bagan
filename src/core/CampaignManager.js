import * as THREE from 'three';

export class CampaignManager {
  constructor(game) {
    this.game = game;
    this.activeMission = null;
    this.missionIndex = 0;
    this.objectives = [];
    this.isCampaignMode = false;

    this.missions = [
      {
        id: 1,
        title: 'မစ်ရှင် ၁: ပုဂံအင်ပါယာ အစ (Dawn of the Empire)',
        briefing: 'ပုဂံရွှေပြည်တော် စတင်ထူထောင်ချိန်ဖြစ်သည်။ အခြေခံလူနေအိမ်များ ဆောက်လုပ်ပြီး စစ်သည်တပ်ရုံတည်ဆောက်ကာ ကာကွယ်ရေးတပ်ဖွဲ့ကို စတင်ဖွဲ့စည်းပါ။',
        goals: [
          { id: 'house', text: 'လူနေအိမ် ၁ လုံး ဆောက်လုပ်ပါ (1/1)', target: 1, current: 0, done: false },
          { id: 'barracks', text: 'စစ်သည်တပ်ရုံ ၁ ရုံ ဆောက်လုပ်ပါ (1/1)', target: 1, current: 0, done: false },
          { id: 'swordsmen', text: 'ဓားကိုင်စစ်သည် ၄ ဦး မွေးထုတ်ပါ (4/4)', target: 4, current: 0, done: false }
        ]
      },
      {
        id: 2,
        title: 'မစ်ရှင် ၂: တော်ဝင်မြင်းတပ်နှင့် ခရီး (Rise of the Cavalry)',
        briefing: 'မြင်းတပ်စခန်းကို အဆင့်မြှင့်တင်ပြီး မြင်းသည်တော်များဖြင့် နယ်ခြားတစ်လျှောက် ကင်းလှည့်စစ်ဆေးကာ ရန်သူ့ကျူးကျော်မှုများကို ရှင်းလင်းပါ။',
        goals: [
          { id: 'blacksmith', text: 'ပန်းပဲဖိုနှင့် လက်နက်တိုက် ဆောက်ပါ (1/1)', target: 1, current: 0, done: false },
          { id: 'stables', text: 'မြင်းတပ်စခန်း တည်ဆောက်ပါ (1/1)', target: 1, current: 0, done: false },
          { id: 'cavalry', text: 'မြင်းသည်တော် ၃ စီး မွေးထုတ်ပါ (3/3)', target: 3, current: 0, done: false }
        ]
      },
      {
        id: 3,
        title: 'မစ်ရှင် ၃: မဟာပုဂံ စစ်ပွဲကြီး (The Great Battle of Bagan)',
        briefing: 'ရန်သူ့တပ်မကြီး နယ်စပ်သို့ ရောက်ရှိလာပြီဖြစ်သည်။ ဆင်တင်းတော်မှ တိုက်ဆင်ကြီးများ ထုတ်လုပ်ကာ ရန်သူ့ပင်မခံတပ်ကို အမြစ်ပြတ် ချေမှုန်းပါ။',
        goals: [
          { id: 'elephant_pen', text: 'ဆင်တင်းတော် တည်ဆောက်ပါ (1/1)', target: 1, current: 0, done: false },
          { id: 'elephants', text: 'ပုဂံတိုက်ဆင် ၂ စီး မွေးထုတ်ပါ (2/2)', target: 2, current: 0, done: false },
          { id: 'stronghold', text: 'ရန်သူ့ပင်မခံတပ်ကို ချေမှုန်းပါ (1/1)', target: 1, current: 0, done: false }
        ]
      }
    ];

    this.setupListeners();
  }

  setupListeners() {
    this.game.eventBus.on('training-queue-updated', () => this.checkProgress());
    this.game.eventBus.on('unit-hp-changed', () => this.checkProgress());
    this.game.eventBus.on('building-hp-changed', () => this.checkProgress());
  }

  startMission(missionIndex = 0) {
    this.isCampaignMode = true;
    this.missionIndex = missionIndex;
    const m = this.missions[missionIndex] || this.missions[0];
    this.activeMission = JSON.parse(JSON.stringify(m)); // Deep copy

    // Start skirmish base
    this.game.startSkirmish({ difficulty: 'normal', playerFaction: 'bagan', enemyFaction: 'chinese' });

    // Show Objective HUD panel
    this.renderObjectivesHUD();

    if (this.game.hud) {
      this.game.hud.showFloatingText(`📜 ${this.activeMission.title}`, new THREE.Vector3(0, 7, 0), '#f1c40f');
    }
  }

  checkProgress() {
    if (!this.isCampaignMode || !this.activeMission) return;

    let allDone = true;

    for (const goal of this.activeMission.goals) {
      if (goal.done) continue;

      if (goal.id === 'house') {
        const count = this.game.buildings.filter(b => b.faction === 'player' && b.type === 'house').length;
        goal.current = count;
        if (count >= goal.target) goal.done = true;
      } else if (goal.id === 'barracks') {
        const count = this.game.buildings.filter(b => b.faction === 'player' && b.type === 'barracks').length;
        goal.current = count;
        if (count >= goal.target) goal.done = true;
      } else if (goal.id === 'blacksmith') {
        const count = this.game.buildings.filter(b => b.faction === 'player' && b.type === 'blacksmith').length;
        goal.current = count;
        if (count >= goal.target) goal.done = true;
      } else if (goal.id === 'stables') {
        const count = this.game.buildings.filter(b => b.faction === 'player' && b.type === 'stables').length;
        goal.current = count;
        if (count >= goal.target) goal.done = true;
      } else if (goal.id === 'elephant_pen') {
        const count = this.game.buildings.filter(b => b.faction === 'player' && b.type === 'elephant_pen').length;
        goal.current = count;
        if (count >= goal.target) goal.done = true;
      } else if (goal.id === 'swordsmen') {
        const count = this.game.units.filter(u => u.faction === 'player' && u.type === 'swordsman').length;
        goal.current = count;
        if (count >= goal.target) goal.done = true;
      } else if (goal.id === 'cavalry') {
        const count = this.game.units.filter(u => u.faction === 'player' && u.type === 'cavalry').length;
        goal.current = count;
        if (count >= goal.target) goal.done = true;
      } else if (goal.id === 'elephants') {
        const count = this.game.units.filter(u => u.faction === 'player' && u.type === 'elephant').length;
        goal.current = count;
        if (count >= goal.target) goal.done = true;
      } else if (goal.id === 'stronghold') {
        if (!this.game.enemyAI.stronghold || this.game.enemyAI.stronghold.hp <= 0) {
          goal.done = true;
        }
      }

      if (!goal.done) allDone = false;
    }

    this.renderObjectivesHUD();

    if (allDone) {
      this.onMissionCompleted();
    }
  }

  onMissionCompleted() {
    this.isCampaignMode = false;
    alert(`🎉 အောင်ပွဲခံပါပြီ! ${this.activeMission.title} အောင်မြင်စွာ ပြီးမြောက်ပါသည်!`);
    
    if (this.missionIndex < this.missions.length - 1) {
      if (confirm('နောက်ထပ် သမိုင်းဝင်မစ်ရှင်ကို ဆက်လက်ဆော့ကစားမလား?')) {
        this.startMission(this.missionIndex + 1);
      }
    }
  }

  renderObjectivesHUD() {
    let panel = document.getElementById('campaign-objectives-panel');
    if (!panel) {
      panel = document.createElement('div');
      panel.id = 'campaign-objectives-panel';
      panel.className = 'campaign-box';
      document.getElementById('ui-container')?.appendChild(panel);
    }

    if (!this.isCampaignMode || !this.activeMission) {
      panel.style.display = 'none';
      return;
    }

    panel.style.display = 'block';
    let html = `
      <div class="campaign-title">📜 ${this.activeMission.title}</div>
      <div class="campaign-goals">
    `;

    for (const g of this.activeMission.goals) {
      html += `
        <div class="goal-item ${g.done ? 'done' : ''}">
          <span>${g.done ? '✅' : '⚪'}</span>
          <span>${g.text} (${g.current || 0}/${g.target})</span>
        </div>
      `;
    }

    html += `</div>`;
    panel.innerHTML = html;
  }
}
