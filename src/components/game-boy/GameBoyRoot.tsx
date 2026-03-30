"use client";

import { GameBoy } from "./GameBoy";
import { GameBoyShell } from "./GameBoyShell";

/** トップページ用: シェル＋CSS 本体＋Phaser LCD */
export function GameBoyRoot() {
  return (
    <GameBoyShell>
      <GameBoy />
    </GameBoyShell>
  );
}
