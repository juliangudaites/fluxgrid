let audioCtx: AudioContext | null = null;

function getContext(): AudioContext | null {
  try {
    if (!audioCtx) {
      audioCtx = new AudioContext();
    }
    return audioCtx;
  } catch {
    return null;
  }
}

export function playTransmitSound(): void {
  const ctx = getContext();
  if (!ctx) return;

  if (ctx.state === 'suspended') {
    void ctx.resume();
  }

  const now = ctx.currentTime;

  const master = ctx.createGain();
  master.gain.setValueAtTime(0.35, now);
  master.connect(ctx.destination);

  const sweep = ctx.createOscillator();
  const sweepGain = ctx.createGain();
  sweep.type = 'sawtooth';
  sweep.frequency.setValueAtTime(90, now);
  sweep.frequency.exponentialRampToValueAtTime(640, now + 0.12);
  sweep.frequency.exponentialRampToValueAtTime(180, now + 0.38);
  sweepGain.gain.setValueAtTime(0.0001, now);
  sweepGain.gain.exponentialRampToValueAtTime(0.22, now + 0.02);
  sweepGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.42);
  sweep.connect(sweepGain);
  sweepGain.connect(master);
  sweep.start(now);
  sweep.stop(now + 0.45);

  const ping = ctx.createOscillator();
  const pingGain = ctx.createGain();
  ping.type = 'sine';
  ping.frequency.setValueAtTime(880, now + 0.08);
  ping.frequency.exponentialRampToValueAtTime(2200, now + 0.18);
  pingGain.gain.setValueAtTime(0.0001, now + 0.08);
  pingGain.gain.exponentialRampToValueAtTime(0.18, now + 0.1);
  pingGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.32);
  ping.connect(pingGain);
  pingGain.connect(master);
  ping.start(now + 0.08);
  ping.stop(now + 0.35);

  const bufferSize = Math.floor(ctx.sampleRate * 0.06);
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) {
    data[i] = (Math.random() * 2 - 1) * (1 - i / bufferSize);
  }
  const noise = ctx.createBufferSource();
  noise.buffer = buffer;
  const filter = ctx.createBiquadFilter();
  filter.type = 'bandpass';
  filter.frequency.value = 2400;
  filter.Q.value = 0.8;
  const noiseGain = ctx.createGain();
  noiseGain.gain.setValueAtTime(0.12, now);
  noiseGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.08);
  noise.connect(filter);
  filter.connect(noiseGain);
  noiseGain.connect(master);
  noise.start(now);

  const sub = ctx.createOscillator();
  const subGain = ctx.createGain();
  sub.type = 'triangle';
  sub.frequency.setValueAtTime(55, now);
  sub.frequency.exponentialRampToValueAtTime(40, now + 0.25);
  subGain.gain.setValueAtTime(0.0001, now);
  subGain.gain.exponentialRampToValueAtTime(0.14, now + 0.03);
  subGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.3);
  sub.connect(subGain);
  subGain.connect(master);
  sub.start(now);
  sub.stop(now + 0.32);
}