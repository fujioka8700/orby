"use client";

export function SpeakerGrille() {
  return (
    <div
      className="ml-auto mr-4 grid w-fit grid-cols-4 gap-x-1.5 gap-y-1.5 opacity-60"
      aria-hidden
    >
      {Array.from({ length: 12 }).map((_, i) => (
        <span
          key={i}
          className="block h-1.5 w-1.5 rounded-full bg-[#333]"
        />
      ))}
    </div>
  );
}
