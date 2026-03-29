/// <reference types="phaser" />
import {
  createFlamePodobooAnimation,
  createGameAnimations,
} from "@/lib/game/animations";
import {
  ASSET_KEYS,
  CASTLE_BG_HEIGHT,
  CASTLE_BG_TOP_BAR_COLOR,
  CASTLE_BG_TOP_OFFSET,
  BIRD_1_FRAME_SIZE,
  BIRD_1_OBJECT_NAME,
  BOUNCEPAD_ANIM_KEY,
  BOUNCEPAD_BOUNCE_VELOCITY,
  BOUNCEPAD_SUPER_BOUNCE_VELOCITY,
  BOUNCEPAD_BODY_OFFSET,
  BOUNCEPAD_BODY_SIZE,
  BOUNCEPAD_STANDING_HORIZONTAL_MARGIN,
  BOUNCEPAD_STANDING_VERTICAL_MARGIN_BOTTOM,
  BOUNCEPAD_STANDING_VERTICAL_MARGIN_TOP,
  BOUNCEPAD_SUPER_JUMP_WINDOW_MS,
  BOUNCEPAD_RED_DISPLAY_FRAME,
  BOUNCEPAD_RED_FIRST_GID,
  BOUNCEPAD_RED_OBJECT_NAME,
  BOUNCEPAD_RED_SIZE,
  COIN_OBJECT_NAME,
  COIN_SIZE,
  COINS_LAYER_NAME,
  ENEMIES_LAYER_NAME,
  ENEMY_OBJECT_NAME,
  ENEMY_OBJECT_NAMES,
  GAME_CLEAR_FADE_DURATION_MS,
  GOAL_SOUND_STOP_BEFORE_END_SEC,
  GAME_CLEAR_GOAL_TWEEN_DURATION_BOUNCE_MS,
  GAME_CLEAR_GOAL_TWEEN_DURATION_FIRST_MS,
  GAME_CLEAR_GOAL_TEXT,
  GAME_CLEAR_GOAL_TEXT_COLOR,
  GAME_CLEAR_GOAL_TEXT_FONT_SIZE,
  GAMESTART_SFX_SHORTER_BY_SEC,
  GAME_CONSTANTS,
  GOAL_FLAG_OBJECT_NAMES,
  GOAL_FLAG_SIZE,
  LIVES_INITIAL,
  MOVING_PLATFORMS_LAYER_NAME,
  OBJECT_LAYER_NAME,
  PLATFORM_FEET_CHECK_OFFSET,
  SAW_ROTATION_SPEED,
  PLAYER_GAME_COMPLETE_ASSET,
  PLAYER_MISS_ASSET,
  SCENE_BACKGROUND_COLOR,
  UI_COINS_OFFSET_Y,
  UI_FONT_FAMILY,
  UI_ICON_OFFSET_Y,
  UI_LIVES_ICON_SIZE,
  UI_LIVES_POSITION,
  UI_NUMBER_TEXT_STYLE,
  DEPTH_BOUNCEPAD,
  DEPTH_LAVA_FLOOR,
  DEPTH_MOVING_PLATFORM_STAGE3,
  DEPTH_PLAYER_AND_ENEMY,
  DEPTH_PLAYER_STAGE3,
  LAVA_FLOOR_BOTTOM_MARGIN,
  LAVA_FLOOR_COLLISION_INSET_TOP,
  LAVA_FLOOR_SCREEN_OFFSET_Y,
  LAVA_FLOOR_FRAME_COUNT,
  LAVA_FLOOR_FRAME_HEIGHT,
  LAVA_FLOOR_FRAME_RATE,
  LAVA_FLOOR_TILE_SCROLL_SPEED,
  SPRING_SFX_MARKER_NORMAL,
  SPRING_SFX_MARKER_BIG,
} from "@/lib/game/constants";
import { updateEnemies as updateEnemiesAI } from "@/lib/game/enemyAI";
import {
  getTilesetGidRange,
  isGidInTilesetRange,
} from "@/lib/game/tiledTilesetGid";
import {
  createMovingPlatforms,
  isMovingPlatformOneWayCollision,
  resetMovingPlatforms as resetMovingPlatformsModule,
  updateMovingPlatforms as updateMovingPlatformsModule,
} from "@/lib/game/movingPlatforms";
import {
  createSawFollowers,
  placeRailsFromLayer,
  resetSawFollowersToStart,
} from "@/lib/game/sawTraps";
import { createGameClearScreen } from "@/lib/game/gameClearUI";
import { getGameContainer, removeResumeListeners } from "@/lib/game/domUtils";
import { createGameOverUI } from "@/lib/game/gameOverUI";
import { globalControls, resetGlobalControls } from "@/lib/game/globalControls";
import {
  ensureLavaFloorTrimmedTextures,
  lavaFloorTrimmedTextureKey,
} from "@/lib/game/lavaFloorTextures";
import {
  createPodobooFlames,
  resetPodoboosToIdle,
  updatePodobooFlames,
} from "@/lib/game/podobooFlames";
import { createSpikeTraps } from "@/lib/game/spikeTraps";
import { loadGameAssets } from "@/lib/game/loadGameAssets";
import {
  applyRestartPreloadBlackHoldIfNeeded,
  restoreCanvasStyleAfterBlackHold,
  snapMainCameraFadeToCompletedBlackout,
} from "@/lib/game/phaserBlackHold";
import {
  getRuntimeStageNumber,
  getSceneTransitionData,
  shouldSnapBlackOverlayAfterSceneReset,
} from "@/lib/game/stageRuntime";
import { createTitleScreen } from "@/lib/game/titleScreenUI";
import {
  ARCADE_DEBUG,
  BGM_OFF,
  CREATE_A_SINGLE_IMAGE,
  DEBUG,
  PLAYER_INITIAL_COINS,
  PLAYER_START_POSITION,
  SKIP_TITLE_SCREEN,
  USE_IMAGE_BACKGROUND,
} from "@/lib/game/phaserConfig";
import type { EnemySprite } from "@/lib/game/types";
import type { GameClearScreen } from "@/lib/game/gameClearUI";
import type { TitleScreenUI } from "@/lib/game/titleScreenUI";

/** Phaser を動的 import した後に渡し、メインシーンクラスを取得する */
export function createMainScene(PhaserLib: typeof Phaser) {
  class GameScene extends PhaserLib.Scene {
    private player!: Phaser.Physics.Arcade.Sprite;
    private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
    private map!: Phaser.Tilemaps.Tilemap;
    private platformLayer!: Phaser.Tilemaps.TilemapLayer;
    private enemies: EnemySprite[] = [];
    /** 敵の初期位置・向き（restart 用） */
    private enemyStartPositions: {
      x: number;
      y: number;
      moveDirection: number;
    }[] = [];
    private wasJumpPressed = false;
    private livesCount = LIVES_INITIAL;
    private livesIcon: Phaser.GameObjects.Image | null = null;
    private livesText: Phaser.GameObjects.Text | null = null;
    private coinCount = PLAYER_INITIAL_COINS;
    private coinsIcon: Phaser.GameObjects.Image | null = null;
    private coinsText: Phaser.GameObjects.Text | null = null;
    private playerStartX: number = GAME_CONSTANTS.PLAYER.DEFAULT_START_X;
    private playerStartY: number = GAME_CONSTANTS.PLAYER.DEFAULT_START_Y;
    private invincibleUntil = 0;
    private deathY = 0;
    private isGameOver = false;
    private isPlayingMissSequence = false;
    private missSequenceOnComplete: (() => void) | null = null;
    private isInFallDeathTransition = false;
    /** 落下死でぴょん→落下中。画面外に出たらフェード開始する */
    private isWaitingForFallDeathOffScreen = false;
    /** このミス開始時に残機0だった（フェード後にGAME OVERにする） */
    private wasMissWithZeroLives = false;
    private gameOverOverlay: Phaser.GameObjects.Rectangle | null = null;
    private gameOverText: Phaser.GameObjects.Text | null = null;
    private gameOverContinueText: Phaser.GameObjects.Text | null = null;
    /** GAMEOVER 再開を二重に呼ばないためのフラグ */
    private gameOverRestartFired = false;
    /** コンテナに登録した再開用リスナー除去用（iOS Safari でキャンバス外タッチを受け取る） */
    private gameOverContainer: HTMLElement | null = null;
    private gameOverContainerHandler: (() => void) | null = null;
    /** ゲームクリア→タイトル遷移を二重に呼ばない・DOM リスナー除去用 */
    private gameClearToTitleFired = false;
    private gameClearContainer: HTMLElement | null = null;
    private gameClearContainerHandler: (() => void) | null = null;
    private goalFlagSprite: Phaser.GameObjects.Sprite | null = null;
    /** 2nd のみセット。3rd 等では null（前ステージの破棄済み Group を参照しない） */
    private bouncepads: Phaser.GameObjects.Group | null = null;
    /** トランポリン：着地ごとに1回だけ跳ねるため、現在乗っている pad を保持 */
    private playerOnBouncepad: Phaser.GameObjects.Sprite | null = null;
    /** 現在の上昇がトランポリン由来なら true（ジャンプキャンセルを適用しない） */
    private jumpedFromTrampoline = false;
    /** 大ジャンプ中なら true（ジャンプキャンセルを適用しない） */
    private jumpedFromTrampolineSuper = false;
    /** 空中でジャンプを押した時刻（着地寸前判定用）。0 は未押下 */
    private lastJumpPressedWhileInAir = 0;
    /** 2nd ステージ: 動く床（Physics Group、方法A: 16pxタイルを3枚ずつ同期制御） */
    private movingPlatforms: Phaser.Physics.Arcade.Group | null = null;
    /** 現在乗っている動く床（位置同期用。離れたら null） */
    private playerOnMovingPlatform: Phaser.Physics.Arcade.Sprite | null = null;
    /** 前フレームの動く床の X（deltaX 計算用） */
    private lastMovingPlatformX = 0;
    private goalReached = false;
    private goalText: Phaser.GameObjects.Text | null = null;
    private isGameClear = false;
    /** 本番・CREATE_A_SINGLE_IMAGE 共通のゲームクリア画面（update/destroy 用） */
    private gameClearScreenRef: GameClearScreen | null = null;
    private background: Phaser.GameObjects.TileSprite | Phaser.GameObjects.Image | null =
      null;
    private coins!: Phaser.GameObjects.Group;
    /** 3rd ステージのみ：レール上を動くノコギリトラップ（PathFollower のグループ） */
    private circularSaws: Phaser.GameObjects.Group | undefined = undefined;
    private lavaFloorTile: Phaser.GameObjects.TileSprite | undefined =
      undefined;
    private lavaFloorAnimAccumMs = 0;
    private lavaFloorAnimFrameIndex = 0;
    /** 3rd：溶岩から飛び出す Flame（Podoboo） */
    private podobooFlames: Phaser.Physics.Arcade.Group | null = null;
    /** 3rd：`traps` レイヤーのトゲ（StaticGroup。レイヤー未作成時は空） */
    private spikeTraps: Phaser.Physics.Arcade.StaticGroup | undefined =
      undefined;
    private readonly maxSpeed = GAME_CONSTANTS.MOVEMENT.MAX_SPEED;
    private readonly acceleration = GAME_CONSTANTS.MOVEMENT.ACCELERATION;
    private readonly deceleration = GAME_CONSTANTS.MOVEMENT.DECELERATION;
    private readonly airControl = GAME_CONSTANTS.MOVEMENT.AIR_CONTROL;
    /** タイトル画面をタッチしてゲーム開始したか */
    private gameStarted = false;
    private titleScreenRef: TitleScreenUI | null = null;
    /** アクションゲーム用BGM（ループ再生・一時停止／停止用） */
    private bgmSound: Phaser.Sound.WebAudioSound | null = null;
    /** ゲームクリア画面用BGM（遷移時に停止するため参照を保持） */
    private gameClearBGM: Phaser.Sound.WebAudioSound | null = null;
    /** `preload` 中にキャンバス背景を黒にしたとき、フェードイン完了で戻す */
    private preloadCanvasBlackHold = false;

    constructor() {
      super({ key: "GameScene" });
    }

    preload() {
      if (CREATE_A_SINGLE_IMAGE && DEBUG) {
        this.load.image(
          ASSET_KEYS.PLAYER_GAME_COMPLETE,
          PLAYER_GAME_COMPLETE_ASSET,
        );
        return;
      }
      if (applyRestartPreloadBlackHoldIfNeeded(this)) {
        this.preloadCanvasBlackHold = true;
      }
      loadGameAssets(this);
    }

    create() {
      if (CREATE_A_SINGLE_IMAGE && DEBUG) {
        this.createSingleImageMode();
        return;
      }
      const transitionData = getSceneTransitionData(this);
      const resumeCampaign =
        transitionData.resumeGameWithoutTitle === true;
      const returnFromGameOver =
        transitionData.returnToTitleFromGameOver === true;
      this.resetSceneStateForRestart();
      if (transitionData.livesCount !== undefined) {
        this.livesCount = transitionData.livesCount;
        this.coinCount = transitionData.coinCount ?? PLAYER_INITIAL_COINS;
      }
      if (
        shouldSnapBlackOverlayAfterSceneReset(
          transitionData,
          this.getEffectiveStageNumber(),
        )
      ) {
        snapMainCameraFadeToCompletedBlackout(this);
      }
      const drawDebug = DEBUG && ARCADE_DEBUG;
      (this.physics.world as Phaser.Physics.Arcade.World).drawDebug = drawDebug;
      this.cameras.main.setBackgroundColor(SCENE_BACKGROUND_COLOR);
      this.setupTilemap();
      const effectiveStageNumber = this.getEffectiveStageNumber();
      if (this.shouldUseImageBackground()) {
        this.setupBackground();
      } else if (effectiveStageNumber === 2) {
        this.setupBackground2nd();
      } else if (effectiveStageNumber === 3) {
        this.setupBackground3rd();
        this.setupLavaFloor3rd();
      }
      this.setupPlayer();
      this.setupCamera();
      this.setupPlayerCollision();
      createGameAnimations(this);
      createFlamePodobooAnimation(this);
      this.setupGoalFlag();
      if (effectiveStageNumber === 2 || effectiveStageNumber === 3) {
        this.createBouncepadAnimation();
        this.setupBouncepads();
      }
      this.setupCoins();
      this.setupPlayerCoinOverlap();
      this.setupPlayerGoalOverlap();
      this.setupEnemies();
      this.setupPlayerEnemyOverlap();
      if (effectiveStageNumber === 3) {
        this.setupSawTraps();
        this.setupPlayerSawOverlap();
        this.podobooFlames = createPodobooFlames(this, this.map, (obj, name) =>
          this.getTiledPropertyNumber(obj, name),
        );
        this.setupPlayerPodobooOverlap();
        this.spikeTraps = createSpikeTraps(this, this.map);
        this.setupPlayerSpikeOverlap();
      }
      this.setupInput();
      this.setupLivesUI();
      /** GAME OVER から戻るときはデバッグのタイトルスキップを無視して必ずタイトルを出す */
      const skipTitle =
        !returnFromGameOver &&
        ((DEBUG && SKIP_TITLE_SCREEN) || resumeCampaign);
      if (!skipTitle) {
        this.setupTitleScreen();
        if (returnFromGameOver) {
          this.fadeInTitleScreenFromBlack(
            GAME_CONSTANTS.CAMERA.FADE_DURATION_MS,
          );
        }
        /** タイトル表示中は Arcade 物理が進むと敵・動く床などがずれるため停止する（ノコギリは Tween なので別途リセット）。 */
        this.physics.pause();
      } else if (
        this.getEffectiveStageNumber() === 2 ||
        this.getEffectiveStageNumber() === 3
      ) {
        /** タイトル→1面・2・3 とも `FADE_DURATION_MS` に統一 */
        this.fadeInThenEnableGameplay(GAME_CONSTANTS.CAMERA.FADE_DURATION_MS);
      } else {
        this.enterPlayableState(false);
      }
    }

    /** CREATE_A_SINGLE_IMAGE 時の単一画像・クリア画面表示 */
    private createSingleImageMode() {
      this.gameClearScreenRef = createGameClearScreen(this);
    }

    /** ゲームクリア画面の update だけ行うべき状態か（単一画像モード or 本番クリア表示中） */
    private shouldUpdateGameClearScreen(): boolean {
      return (CREATE_A_SINGLE_IMAGE && DEBUG) || this.isGameClear;
    }

    /** アクションゲームBGMを再生しない設定か（DEBUG かつ BGM_OFF のとき true） */
    private isActionBGMDisabled(): boolean {
      return DEBUG && BGM_OFF;
    }

    /** アクションゲーム用BGMをループ再生する（音量はこのBGMのみ70%） */
    private startGameBGM() {
      if (this.isActionBGMDisabled()) return;
      if (!this.bgmSound) {
        this.bgmSound = this.sound.add(
          ASSET_KEYS.BGM_STAGE1,
        ) as Phaser.Sound.WebAudioSound;
        this.bgmSound.setVolume(0.7);
      }
      this.bgmSound.seek = 0;
      this.bgmSound.play({ loop: true });
    }

    /** ミス再開時：一時停止した位置からBGMを再開し、音量をフェードインする */
    private resumeGameBGMWithFadeIn() {
      if (this.isActionBGMDisabled() || !this.bgmSound) return;
      this.bgmSound.setVolume(0);
      this.bgmSound.resume();
      const fadeDuration = GAME_CONSTANTS.CAMERA.FADE_DURATION_MS;
      const state = { volume: 0 };
      this.tweens.add({
        targets: state,
        volume: 0.7,
        duration: fadeDuration,
        ease: "Linear",
        onUpdate: () => this.bgmSound?.setVolume(state.volume),
      });
    }

    /** ミス時：BGMを一時停止する（再生位置は保持される） */
    private pauseGameBGM() {
      this.bgmSound?.pause();
    }

    /** アクションゲーム用BGMを停止する（ゲームオーバー・クリア画面遷移時） */
    private stopGameBGM() {
      this.bgmSound?.stop();
    }

    /**
     * シーンの `create()` 冒頭で呼ぶ。タイトル復帰・ステージ間 restart・GAME OVER からの再開など共通。
     * 前フレームの参照・フラグを消し、shutdown 後に残りがちな DOM リスナーも外す。
     */
    private resetSceneStateForRestart() {
      resetGlobalControls();
      this.wasJumpPressed = false;
      this.invincibleUntil = 0;

      this.isGameOver = false;
      this.gameOverRestartFired = false;
      removeResumeListeners(this.gameOverContainer, this.gameOverContainerHandler);
      this.gameOverContainer = null;
      this.gameOverContainerHandler = null;
      this.gameOverOverlay = null;
      this.gameOverText = null;
      this.gameOverContinueText = null;

      this.isPlayingMissSequence = false;
      this.missSequenceOnComplete = null;
      this.isInFallDeathTransition = false;
      this.isWaitingForFallDeathOffScreen = false;
      this.wasMissWithZeroLives = false;

      this.goalReached = false;
      this.goalText = null;
      this.isGameClear = false;
      this.gameClearScreenRef = null;
      this.gameClearBGM = null;
      this.gameStarted = false;

      removeResumeListeners(this.gameClearContainer, this.gameClearContainerHandler);
      this.gameClearContainer = null;
      this.gameClearContainerHandler = null;
      this.gameClearToTitleFired = false;

      /** 前ステージの Group は shutdown で破棄されるが参照だけ残ると update で落ちる（例: 2→3） */
      this.movingPlatforms = null;
      this.playerOnMovingPlatform = null;
      this.lastMovingPlatformX = 0;
      this.playerOnBouncepad = null;
      this.bouncepads = null;
      this.jumpedFromTrampoline = false;
      this.jumpedFromTrampolineSuper = false;
      this.lastJumpPressedWhileInAir = 0;

      this.circularSaws = undefined;
      this.podobooFlames = null;
      this.spikeTraps = undefined;
      this.lavaFloorTile = undefined;
      this.lavaFloorAnimAccumMs = 0;
      this.lavaFloorAnimFrameIndex = 0;
      this.background = null;

      this.titleScreenRef = null;
      this.stopGameBGM();
      this.bgmSound = null;

      this.enemies = [];
      this.enemyStartPositions = [];

      this.physics.resume();
      this.livesCount = LIVES_INITIAL;
      this.coinCount = PLAYER_INITIAL_COINS;

      const cam = this.cameras?.main;
      if (cam) {
        cam.resetFX();
        cam.stopFollow();
      }
    }

    /** タイトル画面を表示し、タッチで startTitleFadeOut を呼ぶ */
    private setupTitleScreen() {
      this.titleScreenRef = createTitleScreen(this);
      this.input.once("pointerdown", this.startTitleFadeOut, this);
    }

    /** タイトルでタッチ時: ゲームスタート効果音を1回再生＋フェードアウト → 効果音終了後にタイトル削除・フェードイン → ゲーム開始 */
    private startTitleFadeOut() {
      const duration = GAME_CONSTANTS.CAMERA.FADE_DURATION_MS;
      const gameStartSfx = this.sound.add(ASSET_KEYS.SFX_GAMESTART);
      gameStartSfx.play({ loop: false });

      let fadeOutDone = false;
      let sfxDone = false;
      const tryStartFadeInAndGame = () => {
        if (!fadeOutDone || !sfxDone) return;
        gameStartSfx.stop();
        this.destroyTitleAndFadeInToGame(duration);
      };

      this.cameras.main.fadeOut(duration, 0, 0, 0);
      this.cameras.main.once(
        Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE,
        () => {
          fadeOutDone = true;
          tryStartFadeInAndGame();
        },
      );
      this.scheduleGameStartSfxEnd(gameStartSfx, () => {
        sfxDone = true;
        tryStartFadeInAndGame();
      });
    }

    /** ゲームスタート効果音を指定秒だけ短く再生し、終了時に onEnd を呼ぶ */
    private scheduleGameStartSfxEnd(
      sound: Phaser.Sound.BaseSound,
      onEnd: () => void,
    ) {
      const durationSec =
        "duration" in sound && typeof sound.duration === "number"
          ? sound.duration
          : 0;
      const stopInSec = Math.max(
        0,
        durationSec - GAMESTART_SFX_SHORTER_BY_SEC,
      );
      if (stopInSec > 0) {
        this.time.delayedCall(stopInSec * 1000, () => {
          sound.stop();
          onEnd();
        });
      } else {
        sound.once("complete", onEnd);
      }
    }

    /** タイトルを破棄し、フェードイン後にゲーム開始・BGM開始する */
    private destroyTitleAndFadeInToGame(fadeDurationMs: number) {
      this.titleScreenRef?.destroy();
      this.titleScreenRef = null;
      this.fadeInThenEnableGameplay(fadeDurationMs);
    }

    /**
     * タイトル→1面・1→2→3 面のいずれも同じ手順: カメラを `fadeIn` し、完了後にプレイ可能状態へ。
     * （Phaser の `resetFX` は呼ばない。タイトル遷移と同一）
     */
    private fadeInThenEnableGameplay(fadeDurationMs: number) {
      const cam = this.cameras.main;
      cam.fadeIn(fadeDurationMs, 0, 0, 0);
      cam.once(Phaser.Cameras.Scene2D.Events.FADE_IN_COMPLETE, () => {
        this.releasePreloadCanvasBlackHoldStyle();
        this.enterPlayableState(true);
      });
    }

    /**
     * 操作可能にする共通処理。`afterTitlePhysicsPause` が true のときはタイトル中に止めた物理を再開し、
     * pause 中は動かなかった collider 分のプレイヤー接地を `resolveSpawnOverlapWithPlatforms` で揃える。
     */
    private enterPlayableState(afterTitlePhysicsPause: boolean) {
      if (afterTitlePhysicsPause) {
        this.physics.resume();
      }
      this.resetDynamicEntitiesForGameStart();
      if (afterTitlePhysicsPause) {
        this.resolveSpawnOverlapWithPlatforms();
      }
      this.gameStarted = true;
      this.startGameBGM();
    }

    /** タイトル経過やフェード待ちでずれた敵・トラップを初期状態へ（ゲーム開始直前に呼ぶ）。 */
    private resetDynamicEntitiesForGameStart() {
      this.resetEnemiesToStartPositions();
      this.resetMovingPlatforms();
      resetSawFollowersToStart(this.circularSaws);
    }

    /** GAME OVER から戻った直後: タイトルを黒から `FADE_DURATION_MS` でフェードイン（ゲーム開始はタッチ後） */
    private fadeInTitleScreenFromBlack(fadeDurationMs: number) {
      snapMainCameraFadeToCompletedBlackout(this);
      const cam = this.cameras.main;
      cam.fadeIn(fadeDurationMs, 0, 0, 0);
      cam.once(Phaser.Cameras.Scene2D.Events.FADE_IN_COMPLETE, () => {
        this.releasePreloadCanvasBlackHoldStyle();
      });
    }

    private releasePreloadCanvasBlackHoldStyle(): void {
      if (!this.preloadCanvasBlackHold) return;
      restoreCanvasStyleAfterBlackHold(this);
      this.preloadCanvasBlackHold = false;
    }

    /** 実際に読み込んだステージ（restart の runtimeStageNumber または phaserConfig） */
    private getEffectiveStageNumber(): 1 | 2 | 3 {
      return getRuntimeStageNumber(this);
    }

    /** 背景を画像（Forest_Background_0.png）で表示するか。1st のみ画像、2nd/3rd は Sky 背景。 */
    private shouldUseImageBackground(): boolean {
      if (this.getEffectiveStageNumber() === 2 || this.getEffectiveStageNumber() === 3)
        return false;
      return !DEBUG || USE_IMAGE_BACKGROUND;
    }

    private setupTilemap() {
      this.map = this.make.tilemap({ key: ASSET_KEYS.TILEMAP });
      const tilesets = this.collectTilesets();
      if (tilesets.length === 0) {
        console.error("Failed to load tilesets");
        return;
      }

      const platformLayer = this.map.createLayer("platform", tilesets, 0, 0);
      if (!platformLayer) {
        console.error("Failed to create platform layer");
        return;
      }
      this.platformLayer = platformLayer;
      this.platformLayer.setDepth(0);
      this.platformLayer.setVisible(true);

      this.platformLayer.setCollisionByProperty({ collides: true });
      this.platformLayer.forEachTile((tile) => {
        if (tile.properties?.oneWay) {
          tile.setCollision(false, false, true, false);
          tile.collideDown = false;
          tile.collideLeft = false;
          tile.collideRight = false;
        }
      });

      const stageForMovingPlatforms = this.getEffectiveStageNumber();
      if (stageForMovingPlatforms === 2 || stageForMovingPlatforms === 3) {
        this.setupMovingPlatforms();
      }
    }

    /** 2nd/3rd ステージ: MovingPlatforms レイヤーから動く床を生成する（方法A）。 */
    private setupMovingPlatforms() {
      const stage = this.getEffectiveStageNumber();
      const movingPlatformDepth =
        stage === 3 ? DEPTH_MOVING_PLATFORM_STAGE3 : 0;
      this.movingPlatforms = createMovingPlatforms(
        this,
        this.map,
        MOVING_PLATFORMS_LAYER_NAME,
        this.getTiledPropertyNumber.bind(this),
        movingPlatformDepth,
      );
    }

    /** 動く床を初期位置・初速に戻す（ミス復帰・restart 用） */
    private resetMovingPlatforms() {
      resetMovingPlatformsModule(this.movingPlatforms);
    }

    /** 動く床に乗っている間、床の移動量をプレイヤーに加算して位置を同期する（置いていかれ防止）。 */
    private syncPlayerToMovingPlatform() {
      if (!this.playerOnMovingPlatform) return;
      const playerBody = this.player.body as Phaser.Physics.Arcade.Body;
      const platformBody = this.playerOnMovingPlatform.body as Phaser.Physics.Arcade.Body;
      if (!playerBody.touching.down || !platformBody.touching.up) {
        this.playerOnMovingPlatform = null;
        return;
      }
      const platformX = this.playerOnMovingPlatform.x;
      this.player.x += platformX - this.lastMovingPlatformX;
      this.lastMovingPlatformX = platformX;
    }

    /** 動く床の往復: マスターが距離に達したら同じ platformID の速度を反転する */
    private updateMovingPlatforms() {
      updateMovingPlatformsModule(this.movingPlatforms);
    }

    private setupBackground() {
      const mapWidth = this.map.widthInPixels;
      const mapHeight = this.map.heightInPixels;
      this.background = this.add.tileSprite(
        mapWidth / 2,
        mapHeight / 2,
        mapWidth,
        mapHeight,
        ASSET_KEYS.BACKGROUND,
      );
      this.background.setDepth(-1);
    }

    /** 3rd ステージ用：上端を CASTLE_BG_TOP_BAR_COLOR で塗りつぶし、その下に Castle_Background_1 を横連続タイル・プレイヤー同速でスクロール。 */
    private setupBackground3rd() {
      const cam = this.cameras.main;
      const cw = cam.width;
      this.createStage3TopBar(cw);
      this.background = this.add.tileSprite(
        cw / 2,
        CASTLE_BG_TOP_OFFSET,
        cw,
        CASTLE_BG_HEIGHT,
        ASSET_KEYS.BACKGROUND_CASTLE_1,
      );
      this.background.setOrigin(0.5, 0);
      this.background.setScrollFactor(0);
      this.syncStage3BackgroundPosition();
      this.background.setDepth(-1);
    }

    /** 3rd ステージ：上端バー（城背景より上の色帯）を追加する。 */
    private createStage3TopBar(cw: number) {
      const topBar = this.add.rectangle(
        cw / 2,
        CASTLE_BG_TOP_OFFSET / 2,
        cw,
        CASTLE_BG_TOP_OFFSET,
        CASTLE_BG_TOP_BAR_COLOR,
      );
      topBar.setScrollFactor(0);
      topBar.setDepth(-2);
    }

    /** 3rd ステージの背景のタイル位置をカメラ（プレイヤー）と同速で更新する。 */
    private syncStage3BackgroundPosition() {
      if (this.getEffectiveStageNumber() !== 3 || !this.background) return;
      const cam = this.cameras.main;
      const scrollX = cam.scrollX;
      if (this.background instanceof Phaser.GameObjects.TileSprite) {
        this.background.setTilePosition(scrollX, 0);
      }
    }

    /** 3rd ステージ：画面最下部に Lava.png の波打ち TileSprite を固定表示する。 */
    private setupLavaFloor3rd() {
      if (this.getEffectiveStageNumber() !== 3) return;
      ensureLavaFloorTrimmedTextures(this);
      const cam = this.cameras.main;
      const cw = cam.width;
      const ch = cam.height;
      const trimmedKey = lavaFloorTrimmedTextureKey(0);
      if (!this.textures.exists(trimmedKey)) return;
      // トリミング後 16px 幅の単体テクスチャを横に繰り返し（setCrop では TileSprite が正しくタイルしない）
      this.lavaFloorTile = this.add.tileSprite(
        cw / 2,
        ch - LAVA_FLOOR_BOTTOM_MARGIN + LAVA_FLOOR_SCREEN_OFFSET_Y,
        cw,
        LAVA_FLOOR_FRAME_HEIGHT,
        trimmedKey,
      );
      this.lavaFloorTile.setOrigin(0.5, 1);
      this.lavaFloorTile.setScrollFactor(0);
      this.lavaFloorTile.setDepth(DEPTH_LAVA_FLOOR);
      this.lavaFloorAnimAccumMs = 0;
      this.lavaFloorAnimFrameIndex = 0;
    }

    /**
     * 3rd ステージ：溶岩のコマ送り（トリミング済みテクスチャを setTexture で切替）と横タイルスクロール。
     */
    private updateLavaFloorScroll() {
      if (this.getEffectiveStageNumber() !== 3 || !this.lavaFloorTile) return;
      const msPerFrame = 1000 / LAVA_FLOOR_FRAME_RATE;
      this.lavaFloorAnimAccumMs += this.game.loop.delta;
      while (this.lavaFloorAnimAccumMs >= msPerFrame) {
        this.lavaFloorAnimAccumMs -= msPerFrame;
        this.lavaFloorAnimFrameIndex =
          (this.lavaFloorAnimFrameIndex + 1) % LAVA_FLOOR_FRAME_COUNT;
        this.lavaFloorTile.setTexture(
          lavaFloorTrimmedTextureKey(this.lavaFloorAnimFrameIndex),
        );
      }
      this.lavaFloorTile.tilePositionX += LAVA_FLOOR_TILE_SCROLL_SPEED;
    }

    /**
     * 3rd ステージ：カメラ下端付近の溶岩帯にプレイヤー足元が入ったらミス。
     * （scrollFactor 0 の表示に合わせ、ビューポート座標からワールド Y を求める）
     */
    private checkStage3LavaOverlap() {
      if (this.getEffectiveStageNumber() !== 3 || !this.lavaFloorTile) return;
      if (!this.player?.body) return;
      if (this.isPlayingMissSequence || this.isInFallDeathTransition) return;
      if (this.time.now < this.invincibleUntil) return;
      const cam = this.cameras.main;
      const ch = cam.height;
      const cw = cam.width;
      const lavaTopScreenY =
        ch -
        LAVA_FLOOR_BOTTOM_MARGIN -
        LAVA_FLOOR_FRAME_HEIGHT +
        LAVA_FLOOR_SCREEN_OFFSET_Y +
        LAVA_FLOOR_COLLISION_INSET_TOP;
      const worldTop = cam.getWorldPoint(cw / 2, lavaTopScreenY);
      const lavaTopWorldY = worldTop.y;
      const playerBody = this.player.body as Phaser.Physics.Arcade.Body;
      if (playerBody.bottom >= lavaTopWorldY) {
        this.isPlayingMissSequence = true;
        this.triggerMiss();
      }
    }

    /** 3rd ステージ：sawPath レイヤーからレールを配置し、Polyline からノコギリを生成する。 */
    private setupSawTraps() {
      placeRailsFromLayer(this, this.map);
      this.circularSaws = createSawFollowers(this, this.map);
    }

    /** 3rd ステージ：プレイヤーとノコギリの接触でミスとする。 */
    private setupPlayerSawOverlap() {
      if (!this.circularSaws) return;
      this.physics.add.overlap(this.player, this.circularSaws, () => {
        if (this.isPlayingMissSequence) return;
        if (this.isInFallDeathTransition) return;
        if (this.time.now < this.invincibleUntil) return;
        this.isPlayingMissSequence = true;
        this.triggerMiss();
      });
    }

    /** 3rd ステージ：トゲ（StaticGroup）との接触でミスとする。 */
    private setupPlayerSpikeOverlap() {
      if (!this.spikeTraps) return;
      this.physics.add.overlap(this.player, this.spikeTraps, () => {
        if (this.isPlayingMissSequence) return;
        if (this.isInFallDeathTransition) return;
        if (this.time.now < this.invincibleUntil) return;
        this.isPlayingMissSequence = true;
        this.triggerMiss();
      });
    }

    /** 2nd ステージ用：Sky_0 を固定、Sky_1/2 をパララックス。いずれもアスペクト比維持で縦幅を画面に合わせる。 */
    private setupBackground2nd() {
      const mapWidth = this.map.widthInPixels;
      const mapHeight = this.map.heightInPixels;
      const cam = this.cameras.main;
      const cw = cam.width;
      const ch = cam.height;

      const fixed = this.add.image(cw / 2, ch / 2, ASSET_KEYS.BACKGROUND_SKY_0);
      fixed.setScrollFactor(0);
      fixed.setOrigin(0.5, 0.5);
      const fixedScale = ch / fixed.height;
      fixed.setScale(fixedScale);
      fixed.setDepth(-3);

      const parallax1 = this.add.tileSprite(
        mapWidth / 2,
        mapHeight,
        mapWidth,
        mapHeight,
        ASSET_KEYS.BACKGROUND_SKY_1,
      );
      parallax1.setOrigin(0.5, 1);
      const parallaxScale = ch / mapHeight;
      parallax1.setScale(parallaxScale);
      parallax1.setScrollFactor(0.3);
      parallax1.setDepth(-2);

      const parallax2 = this.add.tileSprite(
        mapWidth / 2,
        mapHeight,
        mapWidth,
        mapHeight,
        ASSET_KEYS.BACKGROUND_SKY_2,
      );
      parallax2.setOrigin(0.5, 1);
      parallax2.setScale(parallaxScale);
      parallax2.setScrollFactor(0.6);
      parallax2.setDepth(-1);

      const bottomBarHeight = 60;
      const bottomBar = this.add.rectangle(
        cw / 2,
        ch - bottomBarHeight / 2,
        cw,
        bottomBarHeight,
        0x00cdf9,
      );
      bottomBar.setScrollFactor(0);
      bottomBar.setDepth(-0.5);
    }

    /** タイルマップ内のタイルセット名 → プリロード済みアセットキー（1st/2nd 両対応） */
    private static readonly TILESET_NAME_TO_ASSET_KEY: Record<
      string,
      string
    > = {
      Grass_Tileset: ASSET_KEYS.TILESET_GRASS,
      Platform: ASSET_KEYS.TILESET_PLATFORM,
      Grass_Oneway: ASSET_KEYS.TILESET_GRASS_ONEWAY,
      Leaf_Tileset: ASSET_KEYS.TILESET_LEAF,
      Grass_Rock_Tileset: ASSET_KEYS.TILESET_GRASS_ROCK,
      Cloud_Tileset: ASSET_KEYS.TILESET_CLOUD,
      Brick_Tileset: ASSET_KEYS.TILESET_BRICK,
      Lava: ASSET_KEYS.TILESET_LAVA,
      Stone_Tileset: ASSET_KEYS.TILESET_STONE,
      Coin: ASSET_KEYS.COIN,
      Bird_1: ASSET_KEYS.BIRD_1,
      Spider_1: ASSET_KEYS.SPIDER,
      /** 3rd：ゴール旗タイルオブジェクト用（1st も同名） */
      Flag_animation: ASSET_KEYS.GOAL_FLAG,
      Spike: ASSET_KEYS.SPIKE_BLOCK,
      Flame_1: ASSET_KEYS.FLAME_1,
      Rails: ASSET_KEYS.RAILS,
    };

    private collectTilesets(): Phaser.Tilemaps.Tileset[] {
      const tilesets: Phaser.Tilemaps.Tileset[] = [];
      for (const mapTileset of this.map.tilesets) {
        const assetKey =
          GameScene.TILESET_NAME_TO_ASSET_KEY[mapTileset.name];
        if (assetKey) {
          const added = this.map.addTilesetImage(mapTileset.name, assetKey);
          if (added) tilesets.push(added);
        }
      }
      return tilesets;
    }

    /** グループが再利用可能か（scene 再開時などで clear して詰め替え可能） */
    private canReuseGroup(
      group: Phaser.GameObjects.Group | null | undefined,
    ): boolean {
      try {
        return (
          !!group &&
          group.scene === this &&
          typeof group.getChildren === "function" &&
          Array.isArray(group.getChildren())
        );
      } catch {
        return false;
      }
    }

    /** shutdown 後に参照だけ残ると getChildren が落ちるため、反復前に必ず確認する */
    private isGameObjectGroupUsable(
      group: Phaser.GameObjects.Group | null | undefined,
    ): group is Phaser.GameObjects.Group {
      if (!group || !group.active) return false;
      if (!group.scene?.sys) return false;
      const internals = group as unknown as { children?: unknown };
      return internals.children != null;
    }

    /** オブジェクトレイヤーから名前が一致する最初のオブジェクトを返す */
    private findMapObject(
      ...names: string[]
    ): Phaser.Types.Tilemaps.TiledObject | undefined {
      const layer = this.map.getObjectLayer(OBJECT_LAYER_NAME);
      if (!layer) return undefined;
      return layer.objects.find((obj) => names.includes(obj.name ?? ""));
    }

    /**
     * objectsLayer からゴール旗オブジェクトを取得する。
     * 名前（Goal_flag 等）または Flag_animation タイルセットのタイルオブジェクト（gid）で判定（ステージごとの firstgid 差を吸収）。
     */
    private findGoalFlagMapObject():
      | Phaser.Types.Tilemaps.TiledObject
      | undefined {
      const layer = this.map.getObjectLayer(OBJECT_LAYER_NAME);
      if (!layer) return undefined;
      const flagTileset = this.map.tilesets.find((t) => t.name === "Flag_animation");
      const firstGid = flagTileset?.firstgid;
      const tileCount = flagTileset?.total ?? 0;
      const nameList = GOAL_FLAG_OBJECT_NAMES as readonly string[];
      for (const obj of layer.objects) {
        const n = obj.name;
        if (n != null && nameList.includes(n)) {
          return obj;
        }
        const gid = (obj as { gid?: number }).gid;
        if (
          firstGid != null &&
          tileCount > 0 &&
          gid != null &&
          gid >= firstGid &&
          gid < firstGid + tileCount
        ) {
          return obj;
        }
      }
      return undefined;
    }

    /** Tiled オブジェクトのカスタムプロパティ（数値）を取得する。オブジェクトに無ければ gid のタイル定義から取得 */
    private getTiledPropertyNumber(
      obj: Phaser.Types.Tilemaps.TiledObject,
      name: string,
    ): number | undefined {
      const fromObj = this.getTiledPropertyNumberFromObject(obj, name);
      if (fromObj !== undefined) return fromObj;
      const gid = (obj as { gid?: number }).gid;
      if (gid != null) return this.getTiledPropertyNumberFromTile(gid, name);
      return undefined;
    }

    private getTiledPropertyNumberFromObject(
      obj: Phaser.Types.Tilemaps.TiledObject,
      name: string,
    ): number | undefined {
      const raw = obj as {
        properties?: Array<{ name: string; value: number }> | Record<string, number>;
      };
      const props = raw.properties;
      if (Array.isArray(props)) {
        const p = props.find((pr) => pr.name === name);
        return p != null ? Number(p.value) : undefined;
      }
      if (props && typeof props === "object" && name in props) {
        const v = (props as Record<string, number>)[name];
        return typeof v === "number" ? v : undefined;
      }
      return undefined;
    }

    /** gid のタイル定義からプロパティを取得（タイルセットのタイルに設定した値） */
    private getTiledPropertyNumberFromTile(gid: number, name: string): number | undefined {
      for (let i = 0; i < this.map.tilesets.length; i++) {
        const tileset = this.map.tilesets[i];
        if (!tileset.containsTileIndex(gid)) continue;
        const props = tileset.getTileProperties(gid) as
          | Record<string, unknown>
          | null
          | undefined;
        if (props == null || !(name in props)) return undefined;
        const raw = props[name];
        if (raw == null) return undefined;
        const n = Number(raw);
        return Number.isFinite(n) ? n : undefined;
      }
      return undefined;
    }

    /** Tiled オブジェクトのカスタムプロパティ（bool）を取得する */
    private getTiledPropertyBool(
      obj: Phaser.Types.Tilemaps.TiledObject,
      name: string,
    ): boolean | undefined {
      const raw = obj as {
        properties?: Array<{ name: string; value: unknown }>;
      };
      const props = raw.properties;
      if (!Array.isArray(props)) return undefined;
      const p = props.find((pr) => pr.name === name);
      if (p == null) return undefined;
      return typeof p.value === "boolean" ? p.value : Boolean(p.value);
    }

    /**
     * DEBUG 時: phaserConfig の PLAYER_START_POSITION を参照。
     * 2nd/3rd は "Player_before_goal" のときだけそのオブジェクト名、それ以外は "Player"。1st は設定値をそのまま。
     */
    private getPlayerStartObjectName(): string {
      if (!DEBUG) return "Player";
      const stage = this.getEffectiveStageNumber();
      if (stage === 2 || stage === 3) {
        return PLAYER_START_POSITION === "Player_before_goal"
          ? "Player_before_goal"
          : "Player";
      }
      return PLAYER_START_POSITION;
    }

    private setupGoalFlag() {
      const goalObj = this.findGoalFlagMapObject();
      if (goalObj && goalObj.x !== undefined && goalObj.y !== undefined) {
        const flag = this.add.sprite(
          goalObj.x,
          goalObj.y,
          ASSET_KEYS.GOAL_FLAG,
          0,
        );
        flag.setOrigin(0, 1);
        flag.setDisplaySize(GOAL_FLAG_SIZE, GOAL_FLAG_SIZE);
        flag.play("goal-flag");

        this.physics.add.existing(flag, true);
        const flagBody = flag.body as Phaser.Physics.Arcade.StaticBody;
        // 当たり判定もスプライトと同じく左下基準。Y軸 +32px ずらす（ボディ左上を sprite.x, sprite.y に）
        flagBody.setSize(GOAL_FLAG_SIZE, GOAL_FLAG_SIZE);
        flagBody.setOffset(0, 0);

        this.goalFlagSprite = flag;
      }
    }

    /** 2nd ステージ用：トランポリン（bounce）アニメを登録。Frame 2=待機, 1=縮む, 0=伸びる */
    private createBouncepadAnimation() {
      if (this.anims.exists(BOUNCEPAD_ANIM_KEY)) return;
      this.anims.create({
        key: BOUNCEPAD_ANIM_KEY,
        frames: [
          { key: ASSET_KEYS.BOUNCEPAD_RED, frame: 2 },
          { key: ASSET_KEYS.BOUNCEPAD_RED, frame: 1 },
          { key: ASSET_KEYS.BOUNCEPAD_RED, frame: 0 },
          { key: ASSET_KEYS.BOUNCEPAD_RED, frame: 2 },
        ],
        frameRate: 15,
        repeat: 0,
      });
    }

    /** 2nd/3rd ステージ用：Bouncepad_Red をトランポリンとして配置する */
    private setupBouncepads() {
      if (!this.textures.exists(ASSET_KEYS.BOUNCEPAD_RED)) return;
      const objectLayer = this.map.getObjectLayer(OBJECT_LAYER_NAME);
      if (!objectLayer) return;
      if (this.bouncepads !== null && this.canReuseGroup(this.bouncepads)) {
        this.bouncepads.clear(true, true);
      } else {
        this.bouncepads = this.add.group();
      }
      const bouncepadTileset = this.map.tilesets.find(
        (t) => t.name === BOUNCEPAD_RED_OBJECT_NAME,
      );
      const firstGid = bouncepadTileset?.firstgid;
      const tileCount = bouncepadTileset?.total ?? 0;

      const bouncepadObjects = objectLayer.objects.filter((obj) => {
        if (obj.name === BOUNCEPAD_RED_OBJECT_NAME) return true;
        const gid = (obj as { gid?: number }).gid;
        if (firstGid == null || tileCount <= 0 || gid == null) return false;
        return gid >= firstGid && gid < firstGid + tileCount;
      });
      for (const obj of bouncepadObjects) {
        if (obj.x === undefined || obj.y === undefined) continue;
        const pad = this.add.sprite(
          obj.x,
          obj.y - 48,
          ASSET_KEYS.BOUNCEPAD_RED,
          2,
        );
        pad.setOrigin(0, 0);
        pad.setDisplaySize(BOUNCEPAD_RED_SIZE, BOUNCEPAD_RED_SIZE);
        pad.setDepth(DEPTH_BOUNCEPAD);
        this.physics.add.existing(pad, true);
        const body = pad.body as Phaser.Physics.Arcade.StaticBody;
        body.setSize(BOUNCEPAD_BODY_SIZE, BOUNCEPAD_BODY_SIZE);
        body.setOffset(BOUNCEPAD_BODY_OFFSET, BOUNCEPAD_BODY_OFFSET);
        this.bouncepads.add(pad);
      }
      this.physics.add.collider(
        this.player,
        this.bouncepads,
        (playerObj, trampolineObj) => {
          this.onTrampolineLand(
            playerObj as Phaser.Physics.Arcade.Sprite,
            trampolineObj as Phaser.GameObjects.Sprite,
          );
        },
        (playerObj, trampolineObj) =>
          this.isTrampolineLandingFromAbove(
            (playerObj as Phaser.Physics.Arcade.Sprite).body as Phaser.Physics.Arcade.Body,
            (trampolineObj as Phaser.GameObjects.Sprite).body as Phaser.Physics.Arcade.StaticBody,
          ),
      );
    }

    /** トランポリンに上から着地したときの処理（跳ね・大ジャンプ判定） */
    private onTrampolineLand(
      player: Phaser.Physics.Arcade.Sprite,
      trampoline: Phaser.GameObjects.Sprite,
    ) {
      const playerBody = player.body as Phaser.Physics.Arcade.Body;
      if (!playerBody.touching.down) return;
      if (this.playerOnBouncepad === trampoline) return;
      this.playerOnBouncepad = trampoline;
      this.jumpedFromTrampoline = true;
      trampoline.play(BOUNCEPAD_ANIM_KEY);
      const jumpPressedThisFrame =
        (this.cursors.up.isDown || globalControls.up) && !this.wasJumpPressed;
      const justBeforeLanding =
        jumpPressedThisFrame ||
        (this.lastJumpPressedWhileInAir > 0 &&
          this.time.now - this.lastJumpPressedWhileInAir <
            BOUNCEPAD_SUPER_JUMP_WINDOW_MS);
      this.lastJumpPressedWhileInAir = 0;
      if (justBeforeLanding) {
        this.jumpedFromTrampolineSuper = true;
        player.setVelocityY(BOUNCEPAD_SUPER_BOUNCE_VELOCITY);
        this.sound.play(ASSET_KEYS.SPRING_SFX, SPRING_SFX_MARKER_BIG);
      } else {
        this.jumpedFromTrampolineSuper = false;
        player.setVelocityY(BOUNCEPAD_BOUNCE_VELOCITY);
        this.sound.play(ASSET_KEYS.SPRING_SFX, SPRING_SFX_MARKER_NORMAL);
      }
    }

    /** プレイヤーがトランポリンに上から着地したか（processCallback 用） */
    private isTrampolineLandingFromAbove(
      playerBody: Phaser.Physics.Arcade.Body,
      trampolineBody: Phaser.Physics.Arcade.StaticBody,
    ): boolean {
      const trampolineTop = trampolineBody.top;
      const playerBottom = playerBody.bottom;
      return (
        playerBottom >= trampolineTop - 2 &&
        playerBottom <= trampolineTop + 12 &&
        playerBody.velocity.y >= -15
      );
    }

    /** 足元に platform レイヤーの当たりタイルがあるか */
    private isPlayerStandingOnPlatformTile(): boolean {
      const playerBody = this.player.body as Phaser.Physics.Arcade.Body;
      const x = playerBody.center.x;
      const feetY = playerBody.bottom;
      for (const y of [feetY, feetY + PLATFORM_FEET_CHECK_OFFSET]) {
        const tile = this.platformLayer.getTileAtWorldXY(x, y);
        if (
          tile &&
          ((tile.properties?.collides as boolean) ||
            (tile.properties?.oneWay as boolean))
        ) {
          return true;
        }
      }
      return false;
    }

    /** プレイヤーが Bouncepad_Red の上に立っているか（その上だけなら通常ジャンプ不可）。足元に platform タイルがあれば false（通常ジャンプ可）。 */
    private isPlayerStandingOnBouncepad(): boolean {
      if (!this.isGameObjectGroupUsable(this.bouncepads)) return false;
      const playerBody = this.player.body as Phaser.Physics.Arcade.Body;
      if (!playerBody.touching.down && !playerBody.blocked.down) return false;
      if (this.isPlayerStandingOnPlatformTile()) return false;
      const playerBottom = playerBody.bottom;
      const playerCenterX = playerBody.center.x;
      for (const pad of this.bouncepads.getChildren() as Phaser.GameObjects.Sprite[]) {
        const padBody = pad.body as Phaser.Physics.Arcade.StaticBody;
        const padTop = padBody.top;
        const padLeft = padBody.left;
        const padRight = padBody.right;
        const verticalOnPad =
          playerBottom >= padTop - BOUNCEPAD_STANDING_VERTICAL_MARGIN_TOP &&
          playerBottom <= padTop + BOUNCEPAD_STANDING_VERTICAL_MARGIN_BOTTOM;
        const horizontallyAbovePad =
          playerCenterX >= padLeft - BOUNCEPAD_STANDING_HORIZONTAL_MARGIN &&
          playerCenterX <= padRight + BOUNCEPAD_STANDING_HORIZONTAL_MARGIN;
        if (verticalOnPad && horizontallyAbovePad) return true;
      }
      return false;
    }

    private setupCoins() {
      if (this.canReuseGroup(this.coins)) {
        this.coins.clear(true, true);
      } else {
        this.coins = this.add.group();
      }
      const coinObjects: Array<{ x: number; y: number }> = [];

      const objectLayer = this.map.getObjectLayer(OBJECT_LAYER_NAME);
      if (objectLayer) {
        for (const obj of objectLayer.objects.filter(
          (o) => o.name === COIN_OBJECT_NAME,
        )) {
          if (obj.x !== undefined && obj.y !== undefined) {
            coinObjects.push({ x: obj.x, y: obj.y - COIN_SIZE });
          }
        }
      }

      const coinsLayer = this.map.getObjectLayer(COINS_LAYER_NAME);
      if (coinsLayer) {
        for (const obj of coinsLayer.objects) {
          if (obj.x !== undefined && obj.y !== undefined && obj.gid != null) {
            coinObjects.push({ x: obj.x, y: obj.y - COIN_SIZE });
          }
        }
      }

      for (const { x, y } of coinObjects) {
        const coin = this.add.image(x, y, ASSET_KEYS.COIN);
        coin.setOrigin(0, 0);
        coin.setDisplaySize(COIN_SIZE, COIN_SIZE);
        this.physics.add.existing(coin, true);
        const body = coin.body as Phaser.Physics.Arcade.StaticBody;
        body.setSize(COIN_SIZE, COIN_SIZE);
        this.coins.add(coin);
      }
    }

    private setupPlayerCoinOverlap() {
      this.physics.add.overlap(this.player, this.coins, (_player, coin) => {
        (coin as Phaser.GameObjects.GameObject).destroy();
        this.onPlayerCoinPickup();
      });
    }

    private onPlayerCoinPickup() {
      this.coinCount++;
      if (this.coinCount === 100) {
        this.coinCount = 0;
        this.livesCount++;
        this.updateLivesText();
        this.blinkLivesText();
        this.sound.play(ASSET_KEYS.PLAYER_1UP);
      }
      this.updateCoinsText();
      this.sound.play(ASSET_KEYS.PLAYER_COIN);
    }

    private setupPlayerGoalOverlap() {
      if (!this.goalFlagSprite) return;
      this.physics.add.overlap(this.player, this.goalFlagSprite, () => {
        this.onGoalReached();
      });
    }

    private onGoalReached() {
      if (this.goalReached) return;
      this.goalReached = true;
      this.stopGameBGM();
      this.physics.pause();
      this.player.anims.stop();
      this.showGoalText();
      const goalSound = this.sound.add(ASSET_KEYS.PLAYER_GOAL) as Phaser.Sound.BaseSound;
      const durationSec = goalSound.totalDuration ?? goalSound.duration ?? 1;
      const transitionAtMs = Math.max(
        0,
        (durationSec - GOAL_SOUND_STOP_BEFORE_END_SEC) * 1000,
      );
      goalSound.play();
      /** 1→2、2→3 はフェード後に次ステージへ。3のみゲームクリア画面 */
      const nextRuntimeStage = this.getNextRuntimeStageAfterGoal();
      this.time.delayedCall(transitionAtMs, () => {
        goalSound.stop();
        this.startTransitionToGameClear(nextRuntimeStage);
      });
    }

    /**
     * ゴール時に続行する次のステージ番号。
     * `null` のときはステージ3相当（最終面）のあとなのでゲームクリア画面へ。
     */
    private getNextRuntimeStageAfterGoal(): 2 | 3 | null {
      const s = this.getEffectiveStageNumber();
      if (s === 1) return 2;
      if (s === 2) return 3;
      return null;
    }

    /** 画面上に "GOAL!!" をバウンスアニメーションで表示 */
    private showGoalText() {
      const cam = this.cameras.main;
      this.goalText = this.add.text(cam.width / 2, cam.height / 2, GAME_CLEAR_GOAL_TEXT, {
        fontFamily: UI_FONT_FAMILY,
        fontSize: GAME_CLEAR_GOAL_TEXT_FONT_SIZE,
        color: GAME_CLEAR_GOAL_TEXT_COLOR,
      });
      this.goalText.setOrigin(0.5, 0.5);
      this.goalText.setScrollFactor(0);
      this.goalText.setAlpha(0);
      this.goalText.setScale(0);

      this.tweens.add({
        targets: this.goalText,
        alpha: 1,
        scale: 1.2,
        duration: GAME_CLEAR_GOAL_TWEEN_DURATION_FIRST_MS,
        ease: "Back.easeOut",
        onComplete: () => {
          if (!this.goalText) return;
          this.tweens.add({
            targets: this.goalText,
            scale: 1,
            duration: GAME_CLEAR_GOAL_TWEEN_DURATION_BOUNCE_MS,
            ease: "Bounce.easeOut",
          });
        },
      });
    }

    /**
     * GOAL!! のあとフェードアウト。
     * @param nextRuntimeStage 指定時はゲームクリア画面を出さず、その番号のステージへ `restart`（1→2・2→3）
     */
    private startTransitionToGameClear(nextRuntimeStage: 2 | 3 | null) {
      this.stopGameBGM();
      const cam = this.cameras.main;
      /** タイトル開始時と同じフェード時間（`startTitleFadeOut` の `fadeOut` と一致） */
      const fadeMs = GAME_CONSTANTS.CAMERA.FADE_DURATION_MS;
      cam.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => {
        if (nextRuntimeStage !== null) {
          this.goalText?.destroy();
          this.goalText = null;
          this.scene.restart({
            runtimeStageNumber: nextRuntimeStage,
            livesCount: this.livesCount,
            coinCount: this.coinCount,
            resumeGameWithoutTitle: true,
          });
          return;
        }
        this.showGameClearScreen();
        cam.fadeIn(GAME_CLEAR_FADE_DURATION_MS);
      });
      cam.fadeOut(fadeMs, 0, 0, 0);
    }

    private showGameClearScreen() {
      this.isGameClear = true;
      this.gameClearToTitleFired = false;
      this.player.setVisible(false);
      this.cameras.main.stopFollow();
      this.gameClearBGM = this.sound.add(
        ASSET_KEYS.BGM_GAMECLEAR,
      ) as Phaser.Sound.WebAudioSound;
      this.gameClearBGM.setVolume(0);
      this.gameClearBGM.play({ loop: true, seek: 4 });
      const fadeDuration = GAME_CONSTANTS.CAMERA.FADE_DURATION_MS;
      const state = { volume: 0 };
      this.tweens.add({
        targets: state,
        volume: 0.7,
        duration: fadeDuration,
        ease: "Linear",
        onUpdate: () => this.gameClearBGM?.setVolume(state.volume),
      });
      this.gameClearScreenRef = createGameClearScreen(this, {
        onTouchToTitle: () => this.returnToTitleFromGameClear(),
      });
      this.addGameClearContainerListeners();
    }

    /**
     * ゲームクリア画面からタイトルへ（タッチ／ポインタ）。
     * 空のシーンデータで `restart` し、キャンペーン用の runtimeStage 等を引き継がない。
     */
    private returnToTitleFromGameClear() {
      if (this.gameClearToTitleFired) return;
      this.gameClearToTitleFired = true;
      removeResumeListeners(this.gameClearContainer, this.gameClearContainerHandler);
      this.gameClearContainer = null;
      this.gameClearContainerHandler = null;
      this.stopGameClearBGM();
      this.gameClearScreenRef?.destroy();
      this.gameClearScreenRef = null;
      this.tweens.killAll();
      this.scene.restart({});
    }

    /** iOS レターボックス含めタッチを拾う（GAME OVER と同様） */
    private addGameClearContainerListeners() {
      const container = getGameContainer(this);
      if (!container) return;
      const handler = () => this.returnToTitleFromGameClear();
      container.addEventListener("touchstart", handler, { passive: true });
      container.addEventListener("pointerdown", handler);
      this.gameClearContainer = container;
      this.gameClearContainerHandler = handler;
    }

    /** ゲームクリア画面用BGMを停止する（クリア画面から他画面へ遷移時） */
    private stopGameClearBGM() {
      this.gameClearBGM?.stop();
      this.gameClearBGM = null;
    }

    private setupPlayer() {
      this.playerStartX = GAME_CONSTANTS.PLAYER.DEFAULT_START_X;
      this.playerStartY = GAME_CONSTANTS.PLAYER.DEFAULT_START_Y;

      const objectName = this.getPlayerStartObjectName();
      const altNames =
        objectName === "Player"
          ? [objectName, ASSET_KEYS.PLAYER]
          : [objectName];
      const playerObj = this.findMapObject(...altNames);
      if (playerObj && playerObj.x !== undefined && playerObj.y !== undefined) {
        this.playerStartX = playerObj.x;
        this.playerStartY = playerObj.y;
      }

      this.player = this.physics.add.sprite(
        this.playerStartX,
        this.playerStartY,
        ASSET_KEYS.PLAYER,
        0,
      );

      const playerBody = this.player.body as Phaser.Physics.Arcade.Body;
      this.applyPlayerBodySize(
        playerBody,
        GAME_CONSTANTS.PLAYER.ACTUAL_WIDTH,
        GAME_CONSTANTS.PLAYER.ACTUAL_HEIGHT,
      );
      playerBody.setCollideWorldBounds(true);
      this.player.setDepth(
        this.getEffectiveStageNumber() === 3
          ? DEPTH_PLAYER_STAGE3
          : DEPTH_PLAYER_AND_ENEMY,
      );
    }

    private applyPlayerBodySize(
      body: Phaser.Physics.Arcade.Body,
      width: number,
      height: number,
    ) {
      body.setSize(width, height);
      body.setOffset(
        (GAME_CONSTANTS.PLAYER.FRAME_WIDTH - width) / 2,
        (GAME_CONSTANTS.PLAYER.FRAME_HEIGHT - height) / 2,
      );
    }

    private setupCamera() {
      const mapWidth = this.map.widthInPixels;
      const mapHeight = this.map.heightInPixels;
      this.deathY = mapHeight;

      this.startCameraFollow();
      this.cameras.main.setBounds(0, 0, mapWidth, mapHeight);
      this.physics.world.setBounds(0, 0, mapWidth, mapHeight + 400);
    }

    private startCameraFollow() {
      this.cameras.main.startFollow(
        this.player,
        true,
        GAME_CONSTANTS.CAMERA.FOLLOW_LERP_X,
        GAME_CONSTANTS.CAMERA.FOLLOW_LERP_Y,
      );
    }

    /** `physics.add.collider`（platformLayer）と同じ当たり判定条件。 */
    private shouldProcessPlayerPlatformTileCollision(
      object1:
        | Phaser.Types.Physics.Arcade.GameObjectWithBody
        | Phaser.Physics.Arcade.Body
        | Phaser.Physics.Arcade.StaticBody
        | Phaser.Tilemaps.Tile,
      object2:
        | Phaser.Types.Physics.Arcade.GameObjectWithBody
        | Phaser.Physics.Arcade.Body
        | Phaser.Physics.Arcade.StaticBody
        | Phaser.Tilemaps.Tile,
    ): boolean {
      const player = object1 as Phaser.Physics.Arcade.Sprite;
      const tile = object2 as Phaser.Tilemaps.Tile;
      const playerBody = player.body as Phaser.Physics.Arcade.Body;

      if (tile.properties && tile.properties.oneWay !== true) {
        return true;
      }
      if (playerBody.velocity.y < 0) return false;

      const playerBottom = playerBody.bottom;
      const prevPlayerBottom = playerBody.prev.y + playerBody.height;
      const tileTop = tile.pixelY;

      if (
        prevPlayerBottom <=
          tileTop + GAME_CONSTANTS.COLLISION.ONE_WAY_TOLERANCE_PREV ||
        playerBottom <=
          tileTop + GAME_CONSTANTS.COLLISION.ONE_WAY_TOLERANCE_CURRENT
      ) {
        return true;
      }
      return false;
    }

    /** スポーン位置のタイルめり込みを手動 `collide` で解消し `playerStart` を同期する。 */
    private resolveSpawnOverlapWithPlatforms() {
      const body = this.player.body as Phaser.Physics.Arcade.Body;
      body.updateFromGameObject();
      for (let i = 0; i < 12; i++) {
        this.physics.world.collide(
          this.player,
          this.platformLayer,
          undefined,
          this.shouldProcessPlayerPlatformTileCollision,
          this,
        );
      }
      body.setVelocity(0, 0);
      this.playerStartX = this.player.x;
      this.playerStartY = this.player.y;
    }

    private setupPlayerCollision() {
      this.physics.add.collider(
        this.player,
        this.platformLayer,
        undefined,
        this.shouldProcessPlayerPlatformTileCollision,
        this,
      );

      if (this.movingPlatforms) {
        this.physics.add.collider(
          this.player,
          this.movingPlatforms,
          (a, b) =>
            this.onPlayerHitMovingPlatform(
              a as Phaser.Types.Physics.Arcade.GameObjectWithBody,
              b as Phaser.Types.Physics.Arcade.GameObjectWithBody,
            ),
          (a, b) =>
            this.processMovingPlatformCollision(
              a as Phaser.Types.Physics.Arcade.GameObjectWithBody,
              b as Phaser.Types.Physics.Arcade.GameObjectWithBody,
            ),
          this,
        );
      }

      this.resolveSpawnOverlapWithPlatforms();
    }

    /** プレイヤーが動く床の上に乗ったときに呼ばれる。乗っている床を記録し、update で位置を同期する。 */
    private onPlayerHitMovingPlatform(
      playerObj: Phaser.Types.Physics.Arcade.GameObjectWithBody,
      platformObj: Phaser.Types.Physics.Arcade.GameObjectWithBody,
    ): void {
      const player = playerObj as Phaser.Physics.Arcade.Sprite;
      const platform = platformObj as Phaser.Physics.Arcade.Sprite;
      const playerBody = player.body as Phaser.Physics.Arcade.Body;
      const platformBody = platform.body as Phaser.Physics.Arcade.Body;
      if (playerBody.touching.down && platformBody.touching.up) {
        if (this.playerOnMovingPlatform !== platform) {
          this.lastMovingPlatformX = platform.x;
        }
        this.playerOnMovingPlatform = platform;
      }
    }

    /** 動く床との当たりは上からのみ有効（横・下は無効） */
    private processMovingPlatformCollision(
      playerObj: Phaser.Types.Physics.Arcade.GameObjectWithBody,
      platformObj: Phaser.Types.Physics.Arcade.GameObjectWithBody,
    ): boolean {
      return isMovingPlatformOneWayCollision(
        playerObj as Phaser.Physics.Arcade.Sprite,
        platformObj as Phaser.Physics.Arcade.Sprite,
      );
    }

    private setupEnemies() {
      this.enemies = [];
      this.enemyStartPositions = [];
      const initialDirection = GAME_CONSTANTS.ENEMY.INITIAL_DIRECTION;

      const enemyObjects: Array<{
        x: number;
        y: number;
        isBird: boolean;
        fromEnemiesLayer: boolean;
        obj: Phaser.Types.Tilemaps.TiledObject;
      }> = [];

      const objectLayer = this.map.getObjectLayer(OBJECT_LAYER_NAME);
      if (objectLayer) {
        // 2nd/3rd: Bird は Enemies レイヤーのタイルオブジェクトのみ。objectsLayer の Bird_1 は読み込まない
        for (const obj of objectLayer.objects.filter((o) =>
          ENEMY_OBJECT_NAMES.includes(o.name as (typeof ENEMY_OBJECT_NAMES)[number]) &&
          o.name !== BIRD_1_OBJECT_NAME,
        )) {
          if (obj.x !== undefined && obj.y !== undefined) {
            enemyObjects.push({
              x: obj.x,
              y: obj.y,
              isBird: false,
              fromEnemiesLayer: false,
              obj,
            });
          }
        }
      }

      const enemiesLayer = this.map.getObjectLayer(ENEMIES_LAYER_NAME);
      if (enemiesLayer) {
        const birdGidRange = getTilesetGidRange(this.map, BIRD_1_OBJECT_NAME);
        const spiderGidRange = getTilesetGidRange(this.map, ENEMY_OBJECT_NAME);

        for (const obj of enemiesLayer.objects) {
          if (obj.x === undefined || obj.y === undefined || obj.gid == null) {
            continue;
          }
          const gid = obj.gid;
          const isBirdFromLayer = isGidInTilesetRange(gid, birdGidRange);
          const isSpiderFromLayer = isGidInTilesetRange(gid, spiderGidRange);
          if (isBirdFromLayer || isSpiderFromLayer) {
            enemyObjects.push({
              x: obj.x,
              y: obj.y,
              isBird: isBirdFromLayer,
              fromEnemiesLayer: true,
              obj,
            });
          }
        }
      }

      for (const {
        x: startX,
        y: startY,
        isBird,
        fromEnemiesLayer,
        obj: enemyObj,
      } of enemyObjects) {
        const enemy = this.physics.add.sprite(
          startX,
          startY,
          isBird ? ASSET_KEYS.BIRD_1 : ASSET_KEYS.SPIDER,
          isBird ? 0 : 0,
        ) as EnemySprite;

        if (fromEnemiesLayer) {
          enemy.setOrigin(0, 1);
          if (!isBird) {
            const speed =
              this.getTiledPropertyNumber(enemyObj, "speed") ??
              GAME_CONSTANTS.ENEMY.SPEED_X;
            const range =
              this.getTiledPropertyNumber(enemyObj, "range") ??
              GAME_CONSTANTS.ENEMY.DEFAULT_RANGE;
            (enemy as EnemySprite).startX = startX;
            (enemy as EnemySprite).range = range;
            (enemy as EnemySprite).speed = speed;
          }
        }

        const spiderRangeMode = fromEnemiesLayer && !isBird;

        if (isBird) {
          const range =
            this.getTiledPropertyNumber(enemyObj, "range") ??
            GAME_CONSTANTS.ENEMY.DEFAULT_RANGE;
          const speed =
            this.getTiledPropertyNumber(enemyObj, "speed") ??
            GAME_CONSTANTS.ENEMY.SPEED_X;
          enemy.startX = startX;
          enemy.range = range;
          enemy.speed = speed;
          enemy.setDisplaySize(BIRD_1_FRAME_SIZE, BIRD_1_FRAME_SIZE);
          const birdBody = enemy.body as Phaser.Physics.Arcade.Body;
          birdBody.setSize(15, 14);
          birdBody.setOffset(17, 17);
          birdBody.setCollideWorldBounds(true);
          birdBody.allowGravity = false;
          enemy.play("bird-fly", true);
        } else {
          enemy.setDisplaySize(
            GAME_CONSTANTS.ENEMY.DISPLAY_WIDTH,
            GAME_CONSTANTS.ENEMY.DISPLAY_HEIGHT,
          );
          const enemyBody = enemy.body as Phaser.Physics.Arcade.Body;
          enemyBody.setSize(
            GAME_CONSTANTS.ENEMY.BODY_WIDTH,
            GAME_CONSTANTS.ENEMY.BODY_HEIGHT,
          );
          enemyBody.setOffset(
            GAME_CONSTANTS.ENEMY.OFFSET_X,
            GAME_CONSTANTS.ENEMY.OFFSET_Y,
          );
          enemyBody.setCollideWorldBounds(true);
          enemy.play("spider-walk", true);

          // 2nd/3rd Spider（Enemies層）: 初速をマイナス（左へ）、画像を左向きに
          if (spiderRangeMode) {
            const spiderSpeed =
              (enemy as EnemySprite).speed ?? GAME_CONSTANTS.ENEMY.SPEED_X;
            enemyBody.setVelocityX(-spiderSpeed);
            enemy.setFlipX(false);
          }
        }

        enemy.moveDirection = spiderRangeMode ? -1 : initialDirection;
        if (!spiderRangeMode) {
          enemy.setFlipX(enemy.moveDirection > 0);
        }

        enemy.setDepth(DEPTH_PLAYER_AND_ENEMY);

        this.physics.add.collider(enemy, this.platformLayer);
        if (this.movingPlatforms) {
          this.physics.add.collider(enemy, this.movingPlatforms);
        }

        this.enemies.push(enemy);
        this.enemyStartPositions.push({
          x: startX,
          y: startY,
          moveDirection: enemy.moveDirection,
        });
      }
    }

    private setupInput() {
      if (this.input.keyboard) {
        this.cursors = this.input.keyboard.createCursorKeys();
      } else {
        // キーボードがない環境（iOS など）ではスタブを代入し、VirtualControls のみで操作する
        this.cursors = this.createStubCursorKeys();
      }
    }

    /** キーボードなし用の CursorKeys スタブ（up/left/right/down は常に isDown: false） */
    private createStubCursorKeys(): Phaser.Types.Input.Keyboard.CursorKeys {
      const noop = { isDown: false };
      return {
        up: noop,
        down: noop,
        left: noop,
        right: noop,
      } as Phaser.Types.Input.Keyboard.CursorKeys;
    }

    /** 3rd ステージ：Podoboo（Flame）接触でミス */
    private setupPlayerPodobooOverlap() {
      if (!this.podobooFlames) return;
      this.physics.add.overlap(this.player, this.podobooFlames, () => {
        if (this.isPlayingMissSequence) return;
        if (this.isInFallDeathTransition) return;
        if (this.time.now < this.invincibleUntil) return;
        this.isPlayingMissSequence = true;
        this.triggerMiss();
      });
    }

    private setupPlayerEnemyOverlap() {
      this.physics.add.overlap(this.player, this.enemies, () => {
        if (this.isPlayingMissSequence) return;
        if (this.isInFallDeathTransition) return;
        if (this.time.now < this.invincibleUntil) return;
        // 残機0でもミスは発火する（フェード後にGAME OVER）
        // 同一フレーム・連続で複数回呼ばれても1回だけミスにする
        this.isPlayingMissSequence = true;
        this.triggerMiss();
      });
    }

    private triggerMiss() {
      this.wasMissWithZeroLives = this.livesCount === 0;
      this.playMissSequence(() => {
        if (this.livesCount > 0) {
          this.respawnPlayer();
        } else {
          this.showGameOver();
        }
      });
    }

    private updateLivesText() {
      if (this.livesText) {
        this.livesText.setText(String(this.livesCount));
      }
    }

    /** 残機が増えたときに、残機の数字を短く点滅させる */
    private blinkLivesText() {
      if (!this.livesText) return;
      this.tweens.killTweensOf(this.livesText);
      const blinkYellow = "#ffeb3b";
      const blinkRed = "#ff3b3b";
      const defaultColor = UI_NUMBER_TEXT_STYLE.color;
      const blinkAlpha = 0.2;
      const blinkDurationMs = 90;
      const blinkRepeatCount = 3;

      let useRed = false; // onRepeat ごとに切り替えるためのフラグ

      // 点滅中は黄色/赤を交互に切り替える
      this.livesText.setStyle({ color: blinkYellow });
      this.livesText.setAlpha(1);
      this.tweens.add({
        targets: this.livesText,
        alpha: blinkAlpha,
        duration: blinkDurationMs,
        yoyo: true,
        repeat: blinkRepeatCount,
        onRepeat: () => {
          useRed = !useRed;
          this.livesText?.setStyle({
            color: useRed ? blinkRed : blinkYellow,
          });
        },
        onComplete: () => {
          this.livesText?.setAlpha(1);
          this.livesText?.setStyle({ color: defaultColor });
        },
      });
    }

    private updateCoinsText() {
      if (this.coinsText) {
        this.coinsText.setText(String(this.coinCount).padStart(2, "0"));
      }
    }

    private playMissSequence(onComplete: () => void) {
      this.isPlayingMissSequence = true;
      this.missSequenceOnComplete = onComplete;
      this.cameras.main.stopFollow();
      this.player.anims.stop();
      this.applyMissAppearanceAndBounce();
    }

    /** ミス時の見た目（Player_miss）とぴょんと上に飛ばす演出を適用 */
    private applyMissAppearanceAndBounce() {
      this.pauseGameBGM();
      this.sound.play(ASSET_KEYS.PLAYER_MISS_SFX);
      const playerBody = this.player.body as Phaser.Physics.Arcade.Body;
      this.player.setTexture(ASSET_KEYS.PLAYER_MISS, 0);
      this.applyPlayerBodySize(
        playerBody,
        GAME_CONSTANTS.PLAYER.MISS_BODY_WIDTH,
        GAME_CONSTANTS.PLAYER.MISS_BODY_HEIGHT,
      );
      playerBody.setVelocity(0, GAME_CONSTANTS.PLAYER.MISS_BOUNCE_VELOCITY);
      playerBody.checkCollision.none = true;
    }

    /** フェードアウト→復帰処理→フェードインの共通処理。onFadeInComplete はフェードイン完了時に呼ぶ */
    private performRespawnAfterFadeOut(onFadeInComplete: () => void) {
      const duration = GAME_CONSTANTS.CAMERA.FADE_DURATION_MS;
      const playerBody = this.player.body as Phaser.Physics.Arcade.Body;
      this.cameras.main.fadeOut(duration, 0, 0, 0);
      this.cameras.main.once(
        Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE,
        () => {
          if (this.livesCount > 0) {
            this.livesCount--;
            this.updateLivesText();
          }
          this.restorePlayerAppearance();
          this.player.setPosition(this.playerStartX, this.playerStartY);
          playerBody.setVelocity(0, 0);
          this.resetEnemiesToStartPositions();
          this.resetMovingPlatforms();
          this.startCameraFollow();
          this.invincibleUntil =
            this.time.now + GAME_CONSTANTS.PLAYER.INVINCIBLE_DURATION_MS;
          this.cameras.main.fadeIn(duration, 0, 0, 0);
          this.cameras.main.once(
            Phaser.Cameras.Scene2D.Events.FADE_IN_COMPLETE,
            () => {
              this.resumeGameBGMWithFadeIn();
              onFadeInComplete();
            },
          );
        },
      );
    }

    private finishMissSequence() {
      if (!this.missSequenceOnComplete) return;
      const playerBody = this.player.body as Phaser.Physics.Arcade.Body;
      playerBody.checkCollision.none = false;
      this.missSequenceOnComplete = null;

      if (this.wasMissWithZeroLives) {
        this.isPlayingMissSequence = false;
        this.showGameOver();
        return;
      }

      this.performRespawnAfterFadeOut(() => {
        this.isPlayingMissSequence = false;
        this.respawnPlayer();
      });
    }

    /** 地面がないところへ落下したときの専用経路（ミス演出→ぴょん→落下→画面外でフェード） */
    private handleFallDeath() {
      this.wasMissWithZeroLives = this.livesCount === 0;
      this.isInFallDeathTransition = true;
      this.isWaitingForFallDeathOffScreen = true;
      this.cameras.main.stopFollow();
      this.player.anims.stop();
      this.applyMissAppearanceAndBounce();
    }

    /** 落下死で画面外に出たあと、フェードアウト〜復帰処理を行う */
    private startFallDeathFade() {
      this.isWaitingForFallDeathOffScreen = false;
      const playerBody = this.player.body as Phaser.Physics.Arcade.Body;
      playerBody.checkCollision.none = false;

      if (this.wasMissWithZeroLives) {
        this.isInFallDeathTransition = false;
        this.showGameOver();
        return;
      }

      this.performRespawnAfterFadeOut(() => {
        this.isInFallDeathTransition = false;
      });
    }

    private restorePlayerAppearance() {
      this.player.setTexture(ASSET_KEYS.PLAYER);
      this.player.setFrame(0);
      this.player.setFlipX(false);
      this.applyPlayerBodySize(
        this.player.body as Phaser.Physics.Arcade.Body,
        GAME_CONSTANTS.PLAYER.ACTUAL_WIDTH,
        GAME_CONSTANTS.PLAYER.ACTUAL_HEIGHT,
      );
    }

    private respawnPlayer() {
      this.startCameraFollow();
      this.player.setPosition(this.playerStartX, this.playerStartY);
      const playerBody = this.player.body as Phaser.Physics.Arcade.Body;
      playerBody.setVelocity(0, 0);
      this.invincibleUntil =
        this.time.now + GAME_CONSTANTS.PLAYER.INVINCIBLE_DURATION_MS;
    }

    private showGameOver() {
      this.isGameOver = true;
      this.gameOverRestartFired = false;
      this.player.setVisible(false);
      this.physics.pause();
      this.stopGameBGM();

      const ui = createGameOverUI(this);
      this.gameOverOverlay = ui.overlay;
      this.gameOverText = ui.gameOverText;
      this.gameOverContinueText = ui.continueText;

      this.input.once("pointerdown", this.restartFromGameOver, this);
      this.addGameOverContainerListeners();
      const gameOverSound = this.sound.add(ASSET_KEYS.PLAYER_GAMEOVER);
      gameOverSound.play();
    }

    /** コンテナに touchstart/pointerdown を登録（iOS Safari でレターボックスタップでも再開できるようにする） */
    private addGameOverContainerListeners() {
      const container = getGameContainer(this);
      if (!container) return;
      const handler = () => this.restartFromGameOver();
      container.addEventListener("touchstart", handler, { passive: true });
      container.addEventListener("pointerdown", handler);
      this.gameOverContainer = container;
      this.gameOverContainerHandler = handler;
    }

    private restartFromGameOver() {
      if (this.gameOverRestartFired) return;
      this.gameOverRestartFired = true;
      const duration = GAME_CONSTANTS.CAMERA.FADE_DURATION_MS;
      const cam = this.cameras.main;
      cam.fadeOut(duration, 0, 0, 0);
      cam.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => {
        this.destroyGameOverUI();
        this.scene.restart({ returnToTitleFromGameOver: true });
      });
    }

    /** GAME OVER 表示用のオーバーレイ・テキストとコンテナリスナーを破棄する */
    private destroyGameOverUI() {
      removeResumeListeners(this.gameOverContainer, this.gameOverContainerHandler);
      this.gameOverContainer = null;
      this.gameOverContainerHandler = null;
      this.gameOverOverlay?.destroy();
      this.gameOverOverlay = null;
      this.gameOverText?.destroy();
      this.gameOverText = null;
      this.gameOverContinueText?.destroy();
      this.gameOverContinueText = null;
    }

    /** 敵を初期位置・向きに戻す（ミス復帰・restart で共通利用） */
    private resetEnemiesToStartPositions() {
      for (let i = 0; i < this.enemies.length; i++) {
        const enemy = this.enemies[i];
        const start = this.enemyStartPositions[i];
        if (!start) continue;
        enemy.setPosition(start.x, start.y);
        enemy.moveDirection = start.moveDirection;
        enemy.setFlipX(start.moveDirection > 0);
        const enemyBody = enemy.body as Phaser.Physics.Arcade.Body;
        enemyBody.setVelocity(0, 0);
      }
      resetPodoboosToIdle(this.podobooFlames);
    }

    private setupLivesUI() {
      const { x, y } = UI_LIVES_POSITION;
      const livesIconY = y + UI_ICON_OFFSET_Y;
      this.livesIcon = this.add.image(x, livesIconY, ASSET_KEYS.LIVES_ICON, 0);
      this.livesIcon.setOrigin(0, 0);
      this.livesIcon.setDisplaySize(UI_LIVES_ICON_SIZE, UI_LIVES_ICON_SIZE);
      this.livesIcon.setScrollFactor(0);

      const textX = x + UI_LIVES_ICON_SIZE + 4;
      this.livesText = this.add.text(textX, y, String(this.livesCount), {
        ...UI_NUMBER_TEXT_STYLE,
      });
      this.livesText.setStyle({ stroke: "#000000", strokeThickness: 2 });
      this.livesText.setOrigin(0, 0);
      this.livesText.setScrollFactor(0);

      const coinsY = y + UI_LIVES_ICON_SIZE + UI_COINS_OFFSET_Y;
      const coinsIconY = coinsY + UI_ICON_OFFSET_Y;
      this.coinsIcon = this.add.image(x, coinsIconY, ASSET_KEYS.COINS_UI);
      this.coinsIcon.setOrigin(0, 0);
      this.coinsIcon.setDisplaySize(UI_LIVES_ICON_SIZE, UI_LIVES_ICON_SIZE);
      this.coinsIcon.setScrollFactor(0);

      this.coinsText = this.add.text(
        textX,
        coinsY,
        String(this.coinCount).padStart(2, "0"),
        { ...UI_NUMBER_TEXT_STYLE },
      );
      this.coinsText.setStyle({ stroke: "#000000", strokeThickness: 2 });
      this.coinsText.setOrigin(0, 0);
      this.coinsText.setScrollFactor(0);
    }

    update() {
      this.syncStage3BackgroundPosition();
      this.updateLavaFloorScroll();
      if (this.shouldUpdateGameClearScreen()) {
        this.gameClearScreenRef?.update();
        return;
      }
      if (!this.gameStarted) return;
      // GAME OVER 中もノコギリの見た目回転は続ける（早期 return の前で実行）
      this.updateSawRotation();
      if (this.isGameOver) return;
      if (this.goalReached && !this.isGameClear) return;
      if (!this.player?.body) return;

      const playerBody = this.player.body as Phaser.Physics.Arcade.Body;
      const cameraBottom = this.cameras.main.scrollY + this.cameras.main.height;

      this.updatePodobooFlamesIfActive();

      if (this.isInFallDeathTransition) {
        this.updateMovingPlatforms();
        if (this.isWaitingForFallDeathOffScreen) {
          updateEnemiesAI(this, this.enemies, this.platformLayer);
          if (playerBody.bottom > cameraBottom) {
            this.startFallDeathFade();
          }
          return;
        }
        return;
      }

      if (this.isPlayingMissSequence) {
        this.updateMovingPlatforms();
        updateEnemiesAI(this, this.enemies, this.platformLayer);
        if (playerBody.bottom > cameraBottom) {
          this.finishMissSequence();
        }
        return;
      }

      const deltaTime = this.game.loop.delta / 1000;

      if (playerBody.bottom > this.deathY) {
        this.handleFallDeath();
        return;
      }

      this.handleJump(playerBody);
      this.handleMovement(playerBody, deltaTime);
      this.updateMovingPlatforms();
      this.syncPlayerToMovingPlatform();
      if (
        this.playerOnBouncepad &&
        (!this.isGameObjectGroupUsable(this.bouncepads) ||
          !this.physics.overlap(this.player, this.playerOnBouncepad))
      ) {
        this.playerOnBouncepad = null;
      }
      updateEnemiesAI(this, this.enemies, this.platformLayer);
      this.updateInvincibilityBlink();
      this.checkStage3LavaOverlap();
    }

    /** 3rd ステージ：ノコギリの見た目を回転させる。 */
    private updateSawRotation() {
      if (this.getEffectiveStageNumber() !== 3 || !this.circularSaws) return;
      for (const saw of this.circularSaws.getChildren()) {
        (saw as Phaser.GameObjects.Sprite).angle += SAW_ROTATION_SPEED;
      }
    }

    private updatePodobooFlamesIfActive() {
      if (this.getEffectiveStageNumber() !== 3 || !this.podobooFlames) return;
      updatePodobooFlames(this.podobooFlames);
    }

    private updateInvincibilityBlink() {
      if (this.time.now < this.invincibleUntil) {
        const interval = GAME_CONSTANTS.PLAYER.INVINCIBLE_BLINK_INTERVAL_MS;
        const phase = Math.floor(this.time.now / interval) % 2;
        this.player.setAlpha(
          phase === 0 ? 1 : GAME_CONSTANTS.PLAYER.INVINCIBLE_BLINK_ALPHA,
        );
      } else {
        this.player.setAlpha(1);
      }
    }

    private handleJump(playerBody: Phaser.Physics.Arcade.Body) {
      const onFloor = playerBody.touching.down || playerBody.blocked.down;
      const jumpInput = this.cursors.up.isDown || globalControls.up;
      const jumpJustPressed = jumpInput && !this.wasJumpPressed && onFloor;

      if (onFloor) {
        if (!this.isPlayerStandingOnBouncepad()) {
          this.jumpedFromTrampoline = false;
          this.jumpedFromTrampolineSuper = false;
        }
        this.lastJumpPressedWhileInAir = 0;
      } else {
        if (playerBody.velocity.y >= 0) {
          this.jumpedFromTrampoline = false;
          this.jumpedFromTrampolineSuper = false;
        }
        if (jumpInput && !this.wasJumpPressed) {
          this.lastJumpPressedWhileInAir = this.time.now;
        }
      }

      if (jumpJustPressed) {
        if (!this.isPlayerStandingOnBouncepad()) {
          playerBody.setVelocityY(GAME_CONSTANTS.MOVEMENT.JUMP_VELOCITY);
          this.player.play("jump", true);
          this.sound.play(ASSET_KEYS.PLAYER_JUMP);
        }
      }

      if (
        !this.jumpedFromTrampoline &&
        !this.jumpedFromTrampolineSuper &&
        !jumpInput &&
        this.wasJumpPressed &&
        playerBody.velocity.y < 0 &&
        !onFloor
      ) {
        playerBody.setVelocityY(
          playerBody.velocity.y * GAME_CONSTANTS.MOVEMENT.JUMP_CANCEL_FACTOR,
        );
      }

      this.wasJumpPressed = jumpInput;
    }

    private handleMovement(
      playerBody: Phaser.Physics.Arcade.Body,
      deltaTime: number,
    ) {
      const onFloor = playerBody.touching.down || playerBody.blocked.down;
      const leftInput = this.cursors.left.isDown || globalControls.left;
      const rightInput = this.cursors.right.isDown || globalControls.right;
      const currentVelocityX = playerBody.velocity.x;

      if (leftInput) {
        this.handleLeftMovement(
          playerBody,
          onFloor,
          currentVelocityX,
          deltaTime,
        );
      } else if (rightInput) {
        this.handleRightMovement(
          playerBody,
          onFloor,
          currentVelocityX,
          deltaTime,
        );
      } else {
        this.handleNoInput(playerBody, onFloor, currentVelocityX, deltaTime);
      }
    }

    private handleLeftMovement(
      playerBody: Phaser.Physics.Arcade.Body,
      onFloor: boolean,
      currentVelocityX: number,
      deltaTime: number,
    ) {
      const controlFactor = onFloor ? 1.0 : this.airControl;
      const targetVelocity = -this.maxSpeed * controlFactor;

      if (currentVelocityX > targetVelocity) {
        const accel = onFloor
          ? this.acceleration
          : this.acceleration * this.airControl;
        const newVelocity = Math.max(
          currentVelocityX - accel * deltaTime,
          targetVelocity,
        );
        playerBody.setVelocityX(newVelocity);
      }

      this.player.setFlipX(true);
      this.updatePlayerAnimation(playerBody, onFloor);
    }

    private handleRightMovement(
      playerBody: Phaser.Physics.Arcade.Body,
      onFloor: boolean,
      currentVelocityX: number,
      deltaTime: number,
    ) {
      const controlFactor = onFloor ? 1.0 : this.airControl;
      const targetVelocity = this.maxSpeed * controlFactor;

      if (currentVelocityX < targetVelocity) {
        const accel = onFloor
          ? this.acceleration
          : this.acceleration * this.airControl;
        const newVelocity = Math.min(
          currentVelocityX + accel * deltaTime,
          targetVelocity,
        );
        playerBody.setVelocityX(newVelocity);
      }

      this.player.setFlipX(false);
      this.updatePlayerAnimation(playerBody, onFloor);
    }

    private handleNoInput(
      playerBody: Phaser.Physics.Arcade.Body,
      onFloor: boolean,
      currentVelocityX: number,
      deltaTime: number,
    ) {
      if (onFloor) {
        if (
          Math.abs(currentVelocityX) >
          GAME_CONSTANTS.MOVEMENT.MIN_VELOCITY_THRESHOLD
        ) {
          const decel = this.deceleration * deltaTime;
          if (currentVelocityX > 0) {
            playerBody.setVelocityX(Math.max(0, currentVelocityX - decel));
          } else {
            playerBody.setVelocityX(Math.min(0, currentVelocityX + decel));
          }
          this.player.play("walk", true);
        } else {
          playerBody.setVelocityX(0);
          this.player.play("idle", true);
        }
      } else {
        this.updatePlayerAnimation(playerBody, onFloor);
      }
    }

    private updatePlayerAnimation(
      playerBody: Phaser.Physics.Arcade.Body,
      onFloor: boolean,
    ) {
      if (onFloor) {
        this.player.play("walk", true);
      } else if (playerBody.velocity.y < 0) {
        this.player.play("jump", true);
      } else {
        this.player.play("fall", true);
      }
    }
  }

  return GameScene;
}
