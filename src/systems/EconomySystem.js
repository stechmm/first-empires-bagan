export class EconomySystem {
  constructor(game) {
    this.game = game;
    this.resources = {
      food: 800,
      wood: 450,
      stone: 250,
      gold: 200,
      population: 3,
      maxPopulation: 15
    };

    this.costs = {
      house: { wood: 60, stone: 0, gold: 0, food: 0 },
      palace: { wood: 250, stone: 200, gold: 0, food: 0 },
      barracks: { wood: 120, stone: 50, gold: 0, food: 0 },
      blacksmith: { wood: 140, stone: 80, gold: 30, food: 0 },
      stables: { wood: 160, stone: 60, gold: 40, food: 0 },
      elephant_pen: { wood: 220, stone: 100, gold: 80, food: 0 },
      pagoda: { wood: 0, stone: 150, gold: 60, food: 0 },
      watchtower: { wood: 100, stone: 40, gold: 0, food: 0 },
      wall: { wood: 10, stone: 0, gold: 0, food: 0 },
      gate: { wood: 50, stone: 20, gold: 0, food: 0 },
      
      // Units - Palace
      villager: { food: 50, wood: 0, stone: 0, gold: 0, pop: 1 },

      // Units - Barracks (Infantry)
      swordsman: { food: 50, wood: 20, stone: 0, gold: 0, pop: 1 },
      archer: { food: 40, wood: 45, stone: 0, gold: 0, pop: 1 },
      spearman: { food: 50, wood: 30, stone: 0, gold: 0, pop: 1 },

      // Units - Stables (Cavalry)
      cavalry_raider: { food: 70, wood: 30, stone: 0, gold: 20, pop: 2 },
      cavalry_lancer: { food: 80, wood: 45, stone: 0, gold: 30, pop: 2 },
      horse_archer: { food: 60, wood: 60, stone: 0, gold: 25, pop: 2 },

      // Units - Elephant Pen (War Elephants)
      elephant: { food: 120, wood: 50, stone: 0, gold: 60, pop: 3 },
      elephant_archer: { food: 130, wood: 80, stone: 0, gold: 70, pop: 3 },
      royal_elephant: { food: 180, wood: 100, stone: 0, gold: 120, pop: 4 },

      // Hero Unit - Palace
      general: { food: 150, wood: 80, stone: 0, gold: 100, pop: 3 }
    };

    this.updateHUD();
  }

  canAfford(type) {
    const cost = this.costs[type];
    if (!cost) return false;

    if (cost.food && this.resources.food < cost.food) return false;
    if (cost.wood && this.resources.wood < cost.wood) return false;
    if (cost.stone && this.resources.stone < cost.stone) return false;
    if (cost.gold && this.resources.gold < cost.gold) return false;
    if (cost.pop && (this.resources.population + cost.pop > this.resources.maxPopulation)) return false;

    return true;
  }

  deduct(type) {
    if (!this.canAfford(type)) return false;
    const cost = this.costs[type];

    if (cost.food) this.resources.food -= cost.food;
    if (cost.wood) this.resources.wood -= cost.wood;
    if (cost.stone) this.resources.stone -= cost.stone;
    if (cost.gold) this.resources.gold -= cost.gold;
    if (cost.pop) this.resources.population += cost.pop;

    this.updateHUD();
    return true;
  }

  addResource(type, amount) {
    if (this.resources[type] !== undefined) {
      this.resources[type] += amount;
      this.updateHUD();
    }
  }

  updateHUD() {
    const foodEl = document.getElementById('res-food');
    const woodEl = document.getElementById('res-wood');
    const stoneEl = document.getElementById('res-stone');
    const goldEl = document.getElementById('res-gold');
    const popEl = document.getElementById('res-pop');

    if (foodEl) foodEl.textContent = this.resources.food;
    if (woodEl) woodEl.textContent = this.resources.wood;
    if (stoneEl) stoneEl.textContent = this.resources.stone;
    if (goldEl) goldEl.textContent = this.resources.gold;
    if (popEl) popEl.textContent = `${this.resources.population}/${this.resources.maxPopulation}`;
  }

  updateUI() {
    this.updateHUD();
  }
}
