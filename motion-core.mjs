// WebXR local-space poses, in metres. No accelerometer integration or fake poses.
export class MotionTrail {
  constructor(limit = 3000) { this.limit = limit; this.reset(); }
  reset() { this.origin = null; this.latest = null; this.samples = []; this.segment = 0; this.lastTime = -Infinity; this.lost = true; }
  gap() { if (!this.lost) this.segment++; this.lost = true; this.latest = null; }
  add(time, pose) {
    const p = pose?.transform?.position, q = pose?.transform?.orientation;
    if (pose?.emulatedPosition || !p || !q || ![time,p.x,p.y,p.z,q.x,q.y,q.z,q.w].every(Number.isFinite)) {
      this.gap(); return null;
    }
    if (!this.origin) this.origin = {x:p.x,y:p.y,z:p.z};
    this.latest = {t:time, x:p.x-this.origin.x, y:p.y-this.origin.y, z:p.z-this.origin.z,
      q:[q.x,q.y,q.z,q.w], segment:this.segment};
    this.lost = false;
    if (time-this.lastTime >= 100) {
      this.samples.push(this.latest); this.lastTime=time;
      if (this.samples.length > this.limit) this.samples.shift();
    }
    return this.latest;
  }
}
