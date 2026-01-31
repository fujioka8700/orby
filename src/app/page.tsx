"use client";

import { useRef } from "react";
import { VirtualControls } from "@/components/VirtualControls";
import { usePhaserGame } from "@/hooks/usePhaserGame";
import { GAME_HEIGHT, GAME_WIDTH } from "@/lib/game/constants";

export default function GamePage() {
  const gameRef = useRef<HTMLDivElement>(null);
  usePhaserGame(gameRef);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-900 p-4">
      <div ref={gameRef} style={{ width: GAME_WIDTH, height: GAME_HEIGHT }} />
      <VirtualControls />
    </div>
  );
}
