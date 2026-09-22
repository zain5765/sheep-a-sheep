import { computeClickable, generateBoard, shuffleTypes } from './board';
import {
  clearChallengeFromUrl,
  dailyChallengeSeed,
  isDailyCleared,
  liveRankBase,
  markDailyCleared,
  parseChallengeFromUrl,
} from './challenge';
import {
  COUNTRIES,
  HOLD_SIZE,
  LEVELS,
  MAX_SLOTS,
  findCountryForProvince,
  teamKey,
  type CountryId,
  type RegionId,
} from './config';
import { todaySeed } from './rng';
import { SlotManager } from './slots';
import type { GameStatus, LevelConfig, Screen, TileData } from './types';

export type PropKind = 'undo' | 'shuffle' | 'remove';
export type PlayMode = 'normal' | 'daily' | 'challenge';

export interface RankRow {
  region: string;
  clears: number;
  you?: boolean;
}

export interface GameState {
  screen: Screen;
  level: LevelConfig;
  levelIndex: number;
  tiles: TileData[];
  clickable: Map<number, boolean>;
  slots: readonly TileData[];
  hold: readonly TileData[];
  status: GameStatus;
  seed: string;
  remaining: number;
  total: number;
  undoLeft: number;
  shuffleLeft: number;
  removeLeft: number;
  reviveLeft: number;
  country: CountryId | null;
  region: RegionId | null;
  ranks: RankRow[];
  tryCount: number;
  mode: PlayMode;
  dailyCleared: boolean;
  pendingChallenge: { seed: string; kind: 'daily' | 'friend' } | null;
}

const COUNTRY_KEY = 'sheep_country';
const REGION_KEY = 'sheep_region';
const RANK_KEY = 'sheep_ranks';

function loadRanks(): Record<string, number> {
  try {
    return JSON.parse(localStorage.getItem(RANK_KEY) || '{}');
  } catch {
    return {};
  }
}

function saveRanks(map: Record<string, number>): void {
  localStorage.setItem(RANK_KEY, JSON.stringify(map));
}

function loadSavedTeam(): { country: CountryId | null; region: RegionId | null } {
  const savedCountry = localStorage.getItem(COUNTRY_KEY) as CountryId | null;
  const savedRegion = localStorage.getItem(REGION_KEY) as RegionId | null;
  if (savedCountry && savedCountry in COUNTRIES) {
    const provinces = COUNTRIES[savedCountry] as readonly string[];
    if (savedRegion && provinces.includes(savedRegion)) {
      return { country: savedCountry, region: savedRegion };
    }
    return { country: savedCountry, region: null };
  }
  if (savedRegion) {
    const country = findCountryForProvince(savedRegion);
    if (country) return { country, region: savedRegion };
  }
  return { country: null, region: null };
}

export class Game {
  private screen: Screen = 'menu';
  private levelIndex = 0;
  private tiles: TileData[] = [];
  private slots = new SlotManager();
  private status: GameStatus = 'menu';
  private seed = todaySeed();
  private undoLeft = 0;
  private shuffleLeft = 0;
  private removeLeft = 0;
  private reviveLeft = 1;
  private country: CountryId | null;
  private region: RegionId | null;
  private tryCount = 0;
  private mode: PlayMode = 'normal';
  private pendingChallenge: { seed: string; kind: 'daily' | 'friend' } | null = null;
  private listeners = new Set<() => void>();

  constructor() {
    const saved = loadSavedTeam();
    this.country = saved.country;
    this.region = saved.region;
    this.pendingChallenge = parseChallengeFromUrl();
  }

  subscribe(fn: () => void): () => void {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  }

  private emit(): void {
    for (const fn of this.listeners) fn();
  }

  private get level(): LevelConfig {
    return LEVELS[this.levelIndex] ?? LEVELS[0];
  }

  getRanks(): RankRow[] {
    const map = loadRanks();
    const country = this.country ?? 'China';
    const provinces = COUNTRIES[country] as readonly RegionId[];

    const seeded: RankRow[] = provinces.slice(0, 12).map((region, i) => {
      const key = teamKey(country, region);
      return {
        region,
        clears: (map[key] || 0) + liveRankBase(country, region, i),
      };
    });

    if (this.region && this.country) {
      const key = teamKey(this.country, this.region);
      const yours = seeded.find((r) => r.region === this.region);
      if (yours) {
        yours.you = true;
      } else {
        seeded.push({
          region: this.region,
          clears: (map[key] || 0) + liveRankBase(this.country, this.region, 6),
          you: true,
        });
      }
    }
    return seeded.sort((a, b) => b.clears - a.clears);
  }

  getState(): GameState {
    const remaining = this.tiles.filter((t) => !t.removed && !t.inSlot).length;
    return {
      screen: this.screen,
      level: this.level,
      levelIndex: this.levelIndex,
      tiles: this.tiles,
      clickable: computeClickable(this.tiles),
      slots: this.slots.items,
      hold: this.slots.holdItems,
      status: this.status,
      seed: this.seed,
      remaining,
      total: this.tiles.length,
      undoLeft: this.undoLeft,
      shuffleLeft: this.shuffleLeft,
      removeLeft: this.removeLeft,
      reviveLeft: this.reviveLeft,
      country: this.country,
      region: this.region,
      ranks: this.getRanks(),
      tryCount: this.tryCount,
      mode: this.mode,
      dailyCleared: isDailyCleared(),
      pendingChallenge: this.pendingChallenge,
    };
  }

  setCountry(country: CountryId): void {
    this.country = country;
    localStorage.setItem(COUNTRY_KEY, country);
    this.region = null;
    localStorage.removeItem(REGION_KEY);
    this.emit();
  }

  setRegion(region: RegionId): void {
    if (!this.country) return;
    const provinces = COUNTRIES[this.country] as readonly string[];
    if (!provinces.includes(region)) return;
    this.region = region;
    localStorage.setItem(REGION_KEY, region);
    this.emit();
  }

  goMenu(): void {
    this.screen = 'menu';
    this.status = 'menu';
    this.mode = 'normal';
    this.emit();
  }

  goRank(): void {
    this.screen = 'rank';
    this.status = 'menu';
    this.emit();
  }

  dismissPendingChallenge(): void {
    this.pendingChallenge = null;
    clearChallengeFromUrl();
    this.emit();
  }

  acceptPendingChallenge(): boolean {
    if (!this.pendingChallenge) return false;
    if (!this.country || !this.region) return false;
    const { seed, kind } = this.pendingChallenge;
    this.pendingChallenge = null;
    clearChallengeFromUrl();
    if (kind === 'daily') this.startDaily();
    else this.startChallenge(seed);
    return true;
  }

  startGame(): void {
    this.mode = 'normal';
    this.seed = todaySeed();
    this.tryCount = 0;
    this.beginLevel(0);
  }

  /** Today's hell board — same for everyone (original daily vibe). */
  startDaily(): void {
    this.mode = 'daily';
    this.seed = dailyChallengeSeed();
    this.tryCount = 0;
    this.beginLevel(1);
  }

  /** Friend / shared seed — Level 2 only. */
  startChallenge(seed: string): void {
    this.mode = 'challenge';
    this.seed = seed;
    this.tryCount = 0;
    this.beginLevel(1);
  }

  private beginLevel(index: number): void {
    this.levelIndex = index;
    this.screen = 'game';
    this.tryCount += 1;
    const { tiles } = generateBoard(this.level, `${this.seed}-t${this.tryCount}`);
    this.tiles = tiles;
    this.slots.clear();
    this.status = 'playing';
    this.undoLeft = 0;
    this.shuffleLeft = 0;
    this.removeLeft = 0;
    this.reviveLeft = 1;
    this.emit();
  }

  unlockProp(kind: PropKind): void {
    if (kind === 'undo' && this.undoLeft < 1) this.undoLeft = 1;
    if (kind === 'shuffle' && this.shuffleLeft < 1) this.shuffleLeft = 1;
    if (kind === 'remove' && this.removeLeft < 1) this.removeLeft = 1;
    this.emit();
  }

  clickTile(uid: number): {
    ok: boolean;
    matched: boolean;
    won: boolean;
    lost: boolean;
    pendingClearUids: number[];
  } {
    const fail = { ok: false, matched: false, won: false, lost: false, pendingClearUids: [] as number[] };
    if (this.status !== 'playing') return fail;
    const tile = this.tiles.find((t) => t.uid === uid);
    if (!tile || tile.removed || tile.inSlot) return fail;
    if (!computeClickable(this.tiles).get(uid)) return fail;

    const result = this.slots.add(tile, { deferClear: true });
    if (!result.success) return fail;

    const pending = result.pendingClearUids;
    if (pending.length > 0) {
      this.emit();
      return { ok: true, matched: true, won: false, lost: false, pendingClearUids: pending };
    }

    return this.finishAfterAdd(result.isFull);
  }

  commitMatchClears(): { won: boolean; lost: boolean } {
    this.slots.commitPendingClears();
    return this.applyEndState();
  }

  private onWin(): void {
    if (this.mode === 'daily') markDailyCleared();
    if ((this.mode !== 'normal' || this.levelIndex >= 1) && this.region && this.country) {
      const map = loadRanks();
      const key = teamKey(this.country, this.region);
      map[key] = (map[key] || 0) + 1;
      saveRanks(map);
    }
  }

  private applyEndState(): { won: boolean; lost: boolean } {
    const remaining = this.tiles.filter((t) => !t.removed && !t.inSlot).length;
    let won = false;
    let lost = false;
    if (remaining === 0 && this.slots.length === 0) {
      this.status = 'won';
      won = true;
      this.onWin();
    } else if (this.slots.length >= MAX_SLOTS) {
      this.status = 'lost';
      lost = true;
    }
    this.emit();
    return { won, lost };
  }

  private finishAfterAdd(isFull: boolean): {
    ok: boolean;
    matched: boolean;
    won: boolean;
    lost: boolean;
    pendingClearUids: number[];
  } {
    const remaining = this.tiles.filter((t) => !t.removed && !t.inSlot).length;
    let won = false;
    let lost = false;
    if (remaining === 0 && this.slots.length === 0) {
      this.status = 'won';
      won = true;
      this.onWin();
    } else if (isFull || this.slots.length >= MAX_SLOTS) {
      this.status = 'lost';
      lost = true;
    }
    this.emit();
    return { ok: true, matched: false, won, lost, pendingClearUids: [] };
  }

  undoLeave(): TileData[] | null {
    if (this.status !== 'playing' || this.undoLeft <= 0 || !this.slots.canUndo()) return null;
    const leaving = this.slots.undo(this.tiles);
    if (!leaving || leaving.length === 0) return null;
    this.undoLeft -= 1;
    return leaving;
  }

  emitState(): void {
    this.emit();
  }

  undo(): boolean {
    const leaving = this.undoLeave();
    if (!leaving) return false;
    this.emit();
    return true;
  }

  shuffle(): boolean {
    if (this.status !== 'playing' || this.shuffleLeft <= 0) return false;
    shuffleTypes(this.tiles, this.seed);
    this.shuffleLeft -= 1;
    this.emit();
    return true;
  }

  removeProp(): boolean {
    if (this.status !== 'playing' || this.removeLeft <= 0) return false;
    if (this.slots.moveToHold(HOLD_SIZE).length === 0) return false;
    this.removeLeft -= 1;
    this.emit();
    return true;
  }

  revive(): void {
    if (this.status !== 'lost' || this.reviveLeft <= 0) return;
    this.slots.moveToHold(HOLD_SIZE);
    this.reviveLeft -= 1;
    this.status = 'playing';
    this.emit();
  }

  nextLevel(): void {
    if (this.mode !== 'normal') {
      this.goMenu();
      return;
    }
    if (this.levelIndex < LEVELS.length - 1) this.beginLevel(this.levelIndex + 1);
    else this.goMenu();
  }

  restart(): void {
    this.beginLevel(this.levelIndex);
  }
}
