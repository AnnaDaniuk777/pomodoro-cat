const LOW_HZ = 40;
const HIGH_HZ = 14000;

let context: AudioContext | null = null;
let source: MediaElementAudioSourceNode | null = null;
let analyser: AnalyserNode | null = null;
let bins: Uint8Array<ArrayBuffer> | null = null;
let unavailable = false;

export function attachSpectrum(audio: HTMLAudioElement) {
  if (unavailable) return;
  if (context) {
    void context.resume();
    return;
  }
  try {
    context = new AudioContext();
    source = context.createMediaElementSource(audio);
    analyser = context.createAnalyser();
    analyser.fftSize = 1024;
    analyser.smoothingTimeConstant = 0.62;
    analyser.minDecibels = -78;
    analyser.maxDecibels = -18;
    source.connect(analyser);
    analyser.connect(context.destination);
    bins = new Uint8Array(analyser.frequencyBinCount);
    void context.resume();
  } catch {
    unavailable = true;
    context = null;
    source = null;
    analyser = null;
    bins = null;
  }
}

export function getAudioGraph() {
  if (!context || !source) return null;
  return { context, source };
}

export function readSpectrum(bars: number, out: number[]): boolean {
  if (!analyser || !bins || !context) return false;
  const data = bins;
  analyser.getByteFrequencyData(data);

  const nyquist = context.sampleRate / 2;
  const span = HIGH_HZ / LOW_HZ;
  const toBin = (hz: number) =>
    Math.min(data.length - 1, Math.round((hz / nyquist) * data.length));

  for (let i = 0; i < bars; i += 1) {
    const from = toBin(LOW_HZ * span ** (i / bars));
    const to = Math.max(from + 1, toBin(LOW_HZ * span ** ((i + 1) / bars)));
    let sum = 0;
    let taken = 0;
    for (let j = from; j < to && j < data.length; j += 1) {
      sum += data[j];
      taken += 1;
    }
    const average = taken ? sum / taken : 0;
    const tilt = 1 + (i / bars) * 0.5;
    const normalised = Math.min(1, (average / 255) * tilt);
    out[i] = normalised ** 1.35;
  }
  return true;
}
