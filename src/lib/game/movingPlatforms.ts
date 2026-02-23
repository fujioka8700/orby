/**
 * 2nd ステージの動く床（方法A: 16pxタイルを3枚ずつ Physics Group で同期制御）。
 * タイルマップの MovingPlatforms レイヤーから生成・更新・リセットを行う。
 */
import {
  ASSET_KEYS,
  GAME_CONSTANTS,
  MOVING_PLATFORM_DEFAULT_DISTANCE,
  MOVING_PLATFORM_DEFAULT_SPEED,
  MOVING_PLATFORM_OFFSET_Y,
} from "@/lib/game/constants";

/** ワンウェイ当たり判定の横方向マージン（px） */
const ONE_WAY_HORIZONTAL_MARGIN = 2;

/**
 * MovingPlatforms レイヤーから動く床の Physics Group を生成する。
 * @param scene - Phaser シーン
 * @param map - タイルマップ
 * @param layerName - オブジェクトレイヤー名（例: "movingPlatforms"）
 * @param platformFirstGid - Platform タイルセットの firstgid
 * @param getTiledPropertyNumber - オブジェクトの数値プロパティ取得関数
 * @returns 生成したグループ。レイヤーが無いかオブジェクトが0のときは null
 */
export function createMovingPlatforms(
  scene: Phaser.Scene,
  map: Phaser.Tilemaps.Tilemap,
  layerName: string,
  platformFirstGid: number,
  getTiledPropertyNumber: (
    obj: Phaser.Types.Tilemaps.TiledObject,
    name: string,
  ) => number | undefined,
): Phaser.Physics.Arcade.Group | null {
  const layer = map.getObjectLayer(layerName);
  if (!layer) return null;

  const objects = [...layer.objects].filter(
    (obj): obj is typeof obj & { gid: number; x: number; y: number } =>
      obj.gid != null && obj.x != null && obj.y != null,
  );
  if (objects.length === 0) return null;

  const gidInRange = (gid: number) =>
    gid >= platformFirstGid && gid < platformFirstGid + 3;
  const validObjects = objects.filter((obj) => gidInRange(obj.gid));
  if (validObjects.length === 0) return null;

  const getPlatformId = (obj: (typeof validObjects)[0]) =>
    getTiledPropertyNumber(obj, "platformID") ?? 0;
  validObjects.sort((a, b) => {
    const idA = getPlatformId(a);
    const idB = getPlatformId(b);
    if (idA !== idB) return idA - idB;
    return a.x - b.x;
  });

  const masterByPlatformId = new Map<number, number>();
  for (let i = 0; i < validObjects.length; i++) {
    const id = getPlatformId(validObjects[i]);
    if (!masterByPlatformId.has(id))
      masterByPlatformId.set(id, validObjects[i].x);
  }

  const group = (scene.physics as Phaser.Physics.Arcade.ArcadePhysics).add.group({
    allowGravity: false,
    immovable: true,
  });

  for (const obj of validObjects) {
    const frame = obj.gid - platformFirstGid;
    const part = group.create(
      obj.x,
      obj.y + MOVING_PLATFORM_OFFSET_Y,
      ASSET_KEYS.TILESET_PLATFORM,
      frame,
    ) as Phaser.Physics.Arcade.Sprite;
    part.setOrigin(0, 0);
    part.setDepth(0);

    const platformID = getPlatformId(obj);
    const speed =
      getTiledPropertyNumber(obj, "speed") ?? MOVING_PLATFORM_DEFAULT_SPEED;
    const distance =
      getTiledPropertyNumber(obj, "distance") ??
      MOVING_PLATFORM_DEFAULT_DISTANCE;
    const leftmostX = masterByPlatformId.get(platformID) ?? obj.x;
    const isMaster = obj.x === leftmostX;

    part.setData("platformID", platformID);
    part.setData("speed", speed);
    part.setData("distance", distance);
    part.setData("isMaster", isMaster);
    part.setData("startX", obj.x);

    const body = part.body as Phaser.Physics.Arcade.Body;
    body.checkCollision.down = false;
    body.checkCollision.left = false;
    body.checkCollision.right = false;
    body.setVelocityX(speed);
  }

  return group;
}

/**
 * 動く床を初期位置・初速に戻す（ミス復帰・restart 用）。
 */
export function resetMovingPlatforms(
  group: Phaser.Physics.Arcade.Group | null,
): void {
  if (!group) return;
  group.getChildren().forEach((child) => {
    const part = child as Phaser.Physics.Arcade.Sprite;
    const body = part.body;
    if (!body) return;
    const startX = part.getData("startX") as number;
    const speed = part.getData("speed") as number;
    part.setX(startX);
    body.updateFromGameObject();
    (body as Phaser.Physics.Arcade.Body).setVelocityX(speed);
  });
}

/**
 * 動く床の往復: マスターが距離に達したら同じ platformID の速度を反転する。
 */
export function updateMovingPlatforms(
  group: Phaser.Physics.Arcade.Group | null,
): void {
  if (!group) return;
  group.getChildren().forEach((child) => {
    const part = child as Phaser.Physics.Arcade.Sprite;
    if (!part.getData("isMaster")) return;
    const body = part.body as Phaser.Physics.Arcade.Body;
    const currentVx = body.velocity.x;
    const startX = part.getData("startX") as number;
    const distance = part.getData("distance") as number;
    const platformID = part.getData("platformID") as number;
    const atRight = currentVx > 0 && part.x >= startX + distance;
    const atLeft = currentVx < 0 && part.x <= startX;
    if (!atRight && !atLeft) return;
    const newVx = -currentVx;
    group.getChildren().forEach((c) => {
      const p = c as Phaser.Physics.Arcade.Sprite;
      if (p.getData("platformID") === platformID) {
        (p.body as Phaser.Physics.Arcade.Body).setVelocityX(newVx);
      }
    });
  });
}

/**
 * 動く床との当たりを「上からのみ有効」とする Process Callback 用の判定。
 * 横・下からの当たりは false を返す。
 */
export function isMovingPlatformOneWayCollision(
  player: Phaser.Physics.Arcade.Sprite,
  platform: Phaser.Physics.Arcade.Sprite,
): boolean {
  const collision = GAME_CONSTANTS.COLLISION;
  const playerBody = player.body as Phaser.Physics.Arcade.Body;
  const platformBody = platform.body as Phaser.Physics.Arcade.Body;
  if (playerBody.velocity.y < 0) return false;
  const playerBottom = playerBody.bottom;
  const prevPlayerBottom = playerBody.prev.y + playerBody.height;
  const platformTop = platformBody.top;
  const platformLeft = platformBody.left;
  const platformRight = platformBody.right;
  const playerCenterX = playerBody.center.x;
  const horizontallyOnPlatform =
    playerCenterX >= platformLeft - ONE_WAY_HORIZONTAL_MARGIN &&
    playerCenterX <= platformRight + ONE_WAY_HORIZONTAL_MARGIN;
  if (!horizontallyOnPlatform) return false;
  if (
    prevPlayerBottom <= platformTop + collision.ONE_WAY_TOLERANCE_PREV ||
    playerBottom <= platformTop + collision.ONE_WAY_TOLERANCE_CURRENT
  ) {
    return true;
  }
  return false;
}
