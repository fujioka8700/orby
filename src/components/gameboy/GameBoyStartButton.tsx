"use client";

import { useState } from "react";
import { requestTitleAdvanceFromUi } from "@/lib/game/titleAdvanceBridge";

export function GameBoyStartButton() {
  const [pressed, setPressed] = useState(false);

  return (
    <button
      type="button"
      className={`-rotate-[20deg] rounded-full bg-[#1a1a1a] px-3 py-1.5 text-[0.55rem] font-semibold tracking-widest text-[#666666] select-none touch-none transition-transform active:scale-95 active:bg-[#2a2a2a] ${
        pressed ? "scale-95 bg-[#2a2a2a]" : ""
      }`}
      aria-label="ゲーム開始"
      onMouseDown={() => setPressed(true)}
      onMouseUp={() => setPressed(false)}
      onMouseLeave={() => setPressed(false)}
      onTouchStart={() => setPressed(true)}
      onTouchEnd={() => setPressed(false)}
      onClick={() => requestTitleAdvanceFromUi()}
    >
      START
    </button>
  );
}
