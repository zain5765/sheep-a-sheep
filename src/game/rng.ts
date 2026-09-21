/** Deterministic PRNG from a string seed (same idea as daily layouts). */
export function createPRNG(seed: string): () => number {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = (Math.imul(31, hash) + seed.charCodeAt(i)) | 0;
  }
  return () => {
    hash = (Math.imul(hash, 1664525) + 1013904223) | 0;
    return (hash >>> 0) / 0x100000000;
  };
}

export function todaySeed(): string {
  return new Date().toISOString().slice(0, 10);
}

export function shuffleInPlace<T>(arr: T[], rng: () => number): T[] {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}
