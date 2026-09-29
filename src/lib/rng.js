// Deterministic PRNG so the demo dataset is identical on every seed.
export function mulberry32(seed) {
  let a = seed >>> 0
  return function () {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}
export const pick = (rnd, arr) => arr[Math.floor(rnd() * arr.length)]
export const int = (rnd, min, max) => min + Math.floor(rnd() * (max - min + 1))
