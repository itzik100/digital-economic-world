import * as THREE from 'three';
import { AvatarController, openAvatarCreator } from './avatar.js';
import { buildTerrainMaterial } from './terrain-assets.js';
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
    this.waterLevel = -7.0;
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
    this._buildBushes(80);
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
    this.scene.background = new THREE.Color(0x87ceeb);
  }

  _setupCamera() {
    this.camera = new THREE.PerspectiveCamera(65, window.innerWidth / window.innerHeight, 0.1, 2000);
    this.camera.position.set(0, 4, 10);
  }

  _setupLights() {
    // Sun — bright daylight
    this.sun = new THREE.DirectionalLight(0xfff8e8, 3.2);
    this.sun.position.set(80, 180, 60);
    this.sun.castShadow = true;
    this.sun.shadow.mapSize.set(4096, 4096);
    this.sun.shadow.camera.near = 1;
    this.sun.shadow.camera.far = 500;
    this.sun.shadow.camera.left = -120;
    this.sun.shadow.camera.right = 120;
    this.sun.shadow.camera.top = 120;
    this.sun.shadow.camera.bottom = -120;
    this.sun.shadow.bias = -0.0003;
    this.scene.add(this.sun);

    // Sky ambient — blue sky bounce
    const sky = new THREE.HemisphereLight(0x9ad4f0, 0x4a7a30, 1.1);
    this.scene.add(sky);

    // Fill light — soft blue from opposite side
    const fill = new THREE.DirectionalLight(0xaaccff, 0.4);
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

    const mat = buildTerrainMaterial();

    const terrain = new THREE.Mesh(geo, mat);
    terrain.receiveShadow = true;
    this.scene.add(terrain);
    this.terrain = terrain;
  }

  _terrainHeight(x, z) {
    // Gentle rolling hills — mostly above waterLevel (-7), water only in deep valleys
    const base = (
      Math.sin(x * 0.03) * Math.cos(z * 0.03) * 3.5 +
      Math.sin(x * 0.07 + 1.2) * Math.sin(z * 0.06) * 2.0 +
      Math.cos(x * 0.018 + z * 0.012) * 4.5 +
      Math.sin(x * 0.14) * Math.cos(z * 0.18) * 0.6
    );
    // Lift entire terrain by 3 so the center is well above water
    return base + 3.0;
  }

  // _buildTerrainMaterial removed — replaced by buildTerrainMaterial() from terrain-assets.js

  _REMOVED_buildTerrainMaterial() {
    // Canvas-generated textures: grass, dirt, gravel — tiled and sharp
    const grassTex  = this._makeGroundTex('grass');
    const dirtTex   = this._makeGroundTex('dirt');
    const gravelTex = this._makeGroundTex('gravel');

    return new THREE.ShaderMaterial({
      uniforms: {
        uGrass:   { value: grassTex  },
        uDirt:    { value: dirtTex   },
        uGravel:  { value: gravelTex },
        uFogColor:{ value: new THREE.Color(0xc8e8f5) },
        uFogNear: { value: 160.0 },
        uFogFar:  { value: 380.0 },
      },
      vertexShader: `
        varying vec3  vWorldPos;
        varying vec3  vNormal;
        varying float vFogDepth;
        void main() {
          vec4 wp = modelMatrix * vec4(position, 1.0);
          vWorldPos = wp.xyz;
          vNormal   = normalize(normalMatrix * normal);
          vec4 mv   = modelViewMatrix * vec4(position, 1.0);
          vFogDepth = -mv.z;
          gl_Position = projectionMatrix * mv;
        }
      `,
      fragmentShader: `
        precision highp float;
        uniform sampler2D uGrass;
        uniform sampler2D uDirt;
        uniform sampler2D uGravel;
        uniform vec3  uFogColor;
        uniform float uFogNear;
        uniform float uFogFar;

        varying vec3  vWorldPos;
        varying vec3  vNormal;
        varying float vFogDepth;

        float hash(vec2 p) {
          return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
        }
        float noise(vec2 p) {
          vec2 i = floor(p), f = fract(p);
          f = f*f*(3.0-2.0*f);
          return mix(
            mix(hash(i), hash(i+vec2(1,0)), f.x),
            mix(hash(i+vec2(0,1)), hash(i+vec2(1,1)), f.x), f.y);
        }
        float fbm(vec2 p) {
          return noise(p)*0.5 + noise(p*2.1)*0.25 + noise(p*4.3)*0.15 + noise(p*8.9)*0.10;
        }

        void main() {
          vec2  xz    = vWorldPos.xz;
          float h     = vWorldPos.y;
          vec3  N     = normalize(vNormal);
          float slope = 1.0 - clamp(dot(N, vec3(0.0,1.0,0.0)), 0.0, 1.0);

          /* ── Tiled texture sampling (repeat every 8 world units = sharp) ── */
          vec2  uv8  = xz * 0.125;   /* 1/8  */
          vec2  uv4  = xz * 0.25;    /* 1/4  */
          vec3  tGrass  = texture2D(uGrass,  uv8).rgb;
          vec3  tDirt   = texture2D(uDirt,   uv4).rgb;
          vec3  tGravel = texture2D(uGravel, uv4).rgb;

          /* ── Noise for blending ── */
          float n1 = fbm(xz * 0.05);
          float n2 = fbm(xz * 0.18 + vec2(17.3, 5.1));

          /* ── Path: winding dirt trail ── */
          float pathCenterZ = sin(xz.x * 0.03) * 15.0 + cos(xz.x * 0.016) * 7.0;
          float distPath    = abs(xz.z - pathCenterZ);
          float onDirt      = smoothstep(4.0, 2.5, distPath);
          float onGravel    = smoothstep(2.2, 1.0, distPath);

          /* ── Base: grass ── */
          vec3 col = tGrass;

          /* dirt patches (biome noise) */
          float dirtBlend = smoothstep(0.55, 0.72, n1) * (1.0 - slope) * step(-0.5, h);
          col = mix(col, tDirt, dirtBlend * 0.6);

          /* rocky slopes */
          float rockBlend = smoothstep(0.25, 0.55, slope + n2*0.1);
          vec3  cRock = vec3(0.45, 0.42, 0.38) + (n2-0.5)*0.05;
          col = mix(col, cRock, rockBlend);

          /* high altitude snow */
          float snowBlend = smoothstep(5.5, 7.5, h + n1*0.8) * (1.0 - slope*1.4);
          vec3  cSnow = vec3(0.95, 0.97, 1.0);
          col = mix(col, cSnow, clamp(snowBlend,0.0,1.0));

          /* sand near waterline */
          col = mix(col, vec3(0.80, 0.70, 0.48), smoothstep(0.3, -0.5, h));

          /* apply path over terrain */
          col = mix(col, tDirt,   onDirt   * (1.0-rockBlend) * (1.0-snowBlend));
          col = mix(col, tGravel, onGravel * (1.0-rockBlend) * (1.0-snowBlend));

          /* ── Lighting ── */
          vec3 sunDir   = normalize(vec3(0.5, 0.9, 0.3));
          vec3 sunCol   = vec3(1.0, 0.96, 0.86);
          vec3 ambCol   = vec3(0.32, 0.40, 0.55);
          float diff    = max(dot(N, sunDir), 0.0);
          float softD   = smoothstep(0.0, 0.18, diff);
          float ao      = 0.75 + 0.25*dot(N, vec3(0,1,0));
          vec3 lit      = col * (ambCol + sunCol*diff*softD) * ao;

          /* ── Fog ── */
          float ff = smoothstep(uFogNear, uFogFar, vFogDepth);
          lit = mix(lit, uFogColor, ff);

          gl_FragColor = vec4(lit, 1.0);
        }
      `
    });
  }

  _REMOVED_makeGroundTex(type) {
    const size = 256;
    const c = document.createElement('canvas');
    c.width = c.height = size;
    const ctx = c.getContext('2d');

    if (type === 'grass') {
      // Base grass green
      ctx.fillStyle = '#3a7a1a';
      ctx.fillRect(0, 0, size, size);
      // Blade variation — random darker/lighter strokes
      for (let i = 0; i < 2000; i++) {
        const x = Math.random() * size;
        const y = Math.random() * size;
        const l = 4 + Math.random() * 10;
        const lum = Math.random();
        ctx.strokeStyle = lum > 0.5
          ? `rgba(80,180,40,${0.15 + Math.random()*0.25})`
          : `rgba(20,80,5,${0.1 + Math.random()*0.2})`;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(x + (Math.random()-0.5)*3, y - l);
        ctx.stroke();
      }
      // Dirt patches
      for (let i = 0; i < 30; i++) {
        const x = Math.random() * size, y = Math.random() * size;
        const r = 3 + Math.random() * 8;
        ctx.beginPath();
        ctx.arc(x, y, r, 0, Math.PI*2);
        ctx.fillStyle = `rgba(100,65,25,${0.2 + Math.random()*0.3})`;
        ctx.fill();
      }

    } else if (type === 'dirt') {
      // Base warm dirt
      ctx.fillStyle = '#8b5c2a';
      ctx.fillRect(0, 0, size, size);
      // Texture variation
      for (let i = 0; i < 3000; i++) {
        const x = Math.random() * size, y = Math.random() * size;
        ctx.fillStyle = Math.random() > 0.5
          ? `rgba(140,90,40,${0.3})`
          : `rgba(60,35,10,${0.25})`;
        ctx.fillRect(x, y, 1 + Math.random()*2, 1 + Math.random()*2);
      }
      // Cracked lines
      for (let i = 0; i < 15; i++) {
        ctx.strokeStyle = `rgba(50,28,8,${0.15 + Math.random()*0.2})`;
        ctx.lineWidth = 0.5 + Math.random();
        ctx.beginPath();
        const sx = Math.random()*size, sy = Math.random()*size;
        ctx.moveTo(sx, sy);
        let cx = sx, cy = sy;
        for (let s = 0; s < 4; s++) {
          cx += (Math.random()-0.5)*30; cy += (Math.random()-0.5)*30;
          ctx.lineTo(cx, cy);
        }
        ctx.stroke();
      }

    } else if (type === 'gravel') {
      // Base grey-tan
      ctx.fillStyle = '#9a9080';
      ctx.fillRect(0, 0, size, size);
      // Individual pebbles
      for (let i = 0; i < 400; i++) {
        const x = Math.random() * size, y = Math.random() * size;
        const rx = 3 + Math.random()*5, ry = 2 + Math.random()*4;
        const angle = Math.random() * Math.PI;
        const lum = 0.55 + Math.random()*0.35;
        ctx.save();
        ctx.translate(x, y); ctx.rotate(angle);
        ctx.beginPath();
        ctx.ellipse(0, 0, rx, ry, 0, 0, Math.PI*2);
        ctx.fillStyle = `rgb(${Math.round(lum*170)},${Math.round(lum*158)},${Math.round(lum*140)})`;
        ctx.fill();
        // Highlight
        ctx.beginPath();
        ctx.ellipse(-rx*0.2, -ry*0.2, rx*0.4, ry*0.35, 0, 0, Math.PI*2);
        ctx.fillStyle = `rgba(255,255,255,${0.1 + Math.random()*0.15})`;
        ctx.fill();
        ctx.restore();
      }
    }

    const tex = new THREE.CanvasTexture(c);
    tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
    tex.anisotropy = 16;
    tex.repeat.set(1, 1);
    return tex;
  }

  _buildWater() {
    const geo = new THREE.PlaneGeometry(500, 500);
    geo.rotateX(-Math.PI / 2);
    const mat = new THREE.MeshStandardMaterial({
      color: 0x2a6644,  // dark green-blue — looks like a real lake/river
      roughness: 0.08,
      metalness: 0.05,
      transparent: true,
      opacity: 0.88,
    });
    const water = new THREE.Mesh(geo, mat);
    water.position.y = this.waterLevel;
    this.scene.add(water);
    this.water = water;
  }

  _buildSky() {
    // Daytime gradient sky dome
    const geo = new THREE.SphereGeometry(900, 32, 16);
    const mat = new THREE.ShaderMaterial({
      side: THREE.BackSide,
      uniforms: {
        topColor:    { value: new THREE.Color(0x3a8fd4) },
        horizonColor:{ value: new THREE.Color(0xc8e8f5) },
        bottomColor: { value: new THREE.Color(0xa0cce0) },
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
          vec3 col = mix(horizonColor, topColor, smoothstep(0.0, 0.6, vY));
          // Below horizon — show terrain-matched haze, not dark
          col = mix(horizonColor, col, smoothstep(-0.05, 0.05, vY));
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

    // Sun disc — daytime position, high in sky
    const sunGeo = new THREE.SphereGeometry(7, 16, 16);
    const sunMat = new THREE.MeshBasicMaterial({ color: 0xfffbe8 });
    const sunMesh = new THREE.Mesh(sunGeo, sunMat);
    sunMesh.position.set(120, 380, -200);
    this.scene.add(sunMesh);

    // Soft halo rings
    [20, 40, 75].forEach((r, i) => {
      const g = new THREE.Mesh(
        new THREE.SphereGeometry(r, 16, 16),
        new THREE.MeshBasicMaterial({
          color: 0xffeebb,
          transparent: true,
          opacity: [0.12, 0.05, 0.02][i]
        })
      );
      g.position.copy(sunMesh.position);
      this.scene.add(g);
    });
  }

  _buildTrees(count) {
    const rng = (a, b) => a + Math.random() * (b - a);
    const pick = arr => arr[Math.floor(Math.random() * arr.length)];

    const barkMat   = new THREE.MeshLambertMaterial({ color: 0x5c3510 });
    const birchMat  = new THREE.MeshLambertMaterial({ color: 0xc8bfb0 });

    const leafPalette = [
      new THREE.MeshLambertMaterial({ color: 0x2d6e10 }),
      new THREE.MeshLambertMaterial({ color: 0x3a8818 }),
      new THREE.MeshLambertMaterial({ color: 0x246008 }),
      new THREE.MeshLambertMaterial({ color: 0x4a9820 }),
      new THREE.MeshLambertMaterial({ color: 0x1a5208 }),
    ];
    const pineLeaf = new THREE.MeshLambertMaterial({ color: 0x1a5010 });

    for (let i = 0; i < count; i++) {
      // Cluster trees along path edges and in forest zones
      let x, z;
      const zone = Math.random();
      if (zone < 0.5) {
        // Forest strips on both sides of path
        const side = Math.random() > 0.5 ? 1 : -1;
        x = rng(-160, 160);
        const pathCenterZ = Math.sin(x * 0.03) * 15.0 + Math.cos(x * 0.016) * 7.0;
        z = pathCenterZ + side * (rng(8, 50));
      } else {
        x = rng(-160, 160);
        z = rng(-160, 160);
      }
      if (Math.abs(x) < 10 && Math.abs(z) < 10) continue;

      const y = this._terrainHeight(x, z);
      if (y < this.waterLevel + 0.5) continue; // no trees in water

      const type = Math.random();
      const group = new THREE.Group();
      group.position.set(x, y, z);
      group.rotation.y = rng(0, Math.PI * 2);
      // Natural size variation — avoid giant trees
      const sizeScale = rng(0.7, 1.3);
      group.scale.setScalar(sizeScale);

      if (type < 0.5) {
        // ── Oak / Broad-leaf (most common) ──
        const h = rng(3.5, 5.5);
        const tr = rng(0.14, 0.22);

        const trunk = new THREE.Mesh(
          new THREE.CylinderGeometry(tr * 0.55, tr, h * 0.5, 7),
          barkMat
        );
        trunk.position.y = h * 0.25;
        trunk.castShadow = true;
        group.add(trunk);

        // Canopy — irregular cluster of overlapping spheres
        const leafMat = pick(leafPalette);
        const clumps  = 5 + Math.floor(Math.random() * 5);
        const baseY   = h * 0.6;
        for (let c = 0; c < clumps; c++) {
          const cr = rng(0.8, 1.5);
          const cx = rng(-cr * 0.8, cr * 0.8);
          const cy = rng(-cr * 0.3, cr * 0.5);
          const cz = rng(-cr * 0.8, cr * 0.8);
          const leaf = new THREE.Mesh(
            new THREE.SphereGeometry(cr, 7, 5),
            leafMat
          );
          leaf.position.set(cx, baseY + cy, cz);
          leaf.scale.set(rng(0.9, 1.2), rng(0.75, 1.0), rng(0.9, 1.2));
          leaf.castShadow = true;
          group.add(leaf);
        }

      } else if (type < 0.78) {
        // ── Pine / Conifer ──
        const h = rng(4.5, 8.0);
        const trunk = new THREE.Mesh(
          new THREE.CylinderGeometry(0.10, 0.20, h * 0.45, 6),
          barkMat
        );
        trunk.position.y = h * 0.22;
        trunk.castShadow = true;
        group.add(trunk);

        const layers = 3 + Math.floor(Math.random() * 3);
        for (let l = 0; l < layers; l++) {
          const t  = l / (layers - 1);
          const r  = rng(1.2, 1.9) * (1 - t * 0.6);
          const ly = h * 0.38 + t * h * 0.58;
          const lh = rng(1.4, 2.0) * (1 - t * 0.25);
          const cone = new THREE.Mesh(
            new THREE.ConeGeometry(r, lh, 7),
            pineLeaf
          );
          cone.position.y = ly;
          cone.castShadow = true;
          group.add(cone);
        }

      } else {
        // ── Birch / Slim ──
        const h = rng(5, 8);
        const trunk = new THREE.Mesh(
          new THREE.CylinderGeometry(0.08, 0.14, h * 0.65, 7),
          birchMat
        );
        trunk.position.y = h * 0.32;
        trunk.castShadow = true;
        group.add(trunk);

        const leafMat = pick(leafPalette);
        const clumps  = 4 + Math.floor(Math.random() * 4);
        for (let c = 0; c < clumps; c++) {
          const leaf = new THREE.Mesh(
            new THREE.SphereGeometry(rng(0.5, 0.9), 6, 5),
            leafMat
          );
          leaf.position.set(
            rng(-0.9, 0.9), h * 0.65 + rng(-0.4, 1.2), rng(-0.9, 0.9)
          );
          leaf.scale.set(rng(0.8, 1.3), rng(0.65, 1.0), rng(0.8, 1.3));
          leaf.castShadow = true;
          group.add(leaf);
        }
      }

      group.userData = { type: 'wood', label: 'עץ', collected: false };
      this.resources.push(group);
      this.scene.add(group);
    }
  }

  _buildBushes(count) {
    const rng = (a, b) => a + Math.random() * (b - a);
    const mats = [
      new THREE.MeshLambertMaterial({ color: 0x2a6010 }),
      new THREE.MeshLambertMaterial({ color: 0x3a7818 }),
      new THREE.MeshLambertMaterial({ color: 0x1e5008 }),
    ];
    for (let i = 0; i < count; i++) {
      // Place bushes near path edges
      const x = rng(-140, 140);
      const pathZ = Math.sin(x * 0.032) * 14.0 + Math.cos(x * 0.018) * 6.0;
      const side  = Math.random() > 0.5 ? 1 : -1;
      const z     = pathZ + side * rng(5, 22);
      const y     = this._terrainHeight(x, z);
      if (y < this.waterLevel + 0.5) continue;

      const group = new THREE.Group();
      group.position.set(x, y, z);
      const mat = mats[i % mats.length];
      const clumps = 2 + Math.floor(Math.random() * 3);
      for (let c = 0; c < clumps; c++) {
        const r = rng(0.3, 0.7);
        const mesh = new THREE.Mesh(
          new THREE.SphereGeometry(r, 6, 4),
          mat
        );
        mesh.position.set(rng(-0.4, 0.4), r * 0.6, rng(-0.4, 0.4));
        mesh.scale.set(rng(1.0, 1.5), rng(0.65, 0.9), rng(1.0, 1.5));
        mesh.castShadow = true;
        group.add(mesh);
      }
      this.scene.add(group);
    }
  }

  _buildRocks(count) {
    const rockMats = [
      new THREE.MeshLambertMaterial({ color: 0x7a7266 }),
      new THREE.MeshLambertMaterial({ color: 0x66605a }),
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

  // Satellite loading disabled — procedural terrain looks sharper
  async _loadSatellite() { /* intentionally disabled */ }

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
    // Free-roaming robots removed — robots are now service stations only
    // The RobotSystem is kept available for future workstation-mode placement
    this.robotSystem = null;
  }

  _buildFog() {
    // Light haze — shows terrain clearly nearby, fades at distance
    this.scene.fog = new THREE.Fog(0xc8e8f5, 160, 380);
  }

  // ── שלב 1: Post-processing ──────────────────────────────────────────
  _setupPostProcessing() {
    const w = window.innerWidth, h = window.innerHeight;

    this.composer = new EffectComposer(this.renderer);
    this.composer.addPass(new RenderPass(this.scene, this.camera));

    // Bloom — very subtle, only for sun disc
    this.bloomPass = new UnrealBloomPass(
      new THREE.Vector2(w, h),
      0.15,   // very low strength
      0.3,    // tight radius
      0.95    // high threshold — almost nothing blooms except the sun
    );
    this.composer.addPass(this.bloomPass);

    // Color Grading — Cinematic LUT בעזרת shader
    const colorGradeShader = {
      uniforms: {
        tDiffuse:   { value: null },
        saturation: { value: 1.10 },
        contrast:   { value: 1.04 },
        brightness: { value: 0.01 },
        tint:       { value: new THREE.Vector3(1.01, 1.00, 0.98) },
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
    this.player.position.y = this.isSwimming ? this.waterLevel - 0.08 + swimBob : terrainY;
    const targetPitch = this.isSwimming ? Math.PI * 0.5 : 0;
    const targetRoll = this.isSwimming ? Math.PI : 0;
    this.player.rotation.x += (targetPitch - this.player.rotation.x) * 0.14;
    this.player.rotation.z += (targetRoll - this.player.rotation.z) * 0.14;
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
