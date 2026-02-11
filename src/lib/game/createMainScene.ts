/// <reference types="phaser" />
import { createGameAnimations } from "@/lib/game/animations";
import {
  ASSET_KEYS,
  BIRD_1_FRAME_SIZE,
  BIRD_1_OBJECT_NAME,
  COIN_OBJECT_NAME,
  COIN_SIZE,
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
  OBJECT_LAYER_NAME,
  PLAYER_GAME_COMPLETE_ASSET,
  PLAYER_MISS_ASSET,
  SCENE_BACKGROUND_COLOR,
  UI_COINS_OFFSET_Y,
  UI_FONT_FAMILY,
  UI_ICON_OFFSET_Y,
  UI_LIVES_ICON_SIZE,
  UI_LIVES_POSITION,
  UI_NUMBER_TEXT_STYLE,
} from "@/lib/game/constants";
import { updateEnemies as updateEnemiesAI } from "@/lib/game/enemyAI";
import { createGameClearScreen } from "@/lib/game/gameClearUI";
import { createGameOverUI } from "@/lib/game/gameOverUI";
import { globalControls } from "@/lib/game/globalControls";
import { loadGameAssets } from "@/lib/game/loadGameAssets";
import { createTitleScreen } from "@/lib/game/titleScreenUI";
import {
  ARCADE_DEBUG,
  BGM_OFF,
  CREATE_A_SINGLE_IMAGE,
  DEBUG,
  PLAYER_START_POSITION,
  SKIP_TITLE_SCREEN,
  STAGE_NUMBER,
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
    private coinCount = 0;
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
    private goalFlagSprite: Phaser.GameObjects.Sprite | null = null;
    private goalReached = false;
    private goalText: Phaser.GameObjects.Text | null = null;
    private isGameClear = false;
    /** 本番・CREATE_A_SINGLE_IMAGE 共通のゲームクリア画面（update/destroy 用） */
    private gameClearScreenRef: GameClearScreen | null = null;
    private background: Phaser.GameObjects.TileSprite | null = null;
    private coins!: Phaser.GameObjects.Group;
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
      loadGameAssets(this);
    }

    create() {
      if (CREATE_A_SINGLE_IMAGE && DEBUG) {
        this.createSingleImageMode();
        return;
      }
      this.resetSceneStateForRestart();
      const drawDebug = DEBUG && ARCADE_DEBUG;
      (this.physics.world as Phaser.Physics.Arcade.World).drawDebug = drawDebug;
      this.cameras.main.setBackgroundColor(SCENE_BACKGROUND_COLOR);
      this.setupTilemap();
      if (this.shouldUseImageBackground()) {
        this.setupBackground();
      } else if (this.getEffectiveStageNumber() === 2) {
        this.setupBackground2nd();
      }
      this.setupPlayer();
      this.setupCamera();
      this.setupPlayerCollision();
      createGameAnimations(this);
      this.setupGoalFlag();
      this.setupCoins();
      this.setupPlayerCoinOverlap();
      this.setupPlayerGoalOverlap();
      this.setupEnemies();
      this.setupPlayerEnemyOverlap();
      this.setupInput();
      this.setupLivesUI();
      if (DEBUG && SKIP_TITLE_SCREEN) {
        this.gameStarted = true;
        this.startGameBGM();
      } else {
        this.setupTitleScreen();
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

    /** シーン再開時（GAME CLEAR→タイトルから戻った後）にゲームロジック・物理・残機・コインをリセット */
    private resetSceneStateForRestart() {
      this.goalReached = false;
      this.isGameClear = false;
      this.gameClearScreenRef = null;
      this.gameClearBGM = null;
      this.physics.resume();
      this.livesCount = LIVES_INITIAL;
      this.coinCount = 0;
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
      this.cameras.main.fadeIn(fadeDurationMs, 0, 0, 0);
      this.cameras.main.once(
        Phaser.Cameras.Scene2D.Events.FADE_IN_COMPLETE,
        () => {
          this.gameStarted = true;
          this.startGameBGM();
        },
      );
    }

    /** 有効なステージ番号（DEBUG 時のみ STAGE_NUMBER、そうでないときは 1） */
    private getEffectiveStageNumber(): 1 | 2 {
      return DEBUG && STAGE_NUMBER === 2 ? 2 : 1;
    }

    /** 背景を画像（Forest_Background_0.png）で表示するか。1st のみ画像、2nd は Sky 背景。 */
    private shouldUseImageBackground(): boolean {
      if (this.getEffectiveStageNumber() === 2) return false;
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

      this.platformLayer.setCollisionByProperty({ collides: true });
      this.platformLayer.forEachTile((tile) => {
        if (tile.properties?.oneWay) {
          tile.setCollision(false, false, true, false);
          tile.collideDown = false;
          tile.collideLeft = false;
          tile.collideRight = false;
        }
      });
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

    /** オブジェクトレイヤーから名前が一致する最初のオブジェクトを返す */
    private findMapObject(
      ...names: string[]
    ): Phaser.Types.Tilemaps.TiledObject | undefined {
      const layer = this.map.getObjectLayer(OBJECT_LAYER_NAME);
      if (!layer) return undefined;
      return layer.objects.find((obj) => names.includes(obj.name ?? ""));
    }

    /** Tiled オブジェクトのカスタムプロパティ（数値）を取得する */
    private getTiledPropertyNumber(
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

    /** DEBUG 時は phaserConfig.PLAYER_START_POSITION（2nd ステージでは常に "Player"）、そうでなければ "Player" */
    private getPlayerStartObjectName(): string {
      if (!DEBUG) return "Player";
      if (this.getEffectiveStageNumber() === 2) return "Player";
      return PLAYER_START_POSITION;
    }

    private setupGoalFlag() {
      const goalObj = this.findMapObject(...GOAL_FLAG_OBJECT_NAMES);
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

    private setupCoins() {
      // 既存の Group がこのシーンに属し有効なときだけ中身を破棄して再利用する（破棄済み Group で clear すると children 未定義で落ちる）
      let canReuse = false;
      try {
        canReuse =
          !!this.coins &&
          this.coins.scene === this &&
          typeof this.coins.getChildren === "function" &&
          Array.isArray(this.coins.getChildren());
      } catch {
        canReuse = false;
      }
      if (canReuse) {
        this.coins.clear(true, true);
      } else {
        this.coins = this.add.group();
      }
      const objectLayer = this.map.getObjectLayer(OBJECT_LAYER_NAME);
      if (!objectLayer) return;
      const coinObjects = objectLayer.objects.filter(
        (obj) => obj.name === COIN_OBJECT_NAME,
      );
      for (const obj of coinObjects) {
        if (obj.x === undefined || obj.y === undefined) continue;
        const coin = this.add.image(obj.x, obj.y - COIN_SIZE, ASSET_KEYS.COIN);
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
        this.coinCount++;
        this.updateCoinsText();
        this.sound.play(ASSET_KEYS.PLAYER_COIN);
      });
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
      this.time.delayedCall(transitionAtMs, () => {
        goalSound.stop();
        this.startTransitionToGameClear();
      });
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

    /** GOAL!! 表示の 1.5 秒後にフェードアウトし、完了後にゲームクリア画面を表示してフェードイン */
    private startTransitionToGameClear() {
      this.stopGameBGM();
      const cam = this.cameras.main;
      cam.once("camerafadeoutcomplete", () => {
        this.showGameClearScreen();
        cam.fadeIn(GAME_CLEAR_FADE_DURATION_MS);
      });
      cam.fadeOut(GAME_CLEAR_FADE_DURATION_MS);
    }

    private showGameClearScreen() {
      this.isGameClear = true;
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
        onTouchToTitle: () => {
          this.stopGameClearBGM();
          this.scene.restart();
        },
      });
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

    private setupPlayerCollision() {
      this.physics.add.collider(
        this.player,
        this.platformLayer,
        undefined,
        (playerObj, tileObj) => {
          const player = playerObj as Phaser.Physics.Arcade.Sprite;
          const tile = tileObj as Phaser.Tilemaps.Tile;
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
        },
      );
    }

    private setupEnemies() {
      this.enemies = [];
      this.enemyStartPositions = [];
      const objectLayer = this.map.getObjectLayer(OBJECT_LAYER_NAME);
      if (!objectLayer) return;

      const enemyObjects = objectLayer.objects.filter((obj) =>
        ENEMY_OBJECT_NAMES.includes(obj.name as (typeof ENEMY_OBJECT_NAMES)[number]),
      );
      const initialDirection = GAME_CONSTANTS.ENEMY.INITIAL_DIRECTION;

      for (const enemyObj of enemyObjects) {
        if (enemyObj.x === undefined || enemyObj.y === undefined) continue;
        const startX = enemyObj.x;
        const startY = enemyObj.y;
        const isBird = enemyObj.name === BIRD_1_OBJECT_NAME;

        const enemy = this.physics.add.sprite(
          startX,
          startY,
          isBird ? ASSET_KEYS.BIRD_1 : ASSET_KEYS.SPIDER,
          isBird ? 0 : 0,
        ) as EnemySprite;

        if (isBird) {
          const range = this.getTiledPropertyNumber(enemyObj, "range") ?? 100;
          enemy.startX = startX;
          enemy.range = range;
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
        }

        enemy.moveDirection = initialDirection;
        enemy.setFlipX(false);

        this.physics.add.collider(enemy, this.platformLayer, () => {
          const body = enemy.body as Phaser.Physics.Arcade.Body;
          if (body.blocked.left || body.blocked.right) {
            enemy.moveDirection *= -1;
            enemy.setFlipX(enemy.moveDirection > 0);
          }
        });

        this.enemies.push(enemy);
        this.enemyStartPositions.push({
          x: startX,
          y: startY,
          moveDirection: initialDirection,
        });
      }
    }

    private setupInput() {
      if (this.input.keyboard) {
        this.cursors = this.input.keyboard.createCursorKeys();
      }
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
      this.player.setVisible(false);
      this.physics.pause();
      this.stopGameBGM();

      const ui = createGameOverUI(this);
      this.gameOverOverlay = ui.overlay;
      this.gameOverText = ui.gameOverText;
      this.gameOverContinueText = ui.continueText;

      const gameOverSound = this.sound.add(ASSET_KEYS.PLAYER_GAMEOVER);
      gameOverSound.once("complete", () => {
        this.input.once("pointerdown", this.restartFromGameOver, this);
      });
      gameOverSound.play();
    }

    private restartFromGameOver() {
      this.destroyGameOverUI();
      this.restart();
    }

    /** GAME OVER 表示用のオーバーレイ・テキストを破棄する */
    private destroyGameOverUI() {
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
    }

    /** 残機・プレイヤーと敵の位置を初期状態に戻してゲームを再開する */
    private restart() {
      this.isGameOver = false;
      this.isPlayingMissSequence = false;
      this.missSequenceOnComplete = null;
      this.isInFallDeathTransition = false;
      this.isWaitingForFallDeathOffScreen = false;
      this.wasMissWithZeroLives = false;

      this.livesCount = LIVES_INITIAL;
      this.updateLivesText();

      this.coinCount = 0;
      this.updateCoinsText();
      this.setupCoins();

      this.restorePlayerAppearance();
      this.player.setVisible(true);
      this.player.setPosition(this.playerStartX, this.playerStartY);
      const playerBody = this.player.body as Phaser.Physics.Arcade.Body;
      playerBody.setVelocity(0, 0);
      playerBody.checkCollision.none = false;

      this.resetEnemiesToStartPositions();
      this.physics.resume();
      this.startCameraFollow();
      this.invincibleUntil = 0;
      this.startGameBGM();
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
      if (this.shouldUpdateGameClearScreen()) {
        this.gameClearScreenRef?.update();
        return;
      }
      if (!this.gameStarted) return;
      if (this.isGameOver) return;
      if (this.goalReached && !this.isGameClear) return;
      if (!this.player?.body) return;

      const playerBody = this.player.body as Phaser.Physics.Arcade.Body;
      const cameraBottom = this.cameras.main.scrollY + this.cameras.main.height;

      if (this.isInFallDeathTransition) {
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
      updateEnemiesAI(this, this.enemies, this.platformLayer);
      this.updateInvincibilityBlink();
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

      if (jumpJustPressed) {
        playerBody.setVelocityY(GAME_CONSTANTS.MOVEMENT.JUMP_VELOCITY);
        this.player.play("jump", true);
        this.sound.play(ASSET_KEYS.PLAYER_JUMP);
      }

      if (
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
