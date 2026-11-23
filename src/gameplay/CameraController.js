/**
 * CameraController — smooth third-person follow (lerp), roll tilt when turning, zoom-out as Pip grows,
 * and screen-shake offsets from effects/ScreenShake.
 */
import * as THREE from 'three';
import { CAMERA } from '../utils/Constants.js';
import { damp } from '../utils/Helpers.js';

export class CameraController {
  constructor(camera, player, shake) {
    this.camera = camera;
    this.player = player;
    this.shake = shake;
    this.look = new THREE.Vector3();
    this.pos = new THREE.Vector3();
    this.tilt = 0;
    this.zoom = 0;
    this.mode = 'follow';  // follow | boss
    this.snap();
  }

  /** Desired camera position for the current player state. */
  desired(out) {
    const p = this.player.position;
    const grow = Math.max(0, this.player.height - 2.1) * CAMERA.SIZE_ZOOM;
    this.zoom = grow;
    if (this.mode === 'boss') {
      // Side-ish dramatic angle for the boss clash.
      return out.set(p.x + 4.5, CAMERA.OFFSET_Y + 0.5 + grow * 0.6, p.z + CAMERA.OFFSET_Z * 0.75 + grow);
    }
    return out.set(p.x * CAMERA.X_FOLLOW, CAMERA.OFFSET_Y + grow * 0.7, p.z + CAMERA.OFFSET_Z + grow);
  }

  /** Jump to the target immediately (level start). */
  snap() {
    this.desired(this.pos);
    this.camera.position.copy(this.pos);
    const p = this.player.position;
    this.look.set(p.x * CAMERA.X_FOLLOW, 1.4, p.z - CAMERA.LOOK_AHEAD);
    this.camera.lookAt(this.look);
  }

  update(dt) {
    const target = this.desired(this._tmp || (this._tmp = new THREE.Vector3()));
    const k = 1 - Math.exp(-CAMERA.FOLLOW_LERP * dt);
    this.pos.lerp(target, k);
    // Z follows tightly so the player never drifts out of frame at high speed.
    this.pos.z = damp(this.pos.z, target.z, CAMERA.FOLLOW_LERP * 2.5, dt);

    const p = this.player.position;
    const lookTarget = this._look || (this._look = new THREE.Vector3());
    lookTarget.set(p.x * (this.mode === 'boss' ? 1 : CAMERA.X_FOLLOW), 1.2 + this.zoom * 0.35, p.z - (this.mode === 'boss' ? 2 : CAMERA.LOOK_AHEAD));
    this.look.lerp(lookTarget, k);

    const off = this.shake.offset(dt);
    this.camera.position.set(this.pos.x + off.x, this.pos.y + off.y, this.pos.z);
    this.camera.lookAt(this.look);

    // Roll tilt proportional to lateral speed (clamped), smoothed.
    const tiltTarget = THREE.MathUtils.clamp(-this.player.lean * 0.012, -CAMERA.TILT_MAX, CAMERA.TILT_MAX);
    this.tilt = damp(this.tilt, tiltTarget, CAMERA.TILT_LERP, dt);
    this.camera.rotation.z += this.tilt + off.roll;
  }
}
