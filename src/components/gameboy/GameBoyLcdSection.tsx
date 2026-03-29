"use client";

import type { RefObject } from "react";
import { wadotendoBrandFont } from "@/components/gameboy/gameBoyBrandFont";
import { GAME_HEIGHT, GAME_WIDTH } from "@/lib/game/constants";

export function GameBoyLcdSection({
  gameRef,
}: {
  gameRef: RefObject<HTMLDivElement | null>;
}) {
  return (
    <div className="mb-10">
      <div className="rounded-xl bg-[#595959] px-2 py-4">
        <div className="flex items-stretch gap-2">
          <div className="relative min-w-0 flex-1 basis-0 self-stretch overflow-visible">
            <div className="absolute top-[calc(25%-5px)] left-1/2 flex -translate-x-1/2 flex-col items-center gap-0.5">
              <div
                className="h-2.5 w-2.5 shrink-0 rounded-full bg-red-600 shadow-[0_0_6px_rgba(220,38,38,0.85)]"
                aria-hidden
              />
              <span className="text-[0.45rem] font-semibold tracking-widest text-white/85">
                POWER
              </span>
            </div>
          </div>
          <div
            ref={gameRef}
            className="w-[256px] max-w-full shrink-0 touch-none select-none"
            style={{
              aspectRatio: `${GAME_WIDTH} / ${GAME_HEIGHT}`,
              touchAction: "none",
              userSelect: "none",
              WebkitUserSelect: "none",
            }}
          />
          <div className="min-w-0 flex-1 basis-0 self-stretch" aria-hidden />
        </div>
      </div>
      <p className="mt-2 self-start pl-0.5 tracking-wide text-[#333]">
        <span className={`${wadotendoBrandFont.className} text-sm font-semibold`}>
          wadotendo
        </span>
        <span className="pl-1 text-lg font-semibold italic tracking-tighter">
          WADO BOY
          <span className="pl-1 align-baseline text-[0.55rem] font-semibold not-italic">
            TM
          </span>
        </span>
      </p>
    </div>
  );
}
