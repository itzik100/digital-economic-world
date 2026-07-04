import * as THREE from 'three';

export const BUILDING_DEFS = {
  house: {
    name: 'בית',
    icon: '🏠',
    cost: { wood: 10, stone: 5 },
    description: 'מקום מגורים — מגן ומרחיב שטח',
  },
  farm: {
    name: 'חלקת חקלאות',
    icon: '🌾',
    cost: { wood: 8 },
    description: 'לגידול יבולים ומזון',
  },
  printer: {
    name: 'מדפסת בטון',
    icon: '🏭',
    cost: { stone: 5, iron: 3 },
    description: 'מייצרת בלוקי בטון אוטומטית',
  },
};

// ── Helpers ──────────────────────────────────────────────────────────────────
function mesh(geo, mat, x = 0, y = 0, z = 0, rx = 0, ry = 0, rz = 0) {
  const m = new THREE.Mesh(geo, mat);
  m.position.set(x, y, z);
  m.rotation.set(rx, ry, rz);
  return m;
}

function add(group, geo, mat, x, y, z, rx = 0, ry = 0, rz = 0) {
  const m = mesh(geo, mat, x, y, z, rx, ry, rz);
  group.add(m);
  return m;
}

// ── House ────────────────────────────────────────────────────────────────────
function makeHouse() {
  const g = new THREE.Group();
  const wall   = new THREE.MeshStandardMaterial({ color: 0xd9c08a, roughness: 0.82 });
  const roof   = new THREE.MeshStandardMaterial({ color: 0x7a2820, roughness: 0.85 });
  const stone  = new THREE.MeshStandardMaterial({ color: 0x898992, roughness: 0.92 });
  const dark   = new THREE.MeshStandardMaterial({ color: 0x3a1800, roughness: 0.9 });
  const frame  = new THREE.MeshStandardMaterial({ color: 0x5a3010, roughness: 0.88 });
  const win    = new THREE.MeshStandardMaterial({ color: 0x88ccff, transparent: true, opacity: 0.72, metalness: 0.3 });
  const chimney = new THREE.MeshStandardMaterial({ color: 0x5e5858, roughness: 0.92 });

  // Foundation
  add(g, new THREE.BoxGeometry(6.2, 0.28, 5.2), stone, 0, 0.14, 0);

  // Walls
  add(g, new THREE.BoxGeometry(6.2, 3.2, 0.2), wall,  0,  1.88, -2.5);  // front
  add(g, new THREE.BoxGeometry(6.2, 3.2, 0.2), wall,  0,  1.88,  2.5);  // back
  add(g, new THREE.BoxGeometry(0.2, 3.2, 5.2), wall, -3,  1.88,  0);    // left
  add(g, new THREE.BoxGeometry(0.2, 3.2, 5.2), wall,  3,  1.88,  0);    // right

  // Roof (pyramid)
  add(g, new THREE.ConeGeometry(4.6, 2.2, 4), roof, 0, 4.6, 0, 0, Math.PI / 4, 0);

  // Door
  add(g, new THREE.BoxGeometry(1.2, 0.1, 0.05), frame, 0, 0.3, -2.59); // step
  add(g, new THREE.BoxGeometry(1.4, 2.3, 0.08), frame, 0, 1.43, -2.56); // door frame
  add(g, new THREE.BoxGeometry(1.0, 2.1, 0.05), dark,  0, 1.33, -2.59); // door

  // Windows (front)
  [-1.9, 1.9].forEach(x => {
    add(g, new THREE.BoxGeometry(1.05, 0.95, 0.08), frame, x, 2.0, -2.56);
    add(g, new THREE.BoxGeometry(0.82, 0.72, 0.05), win,   x, 2.0, -2.59);
  });
  // Windows (sides)
  [-1.0, 1.0].forEach(z => {
    add(g, new THREE.BoxGeometry(0.08, 0.9, 1.0), frame,  3.04, 2.0, z);
    add(g, new THREE.BoxGeometry(0.05, 0.7, 0.78), win,   3.06, 2.0, z);
    add(g, new THREE.BoxGeometry(0.08, 0.9, 1.0), frame, -3.04, 2.0, z);
    add(g, new THREE.BoxGeometry(0.05, 0.7, 0.78), win,  -3.06, 2.0, z);
  });

  // Chimney
  add(g, new THREE.BoxGeometry(0.65, 2.0, 0.65), chimney, 1.6, 4.8, 0.8);
  add(g, new THREE.BoxGeometry(0.82, 0.15, 0.82), chimney, 1.6, 5.87, 0.8);

  g.traverse(c => { if (c.isMesh) { c.castShadow = true; c.receiveShadow = true; } });
  g.userData.buildingType = 'house';
  return g;
}

// ── Farm Plot ────────────────────────────────────────────────────────────────
function makeFarm() {
  const g = new THREE.Group();
  const soil1  = new THREE.MeshStandardMaterial({ color: 0x3c200a, roughness: 1.0 });
  const soil2  = new THREE.MeshStandardMaterial({ color: 0x4f2c0f, roughness: 1.0 });
  const fenceM = new THREE.MeshStandardMaterial({ color: 0x6b4226, roughness: 0.9 });

  const ROWS = 4, COLS = 4, GAP = 1.7;
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      add(g, new THREE.BoxGeometry(1.48, 0.12, 1.48),
        (r + c) % 2 === 0 ? soil1 : soil2,
        (c - (COLS - 1) / 2) * GAP, 0.06, (r - (ROWS - 1) / 2) * GAP);
    }
  }

  const W = (COLS * GAP) / 2 + 0.5;
  const D = (ROWS * GAP) / 2 + 0.5;

  // Corner + mid posts
  const postXs = [-W, -W / 2, 0, W / 2, W];
  const postZs = [-D, D];
  postXs.forEach(x => postZs.forEach(z =>
    add(g, new THREE.CylinderGeometry(0.07, 0.07, 1.1, 7), fenceM, x, 0.55, z)
  ));
  [-W, W].forEach(x => [-D / 2, D / 2].forEach(z =>
    add(g, new THREE.CylinderGeometry(0.07, 0.07, 1.1, 7), fenceM, x, 0.55, z)
  ));

  // Rails
  [-D, D].forEach(z => {
    add(g, new THREE.BoxGeometry(W * 2, 0.07, 0.07), fenceM, 0, 0.65, z);
    add(g, new THREE.BoxGeometry(W * 2, 0.07, 0.07), fenceM, 0, 0.92, z);
  });
  [-W, W].forEach(x => {
    add(g, new THREE.BoxGeometry(0.07, 0.07, D * 2), fenceM, x, 0.65, 0);
    add(g, new THREE.BoxGeometry(0.07, 0.07, D * 2), fenceM, x, 0.92, 0);
  });

  // Scarecrow
  const hatM = new THREE.MeshStandardMaterial({ color: 0x8b3a10 });
  const bodyM = new THREE.MeshStandardMaterial({ color: 0xd4a04a, roughness: 0.9 });
  add(g, new THREE.CylinderGeometry(0.06, 0.06, 1.6, 6), bodyM, W - 0.4, 0.8, -D + 0.4);
  add(g, new THREE.CylinderGeometry(0.04, 0.04, 1.4, 6), bodyM, W - 0.4, 1.2, -D + 0.4, 0, 0, Math.PI / 2);
  add(g, new THREE.SphereGeometry(0.19, 8, 8), bodyM, W - 0.4, 1.75, -D + 0.4);
  add(g, new THREE.CylinderGeometry(0.22, 0.18, 0.12, 10), hatM, W - 0.4, 1.94, -D + 0.4);
  add(g, new THREE.CylinderGeometry(0.06, 0.22, 0.28, 10), hatM, W - 0.4, 2.08, -D + 0.4);

  // Watering can near entrance
  const tinM = new THREE.MeshStandardMaterial({ color: 0x558866, metalness: 0.4, roughness: 0.6 });
  add(g, new THREE.CylinderGeometry(0.18, 0.22, 0.4, 10), tinM, -W + 0.5, 0.2, -D + 0.5);
  add(g, new THREE.CylinderGeometry(0.03, 0.03, 0.5, 6), tinM, -W + 0.35, 0.38, -D + 0.5, 0, 0, -Math.PI * 0.3);

  g.traverse(c => { if (c.isMesh) { c.castShadow = true; c.receiveShadow = true; } });
  g.userData.buildingType = 'farm';
  return g;
}

// ── Concrete Printer ─────────────────────────────────────────────────────────
function makePrinter() {
  const g = new THREE.Group();
  const base   = new THREE.MeshStandardMaterial({ color: 0x505565, roughness: 0.65, metalness: 0.45 });
  const arm    = new THREE.MeshStandardMaterial({ color: 0x38404e, roughness: 0.55, metalness: 0.55 });
  const glow   = new THREE.MeshStandardMaterial({ color: 0x00aaff, emissive: 0x0066cc, emissiveIntensity: 0.5, roughness: 0.2, metalness: 0.8 });
  const panel  = new THREE.MeshStandardMaterial({ color: 0x1a2233, roughness: 0.4 });

  // Base platform
  add(g, new THREE.BoxGeometry(4.5, 0.55, 3.5), base, 0, 0.275, 0);

  // Main body
  add(g, new THREE.BoxGeometry(3.2, 2.2, 2.2), base, 0, 1.65, -0.3);

  // Control panel face
  add(g, new THREE.BoxGeometry(2.8, 1.5, 0.08), panel, 0, 1.65, -1.46);
  add(g, new THREE.BoxGeometry(2.4, 1.0, 0.06), glow,  0, 1.75, -1.48);

  // Status lights
  [[-0.9, 0.95], [0, 0.95], [0.9, 0.95]].forEach(([x, y]) =>
    add(g, new THREE.SphereGeometry(0.09, 8, 8), glow, x, y, -1.5)
  );

  // Vertical column
  add(g, new THREE.BoxGeometry(0.35, 4.2, 0.35), arm, 1.8, 2.6, 0);

  // Horizontal arm (animated)
  const hArm = add(g, new THREE.BoxGeometry(3.0, 0.28, 0.28), arm, 0.3, 4.6, 0);
  g.userData.hArm = hArm;

  // Carriage on arm
  const carriage = add(g, new THREE.BoxGeometry(0.5, 0.4, 0.5), base, -1.2, 4.6, 0);
  g.userData.carriage = carriage;

  // Extruder nozzle (child of carriage moves with it)
  const nozzle = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.22, 0.55, 10), glow);
  nozzle.position.set(0, -0.45, 0);
  carriage.add(nozzle);

  // Output tray
  add(g, new THREE.BoxGeometry(2.2, 0.1, 1.8), new THREE.MeshStandardMaterial({ color: 0x778088, roughness: 0.8 }), -1.5, 0.6, 0.5);

  // Exhaust pipes
  [-0.5, 0.5].forEach(z =>
    add(g, new THREE.CylinderGeometry(0.1, 0.1, 1.2, 8), arm, 1.4, 3.1, z)
  );

  g.traverse(c => { if (c.isMesh) { c.castShadow = true; c.receiveShadow = true; } });
  g.userData.buildingType = 'printer';
  return g;
}

// ── Factory ──────────────────────────────────────────────────────────────────
export function createBuilding(type) {
  switch (type) {
    case 'house':   return makeHouse();
    case 'farm':    return makeFarm();
    case 'printer': return makePrinter();
    default:        return new THREE.Group();
  }
}

// ── Placement System ─────────────────────────────────────────────────────────
export class BuildingSystem {
  constructor(scene, camera, terrain, terrainHeightFn) {
    this.scene         = scene;
    this.camera        = camera;
    this.terrain       = terrain;
    this.terrainHeight = terrainHeightFn;

    this.isActive      = false;
    this.selectedType  = 'house';
    this.ghost         = null;
    this.raycaster     = new THREE.Raycaster();
    this.mouse         = new THREE.Vector2(0, 0);
    this.buildings     = [];
    this.onPlace       = null; // (type, cost) => void

    this._buildGhost();
    document.addEventListener('mousemove', e => {
      this.mouse.set(
        (e.clientX / window.innerWidth) * 2 - 1,
        -(e.clientY / window.innerHeight) * 2 + 1
      );
    });
  }

  _buildGhost() {
    if (this.ghost) this.scene.remove(this.ghost);
    this.ghost = createBuilding(this.selectedType);
    this.ghost.visible = false;
    this.ghost.traverse(c => {
      if (c.isMesh) {
        c.material = c.material.clone();
        c.material.transparent = true;
        c.material.opacity = 0.45;
        c.material.depthWrite = false;
      }
    });
    this.scene.add(this.ghost);
  }

  setType(type) {
    this.selectedType = type;
    this._buildGhost();
    if (this.isActive) this.ghost.visible = true;
  }

  activate()   { this.isActive = true;  this.ghost.visible = true; }
  deactivate() { this.isActive = false; if (this.ghost) this.ghost.visible = false; }

  place() {
    if (!this.isActive || !this.ghost?.visible) return false;
    const building = createBuilding(this.selectedType);
    building.position.copy(this.ghost.position);
    this.scene.add(building);
    this.buildings.push(building);
    this.onPlace?.(this.selectedType, BUILDING_DEFS[this.selectedType]?.cost ?? {});
    return true;
  }

  update() {
    if (!this.isActive) return;
    this.raycaster.setFromCamera(this.mouse, this.camera);
    const hits = this.raycaster.intersectObject(this.terrain, false);
    if (hits.length) {
      const p = hits[0].point;
      this.ghost.position.set(p.x, this.terrainHeight(p.x, p.z), p.z);
      this.ghost.visible = true;
    }
  }

  animate(elapsed) {
    const anim = b => {
      if (b.userData.hArm)     b.userData.hArm.position.x     = 0.3 + Math.sin(elapsed * 1.1) * 1.0;
      if (b.userData.carriage) b.userData.carriage.position.x  = 0.3 + Math.sin(elapsed * 1.1) * 1.0;
    };
    this.buildings.filter(b => b.userData.buildingType === 'printer').forEach(anim);
    if (this.ghost?.userData.buildingType === 'printer') anim(this.ghost);
  }
}
