/// <reference types="phaser" />
import {
  ASSET_KEYS,
  BACKGROUND_ASSET,
  COIN_ASSET,
  COINS_UI_ASSET,
  GAME_CONSTANTS,
  GOAL_FLAG_ASSET,
  GOAL_FLAG_SIZE,
  LIVES_ICON_ASSET,
  LIVES_ICON_FRAME_HEIGHT,
  LIVES_ICON_FRAME_WIDTH,
  PLAYER_ASSET,
  PLAYER_GAME_COMPLETE_ASSET,
  PLAYER_MISS_ASSET,
  SPIDER_ASSET,
  TILEMAP_ASSETS,
  TITLE_ASSET,
} from "@/lib/game/constants";

/** メインシーン用アセットをすべてプリロードする */
export function loadGameAssets(scene: Phaser.Scene): void {
  const { load } = scene;
  load.image(ASSET_KEYS.TILESET_GRASS, TILEMAP_ASSETS.tilesetGrass);
  load.image(
    ASSET_KEYS.TILESET_PLATFORM,
    TILEMAP_ASSETS.tilesetPlatform,
  );
  load.image(
    ASSET_KEYS.TILESET_GRASS_ONEWAY,
    TILEMAP_ASSETS.tilesetGrassOneway,
  );
  load.image(ASSET_KEYS.TILESET_LEAF, TILEMAP_ASSETS.tilesetLeaf);
  load.tilemapTiledJSON(ASSET_KEYS.TILEMAP, TILEMAP_ASSETS.tilemap);
  load.spritesheet(ASSET_KEYS.PLAYER, PLAYER_ASSET, {
    frameWidth: GAME_CONSTANTS.PLAYER.FRAME_WIDTH,
    frameHeight: GAME_CONSTANTS.PLAYER.FRAME_HEIGHT,
  });
  load.spritesheet(ASSET_KEYS.SPIDER, SPIDER_ASSET, {
    frameWidth: GAME_CONSTANTS.ENEMY.DISPLAY_WIDTH,
    frameHeight: GAME_CONSTANTS.ENEMY.DISPLAY_HEIGHT,
  });
  load.spritesheet(ASSET_KEYS.LIVES_ICON, LIVES_ICON_ASSET, {
    frameWidth: LIVES_ICON_FRAME_WIDTH,
    frameHeight: LIVES_ICON_FRAME_HEIGHT,
  });
  load.image(ASSET_KEYS.PLAYER_MISS, PLAYER_MISS_ASSET);
  load.spritesheet(ASSET_KEYS.GOAL_FLAG, GOAL_FLAG_ASSET, {
    frameWidth: GOAL_FLAG_SIZE,
    frameHeight: GOAL_FLAG_SIZE,
  });
  load.image(ASSET_KEYS.BACKGROUND, BACKGROUND_ASSET);
  load.image(ASSET_KEYS.COIN, COIN_ASSET);
  load.image(ASSET_KEYS.COINS_UI, COINS_UI_ASSET);
  load.image(ASSET_KEYS.TITLE, TITLE_ASSET);
  load.image(ASSET_KEYS.PLAYER_GAME_COMPLETE, PLAYER_GAME_COMPLETE_ASSET);
}
