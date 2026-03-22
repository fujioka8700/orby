/// <reference types="phaser" />
import {
  ASSET_KEYS,
  LAVA_FLOOR_CROP_WIDTH,
  LAVA_FLOOR_FRAME_COUNT,
  LAVA_FLOOR_FRAME_HEIGHT,
  LAVA_FLOOR_TRIM_LEFT,
  LAVA_FLOOR_TRIMMED_TEXTURE_PREFIX,
} from "@/lib/game/constants";

/** トリミング済みフレーム用の一意テクスチャキー */
export function lavaFloorTrimmedTextureKey(frameIndex: number): string {
  return `${LAVA_FLOOR_TRIMMED_TEXTURE_PREFIX}_${frameIndex}`;
}

/**
 * LAVA_FLOOR スプライトシートの各フレームから左右トリミングした画像を Canvas テクスチャとして登録する。
 * 既に登録済みなら何もしない（シーン再作成時の二重登録防止）。
 */
export function ensureLavaFloorTrimmedTextures(scene: Phaser.Scene): void {
  const baseKey = ASSET_KEYS.LAVA_FLOOR;
  if (!scene.textures.exists(baseKey)) return;
  const firstTrimmed = lavaFloorTrimmedTextureKey(0);
  if (scene.textures.exists(firstTrimmed)) return;

  const texture = scene.textures.get(baseKey);
  const source = texture.getSourceImage() as CanvasImageSource;

  for (let i = 0; i < LAVA_FLOOR_FRAME_COUNT; i++) {
    const frame = texture.get(i);
    if (!frame) continue;
    const canvas = document.createElement("canvas");
    canvas.width = LAVA_FLOOR_CROP_WIDTH;
    canvas.height = LAVA_FLOOR_FRAME_HEIGHT;
    const ctx = canvas.getContext("2d");
    if (!ctx) continue;
    const sx = frame.cutX + LAVA_FLOOR_TRIM_LEFT;
    const sy = frame.cutY;
    ctx.drawImage(
      source,
      sx,
      sy,
      LAVA_FLOOR_CROP_WIDTH,
      LAVA_FLOOR_FRAME_HEIGHT,
      0,
      0,
      LAVA_FLOOR_CROP_WIDTH,
      LAVA_FLOOR_FRAME_HEIGHT,
    );
    scene.textures.addCanvas(lavaFloorTrimmedTextureKey(i), canvas);
  }
}
