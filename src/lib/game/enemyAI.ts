/// <reference types="phaser" />
import {
  ASSET_KEYS,
  BIRD_1_BOB_SPEED,
  GAME_CONSTANTS,
} from "@/lib/game/constants";
import type { EnemySprite } from "@/lib/game/types";

export function updateEnemies(
  _scene: Phaser.Scene,
  enemies: EnemySprite[],
  platformLayer: Phaser.Tilemaps.TilemapLayer,
): void {
  for (const enemy of enemies) {
    const enemyBody = enemy.body as Phaser.Physics.Arcade.Body;
    const isFlying = enemy.texture.key === ASSET_KEYS.BIRD_1;
    if (enemy.moveDirection === undefined) {
      enemy.moveDirection = GAME_CONSTANTS.ENEMY.INITIAL_DIRECTION;
    }
    if (!isFlying) {
      const { checkX, checkY } = getEnemySensorPosition(enemy, enemyBody);
      const hasFloor = checkEnemyFloor(platformLayer, checkX, checkY);
      const hitWall = enemyBody.blocked.left || enemyBody.blocked.right;
      const isGake = !hasFloor && enemyBody.blocked.down;
      if (hitWall || isGake) {
        flipEnemy(enemy, enemyBody);
      }
    } else {
      if (
        enemy.startX != null &&
        enemy.range != null &&
        typeof enemy.startX === "number" &&
        typeof enemy.range === "number"
      ) {
        if (
          enemy.moveDirection > 0 &&
          enemy.x >= enemy.startX + enemy.range
        ) {
          flipEnemy(enemy, enemyBody);
        } else if (
          enemy.moveDirection < 0 &&
          enemy.x <= enemy.startX - enemy.range
        ) {
          flipEnemy(enemy, enemyBody);
        }
      }
      if (enemyBody.blocked.left || enemyBody.blocked.right) {
        flipEnemy(enemy, enemyBody);
      }
    }
    enemyBody.setVelocityX(GAME_CONSTANTS.ENEMY.SPEED_X * enemy.moveDirection);
    if (isFlying) {
      const t = _scene.time.now * 0.002;
      enemyBody.setVelocityY(Math.sin(t) * BIRD_1_BOB_SPEED);
    } else if (!enemyBody.blocked.down) {
      enemyBody.setVelocityY(GAME_CONSTANTS.ENEMY.SPEED_Y);
    }
  }
}

function getEnemySensorPosition(
  enemy: EnemySprite,
  enemyBody: Phaser.Physics.Arcade.Body,
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
  checkY: number,
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
  enemyBody: Phaser.Physics.Arcade.Body,
): void {
  enemy.moveDirection *= -1;
  enemy.setFlipX(enemy.moveDirection > 0);
  enemy.x += enemy.moveDirection * GAME_CONSTANTS.ENEMY.FLIP_ADJUST;
  enemyBody.setVelocityY(0);
}
