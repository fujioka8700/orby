/**
 * Phaser ゲームの設定。他の値もここで調整する。
 */

/** ゲーム全体のデバッグ。true のときデバッグモードが有効になる。 */
export const DEBUG = true;

/**
 * Arcade Physics のデバッグ描画。
 * true のとき physics.arcade.debug: true となり、当たり判定などが表示される。
 */
export const ARCADE_DEBUG = false;

/**
 * プレイヤーの初期位置（DEBUG 時のみ有効）。
 * - "Player": ステージ最初の地点
 * - "Player_before_goal": ゴール直前の地点
 * DEBUG = false のときは常に "Player" が使われる。
 */
export type PlayerStartPosition = "Player" | "Player_before_goal";
export const PLAYER_START_POSITION: PlayerStartPosition = "Player_before_goal";
