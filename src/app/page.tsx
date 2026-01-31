"use client";

import { useEffect, useRef } from "react";

export default function Home() {
  const gameContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = gameContainerRef.current;
    if (!container) return;

    let game: Phaser.Game | null = null;

    const initGame = async () => {
      const Phaser = await import("phaser");

      const config: Phaser.Types.Core.GameConfig = {
        type: Phaser.AUTO,
        width: 800,
        height: 600,
        parent: container,
        backgroundColor: "#2d2d2d",
        scene: {
          create() {
            // 中央にテキスト
            this.add
              .text(400, 280, "Hello Phaser!", {
                fontSize: "48px",
                color: "#fff",
              })
              .setOrigin(0.5);

            // シンプルな図形（円）
            const circle = this.add.circle(400, 380, 40, 0x4ecdc4);
            circle.setInteractive({ useHandCursor: true });

            // クリックで少し動く
            circle.on("pointerdown", () => {
              circle.y += 10;
              if (circle.y > 550) circle.y = 380;
            });
          },
        },
      };

      game = new Phaser.Game(config);
    };

    initGame();

    return () => {
      game?.destroy(true);
    };
  }, []);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-zinc-900 p-4">
      <h1 className="mb-4 text-xl font-semibold text-zinc-100">
        Phaser3 サンプル
      </h1>
      <div ref={gameContainerRef} className="border border-zinc-600" />
      <p className="mt-4 text-sm text-zinc-400">円をクリックすると下に動きます</p>
    </div>
  );
}
