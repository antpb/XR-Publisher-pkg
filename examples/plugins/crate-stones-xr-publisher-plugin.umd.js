(function(N){typeof define=="function"&&define.amd?define(N):N()})((function(){"use strict";let N=1;function p(n,e,t,a){return{id:N++,kind:n,inputs:e,params:t,list:a}}function P(n){return p("const",{},{value:n})}function s(n){return n instanceof c?n.node:P(n)}class c{constructor(e){this.node=e}mul(e){return new c(p("mul",{a:this.node,b:s(e)},{}))}add(e){return new c(p("add",{a:this.node,b:s(e)},{}))}toFrequency(){return new c(p("toFrequency",{note:this.node},{}))}range(e,t){return new c(p("range",{source:this.node},{min:e,max:t}))}trigger(e){if(this.node.kind!=="adsr"&&this.node.kind!=="dahdsr")throw new TypeError(".trigger() is only valid on an env.adsr() or env.dahdsr() node.");return new c(p(this.node.kind,{...this.node.inputs,trigger:s(e)},this.node.params))}}class B extends Error{constructor(e){super(`AudioMaterial "${e}".noteOn requires bind(renderer) first.`),this.name="AudioMaterialNotBoundError"}}function F(n){return new c(p("param",{},{name:n}))}const M="input",z={input(n=M){return new c(p("port",{},{name:n}))},left(n=M){return new c(p("port",{},{name:n,channel:0}))},right(n=M){return new c(p("port",{},{name:n,channel:1}))},sidechain(){return new c(p("port",{},{name:"sidechain"}))},lane(){return new c(p("lane",{},{}))}};function x(n){const e=n.shape??"sine",t=typeof e=="string"?e:"sine",a=typeof e=="string"?void 0:s(e);return new c(p("lfo",{rate:s(n.rate),...n.width!==void 0?{width:s(n.width)}:{},...a?{type:a}:{}},{shape:t}))}function I(...n){return new c(p("mix",{},{},n.map(s)))}const te={adsr(n={}){const e=["a","d","s","r","attack","decay","sustain","release"],t=Object.keys(n).filter(o=>!e.includes(o));if(t.length>0)throw new Error(`env.adsr: unknown option${t.length>1?"s":""} ${t.map(o=>`"${o}"`).join(", ")}. Expected any of ${e.join(", ")}.`);const a=(o,r,l,u)=>{const h=o??r??l;if(typeof h!="number"||!Number.isFinite(h))throw new Error(`env.adsr: ${u} must be a finite number, got ${String(h)}.`);return h};return new c(p("adsr",{trigger:P(0)},{a:a(n.a,n.attack,.005,"attack"),d:a(n.d,n.decay,.1,"decay"),s:a(n.s,n.sustain,.7,"sustain"),r:a(n.r,n.release,.2,"release")}))},dahdsr(n={}){const e={trigger:P(1),delay:s(n.delay??0),attack:s(n.attack??.005),hold:s(n.hold??0),decay:s(n.decay??.1),sustain:s(n.sustain??.7),release:s(n.release??.2)};return n.gate!==void 0&&(e.gate=s(n.gate)),new c(p("dahdsr",e,{}))},breakpoints(n){const e={};if(n.gate!==void 0&&(e.gate=s(n.gate)),n.times.every(r=>typeof r=="number")&&n.levels.every(r=>typeof r=="number"))return new c(p("breakpoints",e,{times:n.times,levels:n.levels}));const a=[],o=Math.min(n.times.length,n.levels.length);for(let r=0;r<o;r++)a.push(s(n.times[r])),a.push(s(n.levels[r]));return new c(p("breakpoints",e,{times:[0,1],levels:[0,1]},a))}},_={lowpass(n,e){return new c(p("filterLowpass",{input:s(n),cutoff:s(e.cutoff),q:s(e.q??.707)},{}))},peaking(n,e){return new c(p("filterPeaking",{input:s(n),freq:s(e.freq),gainDb:s(e.gainDb),q:s(e.q??1)},{}))},lowshelf(n,e){return new c(p("filterLowShelf",{input:s(n),freq:s(e.freq),gainDb:s(e.gainDb),q:s(e.q??.707)},{}))},highshelf(n,e){return new c(p("filterHighShelf",{input:s(n),freq:s(e.freq),gainDb:s(e.gainDb),q:s(e.q??.707)},{}))},highpass(n,e){return new c(p("filterHighpass",{input:s(n),cutoff:s(e.cutoff),q:s(e.q??.707)},{}))},bandpass(n,e){return new c(p("filterBandpass",{input:s(n),cutoff:s(e.cutoff),q:s(e.q??1)},{}))},notch(n,e){return new c(p("filterNotch",{input:s(n),cutoff:s(e.cutoff),q:s(e.q??1)},{}))},allpass(n,e){return new c(p("filterAllpass",{input:s(n),cutoff:s(e.cutoff),q:s(e.q??.707)},{}))},onePoleLowpass(n,e){return new c(p("onePoleLowpass",{input:s(n),cutoff:s(e.cutoff)},{}))},onePoleHighpass(n,e){return new c(p("onePoleHighpass",{input:s(n),cutoff:s(e.cutoff)},{}))},svf(n,e){return new c(p("svf",{input:s(n),cutoff:s(e.cutoff),q:s(e.q??.5)},{mode:e.mode??"lowpass"}))},ladder(n,e){return new c(p("ladder",{input:s(n),cutoff:s(e.cutoff),resonance:s(e.resonance??0)},{}))},comb(n,e){return new c(p("comb",{input:s(n),freq:s(e.freq),feedback:s(e.feedback??.5),mix:s(e.mix??.5)},{}))},slope(n,e){return new c(p("filterSlope",{input:s(n),cutoff:s(e.cutoff)},{poles:e.poles??2,mode:e.mode??"lowpass"}))}};function ae(n,e={}){return new c(p("clip",{input:s(n),drive:s(e.drive??1)},{mode:e.mode??"soft"}))}function L(n,e={}){return new c(p("sampleHold",{input:s(n),freq:s(e.freq??20)},{}))}function se(n={}){return new c(p("impulse",n.gate===void 0?{}:{gate:s(n.gate)},{}))}function oe(n={}){const e=new Map;return{proxy:new Proxy({},{get(a,o){if(typeof o!="string")return;if(Object.prototype.hasOwnProperty.call(n,o))return n[o];let r=e.get(o);return r||(r=o===M?z.input():F(o),e.set(o,r)),r}}),used:e}}function O(n,e,t){if(!t.has(n.id)){t.add(n.id),n.kind==="port"&&e.add(n.params.name);for(const a of Object.values(n.inputs))O(a,e,t);for(const a of n.list??[])O(a,e,t)}}function D(n){const e=new Set;return O(n.output,e,new Set),[...e].sort()}function U(n){return D(n).filter(e=>e!==M)}function re(n,e,t){if(n.length===0)throw new RangeError("allocateSlot: polyphony is 0");const a=n.find(l=>l.held&&l.note===e);if(a)return a.index;const o=n.find(l=>l.note===null);if(o)return o.index;const r=n.filter(l=>l.note!==null&&!l.held);return r.length>0?$(r).index:ie(n.filter(l=>l.held),t).index}function $(n){return n.reduce((e,t)=>e.startedAt<=t.startedAt?e:t)}function ie(n,e){if(n.length===0)throw new RangeError("allocateSlot: no stealable voice");return typeof e=="function"?[...n].sort(e)[0]:e==="quietest"?n.reduce((t,a)=>t.velocity!==a.velocity?t.velocity<a.velocity?t:a:t.startedAt<=a.startedAt?t:a):$(n)}class H{constructor(e,t,a="oldest"){if(this.material=e,t.length===0)throw new RangeError("VoicePool: need at least one voice");this.policy=a,this.slots=t.map((o,r)=>({index:r,voice:o,note:null,velocity:0,startedAt:0,held:!1}))}slots;clock=0;policy;noteOn(e,t={}){const a=t.velocity??1,o=re(this.slots,e,this.policy),r=this.slots[o];r.note!==null&&r.voice.noteOff(),r.note=e,r.velocity=a,r.held=!0,r.startedAt=++this.clock,r.voice.noteOn({...this.material.snapshotParams(),...t,note:e,velocity:a})}noteOff(e){for(const t of this.slots)if(!(!t.held||t.note!==e)){t.held=!1,t.voice.noteOff();return}}allNotesOff(){for(const e of this.slots)e.note!==null&&(e.held=!1,e.note=null,e.velocity=0,e.voice.noteOff())}setParam(e,t){for(const a of this.slots)a.voice.setParam(e,t)}snapshots(){return this.slots.map(({index:e,note:t,velocity:a,startedAt:o,held:r})=>({index:e,note:t,velocity:a,startedAt:o,held:r}))}}const w={range(n,e,t){if(!(n<e))throw new RangeError(`param.range: min (${n}) must be less than max (${e})`);if(t.default<n||t.default>e)throw new RangeError(`param.range: default (${t.default}) must be within [${n}, ${e}]`);return V("param.range",n,t.curve),{kind:"range",min:n,max:e,default:t.default,...t.unit!==void 0?{unit:t.unit}:{},...t.address!==void 0?{address:t.address}:{},...t.label!==void 0?{label:t.label}:{},...t.curve!==void 0&&t.curve!=="linear"?{curve:t.curve}:{}}},stepped(n,e,t){if(!(n<e))throw new RangeError(`param.stepped: min (${n}) must be less than max (${e})`);if(!(t.step>0))throw new RangeError(`param.stepped: step (${t.step}) must be positive`);const a=(e-n)/t.step;if(Math.abs(a-Math.round(a))>1e-9)throw new RangeError(`param.stepped: step (${t.step}) does not divide the span [${n}, ${e}]`);if(t.default<n||t.default>e)throw new RangeError(`param.stepped: default (${t.default}) must be within [${n}, ${e}]`);const o=(t.default-n)/t.step;if(Math.abs(o-Math.round(o))>1e-9)throw new RangeError(`param.stepped: default (${t.default}) is not on the step grid from ${n}`);return V("param.stepped",n,t.curve),{kind:"stepped",min:n,max:e,step:t.step,default:t.default,...t.unit!==void 0?{unit:t.unit}:{},...t.address!==void 0?{address:t.address}:{},...t.label!==void 0?{label:t.label}:{},...t.curve!==void 0&&t.curve!=="linear"?{curve:t.curve}:{}}},enum(n,e){if(n.length<2)throw new RangeError(`param.enum: needs at least two options, got ${n.length}`);if(new Set(n).size!==n.length)throw new RangeError(`param.enum: options must be unique (${n.join(", ")})`);const t=n.indexOf(e.default);if(t===-1)throw new RangeError(`param.enum: default "${e.default}" is not one of ${n.join(", ")}`);return{kind:"enum",options:[...n],min:0,max:n.length-1,step:1,default:t,...e.address!==void 0?{address:e.address}:{},...e.label!==void 0?{label:e.label}:{}}},toggle(n){return{kind:"toggle",min:0,max:1,step:1,default:n.default?1:0,labels:n.labels??["Off","On"],...n.address!==void 0?{address:n.address}:{},...n.label!==void 0?{label:n.label}:{}}}};function V(n,e,t){if(t==="log"&&e<=0)throw new RangeError(`${n}: a 'log' curve needs a positive minimum (got ${e}). Use 'exp' for a range that includes zero.`)}function q(n,e){if(n.step===void 0)return e;const t=n.min+Math.round((e-n.min)/n.step)*n.step;return Math.min(n.max,Math.max(n.min,le(t,n.step)))}function le(n,e){const t=W(e);return t===0?Math.round(n):Number(n.toFixed(t))}function W(n){if(Number.isInteger(n))return 0;const e=String(n),t=e.indexOf(".");return t===-1?0:Math.min(9,e.length-t-1)}function me(n,e){switch(n.kind){case"enum":{const t=Math.round(q(n,e));return n.options[t]??String(t)}case"toggle":return n.labels[e>=.5?1:0];case"stepped":return K(j(q(n,e),W(n.step)),n.unit);case"range":return K(j(e,ce(n)),n.unit)}}function ce(n){const e=n.max-n.min;return e>=100?0:e>=10?1:2}function j(n,e){const t=n.toFixed(e);return e===0?t:t.replace(/\.?0+$/,"")}function K(n,e){return e?`${n} ${e}`:n}function pe(n,e){const t=n.options.indexOf(e);if(t===-1)throw new RangeError(`param option "${e}" is not one of ${n.options.join(", ")}`);return t}class S{name;kind;params;automatable;polyphony;voiceStealing;cvPolarity;graph;hostedSlot;assetMap=new Map;audioSourceMap=new Map;paramValues;graphBuilder;channelCount;pool=null;constructor(e){if(this.name=e.name,this.kind=e.kind??e.name,this.params=e.params??{},this.automatable=e.automatable??[],this.polyphony=e.polyphony??1,this.polyphony<1)throw new RangeError(`AudioMaterial "${this.name}": polyphony must be >= 1`);this.voiceStealing=e.voiceStealing??"oldest",this.cvPolarity=e.cvPolarity??"bipolar";for(const r of this.automatable)if(!(r in this.params))throw new RangeError(`AudioMaterial "${this.name}": automatable references unknown param "${r}"`);this.paramValues=Object.fromEntries(Object.entries(this.params).map(([r,l])=>[r,l.default])),this.graphBuilder=e.graph,this.channelCount=e.channels;const t=Object.fromEntries(Object.keys(this.params).map(r=>[r,F(r)])),{proxy:a}=oe({params:t,audio:z}),o=e.graph(a);if(!(o instanceof c))throw new TypeError(`AudioMaterial "${this.name}": graph builder must return an ASLValue.`);this.graph={inputs:Object.keys(this.params),output:o.node,channels:e.channels}}get audioInputs(){return D(this.graph)}get auxAudioInputs(){return U(this.graph)}setAudioSource(e,t){if(!this.auxAudioInputs.includes(e))throw new RangeError(`AudioMaterial "${this.name}" has no audio input "${e}" (has: ${this.auxAudioInputs.join(", ")||"none besides input"})`);t?this.audioSourceMap.set(e,t):this.audioSourceMap.delete(e)}get audioSources(){return this.audioSourceMap}setAsset(e,t){this.assetMap.set(e,t)}getAsset(e){return this.assetMap.get(e)}hasAsset(e){return this.assetMap.has(e)}clearAsset(e){return this.assetMap.delete(e)}get assetKeys(){return[...this.assetMap.keys()]}getParam(e){if(!(e in this.params))throw new RangeError(`AudioMaterial "${this.name}" has no param "${e}"`);return this.paramValues[e]}setParam(e,t){const a=this.params[e];if(!a)throw new RangeError(`AudioMaterial "${this.name}" has no param "${e}"`);if(t<a.min||t>a.max)throw new RangeError(`AudioMaterial "${this.name}".${e} must be within [${a.min}, ${a.max}], got ${t}`);const o=q(a,t);this.paramValues[e]=o,this.pool?.setParam(e,o)}setOption(e,t){const a=this.params[e];if(!a)throw new RangeError(`AudioMaterial "${this.name}" has no param "${e}"`);if(a.kind!=="enum")throw new TypeError(`AudioMaterial "${this.name}".${e} is a ${a.kind} param, not an enum`);this.setParam(e,pe(a,t))}getOption(e){const t=this.params[e];if(!t)throw new RangeError(`AudioMaterial "${this.name}" has no param "${e}"`);if(t.kind!=="enum")throw new TypeError(`AudioMaterial "${this.name}".${e} is a ${t.kind} param, not an enum`);return t.options[Math.round(this.paramValues[e])]??""}formatParam(e){const t=this.params[e];if(!t)throw new RangeError(`AudioMaterial "${this.name}" has no param "${e}"`);return me(t,this.paramValues[e])}async bind(e,t){this.unbind();const a=[];for(let o=0;o<this.polyphony;o++){const r=await e.createVoice(this.graph);t&&r.node.connect(t),a.push(r)}this.pool=new H(this,a,this.voiceStealing??"oldest")}attachVoices(e){this.unbind(),this.pool=new H(this,e,this.voiceStealing??"oldest")}unbind(){this.pool?.allNotesOff(),this.pool=null}get isBound(){return this.pool!==null}noteOn(e,t){if(!this.pool)throw new B(this.name);this.pool.noteOn(e,t)}noteOff(e){if(!this.pool)throw new B(this.name);this.pool.noteOff(e)}allNotesOff(){this.pool?.allNotesOff()}get voices(){return this.pool?.snapshots()??[]}snapshotParams(){return{...this.paramValues}}duplicate(){const e=new S({name:this.name,kind:this.kind,params:this.params,automatable:this.automatable,polyphony:this.polyphony,voiceStealing:this.voiceStealing,graph:this.graphBuilder,channels:this.channelCount,cvPolarity:this.cvPolarity});for(const[t,a]of Object.entries(this.snapshotParams()))e.setParam(t,a);return e}}const de=`// src/asl/controlMath.ts
var QUANTIZE_SCALES = [
  [0, 2, 4, 5, 7, 9, 11],
  [0, 2, 3, 5, 7, 8, 10],
  [0, 2, 4, 7, 9],
  [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11],
  [0, 2, 4, 6, 8, 10]
];
function quantizeToScale(note, root, scaleIndex) {
  const degrees = QUANTIZE_SCALES[Math.min(Math.max(Math.round(scaleIndex), 0), QUANTIZE_SCALES.length - 1)];
  const shifted = note - root;
  const octave = Math.floor(shifted / 12);
  const pc = shifted - octave * 12;
  let bestDeg = degrees[0] ?? 0;
  let bestDist = Infinity;
  for (const degree of degrees) {
    for (const candidate of [degree, degree - 12, degree + 12]) {
      const dist = Math.abs(candidate - pc);
      if (dist < bestDist - 1e-12) {
        bestDist = dist;
        bestDeg = candidate;
      }
    }
  }
  return root + octave * 12 + bestDeg;
}
function euclideanPattern(steps, hits, rotation) {
  const n = Math.max(1, Math.floor(steps));
  const k = Math.min(n, Math.max(0, Math.floor(hits)));
  const pattern = [];
  let acc = 0;
  for (let i = 0; i < n; i++) {
    acc += k;
    if (acc >= n) {
      acc -= n;
      pattern.push(true);
    } else {
      pattern.push(false);
    }
  }
  const rot = (Math.floor(rotation) % n + n) % n;
  if (rot === 0) return pattern;
  return pattern.slice(rot).concat(pattern.slice(0, rot));
}

// src/asl/transportNodes.ts
var SYNC_DIVISIONS = {
  "4/1": 16,
  "2/1": 8,
  "1/1": 4,
  "1/2": 2,
  "1/2.": 3,
  "1/2T": 4 / 3,
  "1/4": 1,
  "1/4.": 1.5,
  "1/4T": 2 / 3,
  "1/8": 0.5,
  "1/8.": 0.75,
  "1/8T": 1 / 3,
  "1/16": 0.25,
  "1/16.": 0.375,
  "1/16T": 1 / 6,
  "1/32": 0.125
};
var SYNC_DIVISION_NAMES = Object.keys(SYNC_DIVISIONS);
var SYNC_DIVISION_BEATS = SYNC_DIVISION_NAMES.map((name) => SYNC_DIVISIONS[name]);
var COMMON_DIVISION_NAMES = [
  "1/1",
  "1/2",
  "1/2.",
  "1/4",
  "1/4.",
  "1/4T",
  "1/8",
  "1/8.",
  "1/8T",
  "1/16",
  "1/16T"
];
var COMMON_DIVISION_BEATS = COMMON_DIVISION_NAMES.map((name) => SYNC_DIVISIONS[name]);
function normalizeBeatUnit(beatUnit) {
  return beatUnit && beatUnit > 0 ? beatUnit : 4;
}
function signatureBeatBeats(beatUnit) {
  return 4 / normalizeBeatUnit(beatUnit);
}
function barBeats(beatsPerBar, beatUnit) {
  const perBar = beatsPerBar && beatsPerBar > 0 ? beatsPerBar : 4;
  return perBar * signatureBeatBeats(beatUnit);
}
var DEFAULT_TRANSPORT = {
  beats: 0,
  bpm: 120,
  playing: false,
  beatsPerBar: 4,
  beatUnit: 4
};
var DEFAULT_TRANSPORT_ANCHOR = {
  atTime: 0,
  beats: 0,
  bpm: 120,
  playing: false,
  beatsPerBar: 4,
  beatUnit: 4
};
function transportAt(anchor, time) {
  let from = anchor;
  if (anchor.playing && anchor.changes) {
    for (const segment of anchor.changes) {
      if (segment.atTime <= time) from = segment;
      else break;
    }
  }
  const elapsed = anchor.playing ? Math.max(0, time - from.atTime) : 0;
  const slope = from.slope ?? 0;
  if (slope === 0) {
    return {
      beats: from.beats + elapsed * from.bpm / 60,
      bpm: from.bpm,
      playing: anchor.playing,
      beatsPerBar: anchor.beatsPerBar,
      beatUnit: normalizeBeatUnit(anchor.beatUnit)
    };
  }
  const bpm = from.bpm * Math.exp(slope * elapsed / 60);
  return {
    beats: from.beats + (bpm - from.bpm) / slope,
    bpm,
    playing: anchor.playing,
    beatsPerBar: anchor.beatsPerBar,
    beatUnit: normalizeBeatUnit(anchor.beatUnit)
  };
}
function advanceTransport(snapshot, samples, sampleRate2) {
  if (samples === 0 || !snapshot.playing || sampleRate2 <= 0) return snapshot;
  return { ...snapshot, beats: snapshot.beats + samples * snapshot.bpm / 60 / sampleRate2 };
}

// src/asl/builders.ts
var MAIN_PORT = "input";

// src/asl/ports.ts
function walk(node, into, seen) {
  if (seen.has(node.id)) return;
  seen.add(node.id);
  if (node.kind === "port") into.add(node.params.name);
  for (const child of Object.values(node.inputs)) walk(child, into, seen);
  for (const child of node.list ?? []) walk(child, into, seen);
}
function audioPortNames(graph) {
  const names = /* @__PURE__ */ new Set();
  walk(graph.output, names, /* @__PURE__ */ new Set());
  return [...names].sort();
}
function auxAudioPorts(graph) {
  return audioPortNames(graph).filter((name) => name !== MAIN_PORT);
}

// src/asl/compile.ts
function newBiquad() {
  return {
    x1: 0,
    x2: 0,
    y1: 0,
    y2: 0,
    k0: NaN,
    k1: NaN,
    k2: NaN,
    k3: NaN,
    n0: 0,
    n1: 0,
    n2: 0,
    d1: 0,
    d2: 0
  };
}
var EMPTY_TABLE = new Float32Array(0);
var EMPTY_NUMBERS = [];
function emptyInputs() {
  return {
    input: void 0,
    a: void 0,
    b: void 0,
    attack: void 0,
    bits: void 0,
    clock: void 0,
    cutoff: void 0,
    decay: void 0,
    delay: void 0,
    drive: void 0,
    duration: void 0,
    factor: void 0,
    fall: void 0,
    feedback: void 0,
    freq: void 0,
    gainDb: void 0,
    gate: void 0,
    hits: void 0,
    hold: void 0,
    index: void 0,
    length: void 0,
    mix: void 0,
    note: void 0,
    pan: void 0,
    pitch: void 0,
    position: void 0,
    q: void 0,
    rate: void 0,
    ratio: void 0,
    record: void 0,
    release: void 0,
    resonance: void 0,
    rise: void 0,
    root: void 0,
    rotation: void 0,
    scale: void 0,
    sidechain: void 0,
    source: void 0,
    steps: void 0,
    sustain: void 0,
    threshold: void 0,
    timeSec: void 0,
    trigger: void 0,
    which: void 0,
    width: void 0,
    widthSec: void 0,
    windowSec: void 0,
    type: void 0,
    color: void 0
  };
}
var SHAPE_SINE = 0;
var SHAPE_SAW = 1;
var SHAPE_SQUARE = 2;
var SHAPE_TRIANGLE = 3;
var SHAPE_PULSE = 4;
var SHAPE_VARSHAPE = 5;
var SHAPE_SUPERSQUARE = 6;
var SHAPE_HARMONIC = 7;
function planMode(node) {
  const p = node.params;
  switch (node.kind) {
    case "osc":
    case "lfo": {
      const shape = node.kind === "osc" ? p.type : p.shape;
      if (shape === "saw") return SHAPE_SAW;
      if (shape === "square") return SHAPE_SQUARE;
      if (shape === "triangle") return SHAPE_TRIANGLE;
      if (shape === "pulse") return SHAPE_PULSE;
      if (shape === "varshape") return SHAPE_VARSHAPE;
      if (shape === "supersquare") return SHAPE_SUPERSQUARE;
      if (shape === "harmonic") return SHAPE_HARMONIC;
      return SHAPE_SINE;
    }
    case "clip":
      return p.mode === "hard" ? 1 : 0;
    case "rectify":
      return p.mode === "half" ? 1 : 0;
    case "compare":
      return p.mode === "lt" ? 1 : 0;
    case "svf": {
      const mode = p.mode ?? "lowpass";
      return mode === "highpass" ? 1 : mode === "bandpass" ? 2 : 0;
    }
    case "logic": {
      const mode = p.mode ?? "and";
      return mode === "or" ? 1 : mode === "xor" ? 2 : mode === "not" ? 3 : 0;
    }
    case "filterSlope":
      return (p.mode ?? "lowpass") === "highpass" ? 1 : 0;
    case "noise": {
      const color = p.color ?? "white";
      if (color === "pink") return 1;
      if (color === "brown") return 2;
      if (color === "blue") return 3;
      if (color === "violet") return 4;
      if (color === "grey") return 5;
      return 0;
    }
    case "panLaw":
      return (p.channel ?? "left") === "right" ? 1 : 0;
    case "random":
      return p.mode === "smooth" ? 1 : 0;
    case "transport": {
      const field = p.field;
      if (field === "bars") return 1;
      if (field === "bpm") return 2;
      if (field === "playing") return 3;
      if (field === "phase") return 4;
      if (field === "pulse") return 5;
      if (field === "seconds") return 6;
      if (field === "division") return 7;
      if (field === "beatsPerBar") return 8;
      if (field === "beatUnit") return 9;
      return 0;
    }
    case "kernel":
      if (p.mode !== "source") return 0;
      return p.fallback === "silence" ? 2 : 1;
    case "port":
      return p.channel ?? -1;
    case "pitchShift":
      return p.unit === "st" ? 1 : 0;
    case "pitch": {
      const field = p.field;
      if (field === "midi") return 1;
      if (field === "cents") return 2;
      if (field === "gate") return 3;
      return 0;
    }
    case "looper": {
      const field = p.field;
      if (field === "start") return 1;
      if (field === "end") return 2;
      return 0;
    }
    default:
      return 0;
  }
}
function planConst(node) {
  const p = node.params;
  switch (node.kind) {
    case "capture":
      return p.windowSize;
    case "delay":
      return p.maxTimeSec;
    case "reverse":
      return p.maxTimeSec ?? 2;
    case "looper":
      return p.maxTimeSec ?? 4;
    case "filterSlope":
      return Math.min(4, Math.max(1, Math.round(p.poles ?? 2)));
    case "const":
      return p.value;
    case "wavetable":
      return p.frameSize ?? 0;
    default:
      return 0;
  }
}
function planTable(node) {
  if (node.kind !== "wavetable" && node.kind !== "samplePlay" && node.kind !== "grain") {
    return EMPTY_TABLE;
  }
  const box = node.params.box;
  if (box?.samples?.length) return box.samples;
  const table = node.params.table;
  if (table instanceof Float32Array) return table;
  if (Array.isArray(table) && table.length > 0) return Float32Array.from(table);
  return EMPTY_TABLE;
}
function planNames(node) {
  const p = node.params;
  if (node.kind === "kernel") return { name: "", slot: p.slot };
  if (node.kind === "meter" || node.kind === "capture") return { name: p.id, slot: "" };
  if (node.kind === "param" || node.kind === "port") return { name: p.name, slot: "" };
  return { name: "", slot: "" };
}
function buildPlan(root) {
  const bySourceId = /* @__PURE__ */ new Map();
  const seams = [];
  const tapIds = /* @__PURE__ */ new Set();
  let count = 0;
  let usesLane = false;
  let readsScalarInput = false;
  let usesRandom = false;
  function visit(node) {
    const existing = bySourceId.get(node.id);
    if (existing) return existing;
    const { name, slot } = planNames(node);
    const inputs = emptyInputs();
    const plan = {
      i: count++,
      kind: node.kind,
      params: node.params,
      inputs,
      list: null,
      m: planMode(node),
      c: planConst(node),
      table: planTable(node),
      a: node.kind === "waveshape" ? node.params.curve ?? [-1, 0, 1] : node.kind === "breakpoints" ? node.params.times ?? [0, 1] : node.kind === "transport" ? node.params.divisions ?? EMPTY_NUMBERS : EMPTY_NUMBERS,
      b: node.kind === "breakpoints" ? node.params.levels ?? [0, 1] : EMPTY_NUMBERS,
      name,
      slot,
      rangeMin: node.kind === "range" ? node.params.min : 0,
      rangeMax: node.kind === "range" ? node.params.max : 0
    };
    bySourceId.set(node.id, plan);
    if (node.kind === "lane") usesLane = true;
    if (node.kind === "port" && node.params.channel !== void 0) usesLane = true;
    if (node.kind === "param" && name === MAIN_PORT) readsScalarInput = true;
    if (node.kind === "meter" || node.kind === "capture") tapIds.add(name);
    if (node.kind === "kernel" && node.params.mode === "seam") seams.push(plan);
    if (node.kind === "noise" || node.kind === "random") usesRandom = true;
    for (const key of Object.keys(node.inputs)) inputs[key] = visit(node.inputs[key]);
    const list = node.list;
    if (list) {
      const planned2 = [];
      for (const child of list) planned2.push(visit(child));
      plan.list = planned2;
    }
    return plan;
  }
  const planned = visit(root);
  return {
    root: planned,
    count,
    seams,
    tapIds: [...tapIds].sort(),
    usesLane,
    readsScalarInput,
    usesRandom
  };
}
function oscillatorSample(shape, phase, width = 0.5, freq = 0, sampleRate2 = 1) {
  switch (shape) {
    case SHAPE_SAW:
      return 2 * phase - 1;
    case SHAPE_SQUARE:
      return phase < 0.5 ? 1 : -1;
    case SHAPE_TRIANGLE:
      return phase < 0.5 ? 4 * phase - 1 : 3 - 4 * phase;
    case SHAPE_PULSE: {
      const duty = Math.min(Math.max(width, 1e-4), 1 - 1e-4);
      return phase < duty ? 1 : -1;
    }
    case SHAPE_VARSHAPE:
      return varShapeSample(phase, width);
    case SHAPE_HARMONIC:
      return harmonicSample(phase, width, freq, sampleRate2);
    default:
      return Math.sin(2 * Math.PI * phase);
  }
}
function varShapeSample(phase, shapeMod) {
  const t = shapeMod < 0 ? 0 : shapeMod > 1 ? 1 : shapeMod;
  const tri = phase < 0.5 ? 4 * phase - 1 : 3 - 4 * phase;
  const saw = 2 * phase - 1;
  const square = phase < 0.5 ? 1 : -1;
  if (t < 0.5) {
    const mix2 = t * 2;
    return tri * (1 - mix2) + saw * mix2;
  }
  const mix = (t - 0.5) * 2;
  return saw * (1 - mix) + square * mix;
}
function harmonicSample(phase, tilt, freq, sampleRate2) {
  const freqNorm = freq / sampleRate2;
  let maxHarm = Math.min(16, Math.floor(0.5 / Math.max(freqNorm, 1e-9)));
  if (maxHarm < 1) maxHarm = 1;
  const exponent = 2 * (1 - (tilt < 0 ? 0 : tilt > 1 ? 1 : tilt));
  let norm = 0;
  let sample = 0;
  for (let h = 0; h < maxHarm; h++) {
    const n = h + 1;
    const amp = 1 / Math.pow(n, exponent);
    norm += amp;
    const harmPhase = phase * n;
    sample += amp * Math.sin(2 * Math.PI * (harmPhase - Math.floor(harmPhase)));
  }
  return norm > 0 ? sample / norm : 0;
}
function renderOsc(shape, mem, freq, sampleRate2, width) {
  const increment = freq / sampleRate2;
  if (shape === SHAPE_SUPERSQUARE) {
    const ratio = 1 + (width < 0 ? 0 : width > 1 ? 1 : width) * 3;
    mem.phase += increment;
    mem.slavePhase += increment * ratio;
    if (mem.phase >= 1) {
      mem.phase -= 1;
      mem.slavePhase = mem.phase * ratio;
    }
    if (mem.slavePhase >= 1) mem.slavePhase -= Math.floor(mem.slavePhase);
    const master = 2 * mem.phase - 1;
    const slave = mem.slavePhase < 0.5 ? 1 : -1;
    return (master + slave) * 0.5;
  }
  const sample = oscillatorSample(shape, mem.phase, width, freq, sampleRate2);
  mem.phase = (mem.phase + increment) % 1;
  return sample;
}
function memoryFor(state) {
  const lane = state.lane;
  if (!lane) return state.memory;
  let lanes = state.laneMemory;
  if (!lanes) {
    lanes = [];
    state.laneMemory = lanes;
  }
  let mem = lanes[lane];
  if (!mem) {
    mem = new Array(state.memory.length).fill(void 0);
    lanes[lane] = mem;
  }
  return mem;
}
function getMemory(state, slot, init) {
  const store = memoryFor(state);
  let mem = store[slot];
  if (mem === void 0) {
    mem = init();
    store[slot] = mem;
  }
  return mem;
}
function newFollower() {
  return { env: 0, ka: NaN, ca: 0, kr: NaN, cr: 0, sr: NaN };
}
function followerCoeff(mem, time, sampleRate2, rising) {
  if (mem.sr !== sampleRate2) {
    mem.sr = sampleRate2;
    mem.ka = NaN;
    mem.kr = NaN;
  }
  if (rising) {
    if (mem.ka !== time) {
      mem.ca = 1 - Math.exp(-1 / (time * sampleRate2));
      mem.ka = time;
    }
    return mem.ca;
  }
  if (mem.kr !== time) {
    mem.cr = 1 - Math.exp(-1 / (time * sampleRate2));
    mem.kr = time;
  }
  return mem.cr;
}
function recordMeter(state, id, value) {
  let meters = state.meters;
  if (!meters) {
    meters = /* @__PURE__ */ new Map();
    state.meters = meters;
  }
  let acc = meters.get(id);
  if (!acc) {
    acc = { peak: 0, sumSq: 0, count: 0 };
    meters.set(id, acc);
  }
  const magnitude = value < 0 ? -value : value;
  if (magnitude > acc.peak) acc.peak = magnitude;
  acc.sumSq += value * value;
  acc.count += 1;
}
function recordCapture(state, id, windowSize, value) {
  let captures = state.captures;
  if (!captures) {
    captures = /* @__PURE__ */ new Map();
    state.captures = captures;
  }
  let buffer = captures.get(id);
  if (!buffer) {
    buffer = { samples: new Float32Array(windowSize), write: 0, filled: false };
    captures.set(id, buffer);
  }
  buffer.samples[buffer.write] = value;
  buffer.write += 1;
  if (buffer.write >= buffer.samples.length) {
    buffer.write = 0;
    buffer.filled = true;
  }
}
function compileVoice(graph) {
  const plan = buildPlan(graph.output);
  const root = plan.root;
  const slotCount = plan.count;
  const seamNodes = [...plan.seams];
  const ports = audioPortNames(graph);
  const taps = plan.tapIds;
  const looperRuntimes = /* @__PURE__ */ new WeakMap();
  const stereo = graph.channels === 1 ? false : graph.channels === 2 ? true : ports.length > 0 || plan.usesLane;
  const sourceNode = root.kind === "kernel" && root.m !== 0 ? root : null;
  const writesScalarInput = plan.readsScalarInput;
  const mirrorsMonoInput = stereo && !plan.usesLane && !plan.usesRandom;
  const portScratchKeys = ports;
  function evalNode(node, state, sampleRate2) {
    const slot = node.i;
    if (state.stamps[slot] === state.gen) return state.values[slot];
    let result;
    switch (node.kind) {
      case "const":
        result = node.c;
        break;
      case "mul":
        result = evalNode(node.inputs.a, state, sampleRate2) * evalNode(node.inputs.b, state, sampleRate2);
        break;
      case "add":
        result = evalNode(node.inputs.a, state, sampleRate2) + evalNode(node.inputs.b, state, sampleRate2);
        break;
      case "param":
        result = state.params[node.name] ?? 0;
        break;
      case "port": {
        const name = node.name;
        const blocks = state.portBlocks?.[name];
        if (!blocks) {
          result = state.params[name] ?? 0;
          break;
        }
        const fixed = node.m;
        const channel = fixed < 0 ? state.lane : fixed;
        const block = blocks[channel] ?? blocks[0];
        result = block?.[state.frameIndex] ?? 0;
        break;
      }
      case "lane":
        result = state.lane;
        break;
      case "range": {
        const source = evalNode(node.inputs.source, state, sampleRate2);
        result = node.rangeMin + (source + 1) / 2 * (node.rangeMax - node.rangeMin);
        break;
      }
      case "mix": {
        const sources = node.list;
        let sum = 0;
        if (sources) {
          for (let k = 0; k < sources.length; k++) sum += evalNode(sources[k], state, sampleRate2);
        }
        result = sum;
        break;
      }
      default:
        result = evalOther(node, state, sampleRate2);
        break;
    }
    state.values[slot] = result;
    state.stamps[slot] = state.gen;
    return result;
  }
  function evalOther(node, state, sampleRate2) {
    let result;
    switch (node.kind) {
      case "const":
      case "param":
      case "port":
      case "lane":
      case "mul":
      case "add":
      case "mix":
      case "range":
        throw new Error(\`ASL node kind handled inline: \${node.kind}\`);
      case "meter":
      case "capture": {
        const value = evalNode(node.inputs.input, state, sampleRate2);
        result = value;
        if (state.seamBlock?.phase === "collect" || state.lane !== 0) break;
        if (node.kind === "meter") recordMeter(state, node.name, value);
        else recordCapture(state, node.name, node.c, value);
        break;
      }
      case "toFrequency": {
        const note = evalNode(node.inputs.note, state, sampleRate2);
        result = 440 * Math.pow(2, (note - 69) / 12);
        break;
      }
      case "osc": {
        const freq = evalNode(node.inputs.freq, state, sampleRate2);
        const width = node.inputs.width ? evalNode(node.inputs.width, state, sampleRate2) : 0.5;
        const shape = node.inputs.type ? Math.min(7, Math.max(0, Math.round(evalNode(node.inputs.type, state, sampleRate2)))) : node.m;
        const mem = getMemory(state, node.i, () => ({ phase: 0, slavePhase: 0 }));
        result = renderOsc(shape, mem, freq, sampleRate2, width);
        break;
      }
      case "lfo": {
        const rate = evalNode(node.inputs.rate, state, sampleRate2);
        const width = node.inputs.width ? evalNode(node.inputs.width, state, sampleRate2) : 0.5;
        const shape = node.inputs.type ? Math.min(7, Math.max(0, Math.round(evalNode(node.inputs.type, state, sampleRate2)))) : node.m;
        const mem = getMemory(state, node.i, () => ({ phase: 0, slavePhase: 0 }));
        result = renderOsc(shape, mem, rate, sampleRate2, width);
        break;
      }
      case "adsr":
        result = evalAdsr(node, state, sampleRate2);
        break;
      case "filterLowpass":
        result = evalRbJ(node, state, sampleRate2, "lowpass");
        break;
      case "filterHighpass":
        result = evalRbJ(node, state, sampleRate2, "highpass");
        break;
      case "filterBandpass":
        result = evalRbJ(node, state, sampleRate2, "bandpass");
        break;
      case "filterNotch":
        result = evalRbJ(node, state, sampleRate2, "notch");
        break;
      case "filterPeaking":
        result = evalPeaking(node, state, sampleRate2);
        break;
      case "filterLowShelf":
        result = evalShelf(node, state, sampleRate2, "low");
        break;
      case "filterHighShelf":
        result = evalShelf(node, state, sampleRate2, "high");
        break;
      case "filterAllpass":
        result = evalAllpass(node, state, sampleRate2);
        break;
      case "onePoleLowpass":
        result = evalOnePole(node, state, sampleRate2, "low");
        break;
      case "onePoleHighpass":
        result = evalOnePole(node, state, sampleRate2, "high");
        break;
      case "svf":
        result = evalSvf(node, state, sampleRate2);
        break;
      case "ladder":
        result = evalLadder(node, state, sampleRate2);
        break;
      case "comb":
        result = evalComb(node, state, sampleRate2);
        break;
      case "bitcrush":
        result = evalBitcrush(node, state, sampleRate2);
        break;
      case "downsample":
        result = evalDownsample(node, state, sampleRate2);
        break;
      case "rectify":
        result = evalRectify(node, state, sampleRate2);
        break;
      case "slew":
        result = evalSlew(node, state, sampleRate2);
        break;
      case "sampleHold":
        result = evalSampleHold(node, state, sampleRate2);
        break;
      case "compare":
        result = evalCompare(node, state, sampleRate2);
        break;
      case "compressor":
        result = evalCompressor(node, state, sampleRate2);
        break;
      case "expander":
        result = evalExpander(node, state, sampleRate2);
        break;
      case "transient":
        result = evalTransient(node, state, sampleRate2);
        break;
      case "impulse":
        result = evalImpulse(node, state, sampleRate2);
        break;
      case "reverse":
        result = evalReverse(node, state, sampleRate2);
        break;
      case "looper":
        result = evalLooper(node, state, sampleRate2);
        break;
      case "select":
        result = evalSelect(node, state, sampleRate2);
        break;
      case "waveshape":
        result = evalWaveshape(node, state, sampleRate2);
        break;
      case "breakpoints":
        result = evalBreakpoints(node, state, sampleRate2);
        break;
      case "rms":
        result = evalRms(node, state, sampleRate2);
        break;
      case "peak":
        result = evalPeak(node, state, sampleRate2);
        break;
      case "onset":
        result = evalOnset(node, state, sampleRate2);
        break;
      case "pitch":
        result = evalPitch(node, state, sampleRate2);
        break;
      case "filterSlope":
        result = evalFilterSlope(node, state, sampleRate2);
        break;
      case "wavetable":
        result = evalWavetable(node, state, sampleRate2);
        break;
      case "samplePlay":
        result = evalSamplePlay(node, state, sampleRate2);
        break;
      case "grain":
        result = evalGrain(node, state, sampleRate2);
        break;
      case "pitchShift":
        result = evalPitchShift(node, state, sampleRate2);
        break;
      case "panLaw":
        result = evalPanLaw(node, state, sampleRate2);
        break;
      case "transport":
        result = evalTransport(node, state, sampleRate2);
        break;
      case "clock":
        result = evalClock(node, state, sampleRate2);
        break;
      case "clockDivide":
        result = evalClockDivide(node, state, sampleRate2);
        break;
      case "clockMultiply":
        result = evalClockMultiply(node, state, sampleRate2);
        break;
      case "logic":
        result = evalLogic(node, state, sampleRate2);
        break;
      case "flipFlop":
        result = evalFlipFlop(node, state, sampleRate2);
        break;
      case "quantize":
        result = evalQuantize(node, state, sampleRate2);
        break;
      case "euclidean":
        result = evalEuclidean(node, state, sampleRate2);
        break;
      case "random":
        result = evalRandom(node, state, sampleRate2);
        break;
      case "trigger":
        result = evalTrigger(node, state, sampleRate2);
        break;
      case "pulse":
        result = evalPulse(node, state, sampleRate2);
        break;
      case "dahdsr":
        result = evalDahdsr(node, state, sampleRate2);
        break;
      case "sequencer":
        result = evalSequencer(node, state, sampleRate2);
        break;
      case "noise":
        result = evalNoise(node, state, sampleRate2);
        break;
      case "delay":
        result = evalDelay(node, state, sampleRate2);
        break;
      case "clip":
        result = evalClip(node, state, sampleRate2);
        break;
      case "dcBlock":
        result = evalDcBlock(node, state, sampleRate2);
        break;
      case "envFollow":
        result = evalEnvFollow(node, state, sampleRate2);
        break;
      case "kernel": {
        if (node.m !== 0) {
          result = 0;
          break;
        }
        const processor = state.kernels?.get(node.slot);
        const block = state.seamBlock;
        if (processor && block?.phase === "collect") {
          const input2 = evalNode(node.inputs.input, state, sampleRate2);
          const buffers = block.buffers[node.i];
          if (buffers) buffers.in[block.index] = input2;
          result = 0;
          break;
        }
        if (processor && block?.phase === "apply") {
          result = block.buffers[node.i]?.out[block.index] ?? 0;
          break;
        }
        const input = evalNode(node.inputs.input, state, sampleRate2);
        result = processor?.processSeamSample ? processor.processSeamSample(input) : input;
        break;
      }
      default:
        throw new Error(\`Unknown ASL node kind: \${node.kind}\`);
    }
    return result;
  }
  function evalAdsr(node, state, sampleRate2) {
    const { a, d, s, r } = node.params;
    const velocity = evalNode(node.inputs.trigger, state, sampleRate2);
    const mem = getMemory(state, node.i, () => ({
      stage: "idle",
      level: 0,
      peak: 0,
      stageElapsed: 0,
      stageStartLevel: 0,
      lastGate: false
    }));
    if (state.gate && !mem.lastGate) {
      mem.stage = "attack";
      mem.peak = velocity;
      mem.stageElapsed = 0;
      mem.stageStartLevel = mem.level;
    } else if (!state.gate && mem.lastGate) {
      mem.stage = "release";
      mem.stageElapsed = 0;
      mem.stageStartLevel = mem.level;
    }
    mem.lastGate = state.gate;
    const dt = 1 / sampleRate2;
    switch (mem.stage) {
      case "idle":
        mem.level = 0;
        break;
      case "attack": {
        mem.stageElapsed += dt;
        const t = Math.min(mem.stageElapsed / Math.max(a, 1e-6), 1);
        mem.level = mem.stageStartLevel + (mem.peak - mem.stageStartLevel) * t;
        if (t >= 1) {
          mem.stage = "decay";
          mem.stageElapsed = 0;
          mem.stageStartLevel = mem.level;
        }
        break;
      }
      case "decay": {
        mem.stageElapsed += dt;
        const target = s * mem.peak;
        const t = Math.min(mem.stageElapsed / Math.max(d, 1e-6), 1);
        mem.level = mem.stageStartLevel + (target - mem.stageStartLevel) * t;
        if (t >= 1) mem.stage = "sustain";
        break;
      }
      case "sustain":
        mem.level = s * mem.peak;
        break;
      case "release": {
        mem.stageElapsed += dt;
        const t = Math.min(mem.stageElapsed / Math.max(r, 1e-6), 1);
        mem.level = mem.stageStartLevel * (1 - t);
        if (t >= 1) {
          mem.stage = "idle";
          mem.level = 0;
        }
        break;
      }
    }
    return mem.level;
  }
  function setBiquad(mem, k0, k1, k2, k3, b0, b1, b2, a0, a1, a2) {
    mem.n0 = b0 / a0;
    mem.n1 = b1 / a0;
    mem.n2 = b2 / a0;
    mem.d1 = a1 / a0;
    mem.d2 = a2 / a0;
    mem.k0 = k0;
    mem.k1 = k1;
    mem.k2 = k2;
    mem.k3 = k3;
  }
  function tickBiquad(mem, input) {
    const y = mem.n0 * input + mem.n1 * mem.x1 + mem.n2 * mem.x2 - mem.d1 * mem.y1 - mem.d2 * mem.y2;
    mem.x2 = mem.x1;
    mem.x1 = input;
    mem.y2 = mem.y1;
    mem.y1 = y;
    return y;
  }
  function evalRbJ(node, state, sampleRate2, kind) {
    const input = evalNode(node.inputs.input, state, sampleRate2);
    const cutoff = evalNode(node.inputs.cutoff, state, sampleRate2);
    const q = evalNode(node.inputs.q, state, sampleRate2);
    const mem = getMemory(state, node.i, newBiquad);
    if (mem.k0 !== cutoff || mem.k1 !== q || mem.k2 !== sampleRate2) {
      const clampedCutoff = Math.min(Math.max(cutoff, 1), sampleRate2 / 2 - 1);
      const omega = 2 * Math.PI * clampedCutoff / sampleRate2;
      const sinw = Math.sin(omega);
      const cosw = Math.cos(omega);
      const alpha = sinw / (2 * Math.max(q, 1e-4));
      let b0;
      let b1;
      let b2;
      const a0 = 1 + alpha;
      const a1 = -2 * cosw;
      const a2 = 1 - alpha;
      if (kind === "lowpass") {
        b0 = (1 - cosw) / 2;
        b1 = 1 - cosw;
        b2 = (1 - cosw) / 2;
      } else if (kind === "highpass") {
        b0 = (1 + cosw) / 2;
        b1 = -(1 + cosw);
        b2 = (1 + cosw) / 2;
      } else if (kind === "bandpass") {
        b0 = alpha;
        b1 = 0;
        b2 = -alpha;
      } else {
        b0 = 1;
        b1 = -2 * cosw;
        b2 = 1;
      }
      setBiquad(mem, cutoff, q, sampleRate2, 0, b0, b1, b2, a0, a1, a2);
    }
    return tickBiquad(mem, input);
  }
  function evalNoise(node, state, sampleRate2) {
    const white = Math.random() * 2 - 1;
    const color = node.inputs.color ? Math.min(5, Math.max(0, Math.round(evalNode(node.inputs.color, state, sampleRate2)))) : node.m;
    if (color === 0) return white;
    const mem = getMemory(
      state,
      node.i,
      () => ({ b0: 0, b1: 0, b2: 0, brown: 0, lastWhite: 0, lastPink: 0 })
    );
    const pink = () => {
      mem.b0 = 0.99886 * mem.b0 + white * 0.0555179;
      mem.b1 = 0.99332 * mem.b1 + white * 0.0750759;
      mem.b2 = 0.969 * mem.b2 + white * 0.153852;
      return Math.min(1, Math.max(-1, (mem.b0 + mem.b1 + mem.b2 + white * 0.3104856) * 0.55));
    };
    const brown = () => {
      mem.brown = (mem.brown + white * 0.02) * 0.996;
      return Math.min(1, Math.max(-1, mem.brown * 3.5));
    };
    if (color === 1) return pink();
    if (color === 2) return brown();
    if (color === 3) {
      const p2 = pink();
      const blue = (p2 - mem.lastPink) * 8;
      mem.lastPink = p2;
      return Math.min(1, Math.max(-1, blue));
    }
    if (color === 4) {
      const violet = (white - mem.lastWhite) * 0.85;
      mem.lastWhite = white;
      return Math.min(1, Math.max(-1, violet));
    }
    const p = pink();
    const b = brown();
    return Math.min(1, Math.max(-1, p * 0.65 + (white - b * 0.35) * 0.4));
  }
  function evalDelay(node, state, sampleRate2) {
    const input = evalNode(node.inputs.input, state, sampleRate2);
    const timeSec = evalNode(node.inputs.timeSec, state, sampleRate2);
    const feedback = evalNode(node.inputs.feedback, state, sampleRate2);
    const wet = evalNode(node.inputs.mix, state, sampleRate2);
    const mem = getMemory(
      state,
      node.i,
      () => ({
        // Sized once, on the first sample this node ever runs. The line length
        // is a graph constant; re-deriving it 48,000 times a second was work
        // for an answer only the allocation above ever reads.
        buf: new Float32Array(Math.max(2, Math.ceil(Math.max(node.c, 1 / sampleRate2) * sampleRate2) + 2)),
        idx: 0,
        pos: 0,
        ready: false,
        c: 0,
        sr: NaN
      })
    );
    const target = Math.min(Math.max(timeSec, 0) * sampleRate2, mem.buf.length - 2);
    if (mem.sr !== sampleRate2) {
      mem.c = 1 - Math.exp(-1 / (0.02 * sampleRate2));
      mem.sr = sampleRate2;
    }
    if (!mem.ready) {
      mem.pos = target;
      mem.ready = true;
    } else {
      mem.pos += (target - mem.pos) * mem.c;
    }
    const read = mem.idx - mem.pos;
    const i0 = (Math.floor(read) % mem.buf.length + mem.buf.length) % mem.buf.length;
    const i1 = (i0 + 1) % mem.buf.length;
    const frac = read - Math.floor(read);
    const delayed = mem.buf[i0] * (1 - frac) + mem.buf[i1] * frac;
    mem.buf[mem.idx] = input + delayed * Math.min(Math.max(feedback, -0.99), 0.99);
    mem.idx = (mem.idx + 1) % mem.buf.length;
    const mix = Math.min(Math.max(wet, 0), 1);
    return input * (1 - mix) + delayed * mix;
  }
  function evalClip(node, state, sampleRate2) {
    const input = evalNode(node.inputs.input, state, sampleRate2);
    const drive = Math.max(evalNode(node.inputs.drive, state, sampleRate2), 1e-4);
    const driven = input * drive;
    if (node.m === 1) return Math.min(1, Math.max(-1, driven));
    return Math.tanh(driven);
  }
  function evalDcBlock(node, state, sampleRate2) {
    const input = evalNode(node.inputs.input, state, sampleRate2);
    const mem = getMemory(state, node.i, () => ({ x1: 0, y1: 0 }));
    const y = input - mem.x1 + 0.995 * mem.y1;
    mem.x1 = input;
    mem.y1 = y;
    return y;
  }
  function evalEnvFollow(node, state, sampleRate2) {
    const input = evalNode(node.inputs.input, state, sampleRate2);
    const attack = Math.max(evalNode(node.inputs.attack, state, sampleRate2), 1e-5);
    const release = Math.max(evalNode(node.inputs.release, state, sampleRate2), 1e-5);
    const mem = getMemory(state, node.i, newFollower);
    const target = Math.abs(input);
    const rising = target > mem.env;
    const coeff = followerCoeff(mem, rising ? attack : release, sampleRate2, rising);
    mem.env += (target - mem.env) * coeff;
    return mem.env;
  }
  function evalPeaking(node, state, sampleRate2) {
    const input = evalNode(node.inputs.input, state, sampleRate2);
    const freq = evalNode(node.inputs.freq, state, sampleRate2);
    const gainDb = evalNode(node.inputs.gainDb, state, sampleRate2);
    const q = evalNode(node.inputs.q, state, sampleRate2);
    const mem = getMemory(state, node.i, newBiquad);
    if (mem.k0 !== freq || mem.k1 !== gainDb || mem.k2 !== q || mem.k3 !== sampleRate2) {
      const clampedFreq = Math.min(Math.max(freq, 1), sampleRate2 / 2 - 1);
      const a = Math.pow(10, gainDb / 40);
      const omega = 2 * Math.PI * clampedFreq / sampleRate2;
      const alpha = Math.sin(omega) / (2 * Math.max(q, 1e-4));
      const cosw = Math.cos(omega);
      const b0 = 1 + alpha * a;
      const b1 = -2 * cosw;
      const b2 = 1 - alpha * a;
      const a0 = 1 + alpha / a;
      const a1 = -2 * cosw;
      const a2 = 1 - alpha / a;
      setBiquad(mem, freq, gainDb, q, sampleRate2, b0, b1, b2, a0, a1, a2);
    }
    return tickBiquad(mem, input);
  }
  function evalShelf(node, state, sampleRate2, kind) {
    const input = evalNode(node.inputs.input, state, sampleRate2);
    const freq = evalNode(node.inputs.freq, state, sampleRate2);
    const gainDb = evalNode(node.inputs.gainDb, state, sampleRate2);
    const q = evalNode(node.inputs.q, state, sampleRate2);
    const mem = getMemory(state, node.i, newBiquad);
    if (gainDb === 0) {
      mem.x2 = mem.x1;
      mem.x1 = input;
      mem.y2 = mem.y1;
      mem.y1 = input;
      mem.k0 = NaN;
      return input;
    }
    if (mem.k0 !== freq || mem.k1 !== gainDb || mem.k2 !== q || mem.k3 !== sampleRate2) {
      const clampedFreq = Math.min(Math.max(freq, 1), sampleRate2 / 2 - 1);
      const a = Math.pow(10, gainDb / 40);
      const omega = 2 * Math.PI * clampedFreq / sampleRate2;
      const sinw = Math.sin(omega);
      const cosw = Math.cos(omega);
      const alpha = sinw / 2 * Math.sqrt((a + 1 / a) * (1 / Math.max(q, 1e-4) - 1) + 2);
      const sqA = Math.sqrt(a);
      let b0;
      let b1;
      let b2;
      let a0;
      let a1;
      let a2;
      if (kind === "low") {
        a0 = a + 1 + (a - 1) * cosw + 2 * sqA * alpha;
        b0 = a * (a + 1 - (a - 1) * cosw + 2 * sqA * alpha);
        b1 = 2 * a * (a - 1 - (a + 1) * cosw);
        b2 = a * (a + 1 - (a - 1) * cosw - 2 * sqA * alpha);
        a1 = -2 * (a - 1 + (a + 1) * cosw);
        a2 = a + 1 + (a - 1) * cosw - 2 * sqA * alpha;
      } else {
        a0 = a + 1 - (a - 1) * cosw + 2 * sqA * alpha;
        b0 = a * (a + 1 + (a - 1) * cosw + 2 * sqA * alpha);
        b1 = -2 * a * (a - 1 + (a + 1) * cosw);
        b2 = a * (a + 1 + (a - 1) * cosw - 2 * sqA * alpha);
        a1 = 2 * (a - 1 - (a + 1) * cosw);
        a2 = a + 1 - (a - 1) * cosw - 2 * sqA * alpha;
      }
      setBiquad(mem, freq, gainDb, q, sampleRate2, b0, b1, b2, a0, a1, a2);
    }
    return tickBiquad(mem, input);
  }
  function evalAllpass(node, state, sampleRate2) {
    const input = evalNode(node.inputs.input, state, sampleRate2);
    const cutoff = evalNode(node.inputs.cutoff, state, sampleRate2);
    const q = evalNode(node.inputs.q, state, sampleRate2);
    const mem = getMemory(state, node.i, newBiquad);
    if (mem.k0 !== cutoff || mem.k1 !== q || mem.k2 !== sampleRate2) {
      const clampedCutoff = Math.min(Math.max(cutoff, 1), sampleRate2 / 2 - 1);
      const omega = 2 * Math.PI * clampedCutoff / sampleRate2;
      const sinw = Math.sin(omega);
      const cosw = Math.cos(omega);
      const alpha = sinw / (2 * Math.max(q, 1e-4));
      const b0 = 1 - alpha;
      const b1 = -2 * cosw;
      const b2 = 1 + alpha;
      const a0 = 1 + alpha;
      const a1 = -2 * cosw;
      const a2 = 1 - alpha;
      setBiquad(mem, cutoff, q, sampleRate2, 0, b0, b1, b2, a0, a1, a2);
    }
    return tickBiquad(mem, input);
  }
  function evalOnePole(node, state, sampleRate2, kind) {
    const input = evalNode(node.inputs.input, state, sampleRate2);
    const cutoff = evalNode(node.inputs.cutoff, state, sampleRate2);
    const mem = getMemory(state, node.i, () => ({
      y: 0,
      k: NaN,
      sr: NaN,
      g: 0
    }));
    if (mem.k !== cutoff || mem.sr !== sampleRate2) {
      mem.sr = sampleRate2;
      const clampedCutoff = Math.min(Math.max(cutoff, 1), sampleRate2 / 2 - 1);
      mem.g = 1 - Math.exp(-2 * Math.PI * clampedCutoff / sampleRate2);
      mem.k = cutoff;
    }
    mem.y += mem.g * (input - mem.y);
    return kind === "low" ? mem.y : input - mem.y;
  }
  function evalSvf(node, state, sampleRate2) {
    const input = evalNode(node.inputs.input, state, sampleRate2);
    const cutoff = evalNode(node.inputs.cutoff, state, sampleRate2);
    const q = evalNode(node.inputs.q, state, sampleRate2);
    const mem = getMemory(
      state,
      node.i,
      () => ({ low: 0, band: 0, k: NaN, sr: NaN, f: 0, damp: 0 })
    );
    if (mem.k !== cutoff || mem.sr !== sampleRate2) {
      const clampedCutoff = Math.min(Math.max(cutoff, 1), sampleRate2 * 0.25);
      mem.f = 2 * Math.sin(Math.PI * clampedCutoff / sampleRate2);
      mem.k = cutoff;
      mem.sr = sampleRate2;
    }
    const damp = Math.min(1.98, Math.max(0.05, 1 / Math.max(q, 0.05)));
    const f = mem.f;
    mem.low += f * mem.band;
    const high = input - mem.low - damp * mem.band;
    mem.band += f * high;
    if (node.m === 1) return high;
    if (node.m === 2) return mem.band;
    return mem.low;
  }
  function evalLadder(node, state, sampleRate2) {
    const input = evalNode(node.inputs.input, state, sampleRate2);
    const cutoff = evalNode(node.inputs.cutoff, state, sampleRate2);
    const resonance = evalNode(node.inputs.resonance, state, sampleRate2);
    const mem = getMemory(state, node.i, () => ({ y1: 0, y2: 0, y3: 0, y4: 0, kc: NaN, sr: NaN, g: 0 }));
    if (mem.kc !== cutoff || mem.sr !== sampleRate2) {
      const clampedCutoff = Math.min(Math.max(cutoff, 1), sampleRate2 / 2 - 1);
      mem.g = 1 - Math.exp(-2 * Math.PI * clampedCutoff / sampleRate2);
      mem.kc = cutoff;
      mem.sr = sampleRate2;
    }
    const g = mem.g;
    const k = Math.min(Math.max(resonance, 0), 0.99) * 4;
    const x = input - k * Math.tanh(mem.y4);
    mem.y1 += g * (x - mem.y1);
    mem.y2 += g * (mem.y1 - mem.y2);
    mem.y3 += g * (mem.y2 - mem.y3);
    mem.y4 += g * (mem.y3 - mem.y4);
    return mem.y4;
  }
  function evalComb(node, state, sampleRate2) {
    const input = evalNode(node.inputs.input, state, sampleRate2);
    const freq = evalNode(node.inputs.freq, state, sampleRate2);
    const feedback = evalNode(node.inputs.feedback, state, sampleRate2);
    const wet = evalNode(node.inputs.mix, state, sampleRate2);
    const mem = getMemory(state, node.i, () => ({
      buf: new Float32Array(Math.max(2, Math.ceil(sampleRate2 / 20) + 2)),
      idx: 0,
      pos: 0,
      ready: false,
      c: 0,
      sr: NaN
    }));
    const target = Math.min(Math.max(sampleRate2 / Math.max(freq, 20), 1), mem.buf.length - 2);
    if (mem.sr !== sampleRate2) {
      mem.c = 1 - Math.exp(-1 / (0.02 * sampleRate2));
      mem.sr = sampleRate2;
    }
    if (!mem.ready) {
      mem.pos = target;
      mem.ready = true;
    } else {
      mem.pos += (target - mem.pos) * mem.c;
    }
    const read = mem.idx - mem.pos;
    const i0 = (Math.floor(read) % mem.buf.length + mem.buf.length) % mem.buf.length;
    const i1 = (i0 + 1) % mem.buf.length;
    const frac = read - Math.floor(read);
    const delayed = mem.buf[i0] * (1 - frac) + mem.buf[i1] * frac;
    mem.buf[mem.idx] = input + delayed * Math.min(Math.max(feedback, -0.99), 0.99);
    mem.idx = (mem.idx + 1) % mem.buf.length;
    const mix = Math.min(Math.max(wet, 0), 1);
    return input * (1 - mix) + delayed * mix;
  }
  function evalBitcrush(node, state, sampleRate2) {
    const input = evalNode(node.inputs.input, state, sampleRate2);
    const bits = Math.min(Math.max(evalNode(node.inputs.bits, state, sampleRate2), 1), 16);
    const mem = getMemory(state, node.i, () => ({ k: NaN, steps: 0 }));
    if (mem.k !== bits) {
      mem.steps = Math.pow(2, bits - 1);
      mem.k = bits;
    }
    const steps = mem.steps;
    return Math.round(input * steps) / steps;
  }
  function evalDownsample(node, state, sampleRate2) {
    const input = evalNode(node.inputs.input, state, sampleRate2);
    const factor = Math.max(1, evalNode(node.inputs.factor, state, sampleRate2));
    const mem = getMemory(state, node.i, () => ({ held: 0, count: 0 }));
    if (mem.count <= 0) {
      mem.held = input;
      mem.count = factor;
    }
    mem.count -= 1;
    return mem.held;
  }
  function evalRectify(node, state, sampleRate2) {
    const input = evalNode(node.inputs.input, state, sampleRate2);
    return node.m === 1 ? Math.max(input, 0) : Math.abs(input);
  }
  function evalSlew(node, state, sampleRate2) {
    const input = evalNode(node.inputs.input, state, sampleRate2);
    const rise = Math.max(evalNode(node.inputs.rise, state, sampleRate2), 0);
    const fall = Math.max(evalNode(node.inputs.fall, state, sampleRate2), 0);
    const mem = getMemory(state, node.i, () => ({ y: input }));
    const delta = input - mem.y;
    if (delta > 0) mem.y += Math.min(delta, rise / sampleRate2);
    else mem.y += Math.max(delta, -fall / sampleRate2);
    return mem.y;
  }
  function evalSampleHold(node, state, sampleRate2) {
    const input = evalNode(node.inputs.input, state, sampleRate2);
    const freq = Math.max(evalNode(node.inputs.freq, state, sampleRate2), 0);
    const mem = getMemory(state, node.i, () => ({
      held: input,
      phase: 1
    }));
    mem.phase += freq / sampleRate2;
    if (mem.phase >= 1) {
      mem.held = input;
      mem.phase -= Math.floor(mem.phase);
    }
    return mem.held;
  }
  function evalCompare(node, state, sampleRate2) {
    const input = evalNode(node.inputs.input, state, sampleRate2);
    const threshold = evalNode(node.inputs.threshold, state, sampleRate2);
    if (node.m === 1) return input < threshold ? 1 : 0;
    return input > threshold ? 1 : 0;
  }
  function evalCompressor(node, state, sampleRate2) {
    const input = evalNode(node.inputs.input, state, sampleRate2);
    const detect = node.inputs.sidechain ? evalNode(node.inputs.sidechain, state, sampleRate2) : input;
    const threshold = Math.max(evalNode(node.inputs.threshold, state, sampleRate2), 1e-6);
    const ratio = Math.max(evalNode(node.inputs.ratio, state, sampleRate2), 1);
    const attack = Math.max(evalNode(node.inputs.attack, state, sampleRate2), 1e-5);
    const release = Math.max(evalNode(node.inputs.release, state, sampleRate2), 1e-5);
    const mem = getMemory(state, node.i, newFollower);
    const target = Math.abs(detect);
    const rising = target > mem.env;
    const coeff = followerCoeff(mem, rising ? attack : release, sampleRate2, rising);
    mem.env += (target - mem.env) * coeff;
    if (mem.env <= threshold) return input;
    const gain = Math.pow(threshold / mem.env, 1 - 1 / ratio);
    return input * gain;
  }
  function evalTransport(node, state, sampleRate2) {
    const snapshot = state.transport ?? DEFAULT_TRANSPORT;
    const field = node.params.field;
    if (field === "bpm") return snapshot.bpm;
    if (field === "playing") return snapshot.playing ? 1 : 0;
    if (field === "beatsPerBar") return snapshot.beatsPerBar > 0 ? snapshot.beatsPerBar : 4;
    if (field === "beatUnit") return normalizeBeatUnit(snapshot.beatUnit);
    if (field === "division") {
      const table = node.params.divisions;
      if (!table || table.length === 0) return 1;
      const index = Math.round(evalNode(node.inputs.index, state, sampleRate2));
      return table[Math.min(table.length - 1, Math.max(0, index))];
    }
    if (field === "seconds") {
      const length2 = evalNode(node.inputs.length, state, sampleRate2);
      return snapshot.bpm > 0 ? length2 * 60 / snapshot.bpm : 0;
    }
    const perSample = snapshot.playing ? snapshot.bpm / 60 / sampleRate2 : 0;
    const beats = snapshot.beats + state.frameIndex * perSample;
    if (field === "beats") return beats;
    if (field === "bars") {
      const perBar = barBeats(snapshot.beatsPerBar, snapshot.beatUnit);
      return perBar > 0 ? beats / perBar : 0;
    }
    const length = evalNode(node.inputs.length, state, sampleRate2);
    if (!(length > 0)) return 0;
    if (field === "phase") {
      const turns = beats / length;
      return turns - Math.floor(turns);
    }
    if (field === "pulse") {
      if (perSample === 0) return 0;
      const previous = beats - perSample;
      return Math.floor(beats / length) !== Math.floor(previous / length) ? 1 : 0;
    }
    return 0;
  }
  function evalClock(node, state, sampleRate2) {
    const freq = Math.max(evalNode(node.inputs.freq, state, sampleRate2), 0);
    const mem = getMemory(state, node.i, () => ({ phase: 1 }));
    mem.phase += freq / sampleRate2;
    if (mem.phase >= 1) {
      mem.phase -= Math.floor(mem.phase);
      return 1;
    }
    return 0;
  }
  function evalClockDivide(node, state, sampleRate2) {
    const input = evalNode(node.inputs.input, state, sampleRate2);
    const factor = Math.max(1, Math.round(evalNode(node.inputs.factor, state, sampleRate2)));
    const mem = getMemory(state, node.i, () => ({ prev: 0, count: 0 }));
    const rose = input > 0.5 && mem.prev <= 0.5;
    mem.prev = input;
    if (!rose) return 0;
    mem.count += 1;
    if (mem.count >= factor) {
      mem.count = 0;
      return 1;
    }
    return 0;
  }
  function evalClockMultiply(node, state, sampleRate2) {
    const input = evalNode(node.inputs.input, state, sampleRate2);
    const factor = Math.max(1, Math.round(evalNode(node.inputs.factor, state, sampleRate2)));
    const mem = getMemory(state, node.i, () => ({ prev: 0, since: 0, interval: 0, nextAt: 0, left: 0, armed: false }));
    const rose = input > 0.5 && mem.prev <= 0.5;
    mem.prev = input;
    if (rose) {
      if (mem.armed && mem.since > 0) {
        mem.interval = mem.since / factor;
        mem.nextAt = 0;
        mem.left = factor;
      }
      mem.since = 0;
      mem.armed = true;
    }
    let out = 0;
    if (mem.left > 0 && mem.since >= mem.nextAt) {
      out = 1;
      mem.nextAt += mem.interval;
      mem.left -= 1;
    }
    mem.since += 1;
    return out;
  }
  function evalLogic(node, state, sampleRate2) {
    const mode = node.m;
    const a = evalNode(node.inputs.a, state, sampleRate2) > 0.5;
    if (mode === 3) return a ? 0 : 1;
    const b = evalNode(node.inputs.b, state, sampleRate2) > 0.5;
    if (mode === 1) return a || b ? 1 : 0;
    if (mode === 2) return a !== b ? 1 : 0;
    return a && b ? 1 : 0;
  }
  function evalFlipFlop(node, state, sampleRate2) {
    const input = evalNode(node.inputs.input, state, sampleRate2);
    const mem = getMemory(state, node.i, () => ({ prev: 0, on: 0 }));
    const rose = input > 0.5 && mem.prev <= 0.5;
    mem.prev = input;
    if (rose) mem.on = mem.on > 0.5 ? 0 : 1;
    return mem.on;
  }
  function evalQuantize(node, state, sampleRate2) {
    const input = evalNode(node.inputs.input, state, sampleRate2);
    const root2 = evalNode(node.inputs.root, state, sampleRate2);
    const scale = evalNode(node.inputs.scale, state, sampleRate2);
    return quantizeToScale(input, root2, scale);
  }
  function evalEuclidean(node, state, sampleRate2) {
    const input = evalNode(node.inputs.input, state, sampleRate2);
    const steps = evalNode(node.inputs.steps, state, sampleRate2);
    const hits = evalNode(node.inputs.hits, state, sampleRate2);
    const rotation = evalNode(node.inputs.rotation, state, sampleRate2);
    const mem = getMemory(state, node.i, () => ({ prev: 0, step: -1, kn: NaN, kh: NaN, kr: NaN, pattern: null }));
    const rose = input > 0.5 && mem.prev <= 0.5;
    mem.prev = input;
    if (!rose) return 0;
    const n = Math.max(1, Math.floor(steps));
    mem.step = (mem.step + 1) % n;
    let pattern = mem.pattern;
    if (!pattern || mem.kn !== n || mem.kh !== hits || mem.kr !== rotation) {
      pattern = euclideanPattern(n, hits, rotation);
      mem.pattern = pattern;
      mem.kn = n;
      mem.kh = hits;
      mem.kr = rotation;
    }
    return pattern[mem.step] ? 1 : 0;
  }
  function evalRandom(node, state, sampleRate2) {
    const freq = Math.max(evalNode(node.inputs.freq, state, sampleRate2), 0);
    const mem = getMemory(state, node.i, () => ({
      phase: 1,
      prev: 0,
      next: 0
    }));
    mem.phase += freq / sampleRate2;
    if (mem.phase >= 1) {
      mem.phase -= Math.floor(mem.phase);
      mem.prev = mem.next;
      mem.next = Math.random() * 2 - 1;
    }
    if (node.m === 1) return mem.prev + (mem.next - mem.prev) * mem.phase;
    return mem.next;
  }
  function evalTrigger(node, state, sampleRate2) {
    const input = evalNode(node.inputs.input, state, sampleRate2);
    const threshold = evalNode(node.inputs.threshold, state, sampleRate2);
    const mem = getMemory(state, node.i, () => ({ prev: 0 }));
    const rose = input > threshold && mem.prev <= threshold;
    mem.prev = input;
    return rose ? 1 : 0;
  }
  function evalPulse(node, state, sampleRate2) {
    const input = evalNode(node.inputs.input, state, sampleRate2);
    const widthSec = Math.max(evalNode(node.inputs.widthSec, state, sampleRate2), 0);
    const mem = getMemory(state, node.i, () => ({ prev: 0, left: 0 }));
    const rose = input > 0.5 && mem.prev <= 0.5;
    mem.prev = input;
    if (rose) mem.left = Math.max(1, Math.round(widthSec * sampleRate2));
    if (mem.left <= 0) return 0;
    mem.left -= 1;
    return 1;
  }
  function evalDahdsr(node, state, sampleRate2) {
    const velocity = evalNode(node.inputs.trigger, state, sampleRate2);
    const delay = Math.max(evalNode(node.inputs.delay, state, sampleRate2), 0);
    const attack = Math.max(evalNode(node.inputs.attack, state, sampleRate2), 0);
    const hold = Math.max(evalNode(node.inputs.hold, state, sampleRate2), 0);
    const decay = Math.max(evalNode(node.inputs.decay, state, sampleRate2), 0);
    const sustain = Math.min(Math.max(evalNode(node.inputs.sustain, state, sampleRate2), 0), 1);
    const release = Math.max(evalNode(node.inputs.release, state, sampleRate2), 0);
    const gated = node.inputs.gate ? evalNode(node.inputs.gate, state, sampleRate2) > 0.5 : state.gate;
    const mem = getMemory(state, node.i, () => ({
      stage: "idle",
      level: 0,
      peak: 0,
      stageElapsed: 0,
      stageStartLevel: 0,
      lastGate: false
    }));
    if (gated && !mem.lastGate) {
      mem.peak = velocity;
      mem.stageElapsed = 0;
      mem.stageStartLevel = mem.level;
      mem.stage = delay > 1e-6 ? "delay" : "attack";
    } else if (!gated && mem.lastGate) {
      mem.stage = "release";
      mem.stageElapsed = 0;
      mem.stageStartLevel = mem.level;
    }
    mem.lastGate = gated;
    const dt = 1 / sampleRate2;
    mem.stageElapsed += dt;
    if (mem.stage === "idle") {
      mem.level = 0;
    } else if (mem.stage === "delay") {
      mem.level = mem.stageStartLevel;
      if (mem.stageElapsed >= delay) {
        mem.stage = "attack";
        mem.stageElapsed = 0;
        mem.stageStartLevel = mem.level;
      }
    }
    if (mem.stage === "attack") {
      const dur = Math.max(attack, 1e-6);
      const t = Math.min(mem.stageElapsed / dur, 1);
      mem.level = mem.stageStartLevel + (mem.peak - mem.stageStartLevel) * t;
      if (t >= 1) {
        mem.stage = hold > 1e-6 ? "hold" : "decay";
        mem.stageElapsed = 0;
        mem.stageStartLevel = mem.level;
      }
    }
    if (mem.stage === "hold") {
      mem.level = mem.peak;
      if (mem.stageElapsed >= hold) {
        mem.stage = "decay";
        mem.stageElapsed = 0;
        mem.stageStartLevel = mem.level;
      }
    }
    if (mem.stage === "decay") {
      const target = sustain * mem.peak;
      const dur = Math.max(decay, 1e-6);
      const t = Math.min(mem.stageElapsed / dur, 1);
      mem.level = mem.stageStartLevel + (target - mem.stageStartLevel) * t;
      if (t >= 1) mem.stage = "sustain";
    }
    if (mem.stage === "sustain") {
      mem.level = sustain * mem.peak;
    }
    if (mem.stage === "release") {
      const dur = Math.max(release, 1e-6);
      const t = Math.min(mem.stageElapsed / dur, 1);
      mem.level = mem.stageStartLevel * (1 - t);
      if (t >= 1) {
        mem.stage = "idle";
        mem.level = 0;
      }
    }
    return mem.level;
  }
  function evalSequencer(node, state, sampleRate2) {
    const clockIn = evalNode(node.inputs.clock, state, sampleRate2);
    const steps = node.list ?? [];
    const mem = getMemory(state, node.i, () => ({ prev: 0, index: -1 }));
    const rose = clockIn > 0.5 && mem.prev <= 0.5;
    mem.prev = clockIn;
    if (steps.length === 0) return 0;
    if (rose) mem.index = (mem.index + 1) % steps.length;
    if (mem.index < 0) return 0;
    return evalNode(steps[mem.index], state, sampleRate2);
  }
  function evalImpulse(node, state, sampleRate2) {
    const gated = node.inputs.gate ? evalNode(node.inputs.gate, state, sampleRate2) > 0.5 : state.gate;
    const mem = getMemory(state, node.i, () => ({
      prev: false,
      armed: !node.inputs.gate
    }));
    const rose = gated && !mem.prev;
    mem.prev = gated;
    if (mem.armed || rose) {
      mem.armed = false;
      return 1;
    }
    return 0;
  }
  function evalExpander(node, state, sampleRate2) {
    const input = evalNode(node.inputs.input, state, sampleRate2);
    const threshold = Math.max(evalNode(node.inputs.threshold, state, sampleRate2), 1e-6);
    const ratio = Math.max(evalNode(node.inputs.ratio, state, sampleRate2), 1);
    const attack = Math.max(evalNode(node.inputs.attack, state, sampleRate2), 1e-5);
    const release = Math.max(evalNode(node.inputs.release, state, sampleRate2), 1e-5);
    const mem = getMemory(state, node.i, newFollower);
    const target = Math.abs(input);
    const rising = target > mem.env;
    const coeff = followerCoeff(mem, rising ? attack : release, sampleRate2, rising);
    mem.env += (target - mem.env) * coeff;
    if (mem.env >= threshold) return input;
    const gain = Math.pow(Math.max(mem.env, 1e-6) / threshold, ratio - 1);
    return input * gain;
  }
  function evalTransient(node, state, sampleRate2) {
    const input = evalNode(node.inputs.input, state, sampleRate2);
    const attackAmt = evalNode(node.inputs.attack, state, sampleRate2);
    const sustainAmt = evalNode(node.inputs.sustain, state, sampleRate2);
    const mem = getMemory(
      state,
      node.i,
      () => ({ fast: 0, slow: 0, sr: NaN, cf: 0, cs: 0 })
    );
    if (mem.sr !== sampleRate2) {
      mem.cf = 1 - Math.exp(-1 / (3e-3 * sampleRate2));
      mem.cs = 1 - Math.exp(-1 / (0.08 * sampleRate2));
      mem.sr = sampleRate2;
    }
    const target = Math.abs(input);
    mem.fast += (target - mem.fast) * mem.cf;
    mem.slow += (target - mem.slow) * mem.cs;
    const delta = mem.fast - mem.slow;
    const gain = Math.max(0, 1 + attackAmt * Math.max(delta, 0) * 4 + sustainAmt * mem.slow);
    return input * gain;
  }
  function evalReverse(node, state, sampleRate2) {
    const input = evalNode(node.inputs.input, state, sampleRate2);
    const timeSec = Math.max(evalNode(node.inputs.timeSec, state, sampleRate2), 1 / sampleRate2);
    const mem = getMemory(state, node.i, () => ({
      buf: new Float32Array(Math.max(2, Math.ceil(Math.max(node.c, 1 / sampleRate2) * sampleRate2))),
      write: 0,
      read: 0
    }));
    const span = Math.min(Math.max(Math.round(timeSec * sampleRate2), 2), mem.buf.length);
    mem.buf[mem.write % span] = input;
    mem.write += 1;
    mem.read = (mem.read - 1 + span) % span;
    return mem.buf[mem.read] ?? 0;
  }
  function evalLooper(node, state, sampleRate2) {
    const box = node.params.box;
    const field = node.m;
    const takeCap = Math.max(2, Math.ceil(Math.max(node.c, 1 / sampleRate2) * sampleRate2));
    const ringCap = takeCap + Math.max(2, Math.ceil(0.02 * sampleRate2));
    const createMem = () => ({
      ring: new Float32Array(ringCap),
      play: new Float32Array(ringCap),
      undo: null,
      writeAbs: 0,
      startAbs: 0,
      targetLen: 0,
      playLen: 0,
      playRead: 0,
      hasUndo: false,
      recording: false,
      armed: false,
      closing: false,
      prevRec: false,
      prevPlay: true,
      prevClear: false,
      prevOverdub: false,
      prevUndo: false
    });
    let shared;
    if (box) {
      let byBox = looperRuntimes.get(state);
      if (!byBox) {
        byBox = /* @__PURE__ */ new WeakMap();
        looperRuntimes.set(state, byBox);
      }
      shared = byBox.get(box);
      if (!shared) {
        shared = { gen: -1, out: 0, start: 0, end: 0, mem: createMem() };
        byBox.set(box, shared);
      }
      if (shared.gen === state.gen) {
        return field === 1 ? shared.start : field === 2 ? shared.end : shared.out;
      }
    }
    const finish = (audio, start = 0, end = 0) => {
      if (shared) {
        shared.gen = state.gen;
        shared.out = audio;
        shared.start = start;
        shared.end = end;
      }
      return field === 1 ? start : field === 2 ? end : audio;
    };
    const input = evalNode(node.inputs.input, state, sampleRate2);
    const rec = evalNode(node.inputs.record, state, sampleRate2) > 0.5;
    const overdub = node.inputs.overdub ? evalNode(node.inputs.overdub, state, sampleRate2) > 0.5 : false;
    const undoGate = node.inputs.undo ? evalNode(node.inputs.undo, state, sampleRate2) > 0.5 : false;
    const threshold = node.inputs.threshold ? Math.max(0, evalNode(node.inputs.threshold, state, sampleRate2)) : 0;
    const quantize = node.inputs.quantize ? Math.round(evalNode(node.inputs.quantize, state, sampleRate2)) : 0;
    const fadeSec = node.inputs.fadeSec ? Math.max(0, evalNode(node.inputs.fadeSec, state, sampleRate2)) : 0;
    const latencySec = node.inputs.latencySec ? Math.max(0, evalNode(node.inputs.latencySec, state, sampleRate2)) : 0;
    const playing = node.inputs.play ? evalNode(node.inputs.play, state, sampleRate2) > 0.5 : true;
    const bars = node.inputs.bars ? Math.max(0, evalNode(node.inputs.bars, state, sampleRate2)) : 0;
    const durationSec = node.inputs.duration ? evalNode(node.inputs.duration, state, sampleRate2) : 0;
    const snapshot = state.transport ?? DEFAULT_TRANSPORT;
    const mem = shared?.mem ?? getMemory(state, node.i, createMem);
    let durationCap = takeCap;
    if (bars > 0 && snapshot.bpm > 0) {
      const quarter = sampleRate2 * 60 / snapshot.bpm;
      durationCap = Math.min(
        takeCap,
        Math.max(2, Math.round(bars * barBeats(snapshot.beatsPerBar, snapshot.beatUnit) * quarter))
      );
    } else if (durationSec > 0) {
      durationCap = Math.min(
        takeCap,
        Math.max(2, Math.ceil(Math.max(durationSec, 1 / sampleRate2) * sampleRate2))
      );
    }
    const fixedLength = bars > 0 || durationSec > 0;
    const cap = mem.ring.length;
    const thisAbs = mem.writeAbs;
    const takeHeld = mem.recording || mem.closing;
    const heldLen = takeHeld ? thisAbs - mem.startAbs : 0;
    const heldCap = mem.closing && mem.targetLen > 0 ? mem.targetLen : durationCap;
    if (!takeHeld || heldLen < heldCap) {
      mem.ring[thisAbs % cap] = input;
    }
    mem.writeAbs += 1;
    const clearing = node.inputs.trigger ? evalNode(node.inputs.trigger, state, sampleRate2) > 0.5 : false;
    if (clearing && !mem.prevClear) {
      mem.play.fill(0);
      if (mem.undo) mem.undo.fill(0);
      mem.playLen = 0;
      mem.playRead = 0;
      mem.hasUndo = false;
      mem.recording = false;
      mem.armed = false;
      mem.closing = false;
      mem.targetLen = 0;
    }
    mem.prevClear = clearing;
    if (undoGate && !mem.prevUndo && mem.hasUndo && mem.undo && mem.playLen > 0) {
      mem.play.set(mem.undo.subarray(0, mem.playLen));
      mem.hasUndo = false;
    }
    mem.prevUndo = undoGate;
    const beginRecord = () => {
      const latencyFrames = Math.min(cap - 1, Math.round(latencySec * sampleRate2));
      mem.startAbs = thisAbs - latencyFrames;
      if (mem.startAbs < mem.writeAbs - cap) mem.startAbs = mem.writeAbs - cap;
      if (mem.startAbs < 0) mem.startAbs = 0;
      mem.recording = true;
      mem.armed = false;
      mem.closing = false;
      mem.targetLen = 0;
      mem.playLen = 0;
      mem.playRead = 0;
      mem.hasUndo = false;
    };
    if (rec && !mem.prevRec) {
      if (threshold > 0) {
        mem.armed = true;
        mem.recording = false;
        mem.closing = false;
        mem.playLen = 0;
        mem.playRead = 0;
        mem.hasUndo = false;
      } else {
        beginRecord();
      }
    }
    mem.prevRec = rec;
    if (mem.armed && !rec) {
      mem.armed = false;
    }
    if (mem.armed && Math.abs(input) >= threshold) {
      beginRecord();
    }
    const quantizeLen = (raw) => {
      const bounded = Math.min(Math.max(raw, 1), durationCap);
      if (quantize <= 0 || !(snapshot.bpm > 0)) return bounded;
      const quarter = sampleRate2 * 60 / snapshot.bpm;
      const beat = quarter * signatureBeatBeats(snapshot.beatUnit);
      const unit = quantize >= 2 ? quarter * barBeats(snapshot.beatsPerBar, snapshot.beatUnit) : beat;
      if (!(unit >= 1)) return bounded;
      const snapped = Math.max(unit, Math.round(bounded / unit) * unit);
      return Math.min(Math.max(1, Math.round(snapped)), durationCap);
    };
    const finalize = (len) => {
      const L = Math.min(Math.max(1, Math.round(len)), durationCap, cap);
      for (let i = 0; i < L; i++) {
        mem.play[i] = mem.ring[(mem.startAbs + i) % cap] ?? 0;
      }
      const fadeN = Math.min(Math.round(fadeSec * sampleRate2), Math.floor(L / 4));
      if (fadeN > 1 && mem.startAbs >= fadeN) {
        for (let j = 0; j < fadeN; j++) {
          const t = (j + 1) / fadeN;
          const gOut = Math.cos(t * 1.5707963267948966);
          const gIn = Math.sin(t * 1.5707963267948966);
          const pre = mem.ring[(mem.startAbs - fadeN + j) % cap] ?? 0;
          const idx = L - fadeN + j;
          mem.play[idx] = (mem.play[idx] ?? 0) * gOut + pre * gIn;
        }
      }
      mem.playLen = L;
      mem.playRead = 0;
      mem.recording = false;
      mem.armed = false;
      mem.closing = false;
      mem.targetLen = 0;
      mem.hasUndo = false;
    };
    if (playing && !mem.prevPlay) {
      if (mem.armed) {
        mem.armed = false;
      } else if (mem.recording || mem.closing) {
        const rawLen = Math.min(thisAbs - mem.startAbs, durationCap);
        if (rawLen >= 1) {
          const target = quantizeLen(rawLen);
          if (target <= rawLen) {
            finalize(target);
          } else {
            mem.recording = false;
            mem.closing = true;
            mem.targetLen = target;
          }
        }
      } else if (mem.playLen > 0) {
        mem.playRead = 0;
      }
    }
    mem.prevPlay = playing;
    if (mem.armed && rec) {
      return finish(input);
    }
    if (mem.recording && rec) {
      const rawLen = thisAbs - mem.startAbs;
      if (fixedLength && rawLen >= durationCap || rawLen >= takeCap) {
        finalize(Math.min(rawLen, durationCap));
      } else {
        return finish(input);
      }
    }
    if (mem.recording && !rec) {
      const rawLen = Math.min(thisAbs - mem.startAbs, durationCap);
      const target = fixedLength && rawLen < durationCap ? durationCap : quantizeLen(rawLen);
      if (target <= rawLen) {
        finalize(target);
      } else {
        mem.recording = false;
        mem.closing = true;
        mem.targetLen = target;
        return finish(input);
      }
    }
    if (mem.closing) {
      if (mem.writeAbs - mem.startAbs >= mem.targetLen) {
        finalize(mem.targetLen);
      } else {
        return finish(input);
      }
    }
    if (overdub && !mem.prevOverdub && mem.playLen > 0) {
      if (!mem.undo || mem.undo.length < mem.playLen) {
        mem.undo = new Float32Array(cap);
      }
      mem.undo.set(mem.play.subarray(0, mem.playLen));
      mem.hasUndo = true;
    }
    mem.prevOverdub = overdub;
    if (mem.playLen <= 0 || !playing) return finish(0);
    if (mem.playRead >= mem.playLen) mem.playRead = 0;
    const atStart = mem.playRead === 0;
    const atEnd = mem.playRead === mem.playLen - 1;
    if (overdub) {
      const mixed = (mem.play[mem.playRead] ?? 0) + input;
      mem.play[mem.playRead] = mixed > 1 ? 1 : mixed < -1 ? -1 : mixed;
    }
    const out = mem.play[mem.playRead] ?? 0;
    mem.playRead = (mem.playRead + 1) % mem.playLen;
    return finish(out, atStart ? 1 : 0, atEnd ? 1 : 0);
  }
  function evalSelect(node, state, sampleRate2) {
    const a = evalNode(node.inputs.a, state, sampleRate2);
    const b = evalNode(node.inputs.b, state, sampleRate2);
    const which = evalNode(node.inputs.which, state, sampleRate2);
    return which > 0.5 ? b : a;
  }
  function evalWaveshape(node, state, sampleRate2) {
    const input = evalNode(node.inputs.input, state, sampleRate2);
    const curve = node.a;
    if (curve.length < 2) return input;
    const t = Math.min(1, Math.max(0, (input + 1) / 2)) * (curve.length - 1);
    const i0 = Math.floor(t);
    const i1 = Math.min(curve.length - 1, i0 + 1);
    const frac = t - i0;
    return curve[i0] * (1 - frac) + curve[i1] * frac;
  }
  function evalBreakpoints(node, state, sampleRate2) {
    const gated = node.inputs.gate ? evalNode(node.inputs.gate, state, sampleRate2) > 0.5 : state.gate;
    const mem = getMemory(state, node.i, () => ({ elapsed: 0, prev: false }));
    if (gated && !mem.prev) mem.elapsed = 0;
    mem.prev = gated;
    if (!gated) return 0;
    mem.elapsed += 1 / sampleRate2;
    const list = node.list;
    if (list && list.length >= 2) {
      let prevT = evalNode(list[0], state, sampleRate2);
      let prevL = evalNode(list[1], state, sampleRate2);
      if (mem.elapsed <= prevT) return prevL;
      for (let i = 2; i + 1 < list.length; i += 2) {
        const t = Math.max(evalNode(list[i], state, sampleRate2), prevT);
        const level = evalNode(list[i + 1], state, sampleRate2);
        if (mem.elapsed <= t) {
          const span = Math.max(t - prevT, 1e-9);
          return prevL + (level - prevL) * ((mem.elapsed - prevT) / span);
        }
        prevT = t;
        prevL = level;
      }
      return prevL;
    }
    const times = node.a;
    const levels = node.b;
    if (times.length === 0 || levels.length === 0) return 0;
    if (mem.elapsed <= times[0]) return levels[0];
    for (let i = 1; i < times.length && i < levels.length; i++) {
      if (mem.elapsed <= times[i]) {
        const span = Math.max(times[i] - times[i - 1], 1e-9);
        const t = (mem.elapsed - times[i - 1]) / span;
        return levels[i - 1] + (levels[i] - levels[i - 1]) * t;
      }
    }
    return levels[Math.min(levels.length, times.length) - 1];
  }
  function evalRms(node, state, sampleRate2) {
    const input = evalNode(node.inputs.input, state, sampleRate2);
    const windowSec = Math.max(evalNode(node.inputs.windowSec, state, sampleRate2), 1 / sampleRate2);
    const mem = getMemory(state, node.i, () => ({
      buf: new Float32Array(Math.max(2, Math.round(windowSec * sampleRate2))),
      idx: 0,
      sum: 0,
      filled: 0
    }));
    const sq = input * input;
    mem.sum += sq - mem.buf[mem.idx];
    mem.buf[mem.idx] = sq;
    mem.idx = (mem.idx + 1) % mem.buf.length;
    mem.filled = Math.min(mem.filled + 1, mem.buf.length);
    return Math.sqrt(Math.max(mem.sum, 0) / mem.filled);
  }
  function evalPeak(node, state, sampleRate2) {
    const input = evalNode(node.inputs.input, state, sampleRate2);
    const release = Math.max(evalNode(node.inputs.release, state, sampleRate2), 1e-5);
    const mem = getMemory(state, node.i, () => ({
      peak: 0,
      k: NaN,
      sr: NaN,
      decay: 0
    }));
    const target = Math.abs(input);
    if (target > mem.peak) mem.peak = target;
    else {
      if (mem.k !== release || mem.sr !== sampleRate2) {
        mem.decay = Math.exp(-1 / (release * sampleRate2));
        mem.k = release;
        mem.sr = sampleRate2;
      }
      mem.peak *= mem.decay;
    }
    return mem.peak;
  }
  function evalOnset(node, state, sampleRate2) {
    const input = evalNode(node.inputs.input, state, sampleRate2);
    const threshold = evalNode(node.inputs.threshold, state, sampleRate2);
    const mem = getMemory(state, node.i, () => ({
      env: 0,
      prev: 0,
      sr: NaN,
      c: 0
    }));
    if (mem.sr !== sampleRate2) {
      mem.c = 1 - Math.exp(-1 / (5e-3 * sampleRate2));
      mem.sr = sampleRate2;
    }
    const target = Math.abs(input);
    mem.env += (target - mem.env) * mem.c;
    const delta = mem.env - mem.prev;
    mem.prev = mem.env;
    return delta > threshold ? 1 : 0;
  }
  function evalPitch(node, state, sampleRate2) {
    const input = evalNode(node.inputs.input, state, sampleRate2);
    const field = node.m;
    const mem = getMemory(state, node.i, () => ({
      ring: new Float32Array(1024),
      write: 0,
      hz: 0,
      midi: 0,
      cents: 0,
      gate: 0
    }));
    const cap = mem.ring.length;
    mem.ring[mem.write % cap] = input;
    mem.write += 1;
    if (mem.write >= cap && mem.write % 512 === 0) {
      let peak = 0;
      let lastSign = 0;
      let first = -1;
      let last = -1;
      let crossings = 0;
      for (let i = 0; i < cap; i++) {
        const sample = mem.ring[(mem.write + i) % cap] ?? 0;
        const mag = sample < 0 ? -sample : sample;
        if (mag > peak) peak = mag;
        const sign = sample > 0 ? 1 : sample < 0 ? -1 : 0;
        if (lastSign < 0 && sign > 0) {
          if (first < 0) first = i;
          last = i;
          crossings += 1;
        }
        if (sign !== 0) lastSign = sign;
      }
      const span = last - first;
      const minPeriod = sampleRate2 / 2e3;
      const maxPeriod = sampleRate2 / 50;
      if (peak >= 0.01 && crossings >= 2 && span > 0) {
        const period = span / (crossings - 1);
        if (period >= minPeriod && period <= maxPeriod) {
          const hz = sampleRate2 / period;
          const midi = 69 + 12 * Math.log2(hz / 440);
          mem.hz = hz;
          mem.midi = midi;
          const nearest = Math.round(midi);
          const cents = (midi - nearest) * 100;
          mem.cents = cents === 50 ? -50 : cents;
          mem.gate = 1;
        } else {
          mem.gate = 0;
        }
      } else {
        mem.gate = 0;
      }
    }
    if (field === 1) return mem.midi;
    if (field === 2) return mem.cents;
    if (field === 3) return mem.gate;
    return mem.hz;
  }
  function evalFilterSlope(node, state, sampleRate2) {
    const input = evalNode(node.inputs.input, state, sampleRate2);
    const cutoff = evalNode(node.inputs.cutoff, state, sampleRate2);
    const poles = node.c;
    const highpass = node.m === 1;
    const mem = getMemory(state, node.i, () => ({
      y: [0, 0, 0, 0],
      k: NaN,
      sr: NaN,
      g: 0
    }));
    if (mem.k !== cutoff || mem.sr !== sampleRate2) {
      const clampedCutoff = Math.min(Math.max(cutoff, 1), sampleRate2 / 2 - 1);
      mem.g = 1 - Math.exp(-2 * Math.PI * clampedCutoff / sampleRate2);
      mem.k = cutoff;
      mem.sr = sampleRate2;
    }
    const g = mem.g;
    let x = input;
    for (let i = 0; i < poles; i++) {
      mem.y[i] += g * (x - mem.y[i]);
      x = highpass ? x - mem.y[i] : mem.y[i];
    }
    return x;
  }
  function evalWavetable(node, state, sampleRate2) {
    const freq = evalNode(node.inputs.freq, state, sampleRate2);
    const table = node.table;
    const n = table.length;
    if (n === 0) return 0;
    const mem = getMemory(state, node.i, () => ({ phase: 0 }));
    const requested = node.c > 0 ? Math.max(1, Math.round(node.c)) : n;
    const frameSize = n >= requested * 2 ? requested : n;
    const frames = Math.max(1, Math.floor(n / frameSize));
    const lookup = (frame) => {
      const base = frame * frameSize;
      const idx = mem.phase * frameSize;
      const i0 = (Math.floor(idx) % frameSize + frameSize) % frameSize;
      const i1 = (i0 + 1) % frameSize;
      const frac = idx - Math.floor(idx);
      return table[base + i0] * (1 - frac) + table[base + i1] * frac;
    };
    let out = lookup(0);
    if (frames > 1 && node.inputs.position) {
      const position = Math.min(1, Math.max(0, evalNode(node.inputs.position, state, sampleRate2)));
      const f = position * (frames - 1);
      const f0 = Math.floor(f);
      const f1 = Math.min(frames - 1, f0 + 1);
      const frac = f - f0;
      out = lookup(f0) * (1 - frac) + lookup(f1) * frac;
    }
    mem.phase = (mem.phase + freq / sampleRate2) % 1;
    return out;
  }
  function evalSamplePlay(node, state, sampleRate2) {
    const rate = evalNode(node.inputs.rate, state, sampleRate2);
    const gated = node.inputs.gate ? evalNode(node.inputs.gate, state, sampleRate2) > 0.5 : state.gate;
    const box = node.params.box;
    const table = box?.samples?.length ? box.samples : node.table;
    const srcRate = box?.sampleRate ?? sampleRate2;
    const last = table.length - 1;
    const startPos = node.inputs.position ? Math.min(1, Math.max(0, evalNode(node.inputs.position, state, sampleRate2))) * Math.max(last, 0) : 0;
    const looping = node.inputs.length ? evalNode(node.inputs.length, state, sampleRate2) > 0.5 : false;
    const pitchSt = node.inputs.pitch ? evalNode(node.inputs.pitch, state, sampleRate2) : 0;
    const mem = getMemory(state, node.i, () => ({
      pos: 0,
      prev: false,
      playing: false
    }));
    if (gated && !mem.prev) {
      mem.pos = startPos;
      mem.playing = table.length > 0;
    }
    mem.prev = gated;
    if (!mem.playing || table.length < 2) return 0;
    if (mem.pos >= last) {
      if (looping && last > startPos) {
        const span = last - startPos;
        mem.pos = startPos + (mem.pos - startPos) % span;
      } else {
        mem.playing = false;
        return 0;
      }
    }
    const i0 = Math.floor(mem.pos);
    const frac = mem.pos - i0;
    const out = table[i0] * (1 - frac) + table[i0 + 1] * frac;
    mem.pos += Math.max(rate, 0) * Math.pow(2, pitchSt / 12) * (srcRate / sampleRate2);
    return out;
  }
  function evalGrain(node, state, sampleRate2) {
    const duration = Math.max(evalNode(node.inputs.duration, state, sampleRate2), 1 / sampleRate2);
    const position = evalNode(node.inputs.position, state, sampleRate2);
    const rate = evalNode(node.inputs.rate, state, sampleRate2);
    const trig = evalNode(node.inputs.trigger, state, sampleRate2);
    const table = node.table;
    const mem = getMemory(state, node.i, () => ({ prev: 0, grains: [] }));
    const rose = trig > 0.5 && mem.prev <= 0.5;
    mem.prev = trig;
    if (rose && table.length > 0) {
      const n = Math.max(2, Math.round(duration * sampleRate2));
      const start = Math.min(Math.max(position, 0), 1) * Math.max(table.length - 1, 0);
      mem.grains.push({ pos: start, i: 0, n, rate: Math.max(rate, 0) });
      if (mem.grains.length > 8) mem.grains.shift();
    }
    let out = 0;
    for (let g = mem.grains.length - 1; g >= 0; g--) {
      const grain = mem.grains[g];
      if (grain.i >= grain.n || table.length === 0) {
        mem.grains.splice(g, 1);
        continue;
      }
      const i0 = Math.floor(grain.pos);
      if (i0 < 0 || i0 >= table.length - 1) {
        mem.grains.splice(g, 1);
        continue;
      }
      const frac = grain.pos - i0;
      const hann = 0.5 * (1 - Math.cos(2 * Math.PI * grain.i / grain.n));
      out += (table[i0] * (1 - frac) + table[i0 + 1] * frac) * hann;
      grain.pos += grain.rate;
      grain.i += 1;
    }
    return out;
  }
  function evalPitchShift(node, state, sampleRate2) {
    const input = evalNode(node.inputs.input, state, sampleRate2);
    const raw = evalNode(node.inputs.pitch, state, sampleRate2);
    const pitch = node.m === 1 ? Math.pow(2, raw / 12) : Math.max(raw, 0.25);
    const grain = Math.max(32, Math.round(0.04 * sampleRate2));
    const mem = getMemory(state, node.i, () => ({
      buf: new Float32Array(grain * 4),
      w: 0,
      ph: 0
    }));
    mem.buf[mem.w] = input;
    const readAt = (offset) => {
      const pos = (mem.w - offset + mem.buf.length * 8) % mem.buf.length;
      const i0 = Math.floor(pos);
      const i1 = (i0 + 1) % mem.buf.length;
      const frac = pos - i0;
      return mem.buf[i0] * (1 - frac) + mem.buf[i1] * frac;
    };
    const hann = (t) => 0.5 * (1 - Math.cos(2 * Math.PI * t));
    const o1 = mem.ph % grain;
    const o2 = (mem.ph + grain / 2) % grain;
    const out = readAt(o1) * hann(o1 / grain) + readAt(o2) * hann(o2 / grain);
    mem.ph = (mem.ph + pitch) % (grain * 2);
    mem.w = (mem.w + 1) % mem.buf.length;
    return out;
  }
  function evalPanLaw(node, state, sampleRate2) {
    const input = evalNode(node.inputs.input, state, sampleRate2);
    const pan = Math.min(1, Math.max(-1, evalNode(node.inputs.pan, state, sampleRate2)));
    const angle = (pan + 1) * Math.PI / 4;
    const gain = node.m === 1 ? Math.sin(angle) : Math.cos(angle);
    return input * gain;
  }
  return {
    sourceSlot: sourceNode ? sourceNode.slot : null,
    seamSlots: seamNodes.map((seam) => seam.slot),
    stereo,
    ports,
    taps,
    drainAnalysis(state) {
      if (taps.length === 0) return null;
      const meters = {};
      if (state.meters) {
        for (const [id, acc] of state.meters) {
          meters[id] = { peak: acc.peak, rms: acc.count > 0 ? Math.sqrt(acc.sumSq / acc.count) : 0 };
          acc.peak = 0;
          acc.sumSq = 0;
          acc.count = 0;
        }
      }
      const captures = {};
      if (state.captures) {
        for (const [id, buffer] of state.captures) {
          const { samples, write, filled } = buffer;
          const linear = new Float32Array(filled ? samples.length : write);
          if (filled) {
            linear.set(samples.subarray(write), 0);
            linear.set(samples.subarray(0, write), samples.length - write);
          } else {
            linear.set(samples.subarray(0, write));
          }
          captures[id] = linear;
        }
      }
      return { meters, captures };
    },
    createState() {
      return {
        values: new Float64Array(slotCount),
        // Stamps start at 0 and \`gen\` at 1, so nothing reads as cached before
        // it has been computed once.
        stamps: new Float64Array(slotCount),
        gen: 1,
        memory: new Array(slotCount).fill(void 0),
        params: {},
        gate: false,
        frameIndex: 0,
        lane: 0
      };
    },
    noteOn(state, params) {
      state.params = { ...state.params, ...params };
      state.gate = true;
    },
    noteOff(state) {
      state.gate = false;
    },
    renderSample(state, sampleRate2) {
      state.gen += 1;
      return evalNode(root, state, sampleRate2);
    },
    renderBlock(state, sampleRate2, out, input, extras) {
      const frames = out.length;
      if (extras?.transport) state.transport = extras.transport;
      if (sourceNode) {
        const processor = state.kernels?.get(sourceNode.slot);
        if (!processor?.processSource) {
          if (sourceNode.m === 2 || !input) {
            out.fill(0);
            extras?.outputR?.fill(0);
          } else {
            out.set(input.subarray(0, frames));
            if (extras?.outputR) extras.outputR.set((extras.inputR ?? input).subarray(0, frames));
          }
          return extras?.outputR !== void 0;
        }
        processor.applyParams?.(state.params);
        let source = input;
        if (!source || source.length < frames) {
          if (!state.sourceScratch || state.sourceScratch.length < frames) {
            state.sourceScratch = new Float32Array(frames);
          } else {
            state.sourceScratch.fill(0);
          }
          if (source) state.sourceScratch.set(source);
          source = state.sourceScratch;
        }
        processor.processSource(source, extras?.inputR ?? null, out, extras?.outputR ?? null);
        return extras?.outputR !== void 0;
      }
      let portBlocks = state.portScratch;
      if (!portBlocks) {
        portBlocks = {};
        for (const name of portScratchKeys) portBlocks[name] = void 0;
        state.portScratch = portBlocks;
      }
      const given = extras?.ports;
      for (const name of portScratchKeys) portBlocks[name] = given?.[name];
      if (input) {
        let pair = state.inputPair;
        if (!pair) {
          pair = [void 0, void 0];
          state.inputPair = pair;
        }
        pair[0] = input;
        pair[1] = extras?.inputR;
        portBlocks[MAIN_PORT] = pair;
      }
      state.portBlocks = portBlocks;
      let boundSeamCount = 0;
      const kernels = state.kernels;
      if (kernels) {
        for (let s = 0; s < seamNodes.length; s++) {
          if (kernels.has(seamNodes[s].slot)) boundSeamCount += 1;
        }
      }
      const scalarInput = writesScalarInput && input ? input : void 0;
      let allInputsMono = mirrorsMonoInput && extras?.inputR === void 0;
      if (allInputsMono && given) {
        for (const name of portScratchKeys) {
          if (given[name]?.[1] !== void 0) {
            allInputsMono = false;
            break;
          }
        }
      }
      if (boundSeamCount === 0) {
        const outR = stereo && !allInputsMono ? extras?.outputR : void 0;
        for (let i = 0; i < frames; i++) {
          state.frameIndex = i;
          state.lane = 0;
          if (scalarInput) state.params.input = scalarInput[i] ?? 0;
          state.gen += 1;
          out[i] = evalNode(root, state, sampleRate2);
          if (outR) {
            state.lane = 1;
            state.gen += 1;
            outR[i] = evalNode(root, state, sampleRate2);
          }
        }
        state.lane = 0;
        state.portBlocks = void 0;
        return outR !== void 0;
      }
      let block = state.seamBlock;
      if (!block) {
        block = { phase: "sample", index: 0, buffers: new Array(slotCount).fill(void 0) };
        state.seamBlock = block;
      }
      for (let s = 0; s < seamNodes.length; s++) {
        const seamNode = seamNodes[s];
        if (!kernels?.has(seamNode.slot)) continue;
        const existing = block.buffers[seamNode.i];
        if (!existing || existing.in.length < frames) {
          block.buffers[seamNode.i] = {
            in: new Float32Array(frames),
            out: new Float32Array(frames)
          };
        }
      }
      block.phase = "collect";
      for (let i = 0; i < frames; i++) {
        block.index = i;
        state.frameIndex = i;
        if (scalarInput) state.params.input = scalarInput[i] ?? 0;
        state.gen += 1;
        evalNode(root, state, sampleRate2);
      }
      for (let s = 0; s < seamNodes.length; s++) {
        const seamNode = seamNodes[s];
        const buffers = block.buffers[seamNode.i];
        const processor = kernels?.get(seamNode.slot);
        if (!buffers || !processor) continue;
        const inputBlock = buffers.in.subarray(0, frames);
        const outputBlock = buffers.out.subarray(0, frames);
        processor.applyParams?.(state.params);
        if (processor.processSeam) processor.processSeam(inputBlock, outputBlock);
        else outputBlock.set(inputBlock);
      }
      block.phase = "apply";
      for (let i = 0; i < frames; i++) {
        block.index = i;
        state.frameIndex = i;
        if (scalarInput) state.params.input = scalarInput[i] ?? 0;
        state.gen += 1;
        out[i] = evalNode(root, state, sampleRate2);
      }
      block.phase = "sample";
      state.portBlocks = void 0;
      return false;
    }
  };
}

// src/dsp/fft.ts
function fftRadix2(re, im, inverse) {
  const n = re.length;
  if (n !== im.length || n < 2 || (n & n - 1) !== 0) {
    throw new RangeError("fftRadix2: re/im must be the same power-of-two length >= 2");
  }
  for (let i = 1, j = 0; i < n; i++) {
    let bit = n >> 1;
    for (; j & bit; bit >>= 1) j ^= bit;
    j ^= bit;
    if (i < j) {
      const tr = re[i];
      const ti = im[i];
      re[i] = re[j];
      im[i] = im[j];
      re[j] = tr;
      im[j] = ti;
    }
  }
  for (let len = 2; len <= n; len <<= 1) {
    const ang = (inverse ? 2 : -2) * Math.PI / len;
    const wLenRe = Math.cos(ang);
    const wLenIm = Math.sin(ang);
    for (let i = 0; i < n; i += len) {
      let wRe = 1;
      let wIm = 0;
      const half = len >> 1;
      for (let k = 0; k < half; k++) {
        const uRe = re[i + k];
        const uIm = im[i + k];
        const vRe = re[i + k + half] * wRe - im[i + k + half] * wIm;
        const vIm = re[i + k + half] * wIm + im[i + k + half] * wRe;
        re[i + k] = uRe + vRe;
        im[i + k] = uIm + vIm;
        re[i + k + half] = uRe - vRe;
        im[i + k + half] = uIm - vIm;
        const nextRe = wRe * wLenRe - wIm * wLenIm;
        wIm = wRe * wLenIm + wIm * wLenRe;
        wRe = nextRe;
      }
    }
  }
  if (inverse) {
    const scale = 1 / n;
    for (let i = 0; i < n; i++) {
      re[i] *= scale;
      im[i] *= scale;
    }
  }
}

// src/dsp/convolver.ts
var IR_PARTITION_SIZE = 512;
var PartitionedConvolver = class {
  partSize = 0;
  fftSize = 0;
  numParts = 0;
  irRe = [];
  irIm = [];
  inRe = [];
  inIm = [];
  history = new Float32Array(0);
  carry = new Float32Array(0);
  carryCount = 0;
  writeIdx = 0;
  outRing = new Float32Array(0);
  ringWrite = 0;
  ringRead = 0;
  ringAvail = 0;
  ready = false;
  get latencySamples() {
    return this.ready ? this.partSize : 0;
  }
  get isReady() {
    return this.ready;
  }
  setup(ir, partSize = IR_PARTITION_SIZE) {
    this.teardown();
    if (ir.length <= 0 || partSize < 32 || (partSize & partSize - 1) !== 0) return;
    this.partSize = partSize;
    this.fftSize = partSize * 2;
    this.numParts = Math.ceil(ir.length / partSize);
    const timeRe = new Float64Array(this.fftSize);
    const timeIm = new Float64Array(this.fftSize);
    this.irRe = [];
    this.irIm = [];
    this.inRe = [];
    this.inIm = [];
    for (let p = 0; p < this.numParts; p++) {
      timeRe.fill(0);
      timeIm.fill(0);
      const offset = p * partSize;
      const count = Math.min(partSize, ir.length - offset);
      for (let i = 0; i < count; i++) timeRe[i] = ir[offset + i];
      fftRadix2(timeRe, timeIm, false);
      this.irRe.push(Float64Array.from(timeRe));
      this.irIm.push(Float64Array.from(timeIm));
      this.inRe.push(new Float64Array(this.fftSize));
      this.inIm.push(new Float64Array(this.fftSize));
    }
    this.history = new Float32Array(partSize);
    this.carry = new Float32Array(partSize);
    this.carryCount = 0;
    this.writeIdx = 0;
    this.outRing = new Float32Array(this.fftSize + partSize);
    this.ringWrite = 0;
    this.ringRead = 0;
    this.ringAvail = 0;
    this.ready = true;
  }
  reset() {
    if (!this.ready) return;
    for (let p = 0; p < this.numParts; p++) {
      this.inRe[p].fill(0);
      this.inIm[p].fill(0);
    }
    this.history.fill(0);
    this.carry.fill(0);
    this.outRing.fill(0);
    this.carryCount = 0;
    this.writeIdx = 0;
    this.ringWrite = 0;
    this.ringRead = 0;
    this.ringAvail = 0;
  }
  process(input, output) {
    const n = output.length;
    if (!this.ready) {
      for (let i = 0; i < n; i++) output[i] = input[i] ?? 0;
      return;
    }
    let consumed = 0;
    while (consumed < n) {
      const toCopy = Math.min(n - consumed, this.partSize - this.carryCount);
      for (let i = 0; i < toCopy; i++) this.carry[this.carryCount + i] = input[consumed + i] ?? 0;
      consumed += toCopy;
      this.carryCount += toCopy;
      if (this.carryCount === this.partSize) {
        this.processPartition(this.carry);
        this.carryCount = 0;
      }
    }
    const drain = Math.min(n, this.ringAvail);
    for (let i = 0; i < drain; i++) {
      output[i] = this.outRing[this.ringRead];
      this.ringRead = (this.ringRead + 1) % this.outRing.length;
    }
    this.ringAvail -= drain;
    if (drain < n) output.fill(0, drain);
  }
  processSample(input) {
    const out = new Float32Array(1);
    this.process([input], out);
    return out[0];
  }
  processPartition(chunk) {
    const P = this.partSize;
    const N = this.fftSize;
    const timeRe = new Float64Array(N);
    const timeIm = new Float64Array(N);
    for (let i = 0; i < P; i++) timeRe[i] = this.history[i];
    for (let i = 0; i < P; i++) timeRe[P + i] = chunk[i];
    this.history.set(chunk);
    fftRadix2(timeRe, timeIm, false);
    this.inRe[this.writeIdx].set(timeRe);
    this.inIm[this.writeIdx].set(timeIm);
    const accRe = new Float64Array(N);
    const accIm = new Float64Array(N);
    for (let p = 0; p < this.numParts; p++) {
      const slot = (this.writeIdx - p + this.numParts) % this.numParts;
      const aRe = this.inRe[slot];
      const aIm = this.inIm[slot];
      const bRe = this.irRe[p];
      const bIm = this.irIm[p];
      for (let i = 0; i < N; i++) {
        accRe[i] += aRe[i] * bRe[i] - aIm[i] * bIm[i];
        accIm[i] += aRe[i] * bIm[i] + aIm[i] * bRe[i];
      }
    }
    fftRadix2(accRe, accIm, true);
    const ringSize = this.outRing.length;
    for (let i = 0; i < P; i++) {
      this.outRing[this.ringWrite] = accRe[P + i];
      this.ringWrite = (this.ringWrite + 1) % ringSize;
    }
    this.ringAvail += P;
    this.writeIdx = (this.writeIdx + 1) % this.numParts;
  }
  teardown() {
    this.ready = false;
    this.irRe = [];
    this.irIm = [];
    this.inRe = [];
    this.inIm = [];
  }
};

// src/renderers/kernels/irKernel.ts
var IR_KERNEL_SLOT = "ir";
function createIrKernel() {
  const conv = new PartitionedConvolver();
  return {
    processSeam(input, output) {
      conv.process(input, output);
    },
    processSeamSample(input) {
      return conv.processSample(input);
    },
    onMessage(message) {
      const msg = message;
      if (msg?.type === "clearIR") {
        conv.setup(new Float32Array(0));
        return { latencySamples: 0 };
      }
      if (msg?.type === "setIR") {
        conv.setup(msg.samples, msg.partSize ?? IR_PARTITION_SIZE);
        return { latencySamples: conv.latencySamples };
      }
      return void 0;
    },
    latencySamples() {
      return conv.latencySamples;
    },
    describe() {
      return { ready: conv.isReady, latencySamples: conv.latencySamples };
    }
  };
}
var irKernelFactory = (_sampleRate, payload) => {
  const kernel = createIrKernel();
  const data = payload;
  if (data?.samples && data.samples.length > 0) {
    kernel.onMessage?.({ type: "setIR", samples: data.samples, partSize: data.partSize });
  }
  return kernel;
};

// src/renderers/kernels/wasmKernel.ts
var WASM_KERNEL_SLOT = "wasm";
var CRATE_KERNEL_ABI_VERSION = 1;
var DEFAULT_MAX_FRAMES = 128;
function kernelImports() {
  return {
    env: {
      abort() {
        throw new Error("crate wasm kernel aborted");
      }
    }
  };
}
function requireFunction(exports, name) {
  if (typeof exports[name] !== "function") {
    throw new Error(\`crate wasm kernel: missing required export "\${name}"\`);
  }
}
var WasmKernel = class {
  constructor(exports, handle, descriptor, maxFrames) {
    this.exports = exports;
    this.handle = handle;
    this.descriptor = descriptor;
    this.maxFrames = maxFrames;
  }
  /** Views onto the module's memory, rebuilt when the module grows it. */
  buffer = null;
  views = /* @__PURE__ */ new Map();
  /**
   * A f32 view of \`frames\` samples at a byte offset, cached per offset. WASM
   * memory growth detaches every existing view, so the cache is dropped
   * whenever the underlying buffer identity changes; without that check a
   * kernel that allocated mid-run would go silent rather than fail.
   */
  view(ptr, frames) {
    if (ptr === 0) return null;
    const memory = this.exports.memory.buffer;
    if (memory !== this.buffer) {
      this.buffer = memory;
      this.views.clear();
    }
    let view = this.views.get(ptr);
    if (!view || view.length < frames) {
      view = new Float32Array(memory, ptr, this.maxFrames);
      this.views.set(ptr, view);
    }
    return view.subarray(0, frames);
  }
  applyParams(params) {
    const map = this.descriptor.params;
    const set = this.exports.crate_set_param;
    if (!map || !set) return;
    for (const name in map) {
      const value = params[name];
      if (value !== void 0) set(this.handle, map[name], value);
    }
  }
  /**
   * Runs the module in \`maxFrames\` chunks. A caller is free to hand crate a
   * longer block than the kernel was initialised for (\`OfflineRenderer\` with
   * a large buffer, a test), and truncating there would drop audio silently.
   */
  run(frames, write) {
    for (let offset = 0; offset < frames; offset += this.maxFrames) {
      write(offset, Math.min(this.maxFrames, frames - offset));
    }
  }
  processSeam(input, output) {
    this.run(output.length, (offset, count) => {
      const into = this.view(this.exports.crate_input_ptr(this.handle, 0), count);
      if (!into) return;
      into.set(input.subarray(offset, offset + count));
      this.exports.crate_process(this.handle, count);
      const from = this.view(this.exports.crate_output_ptr(this.handle, 0), count);
      if (from) output.set(from, offset);
    });
  }
  processSource(inputL, inputR, outputL, outputR) {
    this.run(outputL.length, (offset, count) => {
      const inL = this.view(this.exports.crate_input_ptr(this.handle, 0), count);
      if (inL) inL.set(inputL.subarray(offset, offset + count));
      const inRight = this.view(this.exports.crate_input_ptr(this.handle, 1), count);
      if (inRight) inRight.set((inputR ?? inputL).subarray(offset, offset + count));
      this.exports.crate_process(this.handle, count);
      const outL = this.view(this.exports.crate_output_ptr(this.handle, 0), count);
      if (outL) outputL.set(outL, offset);
      if (outputR) {
        const right = this.view(this.exports.crate_output_ptr(this.handle, 1), count);
        outputR.set(right ?? outL ?? new Float32Array(count), offset);
      }
    });
  }
  noteOn(note, velocity) {
    this.exports.crate_note_on?.(this.handle, note, velocity);
  }
  noteOff(note) {
    this.exports.crate_note_off?.(this.handle, note);
  }
  allNotesOff() {
    this.exports.crate_all_notes_off?.(this.handle);
  }
  controlChange(cc, value) {
    this.exports.crate_control_change?.(this.handle, cc, value);
  }
  setHostBpm(bpm) {
    this.exports.crate_set_bpm?.(this.handle, bpm);
  }
  latencySamples() {
    if (this.exports.crate_latency) return this.exports.crate_latency(this.handle) | 0;
    return this.descriptor.latencySamples ?? 0;
  }
  describe() {
    return {
      portable: true,
      abi: CRATE_KERNEL_ABI_VERSION,
      name: this.descriptor.name ?? null,
      mode: this.descriptor.mode,
      maxFrames: this.maxFrames,
      latencySamples: this.latencySamples()
    };
  }
  dispose() {
    this.exports.crate_dispose?.(this.handle);
    this.views.clear();
    this.buffer = null;
  }
};
function isWasmKernelPayload(payload) {
  const candidate = payload;
  return !!candidate && typeof candidate === "object" && !!candidate.binary && !!candidate.descriptor && typeof candidate.descriptor === "object";
}
var wasmKernelFactory = async (sampleRate2, payload) => {
  if (!isWasmKernelPayload(payload)) {
    throw new Error("crate wasm kernel: payload needs { binary, descriptor }");
  }
  const { binary, descriptor } = payload;
  if (descriptor.abi !== CRATE_KERNEL_ABI_VERSION) {
    throw new Error(
      \`crate wasm kernel: descriptor declares ABI \${String(descriptor.abi)}, this build speaks \${CRATE_KERNEL_ABI_VERSION}\`
    );
  }
  const bytes = binary instanceof Uint8Array ? binary : new Uint8Array(binary);
  const module = await WebAssembly.compile(bytes);
  const instance = await WebAssembly.instantiate(module, kernelImports());
  const exports = instance.exports;
  if (!(exports.memory instanceof WebAssembly.Memory)) {
    throw new Error("crate wasm kernel: module must export its memory");
  }
  for (const name of ["crate_abi_version", "crate_init", "crate_input_ptr", "crate_output_ptr", "crate_process"]) {
    requireFunction(exports, name);
  }
  const typed = exports;
  const moduleAbi = typed.crate_abi_version();
  if (moduleAbi !== CRATE_KERNEL_ABI_VERSION) {
    throw new Error(
      \`crate wasm kernel: module reports ABI \${moduleAbi}, this build speaks \${CRATE_KERNEL_ABI_VERSION}\`
    );
  }
  const maxFrames = Math.max(1, Math.floor(descriptor.maxFrames ?? DEFAULT_MAX_FRAMES));
  const handle = typed.crate_init(sampleRate2, maxFrames);
  if (!handle) {
    throw new Error("crate wasm kernel: crate_init returned 0, meaning it refused to start");
  }
  const kernel = new WasmKernel(typed, handle, descriptor, maxFrames);
  if (payload.params) kernel.applyParams(payload.params);
  return kernel;
};

// src/spatial/distance.ts
var DISTANCE_MODELS = {
  preview: { refDistance: 1, maxDistance: 4, rolloffFactor: 1 },
  webHrtf: { refDistance: 1.5, maxDistance: 100, rolloffFactor: 1 }
};
function distanceAttenuation(distance, model = DISTANCE_MODELS.preview) {
  const clamped = Math.max(model.refDistance, Math.min(model.maxDistance, distance));
  return model.refDistance / (model.refDistance + model.rolloffFactor * (clamped - model.refDistance));
}

// src/spatial/foa.ts
var FOA_W = 1 / Math.SQRT2;
function foaGainsFromDirection(x, y, z) {
  const r = Math.hypot(x, y, z);
  if (!(r > 1e-9)) return { w: FOA_W, y: 0, z: 0, x: 0 };
  return { w: FOA_W, y: x / r, z: y / r, x: -z / r };
}

// src/spatial/worklet/defineFoaEncoder.ts
var FOA_ENCODER_PROCESSOR = "crate-foa-encoder";
var DISTANCE_MODEL_BY_INDEX = [
  DISTANCE_MODELS.preview,
  DISTANCE_MODELS.webHrtf
];
function at(param, i) {
  if (param === void 0 || param.length === 0) return 0;
  return param.length === 1 ? param[0] : param[i];
}
var registered = /* @__PURE__ */ new Set();
function defineCrateFoaEncoder(processorName = FOA_ENCODER_PROCESSOR) {
  if (registered.has(processorName)) return;
  registered.add(processorName);
  class CrateFoaEncoder extends AudioWorkletProcessor {
    static get parameterDescriptors() {
      return [
        // Defaults put a new source at \`NAMED_POSITIONS.center\`: one metre
        // dead ahead. A source that appears at the origin would be
        // omnidirectional, which looks like the node doing nothing.
        { name: "x", defaultValue: 0, minValue: -1e3, maxValue: 1e3, automationRate: "a-rate" },
        { name: "y", defaultValue: 0, minValue: -1e3, maxValue: 1e3, automationRate: "a-rate" },
        { name: "z", defaultValue: -1, minValue: -1e3, maxValue: 1e3, automationRate: "a-rate" },
        { name: "gain", defaultValue: 1, minValue: 0, maxValue: 8, automationRate: "a-rate" },
        // Omnidirectional, rotation-immune: the DAW's "global" track. Not a
        // branch around the encoder but a value through it, so switching it
        // mid-play cannot restructure the graph under the audio thread.
        { name: "global", defaultValue: 0, minValue: 0, maxValue: 1, automationRate: "k-rate" },
        {
          name: "distanceModel",
          defaultValue: 0,
          minValue: 0,
          maxValue: DISTANCE_MODEL_BY_INDEX.length - 1,
          automationRate: "k-rate"
        }
      ];
    }
    process(inputs, outputs, parameters) {
      const output = outputs[0];
      if (!output || output.length < 4) return true;
      const w = output[0];
      const yOut = output[1];
      const zOut = output[2];
      const xOut = output[3];
      const frames = w.length;
      const input = inputs[0];
      const inL = input?.[0];
      const inR = input?.[1];
      const px = parameters.x;
      const py = parameters.y;
      const pz = parameters.z;
      const pGain = parameters.gain;
      const isGlobal = at(parameters.global, 0) >= 0.5;
      const modelIndex = Math.round(at(parameters.distanceModel, 0));
      const model = DISTANCE_MODEL_BY_INDEX[modelIndex] ?? DISTANCE_MODELS.preview;
      if (isGlobal) {
        for (let i = 0; i < frames; i++) {
          const s = monoAt(inL, inR, i) * at(pGain, i);
          w[i] = FOA_W * s;
          yOut[i] = 0;
          zOut[i] = 0;
          xOut[i] = 0;
        }
        return true;
      }
      for (let i = 0; i < frames; i++) {
        const x = at(px, i);
        const y = at(py, i);
        const z = at(pz, i);
        const gains = foaGainsFromDirection(x, y, z);
        const distance = Math.hypot(x, y, z);
        const s = monoAt(inL, inR, i) * at(pGain, i) * distanceAttenuation(distance, model);
        w[i] = gains.w * s;
        yOut[i] = gains.y * s;
        zOut[i] = gains.z * s;
        xOut[i] = gains.x * s;
      }
      return true;
    }
  }
  registerProcessor(processorName, CrateFoaEncoder);
}
function monoAt(left, right, i) {
  if (left === void 0) return 0;
  const l = left[i] ?? 0;
  if (right === void 0) return l;
  return (l + (right[i] ?? 0)) * 0.5;
}

// src/renderers/worklet/defineVoiceProcessor.ts
var CORE_KERNELS = {
  [IR_KERNEL_SLOT]: irKernelFactory,
  [WASM_KERNEL_SLOT]: wasmKernelFactory
};
function defineCrateVoiceProcessor(processorName, kernels = {}) {
  defineCrateFoaEncoder();
  const factories = { ...CORE_KERNELS, ...kernels };
  class CrateVoiceProcessor extends AudioWorkletProcessor {
    voice;
    state;
    /**
     * Which named port each \`inputs[k]\` past the first carries, derived from
     * the graph rather than sent over, so this and \`WebAudioRenderer\` cannot
     * disagree about which input is the sidechain.
     */
    auxPorts;
    /**
     * Messages and notes that arrived before their kernel finished loading.
     * A host legitimately posts "load this impulse response" in the same turn
     * as "load this kernel", and WASM instantiation is async, so dropping
     * them would lose real state.
     */
    pendingMessages = /* @__PURE__ */ new Map();
    pendingMidi = [];
    scheduledMidi = [];
    pendingHostBpm = null;
    /**
     * An anchor, not a stream. The host posts one when something changes and
     * this realm derives the position from its own audio clock, so the
     * musical position costs no messages per block and the two realms cannot
     * drift apart, for the same reason \`transport.play()\` captures one origin.
     */
    transportAnchor = DEFAULT_TRANSPORT_ANCHOR;
    /**
     * How often to post an analysis frame, in Hz. Zero is off and is the
     * default: a tap in a graph nobody reads must cost nothing but its own
     * two operations, and metering every voice at block rate would be 375
     * messages a second each.
     */
    analysisHz = 0;
    nextAnalysisTime = 0;
    /**
     * Scratch reused by \`process\`, because \`process\` runs 375 times a second
     * per voice and a scene has one of these per AudioMaterial slot. Two small
     * objects per block per voice is not much on its own; forty-nine voices
     * making them is a steady drip of garbage onto the one thread that must
     * never pause.
     */
    dueScratch = [];
    auxScratch;
    constructor(options) {
      super(options);
      const { graph } = options?.processorOptions ?? {};
      this.voice = compileVoice(graph);
      this.auxPorts = auxAudioPorts(graph);
      this.state = this.voice.createState();
      this.state.kernels = /* @__PURE__ */ new Map();
      this.port.onmessage = (event) => {
        const msg = event.data;
        switch (msg.type) {
          case "noteOn":
            this.voice.noteOn(this.state, msg.params);
            break;
          case "noteOff":
            this.voice.noteOff(this.state);
            break;
          case "setParam":
            this.state.params[msg.name] = msg.value;
            break;
          case "loadKernel":
            this.loadKernel(msg.slot, msg.payload).catch((err) => {
              this.port.postMessage({ type: "kernelError", slot: msg.slot, message: String(err) });
            });
            break;
          case "kernelMessage": {
            const processor = this.state.kernels?.get(msg.slot);
            if (processor?.onMessage) {
              const reply = processor.onMessage(msg.message);
              if (reply !== void 0) {
                this.port.postMessage({ type: "kernelReply", slot: msg.slot, reply });
              }
            } else {
              const queue = this.pendingMessages.get(msg.slot) ?? [];
              queue.push(msg.message);
              this.pendingMessages.set(msg.slot, queue);
            }
            break;
          }
          case "midiNoteOn":
            this.enqueueMidi({ kind: "on", note: msg.note, velocity: msg.velocity, when: msg.when });
            break;
          case "midiNoteOff":
            this.enqueueMidi({ kind: "off", note: msg.note, when: msg.when });
            break;
          case "midiControlChange":
            this.enqueueMidi({ kind: "cc", cc: msg.cc, value: msg.value, when: msg.when });
            break;
          case "allNotesOff":
            this.scheduledMidi = [];
            this.applyMidi({ kind: "allOff", when: 0 });
            break;
          case "setTransport":
            this.transportAnchor = msg.anchor;
            if (msg.anchor.bpm !== this.pendingHostBpm) {
              this.pendingHostBpm = msg.anchor.bpm;
              this.eachKernel((k) => k.setHostBpm?.(msg.anchor.bpm));
            }
            break;
          case "setHostBpm":
            this.pendingHostBpm = msg.bpm;
            this.eachKernel((k) => k.setHostBpm?.(msg.bpm));
            break;
          case "setAnalysisInterval":
            this.analysisHz = Math.max(0, msg.hz);
            this.nextAnalysisTime = 0;
            break;
        }
      };
    }
    eachKernel(fn) {
      const bound = this.state.kernels;
      if (!bound) return;
      for (const kernel of bound.values()) fn(kernel);
    }
    hasKernels() {
      return (this.state.kernels?.size ?? 0) > 0;
    }
    async loadKernel(slot, payload) {
      const factory = factories[slot] ?? (isWasmKernelPayload(payload) ? wasmKernelFactory : void 0);
      if (!factory) {
        throw new Error(
          \`no kernel registered for slot "\${slot}" in this worklet build, and the payload is not a portable WASM kernel (available: \${Object.keys(factories).join(", ") || "none"})\`
        );
      }
      this.state.kernels?.get(slot)?.dispose?.();
      const processor = await factory(sampleRate, payload);
      this.state.kernels?.set(slot, processor);
      processor.applyParams?.(this.state.params);
      if (this.pendingHostBpm != null) processor.setHostBpm?.(this.pendingHostBpm);
      for (const message of this.pendingMessages.get(slot) ?? []) processor.onMessage?.(message);
      this.pendingMessages.delete(slot);
      const replay = this.pendingMidi;
      this.pendingMidi = [];
      for (const event of replay) this.applyMidi(event);
      this.port.postMessage({
        type: "kernelReady",
        slot,
        latencySamples: processor.latencySamples?.() ?? 0,
        info: processor.describe?.()
      });
    }
    enqueueMidi(event) {
      if (event.when == null || event.when <= currentTime) {
        this.applyMidi(event);
        return;
      }
      const timed = event;
      let i = this.scheduledMidi.length;
      while (i > 0 && this.scheduledMidi[i - 1].when > timed.when) i -= 1;
      this.scheduledMidi.splice(i, 0, timed);
    }
    applyMidi(event) {
      if (!this.hasKernels()) {
        this.pendingMidi.push(event);
        return;
      }
      if (event.kind === "cc") {
        this.eachKernel((k) => k.controlChange?.(event.cc, event.value, this.state.params));
        return;
      }
      if (event.kind === "on") this.eachKernel((k) => k.noteOn?.(event.note, event.velocity));
      else if (event.kind === "off") this.eachKernel((k) => k.noteOff?.(event.note));
      else this.eachKernel((k) => k.allNotesOff?.());
    }
    renderRange(channel0, inputChannel, inputRight, outputRight, aux, start, end, transport) {
      if (end <= start) return false;
      let ports = aux;
      if (aux && start !== 0) {
        const sliced = {};
        for (const [name, channels] of Object.entries(aux)) {
          sliced[name] = channels?.map((channel) => channel?.subarray(start, end));
        }
        ports = sliced;
      }
      return this.voice.renderBlock(
        this.state,
        sampleRate,
        channel0.subarray(start, end),
        inputChannel?.subarray(start, end),
        {
          inputR: inputRight?.subarray(start, end),
          outputR: outputRight?.subarray(start, end),
          ports,
          // Advanced to where this sub-range actually starts. Sample-accurate
          // MIDI splits a block into ranges, and handing each of them the
          // block's own position would restart the musical clock at every
          // note, which is audible as a synced LFO stuttering under a busy
          // MIDI part.
          transport: advanceTransport(transport, start, sampleRate)
        }
      );
    }
    /**
     * Drains taps and kernel polls onto the port, at most \`analysisHz\` times
     * a second. Timed off the audio clock rather than a block counter so the
     * rate a host asks for is the rate it gets whatever the block size is.
     */
    maybePostAnalysis() {
      if (this.analysisHz <= 0) return;
      if (currentTime < this.nextAnalysisTime) return;
      this.nextAnalysisTime = currentTime + 1 / this.analysisHz;
      const frame = this.voice.drainAnalysis(this.state);
      let kernels2;
      const bound = this.state.kernels;
      if (bound) {
        for (const [slot, processor] of bound) {
          const reading = processor.poll?.();
          if (reading !== void 0) (kernels2 ??= {})[slot] = reading;
        }
      }
      if (!frame && !kernels2) return;
      this.port.postMessage({
        type: "analysis",
        time: currentTime,
        meters: frame?.meters ?? {},
        captures: frame?.captures ?? {},
        kernels: kernels2
      });
    }
    process(inputs, outputs) {
      const output = outputs[0];
      const channel0 = output?.[0];
      if (!channel0) return true;
      const inputChannel = inputs[0]?.[0];
      const inputRight = inputs[0]?.[1];
      const hasInput = inputChannel !== void 0 && inputChannel.length === channel0.length;
      const inL = hasInput ? inputChannel : void 0;
      const inR = hasInput ? inputRight : void 0;
      const outR = output[1];
      const frames = channel0.length;
      const blockEnd = currentTime + frames / sampleRate;
      let aux;
      if (this.auxPorts.length > 0) {
        aux = this.auxScratch;
        if (!aux) {
          aux = {};
          for (const name of this.auxPorts) aux[name] = void 0;
          this.auxScratch = aux;
        }
        for (let k = 0; k < this.auxPorts.length; k++) {
          const channels = inputs[k + 1];
          aux[this.auxPorts[k]] = channels && channels.length > 0 ? channels : void 0;
        }
      }
      const due = this.dueScratch;
      due.length = 0;
      for (; ; ) {
        const next = this.scheduledMidi[0];
        if (!next || next.when >= blockEnd) break;
        due.push(this.scheduledMidi.shift());
      }
      const transport = transportAt(this.transportAnchor, currentTime);
      let wroteRight = false;
      if (due.length === 0) {
        wroteRight = this.renderRange(channel0, inL, inR, outR, aux, 0, frames, transport);
      } else {
        let offset = 0;
        for (const event of due) {
          let sample = Math.round((event.when - currentTime) * sampleRate);
          if (sample < offset) sample = offset;
          if (sample > frames) sample = frames;
          wroteRight = this.renderRange(channel0, inL, inR, outR, aux, offset, sample, transport) || wroteRight;
          offset = sample;
          this.applyMidi(event);
        }
        wroteRight = this.renderRange(channel0, inL, inR, outR, aux, offset, frames, transport) || wroteRight;
      }
      this.maybePostAnalysis();
      if (!wroteRight) {
        for (let ch = 1; ch < output.length; ch++) {
          output[ch]?.set(channel0);
        }
      }
      return true;
    }
  }
  registerProcessor(processorName, CrateVoiceProcessor);
}

// src/renderers/worklet/crate-voice-processor.ts
defineCrateVoiceProcessor("crate-voice-processor");
`;function ue(n=de){const e=[];try{e.push(URL.createObjectURL(new Blob([n],{type:"text/javascript"})))}catch{}try{const t=new TextEncoder().encode(n);let a="";for(let o=0;o<t.length;o+=1)a+=String.fromCharCode(t[o]);e.push(`data:text/javascript;base64,${btoa(a)}`)}catch{}try{e.push(`data:text/javascript,${encodeURIComponent(n)}`)}catch{}return e}class he{constructor(e,t={}){this.context=e;const a=t.workletUrl;if(this.workletUrls=a===void 0?ue():Array.isArray(a)?a:[a],this.workletUrls.length===0)throw new Error("crate: no worklet URL could be created. Blob and data URLs both failed, which usually means a Content-Security-Policy blocks them. Serve crate's dist/crate-voice-processor.js yourself and pass its URL as `workletUrl`.");this.processorName=t.processorName??"crate-voice-processor"}modulePromise=null;workletUrls;processorName;loadedWorkletUrl=null;ensureWorkletLoaded(){return this.ensureModuleLoaded()}ensureModuleLoaded(){return this.modulePromise||(this.modulePromise=this.loadModule()),this.modulePromise}async loadModule(){if(!this.context.audioWorklet)throw new Error("crate: this AudioContext has no audioWorklet. AudioWorklet requires a secure context (https or localhost).");const e=[];for(const t of this.workletUrls)try{await this.context.audioWorklet.addModule(t),this.loadedWorkletUrl=t;return}catch(a){const o=t.slice(0,t.indexOf(":")+1)||t,r=a instanceof Error?`${a.name}: ${a.message}`:String(a);e.push(`${o||"url"} ${r}`)}throw new Error(`crate: no worklet URL was accepted (${this.workletUrls.length} tried).
  `+e.join(`
  `))}async createVoice(e){await this.ensureModuleLoaded();const t=U(e),a=new AudioWorkletNode(this.context,this.processorName,{numberOfInputs:1+t.length,numberOfOutputs:1,outputChannelCount:[2],channelCount:2,channelCountMode:"explicit",processorOptions:{graph:e}}),o=this.context.createConstantSource();o.offset.value=0,o.connect(a),o.start(),a.port.start();const r=(l,u=8e3)=>new Promise((h,g)=>{const f=b=>{clearTimeout(A),a.port.removeEventListener("message",R),b()},R=b=>{b.data?.slot===l&&(b.data.type==="kernelReady"?f(()=>h()):b.data.type==="kernelError"&&f(()=>g(new Error(b.data.message??`kernel "${l}" failed`))))},A=setTimeout(()=>{f(()=>g(new Error(`kernel "${l}" load timed out`)))},u);a.port.addEventListener("message",R)});return{node:a,driver:o,auxInputs:t,inputIndexFor:l=>{if(l==="input")return 0;const u=t.indexOf(l);if(u===-1)throw new RangeError(`voice has no audio input "${l}" (has: ${["input",...t].join(", ")})`);return u+1},noteOn:l=>a.port.postMessage({type:"noteOn",params:l}),noteOff:()=>a.port.postMessage({type:"noteOff"}),setParam:(l,u)=>a.port.postMessage({type:"setParam",name:l,value:u}),loadKernel:(l,u)=>{const h=r(l);return a.port.postMessage({type:"loadKernel",slot:l,payload:u}),h},sendKernel:(l,u)=>a.port.postMessage({type:"kernelMessage",slot:l,message:u}),midiNoteOn:(l,u,h)=>a.port.postMessage({type:"midiNoteOn",note:l,velocity:u,when:h}),midiNoteOff:(l,u)=>a.port.postMessage({type:"midiNoteOff",note:l,when:u}),midiControlChange:(l,u,h)=>a.port.postMessage({type:"midiControlChange",cc:l,value:u,when:h}),allNotesOff:()=>a.port.postMessage({type:"allNotesOff"}),setHostBpm:l=>a.port.postMessage({type:"setHostBpm",bpm:l}),setTransport:l=>a.port.postMessage({type:"setTransport",anchor:l}),setAnalysisInterval:l=>a.port.postMessage({type:"setAnalysisInterval",hz:l}),onAnalysis:l=>{const u=h=>{h.data?.type==="analysis"&&l(h.data)};return a.port.addEventListener("message",u),()=>a.port.removeEventListener("message",u)}}}}const fe=2048,ge={meter(n,e={}){return new c(p("meter",{input:s(n)},{id:e.id??"meter"}))},capture(n,e={}){return new c(p("capture",{input:s(n)},{id:e.id??"capture",windowSize:Math.max(1,Math.floor(e.windowSize??fe))}))}},G=new WeakMap,ve=24;function Y(n,e){let t=G.get(n);return t||(t=new he(n,e?{workletUrl:e}:{}),G.set(n,t)),t}class be{constructor(e,t,a){this.audio=e,this.voice=t,this.context=a}set(e,t){return this.voice.setParam(e,t),this}setAll(e){for(const t in e)this.voice.setParam(t,e[t]);return this}noteOn(e={}){return this.voice.noteOn(e),this}noteOff(){return this.voice.noteOff(),this}strike(e={}){return this.voice.noteOff(),this.strikeTimer!==void 0&&clearTimeout(this.strikeTimer),this.strikeTimer=setTimeout(()=>{this.strikeTimer=void 0,!this.disposed&&this.voice.noteOn(e)},ve),this}strikeTimer;setVolume(e){return this.audio.setVolume(e),this}rampVolume(e,t=.08){const a=this.audio.gain.gain,o=this.context.currentTime;return a.cancelScheduledValues(o),a.setValueAtTime(a.value,o),a.linearRampToValueAtTime(e,o+Math.max(t,1/1e3)),this}onAnalysis(e,t=20){const a=this.voice.onAnalysis(e);this.readers.set(a,t),this.voice.setAnalysisInterval(this.fastestReader());let o=!1;return()=>{o||(o=!0,this.readers.delete(a),this.voice.setAnalysisInterval(this.fastestReader()),a())}}readers=new Map;fastestReader(){let e=0;for(const t of this.readers.values())t>e&&(e=t);return e}dispose(){if(this.disposed)return;this.disposed=!0;const e=t=>{try{t()}catch{}};this.strikeTimer!==void 0&&(clearTimeout(this.strikeTimer),this.strikeTimer=void 0),e(()=>this.voice.noteOff()),e(()=>this.voice.driver?.stop()),e(()=>this.audio.disconnect()),e(()=>this.voice.node.disconnect())}disposed=!1}async function X(n,e,t={},a=globalThis.THREE){if(!a?.Audio)throw new Error("crate-xr: no THREE namespace. Pass one, or load this inside XR Publisher.");const o=n.context,r=e instanceof S?e:null,l=e instanceof S?e.graph:e,u=await Y(o,t.workletUrl).createVoice(l),h={...r?.snapshotParams(),...t.params};for(const f in h)u.setParam(f,h[f]);const g=t.positional===!1?new a.Audio(n):new a.PositionalAudio(n);if(g.setNodeSource(u.node),g.setVolume(t.volume??1),g.setRefDistance){const f=t.spatial??{};g.setRefDistance(f.refDistance??6),g.setRolloffFactor?.(f.rolloffFactor??1.2),g.setMaxDistance?.(f.maxDistance??60),g.setDistanceModel?.(f.distanceModel??"inverse")}return new be(g,u,o)}const Q=[1,2.76,5.4],Z=new S({name:"ResonantStone",params:{pitch:w.range(90,1400,{default:220,unit:"Hz",curve:"log"}),wind:w.range(0,1,{default:.25}),brightness:w.range(0,1,{default:.5}),ring:w.range(4,90,{default:34,curve:"log"}),grain:w.range(180,2600,{default:900,unit:"Hz",curve:"log"}),grainRatio:w.range(1.31,4.77,{default:2.19})},automatable:["wind","brightness","pitch"],polyphony:1,channels:1,graph:({velocity:n,params:e})=>{const t=e.grain,a=I(L(x({rate:t.mul(.0037)}),{freq:t}).mul(.5),L(x({rate:t.mul(.0121)}),{freq:t.mul(e.grainRatio)}).mul(.32),L(x({rate:t.mul(.0053),shape:"triangle"}),{freq:t.mul(e.grainRatio).mul(1.61)}).mul(.18)),o=I(x({rate:.073,shape:"triangle"}).mul(.6),x({rate:.031}).mul(.4)).range(0,1).mul(e.wind),r=te.adsr({a:5e-4,d:.35,s:0,r:.35}).trigger(n),l=se().mul(n).mul(10).add(a.mul(r).mul(.8)),u=a.mul(o).add(l),h=e.brightness,g=I(_.svf(u,{cutoff:e.pitch,q:e.ring,mode:"bandpass"}),_.svf(u,{cutoff:e.pitch.mul(Q[1]),q:e.ring.mul(.8),mode:"bandpass"}).mul(h.mul(.55)),_.svf(u,{cutoff:e.pitch.mul(Q[2]),q:e.ring.mul(.6),mode:"bandpass"}).mul(h.mul(h).mul(.3))),f=ae(g.mul(.5),{drive:1.6});return ge.meter(f,{id:"stone"})}}),k="crate-stones",C=(()=>{const n=typeof navigator<"u"?navigator.hardwareConcurrency??4:8;return typeof matchMedia=="function"&&matchMedia("(pointer: coarse)").matches||n<=4?4:n<=8?8:12})(),T=42,Re=250,J=[0,3,5,7,10],ye=146.83;typeof window<"u"&&(window.CrateXR??={createCrateAudio:X,resonantStoneMaterial:Z,version:1},(()=>{let n=!1;const e=()=>new Promise(a=>{const o=()=>!!window.XRPublisher&&!!window.THREE;if(o()){a();return}let r=0;const l=setInterval(()=>{(o()||r++>200)&&(clearInterval(l),a())},50)}),t=async()=>{if(n)return;await e();const a=window.XRPublisher,o=window.THREE;if(!a||!o){console.error(`[${k}] runtime not available`);return}n=!0;let r=null;const l=()=>r?!0:(r=a.getAudioListener(),r&&console.log(`[${k}] audio listener acquired`),!!r);if(!l()){const i=setInterval(()=>{l()&&clearInterval(i)},500);for(const m of["pointerdown","touchend","keydown"])window.addEventListener(m,()=>l(),{passive:!0})}const u=o,h=new u.IcosahedronGeometry(.55,1),g=new u.MeshStandardMaterial({color:4869975,roughness:.85,metalness:.15,emissive:3135170,emissiveIntensity:0,flatShading:!0});let f=null;const R=new Set,A=(i,m,v)=>Math.hypot(i.position.x-m,i.position.z-v),b=i=>{const m=a.getWeatherAt?.(i.position.x,i.position.z),v=m?.speed??.1,d=m?.rain??0;return Math.max(0,Math.min(1,.42+v*1.8+d*.4))},we=async i=>{if(!(i.audio||i.claiming||!r)){i.claiming=!0;try{const m=await X(r,Z,{params:{...i.params,wind:b(i)},volume:0,spatial:{refDistance:7,rolloffFactor:1.1,maxDistance:T}},o);if(!R.has(i)){m.dispose();return}i.object.add(m.audio),i.audio=m,m.rampVolume(1,.6),i.stopAnalysis=m.onAnalysis(v=>{i.level=v.meters.stone?.peak??0},15)}catch(m){f=m instanceof Error?`${m.name}: ${m.message}`:String(m),console.warn(`[${k}] voice failed`,m);try{i.audio?.dispose()}catch{}i.audio=null,i.stopAnalysis=null}finally{i.claiming=!1}}},ee=i=>{try{i.stopAnalysis?.(),i.audio&&i.object.remove(i.audio.audio),i.audio?.dispose()}catch(m){console.warn(`[${k}] release failed`,m)}finally{i.stopAnalysis=null,i.audio=null,i.level=0,i.material.emissiveIntensity=0}},ke=setInterval(()=>{if(!r)return;const i=a.getPlayerState();if(!i)return;const m=[...R].map(d=>({stone:d,distance:A(d,i.x,i.z)})).filter(d=>d.distance<=T).sort((d,y)=>d.distance-y.distance).slice(0,C),v=new Set(m.map(d=>d.stone));for(const d of R)d.audio&&!v.has(d)&&ee(d);for(const{stone:d}of m)try{d.audio?d.audio.set("wind",b(d)):we(d)}catch(y){console.warn(`[${k}] pool tick failed for a stone`,y)}},Re);window.addEventListener("pagehide",()=>clearInterval(ke),{once:!0}),a.registerDecoration({name:"crate-resonant-stone",density:1.6,minSpacing:11,minHeight:.5,maxHeight:.72,maxSlope:.4,surface:["grass","dirt","rock"],collision:"cuboid",interactable:!0,interactionPrompt:"Strike the stone",interactionRadius:3.5,create(i){const m=J[Math.floor(i.rng()*J.length)],v=Math.floor(i.rng()*3),d=.7+i.rng()*1.5,y=g.clone(),E=new u.Mesh(h,y);E.scale.setScalar(d);const ne={object:E,material:y,params:{pitch:ye*Math.pow(2,m/12+v)/d,brightness:Math.max(.1,1-(d-.7)/1.5)*(.5+i.rng()*.5),ring:18+i.rng()*55,grain:260+i.rng()*1800,grainRatio:1.4+i.rng()*3.2},position:{x:i.renderPosition[0],z:i.renderPosition[2]},audio:null,claiming:!1,stopAnalysis:null,level:0};return E.userData.crateStone=ne,R.add(ne),E},update(i){const m=i.userData.crateStone;if(!m)return;const v=m.audio?Math.min(1,m.level*6):0,d=v>m.material.emissiveIntensity?.5:.06;m.material.emissiveIntensity+=(v-m.material.emissiveIntensity)*d},onInteract(i){i.object.userData.crateStone?.audio?.strike({velocity:.85})},dispose(i){const m=i.userData.crateStone;m&&(ee(m),R.delete(m),m.material.dispose())}}),window.CrateXR.stats=()=>{const i=a.getPlayerState(),m=[...R].map(d=>({x:Math.round(d.position.x),z:Math.round(d.position.z),distance:i?Math.round(A(d,i.x,i.z)):null,voiced:!!d.audio,wind:Number(b(d).toFixed(2)),pitch:Math.round(d.params.pitch)}));m.sort((d,y)=>(d.distance??1e9)-(y.distance??1e9));const v={stonesMounted:m.length,listener:!!r,audioContextState:r?.context.state??"none",voiceBudget:C,lastVoiceError:f,workletUrl:r?(Y(r.context).loadedWorkletUrl??"none loaded").slice(0,60):"no listener",voicesLive:m.filter(d=>d.voiced).length,audibleRadius:T,player:i?{x:Math.round(i.x),z:Math.round(i.z)}:null,nearest:m.slice(0,5)};return console.table(v.nearest),v},console.log(`[${k}] ready: crate AudioMaterials on THREE.PositionalAudio (voice budget ${C}). Run CrateXR.stats() to diagnose.`)};document.readyState==="loading"?document.addEventListener("DOMContentLoaded",()=>void t()):setTimeout(()=>void t(),300)})())}));
