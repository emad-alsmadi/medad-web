/** Sample rate the Arabic Vosk model expects. */
export const VOSK_SAMPLE_RATE = 16000;

/**
 * Linear-interpolation resampler from the browser's native AudioContext
 * rate down to 16 kHz. Keeps a remainder buffer across calls so chunk
 * boundaries don't introduce clicks/drift — pass the previous call's
 * returned remainder back in on the next call.
 */
export function downsampleTo16k(
  input: Float32Array,
  inputRate: number,
  remainder: Float32Array,
): { output: Float32Array; remainder: Float32Array } {
  if (inputRate === VOSK_SAMPLE_RATE) {
    return { output: input, remainder: new Float32Array(0) };
  }

  const merged = new Float32Array(remainder.length + input.length);
  merged.set(remainder);
  merged.set(input, remainder.length);

  const ratio = inputRate / VOSK_SAMPLE_RATE;
  const outCount = Math.floor(merged.length / ratio);
  const output = new Float32Array(outCount);

  for (let i = 0; i < outCount; i++) {
    const src = i * ratio;
    const idx = Math.floor(src);
    const frac = src - idx;
    const a = merged[idx];
    const b = merged[Math.min(idx + 1, merged.length - 1)];
    output[i] = a + (b - a) * frac;
  }

  const consumed = Math.floor(outCount * ratio);
  return { output, remainder: merged.slice(consumed) };
}

/** Convert Float32 [-1, 1] samples to 16-bit signed PCM, as Vosk expects. */
export function floatTo16BitPCM(float32: Float32Array): Int16Array {
  const pcm = new Int16Array(float32.length);
  for (let i = 0; i < float32.length; i++) {
    const s = Math.max(-1, Math.min(1, float32[i]));
    pcm[i] = s < 0 ? s * 0x8000 : s * 0x7fff;
  }
  return pcm;
}
