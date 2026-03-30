let handler: (() => void) | null = null;

/** GAME OVER 表示中のみ、物理 START など UI から `restartFromGameOver` と同じ処理へ繋ぐ */
export function setGameOverRestartFromUiHandler(fn: (() => void) | null): void {
  handler = fn;
}

export function requestGameOverRestartFromUi(): void {
  handler?.();
}
