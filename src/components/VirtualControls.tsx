"use client";

import { useState } from "react";
import { globalControls } from "@/lib/game/globalControls";

const buttonBaseClass =
  "flex h-16 w-16 select-none touch-none items-center justify-center rounded-full border-2 border-black shadow-md transition-all duration-75";
const buttonActiveClass = "scale-95 bg-gray-200 shadow-inner";
const buttonInactiveClass = "scale-100 bg-white";

export function VirtualControls() {
  const [buttonStates, setButtonStates] = useState({
    left: false,
    right: false,
    up: false,
  });

  const handleLeftDown = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    globalControls.left = true;
    setButtonStates((prev) => ({ ...prev, left: true }));
  };
  const handleLeftUp = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    globalControls.left = false;
    setButtonStates((prev) => ({ ...prev, left: false }));
  };
  const handleRightDown = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    globalControls.right = true;
    setButtonStates((prev) => ({ ...prev, right: true }));
  };
  const handleRightUp = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    globalControls.right = false;
    setButtonStates((prev) => ({ ...prev, right: false }));
  };
  const handleADown = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    globalControls.up = true;
    setButtonStates((prev) => ({ ...prev, up: true }));
  };
  const handleAUp = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    globalControls.up = false;
    setButtonStates((prev) => ({ ...prev, up: false }));
  };

  return (
    <div className="mt-4 flex items-center justify-center gap-4">
      <button
        type="button"
        onMouseDown={handleLeftDown}
        onMouseUp={handleLeftUp}
        onMouseLeave={handleLeftUp}
        onTouchStart={handleLeftDown}
        onTouchEnd={handleLeftUp}
        className={`${buttonBaseClass} ${
          buttonStates.left ? buttonActiveClass : buttonInactiveClass
        }`}
      >
        <svg
          width={32}
          height={32}
          viewBox="0 0 24 24"
          fill="black"
          aria-label="左"
        >
          <title>左</title>
          <path d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z" />
        </svg>
      </button>
      <button
        type="button"
        onMouseDown={handleRightDown}
        onMouseUp={handleRightUp}
        onMouseLeave={handleRightUp}
        onTouchStart={handleRightDown}
        onTouchEnd={handleRightUp}
        className={`${buttonBaseClass} ${
          buttonStates.right ? buttonActiveClass : buttonInactiveClass
        }`}
      >
        <svg
          width={32}
          height={32}
          viewBox="0 0 24 24"
          fill="black"
          aria-label="右"
        >
          <title>右</title>
          <path d="M10 6L8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z" />
        </svg>
      </button>
      <button
        type="button"
        onMouseDown={handleADown}
        onMouseUp={handleAUp}
        onMouseLeave={handleAUp}
        onTouchStart={handleADown}
        onTouchEnd={handleAUp}
        className={`ml-8 ${buttonBaseClass} ${
          buttonStates.up ? buttonActiveClass : buttonInactiveClass
        }`}
      >
        <span className="text-xl font-bold text-black">A</span>
      </button>
    </div>
  );
}
