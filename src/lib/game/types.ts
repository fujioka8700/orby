/// <reference types="phaser" />

/** 敵スプライト（移動方向を持つ） */
export interface EnemySprite extends Phaser.Physics.Arcade.Sprite {
  moveDirection: number;
}
