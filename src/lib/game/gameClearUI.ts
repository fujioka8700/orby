/// <reference types="phaser" />
import {
  ASSET_KEYS,
  GAME_CLEAR_BG_GRADIENT_BOTTOM,
  GAME_CLEAR_BG_GRADIENT_TOP,
  GAME_CLEAR_DEPTH_BG,
  GAME_CLEAR_DEPTH_IMAGE,
  GAME_CLEAR_DEPTH_TEXT,
  GAME_CLEAR_TITLE_TEXT,
  GAME_CLEAR_TOUCH_TO_TITLE_TEXT,
  GAME_CLEAR_UI_GAP,
  UI_FONT_FAMILY,
} from "@/lib/game/constants";
import { createGameClearConfetti } from "@/lib/game/gameClearConfetti";
import type { GameClearConfetti } from "@/lib/game/gameClearConfetti";

export interface GameClearScreenOptions {
  /** 画面タッチでタイトルへ戻る際に一度だけ呼ばれる */
  onTouchToTitle?: () => void;
}

export interface GameClearScreen {
  update(): void;
  destroy(): void;
}

/**
 * 本番・仮表示共通のゲームクリア画面UI（グラデ背景・キャラ画像・GAME CLEAR・Touch to go to the title・コンフェetti）
 */
export function createGameClearScreen(
  scene: Phaser.Scene,
  options: GameClearScreenOptions = {},
): GameClearScreen {
  const { onTouchToTitle } = options;
  const w = scene.cameras.main.width;
  const h = scene.cameras.main.height;
  const centerX = w / 2;
  const centerY = h / 2;

  const gradientBg = scene.add.graphics();
  gradientBg.fillGradientStyle(
    GAME_CLEAR_BG_GRADIENT_TOP,
    GAME_CLEAR_BG_GRADIENT_TOP,
    GAME_CLEAR_BG_GRADIENT_BOTTOM,
    GAME_CLEAR_BG_GRADIENT_BOTTOM,
    1,
  );
  gradientBg.fillRect(0, 0, w, h);
  gradientBg.setScrollFactor(0);
  gradientBg.setDepth(GAME_CLEAR_DEPTH_BG);

  const img = scene.add.image(centerX, centerY, ASSET_KEYS.PLAYER_GAME_COMPLETE);
  img.setOrigin(0.5);
  img.setScrollFactor(0);
  img.setDepth(GAME_CLEAR_DEPTH_IMAGE);

  const gameClearText = scene.add.text(centerX, 0, GAME_CLEAR_TITLE_TEXT, {
    fontFamily: UI_FONT_FAMILY,
    fontSize: "32px",
    color: "#ffff00",
  });
  gameClearText.setOrigin(0.5);
  gameClearText.setScrollFactor(0);
  gameClearText.setDepth(GAME_CLEAR_DEPTH_TEXT);

  const touchToTitleText = scene.add.text(
    centerX,
    0,
    GAME_CLEAR_TOUCH_TO_TITLE_TEXT,
    {
      fontFamily: "sans-serif",
      fontSize: "16px",
      color: "#ffffff",
    },
  );
  touchToTitleText.setOrigin(0.5);
  touchToTitleText.setScrollFactor(0);
  touchToTitleText.setDepth(GAME_CLEAR_DEPTH_TEXT);

  const imgH = img.displayHeight;
  gameClearText.setPosition(
    centerX,
    centerY - imgH / 2 - GAME_CLEAR_UI_GAP - gameClearText.displayHeight / 2,
  );
  touchToTitleText.setPosition(
    centerX,
    centerY + imgH / 2 + GAME_CLEAR_UI_GAP + touchToTitleText.displayHeight / 2,
  );

  const confetti: GameClearConfetti = createGameClearConfetti(scene, w, h);

  if (onTouchToTitle) {
    scene.input.once("pointerdown", () => onTouchToTitle());
  }

  function update() {
    confetti.update();
  }

  function destroy() {
    confetti.destroy();
    gradientBg.destroy();
    img.destroy();
    gameClearText.destroy();
    touchToTitleText.destroy();
  }

  return { update, destroy };
}
