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
export const PLAYER_START_POSITION: PlayerStartPosition = "Player";

/**
 * 背景を画像で表示するか、灰色にするか（DEBUG 時のみ有効）。
 * - true: 画像（Forest_Background_0.png）を繰り返し表示
 * - false: 灰色の背景
 * DEBUG = false のときは常に画像を使用する。
 */
export const USE_IMAGE_BACKGROUND = true;

/**
 * タイトル画面をスキップしてゲーム本編から始めるか（DEBUG 時のみ有効）。
 * - true: タイトルをスキップし、ゲーム本編から開始
 * - false: タイトル画面を表示し、タッチでゲーム開始
 * DEBUG = false のときは常にタイトル画面から開始する。
 */
export const SKIP_TITLE_SCREEN = false;
