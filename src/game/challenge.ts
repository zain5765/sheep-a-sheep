import { createPRNG, todaySeed } from './rng';

const DAILY_CLEAR_KEY = 'sheep_daily_clears';

export function dailyChallengeSeed(date = todaySeed()): string {
  return `daily-${date}`;
}

export function challengeShareSeed(seed: string): string {
  // Short code for URLs — keep readable
  return seed.replace(/^daily-/, 'd-').replace(/[^a-zA-Z0-9\-]/g, '');
}

export function parseChallengeFromUrl(): { seed: string; kind: 'daily' | 'friend' } | null {
  try {
    const hash = location.hash.replace(/^#/, '');
    const params = new URLSearchParams(hash.includes('=') ? hash : '');
    const q = new URLSearchParams(location.search);
    const raw = params.get('c') || params.get('challenge') || q.get('c') || q.get('challenge');
    if (!raw) return null;
    const seed = raw.startsWith('d-') ? `daily-${raw.slice(2)}` : raw;
    const kind = seed.startsWith('daily-') ? 'daily' : 'friend';
    return { seed, kind };
  } catch {
    return null;
  }
}

export function clearChallengeFromUrl(): void {
  try {
    if (location.hash.includes('c=') || location.hash.includes('challenge=')) {
      history.replaceState(null, '', location.pathname + location.search);
    }
    if (location.search.includes('c=') || location.search.includes('challenge=')) {
      const u = new URL(location.href);
      u.searchParams.delete('c');
      u.searchParams.delete('challenge');
      history.replaceState(null, '', u.pathname + u.search + u.hash);
    }
  } catch {
    /* ignore */
  }
}

export function buildChallengeUrl(seed: string): string {
  const code = challengeShareSeed(seed);
  const base = typeof location !== 'undefined' ? `${location.origin}${location.pathname}` : '';
  return `${base}#c=${encodeURIComponent(code)}`;
}

function loadDailyClears(): Record<string, boolean> {
  try {
    return JSON.parse(localStorage.getItem(DAILY_CLEAR_KEY) || '{}');
  } catch {
    return {};
  }
}

export function isDailyCleared(date = todaySeed()): boolean {
  return !!loadDailyClears()[date];
}

export function markDailyCleared(date = todaySeed()): void {
  const map = loadDailyClears();
  map[date] = true;
  localStorage.setItem(DAILY_CLEAR_KEY, JSON.stringify(map));
}

/** Fake-but-lively clear counts that drift each day (feels “live”). */
export function liveRankBase(country: string, region: string, index: number): number {
  const rng = createPRNG(`${todaySeed()}|${country}|${region}`);
  const wave = Math.floor(rng() * 900) + Math.floor(rng() * 400);
  return Math.max(600, 22000 - index * 1600 - (region.length % 9) * 70 + wave);
}
