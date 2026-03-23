/**
 * Phaser ゲームの設定。他の値もここで調整する。
 */

/** ゲーム全体のデバッグ。true のときデバッグモードが有効になる。 */
export const DEBUG = true;

/**
 * Arcade Physics のデバッグ描画（DEBUG 時のみ有効）。
 * true のとき physics.arcade.debug: true となり、当たり判定などが表示される。
 */
export const ARCADE_DEBUG = false;

/**
 * ステージ番号（DEBUG 時のみ有効）。
 * - 1: 1st ステージ（1st_stage_tilemap.json）
 * - 2: 2nd ステージ（2nd_stage_tilemap.json）
 * - 3: 3rd ステージ（3rd_stage_tilemap.json）
 * DEBUG = false のときは常に 1st ステージを表示する。
 */
export const STAGE_NUMBER = 3;

/**
 * プレイヤーの初期位置（DEBUG 時のみ有効）。
 * - "Player": ステージ最初の地点
 * - "Player_before_goal": ゴール直前の地点
 * DEBUG = false のときは常に "Player" が使われる。
 */
export type PlayerStartPosition = "Player" | "Player_before_goal";
export const PLAYER_START_POSITION: PlayerStartPosition = "Player";

/**
 * プレイヤーの初期残機。
 * DEBUG=true のときだけ値変更が有効になり、DEBUG=false のときは常に 2 に固定する。
 */
const PLAYER_INITIAL_LIVES_WHEN_DEBUG = 5;
export const PLAYER_INITIAL_LIVES = DEBUG ? PLAYER_INITIAL_LIVES_WHEN_DEBUG : 2;

/**
 * プレイヤーの初期コイン数（残機UIの下に表示される数）。
 * DEBUG=true のときだけ値が有効、DEBUG=false のときは常に 0 に固定する。
 */
export const PLAYER_INITIAL_COINS_WHEN_DEBUG = 99;
export const PLAYER_INITIAL_COINS = DEBUG ? PLAYER_INITIAL_COINS_WHEN_DEBUG : 0;

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
export const SKIP_TITLE_SCREEN = true;

/**
 * 単一画像用の画面にする（DEBUG 時のみ有効。他デバッグ項目は無視）。
 * DEBUG = true かつ true のとき、ゲームは作らず灰色の画面だけを表示する。
 * DEBUG = false のときは常に通常ゲームが動作する。
 */
export const CREATE_A_SINGLE_IMAGE = false;
/** CREATE_A_SINGLE_IMAGE 時の背景色（灰色） */
export const CREATE_A_SINGLE_IMAGE_BACKGROUND = 0x808080;

/**
 * BGM をオフにするか（DEBUG 時のみ有効）。
 * - true: アクションゲーム中の BGM を鳴らさない
 * - false: BGM を鳴らす
 * DEBUG = false のときは常に BGM が有効（鳴る）になる。
 */
export const BGM_OFF = false;
