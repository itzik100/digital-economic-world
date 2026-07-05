import * as THREE from 'three';

// Game regions with lat/lng, color, and metadata
const REGIONS = [
  {
    id: 'israel',
    name: 'ישראל',
    nameEn: 'Israel',
    lat: 31.5,
    lng: 35.0,
    color: 0x00d4ff,
    players: 47,
    resources: ['עץ', 'אבן', 'חיטה'],
    economy: 'מתפתחת',
    isHome: true,
    unlocked: true,
  },
  {
    id: 'europe',
    name: 'אירופה',
    nameEn: 'Europe',
    lat: 50.0,
    lng: 10.0,
    color: 0x22c55e,
    players: 142,
    resources: ['ברזל', 'פחם', 'עץ'],
    economy: 'מתקדמת',
    unlocked: true,
  },
  {
    id: 'northamerica',
    name: 'צפון אמריקה',
    nameEn: 'N. America',
    lat: 40.0,
    lng: -100.0,
    color: 0xf5a623,
    players: 89,
    resources: ['נפט', 'ברזל', 'מים'],
    economy: 'מובילה',
    unlocked: true,
  },
  {
    id: 'asia',
    name: 'אסיה',
    nameEn: 'Asia',
    lat: 35.0,
    lng: 105.0,
    color: 0xef4444,
    players: 203,
    resources: ['מחצבים', 'אורז', 'ברזל'],
    economy: 'צומחת במהירות',
    unlocked: true,
  },
  {
    id: 'africa',
    name: 'אפריקה',
    nameEn: 'Africa',
    lat: 0.0,
    lng: 20.0,
    color: 0x7c3aed,
    players: 31,
    resources: ['יהלומים', 'זהב', 'קובלט'],
    economy: 'עם פוטנציאל',
    unlocked: false,
  },
  {
    id: 'southamerica',
    name: 'דרום אמריקה',
    nameEn: 'S. America',
    lat: -15.0,
    lng: -60.0,
    color: 0x84cc16,
    players: 58,
    resources: ['קפה', 'עץ', 'ריו'],
    economy: 'מתפתחת',
    unlocked: false,
  },
];

function latLngToXYZ(lat, lng, r = 1) {
  const phi   = (90 - lat) * (Math.PI / 180);
  const theta = (lng + 180) * (Math.PI / 180);
  return new THREE.Vector3(
    -r * Math.sin(phi) * Math.cos(theta),
     r * Math.cos(phi),
     r * Math.sin(phi) * Math.sin(theta),
  );
}

export class GlobeMap {
  constructor(hud) {
    this.hud      = hud;
    this.overlay  = null;
    this.scene    = null;
    this.camera   = null;
    this.renderer = null;
    this.globe    = null;
    this.markers  = [];
    this._raf     = null;
    this._isDragging = false;
    this._lastMouse  = { x: 0, y: 0 };
    this._rotVel     = { x: 0, y: 0 };
    this._rotTarget  = { x: 0.3, y: 0 };
    this._rotCurrent = { x: 0.3, y: 0 };
    this._zoom       = 2.8;
    this._selectedRegion = null;
  }

  open() {
    if (this.overlay) return;
    this._buildOverlay();
    this._initThree();
    this._buildGlobe();
    this._buildMarkers();
    this._bindEvents();
    this._animate();
  }

  close() {
    if (!this.overlay) return;
    this.overlay.classList.add('globe-closing');
    setTimeout(() => {
      cancelAnimationFrame(this._raf);
      this.renderer?.dispose();
      this.overlay?.remove();
      this.overlay  = null;
      this.renderer = null;
    }, 400);
  }

  // ── Build DOM ──────────────────────────────────────────────────────────────
  _buildOverlay() {
    const el = document.createElement('div');
    el.id = 'globe-overlay';
    el.innerHTML = `
      <div class="globe-header">
        <h2 class="globe-title">🌍 מפת העולם</h2>
        <div class="globe-hint">גרור לסיבוב • גלגל לזום • לחץ על עיגול לבחירת אזור</div>
        <button class="globe-close" id="globe-close-btn">✕ סגור</button>
      </div>
      <canvas id="globe-canvas"></canvas>

      <!-- Zoom controls — bottom center -->
      <div class="globe-zoom-controls">
        <button class="globe-zoom-btn" id="globe-zoom-in" title="קרב">＋ זום פנימה</button>
        <button class="globe-zoom-btn" id="globe-zoom-reset" title="תצוגת עולם">🌍 תצוגת עולם</button>
        <button class="globe-zoom-btn" id="globe-zoom-out" title="התרחק">－ זום החוצה</button>
      </div>

      <div class="globe-region-info hidden" id="globe-region-info"></div>
      <div class="globe-legend">
        <div class="legend-item"><span class="legend-dot" style="background:#00d4ff"></span>אזור הבית</div>
        <div class="legend-item"><span class="legend-dot" style="background:#22c55e"></span>פתוח</div>
        <div class="legend-item"><span class="legend-dot" style="background:#64748b"></span>נעול</div>
      </div>
    `;
    document.body.appendChild(el);
    this.overlay = el;

    requestAnimationFrame(() => el.classList.add('globe-open'));
    document.getElementById('globe-close-btn').onclick = () => this.close();

    document.getElementById('globe-zoom-in').onclick = () => {
      this._zoom = Math.max(1.3, this._zoom - 0.5);
    };
    document.getElementById('globe-zoom-out').onclick = () => {
      this._zoom = Math.min(5.0, this._zoom + 0.5);
    };
    document.getElementById('globe-zoom-reset').onclick = () => {
      this._zoom = 2.8;
      this._hideRegionInfo();
    };
  }

  // ── Three.js setup ────────────────────────────────────────────────────────
  _initThree() {
    const canvas = document.getElementById('globe-canvas');
    const w = window.innerWidth;
    const h = window.innerHeight;

    this.scene    = new THREE.Scene();
    this.camera   = new THREE.PerspectiveCamera(45, w / h, 0.1, 100);
    this.camera.position.z = this._zoom;

    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
    this.renderer.setSize(w, h);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.setClearColor(0x000000, 0);

    // Ambient + directional light (sun from the right)
    this.scene.add(new THREE.AmbientLight(0x334466, 1.2));
    const sun = new THREE.DirectionalLight(0xffffff, 2.5);
    sun.position.set(5, 3, 5);
    this.scene.add(sun);

    // Stars background
    const starGeo = new THREE.BufferGeometry();
    const starPos = new Float32Array(3000);
    for (let i = 0; i < 3000; i++) {
      const theta = Math.random() * Math.PI * 2;
      const phi   = Math.acos(2 * Math.random() - 1);
      const r     = 50 + Math.random() * 10;
      starPos[i * 3]     = r * Math.sin(phi) * Math.cos(theta);
      starPos[i * 3 + 1] = r * Math.cos(phi);
      starPos[i * 3 + 2] = r * Math.sin(phi) * Math.sin(theta);
    }
    starGeo.setAttribute('position', new THREE.BufferAttribute(starPos, 3));
    this.scene.add(new THREE.Points(starGeo, new THREE.PointsMaterial({ color: 0xffffff, size: 0.08 })));
  }

  _buildGlobe() {
    const geo = new THREE.SphereGeometry(1, 64, 64);

    // Ocean (base sphere)
    const oceanMat = new THREE.MeshPhongMaterial({
      color: 0x0d47a1,
      emissive: 0x001133,
      shininess: 80,
      specular: 0x224488,
    });
    const ocean = new THREE.Mesh(geo, oceanMat);
    this.scene.add(ocean);
    this.globe = new THREE.Group();
    this.globe.add(ocean);

    // Land layer (procedural continents using vertex shader trick via canvas texture)
    const landTex = this._makeLandTexture();
    const landMat = new THREE.MeshPhongMaterial({
      map: landTex,
      transparent: true,
      shininess: 20,
    });
    const land = new THREE.Mesh(new THREE.SphereGeometry(1.001, 64, 64), landMat);
    this.globe.add(land);

    // Atmosphere glow
    const atmMat = new THREE.MeshPhongMaterial({
      color: 0x4488ff,
      transparent: true,
      opacity: 0.08,
      side: THREE.BackSide,
    });
    const atm = new THREE.Mesh(new THREE.SphereGeometry(1.12, 32, 32), atmMat);
    this.globe.add(atm);

    // Cloud layer
    const cloudTex = this._makeCloudTexture();
    const cloudMat = new THREE.MeshPhongMaterial({
      map: cloudTex,
      transparent: true,
      opacity: 0.35,
      depthWrite: false,
    });
    this._clouds = new THREE.Mesh(new THREE.SphereGeometry(1.015, 48, 48), cloudMat);
    this.globe.add(this._clouds);

    this.scene.add(this.globe);
  }

  _makeLandTexture() {
    const c = document.createElement('canvas');
    c.width = 1024; c.height = 512;
    const ctx = c.getContext('2d');

    // Base transparent
    ctx.clearRect(0, 0, 1024, 512);

    // Draw simplified continent shapes
    const continents = [
      // North America
      { path: [[190,80],[240,75],[290,90],[310,130],[295,180],[270,220],[240,250],[210,260],[185,240],[175,200],[170,150],[180,110]], color: '#2d5a1a' },
      // South America
      { path: [[230,260],[270,255],[300,290],[310,340],[290,390],[265,430],[240,440],[215,410],[205,360],[210,310],[215,275]], color: '#2d5a1a' },
      // Europe
      { path: [[460,70],[510,65],[550,75],[560,100],[540,130],[510,145],[480,140],[455,120],[450,95]], color: '#2d5a1a' },
      // Africa
      { path: [[470,150],[520,140],[560,160],[570,210],[565,270],[550,330],[520,390],[490,400],[460,380],[445,320],[440,260],[450,200]], color: '#2d5a1a' },
      // Asia
      { path: [[560,65],[650,55],[760,60],[830,80],[870,110],[860,160],[820,190],[780,200],[720,210],[650,200],[590,180],[560,150],[545,110]], color: '#2d5a1a' },
      // Australia
      { path: [[730,280],[790,270],[830,290],[840,330],[820,370],[780,380],[740,365],[710,330],[710,295]], color: '#2d5a1a' },
      // Greenland
      { path: [[300,40],[340,35],[370,50],[365,80],[330,90],[300,80],[285,60]], color: '#4a7a3a' },
    ];

    for (const cont of continents) {
      ctx.beginPath();
      ctx.moveTo(cont.path[0][0], cont.path[0][1]);
      for (let i = 1; i < cont.path.length; i++) ctx.lineTo(cont.path[i][0], cont.path[i][1]);
      ctx.closePath();
      ctx.fillStyle = cont.color;
      ctx.fill();
    }

    return new THREE.CanvasTexture(c);
  }

  _makeCloudTexture() {
    const c = document.createElement('canvas');
    c.width = 512; c.height = 256;
    const ctx = c.getContext('2d');
    ctx.fillStyle = 'rgba(0,0,0,0)';
    ctx.fillRect(0, 0, 512, 256);

    const clouds = [
      [100, 60, 80, 20], [250, 40, 120, 18], [380, 80, 90, 22],
      [60,  130, 70, 16], [200, 150, 100, 20], [340, 120, 85, 18],
      [440, 160, 60, 14], [130, 200, 90, 16], [290, 210, 110, 18],
    ];
    for (const [x, y, w, h] of clouds) {
      const g = ctx.createRadialGradient(x, y, 0, x, y, w / 2);
      g.addColorStop(0, 'rgba(255,255,255,0.5)');
      g.addColorStop(1, 'rgba(255,255,255,0)');
      ctx.beginPath();
      ctx.ellipse(x, y, w / 2, h / 2, 0, 0, Math.PI * 2);
      ctx.fillStyle = g;
      ctx.fill();
    }
    return new THREE.CanvasTexture(c);
  }

  // ── Region markers ─────────────────────────────────────────────────────────
  _buildMarkers() {
    this.markers = [];
    for (const region of REGIONS) {
      const pos = latLngToXYZ(region.lat, region.lng, 1.04);

      // Pulsing ring
      const ringGeo = new THREE.RingGeometry(0.025, 0.04, 32);
      const color   = region.unlocked ? region.color : 0x64748b;
      const ringMat = new THREE.MeshBasicMaterial({
        color,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.9,
      });
      const ring = new THREE.Mesh(ringGeo, ringMat);
      ring.position.copy(pos);
      ring.lookAt(pos.clone().multiplyScalar(2));
      this.globe.add(ring);

      // Dot (visible)
      const dotGeo = new THREE.CircleGeometry(0.018, 16);
      const dotMat = new THREE.MeshBasicMaterial({ color, side: THREE.DoubleSide });
      const dot    = new THREE.Mesh(dotGeo, dotMat);
      dot.position.copy(pos);
      dot.lookAt(pos.clone().multiplyScalar(2));
      this.globe.add(dot);

      // Invisible hit area — much larger, catches raycaster clicks
      const hitGeo = new THREE.CircleGeometry(0.09, 16);
      const hitMat = new THREE.MeshBasicMaterial({ visible: false, side: THREE.DoubleSide });
      const hit    = new THREE.Mesh(hitGeo, hitMat);
      hit.position.copy(pos);
      hit.lookAt(pos.clone().multiplyScalar(2));
      hit.userData.region = region;
      this.globe.add(hit);

      // Home indicator
      if (region.isHome) {
        const homeGeo = new THREE.CircleGeometry(0.055, 32);
        const homeMat = new THREE.MeshBasicMaterial({
          color: 0x00d4ff,
          side: THREE.DoubleSide,
          transparent: true,
          opacity: 0.25,
        });
        const home = new THREE.Mesh(homeGeo, homeMat);
        home.position.copy(pos);
        home.lookAt(pos.clone().multiplyScalar(2));
        this.globe.add(home);
      }

      this.markers.push({ ring, dot, hit, region, pos, phase: Math.random() * Math.PI * 2 });
    }
  }

  // ── Events ─────────────────────────────────────────────────────────────────
  _bindEvents() {
    const canvas = this.renderer.domElement;

    // Drag to rotate
    canvas.addEventListener('mousedown', e => {
      this._isDragging   = true;
      this._dragMoved    = false;
      this._mouseDownPos = { x: e.clientX, y: e.clientY };
      this._lastMouse    = { x: e.clientX, y: e.clientY };
      this._rotVel       = { x: 0, y: 0 };
      canvas.style.cursor = 'grabbing';
    });
    window.addEventListener('mousemove', e => {
      if (!this._isDragging) return;
      const dx = e.clientX - this._lastMouse.x;
      const dy = e.clientY - this._lastMouse.y;
      const totalDx = e.clientX - this._mouseDownPos.x;
      const totalDy = e.clientY - this._mouseDownPos.y;
      if (Math.abs(totalDx) > 4 || Math.abs(totalDy) > 4) this._dragMoved = true;
      this._rotVel.x = dy * 0.005;
      this._rotVel.y = dx * 0.005;
      this._rotTarget.x += dy * 0.005;
      this._rotTarget.y += dx * 0.005;
      this._rotTarget.x = Math.max(-1.4, Math.min(1.4, this._rotTarget.x));
      this._lastMouse = { x: e.clientX, y: e.clientY };
    });
    window.addEventListener('mouseup', () => {
      this._isDragging = false;
      canvas.style.cursor = 'grab';
    });

    // Scroll to zoom
    canvas.addEventListener('wheel', e => {
      e.preventDefault();
      this._zoom = Math.max(1.4, Math.min(5, this._zoom + e.deltaY * 0.003));
    }, { passive: false });

    // Click to select region
    canvas.addEventListener('click', e => this._onCanvasClick(e));

    // Close on Escape / key 7
    document.addEventListener('keydown', this._onKey = (e) => {
      if (e.code === 'Escape' || e.code === 'Digit7') { e.preventDefault(); this.close(); }
    });

    canvas.style.cursor = 'grab';
  }

  _onCanvasClick(e) {
    // Ignore if the mouse moved (was a drag, not a click)
    if (this._dragMoved) return;

    const canvas = this.renderer.domElement;
    const rect   = canvas.getBoundingClientRect();
    const mouse  = new THREE.Vector2(
      ((e.clientX - rect.left) / rect.width)  * 2 - 1,
      -((e.clientY - rect.top) / rect.height) * 2 + 1,
    );
    const raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(mouse, this.camera);
    // Use invisible hit areas (larger) for detection
    const hitMeshes = this.markers.map(m => m.hit);
    const hits = raycaster.intersectObjects(hitMeshes);
    if (hits.length) {
      this._showRegionInfo(hits[0].object.userData.region);
    } else {
      this._hideRegionInfo();
    }
  }

  _showRegionInfo(region) {
    this._selectedRegion = region;
    const el = document.getElementById('globe-region-info');
    const resources = region.resources.join(' · ');
    const lockBadge = region.unlocked ? '' : '<span class="region-locked">🔒 נעול</span>';
    const homeBadge = region.isHome   ? '<span class="region-home">🏠 האזור שלך</span>' : '';

    el.innerHTML = `
      <div class="region-header">
        <div class="region-dot" style="background:${`#${region.color.toString(16).padStart(6,'0')}`}"></div>
        <h3 class="region-name">${region.name} ${homeBadge}${lockBadge}</h3>
      </div>
      <div class="region-stats">
        <div class="region-stat"><span class="stat-icon">👥</span><span>${region.players} שחקנים פעילים</span></div>
        <div class="region-stat"><span class="stat-icon">📦</span><span>${resources}</span></div>
        <div class="region-stat"><span class="stat-icon">📈</span><span>כלכלה ${region.economy}</span></div>
      </div>
      <div class="region-actions">
        ${region.unlocked
          ? `<button class="region-enter-btn" id="region-enter">
               ${region.isHome ? '🏠 כניסה לאזור הבית' : '🚀 כנס לאזור'}
             </button>`
          : `<div class="region-unlock-hint">פתח אזור זה לאחר הגעה לרמה 5</div>`
        }
        <button class="region-zoomout-btn" id="region-zoomout">← חזרה לתצוגת העולם</button>
      </div>
    `;
    el.classList.remove('hidden');

    document.getElementById('region-enter')?.addEventListener('click', () => {
      this.hud?.notify(`🌍 נכנס ל${region.name}...`, 'success');
      this.close();
    });

    document.getElementById('region-zoomout')?.addEventListener('click', () => {
      this._zoom = 2.8;
      this._hideRegionInfo();
    });

    // Smooth rotate + zoom into region
    const lonNorm = ((region.lng + 180) / 360) * Math.PI * 2;
    this._rotTarget.y = -lonNorm + Math.PI;
    this._rotTarget.x = -region.lat * (Math.PI / 180) * 0.7;
    this._zoom = 1.65;
  }

  _hideRegionInfo() {
    this._selectedRegion = null;
    document.getElementById('globe-region-info')?.classList.add('hidden');
  }

  // ── Animation loop ─────────────────────────────────────────────────────────
  _animate() {
    this._raf = requestAnimationFrame(() => this._animate());

    const t = performance.now() * 0.001;

    // Inertia / smoothing
    if (!this._isDragging) {
      this._rotVel.x *= 0.92;
      this._rotVel.y *= 0.92;
      if (Math.abs(this._rotVel.y) < 0.0001) this._rotVel.y = 0;
      // Auto-rotate when idle
      if (Math.abs(this._rotVel.y) < 0.001 && !this._selectedRegion) {
        this._rotTarget.y += 0.002;
      }
    }

    this._rotCurrent.x += (this._rotTarget.x - this._rotCurrent.x) * 0.08;
    this._rotCurrent.y += (this._rotTarget.y - this._rotCurrent.y) * 0.08;

    this.globe.rotation.x = this._rotCurrent.x;
    this.globe.rotation.y = this._rotCurrent.y;

    // Clouds drift
    if (this._clouds) this._clouds.rotation.y += 0.0003;

    // Camera zoom
    this.camera.position.z += (this._zoom - this.camera.position.z) * 0.08;

    // Pulse markers
    for (const m of this.markers) {
      const pulse = 0.8 + 0.2 * Math.sin(t * 2.5 + m.phase);
      m.ring.material.opacity = pulse * (m.region.unlocked ? 0.9 : 0.4);
      m.ring.scale.setScalar(0.85 + 0.15 * Math.sin(t * 2 + m.phase));
    }

    this.renderer.render(this.scene, this.camera);
  }

  destroy() {
    this.close();
    document.removeEventListener('keydown', this._onKey);
  }
}
