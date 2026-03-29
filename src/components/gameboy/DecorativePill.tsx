"use client";

export function DecorativePill({ label }: { label: string }) {
  return (
    <span
      className="-rotate-[20deg] inline-block rounded-full bg-[#1a1a1a] px-3 py-1.5 text-[0.55rem] font-semibold tracking-widest text-[#3a3a3a]"
      aria-hidden
    >
      {label}
    </span>
  );
}
