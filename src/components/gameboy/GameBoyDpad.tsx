"use client";

import type { MouseEvent, TouchEvent } from "react";
import { useState } from "react";
import {
  setPad,
  type JumpSource,
  type PadKey,
} from "@/components/gameboy/gameBoyShared";

export function GameBoyDpad({
  onJump,
}: {
  onJump: (key: JumpSource, down: boolean) => void;
}) {
  const [active, setActive] = useState<Partial<Record<PadKey, boolean>>>({});

  const onDown = (key: PadKey) => (e: MouseEvent | TouchEvent) => {
    e.preventDefault();
    if (key === "up") onJump("padUp", true);
    else setPad(key, true);
    setActive((a) => ({ ...a, [key]: true }));
  };
  const onUp = (key: PadKey) => (e: MouseEvent | TouchEvent) => {
    e.preventDefault();
    if (key === "up") onJump("padUp", false);
    else setPad(key, false);
    setActive((a) => ({ ...a, [key]: false }));
  };

  const hit =
    "absolute z-[3] flex cursor-pointer select-none touch-none items-center justify-center bg-transparent";

  const anyPad = !!(active.up || active.left || active.right);

  return (
    <div
      className="relative h-[9.1rem] w-[9.1rem] shrink-0"
      style={{ touchAction: "none" }}
    >
      <div className="pointer-events-none absolute inset-[4px]" aria-hidden>
        <div
          className={`absolute inset-y-0 left-1/2 w-[3.25rem] -translate-x-1/2 rounded-sm transition-colors ${
            anyPad ? "bg-[#2a2a2a]" : "bg-[#1a1a1a]"
          }`}
        />
        <div
          className={`absolute inset-x-0 top-1/2 h-[3.25rem] -translate-y-1/2 rounded-sm transition-colors ${
            anyPad ? "bg-[#2a2a2a]" : "bg-[#1a1a1a]"
          }`}
        />
      </div>
      {active.up && (
        <div
          className="pointer-events-none absolute top-[4px] left-1/2 z-[1] h-[38%] w-[3.25rem] -translate-x-1/2 rounded-t-sm bg-black/25"
          aria-hidden
        />
      )}
      {active.left && (
        <div
          className="pointer-events-none absolute top-1/2 left-[4px] z-[1] h-[3.25rem] w-[38%] -translate-y-1/2 rounded-l-sm bg-black/25"
          aria-hidden
        />
      )}
      {active.right && (
        <div
          className="pointer-events-none absolute top-1/2 right-[4px] z-[1] h-[3.25rem] w-[38%] -translate-y-1/2 rounded-r-sm bg-black/25"
          aria-hidden
        />
      )}
      <div
        className="pointer-events-none absolute inset-0 z-[2] text-base text-[#666]"
        aria-hidden
      >
        <span className="absolute top-4 left-1/2 -translate-x-1/2">▲</span>
        <span className="absolute top-1/2 left-4 -translate-y-1/2">◀</span>
        <span className="absolute top-1/2 right-4 -translate-y-1/2">▶</span>
        <span className="absolute bottom-4 left-1/2 -translate-x-1/2 opacity-35">
          ▼
        </span>
      </div>
      <button
        type="button"
        aria-label="上（ジャンプ）"
        className={`${hit} top-0 left-1/2 h-[42%] w-[4.55rem] -translate-x-1/2 pt-1`}
        onMouseDown={onDown("up")}
        onMouseUp={onUp("up")}
        onMouseLeave={onUp("up")}
        onTouchStart={onDown("up")}
        onTouchEnd={onUp("up")}
      />
      <button
        type="button"
        aria-label="左"
        className={`${hit} top-1/2 left-0 h-[4.55rem] w-[42%] -translate-y-1/2 pl-1`}
        onMouseDown={onDown("left")}
        onMouseUp={onUp("left")}
        onMouseLeave={onUp("left")}
        onTouchStart={onDown("left")}
        onTouchEnd={onUp("left")}
      />
      <button
        type="button"
        aria-label="右"
        className={`${hit} top-1/2 right-0 h-[4.55rem] w-[42%] -translate-y-1/2 pr-1`}
        onMouseDown={onDown("right")}
        onMouseUp={onUp("right")}
        onMouseLeave={onUp("right")}
        onTouchStart={onDown("right")}
        onTouchEnd={onUp("right")}
      />
    </div>
  );
}
