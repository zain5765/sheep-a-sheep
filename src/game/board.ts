import { MATCH_SIZE, TILE_TYPES } from './config';
import { createPRNG, shuffleInPlace } from './rng';
import type { LevelConfig, TileData, TileType } from './types';

let nextUid = 1;

type Cell = { blocks: TileData[] };

function makeEmptyBoard(grid: number): Cell[][] {
  return Array.from({ length: grid }, () =>
    Array.from({ length: grid }, () => ({ blocks: [] as TileData[] })),
  );
}

function buildTypeBag(total: number, typeCount: number, rng: () => number): TileType[] {
  const types = TILE_TYPES.slice(0, typeCount);
  // Equal distribution in triples so every type count is multiple of 3
  const unit = types.length * MATCH_SIZE;
  let n = total;
  if (n % unit !== 0) n = (Math.floor(n / unit) + 1) * unit;

  const bag: TileType[] = [];
  while (bag.length < n) {
    for (const t of types) bag.push(t, t, t);
  }
  return shuffleInPlace(bag.slice(0, n), rng);
}

function placeBatch(
  tiles: TileData[],
  chess: Cell[][],
  minX: number,
  minY: number,
  maxX: number,
  maxY: number,
  cell: number,
  rng: () => number,
): void {
  const used = new Set<string>();
  for (const tile of tiles) {
    let gx = 0;
    let gy = 0;
    let key = '';
    let tries = 0;
    do {
      gx = Math.floor(rng() * (maxX - minX + 1)) + minX;
      gy = Math.floor(rng() * (maxY - minY + 1)) + minY;
      gx = Math.max(0, Math.min(gx, chess.length - 3));
      gy = Math.max(0, Math.min(gy, chess.length - 3));
      key = `${gx},${gy}`;
      tries++;
    } while (used.has(key) && tries < 80);
    used.add(key);

    tile.gx = gx;
    tile.gy = gy;
    tile.x = gx * cell;
    tile.y = gy * cell;
    tile.pile = -1;
    tile.inHold = false;

    // Layer = 1 + max layer of overlapping cells (3×3 footprint)
    let maxLayer = 0;
    const x0 = Math.max(gx - 2, 0);
    const y0 = Math.max(gy - 2, 0);
    const x1 = Math.min(gx + 3, chess.length - 1);
    const y1 = Math.min(gy + 3, chess.length - 1);
    for (let i = x0; i < x1; i++) {
      for (let j = y0; j < y1; j++) {
        const top = chess[i][j].blocks[chess[i][j].blocks.length - 1];
        if (top && top.uid !== tile.uid) {
          maxLayer = Math.max(maxLayer, top.layer);
          tile.layer = maxLayer + 1; // provisional
        }
      }
    }
    tile.layer = maxLayer + 1;

    for (let i = x0; i < x1; i++) {
      for (let j = y0; j < y1; j++) {
        chess[i][j].blocks.push(tile);
      }
    }
  }
}

export function generateBoard(level: LevelConfig, seed: string): {
  tiles: TileData[];
  pileTops: number[];
} {
  nextUid = 1;
  const rng = createPRNG(`${seed}-L${level.id}-v3`);
  const chess = makeEmptyBoard(level.grid);

  const pileTotal = level.pileSizes.reduce((a, b) => a + b, 0);
  const minNeeded = level.levelBatches * level.tilesPerBatch + pileTotal;
  const bag = buildTypeBag(minNeeded, level.typeCount, rng);

  const tiles: TileData[] = bag.map((type) => ({
    uid: nextUid++,
    type,
    layer: 1,
    gx: 0,
    gy: 0,
    x: 0,
    y: 0,
    removed: false,
    inSlot: false,
    pile: -1,
    inHold: false,
  }));

  let pos = 0;

  // Side piles first (like original left/right queues)
  const pileTops: number[] = level.pileSizes.map(() => 0);
  level.pileSizes.forEach((size, pileIdx) => {
    for (let i = 0; i < size; i++) {
      const t = tiles[pos++];
      t.pile = pileIdx;
      t.layer = i + 1;
      t.gx = -1;
      t.gy = -1;
      // Pixel pos filled by UI for pile stacks
      t.x = 0;
      t.y = 0;
    }
    pileTops[pileIdx] = size;
  });

  // Main stacked batches with shrinking borders (yulegeyu-style)
  let minX = 0;
  let maxX = level.grid - 3;
  let minY = 0;
  let maxY = level.grid - 3;
  const borderStep = 1;
  let left = tiles.length - pos;

  for (let batch = 0; batch < level.levelBatches && left > 0; batch++) {
    let count = Math.min(level.tilesPerBatch, left);
    if (batch === level.levelBatches - 1) count = left;

    if (batch > 0 && borderStep > 0) {
      const dir = batch % 4;
      if (dir === 0) minX = Math.min(minX + borderStep, maxX - 2);
      else if (dir === 1) maxY = Math.max(maxY - borderStep, minY + 2);
      else if (dir === 2) minY = Math.min(minY + borderStep, maxY - 2);
      else maxX = Math.max(maxX - borderStep, minX + 2);
    }

    const batchTiles = tiles.slice(pos, pos + count);
    placeBatch(batchTiles, chess, minX, minY, maxX, maxY, level.cell, rng);
    pos += count;
    left -= count;
  }

  return { tiles, pileTops };
}

/** Only uncovered board tiles / top of each pile / hold tiles are clickable. */
export function computeClickable(tiles: TileData[]): Map<number, boolean> {
  const flags = new Map<number, boolean>();
  const board = tiles.filter((t) => !t.removed && !t.inSlot && t.pile < 0 && !t.inHold);
  const hold = tiles.filter((t) => !t.removed && !t.inSlot && t.inHold);

  for (const tile of board) {
    const blocked = board.some(
      (other) =>
        other.uid !== tile.uid &&
        other.layer > tile.layer &&
        overlapsFootprint(tile, other),
    );
    flags.set(tile.uid, !blocked);
  }

  // Hold tiles always clickable
  for (const t of hold) flags.set(t.uid, true);

  // Only the front (highest index / top) of each pile
  const byPile = new Map<number, TileData[]>();
  for (const t of tiles) {
    if (t.removed || t.inSlot || t.pile < 0 || t.inHold) continue;
    const list = byPile.get(t.pile) ?? [];
    list.push(t);
    byPile.set(t.pile, list);
  }
  for (const list of byPile.values()) {
    list.sort((a, b) => a.layer - b.layer);
    list.forEach((t, i) => flags.set(t.uid, i === list.length - 1));
  }

  return flags;
}

function overlapsFootprint(a: TileData, b: TileData): boolean {
  // 3×3 grid footprint overlap (same as original chess logic)
  return Math.abs(a.gx - b.gx) < 3 && Math.abs(a.gy - b.gy) < 3;
}

export function shuffleTypes(tiles: TileData[], seed: string): void {
  const active = tiles.filter((t) => !t.removed && !t.inSlot);
  const rng = createPRNG(`${seed}-shuf-${Date.now()}`);
  const types = active.map((t) => t.type);
  shuffleInPlace(types, rng);
  active.forEach((t, i) => {
    t.type = types[i];
  });
}
