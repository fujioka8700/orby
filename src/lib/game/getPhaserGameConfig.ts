import {
  GAME_HEIGHT,
  GAME_WIDTH,
  SCENE_BACKGROUND_COLOR,
} from "@/lib/game/constants";
import { ARCADE_DEBUG } from "@/lib/game/phaserConfig";

const GRAVITY_Y = 600;

/**
 * Phaser の GameConfig を組み立てる。
 * phaserConfig と constants を参照し、usePhaserGame から利用する。
 */
export function getPhaserGameConfig(
  container: HTMLElement,
  SceneClass: typeof Phaser.Scene,
  P: typeof Phaser,
): Phaser.Types.Core.GameConfig {
  return {
    type: P.AUTO,
    width: GAME_WIDTH,
    height: GAME_HEIGHT,
    parent: container,
    backgroundColor: SCENE_BACKGROUND_COLOR,
    scene: [SceneClass],
    scale: {
      mode: P.Scale.FIT,
      autoCenter: P.Scale.CENTER_BOTH,
    },
    physics: {
      default: "arcade",
      arcade: {
        gravity: { x: 0, y: GRAVITY_Y },
        debug: ARCADE_DEBUG,
      },
    },
    pixelArt: true,
  };
}
