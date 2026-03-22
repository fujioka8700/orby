/// <reference types="phaser" />
import { shouldHoldBlackThroughRestartPreload } from "@/lib/game/stageRuntime";

type FadeEffectInternals = {
  isRunning: boolean;
  isComplete: boolean;
  direction: boolean;
  alpha: number;
  red: number;
  green: number;
  blue: number;
  progress: number;
};

/**
 * Phaser のフェードを「アウト完了・真っ黒オーバーレイ」状態に即座に合わせる。
 * resetFX 直後や preload 中のチラつき対策用。
 */
export function snapMainCameraFadeToCompletedBlackout(scene: Phaser.Scene): void {
  const fade = scene.cameras.main.fadeEffect as unknown as FadeEffectInternals;
  fade.isRunning = false;
  fade.isComplete = true;
  fade.direction = true;
  fade.alpha = 1;
  fade.red = 0;
  fade.green = 0;
  fade.blue = 0;
  fade.progress = 1;
}

/**
 * `restart` 直後の `preload` でチラつきを防ぐ（カメラ背景・フェード・キャンバス CSS）。
 * @returns キャンバスに黒背景を付けたか（シーン側の保持フラグ用）
 */
export function applyRestartPreloadBlackHoldIfNeeded(scene: Phaser.Scene): boolean {
  if (!shouldHoldBlackThroughRestartPreload(scene)) return false;
  scene.cameras.main.setBackgroundColor(0x000000);
  snapMainCameraFadeToCompletedBlackout(scene);
  const canvas = scene.game.canvas;
  if (!canvas) return false;
  canvas.style.backgroundColor = "#000000";
  return true;
}

/** {@link applyRestartPreloadBlackHoldIfNeeded} で付けたキャンバス背景を戻す */
export function restoreCanvasStyleAfterBlackHold(scene: Phaser.Scene): void {
  const canvas = scene.game.canvas;
  if (canvas) canvas.style.backgroundColor = "";
}
