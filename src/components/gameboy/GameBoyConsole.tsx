"use client";

import type { RefObject } from "react";
import { GameBoyActionButtons } from "@/components/gameboy/GameBoyActionButtons";
import { GameBoyDpad } from "@/components/gameboy/GameBoyDpad";
import { GameBoyLcdSection } from "@/components/gameboy/GameBoyLcdSection";
import { GameBoyStartButton } from "@/components/gameboy/GameBoyStartButton";
import { DecorativePill } from "@/components/gameboy/DecorativePill";
import { SpeakerGrille } from "@/components/gameboy/SpeakerGrille";
import { useGameBoyJump } from "@/components/gameboy/useGameBoyJump";

export function GameBoyConsole({
  gameRef,
}: {
  gameRef: RefObject<HTMLDivElement | null>;
}) {
  const { setJump } = useGameBoyJump();

  return (
    <main className="flex min-h-dvh flex-col items-center justify-center bg-white px-4 py-8">
      <div className="w-full max-w-[380px]">
        <div className="rounded-[2rem] bg-[#E1AD01] p-5 pb-6 shadow-[0_12px_36px_rgba(0,0,0,0.14)] ring-1 ring-black/10">
          <GameBoyLcdSection gameRef={gameRef} />

          <div className="mb-10 flex items-center justify-between gap-3 px-0.5">
            <GameBoyDpad onJump={setJump} />
            <GameBoyActionButtons onJump={setJump} />
          </div>

          <div className="mb-4 flex justify-center gap-3">
            <DecorativePill label="SELECT" />
            <GameBoyStartButton />
          </div>

          <SpeakerGrille />
        </div>
      </div>
    </main>
  );
}
