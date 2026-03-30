"use client";

import { useCallback, useState } from "react";
import type { JumpSource } from "./gameBoyShared";
import { setPad } from "./gameBoyShared";

function preventDefault(e: React.SyntheticEvent) {
  e.preventDefault();
}

export function usePadAxis(side: "left" | "right") {
  const [pressed, setPressed] = useState(false);
  const press = useCallback(() => {
    setPressed(true);
    setPad(side, true);
  }, [side]);
  const release = useCallback(() => {
    setPressed(false);
    setPad(side, false);
  }, [side]);

  const props = {
    onMouseDown: (e: React.MouseEvent) => {
      preventDefault(e);
      press();
    },
    onMouseUp: (e: React.MouseEvent) => {
      preventDefault(e);
      release();
    },
    onMouseLeave: (e: React.MouseEvent) => {
      preventDefault(e);
      release();
    },
    onTouchStart: (e: React.TouchEvent) => {
      preventDefault(e);
      press();
    },
    onTouchEnd: (e: React.TouchEvent) => {
      preventDefault(e);
      release();
    },
    onTouchCancel: (e: React.TouchEvent) => {
      preventDefault(e);
      release();
    },
    onBlur: release,
  };

  return { pressed, props };
}

export function useJumpAButton(
  setJump: (key: JumpSource, down: boolean) => void,
) {
  const [pressed, setPressed] = useState(false);
  const release = useCallback(() => {
    setPressed(false);
    setJump("a", false);
  }, [setJump]);

  const props = {
    onMouseDown: (e: React.MouseEvent) => {
      preventDefault(e);
      setPressed(true);
      setJump("a", true);
    },
    onMouseUp: (e: React.MouseEvent) => {
      preventDefault(e);
      release();
    },
    onMouseLeave: (e: React.MouseEvent) => {
      preventDefault(e);
      release();
    },
    onTouchStart: (e: React.TouchEvent) => {
      preventDefault(e);
      setPressed(true);
      setJump("a", true);
    },
    onTouchEnd: (e: React.TouchEvent) => {
      preventDefault(e);
      release();
    },
    onTouchCancel: (e: React.TouchEvent) => {
      preventDefault(e);
      release();
    },
    onKeyDown: (e: React.KeyboardEvent) => {
      if (e.key === " " || e.key === "Enter") {
        e.preventDefault();
        setPressed((p) => {
          if (!p) {
            setJump("a", true);
            return true;
          }
          return p;
        });
      }
    },
    onKeyUp: (e: React.KeyboardEvent) => {
      if (e.key === " " || e.key === "Enter") {
        e.preventDefault();
        setPressed(false);
        setJump("a", false);
      }
    },
    onBlur: release,
  };

  return { pressed, props };
}

export function useStartButton(onStart: () => void) {
  const [pressed, setPressed] = useState(false);
  const release = useCallback(() => {
    setPressed(false);
  }, []);

  const props = {
    onMouseDown: (e: React.MouseEvent) => {
      preventDefault(e);
      setPressed(true);
      onStart();
    },
    onMouseUp: (e: React.MouseEvent) => {
      preventDefault(e);
      release();
    },
    onMouseLeave: (e: React.MouseEvent) => {
      preventDefault(e);
      release();
    },
    onTouchStart: (e: React.TouchEvent) => {
      preventDefault(e);
      setPressed(true);
      onStart();
    },
    onTouchEnd: (e: React.TouchEvent) => {
      preventDefault(e);
      release();
    },
    onTouchCancel: (e: React.TouchEvent) => {
      preventDefault(e);
      release();
    },
    onKeyDown: (e: React.KeyboardEvent) => {
      if (e.repeat) return;
      if (e.key === " " || e.key === "Enter") {
        e.preventDefault();
        setPressed(true);
        onStart();
      }
    },
    onKeyUp: (e: React.KeyboardEvent) => {
      if (e.key === " " || e.key === "Enter") {
        e.preventDefault();
        setPressed(false);
      }
    },
    onBlur: release,
  };

  return { pressed, props };
}
