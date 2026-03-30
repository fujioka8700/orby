"use client";

import { type RefObject, useEffect, useRef } from "react";
import { UI_FONT_FAMILY } from "@/lib/game/constants";
import { getPhaserGameConfig } from "@/lib/game/getPhaserGameConfig";

export type PhaserDisplayScaleMode = "fit" | "envelop";

function waitNextPaint(): Promise<void> {
  return new Promise((resolve) => {
    requestAnimationFrame(() => {
      requestAnimationFrame(() => resolve());
    });
  });
}

/** 親に実寸が付くまで待つ（flex / transform 下で 0 のまま boot するのを防ぐ） */
function waitForNonZeroLayoutSize(
  el: HTMLElement,
  timeoutMs = 3000,
): Promise<boolean> {
  const hasSize = () => el.clientWidth >= 2 && el.clientHeight >= 2;
  if (hasSize()) return Promise.resolve(true);

  return new Promise((resolve) => {
    const done = (ok: boolean) => {
      clearTimeout(timer);
      ro.disconnect();
      resolve(ok);
    };
    const ro = new ResizeObserver(() => {
      if (hasSize()) done(true);
    });
    ro.observe(el);
    const timer = setTimeout(() => done(hasSize()), timeoutMs);
  });
}

/** Phaser.Game 相当（トップレベルで phaser を import しないため最小形状のみ） */
type PhaserGameHandle = {
  // Phaser.Game#destroy の first-arg は boolean 必須の型になっているため、
  // このハンドルでも必須引数として合わせる（本コード側では常に destroy(true) だけ呼んでいる）
  destroy: (removeCanvas: boolean, noReturn?: boolean) => void;
  scale: { refresh: () => void };
};

export function usePhaserGame(
  containerRef: RefObject<HTMLDivElement | null>,
  displayScaleMode: PhaserDisplayScaleMode = "fit",
) {
  const scaleModeRef = useRef(displayScaleMode);
  scaleModeRef.current = displayScaleMode;

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let disposed = false;
    let game: PhaserGameHandle | null = null;
    let resizeObs: ResizeObserver | null = null;

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
      if (disposed) return;

      const [P, { createMainScene }] = await Promise.all([
        import("phaser"),
        import("@/lib/game/createMainScene"),
      ]);
      if (disposed) return;

      const mode = scaleModeRef.current;
      const GameScene = createMainScene(P as Parameters<typeof createMainScene>[0]);
      const scaleOverrides =
        mode === "envelop"
          ? {
              // Phaser's ScaleConfig `mode` expects the ScaleModes value; `as const` causes TS error here.
              mode: P.Scale.ENVELOP,
              autoCenter: P.Scale.CENTER_BOTH,
            }
          : undefined;

      await waitNextPaint();
      if (disposed) return;
      if (!container.isConnected) return;

      const sized = await waitForNonZeroLayoutSize(container);
      if (disposed) return;
      if (!sized) {
        console.warn(
          "Phaser: game container kept zero layout size; boot may be invisible.",
        );
      }

      game = new P.Game(
        getPhaserGameConfig(
          container,
          GameScene,
          P as Parameters<typeof getPhaserGameConfig>[2],
          scaleOverrides,
        ),
      );
      if (disposed) {
        try {
          game.destroy(true);
        } catch {
          // ignore
        }
        game = null;
        return;
      }

      const syncScaleToContainer = () => {
        if (!disposed && game && container.isConnected) {
          try {
            game.scale.refresh();
          } catch {
            // ignore
          }
        }
      };

      requestAnimationFrame(syncScaleToContainer);

      resizeObs = new ResizeObserver(syncScaleToContainer);
      resizeObs.observe(container);

      requestAnimationFrame(syncScaleToContainer);
    };

    init().catch((err) => {
      console.error("Phaser game init failed:", err);
    });

    return () => {
      disposed = true;
      resizeObs?.disconnect();
      resizeObs = null;
      if (game) {
        try {
          game.destroy(true);
        } catch (error) {
          console.warn("Error destroying Phaser game:", error);
        }
        game = null;
      }
    };
  }, [containerRef, displayScaleMode]);
}
