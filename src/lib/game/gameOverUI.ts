/// <reference types="phaser" />
import {
  GAME_HEIGHT,
  GAME_OVER_CONTINUE_FONT_SIZE,
  GAME_OVER_CONTINUE_OFFSET_Y,
  GAME_OVER_FONT_SIZE,
  GAME_OVER_OVERLAY_ALPHA,
  GAME_WIDTH,
  UI_FONT_FAMILY,
} from "@/lib/game/constants";

export interface GameOverUI {
  overlay: Phaser.GameObjects.Rectangle;
  gameOverText: Phaser.GameObjects.Text;
  continueText: Phaser.GameObjects.Text;
}

/** GAME OVER のオーバーレイとテキストを作成する */
export function createGameOverUI(scene: Phaser.Scene): GameOverUI {
  const centerX = GAME_WIDTH / 2;
  const centerY = GAME_HEIGHT / 2;

  const overlay = scene.add.rectangle(
    centerX,
    centerY,
    GAME_WIDTH,
    GAME_HEIGHT,
    0x000000,
    GAME_OVER_OVERLAY_ALPHA,
  );
  overlay.setOrigin(0.5);
  overlay.setScrollFactor(0);
  overlay.setDepth(1000);

  const gameOverText = scene.add.text(centerX, centerY, "GAME OVER", {
    fontFamily: UI_FONT_FAMILY,
    fontSize: GAME_OVER_FONT_SIZE,
    color: "#ffffff",
  });
  gameOverText.setOrigin(0.5);
  gameOverText.setScrollFactor(0);
  gameOverText.setDepth(1001);

  const continueY = centerY + GAME_OVER_CONTINUE_OFFSET_Y;
  const continueText = scene.add.text(centerX, continueY, "Touch to continue", {
    fontFamily: UI_FONT_FAMILY,
    fontSize: GAME_OVER_CONTINUE_FONT_SIZE,
    color: "#ffffff",
  });
  continueText.setOrigin(0.5);
  continueText.setScrollFactor(0);
  continueText.setDepth(1001);

  return { overlay, gameOverText, continueText };
}
