import * as THREE from 'three';

function add(g, geo, mat, x = 0, y = 0, z = 0, rx = 0, ry = 0, rz = 0) {
  const m = new THREE.Mesh(geo, mat);
  m.position.set(x, y, z);
  m.rotation.set(rx, ry, rz);
  g.add(m);
  return m;
}

// ── Farm Robot ───────────────────────────────────────────────────────────────
function makeFarmRobot() {
  const g = new THREE.Group();

  const body  = new THREE.MeshStandardMaterial({ color: 0x22aa55, roughness: 0.5, metalness: 0.4 });
  const dark  = new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.8 });
  const light = new THREE.MeshStandardMaterial({ color: 0xaaffaa, emissive: 0x00aa33, emissiveIntensity: 0.6 });
  const wheel = new THREE.MeshStandardMaterial({ color: 0x2a2a2a, roughness: 0.95 });

  // Body
  add(g, new THREE.BoxGeometry(0.72, 0.55, 0.92), body, 0, 0.65, 0);
  // Head
  add(g, new THREE.BoxGeometry(0.44, 0.38, 0.44), body, 0, 1.08, 0);
  // Eyes
  add(g, new THREE.SphereGeometry(0.07, 8, 8), light, -0.11, 1.12, 0.23);
  add(g, new THREE.SphereGeometry(0.07, 8, 8), light,  0.11, 1.12, 0.23);
  // Antenna
  add(g, new THREE.CylinderGeometry(0.02, 0.02, 0.44, 6), dark, 0, 1.49, 0);
  add(g, new THREE.SphereGeometry(0.055, 8, 8), light, 0, 1.73, 0);

  // Arm (animated)
  const arm = new THREE.Group();
  arm.position.set(0.42, 0.65, 0.08);
  add(arm, new THREE.BoxGeometry(0.08, 0.48, 0.08), body, 0, 0, 0);
  add(arm, new THREE.CylinderGeometry(0.07, 0.1, 0.18, 8), dark, 0, -0.32, 0);
  g.userData.arm = arm;
  g.add(arm);

  // Wheels (4)
  const wheelGeo = new THREE.CylinderGeometry(0.19, 0.19, 0.11, 12);
  const wPos = [[-0.44, 0.19, 0.35], [0.44, 0.19, 0.35], [-0.44, 0.19, -0.35], [0.44, 0.19, -0.35]];
  g.userData.wheels = wPos.map(([x, y, z]) => {
    const w = new THREE.Mesh(wheelGeo, wheel);
    w.rotation.z = Math.PI / 2;
    w.position.set(x, y, z);
    w.castShadow = true;
    g.add(w);
    return w;
  });

  // Hub caps
  wPos.forEach(([x, y, z]) => {
    add(g, new THREE.CylinderGeometry(0.07, 0.07, 0.06, 8), dark, x, y, z, 0, 0, Math.PI / 2);
  });

  // Solar panel on top
  add(g, new THREE.BoxGeometry(0.62, 0.04, 0.42), new THREE.MeshStandardMaterial({ color: 0x002244, metalness: 0.8, roughness: 0.2 }), 0, 0.97, -0.1, -0.18, 0, 0);

  g.traverse(c => { if (c.isMesh) { c.castShadow = true; } });
  g.userData.robotType = 'farm';
  return g;
}

// ── Mining Robot ─────────────────────────────────────────────────────────────
function makeMiningRobot() {
  const g = new THREE.Group();

  const body   = new THREE.MeshStandardMaterial({ color: 0xcc6200, roughness: 0.5, metalness: 0.5 });
  const dark   = new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.8 });
  const light  = new THREE.MeshStandardMaterial({ color: 0xff9900, emissive: 0xcc4400, emissiveIntensity: 0.6 });
  const track  = new THREE.MeshStandardMaterial({ color: 0x1a1a1a, roughness: 0.95 });
  const yellow = new THREE.MeshStandardMaterial({ color: 0xffcc00, roughness: 0.6, metalness: 0.3 });

  // Tracks
  [-0.62, 0.62].forEach(x => {
    add(g, new THREE.BoxGeometry(0.28, 0.32, 1.55), track, x, 0.34, 0);
    // Track detail
    for (let i = -3; i <= 3; i++) {
      add(g, new THREE.BoxGeometry(0.30, 0.04, 0.1), dark, x, 0.49, i * 0.22);
    }
  });

  // Heavy body
  add(g, new THREE.BoxGeometry(1.08, 0.75, 1.42), body, 0, 0.92, 0);
  // Cab
  add(g, new THREE.BoxGeometry(0.65, 0.5, 0.65), body, 0, 1.48, -0.15);
  // Windshield
  add(g, new THREE.BoxGeometry(0.58, 0.36, 0.06), new THREE.MeshStandardMaterial({ color: 0x88bbff, transparent: true, opacity: 0.6 }), 0, 1.52, -0.49);
  // Eyes
  add(g, new THREE.SphereGeometry(0.085, 8, 8), light, -0.14, 1.52, -0.42);
  add(g, new THREE.SphereGeometry(0.085, 8, 8), light,  0.14, 1.52, -0.42);

  // Warning stripes
  add(g, new THREE.BoxGeometry(1.1, 0.12, 0.06), yellow, 0, 0.56, -0.72);

  // Drill arm (animated)
  const drillArm = new THREE.Group();
  drillArm.position.set(0, 0.9, 0.65);
  const armMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 1.1, 7), body);
  armMesh.rotation.x = -Math.PI * 0.18;
  drillArm.add(armMesh);
  // Drill bit
  const bit = new THREE.Mesh(new THREE.ConeGeometry(0.14, 0.55, 8), dark);
  bit.position.set(0, -0.78, 0.24);
  bit.rotation.x = Math.PI * 0.18;
  drillArm.add(bit);
  g.userData.drillArm = drillArm;
  g.add(drillArm);

  // Exhaust stack
  add(g, new THREE.CylinderGeometry(0.08, 0.08, 0.7, 8), dark, 0.4, 1.7, -0.35);
  add(g, new THREE.CylinderGeometry(0.1, 0.08, 0.12, 8), dark, 0.4, 2.07, -0.35);

  g.traverse(c => { if (c.isMesh) { c.castShadow = true; } });
  g.userData.robotType = 'mining';
  return g;
}

// ── Robot System ─────────────────────────────────────────────────────────────
export class RobotSystem {
  constructor(scene, terrainHeightFn) {
    this.scene         = scene;
    this.terrainHeight = terrainHeightFn;
    this.robots        = [];
  }

  addFarmRobot(x, z) {
    const r = makeFarmRobot();
    this._initRobot(r, x, z, 8, 1.6);
    return r;
  }

  addMiningRobot(x, z) {
    const r = makeMiningRobot();
    this._initRobot(r, x, z, 14, 1.0);
    return r;
  }

  _initRobot(r, x, z, patrolRadius, speed) {
    const y = this.terrainHeight(x, z);
    r.position.set(x, y, z);
    r.userData.patrolCenter = new THREE.Vector3(x, y, z);
    r.userData.patrolRadius = patrolRadius + Math.random() * 6;
    r.userData.angle        = Math.random() * Math.PI * 2;
    r.userData.speed        = speed + Math.random() * 0.5;
    this.scene.add(r);
    this.robots.push(r);
    return r;
  }

  update(dt, elapsed) {
    for (const r of this.robots) {
      const { patrolCenter, patrolRadius, speed } = r.userData;

      // Circular patrol orbit
      r.userData.angle += speed * dt * 0.25;
      const tx = patrolCenter.x + Math.cos(r.userData.angle) * patrolRadius;
      const tz = patrolCenter.z + Math.sin(r.userData.angle) * patrolRadius;
      const ty = this.terrainHeight(tx, tz);

      const dx = tx - r.position.x;
      const dz = tz - r.position.z;
      r.position.x += dx * dt * 1.4;
      r.position.z += dz * dt * 1.4;
      r.position.y += (ty - r.position.y) * 0.14;

      // Smooth turn
      if (Math.abs(dx) > 0.01 || Math.abs(dz) > 0.01) {
        const want = Math.atan2(dx, dz);
        const diff = ((want - r.rotation.y + Math.PI * 3) % (Math.PI * 2)) - Math.PI;
        r.rotation.y += diff * 0.1;
      }

      // Terrain tilt
      r.rotation.x *= 0.9; // settle
      r.rotation.z *= 0.9;

      // Animate wheels (farm)
      r.userData.wheels?.forEach(w => { w.rotation.x += speed * dt * 2.5; });

      // Animate arm (farm)
      if (r.userData.arm) {
        r.userData.arm.rotation.x = Math.sin(elapsed * 2.2) * 0.45;
      }

      // Animate drill (mining)
      if (r.userData.drillArm) {
        r.userData.drillArm.rotation.y = elapsed * 5;
        r.userData.drillArm.position.z = 0.65 + Math.abs(Math.sin(elapsed * 1.5)) * 0.2;
      }
    }
  }
}
