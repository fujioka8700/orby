"use client";

import { type RefObject, useEffect } from "react";
import { createMainScene } from "@/lib/game/createMainScene";
import { getPhaserGameConfig } from "@/lib/game/getPhaserGameConfig";

export function usePhaserGame(containerRef: RefObject<HTMLDivElement | null>) {
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let game: import("phaser").Game | null = null;

    const init = async () => {
      const P = (await import("phaser")).default;
      const GameScene = createMainScene(P);
      game = new P.Game(getPhaserGameConfig(container, GameScene, P));
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
