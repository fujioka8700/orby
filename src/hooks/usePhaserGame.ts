"use client";

import { type RefObject, useEffect } from "react";
import { GAME_HEIGHT, GAME_WIDTH } from "@/lib/game/constants";
import { createMainScene } from "@/lib/game/createMainScene";

export function usePhaserGame(containerRef: RefObject<HTMLDivElement | null>) {
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let game: import("phaser").Game | null = null;

    const init = async () => {
      const PhaserModule = await import("phaser");
      const P = PhaserModule.default;
      const GameScene = createMainScene(P);

      game = new P.Game({
        type: P.AUTO,
        width: GAME_WIDTH,
        height: GAME_HEIGHT,
        parent: container,
        backgroundColor: "#2c3e50",
        scene: [GameScene],
        scale: {
          mode: P.Scale.FIT,
          autoCenter: P.Scale.CENTER_BOTH,
        },
        physics: {
          default: "arcade",
          arcade: {
            gravity: { x: 0, y: 600 },
            debug: false,
          },
        },
        pixelArt: true,
      });
    };

    init();

    return () => {
      if (game) {
        try {
          game.destroy(true);
        } catch (error) {
          console.warn("Error destroying Phaser game:", error);
        }
        game = null;
      }
      if (container) {
        while (container.firstChild) {
          container.removeChild(container.firstChild);
        }
        container.innerHTML = "";
      }
    };
  }, [containerRef]);
}
