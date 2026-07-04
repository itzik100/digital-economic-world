import * as THREE from 'three';
import { AvatarController, openAvatarCreator } from './avatar.js';
import { buildSatelliteTexture, applySatelliteToTerrain } from './terrain-satellite.js';
import { BuildingSystem, BUILDING_DEFS } from './building.js';
import { RobotSystem } from './robot.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass }     from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { ShaderPass }     from 'three/addons/postprocessing/ShaderPass.js';
import { OutputPass }     from 'three/addons/postprocessing/OutputPass.js';

export class GameWorld {
  constructor(container) {
    this.container   = container;
    this.clock       = new THREE.Clock();
    this.keys        = {};
    this.resources   = [];
    this.onCollect   = null;
    this.onBuild     = null; // (type, cost) => void
    this.onSwimChange = null;
    this.playerSpeed = 8;
    this.isRunning   = false;
    this.inventory   = { wood: 0, stone: 0, iron: 0 };
    this.buildOptionIndex = 0;
    this.waterLevel = -1.5;
    this.isSwimming = false;
  }

  init() {
    this._setupRenderer();
    this._setupScene();
    this._setupCamera();
    this._setupLights();
    this._buildTerrain();
    this._buildWater();
    this._buildSky();
    this._buildTrees(120);
    this._buildRocks(60);
    this._buildPlayer();
    this._setupAvatar();
    this._setupInput();
    this._buildFog();
    this._setupPostProcessing();
    this._loadSatellite();
    this._setupBuildings();
    this._setupRobots();
    this.isRunning = true;
    this._animate();
  }

  _setupRenderer() {
    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.2;
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.container.appendChild(this.renderer.domElement);

    window.addEventListener('resize', () => {
      this.camera.aspect = window.innerWidth / window.innerHeight;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(window.innerWidth, window.innerHeight);
    });
  }

  _setupScene() {
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x0a1628);
  }

  _setupCamera() {
    this.camera = new THREE.PerspectiveCamera(65, window.innerWidth / window.innerHeight, 0.1, 2000);
    this.camera.position.set(0, 4, 10);
  }

  _setupLights() {
    // Sun
    this.sun = new THREE.DirectionalLight(0xfff4d6, 2.5);
    this.sun.position.set(80, 120, 60);
    this.sun.castShadow = true;
    this.sun.shadow.mapSize.set(2048, 2048);
    this.sun.shadow.camera.near = 1;
    this.sun.shadow.camera.far = 400;
    this.sun.shadow.camera.left = -100;
    this.sun.shadow.camera.right = 100;
    this.sun.shadow.camera.top = 100;
    this.sun.shadow.camera.bottom = -100;
    this.sun.shadow.bias = -0.0005;
    this.scene.add(this.sun);

    // Sky ambient
    const sky = new THREE.HemisphereLight(0x87ceeb, 0x2d5a1b, 0.8);
    this.scene.add(sky);

    // Fill light
    const fill = new THREE.DirectionalLight(0x4488ff, 0.3);
    fill.position.set(-50, 30, -50);
    this.scene.add(fill);
  }

  _buildTerrain() {
    const size = 400;
    const segs = 120;
    const geo = new THREE.PlaneGeometry(size, size, segs, segs);
    geo.rotateX(-Math.PI / 2);

    const pos = geo.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i);
      const z = pos.getZ(i);
      const y = this._terrainHeight(x, z);
      pos.setY(i, y);
    }
    pos.needsUpdate = true;
    geo.computeVertexNormals();

    const mat = this._buildTerrainMaterial();

    const terrain = new THREE.Mesh(geo, mat);
    terrain.receiveShadow = true;
    this.scene.add(terrain);
    this.terrain = terrain;
  }

  _terrainHeight(x, z) {
    return (
      Math.sin(x * 0.04) * Math.cos(z * 0.04) * 4 +
      Math.sin(x * 0.09 + 1.2) * Math.sin(z * 0.07) * 2.5 +
      Math.cos(x * 0.02 + z * 0.015) * 6 +
      Math.sin(x * 0.18) * Math.cos(z * 0.22) * 0.8
    );
  }

  // ── שלב 2: Terrain Shader ────────────────────────────────────────────────
  _buildTerrainMaterial() {
    return new THREE.ShaderMaterial({
      uniforms: {
        uFogColor:  { value: new THREE.Color(0x0a1628) },
        uFogNear:   { value: 80.0 },
        uFogFar:    { value: 300.0 },
      },
      vertexShader: `
        varying vec3 vWorldPos;
        varying vec3 vNormal;
        varying float vFogDepth;

        void main() {
          vec4 worldPos = modelMatrix * vec4(position, 1.0);
          vWorldPos = worldPos.xyz;
          vNormal   = normalize(normalMatrix * normal);
          vec4 mvPos = modelViewMatrix * vec4(position, 1.0);
          vFogDepth = -mvPos.z;
          gl_Position = projectionMatrix * mvPos;
        }
      `,
      fragmentShader: `
        uniform vec3  uFogColor;
        uniform float uFogNear;
        uniform float uFogFar;

        varying vec3  vWorldPos;
        varying vec3  vNormal;
        varying float vFogDepth;

        /* ── Noise helpers ── */
        float hash(vec2 p) {
          return fract(sin(dot(p, vec2(127.1,311.7))) * 43758.5453);
        }
        float vnoise(vec2 p) {
          vec2 i = floor(p), f = fract(p);
          f = f*f*(3.0-2.0*f);
          return mix(
            mix(hash(i), hash(i+vec2(1,0)), f.x),
            mix(hash(i+vec2(0,1)), hash(i+vec2(1,1)), f.x), f.y);
        }
        float fbm(vec2 p) {
          return vnoise(p)*.50 + vnoise(p*2.1)*.25 + vnoise(p*4.5)*.15 + vnoise(p*9.0)*.10;
        }

        void main() {
          float h  = vWorldPos.y;
          vec2  xz = vWorldPos.xz;
          vec3  N  = normalize(vNormal);
          float slope = 1.0 - clamp(dot(N, vec3(0,1,0)), 0.0, 1.0);

          /* noise layers */
          float n1 = fbm(xz * 0.06);
          float n2 = fbm(xz * 0.28 + vec2(17.3, 5.1));
          float n3 = fbm(xz * 1.10 + vec2(3.7, 9.2));

          /* ── colour layers by height ── */
          vec3 cSand  = vec3(0.76, 0.66, 0.42);
          vec3 cGrass = mix(vec3(0.23,0.48,0.15), vec3(0.18,0.38,0.11), n1);
          vec3 cDirt  = vec3(0.47,0.35,0.23);
          vec3 cRock  = mix(vec3(0.42,0.40,0.38), vec3(0.30,0.28,0.26), n3);
          vec3 cSnow  = vec3(0.93,0.95,1.00);

          vec3 col = cGrass;

          /* sand near water level */
          col = mix(col, cSand,  smoothstep(-0.8, 0.3, -(h - 0.5*(n1-.5))));

          /* dirt patches on flat ground */
          float dirt = smoothstep(0.58,0.75,n1) * (1.0-slope) * smoothstep(-1.0,2.0,h);
          col = mix(col, cDirt, dirt * 0.65);

          /* slope → rock */
          float rock = smoothstep(0.30,0.60, slope + n2*0.12);
          col = mix(col, cRock, rock);

          /* high altitude → rock then snow */
          col = mix(col, cRock, smoothstep(3.0, 5.5, h));
          float snow = smoothstep(5.2, 7.0, h + n1*0.6) * (1.0-slope*1.4);
          col = mix(col, cSnow, clamp(snow,0.0,1.0));

          /* fine surface detail */
          col += (n3-0.5)*0.06*(1.0-rock)*(1.0-snow);

          /* ── lighting (self-contained, no Three.js lights system) ── */
          vec3 sunDir   = normalize(vec3(0.55, 0.80, 0.35));
          vec3 sunColor = vec3(1.0, 0.95, 0.82);
          vec3 ambColor = vec3(0.22, 0.28, 0.40);

          float diff   = max(dot(N, sunDir), 0.0);
          float halftone = smoothstep(0.0, 0.12, diff);   /* soft shadow edge */
          float ao     = 0.80 + 0.20 * dot(N, vec3(0,1,0));

          vec3 lit = col * (ambColor + sunColor * diff * halftone) * ao;

          /* ── fog ── */
          float fogFactor = smoothstep(uFogNear, uFogFar, vFogDepth);
          lit = mix(lit, uFogColor, fogFactor);

          gl_FragColor = vec4(lit, 1.0);
        }
      `
    });
  }

  _buildWater() {
    const geo = new THREE.PlaneGeometry(500, 500);
    geo.rotateX(-Math.PI / 2);
    const mat = new THREE.MeshStandardMaterial({
      color: 0x0066aa,
      roughness: 0.05,
      metalness: 0.1,
      transparent: true,
      opacity: 0.82,
    });
    const water = new THREE.Mesh(geo, mat);
    water.position.y = this.waterLevel;
    this.scene.add(water);
    this.water = water;
  }

  _buildSky() {
    // Gradient sky dome
    const geo = new THREE.SphereGeometry(900, 32, 16);
    const mat = new THREE.ShaderMaterial({
      side: THREE.BackSide,
      uniforms: {
        topColor:    { value: new THREE.Color(0x0a1628) },
        horizonColor:{ value: new THREE.Color(0x1a3a6a) },
        bottomColor: { value: new THREE.Color(0x050e1a) },
      },
      vertexShader: `
        varying float vY;
        void main() {
          vY = normalize(position).y;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform vec3 topColor;
        uniform vec3 horizonColor;
        uniform vec3 bottomColor;
        varying float vY;
        void main() {
          vec3 col = mix(horizonColor, topColor, max(vY, 0.0));
          col = mix(bottomColor, col, step(0.0, vY));
          gl_FragColor = vec4(col, 1.0);
        }
      `
    });
    this.scene.add(new THREE.Mesh(geo, mat));

    // Stars
    const starGeo = new THREE.BufferGeometry();
    const starPos = [];
    for (let i = 0; i < 1200; i++) {
      const theta = Math.random() * Math.PI * 2;
      const phi   = Math.acos(2 * Math.random() - 1);
      const r = 850;
      starPos.push(
        r * Math.sin(phi) * Math.cos(theta),
        r * Math.cos(phi),
        r * Math.sin(phi) * Math.sin(theta)
      );
    }
    starGeo.setAttribute('position', new THREE.Float32BufferAttribute(starPos, 3));
    const starMat = new THREE.PointsMaterial({ color: 0xffffff, size: 1.5, sizeAttenuation: false });
    this.scene.add(new THREE.Points(starGeo, starMat));

    // Sun disc — bright white so bloom picks it up
    const sunGeo = new THREE.SphereGeometry(9, 16, 16);
    const sunMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
    const sunMesh = new THREE.Mesh(sunGeo, sunMat);
    sunMesh.position.set(200, 280, -300);
    this.scene.add(sunMesh);

    // Sun inner glow layers
    [28, 50, 90].forEach((r, i) => {
      const g = new THREE.Mesh(
        new THREE.SphereGeometry(r, 16, 16),
        new THREE.MeshBasicMaterial({
          color: i === 0 ? 0xfffbe0 : 0xff9900,
          transparent: true,
          opacity: [0.18, 0.07, 0.025][i]
        })
      );
      g.position.copy(sunMesh.position);
      this.scene.add(g);
    });
  }

  _buildTrees(count) {
    const rng = (a, b) => a + Math.random() * (b - a);
    const pick = arr => arr[Math.floor(Math.random() * arr.length)];

    // Shared materials
    const barkMat = new THREE.MeshStandardMaterial({ color: 0x4a2e12, roughness: 0.95 });
    const darkBark = new THREE.MeshStandardMaterial({ color: 0x2e1a08, roughness: 1.0 });

    const leafPalette = [
      new THREE.MeshStandardMaterial({ color: 0x1e5c10, roughness: 0.9 }),
      new THREE.MeshStandardMaterial({ color: 0x2a7a18, roughness: 0.85 }),
      new THREE.MeshStandardMaterial({ color: 0x164a0e, roughness: 0.95 }),
      new THREE.MeshStandardMaterial({ color: 0x3a8820, roughness: 0.88 }),
      new THREE.MeshStandardMaterial({ color: 0x225e14, roughness: 0.9 }),
    ];

    for (let i = 0; i < count; i++) {
      const x = rng(-170, 170);
      const z = rng(-170, 170);
      if (Math.abs(x) < 14 && Math.abs(z) < 14) continue;
      const y = this._terrainHeight(x, z);

      // Pick tree type
      const type = Math.random();
      const group = new THREE.Group();
      group.position.set(x, y, z);
      group.rotation.y = rng(0, Math.PI * 2);

      if (type < 0.45) {
        // ── Oak / Deciduous ──
        const h = rng(3.5, 6.5);
        const trunkR = rng(0.18, 0.32);

        // Trunk — tapered
        const trunk = new THREE.Mesh(
          new THREE.CylinderGeometry(trunkR * 0.6, trunkR, h * 0.55, 8),
          barkMat
        );
        trunk.position.y = h * 0.275;
        trunk.castShadow = true;
        group.add(trunk);

        // 2–3 branches
        const branchCount = 2 + Math.floor(Math.random() * 2);
        for (let b = 0; b < branchCount; b++) {
          const bAngle = (b / branchCount) * Math.PI * 2 + rng(0, 0.8);
          const bLen   = rng(1.2, 2.2);
          const branch = new THREE.Mesh(
            new THREE.CylinderGeometry(trunkR * 0.2, trunkR * 0.35, bLen, 6),
            darkBark
          );
          branch.position.set(
            Math.sin(bAngle) * trunkR * 0.8,
            h * 0.45 + rng(0, h * 0.1),
            Math.cos(bAngle) * trunkR * 0.8
          );
          branch.rotation.z = Math.PI * 0.3 * Math.sin(bAngle);
          branch.rotation.x = Math.PI * 0.3 * Math.cos(bAngle);
          branch.castShadow = true;
          group.add(branch);
        }

        // Canopy — multiple overlapping spheres
        const leafMat = pick(leafPalette);
        const canopyY = h * 0.72;
        const clumps  = 4 + Math.floor(Math.random() * 4);
        for (let c = 0; c < clumps; c++) {
          const cr = rng(1.0, 1.8);
          const cx = rng(-1.2, 1.2);
          const cy = rng(-0.4, 0.8);
          const cz = rng(-1.2, 1.2);
          const leaf = new THREE.Mesh(
            new THREE.SphereGeometry(cr, 8, 6),
            leafMat
          );
          leaf.position.set(cx, canopyY + cy, cz);
          leaf.scale.y = rng(0.7, 1.0);
          leaf.castShadow = true;
          group.add(leaf);
        }

      } else if (type < 0.75) {
        // ── Pine / Conifer ──
        const h = rng(5, 10);
        const trunk = new THREE.Mesh(
          new THREE.CylinderGeometry(0.12, 0.25, h * 0.5, 7),
          barkMat
        );
        trunk.position.y = h * 0.25;
        trunk.castShadow = true;
        group.add(trunk);

        // Stacked cone layers from bottom to top
        const layers = 4 + Math.floor(Math.random() * 3);
        const leafMat = pick(leafPalette);
        for (let l = 0; l < layers; l++) {
          const t   = l / (layers - 1);
          const r   = rng(1.6, 2.4) * (1 - t * 0.65);
          const ly  = h * 0.35 + t * h * 0.62;
          const lh  = rng(1.6, 2.4) * (1 - t * 0.3);
          const cone = new THREE.Mesh(
            new THREE.ConeGeometry(r, lh, 8),
            leafMat
          );
          cone.position.y = ly;
          cone.castShadow = true;
          group.add(cone);
        }

      } else {
        // ── Birch / Slim ──
        const h = rng(6, 9);
        const birchMat = new THREE.MeshStandardMaterial({ color: 0xd8cfc4, roughness: 0.8 });
        const trunk = new THREE.Mesh(
          new THREE.CylinderGeometry(0.10, 0.16, h * 0.7, 8),
          birchMat
        );
        trunk.position.y = h * 0.35;
        trunk.castShadow = true;
        group.add(trunk);

        // Delicate leaf clusters
        const leafMat = pick(leafPalette);
        const clumps = 5 + Math.floor(Math.random() * 4);
        for (let c = 0; c < clumps; c++) {
          const leaf = new THREE.Mesh(
            new THREE.SphereGeometry(rng(0.5, 1.0), 7, 5),
            leafMat
          );
          leaf.position.set(
            rng(-1.0, 1.0), h * 0.65 + rng(-0.5, 1.5), rng(-1.0, 1.0)
          );
          leaf.scale.set(rng(0.8,1.4), rng(0.6,1.0), rng(0.8,1.4));
          leaf.castShadow = true;
          group.add(leaf);
        }
      }

      group.userData = { type: 'wood', label: 'עץ', collected: false };
      this.resources.push(group);
      this.scene.add(group);
    }
  }

  _buildRocks(count) {
    const rockMats = [
      new THREE.MeshStandardMaterial({ color: 0x7a7a7a, roughness: 0.9 }),
      new THREE.MeshStandardMaterial({ color: 0x6a6060, roughness: 0.85 }),
    ];

    for (let i = 0; i < count; i++) {
      const x = (Math.random() - 0.5) * 340;
      const z = (Math.random() - 0.5) * 340;
      if (Math.abs(x) < 14 && Math.abs(z) < 14) continue;
      const y = this._terrainHeight(x, z);

      const scale = 0.3 + Math.random() * 0.9;
      const geo = new THREE.DodecahedronGeometry(scale, 0);
      // Deform slightly for organic feel
      const p = geo.attributes.position;
      for (let j = 0; j < p.count; j++) {
        p.setXYZ(j, p.getX(j) * (0.8 + Math.random() * 0.4), p.getY(j) * (0.6 + Math.random() * 0.5), p.getZ(j) * (0.8 + Math.random() * 0.4));
      }
      p.needsUpdate = true;
      geo.computeVertexNormals();

      const rock = new THREE.Mesh(geo, rockMats[i % 2]);
      rock.position.set(x, y + scale * 0.4, z);
      rock.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI);
      rock.castShadow = true;
      rock.receiveShadow = true;

      // Random resource type
      rock.userData = { type: Math.random() > 0.5 ? 'stone' : 'iron', label: Math.random() > 0.5 ? 'אבן' : 'ברזל', collected: false };
      this.resources.push(rock);
      this.scene.add(rock);
    }
  }

  _buildPlayer() {
    this.player = new THREE.Group();

    // Body
    const bodyMat = new THREE.MeshStandardMaterial({ color: 0x2244aa, roughness: 0.6 });
    const headMat = new THREE.MeshStandardMaterial({ color: 0xffcba0, roughness: 0.7 });

    const body = new THREE.Mesh(new THREE.CapsuleGeometry(0.3, 0.8, 6, 12), bodyMat);
    body.position.y = 0.9;
    body.castShadow = true;
    this.player.add(body);

    const head = new THREE.Mesh(new THREE.SphereGeometry(0.28, 12, 12), headMat);
    head.position.y = 1.8;
    head.castShadow = true;
    this.player.add(head);

    // Glow ring under player
    const ringGeo = new THREE.RingGeometry(0.35, 0.5, 24);
    ringGeo.rotateX(-Math.PI / 2);
    // High brightness so bloom creates a strong glow
    const ringMat = new THREE.MeshBasicMaterial({ color: 0x00ffff, transparent: true, opacity: 0.9, side: THREE.DoubleSide });
    this.playerRing = new THREE.Mesh(ringGeo, ringMat);
    this.playerRing.position.y = 0.05;
    this.player.add(this.playerRing);

    this.player.position.set(0, this._terrainHeight(0, 0), 0);
    this.scene.add(this.player);
  }

  // ── שלב 3: Satellite Tiles ───────────────────────────────────────────────
  async _loadSatellite() {
    try {
      const loadingEl = document.createElement('div');
      loadingEl.id = 'sat-loading';
      loadingEl.textContent = '🛰️ טוען תמונת לוויין...';
      document.body.appendChild(loadingEl);

      const texture = await buildSatelliteTexture(6); // 6×6 tile grid = higher coverage
      applySatelliteToTerrain(this.terrain, texture);

      loadingEl.remove();
    } catch (e) {
      console.warn('Satellite tiles failed, keeping procedural terrain', e);
    }
  }

  _setupAvatar() {
    this.avatarCtrl = new AvatarController(
      this.scene,
      (x, z) => this._terrainHeight(x, z),
      { waterLevel: this.waterLevel }
    );
    this.avatarCtrl.onSwimChange = (isSwimming) => {
      this.isSwimming = isSwimming;
      this.onSwimChange?.(isSwimming);
    };

    // Load demo avatar immediately
    const DEMO_AVATAR = 'https://threejs.org/examples/models/gltf/Soldier.glb';
    this.avatarCtrl.load(DEMO_AVATAR).then(() => {
      this.player.visible = false;
    }).catch(() => {
      // fallback — keep placeholder capsule
    });
  }

  // Called from HUD button — opens RPM creator when user wants to customize
  openAvatarCreator() {
    openAvatarCreator(async (glbUrl) => {
      await this.avatarCtrl.load(glbUrl);
      this.player.visible = false;
    });
  }

  _setupBuildings() {
    this.buildingSystem = new BuildingSystem(
      this.scene, this.camera, this.terrain,
      (x, z) => this._terrainHeight(x, z)
    );

    this.buildingSystem.onPlace = (type, cost) => {
      // Deduct resources
      for (const [res, qty] of Object.entries(cost)) {
        this.inventory[res] = Math.max(0, (this.inventory[res] || 0) - qty);
      }
      this.onBuild?.(type, cost);
    };

    // B key toggles build panel. When the panel is open, arrows belong to the UI.
    document.addEventListener('keydown', e => {
      if (e.code === 'KeyB') {
        e.preventDefault();
        this._toggleBuildPanel();
        return;
      }

      if (this._isBuildPanelOpen()) {
        if (this._handleBuildPanelKey(e)) return;
      }

      if (e.code === 'Escape') this._closeBuildPanel();
    });

    // Left-click in build mode = place
    document.addEventListener('mousedown', e => {
      if (e.button === 0 && this.buildingSystem.isActive) {
        if (document.pointerLockElement === this.renderer.domElement) {
          this.buildingSystem.place();
        }
      }
    });

    this._createBuildPanel();
  }

  _createBuildPanel() {
    const panel = document.createElement('div');
    panel.id = 'build-panel';
    panel.innerHTML = `
      <div class="build-panel-header">
        <span>🏗️ בנייה</span>
        <button id="build-close-btn">✕</button>
      </div>
      <div class="build-panel-hint">בחר מבנה ← לחץ בעולם להנחה • ESC לסגירה</div>
      <div class="build-categories" id="build-cats">
        <button class="build-cat-btn active" data-cat="all">🏗️ הכל</button>
        <button class="build-cat-btn" data-cat="residential">🏠 מגורים</button>
        <button class="build-cat-btn" data-cat="farm">🌾 חקלאות</button>
        <button class="build-cat-btn" data-cat="industry">🏭 תעשייה</button>
      </div>
      <div class="build-options" id="build-options"></div>
    `;
    document.body.appendChild(panel);

    document.getElementById('build-cats').addEventListener('click', e => {
      const btn = e.target.closest('.build-cat-btn');
      if (!btn) return;
      document.querySelectorAll('.build-cat-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      this._renderBuildOptions(btn.dataset.cat);
    });

    this._renderBuildOptions('all');
    document.getElementById('build-close-btn').addEventListener('click', () => this._closeBuildPanel());
  }

  _buildingCategory(key) {
    return { house: 'residential', farm: 'farm', printer: 'industry' }[key] || 'all';
  }

  _renderBuildOptions(cat) {
    const opts = document.getElementById('build-options');
    if (!opts) return;
    opts.innerHTML = '';
    const icons = { wood: '🪵', stone: '🪨', iron: '⚙️' };

    for (const [key, def] of Object.entries(BUILDING_DEFS)) {
      if (cat !== 'all' && this._buildingCategory(key) !== cat) continue;

      const canAfford = Object.entries(def.cost)
        .every(([r, q]) => (this.inventory[r] || 0) >= q);

      const btn = document.createElement('button');
      btn.className = 'build-option' + (canAfford ? '' : ' insufficient');
      btn.dataset.type = key;

      const costHtml = Object.entries(def.cost).map(([r, q]) => {
        const cls = (this.inventory[r] || 0) >= q ? 'ok' : 'lack';
        return `<span class="${cls}">${icons[r]} ${q}</span>`;
      }).join('');

      btn.innerHTML = `
        <div class="build-icon">${def.icon}</div>
        <div class="build-name">${def.name}</div>
        <div class="build-cost">${costHtml}</div>
        <div class="build-desc">${def.description}</div>
      `;
      btn.addEventListener('click', () => {
        document.querySelectorAll('.build-option').forEach(b => b.classList.remove('selected'));
        btn.classList.add('selected');
        this.buildingSystem.setType(key);
        this._enterPointerLock?.();
      });
      opts.appendChild(btn);
    }
  }

  _toggleBuildPanel() {
    const panel = document.getElementById('build-panel');
    if (this._isBuildPanelOpen()) {
      this._closeBuildPanel();
      return;
    }

    panel.classList.add('open');
    this._openBuildPanel();
  }

  _openBuildPanel() {
    const panel = document.getElementById('build-panel');
    if (panel) {
      panel.classList.add('open');
      this.buildingSystem.activate();
      if (!document.querySelector('.build-option.selected')) {
        this._selectBuildOption(0, { lockPointer: false });
      }
      document.exitPointerLock?.();
    }
  }

  _closeBuildPanel() {
    document.getElementById('build-panel')?.classList.remove('open');
    this.buildingSystem.deactivate();
    this.keys = {};
  }

  _enterPointerLock() {
    setTimeout(() => this.renderer.domElement.requestPointerLock(), 200);
  }

  _isBuildPanelOpen() {
    return document.getElementById('build-panel')?.classList.contains('open');
  }

  _isGameUiOpen() {
    return this._isBuildPanelOpen() || !!document.querySelector('.game-panel:not(.hidden)');
  }

  _handleBuildPanelKey(e) {
    const handledKeys = ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Enter', 'Space', 'Escape'];
    if (!handledKeys.includes(e.code)) return false;

    e.preventDefault();
    e.stopPropagation();
    this.keys = {};

    const options = [...document.querySelectorAll('.build-option')];
    if (!options.length) return true;

    const columns = 3;
    if (e.code === 'ArrowLeft') this._selectBuildOption(this.buildOptionIndex + 1, { lockPointer: false });
    if (e.code === 'ArrowRight') this._selectBuildOption(this.buildOptionIndex - 1, { lockPointer: false });
    if (e.code === 'ArrowDown') this._selectBuildOption(this.buildOptionIndex + columns, { lockPointer: false });
    if (e.code === 'ArrowUp') this._selectBuildOption(this.buildOptionIndex - columns, { lockPointer: false });
    if (e.code === 'Enter') this._placeSelectedBuildOption();
    if (e.code === 'Space') this._enterPointerLock();
    if (e.code === 'Escape') this._closeBuildPanel();

    return true;
  }

  _selectBuildOption(index, { lockPointer = false } = {}) {
    const options = [...document.querySelectorAll('.build-option')];
    if (!options.length) return;

    this.buildOptionIndex = (index + options.length) % options.length;
    const selected = options[this.buildOptionIndex];
    this._selectBuildOptionByKey(selected.dataset.type, { lockPointer });
  }

  _selectBuildOptionByKey(type, { lockPointer = false } = {}) {
    const options = [...document.querySelectorAll('.build-option')];
    const selectedIndex = options.findIndex(option => option.dataset.type === type);
    if (selectedIndex === -1) return;

    this.buildOptionIndex = selectedIndex;
    options.forEach(option => {
      const isSelected = option.dataset.type === type;
      option.classList.toggle('selected', isSelected);
      option.setAttribute('aria-selected', String(isSelected));
      if (isSelected) option.focus({ preventScroll: true });
    });
    this.buildingSystem.setType(type);

    if (lockPointer) this._enterPointerLock();
  }

  _placeSelectedBuildOption() {
    const placed = this.buildingSystem.place();
    if (placed) this._closeBuildPanel();
  }

  _setupRobots() {
    this.robotSystem = new RobotSystem(this.scene, (x, z) => this._terrainHeight(x, z));

    // Spawn 3 farm robots in the green area
    this.robotSystem.addFarmRobot( 25,  18);
    this.robotSystem.addFarmRobot(-30,  12);
    this.robotSystem.addFarmRobot( 10, -25);

    // Spawn 2 mining robots near rocky zones
    this.robotSystem.addMiningRobot( 45, -35);
    this.robotSystem.addMiningRobot(-40,  40);
  }

  _buildFog() {
    this.scene.fog = new THREE.FogExp2(0x0a1628, 0.007);
  }

  // ── שלב 1: Post-processing ──────────────────────────────────────────
  _setupPostProcessing() {
    const w = window.innerWidth, h = window.innerHeight;

    this.composer = new EffectComposer(this.renderer);
    this.composer.addPass(new RenderPass(this.scene, this.camera));

    // Bloom — נותן את ה"זוהר" של משחקי AAA
    this.bloomPass = new UnrealBloomPass(
      new THREE.Vector2(w, h),
      0.55,   // strength
      0.55,   // radius
      0.72    // threshold — רק אובייקטים בהירים מאוד זוהרים
    );
    this.composer.addPass(this.bloomPass);

    // Color Grading — Cinematic LUT בעזרת shader
    const colorGradeShader = {
      uniforms: {
        tDiffuse:   { value: null },
        saturation: { value: 1.18 },
        contrast:   { value: 1.08 },
        brightness: { value: 0.02 },
        tint:       { value: new THREE.Vector3(1.02, 0.98, 0.95) },
      },
      vertexShader: `
        varying vec2 vUv;
        void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }
      `,
      fragmentShader: `
        uniform sampler2D tDiffuse;
        uniform float saturation;
        uniform float contrast;
        uniform float brightness;
        uniform vec3 tint;
        varying vec2 vUv;

        vec3 czm_saturation(vec3 rgb, float sat) {
          vec3 W = vec3(0.2126, 0.7152, 0.0722);
          float grey = dot(rgb, W);
          return mix(vec3(grey), rgb, sat);
        }

        void main() {
          vec4 tex = texture2D(tDiffuse, vUv);
          vec3 col = tex.rgb;

          // Brightness
          col += brightness;

          // Contrast
          col = (col - 0.5) * contrast + 0.5;

          // Saturation
          col = czm_saturation(col, saturation);

          // Cinematic tint (slight warm)
          col *= tint;

          // Subtle vignette
          vec2 uv = vUv * (1.0 - vUv);
          float vig = uv.x * uv.y * 18.0;
          vig = pow(vig, 0.25);
          col *= mix(0.6, 1.0, vig);

          gl_FragColor = vec4(clamp(col, 0.0, 1.0), tex.a);
        }
      `
    };

    this.colorGradePass = new ShaderPass(colorGradeShader);
    this.composer.addPass(this.colorGradePass);
    this.composer.addPass(new OutputPass());

    // Resize
    window.addEventListener('resize', () => {
      this.composer.setSize(window.innerWidth, window.innerHeight);
    });
  }

  _setupInput() {
    document.addEventListener('keydown', e => {
      if (this._isGameUiOpen()) {
        if (['KeyW', 'KeyA', 'KeyS', 'KeyD', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ShiftLeft'].includes(e.code)) {
          this.keys = {};
          return;
        }
      }
      this.keys[e.code] = true;
    });
    document.addEventListener('keyup',   e => { this.keys[e.code] = false; });

    // Mouse look
    this.renderer.domElement.addEventListener('click', () => {
      this.renderer.domElement.requestPointerLock();
    });
    this.yaw = 0; this.pitch = 0;
    document.addEventListener('mousemove', e => {
      if (document.pointerLockElement === this.renderer.domElement) {
        this.yaw   -= e.movementX * 0.002;
        this.pitch -= e.movementY * 0.002;
        this.pitch = Math.max(-0.8, Math.min(0.8, this.pitch));
      }
    });

    // Click to collect resource
    this.raycaster = new THREE.Raycaster();
    document.addEventListener('mousedown', (e) => {
      if (e.button !== 0 || document.pointerLockElement !== this.renderer.domElement) return;
      this._tryCollect();
    });
  }

  _tryCollect() {
    this.raycaster.setFromCamera(new THREE.Vector2(0, 0), this.camera);
    const hits = this.raycaster.intersectObjects(
      this.resources.flatMap(r => r.isGroup ? r.children : [r]),
      false
    );
    if (!hits.length) return;
    const hit = hits[0];
    const obj = hit.object.parent?.userData?.type ? hit.object.parent : hit.object;
    if (!obj.userData?.type || obj.userData.collected) return;
    if (hit.distance > 12) return;

    obj.userData.collected = true;
    const qty = obj.userData.type === 'iron' ? 1 : Math.floor(Math.random() * 3) + 2;
    const rtype = obj.userData.type;
    this.inventory[rtype] = (this.inventory[rtype] || 0) + qty;
    this.onCollect?.(rtype, obj.userData.label, qty);

    // Shrink + fade out animation
    let t = 0;
    const shrink = () => {
      t += 0.06;
      obj.scale.setScalar(Math.max(0, 1 - t));
      if (t < 1) requestAnimationFrame(shrink);
      else {
        obj.visible = false;
        // Respawn after 30s
        setTimeout(() => {
          obj.scale.setScalar(1);
          obj.visible = true;
          obj.userData.collected = false;
        }, 30000);
      }
    };
    shrink();
  }

  _animate() {
    if (!this.isRunning) return;
    requestAnimationFrame(() => this._animate());
    const dt = this.clock.getDelta();
    if (this._isGameUiOpen()) this.keys = {};
    this._updatePlayer(dt);
    this._updateCamera();
    const elapsed = this.clock.elapsedTime;
    if (this.terrain?.material?.uniforms?.uTime)
      this.terrain.material.uniforms.uTime.value = elapsed;
    this._updateWater(elapsed);
    this._animateRing();
    this.buildingSystem?.update();
    this.buildingSystem?.animate(elapsed);
    this.robotSystem?.update(dt, elapsed);
    // Use composer (post-processing) instead of raw renderer
    if (this.composer) this.composer.render();
    else this.renderer.render(this.scene, this.camera);
  }

  _updatePlayer(dt) {
    // If RPM avatar loaded — use AvatarController instead
    if (this.avatarCtrl?.model) {
      this.avatarCtrl.update(dt, this.keys, this.yaw);
      const pos = this.avatarCtrl.worldPosition;
      this.onPositionUpdate?.(pos.x, pos.z);
      return;
    }

    // Fallback: placeholder capsule player
    const dir = new THREE.Vector3();
    const forward = new THREE.Vector3(Math.sin(this.yaw), 0, Math.cos(this.yaw));
    const right   = new THREE.Vector3(Math.cos(this.yaw), 0, -Math.sin(this.yaw));

    if (this.keys['KeyW'] || this.keys['ArrowUp'])    dir.add(forward);
    if (this.keys['KeyS'] || this.keys['ArrowDown'])  dir.sub(forward);
    if (this.keys['KeyA'] || this.keys['ArrowLeft'])  dir.sub(right);
    if (this.keys['KeyD'] || this.keys['ArrowRight']) dir.add(right);

    const sprint = this.keys['ShiftLeft'] ? 2.2 : 1;
    const terrainYBefore = this._terrainHeight(this.player.position.x, this.player.position.z);
    const nextSwimming = terrainYBefore <= this.waterLevel + 0.15;
    if (nextSwimming !== this.isSwimming) {
      this.isSwimming = nextSwimming;
      this.onSwimChange?.(this.isSwimming);
    }
    const waterSpeedFactor = this.isSwimming ? 0.42 : 1;
    if (dir.length() > 0) {
      dir.normalize();
      this.player.position.addScaledVector(dir, this.playerSpeed * sprint * waterSpeedFactor * dt);
      this.player.rotation.y = Math.atan2(dir.x, dir.z);
    }

    const px = this.player.position.x, pz = this.player.position.z;
    const terrainY = this._terrainHeight(px, pz);
    const swimBob = Math.sin(Date.now() * 0.006) * 0.08;
    this.player.position.y = this.isSwimming ? this.waterLevel - 0.35 + swimBob : terrainY;
    this.onPositionUpdate?.(px, pz);
  }

  _updateCamera() {
    // Follow RPM avatar if loaded, otherwise placeholder
    const base = this.avatarCtrl?.model
      ? this.avatarCtrl.worldPosition
      : this.player.position;

    const offset = new THREE.Vector3(
      Math.sin(this.yaw) * Math.cos(this.pitch) * -6,
      2.5 + Math.sin(this.pitch) * 4,
      Math.cos(this.yaw) * Math.cos(this.pitch) * -6
    );
    const target = base.clone().add(new THREE.Vector3(0, 1.5, 0));
    this.camera.position.lerp(target.clone().add(offset), 0.12);
    this.camera.lookAt(target);
  }

  _updateWater(t) {
    if (this.water) {
      this.water.material.color.setHSL(0.58, 0.7, 0.25 + Math.sin(t * 0.5) * 0.03);
    }
  }

  _animateRing() {
    if (this.playerRing) {
      this.playerRing.material.opacity = 0.4 + Math.sin(Date.now() * 0.004) * 0.25;
    }
  }

  destroy() {
    this.isRunning = false;
    this.renderer.dispose();
    this.container.removeChild(this.renderer.domElement);
  }
}
