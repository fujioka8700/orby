"use client";

import { useState } from "react";
import { setPad } from "@/components/gameboy/gameBoyShared";
import { requestGameOverRestartFromUi } from "@/lib/game/gameOverRestartBridge";
import { requestTitleAdvanceFromUi } from "@/lib/game/titleAdvanceBridge";

/** GAME OVER 復帰とタイトル開始のどちらかが有効なときだけ反応する */
function requestGameBoyStartFromUi(): void {
  requestGameOverRestartFromUi();
  requestTitleAdvanceFromUi();
}
import { useGameBoyJump } from "@/components/gameboy/useGameBoyJump";
import { GameBoy2OrbySlot } from "./GameBoy2OrbySlot";

export function GameBoy2() {
  const { setJump } = useGameBoyJump();
  /** Firefox では div + preventDefault で :active が効かないことがあるためクラスで押下を表す */
  const [aPressed, setAPressed] = useState(false);
  const [leftPressed, setLeftPressed] = useState(false);
  const [rightPressed, setRightPressed] = useState(false);
  const [startPressed, setStartPressed] = useState(false);


  return (
    <>
      <div className="gb" id="gb">
        <div className="gb__switch -on" />
        <div className="gb__portText -power">OFF•ON</div>
        <div className="gb__lines -power">
          <div className="gb__line" />
          <div className="gb__line" />
          <div className="gb__line" />
        </div>
        <div className="gb__linesTop" />
        <div className="gb__screen">
          <div className="gb__screenLines" />
          <div className="gb__screenText">DOT MATRIX WITH STEREO SOUND</div>
          <div className="gb__led -on" />
          <div className="gb__displayContainer">
            <GameBoy2OrbySlot />
          </div>
        </div>
        <div className="gb__logo">
          <span className="gb__logoNintendo">Wadotendo</span>
          <span className="gb__logoGameboy">WADO BOY</span>
          <span className="gb__logoTrademark">TM</span>
        </div>
        <div className="gb__controlsRow">
          <div className="gb__dpad">
            <div className="gb__dpadHorizontal">
              <div
                className={`gb__dpadPart -left${leftPressed ? " -pressed" : ""}`}
                role="button"
                tabIndex={0}
                aria-label="左"
                onMouseDown={(e) => {
                  e.preventDefault();
                  setLeftPressed(true);
                  setPad("left", true);
                }}
                onMouseUp={(e) => {
                  e.preventDefault();
                  setLeftPressed(false);
                  setPad("left", false);
                }}
                onMouseLeave={(e) => {
                  e.preventDefault();
                  setLeftPressed(false);
                  setPad("left", false);
                }}
                onTouchStart={(e) => {
                  e.preventDefault();
                  setLeftPressed(true);
                  setPad("left", true);
                }}
                onTouchEnd={(e) => {
                  e.preventDefault();
                  setLeftPressed(false);
                  setPad("left", false);
                }}
                onTouchCancel={(e) => {
                  e.preventDefault();
                  setLeftPressed(false);
                  setPad("left", false);
                }}
                onBlur={() => {
                  setLeftPressed(false);
                  setPad("left", false);
                }}
              />
              <div
                className={`gb__dpadPart -right${rightPressed ? " -pressed" : ""}`}
                role="button"
                tabIndex={0}
                aria-label="右"
                onMouseDown={(e) => {
                  e.preventDefault();
                  setRightPressed(true);
                  setPad("right", true);
                }}
                onMouseUp={(e) => {
                  e.preventDefault();
                  setRightPressed(false);
                  setPad("right", false);
                }}
                onMouseLeave={(e) => {
                  e.preventDefault();
                  setRightPressed(false);
                  setPad("right", false);
                }}
                onTouchStart={(e) => {
                  e.preventDefault();
                  setRightPressed(true);
                  setPad("right", true);
                }}
                onTouchEnd={(e) => {
                  e.preventDefault();
                  setRightPressed(false);
                  setPad("right", false);
                }}
                onTouchCancel={(e) => {
                  e.preventDefault();
                  setRightPressed(false);
                  setPad("right", false);
                }}
                onBlur={() => {
                  setRightPressed(false);
                  setPad("right", false);
                }}
              />
            </div>
            <div className="gb__dpadPart -vertical" />
          </div>
          <div className="gb__buttons">
            <div className="gb__button -b">
              <span className="gb__text">B</span>
            </div>
            <div
              className={`gb__button -a${aPressed ? " -pressed" : ""}`}
              role="button"
              tabIndex={0}
              aria-label="A（ジャンプ）"
              onMouseDown={(e) => {
                e.preventDefault();
                setAPressed(true);
                setJump("a", true);
              }}
              onMouseUp={(e) => {
                e.preventDefault();
                setAPressed(false);
                setJump("a", false);
              }}
              onMouseLeave={(e) => {
                e.preventDefault();
                setAPressed(false);
                setJump("a", false);
              }}
              onTouchStart={(e) => {
                e.preventDefault();
                setAPressed(true);
                setJump("a", true);
              }}
              onTouchEnd={(e) => {
                e.preventDefault();
                setAPressed(false);
                setJump("a", false);
              }}
              onTouchCancel={(e) => {
                e.preventDefault();
                setAPressed(false);
                setJump("a", false);
              }}
              onKeyDown={(e) => {
                if (e.key === " " || e.key === "Enter") {
                  e.preventDefault();
                  if (!aPressed) {
                    setAPressed(true);
                    setJump("a", true);
                  }
                }
              }}
              onKeyUp={(e) => {
                if (e.key === " " || e.key === "Enter") {
                  e.preventDefault();
                  setAPressed(false);
                  setJump("a", false);
                }
              }}
              onBlur={() => {
                setAPressed(false);
                setJump("a", false);
              }}
            >
              <span className="gb__text">A</span>
            </div>
          </div>
        </div>
        <div className="gb__extraButtons">
          <div className="gb__extraButton -select">
            <span className="gb__text -extra">SELECT</span>
          </div>
          <div
            className={`gb__extraButton -start${startPressed ? " -pressed" : ""}`}
            role="button"
            tabIndex={0}
            aria-label="START"
            onMouseDown={(e) => {
              e.preventDefault();
              setStartPressed(true);
              requestGameBoyStartFromUi();
            }}
            onMouseUp={(e) => {
              e.preventDefault();
              setStartPressed(false);
            }}
            onMouseLeave={(e) => {
              e.preventDefault();
              setStartPressed(false);
            }}
            onTouchStart={(e) => {
              e.preventDefault();
              setStartPressed(true);
              requestGameBoyStartFromUi();
            }}
            onTouchEnd={(e) => {
              e.preventDefault();
              setStartPressed(false);
            }}
            onTouchCancel={(e) => {
              e.preventDefault();
              setStartPressed(false);
            }}
            onKeyDown={(e) => {
              if (e.repeat) return;
              if (e.key === " " || e.key === "Enter") {
                e.preventDefault();
                setStartPressed(true);
                requestGameBoyStartFromUi();
              }
            }}
            onKeyUp={(e) => {
              if (e.key === " " || e.key === "Enter") {
                e.preventDefault();
                setStartPressed(false);
              }
            }}
            onBlur={() => {
              setStartPressed(false);
            }}
          >
            <span className="gb__text -extra">START</span>
          </div>
        </div>
        <div className="gb__speaker">
          <div className="gb__speakerHole" />
          <div className="gb__speakerHole" />
          <div className="gb__speakerHole" />
          <div className="gb__speakerHole" />
          <div className="gb__speakerHole" />
          <div className="gb__speakerHole" />
        </div>
        <div className="gb__portText -phones">PHONES</div>
        <div className="gb__lines -phones">
          <div className="gb__line" />
          <div className="gb__line" />
          <div className="gb__line" />
        </div>
      </div>
      <div aria-hidden id="mario" />
    </>
  );
}
