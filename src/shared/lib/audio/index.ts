let ctx: AudioContext | null = null;

function getContext(): AudioContext {
  if (!ctx) {
    ctx = new AudioContext();
  }
  return ctx;
}

function playChime(notes: number[], volume: number, noteGap = 0.14) {
  const audio = getContext();
  if (audio.state === 'suspended') {
    void audio.resume();
  }
  const now = audio.currentTime;
  const peak = 0.14 * volume;
  if (peak <= 0) return;

  notes.forEach((freq, i) => {
    const osc = audio.createOscillator();
    const gain = audio.createGain();
    const start = now + i * noteGap;

    osc.type = 'sine';
    osc.frequency.value = freq;

    gain.gain.setValueAtTime(0, start);
    gain.gain.linearRampToValueAtTime(peak, start + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.6);

    osc.connect(gain);
    gain.connect(audio.destination);
    osc.start(start);
    osc.stop(start + 0.65);
  });
}

export function playWorkEndChime(volume = 0.5) {
  playChime([523.25, 659.25, 783.99], volume);
}

export function playBreakEndChime(volume = 0.5) {
  playChime([659.25, 523.25], volume, 0.18);
}
