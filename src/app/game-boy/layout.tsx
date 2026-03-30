import type { ReactNode } from "react";
import "./game-boy.css";

export default function GameBoyRouteLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  return children;
}
