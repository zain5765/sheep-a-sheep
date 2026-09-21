import { computeClickable, generateBoard, shuffleTypes } from './board';
import { HOLD_SIZE, LEVELS, MAX_SLOTS, type RegionId } from './config';
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
  region: RegionId | null;
  ranks: RankRow[];
  tryCount: number;
}

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
  private region: RegionId | null =
    (localStorage.getItem(REGION_KEY) as RegionId | null) || null;
  private tryCount = 0;
  private listeners = new Set<() => void>();

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
    // Seed fake competition so board looks alive
    const seeded: RankRow[] = [
      { region: 'Punjab', clears: (map['Punjab'] || 0) + 1284 },
      { region: 'California', clears: (map['California'] || 0) + 1102 },
      { region: 'Sindh', clears: (map['Sindh'] || 0) + 976 },
      { region: 'Texas', clears: (map['Texas'] || 0) + 901 },
      { region: 'New York', clears: (map['New York'] || 0) + 844 },
      { region: 'Khyber Pakhtunkhwa', clears: (map['Khyber Pakhtunkhwa'] || 0) + 712 },
      { region: 'Florida', clears: (map['Florida'] || 0) + 688 },
      { region: 'Islamabad', clears: (map['Islamabad'] || 0) + 520 },
    ];
    if (this.region) {
      const yours = seeded.find((r) => r.region === this.region);
      if (yours) {
        yours.you = true;
        yours.clears = (map[this.region] || 0) + (yours.clears - (map[this.region] || 0));
      } else {
        seeded.push({
          region: this.region,
          clears: (map[this.region] || 0) + 300,
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
      region: this.region,
      ranks: this.getRanks(),
      tryCount: this.tryCount,
    };
  }

  setRegion(region: RegionId): void {
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
    // Same as original: props come from share (start at 0, unlock via share)
    this.undoLeft = 0;
    this.shuffleLeft = 0;
    this.removeLeft = 0;
    this.reviveLeft = 1;
    this.emit();
  }

  /** Unlock one prop use after “share” (same gate as original). */
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
      if (this.levelIndex >= 1 && this.region) {
        const map = loadRanks();
        map[this.region] = (map[this.region] || 0) + 1;
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
