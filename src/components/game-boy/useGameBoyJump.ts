"use client";

import { useCallback, useEffect, useState } from "react";
import { globalControls } from "@/lib/game/globalControls";
import type { JumpSource } from "./gameBoyShared";

export function useGameBoyJump() {
  const [jumpFrom, setJumpFrom] = useState<Record<JumpSource, boolean>>({
    padUp: false,
    a: false,
  });

  useEffect(() => {
    globalControls.up = jumpFrom.padUp || jumpFrom.a;
  }, [jumpFrom]);

  const setJump = useCallback((key: JumpSource, down: boolean) => {
    setJumpFrom((prev) => ({ ...prev, [key]: down }));
  }, []);

  return { setJump };
}
