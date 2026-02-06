/// <reference types="phaser" />
import { GAME_CONSTANTS } from "@/lib/game/constants";
import type { EnemySprite } from "@/lib/game/types";

export function updateEnemies(
  scene: Phaser.Scene,
  enemies: EnemySprite[],
  platformLayer: Phaser.Tilemaps.TilemapLayer
): void {
  for (const enemy of enemies) {
    const enemyBody = enemy.body as Phaser.Physics.Arcade.Body;
    if (enemy.moveDirection === undefined) {
      enemy.moveDirection = GAME_CONSTANTS.ENEMY.INITIAL_DIRECTION;
    }
    const { checkX, checkY } = getEnemySensorPosition(enemy, enemyBody);
    const hasFloor = checkEnemyFloor(platformLayer, checkX, checkY);
    const hitWall = enemyBody.blocked.left || enemyBody.blocked.right;
    const isGake = !hasFloor && enemyBody.blocked.down;
    if (hitWall || isGake) {
      flipEnemy(enemy, enemyBody);
    }
    enemyBody.setVelocityX(
      GAME_CONSTANTS.ENEMY.SPEED_X * enemy.moveDirection
    );
    if (!enemyBody.blocked.down) {
      enemyBody.setVelocityY(GAME_CONSTANTS.ENEMY.SPEED_Y);
    }
  }
}

function getEnemySensorPosition(
  enemy: EnemySprite,
  enemyBody: Phaser.Physics.Arcade.Body
): { checkX: number; checkY: number } {
  const checkX =
    enemy.moveDirection > 0
      ? enemyBody.right + GAME_CONSTANTS.ENEMY.SENSOR_DISTANCE
      : enemyBody.x - GAME_CONSTANTS.ENEMY.SENSOR_DISTANCE;
  const checkY = enemyBody.bottom + GAME_CONSTANTS.ENEMY.SENSOR_DISTANCE;
  return { checkX, checkY };
}

function checkEnemyFloor(
  platformLayer: Phaser.Tilemaps.TilemapLayer,
  checkX: number,
  checkY: number
): boolean {
  const tileAhead = platformLayer.getTileAtWorldXY(checkX, checkY);
  return (
    !!tileAhead &&
    ((tileAhead.properties.collides as boolean) ||
      (tileAhead.properties.oneWay as boolean))
  );
}

function flipEnemy(
  enemy: EnemySprite,
  enemyBody: Phaser.Physics.Arcade.Body
): void {
  enemy.moveDirection *= -1;
  enemy.setFlipX(enemy.moveDirection > 0);
  enemy.x += enemy.moveDirection * GAME_CONSTANTS.ENEMY.FLIP_ADJUST;
  enemyBody.setVelocityY(0);
}
