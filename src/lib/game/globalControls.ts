/** Phaser シーンと React コンポーネント間で共有するコントロール状態 */
export const globalControls = {
  left: false,
  right: false,
  up: false,
};

/** タイトル復帰・シーン再起動時などに押下状態を消す（キーが残ったままになるのを防ぐ） */
export function resetGlobalControls(): void {
  globalControls.left = false;
  globalControls.right = false;
  globalControls.up = false;
}
