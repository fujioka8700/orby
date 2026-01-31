"use client";

import Phaser from "phaser";
import { useEffect, useRef } from "react";

class MainScene extends Phaser.Scene {
  private ball!: Phaser.GameObjects.Arc;
  private velocity = { x: 200, y: 200 };

  constructor() {
    super({ key: "MainScene" });
  }

  create() {
    this.add
      .text(400, 80, "Phaser 3 Sample", {
        fontSize: "32px",
        color: "#fff",
      })
      .setOrigin(0.5);

    this.ball = this.add.circle(400, 300, 24, 0x00ff88);
    this.ball.setStrokeStyle(2, 0xffffff);
  }

  update(_time: number, delta: number) {
    const speed = (delta / 1000) * 200;
    this.ball.x += this.velocity.x * speed;
    this.ball.y += this.velocity.y * speed;

    const { width, height } = this.scale;
    if (this.ball.x <= 24 || this.ball.x >= width - 24) this.velocity.x *= -1;
    if (this.ball.y <= 24 || this.ball.y >= height - 24) this.velocity.y *= -1;
  }
}

export default function PhaserGame() {
  const containerRef = useRef<HTMLDivElement>(null);
  const gameRef = useRef<Phaser.Game | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const config: Phaser.Types.Core.GameConfig = {
      type: Phaser.AUTO,
      width: 800,
      height: 600,
      parent: containerRef.current,
      backgroundColor: "#2d2d2d",
      scene: [MainScene],
      scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH,
      },
    };

    gameRef.current = new Phaser.Game(config);

    return () => {
      gameRef.current?.destroy(true);
      gameRef.current = null;
    };
  }, []);

  return <div ref={containerRef} className="min-h-[400px] w-full" />;
}
