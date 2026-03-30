"use client";

import { memo, useRef } from "react";
import { usePhaserGame } from "@/hooks/usePhaserGame";

function GameBoyOrbyDisplayImpl() {
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
export const GameBoyOrbyDisplay = memo(GameBoyOrbyDisplayImpl);
export default GameBoyOrbyDisplay;
