/**
 * Terrain with real CC0 textures (Poly Haven + Three.js examples)
 * All textures are in /public/assets/textures/
 */
import * as THREE from 'three';

const ASSET_BASE = '/assets/textures';

function loadTex(path, repeat = 20) {
  const loader = new THREE.TextureLoader();
  const tex = loader.load(`${ASSET_BASE}/${path}`);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(repeat, repeat);
  tex.anisotropy = 16;
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

/**
 * Build a multi-texture terrain material using real images.
 * Uses a GLSL splat blend: grass | dirt | gravel/path | rock | snow
 */
export function buildTerrainMaterial() {
  const tGrass  = loadTex('grass.jpg',   22);  // tight repeat = sharp closeup
  const tDirt   = loadTex('dirt.jpg',    18);
  const tPath   = loadTex('path.jpg',    14);  // worn dirt path
  const tRock   = loadTex('rock.jpg',    12);

  return new THREE.ShaderMaterial({
    uniforms: {
      tGrass:   { value: tGrass  },
      tDirt:    { value: tDirt   },
      tPath:    { value: tPath   },
      tRock:    { value: tRock   },
      uFogColor:{ value: new THREE.Color(0xc8dff0) },
      uFogNear: { value: 150.0 },
      uFogFar:  { value: 360.0  },
    },
    vertexShader: `
      varying vec3  vWorldPos;
      varying vec3  vNormal;
      varying float vFog;
      void main() {
        vec4 wp  = modelMatrix * vec4(position, 1.0);
        vWorldPos = wp.xyz;
        vNormal   = normalize(normalMatrix * normal);
        vec4 mv   = modelViewMatrix * vec4(position, 1.0);
        vFog      = -mv.z;
        gl_Position = projectionMatrix * mv;
      }
    `,
    fragmentShader: `
      precision highp float;

      uniform sampler2D tGrass;
      uniform sampler2D tDirt;
      uniform sampler2D tPath;
      uniform sampler2D tRock;
      uniform vec3      uFogColor;
      uniform float     uFogNear;
      uniform float     uFogFar;

      varying vec3  vWorldPos;
      varying vec3  vNormal;
      varying float vFog;

      float hash(vec2 p) {
        return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
      }
      float noise(vec2 p) {
        vec2 i = floor(p), f = fract(p);
        f = f * f * (3.0 - 2.0*f);
        return mix(
          mix(hash(i), hash(i+vec2(1,0)), f.x),
          mix(hash(i+vec2(0,1)), hash(i+vec2(1,1)), f.x), f.y);
      }
      float fbm(vec2 p) {
        return noise(p)*0.5 + noise(p*2.1)*0.25 + noise(p*4.5)*0.15 + noise(p*9.2)*0.10;
      }

      void main() {
        vec2  xz    = vWorldPos.xz;
        float h     = vWorldPos.y;
        vec3  N     = normalize(vNormal);
        float slope = 1.0 - clamp(dot(N, vec3(0.0,1.0,0.0)), 0.0, 1.0);

        /* ── Noise for blending ── */
        float n1 = fbm(xz * 0.04);                        // biome scale
        float n2 = fbm(xz * 0.15 + vec2(13.7, 8.3));     // mid detail
        float n3 = noise(xz * 0.55 + vec2(4.1, 7.9));    // fine patches

        /* ── Sample textures at two scales and blend (reduces tiling artifacts) ── */
        vec2 uv_a = xz * (1.0/8.0);    // 8-unit tile (detail at feet)
        vec2 uv_b = xz * (1.0/40.0);   // 40-unit tile (large-scale variation)
        float blend = smoothstep(0.3, 0.7, n3);

        vec3 sGrass = mix(texture2D(tGrass, uv_a).rgb, texture2D(tGrass, uv_b).rgb, blend * 0.4);
        vec3 sDirt  = mix(texture2D(tDirt,  uv_a).rgb, texture2D(tDirt,  uv_b).rgb, blend * 0.3);
        vec3 sPath  = texture2D(tPath, uv_a * 0.9).rgb;
        vec3 sRock  = mix(texture2D(tRock,  uv_a).rgb, texture2D(tRock,  uv_b).rgb, blend * 0.5);

        /* ── Path / Trail ── */
        float pathCenterZ = sin(xz.x * 0.032) * 14.0 + cos(xz.x * 0.018) * 6.0;
        float dist        = abs(xz.z - pathCenterZ);
        float onPath      = smoothstep(4.5, 1.8, dist);   // packed dirt band
        float onCore      = smoothstep(2.2, 0.8, dist);   // worn center of path

        /* ── Terrain blend ── */
        vec3 col = sGrass;

        /* Dirt patches — noise driven */
        float dirtW = smoothstep(0.52, 0.70, n1) * (1.0 - slope) * step(-0.5, h);
        col = mix(col, sDirt, dirtW * 0.65);

        /* Slope → rock face */
        float rockW = smoothstep(0.30, 0.60, slope + n2*0.10);
        col = mix(col, sRock, rockW);

        /* High altitude → snow */
        float snowW = smoothstep(6.0, 8.5, h + n1*0.7) * (1.0 - slope*1.3);
        vec3  cSnow = vec3(0.94, 0.96, 1.0);
        col = mix(col, cSnow, clamp(snowW, 0.0, 1.0));

        /* Sandy edge near water */
        vec3 cSand = mix(sDirt, vec3(0.82, 0.72, 0.50), 0.6);
        col = mix(col, cSand, smoothstep(0.5, -1.0, h));

        /* Path over base terrain */
        col = mix(col, sDirt,  onPath * (1.0-rockW) * (1.0-snowW));
        col = mix(col, sPath,  onCore * (1.0-rockW) * (1.0-snowW));

        /* ── Lighting ── */
        vec3 sunDir = normalize(vec3(0.55, 0.85, 0.30));
        vec3 sunCol = vec3(1.0, 0.97, 0.88);
        vec3 ambCol = vec3(0.35, 0.42, 0.55);

        float diff  = max(dot(N, sunDir), 0.0);
        float sEdge = smoothstep(0.0, 0.20, diff);
        float ao    = 0.75 + 0.25 * dot(N, vec3(0,1,0));

        vec3 lit = col * (ambCol + sunCol * diff * sEdge) * ao;

        /* ── Fog ── */
        float ff = smoothstep(uFogNear, uFogFar, vFog);
        lit = mix(lit, uFogColor, ff);

        gl_FragColor = vec4(lit, 1.0);
      }
    `,
  });
}
