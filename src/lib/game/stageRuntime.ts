import { DEBUG, STAGE_NUMBER } from "@/lib/game/phaserConfig";

/** `scene.restart({ ... })` で渡すステージ進行用データ */
export type RuntimeStageTransitionData = {
  runtimeStageNumber?: 1 | 2 | 3;
  livesCount?: number;
  coinCount?: number;
  /** ステージ1ゴール→2 など、タイトルを挟まず続行する */
  resumeGameWithoutTitle?: boolean;
  /** GAME OVER タッチ後: タイトルへ戻し、タイトルをフェードイン表示する */
  returnToTitleFromGameOver?: boolean;
};

export function getSceneTransitionData(
  scene: Phaser.Scene,
): RuntimeStageTransitionData {
  const raw = scene.sys.settings.data;
  if (!raw || typeof raw !== "object") return {};
  return raw as RuntimeStageTransitionData;
}

/**
 * 実際に遊ぶステージ番号。
 * restart 時に `runtimeStageNumber` があれば最優先、なければ DEBUG / STAGE_NUMBER から決定。
 */
export function getRuntimeStageNumber(scene: Phaser.Scene): 1 | 2 | 3 {
  const d = getSceneTransitionData(scene);
  const rt = d.runtimeStageNumber;
  if (rt === 1 || rt === 2 || rt === 3) return rt;
  if (!DEBUG) return 1;
  /** `phaserConfig` の STAGE_NUMBER は実行時 1|2|3。ソース上はリテラル 1 になりがちなのでここで幅を持たせる */
  const debugStage = STAGE_NUMBER as 1 | 2 | 3;
  if (debugStage === 3) return 3;
  if (debugStage === 2) return 2;
  return 1;
}

/**
 * `restart` 後の `preload` が走る間、背景だけが見えて一瞬明るく／白くなるのを防ぐため真っ黒に保つ。
 * - キャンペーン継続で 2・3 面へ入るとき
 * - GAME OVER からタイトルへ戻るとき
 */
export function shouldHoldBlackThroughRestartPreload(scene: Phaser.Scene): boolean {
  const td = getSceneTransitionData(scene);
  if (td.returnToTitleFromGameOver === true) return true;
  if (td.resumeGameWithoutTitle !== true) return false;
  const n = getRuntimeStageNumber(scene);
  return n === 2 || n === 3;
}

/** `resetSceneStateForRestart` の `resetFX` 直後にフェードオーバーレイを真っ黒に戻すか */
export function shouldSnapBlackOverlayAfterSceneReset(
  transition: RuntimeStageTransitionData,
  effectiveStage: 1 | 2 | 3,
): boolean {
  if (transition.returnToTitleFromGameOver === true) return true;
  if (
    transition.resumeGameWithoutTitle === true &&
    (effectiveStage === 2 || effectiveStage === 3)
  ) {
    return true;
  }
  return false;
}
