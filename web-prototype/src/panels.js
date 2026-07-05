import { MarketEngine, RESOURCES } from './market.js';
import { GlobeMap } from './globemap.js';

export class Panels {
  constructor(token, pixelStream, hud, getInventory, getTokens) {
    this.hud          = hud;
    this.getInventory = getInventory; // () => { wood, stone, iron, ... }
    this.getTokens    = getTokens;   // () => number
    this.market       = new MarketEngine();
    this.market.onPriceUpdate = () => this._refreshTicker();
    this.globe        = new GlobeMap(hud);
    this.focusIndex   = 0;
  }

  init() {
    // Panel buttons
    document.getElementById('btn-inventory').onclick = () => this.openPanel('inventory');
    document.getElementById('btn-market').onclick    = () => this.openPanel('market');
    document.getElementById('btn-robots').onclick    = () => this.openPanel('robots');
    document.getElementById('btn-quests').onclick    = () => this.openPanel('quests');
    document.getElementById('btn-build')?.addEventListener('click', () => {
      this.closeAll();
      const buildPanel = document.getElementById('build-panel');
      if (buildPanel?.classList.contains('open')) {
        buildPanel.classList.remove('open');
        document.getElementById('btn-build')?.classList.remove('active');
      } else {
        document.dispatchEvent(new KeyboardEvent('keydown', { code: 'KeyB' }));
      }
    });

    // Sync build-panel open/close with hotbar active state (panel may not exist yet)
    const attachBuildObserver = () => {
      const bp = document.getElementById('build-panel');
      if (!bp) return;
      new MutationObserver(() => {
        document.getElementById('btn-build')?.classList.toggle('active', bp.classList.contains('open'));
      }).observe(bp, { attributes: true, attributeFilter: ['class'] });
    };
    // Try immediately; if not mounted yet, watch body for it to appear
    if (document.getElementById('build-panel')) {
      attachBuildObserver();
    } else {
      const bodyObs = new MutationObserver((_, obs) => {
        if (document.getElementById('build-panel')) { obs.disconnect(); attachBuildObserver(); }
      });
      bodyObs.observe(document.body, { childList: true, subtree: false });
    }

    // Close buttons
    document.querySelectorAll('.panel-close').forEach(btn => {
      btn.onclick = () => this.closeAll();
    });

    // Market tabs
    document.querySelectorAll('.tab-btn').forEach(btn => {
      btn.onclick = (e) => {
        document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
        e.target.classList.add('active');
        if (e.target.dataset.tab === 'buy') this._renderBuy();
        else this._renderSell();
        this._focusPanelItem(0);
      };
    });

    // Hotbar click → open matching panel
    document.getElementById('btn-farm')?.addEventListener('click', () => {
      this.hud.notify('🌾 מערכת חקלאות — בקרוב!', 'info');
    });
    document.getElementById('btn-map')?.addEventListener('click', () => {
      this.closeAll();
      document.getElementById('btn-map')?.classList.add('active');
      this.globe.open();
    });

    // Keyboard shortcuts
    document.addEventListener('keydown', e => {
      const openPanel = document.querySelector('.game-panel:not(.hidden)');
      if (openPanel && this._handlePanelKey(e, openPanel)) return;

      // Digit shortcuts for hotbar
      const map = { Digit1: 'inventory', Digit2: 'market', Digit3: 'robots', Digit6: 'quests' };
      if (map[e.code]) { e.preventDefault(); this._togglePanel(map[e.code]); return; }
      if (e.code === 'Digit4') { e.preventDefault(); this.hud.notify('🌾 מערכת חקלאות — בקרוב!', 'info'); return; }
      if (e.code === 'Digit7') {
        e.preventDefault();
        if (document.getElementById('globe-overlay')) { this.globe.close(); document.getElementById('btn-map')?.classList.remove('active'); }
        else { this.closeAll(); document.getElementById('btn-map')?.classList.add('active'); this.globe.open(); }
        return;
      }

      // Letter shortcuts
      if (e.code === 'KeyM') { e.preventDefault(); this._togglePanel('market'); }
      if (e.code === 'KeyI') { e.preventDefault(); this._togglePanel('inventory'); }
    });

    this._buildTicker();
    this._buildEconomyBar();
  }

  closeAll() {
    document.querySelectorAll('.game-panel').forEach(p => p.classList.add('hidden'));
    document.querySelectorAll('.hotbar-slot').forEach(s => s.classList.remove('active'));
    if (document.getElementById('globe-overlay')) this.globe.close();
    this.focusIndex = 0;
  }

  _togglePanel(name) {
    const el = document.getElementById(`panel-${name}`);
    if (el && !el.classList.contains('hidden')) { this.closeAll(); return; }
    this.openPanel(name);
  }

  openPanel(name) {
    this.closeAll();
    // Close build panel too
    document.getElementById('build-panel')?.classList.remove('open');
    const el = document.getElementById(`panel-${name}`);
    if (!el) return;
    el.classList.remove('hidden');
    // Mark hotbar slot active
    const slotMap = { inventory: 'btn-inventory', market: 'btn-market', robots: 'btn-robots', quests: 'btn-quests' };
    if (slotMap[name]) document.getElementById(slotMap[name])?.classList.add('active');

    if (name === 'inventory') this._renderInventory();
    if (name === 'market')    this._renderBuy();
    if (name === 'robots')    this._renderRobots();
    if (name === 'quests')    this._renderQuests();
    this._focusPanelItem(0);
  }

  _handlePanelKey(e, panel) {
    const handledKeys = ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Enter', 'Space', 'Escape'];
    if (!handledKeys.includes(e.code)) return false;

    e.preventDefault();
    e.stopPropagation();

    if (e.code === 'Escape') {
      this.closeAll();
      return true;
    }

    const items = this._panelFocusItems(panel);
    if (!items.length) return true;

    if (e.code === 'ArrowDown' || e.code === 'ArrowLeft') this._focusPanelItem(this.focusIndex + 1, panel);
    if (e.code === 'ArrowUp' || e.code === 'ArrowRight') this._focusPanelItem(this.focusIndex - 1, panel);
    if (e.code === 'Enter' || e.code === 'Space') this._activatePanelItem(items[this.focusIndex]);

    return true;
  }

  _panelFocusItems(panel = document.querySelector('.game-panel:not(.hidden)')) {
    if (!panel) return [];
    return [...panel.querySelectorAll('button:not(:disabled), input:not(:disabled)')]
      .filter(el => el.offsetParent !== null);
  }

  _focusPanelItem(index, panel = document.querySelector('.game-panel:not(.hidden)')) {
    const items = this._panelFocusItems(panel);
    if (!items.length) return;

    this.focusIndex = (index + items.length) % items.length;
    items.forEach((item, i) => item.classList.toggle('keyboard-selected', i === this.focusIndex));
    items[this.focusIndex].focus({ preventScroll: true });
  }

  _activatePanelItem(item) {
    if (!item) return;
    if (item.matches('input')) {
      item.select?.();
      return;
    }
    item.click();
    setTimeout(() => this._focusPanelItem(Math.min(this.focusIndex, this._panelFocusItems().length - 1)), 0);
  }

  // ── Inventory ──────────────────────────────────────────────────────────────
  _renderInventory() {
    const inv = this.getInventory();
    const grid = document.getElementById('inventory-grid');
    grid.innerHTML = '';

    const allRes = Object.entries(RESOURCES);
    let hasItems = false;

    for (const [key, def] of allRes) {
      const qty = inv[key] || 0;
      const el = document.createElement('div');
      el.className = 'inv-slot' + (qty > 0 ? ' has-items' : '');
      el.innerHTML = `
        <span class="slot-icon">${def.icon}</span>
        <span class="slot-name">${def.name}</span>
        <span class="slot-qty">${qty}</span>
        ${qty > 0 ? `<span class="slot-value">🪙 ${def.basePrice * qty}</span>` : ''}
      `;
      grid.appendChild(el);
      if (qty > 0) hasItems = true;
    }

    if (!hasItems) {
      const empty = document.createElement('p');
      empty.style.cssText = 'color:var(--text-muted);text-align:center;padding:30px;grid-column:1/-1';
      empty.textContent = 'התיק ריק — אסוף עצים ואבנים בעולם!';
      grid.appendChild(empty);
    }

    // Net worth summary
    const total = Object.entries(RESOURCES)
      .reduce((sum, [k, d]) => sum + (inv[k] || 0) * d.basePrice, 0);
    const summary = document.createElement('div');
    summary.className = 'inv-summary';
    summary.innerHTML = `<span>שווי כולל:</span><span>🪙 ${total} טוקנים</span>`;
    grid.appendChild(summary);
  }

  // ── Market — Buy tab ───────────────────────────────────────────────────────
  _renderBuy() {
    const el = document.getElementById('market-listings');
    el.innerHTML = '';

    for (const listing of this.market.getBuyListings()) {
      const card = document.createElement('div');
      card.className = 'market-item';
      card.innerHTML = `
        <div class="market-item-left">
          <span class="market-item-icon">${listing.icon}</span>
          <div class="market-item-info">
            <div class="market-item-name">${listing.name}</div>
            <div class="market-item-seller">מוכר: ${listing.seller}</div>
            <div class="market-stock ${listing.qty < 3 ? 'low' : ''}">מלאי: ${listing.qty}</div>
          </div>
        </div>
        <div class="market-item-right">
          <span class="market-item-price">🪙 ${listing.price}</span>
          <button class="btn-buy ${listing.qty === 0 ? 'disabled' : ''}"
            data-id="${listing.id}" ${listing.qty === 0 ? 'disabled' : ''}>
            ${listing.qty === 0 ? 'אזל' : 'קנה'}
          </button>
        </div>
      `;
      card.querySelector('.btn-buy')?.addEventListener('click', () => this._doBuy(listing.id));
      el.appendChild(card);
    }
    this._focusPanelItem(Math.min(this.focusIndex, this._panelFocusItems().length - 1));
  }

  _doBuy(id) {
    const tokens = this.getTokens();
    const result = this.market.buyFromNPC(id, tokens);
    if (!result.ok) { this.hud.notify(result.msg, 'error'); return; }
    this.hud.updateTokens(-result.cost);
    this.hud.notify(`${result.item.icon} קנית ${result.item.name}! ‑${result.cost}🪙`, 'success');
    this._renderBuy();
  }

  // ── Market — Sell tab ──────────────────────────────────────────────────────
  _renderSell() {
    const el = document.getElementById('market-listings');
    el.innerHTML = '';
    const inv = this.getInventory();
    const opts = this.market.getSellOptions(inv);
    const hasAnything = opts.some(o => o.qty > 0);

    if (!hasAnything) {
      el.innerHTML = '<p style="color:var(--text-muted);text-align:center;padding:30px">אין משאבים למכירה<br><small>אסוף עצים ואבנים בעולם</small></p>';
      return;
    }

    for (const opt of opts) {
      const trendIcon  = opt.trend > 0 ? '📈' : opt.trend < 0 ? '📉' : '➡️';
      const trendClass = opt.trend > 0 ? 'trend-up' : opt.trend < 0 ? 'trend-down' : '';
      const card = document.createElement('div');
      card.className = 'market-item';
      card.innerHTML = `
        <div class="market-item-left">
          <span class="market-item-icon">${opt.icon}</span>
          <div class="market-item-info">
            <div class="market-item-name">${opt.name}</div>
            <div class="market-item-seller">במלאי שלך: ${opt.qty}</div>
            <div class="price-chart-wrap" id="chart-${opt.key}"></div>
          </div>
        </div>
        <div class="market-item-right">
          <span class="market-item-price ${trendClass}">${trendIcon} 🪙 ${opt.price}</span>
          <div class="sell-row">
            <input type="number" id="qty-${opt.key}" value="1" min="1" max="${opt.qty}" class="sell-input" />
            <button class="btn-sell" data-key="${opt.key}">מכור</button>
          </div>
        </div>
      `;
      card.querySelector('.btn-sell').addEventListener('click', () => {
        const qty = parseInt(document.getElementById(`qty-${opt.key}`).value) || 1;
        this._doSell(opt.key, qty);
      });
      el.appendChild(card);

      // Mini price chart
      setTimeout(() => this._drawMiniChart(opt.key, opt.history), 0);
    }
    this._focusPanelItem(Math.min(this.focusIndex, this._panelFocusItems().length - 1));
  }

  _doSell(key, qty) {
    const inv = this.getInventory();
    const result = this.market.sellResource(key, qty, inv);
    if (!result.ok) { this.hud.notify(result.msg, 'error'); return; }

    // Deduct from world inventory
    inv[key] = (inv[key] || 0) - qty;
    this.hud.updateResource(key, -qty);
    this.hud.updateTokens(result.earned);
    this.hud.notify(`${RESOURCES[key].icon} מכרת ${qty}× ${RESOURCES[key].name} | +${result.earned}🪙`, 'success');
    this._renderSell();
  }

  _drawMiniChart(key, history) {
    const wrap = document.getElementById(`chart-${key}`);
    if (!wrap) return;
    const canvas = document.createElement('canvas');
    canvas.width  = 80;
    canvas.height = 28;
    canvas.className = 'mini-chart';
    wrap.appendChild(canvas);
    const ctx = canvas.getContext('2d');

    const min = Math.min(...history);
    const max = Math.max(...history) || 1;
    const range = max - min || 1;
    const pts = history.map((v, i) => ({
      x: (i / (history.length - 1)) * 78 + 1,
      y: 26 - ((v - min) / range) * 24 + 1,
    }));

    const last   = history[history.length - 1];
    const first  = history[0];
    const rising = last >= first;

    ctx.strokeStyle = rising ? '#22c55e' : '#ef4444';
    ctx.lineWidth   = 1.5;
    ctx.beginPath();
    pts.forEach((p, i) => i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y));
    ctx.stroke();

    // Fill below line
    ctx.lineTo(pts[pts.length - 1].x, 28);
    ctx.lineTo(pts[0].x, 28);
    ctx.closePath();
    ctx.fillStyle = rising ? 'rgba(34,197,94,0.12)' : 'rgba(239,68,68,0.12)';
    ctx.fill();
  }

  // ── Price Ticker ──────────────────────────────────────────────────────────
  _buildTicker() {
    const ticker = document.createElement('div');
    ticker.id = 'price-ticker';
    ticker.innerHTML = `<div class="ticker-label">שוק חי</div><div class="ticker-track" id="ticker-track"></div>`;
    document.getElementById('hud').appendChild(ticker);
    this._refreshTicker();
  }

  _refreshTicker() {
    const track = document.getElementById('ticker-track');
    if (!track) return;
    const items = this.market.getTicker();
    // Duplicate for seamless scroll
    const html = [...items, ...items].map(t => {
      const tClass = t.trend > 0 ? 'tick-up' : t.trend < 0 ? 'tick-down' : '';
      const arrow  = t.trend > 0 ? '▲' : t.trend < 0 ? '▼' : '—';
      return `<span class="tick-item ${tClass}">${t.icon} ${t.name} <strong>🪙${t.price}</strong> <span class="tick-arrow">${arrow}</span></span>`;
    }).join('');
    track.innerHTML = html;
  }

  // ── Economy Summary Bar ───────────────────────────────────────────────────
  _buildEconomyBar() {
    const bar = document.createElement('div');
    bar.id = 'economy-bar';
    bar.innerHTML = `
      <div class="eco-stat"><span class="eco-icon">📊</span><span>כלכלת העולם</span></div>
      <div class="eco-stat" id="eco-trades"><span class="eco-icon">🔄</span><span id="eco-trade-count">0</span><span>עסקאות היום</span></div>
      <div class="eco-stat" id="eco-total"><span class="eco-icon">🪙</span><span id="eco-volume">0</span><span>נפח מסחר</span></div>
      <div class="eco-stat"><span class="eco-icon">📈</span><span id="eco-trend">יציב</span></div>
    `;
    document.getElementById('hud').appendChild(bar);

    // Simulate activity
    let trades = 0, volume = 0;
    setInterval(() => {
      trades += Math.floor(Math.random() * 3);
      volume += Math.floor(Math.random() * 50 + 10);
      const el1 = document.getElementById('eco-trade-count');
      const el2 = document.getElementById('eco-volume');
      const el3 = document.getElementById('eco-trend');
      if (el1) el1.textContent = trades;
      if (el2) el2.textContent = volume.toLocaleString();
      if (el3) {
        const trends = this.market.getTicker().map(t => t.trend);
        const up = trends.filter(t => t > 0).length;
        const down = trends.filter(t => t < 0).length;
        el3.textContent = up > down ? '🟢 עולה' : down > up ? '🔴 יורד' : '🟡 יציב';
      }
    }, 8000);
  }

  // ── Robots panel ──────────────────────────────────────────────────────────
  _renderRobots() {
    const el = document.getElementById('robots-list');
    const robots = [
      { type: 'farm',         name: 'רובוט חקלאי',       icon: '🌾', price: 15, desc: 'אוסף יבולים אוטומטית',    available: true  },
      { type: 'mining',       name: 'רובוט כרייה',       icon: '⛏️', price: 25, desc: 'כורה אבנים וברזל',        available: true  },
      { type: 'construction', name: 'רובוט בנייה',       icon: '🏗️', price: 35, desc: 'בונה מבנים מהר יותר',     available: false },
      { type: 'transport',    name: 'רובוט הובלה',       icon: '🚁', price: 20, desc: 'מעביר משאבים בין אזורים', available: true  },
    ];
    el.innerHTML = '';
    for (const r of robots) {
      const div = document.createElement('div');
      div.className = 'robot-card';
      div.innerHTML = `
        <span class="robot-icon">${r.icon}</span>
        <div class="robot-info">
          <div class="robot-name">${r.name}</div>
          <div class="robot-desc">${r.desc}</div>
          <div class="robot-price">🪙 ${r.price} לשעה</div>
        </div>
        <button class="btn-rent" data-type="${r.type}" ${!r.available ? 'disabled' : ''}>
          ${r.available ? 'השכר' : 'לא זמין'}
        </button>
      `;
      if (r.available) {
        div.querySelector('.btn-rent').addEventListener('click', () => {
          const tokens = this.getTokens();
          if (tokens < r.price) { this.hud.notify(`חסרים ${r.price - tokens} טוקנים`, 'error'); return; }
          this.hud.updateTokens(-r.price);
          this.hud.notify(`${r.icon} ${r.name} הוזמן לשעה! 🤖`, 'success');
        });
      }
      el.appendChild(div);
    }
  }

  // ── Quests panel ──────────────────────────────────────────────────────────
  _renderQuests() {
    const el = document.getElementById('quests-list');
    const quests = [
      { name: 'קוצר ראשון',       desc: 'אסוף 10 עצים מהיער',                reward: 50,  xp: 100, done: false },
      { name: 'בונה מתחיל',       desc: 'בנה את הבית הראשון שלך',            reward: 100, xp: 200, done: false },
      { name: 'סוחר בכוח',        desc: 'בצע 3 עסקאות בשוק',                reward: 75,  xp: 150, done: false },
      { name: 'בעל רובוט',        desc: 'השכר רובוט לראשונה',               reward: 60,  xp: 120, done: false },
      { name: 'חקלאי מצטיין',     desc: 'בנה חלקת חקלאות ואסוף חיטה',       reward: 80,  xp: 160, done: false },
    ];
    el.innerHTML = '';
    for (const q of quests) {
      const div = document.createElement('div');
      div.className = 'quest-item';
      div.innerHTML = `
        <div class="quest-name">${q.done ? '✅' : '🔄'} ${q.name}</div>
        <div class="quest-desc">${q.desc}</div>
        <div class="quest-reward">🪙 ${q.reward} טוקנים · ✨ ${q.xp} XP</div>
      `;
      el.appendChild(div);
    }
  }

  destroy() { this.market.destroy(); }
}
