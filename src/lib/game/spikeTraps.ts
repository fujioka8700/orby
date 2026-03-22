/// <reference types="phaser" />
import {
  ASSET_KEYS,
  DEPTH_SPIKE,
  SPIKE_BLOCK_DISPLAY_SIZE,
  SPIKE_BODY_HEIGHT,
  SPIKE_BODY_OFFSET_X,
  SPIKE_BODY_OFFSET_Y,
  SPIKE_BODY_WIDTH,
  SPIKE_OBJECT_TYPE,
  SPIKE_TILE_FIRST_GID,
  SPIKE_TILE_GID_COUNT,
  TRAPS_LAYER_NAME,
} from "@/lib/game/constants";

/**
 * オブジェクトの type が spike、または Spike タイルセット由来のタイルオブジェクト（gid 範囲）ならトゲ。
 * Tiled はタイルに付けた type をオブジェクト側にコピーしないことが多い。
 */
function isSpikeObject(obj: Phaser.Types.Tilemaps.TiledObject): boolean {
  const t = (obj.type ?? "").trim().toLowerCase();
  if (t === SPIKE_OBJECT_TYPE) return true;
  const gid = obj.gid;
  if (gid == null) return false;
  return (
    gid >= SPIKE_TILE_FIRST_GID &&
    gid < SPIKE_TILE_FIRST_GID + SPIKE_TILE_GID_COUNT
  );
}

/**
 * 3rd ステージ：`traps` オブジェクトレイヤーで type が `spike` のオブジェクトから静止トゲを生成する。
 * レイヤーが無い・オブジェクトが無い場合は空の StaticGroup を返す。
 */
export function createSpikeTraps(
  scene: Phaser.Scene,
  map: Phaser.Tilemaps.Tilemap,
): Phaser.Physics.Arcade.StaticGroup {
  const group = scene.physics.add.staticGroup();
  const layer = map.getObjectLayer(TRAPS_LAYER_NAME);
  if (!layer) return group;

  for (const obj of layer.objects) {
    if (!isSpikeObject(obj)) continue;
    if (obj.x == null || obj.y == null) continue;

    const sprite = group.create(
      obj.x,
      obj.y,
      ASSET_KEYS.SPIKE_BLOCK,
    ) as Phaser.Physics.Arcade.Sprite;

    const dw =
      (obj.width != null && obj.width > 0
        ? obj.width
        : SPIKE_BLOCK_DISPLAY_SIZE);
    const dh =
      (obj.height != null && obj.height > 0
        ? obj.height
        : SPIKE_BLOCK_DISPLAY_SIZE);

    if (obj.point === true) {
      sprite.setOrigin(0.5, 1);
    } else {
      sprite.setOrigin(0, 1);
    }
    sprite.setPosition(obj.x, obj.y);

    if (dw !== SPIKE_BLOCK_DISPLAY_SIZE || dh !== SPIKE_BLOCK_DISPLAY_SIZE) {
      sprite.setDisplaySize(dw, dh);
    }

    sprite.setDepth(DEPTH_SPIKE);

    const body = sprite.body as Phaser.Physics.Arcade.StaticBody;
    body.setSize(SPIKE_BODY_WIDTH, SPIKE_BODY_HEIGHT);
    body.setOffset(SPIKE_BODY_OFFSET_X, SPIKE_BODY_OFFSET_Y);
    sprite.refreshBody();
  }

  return group;
}
