import type { LevelConfig, TileDef, TileType } from './types';

/** Same farm/sheep icon set style as the viral game. */
export const TILE_DEFS: Record<TileType, TileDef> = {
  sheep: { id: 'sheep', label: 'Sheep', emoji: '🐑', color: '#f5f0e8' },
  flower: { id: 'flower', label: 'Flower', emoji: '🌸', color: '#f8c8dc' },
  tree: { id: 'tree', label: 'Tree', emoji: '🌳', color: '#8fbf6a' },
  grass: { id: 'grass', label: 'Grass', emoji: '🌿', color: '#a8d08d' },
  mushroom: { id: 'mushroom', label: 'Mushroom', emoji: '🍄', color: '#e8a0a0' },
  carrot: { id: 'carrot', label: 'Carrot', emoji: '🥕', color: '#ffb347' },
  cabbage: { id: 'cabbage', label: 'Cabbage', emoji: '🥬', color: '#9ccc65' },
  corn: { id: 'corn', label: 'Corn', emoji: '🌽', color: '#f6d55c' },
  bell: { id: 'bell', label: 'Bell', emoji: '🔔', color: '#ffd54f' },
  paw: { id: 'paw', label: 'Paw', emoji: '🐾', color: '#bcaaa4' },
  bone: { id: 'bone', label: 'Bone', emoji: '🦴', color: '#efebe9' },
  wool: { id: 'wool', label: 'Wool', emoji: '🧶', color: '#ce93d8' },
  apple: { id: 'apple', label: 'Apple', emoji: '🍎', color: '#ef5350' },
  leaf: { id: 'leaf', label: 'Leaf', emoji: '🍃', color: '#b7e4a8' },
  sun: { id: 'sun', label: 'Sun', emoji: '☀️', color: '#ffe566' },
};

export const TILE_TYPES = Object.keys(TILE_DEFS) as TileType[];

/**
 * Same mission as Sheep a Sheep / 羊了个羊:
 * Level 1 = kindergarten · Level 2 = ~0.1% clear rate hell
 */
export const LEVELS: LevelConfig[] = [
  {
    id: 1,
    name: 'Level 1',
    subtitle: 'Kindergarten mode',
    typeCount: 3,
    levelBatches: 3,
    tilesPerBatch: 9,
    pileSizes: [],
    boardWidth: 320,
    boardHeight: 320,
    tileSize: 58,
    grid: 24,
    cell: 14,
  },
  {
    id: 2,
    name: 'Level 2',
    subtitle: 'Only ~0.1% clear this',
    // Dense center + 4 side piles (same structure as the viral layout)
    typeCount: 15,
    levelBatches: 14,
    tilesPerBatch: 21,
    pileSizes: [10, 10, 10, 10],
    boardWidth: 336,
    boardHeight: 336,
    tileSize: 44,
    grid: 24,
    cell: 14,
  },
];

export const MAX_SLOTS = 7;
export const HOLD_SIZE = 3;
export const MATCH_SIZE = 3;

/** Region teams for PK + USA (same “your province needs you” idea). */
export const REGIONS = [
  // Pakistan
  'Punjab',
  'Sindh',
  'Khyber Pakhtunkhwa',
  'Balochistan',
  'Islamabad',
  'Gilgit-Baltistan',
  // USA
  'California',
  'Texas',
  'New York',
  'Florida',
  'Illinois',
  'Pennsylvania',
  'Ohio',
  'Georgia',
  'Washington',
  'Massachusetts',
] as const;

export type RegionId = (typeof REGIONS)[number];
