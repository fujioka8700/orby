/// <reference types="phaser" />
import { createGameAnimations } from "@/lib/game/animations";
import {
  ASSET_KEYS,
  COIN_OBJECT_NAME,
  COIN_SIZE,
  ENEMY_OBJECT_NAME,
  GAME_CONSTANTS,
  GOAL_FLAG_OBJECT_NAMES,
  GOAL_FLAG_SIZE,
  LIVES_INITIAL,
  OBJECT_LAYER_NAME,
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
import { createGameOverUI } from "@/lib/game/gameOverUI";
import { globalControls } from "@/lib/game/globalControls";
import { loadGameAssets } from "@/lib/game/loadGameAssets";
import { createTitleScreen } from "@/lib/game/titleScreenUI";
import {
  ARCADE_DEBUG,
  DEBUG,
  PLAYER_START_POSITION,
  SKIP_TITLE_SCREEN,
  USE_IMAGE_BACKGROUND,
} from "@/lib/game/phaserConfig";
import type { EnemySprite } from "@/lib/game/types";
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
    private background: Phaser.GameObjects.TileSprite | null = null;
    private coins!: Phaser.GameObjects.Group;
    private readonly maxSpeed = GAME_CONSTANTS.MOVEMENT.MAX_SPEED;
    private readonly acceleration = GAME_CONSTANTS.MOVEMENT.ACCELERATION;
    private readonly deceleration = GAME_CONSTANTS.MOVEMENT.DECELERATION;
    private readonly airControl = GAME_CONSTANTS.MOVEMENT.AIR_CONTROL;
    /** タイトル画面をタッチしてゲーム開始したか */
    private gameStarted = false;
    private titleScreenRef: TitleScreenUI | null = null;

    constructor() {
      super({ key: "GameScene" });
    }

    preload() {
      loadGameAssets(this);
    }

    create() {
      const drawDebug = DEBUG && ARCADE_DEBUG;
      (this.physics.world as Phaser.Physics.Arcade.World).drawDebug = drawDebug;
      this.cameras.main.setBackgroundColor(SCENE_BACKGROUND_COLOR);
      this.setupTilemap();
      if (this.shouldUseImageBackground()) {
        this.setupBackground();
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
      } else {
        this.setupTitleScreen();
      }
    }

    /** タイトル画面を表示し、タッチで startTitleFadeOut を呼ぶ */
    private setupTitleScreen() {
      this.titleScreenRef = createTitleScreen(this);
      this.input.once("pointerdown", this.startTitleFadeOut, this);
    }

    /** タイトルでタッチ時: フェードアウト → タイトル削除 → フェードイン → ゲーム開始 */
    private startTitleFadeOut() {
      const duration = GAME_CONSTANTS.CAMERA.FADE_DURATION_MS;
      this.cameras.main.fadeOut(duration, 0, 0, 0);
      this.cameras.main.once(
        Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE,
        () => {
          this.titleScreenRef?.destroy();
          this.titleScreenRef = null;
          this.cameras.main.fadeIn(duration, 0, 0, 0);
          this.cameras.main.once(
            Phaser.Cameras.Scene2D.Events.FADE_IN_COMPLETE,
            () => {
              this.gameStarted = true;
            },
          );
        },
      );
    }

    /** 背景を画像で表示するか（DEBUG=false のときは常に true） */
    private shouldUseImageBackground(): boolean {
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

    private collectTilesets(): Phaser.Tilemaps.Tileset[] {
      const tilesets: Phaser.Tilemaps.Tileset[] = [];
      const grass = this.map.addTilesetImage(
        "Grass_Tileset",
        ASSET_KEYS.TILESET_GRASS,
      );
      const platform = this.map.addTilesetImage(
        "Platform",
        ASSET_KEYS.TILESET_PLATFORM,
      );
      const grassOneway = this.map.addTilesetImage(
        "Grass_Oneway",
        ASSET_KEYS.TILESET_GRASS_ONEWAY,
      );
      const leaf = this.map.addTilesetImage(
        "Leaf_Tileset",
        ASSET_KEYS.TILESET_LEAF,
      );
      if (grass) tilesets.push(grass);
      if (platform) tilesets.push(platform);
      if (grassOneway) tilesets.push(grassOneway);
      if (leaf) tilesets.push(leaf);
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

    /** DEBUG 時は phaserConfig.PLAYER_START_POSITION、そうでなければ "Player" */
    private getPlayerStartObjectName(): string {
      return DEBUG ? PLAYER_START_POSITION : "Player";
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
      if (this.coins) {
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
      this.showGoalText();
    }

    /** 画面上に "GOAL!!" をバウンスするアニメーションで表示（CodePen 風） */
    private showGoalText() {
      const cam = this.cameras.main;
      this.goalText = this.add.text(cam.width / 2, cam.height / 2, "GOAL!!", {
        fontFamily: UI_FONT_FAMILY,
        fontSize: "48px",
        color: "#ffeb3b",
      });
      this.goalText.setOrigin(0.5, 0.5);
      this.goalText.setScrollFactor(0);
      this.goalText.setAlpha(0);
      this.goalText.setScale(0);

      this.tweens.add({
        targets: this.goalText,
        alpha: 1,
        scale: 1.2,
        duration: 300,
        ease: "Back.easeOut",
        onComplete: () => {
          if (!this.goalText) return;
          this.tweens.add({
            targets: this.goalText,
            scale: 1,
            duration: 200,
            ease: "Bounce.easeOut",
          });
        },
      });
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

      const spiderObjects = objectLayer.objects.filter(
        (obj) => obj.name === ENEMY_OBJECT_NAME,
      );
      const initialDirection = GAME_CONSTANTS.ENEMY.INITIAL_DIRECTION;

      for (const enemyObj of spiderObjects) {
        if (enemyObj.x !== undefined && enemyObj.y !== undefined) {
          const startX = enemyObj.x;
          const startY = enemyObj.y;
          const enemy = this.physics.add.sprite(
            startX,
            startY,
            ASSET_KEYS.SPIDER,
            0,
          ) as EnemySprite;

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

          enemy.moveDirection = initialDirection;
          enemy.setFlipX(false);
          enemy.play("spider-walk", true);

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
            onFadeInComplete,
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

      // ミス演出＋ぴょんと一回上に飛ばしてから落下
      this.player.anims.stop();
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

      const ui = createGameOverUI(this);
      this.gameOverOverlay = ui.overlay;
      this.gameOverText = ui.gameOverText;
      this.gameOverContinueText = ui.continueText;
      this.input.once("pointerdown", this.restartFromGameOver, this);
    }

    private restartFromGameOver() {
      if (this.gameOverOverlay) {
        this.gameOverOverlay.destroy();
        this.gameOverOverlay = null;
      }
      if (this.gameOverText) {
        this.gameOverText.destroy();
        this.gameOverText = null;
      }
      if (this.gameOverContinueText) {
        this.gameOverContinueText.destroy();
        this.gameOverContinueText = null;
      }
      this.restart();
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
    }

    private setupLivesUI() {
      const { x, y } = UI_LIVES_POSITION;
      const livesIconY = y + UI_ICON_OFFSET_Y;
      this.livesIcon = this.add.image(
        x,
        livesIconY,
        ASSET_KEYS.LIVES_ICON,
        0,
      );
      this.livesIcon.setOrigin(0, 0);
      this.livesIcon.setDisplaySize(UI_LIVES_ICON_SIZE, UI_LIVES_ICON_SIZE);
      this.livesIcon.setScrollFactor(0);

      const textX = x + UI_LIVES_ICON_SIZE + 4;
      this.livesText = this.add.text(
        textX,
        y,
        String(this.livesCount),
        { ...UI_NUMBER_TEXT_STYLE },
      );
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
      if (!this.gameStarted) return;
      if (this.isGameOver) return;
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

      if (
        playerBody.bottom > this.deathY &&
        this.time.now >= this.invincibleUntil
      ) {
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
