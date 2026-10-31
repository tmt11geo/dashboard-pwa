import {MAX_SAMPLES} from './motion-path.mjs?v=1';
// WebXR local-space poses, in metres. No accelerometer integration or fake poses.
export class MotionTrail {
  constructor(limit = MAX_SAMPLES) { this.limit = limit; this.reset(); }
  reset() { this.origin = null; this.latest = null; this.buffer = new Array(this.limit); this.count = 0; this.offset = 0; this.snapshot = null; this.dropped = 0; this.segment = 0; this.lastTime = -Infinity; this.lost = true; }
  get samples() {
    if(!this.snapshot)this.snapshot=Array.from({length:this.count},(_,i)=>this.buffer[(this.offset+i)%this.limit]);
    return this.snapshot;
  }
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
      this.buffer[(this.offset+this.count)%this.limit]=this.latest;
      if(this.count<this.limit)this.count++;else{this.offset=(this.offset+1)%this.limit;this.dropped++;}
      this.snapshot=null;this.lastTime=time;
    }
    return this.latest;
  }
}
