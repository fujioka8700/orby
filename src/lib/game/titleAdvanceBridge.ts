let handler: (() => void) | null = null;

export function setTitleAdvanceHandler(fn: (() => void) | null): void {
  handler = fn;
}

export function requestTitleAdvanceFromUi(): void {
  handler?.();
}
