import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

// ── Ready Player Me iframe creator ──────────────────────────────────────────
export function openAvatarCreator(onAvatarReady) {
  const overlay = document.createElement('div');
  overlay.id = 'rpm-overlay';
  overlay.innerHTML = `
    <div id="rpm-modal">
      <div id="rpm-header">
        <span>🎮 צור את הדמות שלך</span>
        <button id="rpm-close">✕</button>
      </div>
      <iframe
        id="rpm-frame"
        src="https://demo.readyplayer.me/avatar?frameApi&clearCache"
        allow="camera *; microphone *"
      ></iframe>
      <div id="rpm-loading">טוען עורך דמות...</div>
    </div>
  `;
  document.body.appendChild(overlay);

  const iframe = document.getElementById('rpm-frame');
  const loading = document.getElementById('rpm-loading');

  iframe.onload = () => { loading.style.display = 'none'; };

  // Listen for the avatar GLB URL from RPM
  function onMessage(e) {
    if (typeof e.data !== 'string') return;
    try {
      const msg = JSON.parse(e.data);
      if (msg.eventName === 'v1.avatar.exported') {
        const url = msg.data?.url;
        if (url) {
          window.removeEventListener('message', onMessage);
          closeOverlay();
          onAvatarReady(url);
        }
      }
    } catch {}
  }

  window.addEventListener('message', onMessage);

  document.getElementById('rpm-close').onclick = closeOverlay;
  overlay.addEventListener('click', (e) => { if (e.target === overlay) closeOverlay(); });

  function closeOverlay() {
    window.removeEventListener('message', onMessage);
    overlay.remove();
  }
}

// ── GLTF Avatar Loader ───────────────────────────────────────────────────────
export class AvatarController {
  constructor(scene, terrainHeightFn, options = {}) {
    this.scene = scene;
    this.terrainHeight = terrainHeightFn;
    this.waterLevel = options.waterLevel ?? -1.5;
    this.loader = new GLTFLoader();
    this.mixer = null;
    this.model = null;
    this.actions = {};
    this.currentAction = null;
    this.clock = new THREE.Clock();
    this.hasSwimAnimation = false;
    this.swimRestQuaternions = new Map();
    this.tmpQuat = new THREE.Quaternion();
    this.swimBones = {
      leftArm: null,
      leftForeArm: null,
      rightArm: null,
      rightForeArm: null,
      leftUpLeg: null,
      leftLeg: null,
      rightUpLeg: null,
      rightLeg: null,
      spine: null,
    };

    // Position & movement state
    this.position = new THREE.Vector3(0, 0, 0);
    this.velocity = new THREE.Vector3();
    this.yaw = 0;
    this.isMoving = false;
    this.isSprinting = false;
    this.isSwimming = false;
    this.onSwimChange = null;
  }

  async load(glbUrl) {
    return new Promise((resolve, reject) => {
      // Show progress
      const progress = document.createElement('div');
      progress.id = 'avatar-load-progress';
      progress.textContent = 'טוען דמות...';
      document.body.appendChild(progress);

      this.loader.load(
        glbUrl,
        (gltf) => {
          progress.remove();
          this._setupModel(gltf);
          resolve(this.model);
        },
        (xhr) => {
          const pct = Math.round((xhr.loaded / xhr.total) * 100);
          progress.textContent = `טוען דמות... ${pct}%`;
        },
        (err) => {
          progress.remove();
          console.error('Avatar load error:', err);
          reject(err);
        }
      );
    });
  }

  _setupModel(gltf) {
    // Remove old model if exists
    if (this.model) {
      this.scene.remove(this.model);
      this.mixer?.stopAllAction();
    }

    this.model = gltf.scene;
    this.model.rotation.order = 'YXZ';
    this.model.scale.setScalar(1.0);
    // Soldier model faces +Z, rotate 180° so it faces the camera correctly
    this.model.rotation.y = Math.PI;
    this.model.traverse(child => {
      if (child.isMesh) {
        child.castShadow = true;
        child.receiveShadow = true;
        // Improve material quality
        if (child.material) {
          child.material.envMapIntensity = 1.2;
        }
      }
      if (child.isBone) this._mapSwimBone(child);
    });
    this.model.traverse(child => {
      if (child.isBone) this.swimRestQuaternions.set(child.uuid, child.quaternion.clone());
    });

    const y = this.terrainHeight(0, 0);
    this.model.position.set(0, y, 0);
    this.position.set(0, y, 0);
    this.scene.add(this.model);

    // Animations
    if (gltf.animations?.length > 0) {
      this.mixer = new THREE.AnimationMixer(this.model);

      // Debug: log all available animations
      console.log('Available animations:', gltf.animations.map(c => c.name));

      // Skip non-locomotion clips
      const SKIP = ['jump','death','dance','sitting','yes','no','wave','punch','thumbsup'];

      for (const clip of gltf.animations) {
        const name = clip.name.toLowerCase();
        const action = this.mixer.clipAction(clip);
        if (SKIP.some(s => name.includes(s))) continue; // ignore jumps etc.

        this.actions[name] = action;

        if (name === 'idle' || name === 'standing' || name === 't-pose')
          this.actions.idle = this.actions.idle || action;
        if (name === 'walking' || name === 'walk')
          this.actions.walk = action;
        if (name === 'running' || name === 'run')
          this.actions.run = action;
        // RPM naming
        if (name.includes('idle') && !this.actions.idle) this.actions.idle = action;
        if (name.includes('walk') && !this.actions.walk) this.actions.walk = action;
        if (name.includes('run')  && !this.actions.run)  this.actions.run  = action;
        if (name.includes('swim') && !this.actions.swim) {
          this.actions.swim = action;
          this.hasSwimAnimation = true;
        }
      }

      // Fallbacks — never jump
      if (!this.actions.idle) {
        const safe = gltf.animations.find(c => !SKIP.some(s => c.name.toLowerCase().includes(s)));
        this.actions.idle = this.mixer.clipAction(safe || gltf.animations[0]);
      }
      if (!this.actions.walk) this.actions.walk = this.actions.idle;
      if (!this.actions.run)  this.actions.run  = this.actions.walk;
      if (!this.actions.swim) this.actions.swim = this.actions.idle;

      this._playAction('idle');
    }

    // Glow ring under avatar
    const ringGeo = new THREE.RingGeometry(0.38, 0.55, 32);
    ringGeo.rotateX(-Math.PI / 2);
    this.ring = new THREE.Mesh(ringGeo, new THREE.MeshBasicMaterial({
      color: 0x00ffff, transparent: true, opacity: 0.85, side: THREE.DoubleSide
    }));
    this.model.add(this.ring);
  }

  _playAction(name) {
    const next = this.actions[name];
    if (!next || next === this.currentAction) return;
    if (this.currentAction) {
      this.currentAction.fadeOut(0.25);
    }
    next.reset().fadeIn(0.25).play();
    this.currentAction = next;
  }

  update(dt, keys, yaw) {
    this.yaw = yaw;

    if (!this.model) return;

    // Movement
    const forward = new THREE.Vector3(Math.sin(yaw), 0, Math.cos(yaw));
    const right   = new THREE.Vector3(Math.cos(yaw), 0, -Math.sin(yaw));
    const dir     = new THREE.Vector3();

    if (keys['KeyW'] || keys['ArrowUp'])    dir.add(forward);
    if (keys['KeyS'] || keys['ArrowDown'])  dir.sub(forward);
    if (keys['KeyD'] || keys['ArrowRight']) dir.sub(right);
    if (keys['KeyA'] || keys['ArrowLeft'])  dir.add(right);

    this.isSprinting = !!keys['ShiftLeft'];
    this.isMoving = dir.length() > 0;

    const pxBefore = this.model.position.x;
    const pzBefore = this.model.position.z;
    const terrainBefore = this.terrainHeight(pxBefore, pzBefore);
    const nextSwimming = terrainBefore <= this.waterLevel + 0.15;
    if (nextSwimming !== this.isSwimming) {
      this.isSwimming = nextSwimming;
      this.onSwimChange?.(this.isSwimming);
    }

    const walkSpeed = this.isSwimming ? 2.8 : 5;
    const runSpeed = this.isSwimming ? 4.2 : 10;
    const speed = this.isMoving ? (this.isSprinting ? runSpeed : walkSpeed) : 0;

    if (this.isMoving) {
      dir.normalize();
      this.model.position.addScaledVector(dir, speed * dt);
      // Face movement direction smoothly
      const targetAngle = Math.atan2(dir.x, dir.z) + Math.PI;
      const current = this.model.rotation.y;
      const diff = ((targetAngle - current + Math.PI * 3) % (Math.PI * 2)) - Math.PI;
      this.model.rotation.y += diff * 0.15;
    }

    // Smooth terrain follow — lerp Y to avoid jitter/bouncing
    const px = this.model.position.x, pz = this.model.position.z;
    const terrainY = this.terrainHeight(px, pz);
    const bob = Math.sin(Date.now() * 0.006) * 0.08;
    const targetY = this.isSwimming ? this.waterLevel - 0.22 + bob : terrainY;
    this.model.position.y += (targetY - this.model.position.y) * 0.18;
    this.position.copy(this.model.position);

    // Animations
    if (this.isSwimming) {
      this._playAction(this.isMoving ? 'swim' : 'idle');
      if (this.currentAction) {
        this.currentAction.timeScale = this.hasSwimAnimation
          ? (this.isMoving ? 0.85 : 0.35)
          : 0.05;
      }
    } else if (this.isMoving) {
      this._playAction(this.isSprinting ? 'run' : 'walk');
      if (this.currentAction) this.currentAction.timeScale = 1;
    } else {
      this._playAction('idle');
      if (this.currentAction) this.currentAction.timeScale = 1;
    }

    // Animate ring
    if (this.ring) {
      this.ring.position.y = this.isSwimming ? 0.72 : 0.05;
      this.ring.material.opacity = this.isSwimming
        ? 0.25 + Math.sin(Date.now() * 0.008) * 0.12
        : 0.5 + Math.sin(Date.now() * 0.004) * 0.35;
    }

    this.mixer?.update(dt);
    this._applySwimPose(dt);
  }

  get worldPosition() {
    return this.position;
  }

  _mapSwimBone(bone) {
    const name = bone.name.toLowerCase().replace(/[^a-z0-9]/g, '');

    if (!this.swimBones.spine && (name.includes('spine') || name.includes('chest'))) {
      this.swimBones.spine = bone;
      return;
    }

    const isLeft = name.includes('left') || name.includes('larm') || name.includes('lleg');
    const isRight = name.includes('right') || name.includes('rarm') || name.includes('rleg');
    const isForeArm = name.includes('forearm') || name.includes('lowerarm');
    const isArm = name.includes('arm') && !isForeArm && !name.includes('hand');
    const isUpLeg = name.includes('upleg') || name.includes('thigh');
    const isLeg = (name.includes('leg') || name.includes('calf')) && !isUpLeg && !name.includes('foot');

    if (isLeft && isArm && !this.swimBones.leftArm) this.swimBones.leftArm = bone;
    if (isLeft && isForeArm && !this.swimBones.leftForeArm) this.swimBones.leftForeArm = bone;
    if (isRight && isArm && !this.swimBones.rightArm) this.swimBones.rightArm = bone;
    if (isRight && isForeArm && !this.swimBones.rightForeArm) this.swimBones.rightForeArm = bone;
    if (isLeft && isUpLeg && !this.swimBones.leftUpLeg) this.swimBones.leftUpLeg = bone;
    if (isLeft && isLeg && !this.swimBones.leftLeg) this.swimBones.leftLeg = bone;
    if (isRight && isUpLeg && !this.swimBones.rightUpLeg) this.swimBones.rightUpLeg = bone;
    if (isRight && isLeg && !this.swimBones.rightLeg) this.swimBones.rightLeg = bone;
  }

  _applySwimPose(dt) {
    if (!this.model) return;

    const targetPitch = this.isSwimming ? Math.PI * 0.5 : 0;
    const targetRoll = this.isSwimming ? Math.PI : 0;
    this.model.rotation.x += (targetPitch - this.model.rotation.x) * 0.18;
    this.model.rotation.z += (targetRoll - this.model.rotation.z) * 0.18;

    const moving = this.isMoving ? 1 : 0.35;
    const t = performance.now() * 0.0045;
    const stroke = Math.sin(t) * moving;
    const counter = Math.sin(t + Math.PI) * moving;
    const kick = Math.sin(t * 1.65) * moving;

    const {
      leftArm, leftForeArm, rightArm, rightForeArm,
      leftUpLeg, leftLeg, rightUpLeg, rightLeg, spine
    } = this.swimBones;

    if (!this.isSwimming) {
      for (const bone of Object.values(this.swimBones)) this._poseBone(bone, new THREE.Euler(0, 0, 0), 0.18);
      return;
    }

    // Front crawl pose over a frozen idle base. This avoids the old "tilted walking" look.
    this._poseBone(spine, new THREE.Euler(-0.18, 0, 0), 0.45);
    this._poseBone(leftArm, new THREE.Euler(-1.35 + stroke * 0.85, 0.15, 0.55 + Math.cos(t) * 0.2), 0.55);
    this._poseBone(rightArm, new THREE.Euler(-1.35 + counter * 0.85, -0.15, -0.55 - Math.cos(t) * 0.2), 0.55);
    this._poseBone(leftForeArm, new THREE.Euler(-0.85 + counter * 0.45, 0, 0.12), 0.55);
    this._poseBone(rightForeArm, new THREE.Euler(-0.85 + stroke * 0.45, 0, -0.12), 0.55);
    this._poseBone(leftUpLeg, new THREE.Euler(0.18 + kick * 0.32, 0, 0.08), 0.5);
    this._poseBone(rightUpLeg, new THREE.Euler(0.18 - kick * 0.32, 0, -0.08), 0.5);
    this._poseBone(leftLeg, new THREE.Euler(-0.25 - kick * 0.32, 0, 0), 0.5);
    this._poseBone(rightLeg, new THREE.Euler(-0.25 + kick * 0.32, 0, 0), 0.5);
  }

  _poseBone(bone, offsetEuler, alpha) {
    if (!bone) return;
    const rest = this.swimRestQuaternions.get(bone.uuid);
    if (!rest) return;

    this.tmpQuat.setFromEuler(offsetEuler);
    const target = rest.clone().multiply(this.tmpQuat);
    bone.quaternion.slerp(target, alpha);
  }
}
