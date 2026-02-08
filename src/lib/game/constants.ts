export const GAME_WIDTH = 256;
export const GAME_HEIGHT = 240;

export const GAME_CONSTANTS = {
  PLAYER: {
    FRAME_WIDTH: 48,
    FRAME_HEIGHT: 48,
    ACTUAL_WIDTH: 16,
    ACTUAL_HEIGHT: 16,
    /** ミス時（Player_miss.png）の物理ボディサイズ */
    MISS_BODY_WIDTH: 16,
    MISS_BODY_HEIGHT: 13,
    /** ミス時の上方向初速度（ぴょーん） */
    MISS_BOUNCE_VELOCITY: -270,
    /** 無敵時間中の点滅間隔（ms） */
    INVINCIBLE_BLINK_INTERVAL_MS: 50,
    /** 無敵時間中の点滅時の透明度（0〜1） */
    INVINCIBLE_BLINK_ALPHA: 0.3,
    /** 復帰後の無敵時間（ms） */
    INVINCIBLE_DURATION_MS: 1500,
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
    /** ミス復帰時のフェード時間（ms） */
    FADE_DURATION_MS: 400,
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
export const PLAYER_MISS_ASSET =
  "/orby/assets/graphics/characters/Player_miss.png";
export const SPIDER_ASSET = "/orby/assets/graphics/enemies/Spider_1.png";

/** ゴール旗（Goal_flag）：32x32px、5コマアニメーション */
export const GOAL_FLAG_ASSET = "/orby/assets/graphics/items/Flag_animation.png";
export const GOAL_FLAG_SIZE = 32;
export const GOAL_FLAG_FRAMES = 5;

/** コイン：16x16px */
export const COIN_ASSET = "/orby/assets/graphics/items/Coin.png";
export const COIN_SIZE = 16;

/** 残機UI */
export const LIVES_INITIAL = 2;
export const UI_LIVES_POSITION = { x: 16, y: 16 } as const;
export const UI_LIVES_ICON_SIZE = 16;
/** 残機・コインアイコンの下方向オフセット（数値とトップを揃えた分だけアイコンを下げる） */
export const UI_ICON_OFFSET_Y = 4;
export const LIVES_ICON_ASSET = "/orby/assets/graphics/ui/Hearts.png";
/** Hearts.png: 幅48px・3コマ → 1コマ16px */
export const LIVES_ICON_FRAME_WIDTH = 16;
export const LIVES_ICON_FRAME_HEIGHT = 16;
/** コイン枚数UI（残機の下に表示） */
export const UI_COINS_OFFSET_Y = 8;
export const COINS_UI_ASSET = "/orby/assets/graphics/ui/Coins_Ui.png";
/** タイトル画面用画像 */
export const TITLE_ASSET = "/orby/assets/graphics/ui/Title.jpg";
/** タイトル画像の表示高さ（幅はアスペクト比に合わせて均等にスケール） */
export const TITLE_DISPLAY_HEIGHT = 120;
/** タイトル画像の上端Y位置 */
export const TITLE_TOP_Y = 28;
/** 「Touch to start」の点滅間隔（ms） */
export const TITLE_BLINK_INTERVAL_MS = 1000;
/** タイトル画面の背景色（黒） */
export const TITLE_BACKGROUND_COLOR = 0x000000;
export const UI_FONT_FAMILY = "Round9x13";
/** 残機・コイン数値用テキストスタイル（共通） */
export const UI_NUMBER_TEXT_STYLE = {
  fontFamily: UI_FONT_FAMILY,
  fontSize: "16px",
  color: "#ffffff",
  stroke: "#000000",
  strokeThickness: 2,
  padding: { left: 2, right: 2, top: 0, bottom: 4 },
} as const;

/** GAME OVER 表示 */
export const GAME_OVER_OVERLAY_ALPHA = 0.6;
export const GAME_OVER_FONT_SIZE = "24px";
export const GAME_OVER_CONTINUE_FONT_SIZE = "14px";
export const GAME_OVER_CONTINUE_OFFSET_Y = 40;

/** タイトル画面「Touch to start」のフォントサイズ */
export const TITLE_TOUCH_FONT_SIZE = "14px";
/** タイトル画像の下から「Touch to start」までのオフセット（1文分の余白） */
export const TITLE_TOUCH_OFFSET_Y = 40;
/** タイトル画面の著作権表示 */
export const TITLE_COPYRIGHT_TEXT = "©2026 Wado";
/** タイトル画面の著作権表示フォントサイズ */
export const TITLE_COPYRIGHT_FONT_SIZE = "10px";
/** 「Touch to start」の下から著作権表示までのオフセット（1文分の余白） */
export const TITLE_COPYRIGHT_OFFSET_Y = 30;

/** タイルマップのオブジェクトレイヤー名・オブジェクト名（Tiled と一致させる） */
export const OBJECT_LAYER_NAME = "objectsLayer";
export const GOAL_FLAG_OBJECT_NAMES = ["Goal_flag", "goal_flag"] as const;
export const COIN_OBJECT_NAME = "Coin";
export const ENEMY_OBJECT_NAME = "Spider_1";

/** メインシーン・ゲーム背景色 */
export const SCENE_BACKGROUND_COLOR = "#2c3e50";

/** 固定背景 */
export const BACKGROUND_ASSET =
  "/orby/assets/graphics/backgrounds/Forest_Background_0.png";

/** Phaser で登録するアセット・テクスチャのキー（preload / create で統一利用） */
export const ASSET_KEYS = {
  TILEMAP: "tilemap",
  PLAYER: "player",
  SPIDER: "spider",
  GOAL_FLAG: "goalFlag",
  BACKGROUND: "background",
  TILESET_GRASS: "tilesetGrass",
  TILESET_PLATFORM: "tilesetPlatform",
  TILESET_GRASS_ONEWAY: "tilesetGrassOneway",
  TILESET_LEAF: "tilesetLeaf",
  COIN: "coin",
  COINS_UI: "coinsUi",
  LIVES_ICON: "livesIcon",
  PLAYER_MISS: "player_miss",
  TITLE: "title",
} as const;

export const TILEMAP_ASSETS = {
  tilesetGrass: "/orby/assets/graphics/environment/tilesets/Grass_Tileset.png",
  tilesetPlatform: "/orby/assets/graphics/environment/interactive/Platform.png",
  tilesetGrassOneway:
    "/orby/assets/graphics/environment/tilesets/Grass_Oneway.png",
  tilesetLeaf: "/orby/assets/graphics/environment/tilesets/Leaf_Tileset.png",
  tilemap: "/orby/assets/maps/1st_stage_tilemap.json",
} as const;
