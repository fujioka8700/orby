export const GAME_WIDTH = 256;
export const GAME_HEIGHT = 240;

export const GAME_CONSTANTS = {
  PLAYER: {
    FRAME_WIDTH: 48,
    FRAME_HEIGHT: 48,
    ACTUAL_WIDTH: 16,
    ACTUAL_HEIGHT: 16,
    DEFAULT_START_X: 48,
    DEFAULT_START_Y: 48,
  },
  MOVEMENT: {
    MAX_SPEED: 160,
    ACCELERATION: 800,
    DECELERATION: 1000,
    AIR_CONTROL: 0.5,
    JUMP_VELOCITY: -250,
    JUMP_CANCEL_FACTOR: 0.2,
    MIN_VELOCITY_THRESHOLD: 10,
  },
  CAMERA: {
    FOLLOW_LERP_X: 0.1,
    FOLLOW_LERP_Y: 0.1,
  },
  COLLISION: {
    ONE_WAY_TOLERANCE_PREV: 2,
    ONE_WAY_TOLERANCE_CURRENT: 8,
  },
  ENEMY: {
    DISPLAY_WIDTH: 64,
    DISPLAY_HEIGHT: 48,
    BODY_WIDTH: 24,
    BODY_HEIGHT: 10,
    OFFSET_X: 20,
    OFFSET_Y: 22,
    SPEED_X: 50,
    SPEED_Y: 300,
    INITIAL_DIRECTION: -1,
    SENSOR_DISTANCE: 1,
    FLIP_ADJUST: 4,
  },
} as const;

export const PLAYER_ASSET = "/orby/assets/graphics/characters/Player.png";
export const SPIDER_ASSET = "/orby/assets/graphics/enemies/Spider_1.png";

/** 残機UI */
export const LIVES_INITIAL = 2;
export const UI_LIVES_POSITION = { x: 16, y: 16 } as const;
export const LIVES_ICON_ASSET = "/orby/assets/graphics/ui/Stars_Ui.png";
export const UI_FONT_FAMILY = "Round9x13";

export const TILEMAP_ASSETS = {
  tilesetGrass: "/orby/assets/graphics/environment/tilesets/Grass_Tileset.png",
  tilesetPlatform: "/orby/assets/graphics/environment/interactive/Platform.png",
  tilesetGrassOneway:
    "/orby/assets/graphics/environment/tilesets/Grass_Oneway.png",
  tilesetLeaf: "/orby/assets/graphics/environment/tilesets/Leaf_Tileset.png",
  tilemap: "/orby/assets/maps/1st_stage_tilemap.json",
} as const;
