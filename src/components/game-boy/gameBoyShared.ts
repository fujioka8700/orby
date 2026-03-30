import { globalControls } from "@/lib/game/globalControls";

export type PadKey = "left" | "right" | "up" | "down";

export type JumpSource = "padUp" | "a";

export function setPad(key: PadKey, down: boolean): void {
  if (key === "left") globalControls.left = down;
  if (key === "right") globalControls.right = down;
}
