import { API } from './api.js';
import { GameWorld } from './world.js';
import { PixelStream } from './pixelstream.js';
import { HUD } from './hud.js';
import { Panels } from './panels.js';

const DEV_AUTO_LOGIN = import.meta.env?.VITE_DEV_AUTO_LOGIN === 'true';
const DEV_PLAYER = { username: 'שחקן', tokens: 100, level: 1, xp: 0, inventory: [] };

// ---- STARS CANVAS ----
function initStars() {
  const canvas = document.getElementById('stars-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;

  const stars = Array.from({ length: 220 }, () => ({
    x: Math.random() * canvas.width,
    y: Math.random() * canvas.height,
    r: Math.random() * 1.4 + 0.2,
    a: Math.random(),
    speed: Math.random() * 0.008 + 0.002,
    phase: Math.random() * Math.PI * 2
  }));

  function draw(t) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    for (const s of stars) {
      const alpha = 0.3 + 0.7 * (0.5 + 0.5 * Math.sin(t * s.speed + s.phase));
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(255,255,255,${alpha})`;
      ctx.fill();
    }
    requestAnimationFrame(draw);
  }
  requestAnimationFrame(draw);
}
initStars();

let player = null;
let token = null;
let pixelStream = null;
let hud = null;
let world = null;
let panels = null;

// ---- SCREEN MANAGER ----
function showScreen(id) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  document.getElementById(id).classList.add('active');
}

function setSession(nextToken, nextPlayer) {
  token = nextToken;
  player = nextPlayer;
  API.setToken(token);
  localStorage.setItem('dw_token', token);
}

function clearSession() {
  token = null;
  player = null;
  API.clearToken();
  localStorage.removeItem('dw_token');
}

function inventoryMap(items = []) {
  return items.reduce((acc, item) => {
    if (item.resource?.name) acc[item.resource.name] = item.quantity;
    return acc;
  }, {});
}

async function restoreSession() {
  const savedToken = localStorage.getItem('dw_token');
  if (!savedToken) return false;

  try {
    token = savedToken;
    API.setToken(savedToken);
    player = await API.get('/player/me');
    startLoadingSequence();
    return true;
  } catch {
    clearSession();
    showScreen('login-screen');
    return false;
  }
}

// ---- GOOGLE SIGN-IN ----
document.getElementById('btn-google-signin').addEventListener('click', () => {
  // Build Google OAuth URL
  const GOOGLE_CLIENT_ID = import.meta.env?.VITE_GOOGLE_CLIENT_ID || '';

  if (!GOOGLE_CLIENT_ID) {
    // Dev mode: skip Google, enter as guest with Google-style profile
    player = {
      username: 'משתמש גוגל',
      email: 'google@demo.com',
      tokens: 150,
      level: 1,
      xp: 0,
      inventory: [],
      avatarUrl: 'https://lh3.googleusercontent.com/a/default-user',
    };
    startLoadingSequence();
    return;
  }

  const params = new URLSearchParams({
    client_id: GOOGLE_CLIENT_ID,
    redirect_uri: window.location.origin + '/auth/google/callback',
    response_type: 'code',
    scope: 'openid email profile',
    prompt: 'select_account',
  });
  window.location.href = `https://accounts.google.com/o/oauth2/v2/auth?${params}`;
});

// ---- AUTH TABS ----
document.querySelectorAll('.auth-tab').forEach(tab => {
  tab.addEventListener('click', () => {
    document.querySelectorAll('.auth-tab').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.auth-form').forEach(f => f.classList.remove('active'));
    tab.classList.add('active');
    document.getElementById(tab.dataset.tab + '-form').classList.add('active');
  });
});

// ---- AUTH ----
document.getElementById('login-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const email = document.getElementById('login-email').value;
  const password = document.getElementById('login-password').value;

  try {
    const res = await API.post('/auth/login', { email, password });
    setSession(res.token, res.player);
    startLoadingSequence();
  } catch (err) {
    alert(err.message || 'שגיאה בכניסה');
  }
});

document.getElementById('register-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const username = document.getElementById('reg-username').value;
  const email = document.getElementById('reg-email').value;
  const password = document.getElementById('reg-password').value;

  try {
    const res = await API.post('/auth/register', { username, email, password });
    setSession(res.token, res.player);
    startLoadingSequence();
  } catch (err) {
    alert(err.message || 'שגיאה בהרשמה');
  }
});


// ---- LOADING SEQUENCE (Earth zoom-in) ----
async function startLoadingSequence() {
  showScreen('loading-screen');
  const fill = document.getElementById('loading-fill');

  const steps = [
    { pct: 15, text: 'טוען נתוני שחקן...' },
    { pct: 35, text: 'יוצר את העולם...' },
    { pct: 55, text: 'טוען משאבים...' },
    { pct: 75, text: 'מחבר לשרת המשחק...' },
    { pct: 95, text: 'כמעט מוכן...' },
  ];

  for (const step of steps) {
    document.querySelector('.zoom-text p').textContent = step.text;
    fill.style.width = step.pct + '%';
    await sleep(600);
  }

  // Fetch full player data
  try {
    if (token) player = await API.get('/player/me');
  } catch {
    if (!DEV_AUTO_LOGIN) {
      clearSession();
      alert('החיבור לשרת פג. התחבר מחדש.');
      showScreen('login-screen');
      return;
    }
  }

  fill.style.width = '100%';
  await sleep(400);
  enterGame();
}

// ---- ENTER GAME ----
function enterGame() {
  showScreen('game-screen');

  hud = new HUD(player, token);
  hud.init();
  hud.notify('ברוך הבא לעולם הדיגיטלי! 🌍', 'success');
  hud.notify('WASD להזזה • לחץ על עצים/אבנים לאסוף', 'info');

  // Start Three.js world
  const worldContainer = document.getElementById('world-container');
  worldContainer.innerHTML = '';
  world = new GameWorld(worldContainer);
  world.inventory = { ...world.inventory, ...inventoryMap(player.inventory) };
  world.init();

  // Resource collected in world → update HUD + backend
  const RESOURCE_ICONS = { wood: '🪵', stone: '🪨', iron: '⚙️', water: '💧' };
  world.onCollect = async (type, label, qty) => {
    hud.updateResource(type, qty);
    hud.notify(`+${qty} ${label} ${RESOURCE_ICONS[type] || ''}`, 'success');
    // Earn tokens for collecting
    const tokens = qty * 2;
    hud.updateTokens(tokens);
    hud.notify(`+${tokens} טוקנים 🪙`, 'info');

    if (!token) return;
    try {
      await API.post('/inventory/collect', { resourceName: type, quantity: qty });
    } catch (err) {
      hud.notify(err.message || 'המשאב נשמר מקומית בלבד', 'error');
    }
  };

  world.onPositionUpdate = (x, z) => hud.updateMinimap(x, z);

  world.onBuild = (type, cost) => {
    const names = { house: 'בית', farm: 'חווה', printer: 'מדפסת בטון' };
    const icons = { house: '🏠', farm: '🌾', printer: '🏭' };
    hud.notify(`${icons[type] || '🏗️'} ${names[type] || type} נבנה!`, 'success');
    // Deduct from HUD resource display
    for (const [res, qty] of Object.entries(cost)) {
      hud.updateResource(res, -qty);
    }
  };

  panels = new Panels(
    token, null, hud,
    () => hud.resources,
    () => hud.player.tokens
  );
  panels.init();
}

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

// ---- BOOT ----
if (DEV_AUTO_LOGIN) {
  player = DEV_PLAYER;
  startLoadingSequence();
} else {
  restoreSession();
}
