export type TileType =
  | 'sheep'
  | 'flower'
  | 'tree'
  | 'grass'
  | 'mushroom'
  | 'carrot'
  | 'cabbage'
  | 'corn'
  | 'bell'
  | 'paw'
  | 'bone'
  | 'wool'
  | 'apple'
  | 'leaf'
  | 'sun';

export interface TileDef {
  id: TileType;
  label: string;
  emoji: string;
  color: string;
}

export interface TileData {
  uid: number;
  type: TileType;
  layer: number;
  /** Grid cell X (0..GRID-1) for stacked board tiles; -1 for hold/side. */
  gx: number;
  gy: number;
  /** Pixel position on board */
  x: number;
  y: number;
  removed: boolean;
  inSlot: boolean;
  /** Side queue pile index, or -1 if on main board / hold */
  pile: number;
  /** In temporary hold zone from Remove prop */
  inHold: boolean;
}

export interface LevelConfig {
  id: number;
  name: string;
  subtitle: string;
  /** How many icon types to use */
  typeCount: number;
  /** Batches of stacked tiles on the main board */
  levelBatches: number;
  /** Tiles per batch (approx) */
  tilesPerBatch: number;
  /** Side queue pile sizes, e.g. [8, 8] */
  pileSizes: number[];
  boardWidth: number;
  boardHeight: number;
  tileSize: number;
  /** Grid units (like original 24×24) */
  grid: number;
  cell: number;
}

export type GameStatus = 'menu' | 'playing' | 'won' | 'lost';
export type Screen = 'menu' | 'game' | 'rank';

export interface SlotSnapshot {
  uids: number[];
  holdUids: number[];
}
