import {MAX_SAMPLES,jumpInfo} from './motion-path.mjs?v=2';
// WebXR local-space poses, in metres. No accelerometer integration or fake poses.
export class MotionTrail {
  constructor(limit = MAX_SAMPLES, sampleHz = 30) { this.limit = limit; this.setSampleRate(sampleHz); this.reset(); }
  setSampleRate(hz) {
    if (![10,20,30,0].includes(hz)) throw new RangeError("Unsupported sampling rate");
    this.sampleHz=hz; this.interval=hz ? 1000/hz : 0; this.nextTime=-Infinity; this.rateTimes=[];
  }
  get actualHz() {
    const ts=this.rateTimes; return ts.length>1 ? (ts.length-1)*1000/(ts.at(-1)-ts[0]) : null;
  }
  reset() { this.origin = null; this.latest = null; this.buffer = new Array(this.limit); this.count = 0; this.offset = 0; this.snapshot = null; this.dropped = 0; this.segment = 0; this.lastTime = -Infinity; this.nextTime = -Infinity; this.rateTimes = []; this.lost = true; this.quality={jumps:0,gaps:0}; this.pendingBreak=null; }
  get samples() {
    if(!this.snapshot)this.snapshot=Array.from({length:this.count},(_,i)=>this.buffer[(this.offset+i)%this.limit]);
    return this.snapshot;
  }
  gap() { if (!this.lost) { this.segment++; this.quality.gaps++; this.pendingBreak='tracking-gap'; } this.lost = true; this.latest = null; this.nextTime=-Infinity; this.rateTimes=[]; }
  add(time, pose) {
    const p = pose?.transform?.position, q = pose?.transform?.orientation;
    if (pose?.emulatedPosition || !p || !q || ![time,p.x,p.y,p.z,q.x,q.y,q.z,q.w].every(Number.isFinite)) {
      this.gap(); return null;
    }
    if (time <= this.lastTime) return this.latest;
    if (this.latest && time-this.latest.t>500) this.gap();
    if (!this.origin) this.origin = {x:p.x,y:p.y,z:p.z};
    const previous=this.latest;
    this.latest = {t:time, x:p.x-this.origin.x, y:p.y-this.origin.y, z:p.z-this.origin.z,
      q:[q.x,q.y,q.z,q.w], segment:this.segment};
    const jump=jumpInfo(previous,this.latest);
    if(jump){ this.segment++; this.quality.jumps++; this.pendingBreak='position-jump'; this.nextTime=-Infinity; this.rateTimes=[]; this.latest.segment=this.segment; }
    this.lost = false;
    if (time+1e-6 >= this.nextTime) {
      // Keep phase across frame jitter; never synthesize missed samples.
      if (this.interval) {
        if (!Number.isFinite(this.nextTime)) this.nextTime=time;
        this.nextTime += (Math.floor(Math.max(0,time-this.nextTime+1e-6)/this.interval)+1)*this.interval;
      }
      this.rateTimes=this.rateTimes.filter(t=>time-t<=2000); this.rateTimes.push(time);
      if(this.pendingBreak){this.latest.breakReason=this.pendingBreak;this.pendingBreak=null;}
      this.buffer[(this.offset+this.count)%this.limit]=this.latest;
      if(this.count<this.limit)this.count++;else{this.offset=(this.offset+1)%this.limit;this.dropped++;}
      this.snapshot=null;this.lastTime=time;
    }
    return this.latest;
  }
}
