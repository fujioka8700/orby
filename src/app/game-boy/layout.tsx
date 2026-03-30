import type { ReactNode } from "react";
import { GameBoyShell } from "./GameBoyShell";

export default function GameBoyLayout({ children }: { children: ReactNode }) {
  return <GameBoyShell>{children}</GameBoyShell>;
}
