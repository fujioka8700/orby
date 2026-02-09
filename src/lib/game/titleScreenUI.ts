/// <reference types="phaser" />
import {
  ASSET_KEYS,
  GAME_HEIGHT,
  GAME_WIDTH,
  TITLE_BACKGROUND_COLOR,
  TITLE_BLINK_INTERVAL_MS,
  TITLE_COPYRIGHT_FONT_SIZE,
  TITLE_COPYRIGHT_OFFSET_Y,
  TITLE_COPYRIGHT_TEXT,
  TITLE_DISPLAY_HEIGHT,
  TITLE_TEXT_PADDING,
  TITLE_TOUCH_FONT_SIZE,
  TITLE_TOUCH_OFFSET_Y,
  TITLE_TOUCH_TEXT,
  TITLE_TOP_Y,
  UI_FONT_FAMILY,
} from "@/lib/game/constants";

export interface TitleScreenUI {
  /** タイトル画面のオブジェクトを破棄する（点滅タイマー含む） */
  destroy(): void;
}

/** タイトル画面の背景・画像・「Touch to start」・著作権表示を作成し、destroy を返す */
export function createTitleScreen(scene: Phaser.Scene): TitleScreenUI {
  const centerX = GAME_WIDTH / 2;

  const background = scene.add.rectangle(
    centerX,
    GAME_HEIGHT / 2,
    GAME_WIDTH,
    GAME_HEIGHT,
    TITLE_BACKGROUND_COLOR,
    1,
  );
  background.setOrigin(0.5);
  background.setScrollFactor(0);
  background.setDepth(1999);

  const tex = scene.textures.get(ASSET_KEYS.TITLE);
  const scale = TITLE_DISPLAY_HEIGHT / tex.getSourceImage().height;
  const titleHeight = TITLE_DISPLAY_HEIGHT;
  const titleY = TITLE_TOP_Y + titleHeight / 2;

  const titleImage = scene.add.image(centerX, titleY, ASSET_KEYS.TITLE);
  titleImage.setOrigin(0.5);
  titleImage.setScrollFactor(0);
  titleImage.setScale(scale);
  titleImage.setDepth(2000);

  const touchY = titleY + titleHeight / 2 + TITLE_TOUCH_OFFSET_Y;
  const touchText = scene.add.text(centerX, touchY, TITLE_TOUCH_TEXT, {
    fontFamily: UI_FONT_FAMILY,
    fontSize: TITLE_TOUCH_FONT_SIZE,
    color: "#ffffff",
    padding: TITLE_TEXT_PADDING,
  });
  touchText.setOrigin(0.5);
  touchText.setScrollFactor(0);
  touchText.setDepth(2001);

  const blinkTimer = scene.time.addEvent({
    delay: TITLE_BLINK_INTERVAL_MS,
    callback: () => {
      touchText.setAlpha(touchText.alpha === 1 ? 0 : 1);
    },
    loop: true,
  });

  const copyrightY = touchY + TITLE_COPYRIGHT_OFFSET_Y;
  const copyrightText = scene.add.text(
    centerX,
    copyrightY,
    TITLE_COPYRIGHT_TEXT,
    {
      fontFamily: "sans-serif",
      fontSize: TITLE_COPYRIGHT_FONT_SIZE,
      color: "#ffffff",
      padding: TITLE_TEXT_PADDING,
    },
  );
  copyrightText.setOrigin(0.5);
  copyrightText.setScrollFactor(0);
  copyrightText.setDepth(2001);

  function destroy() {
    blinkTimer.destroy();
    background.destroy();
    titleImage.destroy();
    touchText.destroy();
    copyrightText.destroy();
  }

  return { destroy };
}
