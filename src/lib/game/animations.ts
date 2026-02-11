/// <reference types="phaser" />
import { ASSET_KEYS, GOAL_FLAG_FRAMES } from "@/lib/game/constants";

/** プレイヤー・敵のアニメーションを登録する */
export function createGameAnimations(scene: Phaser.Scene): void {
  scene.anims.create({
    key: "idle",
    frames: scene.anims.generateFrameNumbers(ASSET_KEYS.PLAYER, {
      start: 0,
      end: 3,
    }),
    frameRate: 8,
    repeat: -1,
  });
  scene.anims.create({
    key: "walk",
    frames: scene.anims.generateFrameNumbers(ASSET_KEYS.PLAYER, {
      start: 4,
      end: 7,
    }),
    frameRate: 10,
    repeat: -1,
  });
  scene.anims.create({
    key: "jump",
    frames: [{ key: ASSET_KEYS.PLAYER, frame: 8 }],
    frameRate: 1,
  });
  scene.anims.create({
    key: "fall",
    frames: [{ key: ASSET_KEYS.PLAYER, frame: 9 }],
    frameRate: 1,
  });
  scene.anims.create({
    key: "spider-walk",
    frames: scene.anims.generateFrameNumbers(ASSET_KEYS.SPIDER, {
      start: 0,
      end: 2,
    }),
    frameRate: 8,
    repeat: -1,
  });
  scene.anims.create({
    key: "bird-fly",
    frames: scene.anims.generateFrameNumbers(ASSET_KEYS.BIRD_1, {
      start: 0,
      end: 2,
    }),
    frameRate: 8,
    repeat: -1,
  });
  scene.anims.create({
    key: "goal-flag",
    frames: scene.anims.generateFrameNumbers(ASSET_KEYS.GOAL_FLAG, {
      start: 0,
      end: GOAL_FLAG_FRAMES - 1,
    }),
    frameRate: 8,
    repeat: -1,
  });
}
