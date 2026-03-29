"use client";

import { useState } from "react";
import type { JumpSource } from "@/components/gameboy/gameBoyShared";

export function GameBoyActionButtons({
  onJump,
}: {
  onJump: (key: JumpSource, down: boolean) => void;
}) {
  const [aDown, setADown] = useState(false);

  return (
    <div className="pr-1">
      <button
        type="button"
        aria-label="A（ジャンプ）"
        className={`flex h-24 w-24 select-none touch-none items-center justify-center rounded-full border-2 border-[#111] bg-[#1a1a1a] text-2xl font-bold text-[#666666] transition-transform active:scale-95 active:bg-[#2a2a2a] ${
          aDown ? "scale-95 bg-[#2a2a2a]" : ""
        }`}
        onMouseDown={(e) => {
          e.preventDefault();
          onJump("a", true);
          setADown(true);
        }}
        onMouseUp={(e) => {
          e.preventDefault();
          onJump("a", false);
          setADown(false);
        }}
        onMouseLeave={(e) => {
          e.preventDefault();
          onJump("a", false);
          setADown(false);
        }}
        onTouchStart={(e) => {
          e.preventDefault();
          onJump("a", true);
          setADown(true);
        }}
        onTouchEnd={(e) => {
          e.preventDefault();
          onJump("a", false);
          setADown(false);
        }}
      >
        A
      </button>
    </div>
  );
}
