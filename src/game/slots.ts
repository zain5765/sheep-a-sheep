import { HOLD_SIZE, MATCH_SIZE, MAX_SLOTS } from './config';
import type { SlotSnapshot, TileData } from './types';

export interface AddResult {
  success: boolean;
  isFull: boolean;
  cleared: string[];
}

export class SlotManager {
  private slots: TileData[] = [];
  private hold: TileData[] = [];
  private history: SlotSnapshot[] = [];

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

  add(tile: TileData): AddResult {
    if (this.slots.length >= MAX_SLOTS) {
      return { success: false, isFull: true, cleared: [] };
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

    // Leave hold list if it was there
    this.hold = this.hold.filter((t) => t.uid !== tile.uid);

    const cleared = this.clearMatches();
    if (cleared.length > 0) {
      // Original: clear undo history after a match
      this.history = [];
    }

    const isFull = this.slots.length >= MAX_SLOTS && cleared.length === 0;
    return { success: true, isFull, cleared };
  }

  private clearMatches(): string[] {
    const counts = new Map<string, TileData[]>();
    for (const t of this.slots) {
      const list = counts.get(t.type) ?? [];
      list.push(t);
      counts.set(t.type, list);
    }

    const cleared: string[] = [];
    for (const [type, list] of counts) {
      while (list.length >= MATCH_SIZE) {
        const group = list.splice(0, MATCH_SIZE);
        cleared.push(type);
        for (const t of group) {
          t.removed = true;
          t.inSlot = false;
          const idx = this.slots.indexOf(t);
          if (idx >= 0) this.slots.splice(idx, 1);
        }
      }
    }
    return cleared;
  }

  undo(allTiles: TileData[]): number[] | null {
    if (this.history.length === 0) return null;
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

    return leaving.map((t) => t.uid);
  }

  /** Move up to 3 tray tiles into hold zone (移出). */
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
