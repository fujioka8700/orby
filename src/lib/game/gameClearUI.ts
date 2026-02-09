/// <reference types="phaser" />
import { ASSET_KEYS, UI_FONT_FAMILY } from "@/lib/game/constants";
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
  gradientBg.fillGradientStyle(0x2a5a8f, 0x2a5a8f, 0x87ceeb, 0x87ceeb, 1);
  gradientBg.fillRect(0, 0, w, h);
  gradientBg.setScrollFactor(0);
  /** アクションゲーム部分の上に全面で重ねて、ゲーム世界を見えなくする */
  gradientBg.setDepth(999);

  const img = scene.add.image(centerX, centerY, ASSET_KEYS.PLAYER_GAME_COMPLETE);
  img.setOrigin(0.5);
  img.setScrollFactor(0);
  img.setDepth(1000);

  const gameClearText = scene.add.text(centerX, 0, "GAME CLEAR", {
    fontFamily: UI_FONT_FAMILY,
    fontSize: "32px",
    color: "#ffff00",
  });
  gameClearText.setOrigin(0.5);
  gameClearText.setScrollFactor(0);
  gameClearText.setDepth(1001);

  const touchToTitleText = scene.add.text(
    centerX,
    0,
    "Touch to go to the title.",
    {
      fontFamily: "sans-serif",
      fontSize: "16px",
      color: "#ffffff",
    },
  );
  touchToTitleText.setOrigin(0.5);
  touchToTitleText.setScrollFactor(0);
  touchToTitleText.setDepth(1001);

  const imgH = img.displayHeight;
  const gap = 16;
  gameClearText.setPosition(
    centerX,
    centerY - imgH / 2 - gap - gameClearText.displayHeight / 2,
  );
  touchToTitleText.setPosition(
    centerX,
    centerY + imgH / 2 + gap + touchToTitleText.displayHeight / 2,
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
