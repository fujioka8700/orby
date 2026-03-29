/// <reference types="phaser" />

/**
 * Tiled タイルマップのタイルセット名から、gid 判定用の範囲を返す。
 * ステージごとに firstgid が変わるため、定数の firstgid ではなく実行時に解決する。
 */
export function getTilesetGidRange(
  map: Phaser.Tilemaps.Tilemap,
  tilesetName: string,
): { firstGid: number; tileCount: number } | null {
  const ts = map.tilesets.find((t) => t.name === tilesetName);
  if (!ts) return null;
  const firstGid = ts.firstgid;
  const tileCount = ts.total ?? 0;
  if (tileCount <= 0) return null;
  return { firstGid, tileCount };
}

export function isGidInTilesetRange(
  gid: number,
  range: { firstGid: number; tileCount: number } | null,
): boolean {
  if (!range) return false;
  return gid >= range.firstGid && gid < range.firstGid + range.tileCount;
}
