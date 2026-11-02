// Deterministic randomness. Packet loss must be reproducible so a shared link
// or a test always shows the same journey. See docs/decisions/0013-seeded-packet-loss.md.

/** FNV-1a 32-bit hash of a string. */
export function hash(input: string): number {
  let h = 0x811c9dc5
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i)
    h = Math.imul(h, 0x01000193)
  }
  return h >>> 0
}

/** Mulberry32: a small, fast seeded PRNG returning floats in [0, 1). */
export function createRng(seed: number): () => number {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/** A deterministic hex string of `bytes` bytes, for example values like random nonces. */
export function hexFrom(seed: number, bytes: number): string {
  const rng = createRng(seed)
  let out = ''
  for (let i = 0; i < bytes; i++) out += Math.floor(rng() * 256).toString(16).padStart(2, '0')
  return out
}
