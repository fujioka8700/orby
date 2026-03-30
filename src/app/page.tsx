import { GameBoy } from "@/app/game-boy/GameBoy";
import { GameBoyShell } from "@/app/game-boy/GameBoyShell";

export default function HomePage() {
  return (
    <GameBoyShell>
      <GameBoy />
    </GameBoyShell>
  );
}
