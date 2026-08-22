let context: AudioContext | null = null;
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
    const source = context.createMediaElementSource(audio);
    analyser = context.createAnalyser();
    analyser.fftSize = 512;
    analyser.smoothingTimeConstant = 0.8;
    source.connect(analyser);
    analyser.connect(context.destination);
    bins = new Uint8Array(analyser.frequencyBinCount);
    void context.resume();
  } catch {
    unavailable = true;
    context = null;
    analyser = null;
    bins = null;
  }
}

export function readSpectrum(bars: number, out: number[]): boolean {
  if (!analyser || !bins) return false;
  analyser.getByteFrequencyData(bins);
  const usable = Math.floor(bins.length * 0.62);
  for (let i = 0; i < bars; i += 1) {
    const from = Math.floor((i / bars) ** 1.7 * usable);
    const to = Math.max(
      from + 1,
      Math.floor(((i + 1) / bars) ** 1.7 * usable),
    );
    let peak = 0;
    for (let j = from; j < to && j < bins.length; j += 1) {
      if (bins[j] > peak) peak = bins[j];
    }
    const trebleBoost = 1 + (i / bars) * 1.4;
    out[i] = Math.min(1, (peak / 255) * trebleBoost);
  }
  return true;
}
