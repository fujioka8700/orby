"use client";

import { type RefObject, useEffect } from "react";
import { createMainScene } from "@/lib/game/createMainScene";
import { UI_FONT_FAMILY } from "@/lib/game/constants";
import { getPhaserGameConfig } from "@/lib/game/getPhaserGameConfig";

export function usePhaserGame(containerRef: RefObject<HTMLDivElement | null>) {
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let game: import("phaser").Game | null = null;

    const init = async () => {
      if (typeof document !== "undefined" && document.fonts?.load) {
        try {
          await Promise.race([
            document.fonts.load(`16px "${UI_FONT_FAMILY}"`).then(() => document.fonts.ready),
            new Promise<void>((resolve) => setTimeout(resolve, 3000)),
          ]);
        } catch {
          // iOS などで document.fonts が失敗してもゲームは起動する（Phaser 側でフォント利用）
        }
      }
      const P = (await import("phaser")).default;
      const GameScene = createMainScene(P);
      game = new P.Game(getPhaserGameConfig(container, GameScene, P));
    };

    init().catch((err) => {
      console.error("Phaser game init failed:", err);
    });

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
