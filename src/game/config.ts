import type { LevelConfig, TileDef, TileType } from './types';

/** Same farm/sheep icon set style as the viral game — cream tiles like the original. */
export const TILE_DEFS: Record<TileType, TileDef> = {
  sheep: { id: 'sheep', label: 'Sheep', emoji: '🐑', color: '#fff8e8' },
  flower: { id: 'flower', label: 'Flower', emoji: '🌸', color: '#fff8e8' },
  tree: { id: 'tree', label: 'Tree', emoji: '🌳', color: '#fff8e8' },
  grass: { id: 'grass', label: 'Grass', emoji: '🌿', color: '#fff8e8' },
  mushroom: { id: 'mushroom', label: 'Mushroom', emoji: '🍄', color: '#fff8e8' },
  carrot: { id: 'carrot', label: 'Carrot', emoji: '🥕', color: '#fff8e8' },
  cabbage: { id: 'cabbage', label: 'Cabbage', emoji: '🥬', color: '#fff8e8' },
  corn: { id: 'corn', label: 'Corn', emoji: '🌽', color: '#fff8e8' },
  bell: { id: 'bell', label: 'Bell', emoji: '🔔', color: '#fff8e8' },
  paw: { id: 'paw', label: 'Paw', emoji: '🐾', color: '#fff8e8' },
  bone: { id: 'bone', label: 'Bone', emoji: '🦴', color: '#fff8e8' },
  wool: { id: 'wool', label: 'Wool', emoji: '🧶', color: '#fff8e8' },
  apple: { id: 'apple', label: 'Apple', emoji: '🍎', color: '#fff8e8' },
  leaf: { id: 'leaf', label: 'Leaf', emoji: '🍃', color: '#fff8e8' },
  sun: { id: 'sun', label: 'Sun', emoji: '☀️', color: '#fff8e8' },
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
    subtitle: 'Kindergarten',
    typeCount: 5,
    levelBatches: 3,
    tilesPerBatch: 12,
    pileSizes: [],
    boardWidth: 340,
    boardHeight: 340,
    tileSize: 52,
    grid: 24,
    cell: 14,
  },
  {
    id: 2,
    name: 'Level 2',
    subtitle: 'Only 0.1% clear',
    // Dense center villa + 4 tall side piles (closer to original L2)
    typeCount: 15,
    levelBatches: 20,
    tilesPerBatch: 22,
    pileSizes: [16, 16, 16, 16],
    boardWidth: 340,
    boardHeight: 340,
    tileSize: 40,
    grid: 24,
    cell: 14,
  },
];

export const MAX_SLOTS = 7;
export const HOLD_SIZE = 3;
export const MATCH_SIZE = 3;

export {
  COUNTRIES,
  COUNTRY_IDS,
  findCountryForProvince,
  parseTeamKey,
  provincesFor,
  teamKey,
  type CountryId,
  type RegionId,
} from './countries';

