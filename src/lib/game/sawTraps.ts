/**
 * 3rd ステージのノコギリトラップとレール表示。
 * Tiled の sawPath レイヤー（レール用 gid オブジェクト + 軌道用 Polyline）から生成する。
 */
import {
  ASSET_KEYS,
  DEPTH_PLAYER_AND_ENEMY,
  DEPTH_RAILS,
  RAILS_FIRST_GID,
  RAILS_TILE_COUNT,
  RAILS_TILE_SIZE,
  SAW_FOLLOW_DURATION_MS,
  SAW_PATH_LAYER_NAME,
} from "@/lib/game/constants";

type PolylinePoint = { x: number; y: number };

const DATA_SAW_FOLLOW_CONFIG = "sawFollowConfig";
const DATA_SAW_START_X = "sawStartX";
const DATA_SAW_START_Y = "sawStartY";

const sawFollowConfig = {
  duration: SAW_FOLLOW_DURATION_MS,
  repeat: -1,
  yoyo: true,
  rotateToPath: false,
};

/**
 * ポリラインがレールの端に描かれている想定で、ノコギリの中心がレール中央を通るオフセットを返す。
 */
export function getSawPathCenterOffset(
  polyline: PolylinePoint[],
  tileSize: number,
): { x: number; y: number } {
  if (polyline.length < 2) {
    const half = tileSize / 2;
    return { x: half, y: half };
  }
  const dx = Math.abs(polyline[polyline.length - 1].x - polyline[0].x);
  const dy = Math.abs(polyline[polyline.length - 1].y - polyline[0].y);
  if (dx >= dy) return { x: 0, y: tileSize };
  return { x: tileSize, y: 0 };
}

/**
 * sawPath レイヤー内のレールタイル（gid オブジェクト）をシーンに配置する。
 */
export function placeRailsFromLayer(
  scene: Phaser.Scene,
  map: Phaser.Tilemaps.Tilemap,
): void {
  const layer = map.getObjectLayer(SAW_PATH_LAYER_NAME);
  if (!layer) return;

  const half = RAILS_TILE_SIZE / 2;
  for (const obj of layer.objects) {
    const gid = (obj as { gid?: number }).gid;
    if (gid == null) continue;
    if (gid < RAILS_FIRST_GID || gid >= RAILS_FIRST_GID + RAILS_TILE_COUNT)
      continue;
    const x = ((obj as { x?: number }).x ?? 0) + half;
    const y = ((obj as { y?: number }).y ?? 0) + half;
    const frame = gid - RAILS_FIRST_GID;
    const img = scene.add.image(x, y, ASSET_KEYS.RAILS, frame);
    img.setDepth(DEPTH_RAILS);
  }
}

/**
 * sawPath レイヤーの Polyline オブジェクトからノコギリ（PathFollower）を生成し、グループで返す。
 * レールの配置は行わない（placeRailsFromLayer を別途呼ぶ想定）。
 */
export function createSawFollowers(
  scene: Phaser.Scene,
  map: Phaser.Tilemaps.Tilemap,
): Phaser.GameObjects.Group {
  const group = scene.add.group();
  const layer = map.getObjectLayer(SAW_PATH_LAYER_NAME);
  if (!layer) return group;

  for (const obj of layer.objects) {
    const tiledObj = obj as {
      gid?: number;
      x?: number;
      y?: number;
      polyline?: PolylinePoint[];
    };
    if (tiledObj.gid != null) continue;
    const polyline = tiledObj.polyline;
    if (!polyline || polyline.length < 2) continue;

    const baseX = tiledObj.x ?? 0;
    const baseY = tiledObj.y ?? 0;
    const pathOffset = getSawPathCenterOffset(polyline, RAILS_TILE_SIZE);
    const points = polyline.map((p) => ({
      x: baseX + p.x + pathOffset.x,
      y: baseY + p.y + pathOffset.y,
    }));

    const path = new Phaser.Curves.Path(points[0].x, points[0].y);
    for (let i = 1; i < points.length; i++) {
      path.lineTo(points[i].x, points[i].y);
    }

    const saw = scene.add.follower(
      path,
      points[0].x,
      points[0].y,
      ASSET_KEYS.CIRCULAR_SAW,
    );
    saw.setOrigin(0.5, 0.5);
    saw.setData(DATA_SAW_FOLLOW_CONFIG, sawFollowConfig);
    saw.setData(DATA_SAW_START_X, points[0].x);
    saw.setData(DATA_SAW_START_Y, points[0].y);
    saw.startFollow(sawFollowConfig);
    scene.physics.add.existing(saw);
    const body = saw.body as Phaser.Physics.Arcade.Body;
    body.setAllowGravity(false);
    body.setImmovable(true);
    body.setCircle((saw.width as number) / 2);
    saw.setDepth(DEPTH_PLAYER_AND_ENEMY);
    group.add(saw);
  }

  return group;
}

/** タイトル待機後のゲーム開始など：PathFollower を軌道の先頭に戻して追従をやり直す。 */
export function resetSawFollowersToStart(
  group: Phaser.GameObjects.Group | undefined,
): void {
  if (!group) return;
  for (const child of group.getChildren()) {
    const saw = child as Phaser.GameObjects.PathFollower;
    const cfg = saw.getData(DATA_SAW_FOLLOW_CONFIG) as
      | typeof sawFollowConfig
      | undefined;
    if (!cfg) continue;
    saw.stopFollow();
    const sx = saw.getData(DATA_SAW_START_X) as number;
    const sy = saw.getData(DATA_SAW_START_Y) as number;
    saw.setPosition(sx, sy);
    saw.angle = 0;
    const body = saw.body as Phaser.Physics.Arcade.Body | undefined;
    if (body) {
      body.setVelocity(0, 0);
      body.updateFromGameObject();
    }
    saw.startFollow(cfg);
  }
}
