"use client";

import { memo, useRef } from "react";
import { usePhaserGame } from "@/hooks/usePhaserGame";

function GameBoy2OrbyDisplayImpl() {
  const gameRef = useRef<HTMLDivElement>(null);
  usePhaserGame(gameRef);

  return (
    <div
      ref={gameRef}
      className="gb__phaserMount"
      style={{
        touchAction: "none",
        userSelect: "none",
        WebkitUserSelect: "none",
      }}
    />
  );
}

/** 親の再レンダーで Phaser が付与した canvas が消えるのを防ぐ */
export const GameBoy2OrbyDisplay = memo(GameBoy2OrbyDisplayImpl);
export default GameBoy2OrbyDisplay;
