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

// A short filtered noise burst - used for card taps and, layered, for a shuffle.
function noiseBurst(audio: AudioContext, duration: number, volume: number, filterFreq: number) {
  const bufferSize = Math.max(1, Math.floor(audio.sampleRate * duration));
  const buffer = audio.createBuffer(1, bufferSize, audio.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) {
    data[i] = (Math.random() * 2 - 1) * (1 - i / bufferSize);
  }
  const source = audio.createBufferSource();
  source.buffer = buffer;
  const filter = audio.createBiquadFilter();
  filter.type = 'bandpass';
  filter.frequency.value = filterFreq;
  filter.Q.value = 0.7;
  const gain = audio.createGain();
  gain.gain.value = volume;
  source.connect(filter).connect(gain).connect(audio.destination);
  source.start();
}

export function playCardSound() {
  if (muted) return;
  const audio = getCtx();
  if (!audio) return;
  noiseBurst(audio, 0.055, 0.32, 2400);
}

export function playShuffleSound() {
  if (muted) return;
  const audio = getCtx();
  if (!audio) return;
  for (let i = 0; i < 9; i++) {
    setTimeout(() => {
      if (muted) return;
      noiseBurst(audio, 0.06, 0.16, 1700 + Math.random() * 900);
    }, i * 75);
  }
}

export function playTrumpSound() {
  if (muted) return;
  const audio = getCtx();
  if (!audio) return;
  const notes = [523.25, 659.25, 783.99]; // C5, E5, G5
  notes.forEach((freq, i) => {
    setTimeout(() => {
      if (muted) return;
      const osc = audio.createOscillator();
      const gain = audio.createGain();
      osc.type = 'triangle';
      osc.frequency.value = freq;
      osc.connect(gain).connect(audio.destination);
      const now = audio.currentTime;
      gain.gain.setValueAtTime(0.0001, now);
      gain.gain.exponentialRampToValueAtTime(0.22, now + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.35);
      osc.start(now);
      osc.stop(now + 0.4);
    }, i * 110);
  });
}
