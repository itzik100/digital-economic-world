export class HUD {
  constructor(player, token) {
    this.player = player;
    this.resources = {};
  }

  init() {
    document.getElementById('player-name').textContent = this.player.username;
    document.getElementById('token-amount').textContent = this.player.tokens;
    document.getElementById('player-level').textContent = `רמה ${this.player.level}`;

    const xpPct = Math.min((this.player.xp % 1000) / 10, 100);
    document.getElementById('xp-fill').style.width = xpPct + '%';

    this.startWorldClock();

    // Populate resources from inventory
    if (this.player.inventory) {
      for (const item of this.player.inventory) {
        this.updateResource(item.resource.name, item.quantity);
      }
    }
  }

  updateTokens(amount) {
    this.player.tokens = (this.player.tokens || 0) + amount;
    document.getElementById('token-amount').textContent = this.player.tokens;
  }

  setTokens(amount) {
    this.player.tokens = amount;
    document.getElementById('token-amount').textContent = amount;
  }

  updateResource(name, quantity) {
    this.resources[name] = Math.max(0, (this.resources[name] || 0) + quantity);
    const el = document.getElementById(`res-${name}`);
    if (el) el.textContent = this.resources[name];
  }

  updateMinimap(x, z) {
    const dot = document.getElementById('player-dot');
    // Normalize world coordinates to minimap (150x150px)
    const mapSize = 150;
    const worldSize = 10000;
    const px = Math.max(0, Math.min(mapSize, ((x + worldSize / 2) / worldSize) * mapSize));
    const py = Math.max(0, Math.min(mapSize, ((z + worldSize / 2) / worldSize) * mapSize));
    dot.style.left = px + 'px';
    dot.style.top = py + 'px';
  }

  notify(message, type = 'info') {
    const el = document.createElement('div');
    el.className = `notification ${type}`;
    const icons = { success: '✅', error: '❌', info: 'ℹ️' };
    el.innerHTML = `<span>${icons[type] || 'ℹ️'}</span><span>${message}</span>`;
    document.getElementById('notifications').prepend(el);
    setTimeout(() => el.remove(), 3500);
  }

  startWorldClock() {
    const el = document.getElementById('time-display');
    const phases = ['🌅 בוקר', '☀️ צהריים', '🌆 ערב', '🌙 לילה'];
    let i = 0;
    el.textContent = phases[0];
    setInterval(() => {
      i = (i + 1) % phases.length;
      el.textContent = phases[i];
    }, 5 * 60 * 1000);
  }
}
