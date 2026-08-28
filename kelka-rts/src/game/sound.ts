let ctx: AudioContext | null = null;
let muted = false;

function getCtx(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!Ctor) return null;
  if (!ctx) ctx = new Ctor();
  if (ctx.state === 'suspended') void ctx.resume();
  return ctx;
}

export function setMuted(value: boolean) {
  muted = value;
}

export function isMuted() {
  return muted;
}

function tone(freq: number, duration: number, volume: number, type: OscillatorType = 'sine') {
  if (muted) return;
  const audio = getCtx();
  if (!audio) return;
  const osc = audio.createOscillator();
  const gain = audio.createGain();
  osc.type = type;
  osc.frequency.value = freq;
  osc.connect(gain).connect(audio.destination);
  const now = audio.currentTime;
  gain.gain.setValueAtTime(0.0001, now);
  gain.gain.exponentialRampToValueAtTime(volume, now + 0.02);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);
  osc.start(now);
  osc.stop(now + duration + 0.02);
}

function noiseBurst(duration: number, volume: number, filterFreq: number, type: BiquadFilterType = 'lowpass') {
  if (muted) return;
  const audio = getCtx();
  if (!audio) return;
  const bufferSize = Math.max(1, Math.floor(audio.sampleRate * duration));
  const buffer = audio.createBuffer(1, bufferSize, audio.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) {
    const decay = (1 - i / bufferSize) ** 2;
    data[i] = (Math.random() * 2 - 1) * decay;
  }
  const source = audio.createBufferSource();
  source.buffer = buffer;
  const filter = audio.createBiquadFilter();
  filter.type = type;
  filter.frequency.value = filterFreq;
  const gain = audio.createGain();
  gain.gain.value = volume;
  source.connect(filter).connect(gain).connect(audio.destination);
  source.start();
}

export function playPlantSound() {
  tone(520, 0.12, 0.15, 'triangle');
}

export function playHarvestSound() {
  tone(660, 0.08, 0.18, 'sine');
  setTimeout(() => tone(880, 0.1, 0.14, 'sine'), 60);
}

export function playHatchSound() {
  tone(392, 0.1, 0.2, 'square');
  setTimeout(() => tone(523, 0.15, 0.18, 'square'), 90);
}

export function playMergeSound() {
  [329.63, 415.3, 523.25, 659.25].forEach((freq, i) => {
    setTimeout(() => tone(freq, 0.22, 0.16, 'sine'), i * 70);
  });
}

export function playAttackSound() {
  noiseBurst(0.08, 0.12, 2400, 'bandpass');
}

export function playDeathSound() {
  noiseBurst(0.25, 0.16, 400, 'lowpass');
}

export function playAlarmSound() {
  tone(220, 0.3, 0.22, 'sawtooth');
  setTimeout(() => tone(196, 0.35, 0.22, 'sawtooth'), 250);
}
