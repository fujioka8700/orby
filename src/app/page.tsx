"use client";

import { useRef } from "react";
import { GameBoyConsole } from "@/components/gameboy/GameBoyConsole";
import { usePhaserGame } from "@/hooks/usePhaserGame";

export default function HomePage() {
  const gameRef = useRef<HTMLDivElement>(null);
  usePhaserGame(gameRef);

  return <GameBoyConsole gameRef={gameRef} />;
}
