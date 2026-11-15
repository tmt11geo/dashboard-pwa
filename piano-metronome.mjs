// Schedule against the audio clock; timer jitter does not accumulate into tempo drift.
export class Metronome {
  constructor(context, destination, timers = globalThis) {
    this.context=context; this.destination=destination; this.timers=timers;
    this.bpm=120; this.running=false; this.timer=null; this.clicks=new Set();
  }
  setTempo(bpm) {
    if (!Number.isInteger(bpm) || bpm<30 || bpm>240) return false;
    this.bpm=bpm;
    // Restart the beat grid when changing tempo so old queued clicks cannot overlap.
    if(this.running){this.stop();this.start();}
    return true;
  }
  start() {
    if(this.running) return;
    this.running=true; this.nextBeat=this.context.currentTime+.03;
    this.schedule(); this.timer=this.timers.setInterval(()=>this.schedule(),25);
  }
  schedule() {
    if(!this.running) return;
    const now=this.context.currentTime;
    if(this.nextBeat<now) this.nextBeat=now+.03; // No catch-up burst after a stall.
    while(this.nextBeat<now+.1) {
      this.click(this.nextBeat);
      this.nextBeat+=60/this.bpm;
    }
  }
  click(time) {
    const osc=this.context.createOscillator(), gain=this.context.createGain();
    osc.type='sine'; osc.frequency.value=1200;
    gain.gain.setValueAtTime(0,time);
    gain.gain.linearRampToValueAtTime(.8,time+.002);
    gain.gain.exponentialRampToValueAtTime(.0001,time+.04);
    osc.connect(gain);gain.connect(this.destination);
    const click={osc,gain};this.clicks.add(click);
    osc.onended=()=>{this.clicks.delete(click);osc.disconnect();gain.disconnect();};
    osc.start(time);osc.stop(time+.045);
  }
  stop() {
    this.running=false;
    if(this.timer!==null)this.timers.clearInterval(this.timer);
    this.timer=null;
    const now=this.context.currentTime;
    for(const {osc,gain} of this.clicks){
      gain.gain.cancelScheduledValues(now);gain.gain.setValueAtTime(0,now);osc.stop(now);
    }
    this.clicks.clear();
  }
}
