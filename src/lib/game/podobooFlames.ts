/// <reference types="phaser" />
import {
  ASSET_KEYS,
  ENEMIES_LAYER_NAME,
  FLAME_1_FIRST_GID,
  FLAME_1_FRAME_COUNT,
  FLAME_1_FRAME_WIDTH,
  OBJECT_LAYER_NAME,
  PODOBOO_ANIM_KEY,
  PODOBOO_BODY_HEIGHT,
  PODOBOO_BODY_OFFSET_X,
  PODOBOO_BODY_OFFSET_Y,
  PODOBOO_BODY_WIDTH,
  PODOBOO_DEFAULT_RANGE,
  PODOBOO_DEFAULT_SPEED,
  PODOBOO_HIDE_OFFSET_Y,
  PODOBOO_INTERVAL_MAX_MS,
  PODOBOO_INTERVAL_MIN_MS,
  PODOBOO_OBJECT_TYPE,
  PODOBOO_RANGE_MAX_PX,
  PODOBOO_RANGE_MIN_PX,
  PODOBOO_REF_INTERVAL_MS,
  PODOBOO_REF_SPEED_FOR_INTERVAL,
  DEPTH_PODOBOO,
} from "@/lib/game/constants";

const DATA_START_X = "podobooStartX";
const DATA_START_Y = "podobooStartY";
const DATA_IS_JUMPING = "podobooIsJumping";
const DATA_JUMP_TIMER = "podobooJumpTimer";
const DATA_RANGE_PX = "podobooRangePx";
const DATA_SPEED = "podobooSpeed";

/** Tiled の range / speed を読む（タイル定義のプロパティ含む） */
export type PodobooTiledNumberGetter = (
  obj: Phaser.Types.Tilemaps.TiledObject,
  name: string,
) => number | undefined;

function schedulePodobooJump(
  scene: Phaser.Scene,
  flame: Phaser.Physics.Arcade.Sprite,
): void {
  const existing = flame.getData(DATA_JUMP_TIMER) as
    | Phaser.Time.TimerEvent
    | undefined;
  if (existing) {
    existing.remove(false);
  }
  const speed = Math.max(1, flame.getData(DATA_SPEED) as number);
  const delay = Phaser.Math.Clamp(
    PODOBOO_REF_INTERVAL_MS * (PODOBOO_REF_SPEED_FOR_INTERVAL / speed),
    PODOBOO_INTERVAL_MIN_MS,
    PODOBOO_INTERVAL_MAX_MS,
  );
  const timer = scene.time.delayedCall(delay, () => {
    launchPodobooJump(flame);
  });
  flame.setData(DATA_JUMP_TIMER, timer);
}

function launchPodobooJump(flame: Phaser.Physics.Arcade.Sprite): void {
  const startX = flame.getData(DATA_START_X) as number;
  const startY = flame.getData(DATA_START_Y) as number;
  const body = flame.body as Phaser.Physics.Arcade.Body;
  flame.setPosition(startX, startY);
  flame.setVisible(true);
  body.enable = true;
  const rangePx = Phaser.Math.Clamp(
    flame.getData(DATA_RANGE_PX) as number,
    PODOBOO_RANGE_MIN_PX,
    PODOBOO_RANGE_MAX_PX,
  );
  const g = Math.abs(flame.scene.physics.world.gravity.y);
  const vy = -Math.sqrt(2 * g * rangePx);
  body.setVelocity(0, vy);
  flame.setData(DATA_IS_JUMPING, true);
}

/**
 * 3rd ステージ：Enemies レイヤーの Flame_1 タイル、または objectsLayer の type=flame ポイントから Podoboo を生成する。
 * range / speed は Tiled のオブジェクトまたはタイル定義から getTiledNumber で取得（未設定時はタイル既定値相当の定数）。
 */
export function createPodobooFlames(
  scene: Phaser.Scene,
  map: Phaser.Tilemaps.Tilemap,
  getTiledNumber: PodobooTiledNumberGetter,
): Phaser.Physics.Arcade.Group {
  const group = scene.physics.add.group();

  const tryAdd = (
    startX: number,
    startY: number,
    frameIndex: number,
    tiledObj: Phaser.Types.Tilemaps.TiledObject,
  ) => {
    const range =
      getTiledNumber(tiledObj, "range") ?? PODOBOO_DEFAULT_RANGE;
    const speed =
      getTiledNumber(tiledObj, "speed") ?? PODOBOO_DEFAULT_SPEED;
    const sprite = scene.physics.add.sprite(
      startX,
      startY,
      ASSET_KEYS.FLAME_1,
      frameIndex,
    ) as Phaser.Physics.Arcade.Sprite;
    group.add(sprite);
    sprite.setOrigin(0.5, 1);
    sprite.setDepth(DEPTH_PODOBOO);
    const body = sprite.body as Phaser.Physics.Arcade.Body;
    body.allowGravity = true;
    body.setSize(PODOBOO_BODY_WIDTH, PODOBOO_BODY_HEIGHT);
    body.setOffset(PODOBOO_BODY_OFFSET_X, PODOBOO_BODY_OFFSET_Y);
    sprite.setData(DATA_START_X, startX);
    sprite.setData(DATA_START_Y, startY);
    sprite.setData(DATA_RANGE_PX, range);
    sprite.setData(DATA_SPEED, speed);
    sprite.setData(DATA_IS_JUMPING, false);
    sprite.setVisible(false);
    sprite.y = startY + PODOBOO_HIDE_OFFSET_Y;
    body.setVelocity(0, 0);
    body.enable = false;
    if (scene.anims.exists(PODOBOO_ANIM_KEY)) {
      sprite.play(PODOBOO_ANIM_KEY);
    }
    schedulePodobooJump(scene, sprite);
  };

  const enemiesLayer = map.getObjectLayer(ENEMIES_LAYER_NAME);
  if (enemiesLayer) {
    for (const obj of enemiesLayer.objects) {
      if (obj.gid == null || obj.x == null || obj.y == null) continue;
      const gid = obj.gid;
      if (
        gid < FLAME_1_FIRST_GID ||
        gid >= FLAME_1_FIRST_GID + FLAME_1_FRAME_COUNT
      ) {
        continue;
      }
      const w = obj.width ?? FLAME_1_FRAME_WIDTH;
      const startX = obj.x + w / 2;
      const startY = obj.y;
      const frameIndex = gid - FLAME_1_FIRST_GID;
      tryAdd(startX, startY, frameIndex, obj);
    }
  }

  const objectLayer = map.getObjectLayer(OBJECT_LAYER_NAME);
  if (objectLayer) {
    for (const obj of objectLayer.objects) {
      if (obj.type !== PODOBOO_OBJECT_TYPE) continue;
      if (!obj.point || obj.x == null || obj.y == null) continue;
      tryAdd(obj.x, obj.y, 0, obj);
    }
  }

  return group;
}

/** 毎フレーム：落下で噴出口に戻ったら待機し、次のジャンプを予約する。 */
export function updatePodobooFlames(
  group: Phaser.Physics.Arcade.Group | null | undefined,
): void {
  if (!group) return;
  for (const child of group.getChildren()) {
    const flame = child as Phaser.Physics.Arcade.Sprite;
    if (!flame.getData(DATA_IS_JUMPING)) continue;
    const body = flame.body as Phaser.Physics.Arcade.Body;
    const startY = flame.getData(DATA_START_Y) as number;
    if (body.velocity.y < 0) {
      flame.setFlipY(false);
    } else if (body.velocity.y > 0) {
      flame.setFlipY(true);
    }
    if (body.velocity.y > 0 && flame.y >= startY - 0.5) {
      body.setVelocity(0, 0);
      body.enable = false;
      flame.setData(DATA_IS_JUMPING, false);
      flame.setVisible(false);
      flame.setPosition(
        flame.getData(DATA_START_X) as number,
        startY + PODOBOO_HIDE_OFFSET_Y,
      );
      schedulePodobooJump(flame.scene, flame);
    }
  }
}

/** ミス復帰・restart 時：タイマーを張り直し、待機位置へ戻す。 */
export function resetPodoboosToIdle(
  group: Phaser.Physics.Arcade.Group | null | undefined,
): void {
  if (!group) return;
  for (const child of group.getChildren()) {
    const flame = child as Phaser.Physics.Arcade.Sprite;
    const existing = flame.getData(DATA_JUMP_TIMER) as
      | Phaser.Time.TimerEvent
      | undefined;
    if (existing) {
      existing.remove(false);
    }
    flame.setData(DATA_JUMP_TIMER, undefined);
    const startX = flame.getData(DATA_START_X) as number;
    const startY = flame.getData(DATA_START_Y) as number;
    flame.setData(DATA_IS_JUMPING, false);
    flame.setVisible(false);
    flame.setFlipY(false);
    flame.setPosition(startX, startY + PODOBOO_HIDE_OFFSET_Y);
    const body = flame.body as Phaser.Physics.Arcade.Body;
    body.setVelocity(0, 0);
    body.enable = false;
    schedulePodobooJump(flame.scene, flame);
  }
}
