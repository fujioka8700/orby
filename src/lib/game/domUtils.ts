/**
 * Phaser ゲームの DOM コンテナ（キャンバスの親要素）を取得する。
 * iOS Safari で Scale.FIT 時のレターボックス領域のタッチを受け取るために使用する。
 */
export function getGameContainer(scene: Phaser.Scene): HTMLElement | null {
  const canvas = scene.game.canvas;
  const container = canvas?.parentElement ?? getScaleParent(scene);
  return container instanceof HTMLElement ? container : null;
}

function getScaleParent(scene: Phaser.Scene): HTMLElement | null {
  const scale = scene.scale as unknown as { parentNode?: Node };
  const node = scale.parentNode;
  return node instanceof HTMLElement ? node : null;
}

/** コンテナに登録した再開用 touchstart/pointerdown を除去する */
export function removeResumeListeners(
  container: HTMLElement | null,
  handler: (() => void) | null,
): void {
  if (!container || !handler) return;
  container.removeEventListener("touchstart", handler);
  container.removeEventListener("pointerdown", handler);
}
