"use client";

import { requestGameOverRestartFromUi } from "@/lib/game/gameOverRestartBridge";
import { requestTitleAdvanceFromUi } from "@/lib/game/titleAdvanceBridge";
import { GameBoyOrbyDisplay } from "./GameBoyOrbyDisplay";
import { useGameBoyJump } from "./useGameBoyJump";
import {
  useJumpAButton,
  usePadAxis,
  useStartButton,
} from "./useGameBoyPressHandlers";

/** GAME OVER 復帰とタイトル開始のどちらかが有効なときだけ反応する */
function requestGameBoyStartFromUi(): void {
  requestGameOverRestartFromUi();
  requestTitleAdvanceFromUi();
}

export function GameBoy() {
  const { setJump } = useGameBoyJump();
  /** Firefox では div + preventDefault で :active が効かないことがあるためクラスで押下を表す */
  const leftPad = usePadAxis("left");
  const rightPad = usePadAxis("right");
  const aButton = useJumpAButton(setJump);
  const startButton = useStartButton(requestGameBoyStartFromUi);

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
            <GameBoyOrbyDisplay />
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
                className={`gb__dpadPart -left${leftPad.pressed ? " -pressed" : ""}`}
                role="button"
                tabIndex={0}
                aria-label="左"
                {...leftPad.props}
              />
              <div
                className={`gb__dpadPart -right${rightPad.pressed ? " -pressed" : ""}`}
                role="button"
                tabIndex={0}
                aria-label="右"
                {...rightPad.props}
              />
            </div>
            <div className="gb__dpadPart -vertical" />
          </div>
          <div className="gb__buttons">
            <div className="gb__button -b">
              <span className="gb__text">B</span>
            </div>
            <div
              className={`gb__button -a${aButton.pressed ? " -pressed" : ""}`}
              role="button"
              tabIndex={0}
              aria-label="A（ジャンプ）"
              {...aButton.props}
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
            className={`gb__extraButton -start${startButton.pressed ? " -pressed" : ""}`}
            role="button"
            tabIndex={0}
            aria-label="START"
            {...startButton.props}
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
