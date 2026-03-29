"use client";

import { useEffect, useState } from "react";
import { globalControls } from "@/lib/game/globalControls";
import type { JumpSource } from "@/components/gameboy/gameBoyShared";

export function useGameBoyJump() {
  const [jumpFrom, setJumpFrom] = useState<Record<JumpSource, boolean>>({
    padUp: false,
    a: false,
  });

  useEffect(() => {
    globalControls.up = jumpFrom.padUp || jumpFrom.a;
  }, [jumpFrom]);

  const setJump = (key: JumpSource, down: boolean) => {
    setJumpFrom((prev) => ({ ...prev, [key]: down }));
  };

  return { setJump };
}
