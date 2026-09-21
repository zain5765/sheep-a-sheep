/** Procedural SFX pack — tap / match / fail / win / props / UI / ambience. */

let ctx: AudioContext | null = null;
let ambientNodes: { stop: () => void } | null = null;

function ac(): AudioContext | null {
  try {
    if (!ctx) ctx = new AudioContext();
    if (ctx.state === 'suspended') void ctx.resume();
    return ctx;
  } catch {
    return null;
  }
}

function tone(
  freq: number,
  duration: number,
  type: OscillatorType = 'sine',
  gain = 0.08,
  slideTo?: number,
  delay = 0,
): void {
  if (typeof localStorage !== 'undefined' && localStorage.getItem('sheep_mute') === '1') return;
  const audio = ac();
  if (!audio) return;
  const t0 = audio.currentTime + delay;
  const osc = audio.createOscillator();
  const g = audio.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t0);
  if (slideTo != null) {
    osc.frequency.exponentialRampToValueAtTime(Math.max(1, slideTo), t0 + duration);
  }
  g.gain.setValueAtTime(0.0001, t0);
  g.gain.exponentialRampToValueAtTime(gain, t0 + 0.012);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + duration);
  osc.connect(g);
  g.connect(audio.destination);
  osc.start(t0);
  osc.stop(t0 + duration + 0.03);
}

function noiseBurst(duration: number, gain = 0.04): void {
  if (typeof localStorage !== 'undefined' && localStorage.getItem('sheep_mute') === '1') return;
  const audio = ac();
  if (!audio) return;
  const n = Math.floor(audio.sampleRate * duration);
  const buf = audio.createBuffer(1, n, audio.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < n; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / n);
  const src = audio.createBufferSource();
  const g = audio.createGain();
  const filter = audio.createBiquadFilter();
  filter.type = 'bandpass';
  filter.frequency.value = 1200;
  src.buffer = buf;
  g.gain.value = gain;
  src.connect(filter);
  filter.connect(g);
  g.connect(audio.destination);
  src.start();
}

export const sfx = {
  unlock(): void {
    ac();
  },
  ui(): void {
    tone(700, 0.04, 'triangle', 0.035);
  },
  tap(): void {
    tone(540, 0.05, 'triangle', 0.07);
    noiseBurst(0.03, 0.015);
  },
  land(): void {
    tone(320, 0.07, 'sine', 0.05);
  },
  match(): void {
    tone(660, 0.07, 'sine', 0.07);
    tone(880, 0.09, 'sine', 0.06, undefined, 0.05);
    tone(1175, 0.12, 'triangle', 0.05, undefined, 0.1);
    noiseBurst(0.06, 0.02);
  },
  fail(): void {
    tone(240, 0.18, 'sawtooth', 0.045, 110);
    tone(180, 0.28, 'triangle', 0.04, 70, 0.08);
  },
  win(): void {
    const notes = [523, 659, 784, 1046, 1175];
    notes.forEach((f, i) => tone(f, 0.14, i % 2 ? 'triangle' : 'sine', 0.065, undefined, i * 0.09));
  },
  levelClear(): void {
    tone(784, 0.12, 'sine', 0.06);
    tone(988, 0.16, 'triangle', 0.055, undefined, 0.1);
  },
  prop(): void {
    tone(420, 0.07, 'square', 0.035);
    tone(640, 0.09, 'square', 0.03, undefined, 0.05);
  },
  remove(): void {
    tone(500, 0.06, 'triangle', 0.05, 720);
    tone(720, 0.08, 'triangle', 0.04, undefined, 0.05);
  },
  undo(): void {
    tone(480, 0.07, 'sine', 0.05, 300);
  },
  shuffle(): void {
    for (let i = 0; i < 5; i++) {
      tone(280 + i * 40, 0.045, 'triangle', 0.035, undefined, i * 0.035);
    }
    noiseBurst(0.1, 0.02);
  },
  revive(): void {
    tone(400, 0.1, 'sine', 0.05);
    tone(600, 0.12, 'sine', 0.05, undefined, 0.08);
    tone(800, 0.14, 'triangle', 0.045, undefined, 0.16);
  },
  startAmbience(): void {
    if (typeof localStorage !== 'undefined' && localStorage.getItem('sheep_mute') === '1') return;
    const audio = ac();
    if (!audio || ambientNodes) return;
    const osc = audio.createOscillator();
    const g = audio.createGain();
    const lfo = audio.createOscillator();
    const lfoGain = audio.createGain();
    osc.type = 'sine';
    osc.frequency.value = 110;
    lfo.frequency.value = 0.12;
    lfoGain.gain.value = 8;
    lfo.connect(lfoGain);
    lfoGain.connect(osc.frequency);
    g.gain.value = 0.012;
    osc.connect(g);
    g.connect(audio.destination);
    osc.start();
    lfo.start();
    ambientNodes = {
      stop: () => {
        try {
          osc.stop();
          lfo.stop();
        } catch {
          /* ignore */
        }
        ambientNodes = null;
      },
    };
  },
  stopAmbience(): void {
    ambientNodes?.stop();
  },
};
