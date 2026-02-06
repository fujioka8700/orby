/// <reference types="phaser" />

/** プレイヤー・敵のアニメーションを登録する */
export function createGameAnimations(scene: Phaser.Scene): void {
  scene.anims.create({
    key: "idle",
    frames: scene.anims.generateFrameNumbers("player", { start: 0, end: 3 }),
    frameRate: 8,
    repeat: -1,
  });
  scene.anims.create({
    key: "walk",
    frames: scene.anims.generateFrameNumbers("player", { start: 4, end: 7 }),
    frameRate: 10,
    repeat: -1,
  });
  scene.anims.create({
    key: "jump",
    frames: [{ key: "player", frame: 8 }],
    frameRate: 1,
  });
  scene.anims.create({
    key: "fall",
    frames: [{ key: "player", frame: 9 }],
    frameRate: 1,
  });
  scene.anims.create({
    key: "spider-walk",
    frames: scene.anims.generateFrameNumbers("spider", { start: 0, end: 2 }),
    frameRate: 8,
    repeat: -1,
  });
}
