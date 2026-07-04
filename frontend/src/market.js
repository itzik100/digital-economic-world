// Local market simulation — no backend required.
// Prices fluctuate every ~25s to simulate a live economy.

export const RESOURCES = {
  wood:  { name: 'עץ',      icon: '🪵', basePrice: 8  },
  stone: { name: 'אבן',     icon: '🪨', basePrice: 12 },
  iron:  { name: 'ברזל',    icon: '⚙️', basePrice: 25 },
  water: { name: 'מים',     icon: '💧', basePrice: 5  },
  wheat: { name: 'חיטה',    icon: '🌾', basePrice: 10 },
};

// Items the player can BUY from NPC traders
const NPC_LISTINGS = [
  { id: 'seeds',        name: 'זרעי חיטה',     icon: '🌱', price: 5,  maxQty: 20, seller: 'החקלאי דני' },
  { id: 'fertilizer',  name: 'דשן אורגני',    icon: '🪣', price: 8,  maxQty: 15, seller: 'חנות החקלאות' },
  { id: 'fuel',         name: 'דלק לרובוט',    icon: '⛽', price: 12, maxQty: 10, seller: 'מוסך האיכות' },
  { id: 'blueprint',   name: 'תוכנית בנייה',  icon: '📐', price: 45, maxQty: 5,  seller: 'משרד האדריכל' },
  { id: 'circuit',     name: 'מעגל חשמלי',   icon: '💡', price: 30, maxQty: 8,  seller: 'חנות הטכנולוגיה' },
  { id: 'concrete_bag',name: 'שק מלט',         icon: '🧱', price: 18, maxQty: 12, seller: 'סופר חומרי בניה' },
  { id: 'glass',       name: 'חלונות זכוכית', icon: '🪟', price: 22, maxQty: 10, seller: 'בית הזכוכית' },
  { id: 'paint',       name: 'צבע לבניין',    icon: '🪣', price: 10, maxQty: 20, seller: 'צבעייה גלעד' },
];

export class MarketEngine {
  constructor() {
    this.prices      = {};
    this.history     = {}; // last 12 price points per resource
    this.trends      = {}; // +1 up / -1 down / 0 flat
    this.npcQty      = {}; // current stock

    for (const [k, d] of Object.entries(RESOURCES)) {
      this.prices[k]  = d.basePrice;
      this.history[k] = [d.basePrice];
      this.trends[k]  = 0;
    }
    for (const l of NPC_LISTINGS) {
      this.npcQty[l.id] = l.maxQty;
    }

    this.onPriceUpdate = null; // () => void — called after each fluctuation
    this._interval = setInterval(() => this._fluctuate(), 25_000);
    this._fluctuate(); // immediate first tick
  }

  _fluctuate() {
    for (const [k, d] of Object.entries(RESOURCES)) {
      const old  = this.prices[k];
      // Slight mean-reversion bias + random walk
      const pull = (d.basePrice - old) * 0.08;
      const rand = (Math.random() - 0.48) * d.basePrice * 0.16;
      const next = Math.max(
        Math.round(d.basePrice * 0.45),
        Math.min(Math.round(d.basePrice * 2.6), Math.round(old + pull + rand))
      );
      this.trends[k]  = next > old ? 1 : next < old ? -1 : 0;
      this.prices[k]  = next;
      this.history[k].push(next);
      if (this.history[k].length > 12) this.history[k].shift();
    }

    // Slowly restock NPC items
    for (const l of NPC_LISTINGS) {
      if (this.npcQty[l.id] < l.maxQty) this.npcQty[l.id]++;
    }

    this.onPriceUpdate?.();
  }

  // ── Buy from NPC ────────────────────────────────────────────────────────
  buyFromNPC(listingId, playerTokens) {
    const item = NPC_LISTINGS.find(l => l.id === listingId);
    if (!item)                        return { ok: false, msg: 'פריט לא נמצא' };
    if (this.npcQty[listingId] <= 0) return { ok: false, msg: 'המלאי אזל' };
    if (playerTokens < item.price)   return { ok: false, msg: `חסרים ${item.price - playerTokens} טוקנים` };
    this.npcQty[listingId]--;
    return { ok: true, item, cost: item.price };
  }

  // ── Sell resource ───────────────────────────────────────────────────────
  sellResource(key, qty, inventory) {
    if (!RESOURCES[key])               return { ok: false, msg: 'משאב לא קיים' };
    if ((inventory[key] || 0) < qty)  return { ok: false, msg: 'אין מספיק במלאי' };
    const earned = this.prices[key] * qty;
    return { ok: true, earned, qty };
  }

  // ── Data for UI ─────────────────────────────────────────────────────────
  getBuyListings() {
    return NPC_LISTINGS.map(l => ({ ...l, qty: this.npcQty[l.id] }));
  }

  getSellOptions(inventory) {
    return Object.entries(RESOURCES).map(([k, d]) => ({
      key: k, ...d,
      qty:     inventory[k] || 0,
      price:   this.prices[k],
      trend:   this.trends[k],
      history: [...this.history[k]],
    }));
  }

  getTicker() {
    return Object.entries(RESOURCES).map(([k, d]) => ({
      key: k, name: d.name, icon: d.icon,
      price: this.prices[k],
      trend: this.trends[k],
    }));
  }

  destroy() { clearInterval(this._interval); }
}
