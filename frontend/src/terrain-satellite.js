import * as THREE from 'three';

// Free ESRI World Imagery tiles — no API key needed
// Route through Vite proxy to avoid CORS
const TILE_URL = (z, x, y) =>
  `/esri-tiles/ArcGIS/rest/services/World_Imagery/MapServer/tile/${z}/${y}/${x}`;

// World center — green landscape in central Europe (Austria)
// lat: 47.5, lon: 14.0  →  beautiful alpine meadows + mountains
const CENTER_LAT = 47.5;
const CENTER_LON = 14.0;
const ZOOM = 15; // higher = more detail (15 = street level resolution)

function latLonToTile(lat, lon, z) {
  const n = Math.pow(2, z);
  const x = Math.floor((lon + 180) / 360 * n);
  const latRad = lat * Math.PI / 180;
  const y = Math.floor((1 - Math.log(Math.tan(latRad) + 1 / Math.cos(latRad)) / Math.PI) / 2 * n);
  return { x, y };
}

// Load a grid of satellite tiles and stitch into one texture
export async function buildSatelliteTexture(gridSize = 3) {
  const center = latLonToTile(CENTER_LAT, CENTER_LON, ZOOM);
  const half = Math.floor(gridSize / 2);

  const tileSize = 256;
  const totalPx = tileSize * gridSize;

  const canvas = document.createElement('canvas');
  canvas.width = totalPx;
  canvas.height = totalPx;
  const ctx = canvas.getContext('2d');

  const loads = [];
  for (let row = 0; row < gridSize; row++) {
    for (let col = 0; col < gridSize; col++) {
      const tx = center.x - half + col;
      const ty = center.y - half + row;
      const url = TILE_URL(ZOOM, tx, ty);

      loads.push(
        fetch(url)
          .then(r => r.blob())
          .then(blob => {
            return new Promise(resolve => {
              const img = new Image();
              img.onload = () => {
                ctx.drawImage(img, col * tileSize, row * tileSize, tileSize, tileSize);
                resolve();
              };
              img.onerror = resolve; // skip failed tiles gracefully
              img.src = URL.createObjectURL(blob);
            });
          })
          .catch(() => {}) // network fail → blank tile
      );
    }
  }

  await Promise.all(loads);

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.ClampToEdgeWrapping;
  texture.wrapT = THREE.ClampToEdgeWrapping;
  texture.anisotropy = 16;
  return texture;
}

// Replace terrain material with satellite texture
export function applySatelliteToTerrain(terrain, texture) {
  terrain.material.dispose();
  terrain.material = new THREE.MeshStandardMaterial({
    map: texture,
    roughness: 0.88,
    metalness: 0.0,
    envMapIntensity: 0.3,
  });
}
