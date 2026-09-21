import { HOLD_SIZE, MATCH_SIZE, MAX_SLOTS } from './config';
import type { SlotSnapshot, TileData } from './types';

export interface AddResult {
  success: boolean;
  isFull: boolean;
  cleared: string[];
  /** Uids removed by match (empty if deferred) */
  clearedUids: number[];
  /** Uids waiting to pop when deferClear was used */
  pendingClearUids: number[];
}

export class SlotManager {
  private slots: TileData[] = [];
  private hold: TileData[] = [];
  private history: SlotSnapshot[] = [];
  private pendingClearUids: number[] = [];

  get items(): readonly TileData[] {
    return this.slots;
  }

  get holdItems(): readonly TileData[] {
    return this.hold;
  }

  get length(): number {
    return this.slots.length;
  }

  clear(): void {
    this.slots = [];
    this.hold = [];
    this.history = [];
    this.pendingClearUids = [];
  }

  canUndo(): boolean {
    return this.history.length > 0;
  }

  private snap(): void {
    this.history.push({
      uids: this.slots.map((t) => t.uid),
      holdUids: this.hold.map((t) => t.uid),
    });
  }

  add(tile: TileData, opts?: { deferClear?: boolean }): AddResult {
    if (this.slots.length >= MAX_SLOTS) {
      return { success: false, isFull: true, cleared: [], clearedUids: [], pendingClearUids: [] };
    }

    this.snap();

    let insertAt = this.slots.length;
    for (let i = this.slots.length - 1; i >= 0; i--) {
      if (this.slots[i].type === tile.type) {
        insertAt = i + 1;
        break;
      }
    }

    tile.inSlot = true;
    tile.inHold = false;
    tile.pile = -1;
    this.slots.splice(insertAt, 0, tile);
    this.hold = this.hold.filter((t) => t.uid !== tile.uid);

    const pending = this.findMatchUids();
    if (opts?.deferClear && pending.length > 0) {
      this.pendingClearUids = pending;
      return {
        success: true,
        isFull: false,
        cleared: [],
        clearedUids: [],
        pendingClearUids: pending,
      };
    }

    const { types, uids } = this.clearMatches();
    if (types.length > 0) this.history = [];
    const isFull = this.slots.length >= MAX_SLOTS && types.length === 0;
    return {
      success: true,
      isFull,
      cleared: types,
      clearedUids: uids,
      pendingClearUids: [],
    };
  }

  /** Apply deferred match clears (after tray pop anim). */
  commitPendingClears(): { types: string[]; uids: number[] } {
    if (this.pendingClearUids.length === 0) return { types: [], uids: [] };
    const want = new Set(this.pendingClearUids);
    this.pendingClearUids = [];
    const types: string[] = [];
    const uids: number[] = [];
    for (const t of [...this.slots]) {
      if (!want.has(t.uid)) continue;
      types.push(t.type);
      uids.push(t.uid);
      t.removed = true;
      t.inSlot = false;
      const idx = this.slots.indexOf(t);
      if (idx >= 0) this.slots.splice(idx, 1);
    }
    if (uids.length > 0) this.history = [];
    return { types, uids };
  }

  private findMatchUids(): number[] {
    const counts = new Map<string, TileData[]>();
    for (const t of this.slots) {
      const list = counts.get(t.type) ?? [];
      list.push(t);
      counts.set(t.type, list);
    }
    const uids: number[] = [];
    for (const list of counts.values()) {
      while (list.length >= MATCH_SIZE) {
        const group = list.splice(0, MATCH_SIZE);
        for (const t of group) uids.push(t.uid);
      }
    }
    return uids;
  }

  private clearMatches(): { types: string[]; uids: number[] } {
    const counts = new Map<string, TileData[]>();
    for (const t of this.slots) {
      const list = counts.get(t.type) ?? [];
      list.push(t);
      counts.set(t.type, list);
    }

    const types: string[] = [];
    const uids: number[] = [];
    for (const [type, list] of counts) {
      while (list.length >= MATCH_SIZE) {
        const group = list.splice(0, MATCH_SIZE);
        types.push(type);
        for (const t of group) {
          uids.push(t.uid);
          t.removed = true;
          t.inSlot = false;
          const idx = this.slots.indexOf(t);
          if (idx >= 0) this.slots.splice(idx, 1);
        }
      }
    }
    return { types, uids };
  }

  undo(allTiles: TileData[]): TileData[] | null {
    if (this.history.length === 0) return null;
    this.pendingClearUids = [];
    const snap = this.history.pop()!;
    const prevSlot = new Set(snap.uids);
    const leaving = this.slots.filter((t) => !prevSlot.has(t.uid));

    for (const t of leaving) {
      t.inSlot = false;
      t.removed = false;
    }

    this.slots = snap.uids
      .map((uid) => allTiles.find((t) => t.uid === uid))
      .filter((t): t is TileData => Boolean(t));
    for (const t of this.slots) {
      t.inSlot = true;
      t.removed = false;
      t.inHold = false;
    }

    this.hold = snap.holdUids
      .map((uid) => allTiles.find((t) => t.uid === uid))
      .filter((t): t is TileData => Boolean(t));
    for (const t of this.hold) {
      t.inHold = true;
      t.inSlot = false;
      t.removed = false;
    }

    return leaving;
  }

  moveToHold(count = HOLD_SIZE): TileData[] {
    if (this.slots.length === 0) return [];
    const room = Math.max(0, HOLD_SIZE - this.hold.length);
    if (room === 0) return [];
    this.snap();
    const taken = this.slots.splice(0, Math.min(count, room, this.slots.length));
    for (const t of taken) {
      t.inSlot = false;
      t.inHold = true;
      t.pile = -1;
      t.removed = false;
    }
    this.hold.push(...taken);
    return taken;
  }
}
