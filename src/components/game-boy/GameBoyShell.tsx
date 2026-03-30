import type { ReactNode } from "react";
import "./game-boy.scss";

export function GameBoyShell({ children }: { children: ReactNode }) {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center bg-white px-4 py-8">
      <div className="w-full max-w-[380px]">
        <div className="rounded-[2rem] bg-[#E1AD01] p-5 pb-6 shadow-[0_12px_36px_rgba(0,0,0,0.14)] ring-1 ring-black/10">
          <div className="game-boy-viewport">{children}</div>
        </div>
      </div>
    </main>
  );
}
