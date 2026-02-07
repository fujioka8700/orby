/// <reference types="phaser" />
import { createGameAnimations } from "@/lib/game/animations";
import {
  GAME_CONSTANTS,
  LIVES_ICON_ASSET,
  LIVES_INITIAL,
  PLAYER_ASSET,
  PLAYER_MISS_ASSET,
  SPIDER_ASSET,
  TILEMAP_ASSETS,
  UI_FONT_FAMILY,
  UI_LIVES_ICON_SIZE,
  UI_LIVES_POSITION,
} from "@/lib/game/constants";
import { createGameOverUI } from "@/lib/game/gameOverUI";
import { updateEnemies as updateEnemiesAI } from "@/lib/game/enemyAI";
import { globalControls } from "@/lib/game/globalControls";
import {
  ARCADE_DEBUG,
  DEBUG,
  PLAYER_START_POSITION,
} from "@/lib/game/phaserConfig";
import type { EnemySprite } from "@/lib/game/types";

/** Phaser を動的 import した後に渡し、メインシーンクラスを取得する */
export function createMainScene(PhaserLib: typeof Phaser) {
  class GameScene extends PhaserLib.Scene {
    private player!: Phaser.Physics.Arcade.Sprite;
    private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
    private map!: Phaser.Tilemaps.Tilemap;
    private platformLayer!: Phaser.Tilemaps.TilemapLayer;
    private enemies: EnemySprite[] = [];
    /** 敵の初期位置・向き（restart 用） */
    private enemyStartPositions: { x: number; y: number; moveDirection: number }[] =
      [];
    private wasJumpPressed = false;
    private livesCount = LIVES_INITIAL;
    private livesIcon: Phaser.GameObjects.Image | null = null;
    private livesText: Phaser.GameObjects.Text | null = null;
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
    private readonly maxSpeed = GAME_CONSTANTS.MOVEMENT.MAX_SPEED;
    private readonly acceleration = GAME_CONSTANTS.MOVEMENT.ACCELERATION;
    private readonly deceleration = GAME_CONSTANTS.MOVEMENT.DECELERATION;
    private readonly airControl = GAME_CONSTANTS.MOVEMENT.AIR_CONTROL;

    constructor() {
      super({ key: "GameScene" });
    }

    preload() {
      this.load.image("tilesetGrass", TILEMAP_ASSETS.tilesetGrass);
      this.load.image("tilesetPlatform", TILEMAP_ASSETS.tilesetPlatform);
      this.load.image("tilesetGrassOneway", TILEMAP_ASSETS.tilesetGrassOneway);
      this.load.image("tilesetLeaf", TILEMAP_ASSETS.tilesetLeaf);
      this.load.tilemapTiledJSON("tilemap", TILEMAP_ASSETS.tilemap);
      this.load.spritesheet("player", PLAYER_ASSET, {
        frameWidth: GAME_CONSTANTS.PLAYER.FRAME_WIDTH,
        frameHeight: GAME_CONSTANTS.PLAYER.FRAME_HEIGHT,
      });
      this.load.spritesheet("spider", SPIDER_ASSET, {
        frameWidth: GAME_CONSTANTS.ENEMY.DISPLAY_WIDTH,
        frameHeight: GAME_CONSTANTS.ENEMY.DISPLAY_HEIGHT,
      });
      this.load.image("livesIcon", LIVES_ICON_ASSET);
      this.load.image("player_miss", PLAYER_MISS_ASSET);
    }

    create() {
      const drawDebug = DEBUG && ARCADE_DEBUG;
      (this.physics.world as Phaser.Physics.Arcade.World).drawDebug = drawDebug;
      this.cameras.main.setBackgroundColor("#2c3e50");
      this.setupTilemap();
      this.setupPlayer();
      this.setupCamera();
      this.setupPlayerCollision();
      createGameAnimations(this);
      this.setupEnemies();
      this.setupPlayerEnemyOverlap();
      this.setupInput();
      this.setupLivesUI();
    }

    private setupTilemap() {
      this.map = this.make.tilemap({ key: "tilemap" });
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

    private collectTilesets(): Phaser.Tilemaps.Tileset[] {
      const tilesets: Phaser.Tilemaps.Tileset[] = [];
      const grass = this.map.addTilesetImage("Grass_Tileset", "tilesetGrass");
      const platform = this.map.addTilesetImage("Platform", "tilesetPlatform");
      const grassOneway = this.map.addTilesetImage(
        "Grass_Oneway",
        "tilesetGrassOneway"
      );
      const leaf = this.map.addTilesetImage("Leaf_Tileset", "tilesetLeaf");
      if (grass) tilesets.push(grass);
      if (platform) tilesets.push(platform);
      if (grassOneway) tilesets.push(grassOneway);
      if (leaf) tilesets.push(leaf);
      return tilesets;
    }

    /** DEBUG 時は phaserConfig.PLAYER_START_POSITION、そうでなければ "Player" */
    private getPlayerStartObjectName(): string {
      return DEBUG ? PLAYER_START_POSITION : "Player";
    }

    private setupPlayer() {
      const objectLayer = this.map.getObjectLayer("objectsLayer");
      this.playerStartX = GAME_CONSTANTS.PLAYER.DEFAULT_START_X;
      this.playerStartY = GAME_CONSTANTS.PLAYER.DEFAULT_START_Y;

      if (objectLayer) {
        const objectName = this.getPlayerStartObjectName();
        const playerObj = objectLayer.objects.find(
          (obj) =>
            obj.name === objectName ||
            (objectName === "Player" && obj.name === "player")
        );
        if (
          playerObj &&
          playerObj.x !== undefined &&
          playerObj.y !== undefined
        ) {
          this.playerStartX = playerObj.x;
          this.playerStartY = playerObj.y;
        }
      }

      this.player = this.physics.add.sprite(
        this.playerStartX,
        this.playerStartY,
        "player",
        0
      );

      const playerBody = this.player.body as Phaser.Physics.Arcade.Body;
      this.applyPlayerBodySize(
        playerBody,
        GAME_CONSTANTS.PLAYER.ACTUAL_WIDTH,
        GAME_CONSTANTS.PLAYER.ACTUAL_HEIGHT
      );
      playerBody.setCollideWorldBounds(true);
    }

    private applyPlayerBodySize(
      body: Phaser.Physics.Arcade.Body,
      width: number,
      height: number
    ) {
      body.setSize(width, height);
      body.setOffset(
        (GAME_CONSTANTS.PLAYER.FRAME_WIDTH - width) / 2,
        (GAME_CONSTANTS.PLAYER.FRAME_HEIGHT - height) / 2
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
        GAME_CONSTANTS.CAMERA.FOLLOW_LERP_Y
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
        }
      );
    }

    private setupEnemies() {
      this.enemies = [];
      this.enemyStartPositions = [];
      const objectLayer = this.map.getObjectLayer("objectsLayer");
      if (!objectLayer) return;

      const spiderObjects = objectLayer.objects.filter(
        (obj) => obj.name === "Spider_1"
      );
      const initialDirection = GAME_CONSTANTS.ENEMY.INITIAL_DIRECTION;

      for (const enemyObj of spiderObjects) {
        if (enemyObj.x !== undefined && enemyObj.y !== undefined) {
          const startX = enemyObj.x;
          const startY = enemyObj.y;
          const enemy = this.physics.add.sprite(
            startX,
            startY,
            "spider",
            0
          ) as EnemySprite;

          enemy.setDisplaySize(
            GAME_CONSTANTS.ENEMY.DISPLAY_WIDTH,
            GAME_CONSTANTS.ENEMY.DISPLAY_HEIGHT
          );

          const enemyBody = enemy.body as Phaser.Physics.Arcade.Body;
          enemyBody.setSize(
            GAME_CONSTANTS.ENEMY.BODY_WIDTH,
            GAME_CONSTANTS.ENEMY.BODY_HEIGHT
          );
          enemyBody.setOffset(
            GAME_CONSTANTS.ENEMY.OFFSET_X,
            GAME_CONSTANTS.ENEMY.OFFSET_Y
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

    private playMissSequence(onComplete: () => void) {
      this.isPlayingMissSequence = true;
      this.missSequenceOnComplete = onComplete;
      this.cameras.main.stopFollow();
      this.player.anims.stop();
      const playerBody = this.player.body as Phaser.Physics.Arcade.Body;
      this.player.setTexture("player_miss", 0);
      this.applyPlayerBodySize(
        playerBody,
        GAME_CONSTANTS.PLAYER.MISS_BODY_WIDTH,
        GAME_CONSTANTS.PLAYER.MISS_BODY_HEIGHT
      );
      playerBody.setVelocity(0, GAME_CONSTANTS.PLAYER.MISS_BOUNCE_VELOCITY);
      playerBody.checkCollision.none = true;
    }

    private finishMissSequence() {
      if (!this.missSequenceOnComplete) return;
      const playerBody = this.player.body as Phaser.Physics.Arcade.Body;
      playerBody.checkCollision.none = false;
      const callback = this.missSequenceOnComplete;
      this.missSequenceOnComplete = null;

      if (this.wasMissWithZeroLives) {
        this.isPlayingMissSequence = false;
        this.showGameOver();
        return;
      }

      const duration = GAME_CONSTANTS.CAMERA.FADE_DURATION_MS;
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
              this.isPlayingMissSequence = false;
              this.respawnPlayer();
            }
          );
        }
      );
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
      this.player.setTexture("player_miss", 0);
      this.applyPlayerBodySize(
        playerBody,
        GAME_CONSTANTS.PLAYER.MISS_BODY_WIDTH,
        GAME_CONSTANTS.PLAYER.MISS_BODY_HEIGHT
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

      const duration = GAME_CONSTANTS.CAMERA.FADE_DURATION_MS;
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
              this.isInFallDeathTransition = false;
            }
          );
        }
      );
    }

    private restorePlayerAppearance() {
      this.player.setTexture("player");
      this.player.setFrame(0);
      this.player.setFlipX(false);
      this.applyPlayerBodySize(
        this.player.body as Phaser.Physics.Arcade.Body,
        GAME_CONSTANTS.PLAYER.ACTUAL_WIDTH,
        GAME_CONSTANTS.PLAYER.ACTUAL_HEIGHT
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
      this.livesIcon = this.add.image(x, y, "livesIcon");
      this.livesIcon.setOrigin(0, 0);
      this.livesIcon.setDisplaySize(UI_LIVES_ICON_SIZE, UI_LIVES_ICON_SIZE);
      this.livesIcon.setScrollFactor(0);

      const textX = x + UI_LIVES_ICON_SIZE + 4;
      this.livesText = this.add.text(textX, y, String(this.livesCount), {
        fontFamily: UI_FONT_FAMILY,
        fontSize: "16px",
        color: "#ffffff",
      });
      this.livesText.setOrigin(0, 0);
      this.livesText.setScrollFactor(0);
    }

    update() {
      if (this.isGameOver) return;
      if (!this.player?.body) return;

      const playerBody = this.player.body as Phaser.Physics.Arcade.Body;
      const cameraBottom =
        this.cameras.main.scrollY + this.cameras.main.height;

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
          phase === 0 ? 1 : GAME_CONSTANTS.PLAYER.INVINCIBLE_BLINK_ALPHA
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
          playerBody.velocity.y * GAME_CONSTANTS.MOVEMENT.JUMP_CANCEL_FACTOR
        );
      }

      this.wasJumpPressed = jumpInput;
    }

    private handleMovement(
      playerBody: Phaser.Physics.Arcade.Body,
      deltaTime: number
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
          deltaTime
        );
      } else if (rightInput) {
        this.handleRightMovement(
          playerBody,
          onFloor,
          currentVelocityX,
          deltaTime
        );
      } else {
        this.handleNoInput(playerBody, onFloor, currentVelocityX, deltaTime);
      }
    }

    private handleLeftMovement(
      playerBody: Phaser.Physics.Arcade.Body,
      onFloor: boolean,
      currentVelocityX: number,
      deltaTime: number
    ) {
      const controlFactor = onFloor ? 1.0 : this.airControl;
      const targetVelocity = -this.maxSpeed * controlFactor;

      if (currentVelocityX > targetVelocity) {
        const accel = onFloor
          ? this.acceleration
          : this.acceleration * this.airControl;
        const newVelocity = Math.max(
          currentVelocityX - accel * deltaTime,
          targetVelocity
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
      deltaTime: number
    ) {
      const controlFactor = onFloor ? 1.0 : this.airControl;
      const targetVelocity = this.maxSpeed * controlFactor;

      if (currentVelocityX < targetVelocity) {
        const accel = onFloor
          ? this.acceleration
          : this.acceleration * this.airControl;
        const newVelocity = Math.min(
          currentVelocityX + accel * deltaTime,
          targetVelocity
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
      deltaTime: number
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
      onFloor: boolean
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
