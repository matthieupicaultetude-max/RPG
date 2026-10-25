export class Soundscape {
 constructor(enabled=true){this.enabled=enabled;this.context=null;this.last=new Map();this.played=0;}
 unlock(){if(!this.enabled)return;try{this.context??=new(window.AudioContext||window.webkitAudioContext)();if(this.context.state==='suspended')this.context.resume().catch(()=>{});}catch{this.context=null;}}
 setEnabled(enabled){this.enabled=enabled;if(enabled)this.unlock();else if(this.context?.state==='running')this.context.suspend().catch(()=>{});}
 play(kind='hit'){
  if(!this.enabled||!this.context||this.context.state!=='running')return;
  const ctx=this.context,t=ctx.currentTime;if(t-(this.last.get(kind)??-10)<(kind==='step'?.18:.065))return;this.last.set(kind,t);this.played++;
  const settings={slash:[340,90,.12,'sawtooth',.028],magic:[740,260,.23,'sine',.05],bow:[450,130,.13,'triangle',.04],hit:[150,55,.13,'triangle',.07],hurt:[115,45,.18,'square',.025],slime:[240,75,.14,'sine',.04],defeat:[460,100,.24,'triangle',.045],heal:[420,870,.38,'sine',.055],coin:[1150,1600,.13,'sine',.045],deploy:[310,620,.22,'triangle',.04],step:[85,45,.045,'triangle',.013]};
  const [from,to,duration,type,volume]=settings[kind]||settings.hit;
  const osc=ctx.createOscillator(),gain=ctx.createGain();osc.type=type;osc.frequency.setValueAtTime(from,t);osc.frequency.exponentialRampToValueAtTime(to,t+duration);gain.gain.setValueAtTime(.001,t);gain.gain.exponentialRampToValueAtTime(volume,t+.009);gain.gain.exponentialRampToValueAtTime(.001,t+duration);osc.connect(gain).connect(ctx.destination);osc.start(t);osc.stop(t+duration+.01);osc.onended=()=>{osc.disconnect();gain.disconnect()};
 }
}
