// The Golden Ladle — sound: every effect and the little kitchen tune are
// synthesised with WebAudio, so the game ships no audio files at all.
// Audio starts only after the player's first click or keypress (browsers
// require a gesture), and the M key mutes everything.

let ctx = null;
let muted = false;
let musicTimer = null;
let musicStep = 0;

// A warm little waltz in C major: bass notes and a whistling melody.
const MELODY = [72, 76, 79, 76, 74, 76, 79, 84, 79, 76, 74, 72, 67, 72, 76, 79];
const BASS = [48, 55, 48, 55, 53, 55, 48, 55, 53, 55, 48, 55, 50, 55, 53, 55];

export function ensureAudio() {
  if (ctx) { if (ctx.state === 'suspended') ctx.resume(); return; }
  try {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    ctx = new AC();
    startMusic();
  } catch { ctx = null; }
}

export function toggleMute() { muted = !muted; return muted; }
export function isMuted() { return muted; }

function tone(freq, when, dur, type, vol, slideTo) {
  if (!ctx || muted) return;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, when);
  if (slideTo) osc.frequency.exponentialRampToValueAtTime(slideTo, when + dur);
  gain.gain.setValueAtTime(0.0001, when);
  gain.gain.exponentialRampToValueAtTime(vol, when + 0.015);
  gain.gain.exponentialRampToValueAtTime(0.0001, when + dur);
  osc.connect(gain).connect(ctx.destination);
  osc.start(when);
  osc.stop(when + dur + 0.05);
}

function noiseBurst(when, dur, vol, filterFreq) {
  if (!ctx || muted) return;
  const len = Math.max(1, Math.floor(ctx.sampleRate * dur));
  const buf = ctx.createBuffer(1, len, ctx.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < len; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / len);
  const src = ctx.createBufferSource();
  src.buffer = buf;
  const filter = ctx.createBiquadFilter();
  filter.type = 'bandpass';
  filter.frequency.value = filterFreq;
  const gain = ctx.createGain();
  gain.gain.value = vol;
  src.connect(filter).connect(gain).connect(ctx.destination);
  src.start(when);
}

export function playSound(name) {
  if (!ctx || muted) return;
  const t = ctx.currentTime;
  if (name === 'pickup') tone(520, t, 0.08, 'sine', 0.18, 700);
  else if (name === 'place') tone(330, t, 0.09, 'triangle', 0.2, 260);
  else if (name === 'chop') { noiseBurst(t, 0.07, 0.5, 1800); tone(180, t, 0.06, 'square', 0.08); }
  else if (name === 'sizzle') noiseBurst(t, 0.5, 0.12, 5200);
  else if (name === 'ding') { tone(880, t, 0.35, 'sine', 0.22); tone(1318, t + 0.08, 0.4, 'sine', 0.16); }
  else if (name === 'coin') { tone(988, t, 0.1, 'sine', 0.2); tone(1319, t + 0.09, 0.25, 'sine', 0.2); }
  else if (name === 'error') tone(160, t, 0.18, 'sawtooth', 0.12, 110);
  else if (name === 'order') { tone(659, t, 0.12, 'triangle', 0.18); tone(784, t + 0.1, 0.18, 'triangle', 0.18); }
  else if (name === 'burn') { noiseBurst(t, 0.4, 0.3, 900); tone(220, t, 0.3, 'sawtooth', 0.1, 90); }
  else if (name === 'rush') { tone(523, t, 0.12, 'triangle', 0.2); tone(659, t + 0.12, 0.12, 'triangle', 0.2); tone(784, t + 0.24, 0.22, 'triangle', 0.22); }
}

function startMusic() {
  if (musicTimer) return;
  musicTimer = setInterval(() => {
    if (!ctx || muted || ctx.state !== 'running') return;
    const t = ctx.currentTime + 0.02;
    const step = musicStep % 16;
    tone(440 * Math.pow(2, (MELODY[step] - 69) / 12), t, 0.32, 'sine', 0.05);
    if (step % 2 === 0) tone(440 * Math.pow(2, (BASS[step] - 69) / 12), t, 0.5, 'triangle', 0.06);
    musicStep++;
  }, 300);
}
