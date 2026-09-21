import { computeClickable, generateBoard, shuffleTypes } from './board';
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
  private listeners = new Set<() => void>();

  constructor() {
    const saved = loadSavedTeam();
    this.country = saved.country;
    this.region = saved.region;
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

    // Seed a lively board for the selected country
    const seeded: RankRow[] = provinces.slice(0, 8).map((region, i) => {
      const key = teamKey(country, region);
      const base = 18000 - i * 1400 - (region.length % 7) * 80;
      return {
        region,
        clears: (map[key] || 0) + Math.max(800, base),
      };
    });

    if (this.region && this.country) {
      const key = teamKey(this.country, this.region);
      const yours = seeded.find((r) => r.region === this.region);
      if (yours) {
        yours.you = true;
        yours.clears = (map[key] || 0) + (yours.clears - (map[key] || 0));
      } else {
        seeded.push({
          region: this.region,
          clears: (map[key] || 0) + 4200,
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
    this.emit();
  }

  goRank(): void {
    this.screen = 'rank';
    this.status = 'menu';
    this.emit();
  }

  startGame(): void {
    this.seed = todaySeed();
    this.tryCount = 0;
    this.beginLevel(0);
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

  clickTile(uid: number): void {
    if (this.status !== 'playing') return;
    const tile = this.tiles.find((t) => t.uid === uid);
    if (!tile || tile.removed || tile.inSlot) return;
    if (!computeClickable(this.tiles).get(uid)) return;

    const result = this.slots.add(tile);
    if (!result.success) return;

    const remaining = this.tiles.filter((t) => !t.removed && !t.inSlot).length;
    if (remaining === 0 && this.slots.length === 0) {
      this.status = 'won';
      if (this.levelIndex >= 1 && this.region && this.country) {
        const map = loadRanks();
        const key = teamKey(this.country, this.region);
        map[key] = (map[key] || 0) + 1;
        saveRanks(map);
      }
    } else if (result.isFull || this.slots.length >= MAX_SLOTS) {
      this.status = 'lost';
    }
    this.emit();
  }

  undo(): boolean {
    if (this.status !== 'playing' || this.undoLeft <= 0 || !this.slots.canUndo()) return false;
    if (!this.slots.undo(this.tiles)) return false;
    this.undoLeft -= 1;
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
    if (this.levelIndex < LEVELS.length - 1) this.beginLevel(this.levelIndex + 1);
    else this.goMenu();
  }

  restart(): void {
    this.beginLevel(this.levelIndex);
  }
}
