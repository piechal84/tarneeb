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

// A lowpass-filtered noise burst with a smooth decay curve - warmer/rounder than a raw bandpass click.
function noiseBurst(audio: AudioContext, duration: number, volume: number, filterFreq: number) {
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
  filter.type = 'lowpass';
  filter.frequency.value = filterFreq;
  filter.Q.value = 0.5;
  const gain = audio.createGain();
  gain.gain.value = volume;
  source.connect(filter).connect(gain).connect(audio.destination);
  source.start();
}

// Matches the trick card's 0.32s entrance animation so the sound rings for exactly as long as the card is in flight.
const CARD_SOUND_DURATION = 0.32;

// A bright, papery snap - like a card flicked down onto felt - not a pitched drum hit.
export function playCardSound() {
  if (muted) return;
  const audio = getCtx();
  if (!audio) return;

  const bufferSize = Math.floor(audio.sampleRate * CARD_SOUND_DURATION);
  const buffer = audio.createBuffer(1, bufferSize, audio.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) {
    const t = i / audio.sampleRate;
    // Very fast exponential decay - almost all the energy is in the first ~30ms "flick",
    // with a faint papery tail rather than a sustained tone.
    const envelope = Math.exp(-t * 32);
    data[i] = (Math.random() * 2 - 1) * envelope;
  }
  const source = audio.createBufferSource();
  source.buffer = buffer;

  const highpass = audio.createBiquadFilter();
  highpass.type = 'highpass';
  highpass.frequency.value = 900;

  const bandpass = audio.createBiquadFilter();
  bandpass.type = 'bandpass';
  bandpass.frequency.value = 3200;
  bandpass.Q.value = 0.7;

  const gain = audio.createGain();
  gain.gain.value = 0.5;

  source.connect(highpass).connect(bandpass).connect(gain).connect(audio.destination);
  source.start();
}

export function playShuffleSound() {
  if (muted) return;
  const audio = getCtx();
  if (!audio) return;
  for (let i = 0; i < 9; i++) {
    setTimeout(() => {
      if (muted) return;
      noiseBurst(audio, 0.1, 0.15, 700 + Math.random() * 500);
    }, i * 75);
  }
}

export function playTrumpSound() {
  if (muted) return;
  const audio = getCtx();
  if (!audio) return;
  const notes = [261.63, 329.63, 392.0]; // C4, E4, G4 - an octave lower and warmer than before
  notes.forEach((freq, i) => {
    setTimeout(() => {
      if (muted) return;
      const osc = audio.createOscillator();
      const filter = audio.createBiquadFilter();
      const gain = audio.createGain();
      osc.type = 'sine';
      osc.frequency.value = freq;
      filter.type = 'lowpass';
      filter.frequency.value = 1800;
      osc.connect(filter).connect(gain).connect(audio.destination);
      const now = audio.currentTime;
      gain.gain.setValueAtTime(0.0001, now);
      gain.gain.exponentialRampToValueAtTime(0.24, now + 0.03);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.45);
      osc.start(now);
      osc.stop(now + 0.5);
    }, i * 130);
  });
}
