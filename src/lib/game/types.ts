/// <reference types="phaser" />

/** 敵スプライト（移動方向を持つ） */
export interface EnemySprite extends Phaser.Physics.Arcade.Sprite {
  moveDirection: number;
  /** Bird_1 / Spider(Enemies層) 用：初期X。range と組み合わせて往復範囲を決める */
  startX?: number;
  /** Bird_1 / Spider(Enemies層) 用：往復の半幅（px）。タイルマップの range プロパティ */
  range?: number;
  /** Spider / Bird 用：移動速度（px/秒）。未設定時は GAME_CONSTANTS.ENEMY.SPEED_X */
  speed?: number;
}
