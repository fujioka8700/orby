"use client";

import { useEffect, useRef, useState } from "react";

const GAME_WIDTH = 256;
const GAME_HEIGHT = 240;

// グローバルなコントロール状態（Phaser と React 間で共有）
const globalControls = {
	left: false,
	right: false,
	up: false,
};

const GAME_CONSTANTS = {
	PLAYER: {
		FRAME_WIDTH: 48,
		FRAME_HEIGHT: 48,
		ACTUAL_WIDTH: 16,
		ACTUAL_HEIGHT: 16,
		DEFAULT_START_X: 48,
		DEFAULT_START_Y: 48,
	},
	MOVEMENT: {
		MAX_SPEED: 160,
		ACCELERATION: 800,
		DECELERATION: 1000,
		AIR_CONTROL: 0.5,
		JUMP_VELOCITY: -350,
		JUMP_CANCEL_FACTOR: 0.2,
		MIN_VELOCITY_THRESHOLD: 10,
	},
	CAMERA: {
		FOLLOW_LERP_X: 0.1,
		FOLLOW_LERP_Y: 0.1,
	},
	COLLISION: {
		ONE_WAY_TOLERANCE_PREV: 2,
		ONE_WAY_TOLERANCE_CURRENT: 8,
	},
	ENEMY: {
		DISPLAY_WIDTH: 64,
		DISPLAY_HEIGHT: 48,
		BODY_WIDTH: 24,
		BODY_HEIGHT: 10,
		OFFSET_X: 20,
		OFFSET_Y: 22,
		SPEED_X: 50,
		SPEED_Y: 300,
		INITIAL_DIRECTION: -1,
		SENSOR_DISTANCE: 1,
		FLIP_ADJUST: 4,
	},
} as const;

const PLAYER_ASSET = "/orby/assets/graphics/characters/Player.png";
const SPIDER_ASSET = "/orby/assets/graphics/enemies/Spider_1.png";

export default function GamePage() {
	const gameRef = useRef<HTMLDivElement>(null);
	const phaserGameRef = useRef<Phaser.Game | null>(null);
	const [buttonStates, setButtonStates] = useState({
		left: false,
		right: false,
		up: false,
	});

	useEffect(() => {
		if (!gameRef.current) return;

		if (phaserGameRef.current) {
			try {
				phaserGameRef.current.destroy(true);
			} catch (error) {
				console.warn("Error destroying Phaser game:", error);
			}
			phaserGameRef.current = null;
		}

		while (gameRef.current.firstChild) {
			gameRef.current.removeChild(gameRef.current.firstChild);
		}
		gameRef.current.innerHTML = "";

		import("phaser").then((Phaser) => {
			interface EnemySprite extends Phaser.Physics.Arcade.Sprite {
				moveDirection: number;
			}

			class GameScene extends Phaser.Scene {
				private player!: Phaser.Physics.Arcade.Sprite;
				private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
				private map!: Phaser.Tilemaps.Tilemap;
				private platformLayer!: Phaser.Tilemaps.TilemapLayer;
				private enemies: EnemySprite[] = [];
				private wasJumpPressed = false;
				private readonly maxSpeed = GAME_CONSTANTS.MOVEMENT.MAX_SPEED;
				private readonly acceleration =
					GAME_CONSTANTS.MOVEMENT.ACCELERATION;
				private readonly deceleration =
					GAME_CONSTANTS.MOVEMENT.DECELERATION;
				private readonly airControl =
					GAME_CONSTANTS.MOVEMENT.AIR_CONTROL;

				constructor() {
					super({ key: "GameScene" });
				}

				preload() {
					this.load.image(
						"tilesetGrass",
						"/orby/assets/graphics/environment/tilesets/Grass_Tileset.png",
					);
					this.load.image(
						"tilesetPlatform",
						"/orby/assets/graphics/environment/interactive/Platform.png",
					);
					this.load.tilemapTiledJSON(
						"tilemap",
						"/orby/assets/maps/1st_stage_tilemap.json",
					);
					this.load.spritesheet("player", PLAYER_ASSET, {
						frameWidth: GAME_CONSTANTS.PLAYER.FRAME_WIDTH,
						frameHeight: GAME_CONSTANTS.PLAYER.FRAME_HEIGHT,
					});
					this.load.spritesheet("spider", SPIDER_ASSET, {
						frameWidth: GAME_CONSTANTS.ENEMY.DISPLAY_WIDTH,
						frameHeight: GAME_CONSTANTS.ENEMY.DISPLAY_HEIGHT,
					});
				}

				create() {
					this.cameras.main.setBackgroundColor("#2c3e50");

					this.setupTilemap();
					this.setupPlayer();
					this.setupCamera();
					this.setupPlayerCollision();
					this.createAnimations();
					this.setupEnemies();
					this.setupInput();
				}

				private setupTilemap() {
					this.map = this.make.tilemap({ key: "tilemap" });
					const tilesetGrass = this.map.addTilesetImage(
						"Grass_Tileset",
						"tilesetGrass",
					);
					const tilesetPlatform = this.map.addTilesetImage(
						"Platform",
						"tilesetPlatform",
					);
					const tilesets: Phaser.Tilemaps.Tileset[] = [];
					if (tilesetGrass) tilesets.push(tilesetGrass);
					if (tilesetPlatform) tilesets.push(tilesetPlatform);
					if (tilesets.length === 0) {
						console.error("Failed to load tilesets");
						return;
					}

					const platformLayer = this.map.createLayer(
						"platform",
						tilesets,
						0,
						0,
					);
					if (!platformLayer) {
						console.error("Failed to create platform layer");
						return;
					}
					this.platformLayer = platformLayer;

					this.platformLayer.setCollisionByProperty({
						collides: true,
					});
					this.platformLayer.forEachTile((tile) => {
						if (tile.properties && tile.properties.oneWay) {
							tile.setCollision(false, false, true, false);
							tile.collideDown = false;
							tile.collideLeft = false;
							tile.collideRight = false;
						}
					});
				}

				private setupPlayer() {
					const objectLayer =
						this.map.getObjectLayer("objectsLayer");
					let playerStartX: number =
						GAME_CONSTANTS.PLAYER.DEFAULT_START_X;
					let playerStartY: number =
						GAME_CONSTANTS.PLAYER.DEFAULT_START_Y;

					if (objectLayer) {
						const playerObj = objectLayer.objects.find(
							(obj) =>
								obj.name === "Player" || obj.name === "player",
						);
						if (
							playerObj &&
							playerObj.x !== undefined &&
							playerObj.y !== undefined
						) {
							playerStartX = playerObj.x;
							playerStartY = playerObj.y;
						}
					}

					this.player = this.physics.add.sprite(
						playerStartX,
						playerStartY,
						"player",
						0,
					);

					const playerBody = this.player
						.body as Phaser.Physics.Arcade.Body;
					const offsetX =
						(GAME_CONSTANTS.PLAYER.FRAME_WIDTH -
							GAME_CONSTANTS.PLAYER.ACTUAL_WIDTH) /
						2;
					const offsetY =
						(GAME_CONSTANTS.PLAYER.FRAME_HEIGHT -
							GAME_CONSTANTS.PLAYER.ACTUAL_HEIGHT) /
						2;

					playerBody.setSize(
						GAME_CONSTANTS.PLAYER.ACTUAL_WIDTH,
						GAME_CONSTANTS.PLAYER.ACTUAL_HEIGHT,
					);
					playerBody.setOffset(offsetX, offsetY);
					playerBody.setCollideWorldBounds(true);
				}

				private setupCamera() {
					const mapWidth = this.map.widthInPixels;
					const mapHeight = this.map.heightInPixels;

					this.cameras.main.startFollow(
						this.player,
						true,
						GAME_CONSTANTS.CAMERA.FOLLOW_LERP_X,
						GAME_CONSTANTS.CAMERA.FOLLOW_LERP_Y,
					);
					this.cameras.main.setBounds(0, 0, mapWidth, mapHeight);
					this.physics.world.setBounds(0, 0, mapWidth, mapHeight);
				}

				private setupPlayerCollision() {
					this.physics.add.collider(
						this.player,
						this.platformLayer,
						undefined,
						(playerObj, tileObj) => {
							const player =
								playerObj as Phaser.Physics.Arcade.Sprite;
							const tile = tileObj as Phaser.Tilemaps.Tile;
							const playerBody =
								player.body as Phaser.Physics.Arcade.Body;

							if (
								tile.properties &&
								tile.properties.oneWay !== true
							) {
								return true;
							}
							if (playerBody.velocity.y < 0) return false;

							const playerBottom = playerBody.bottom;
							const prevPlayerBottom =
								playerBody.prev.y + playerBody.height;
							const tileTop = tile.pixelY;

							if (
								prevPlayerBottom <=
									tileTop +
										GAME_CONSTANTS.COLLISION
											.ONE_WAY_TOLERANCE_PREV ||
								playerBottom <=
									tileTop +
										GAME_CONSTANTS.COLLISION
											.ONE_WAY_TOLERANCE_CURRENT
							) {
								return true;
							}
							return false;
						},
					);
				}

				private createAnimations() {
					this.anims.create({
						key: "idle",
						frames: this.anims.generateFrameNumbers("player", {
							start: 0,
							end: 3,
						}),
						frameRate: 8,
						repeat: -1,
					});
					this.anims.create({
						key: "walk",
						frames: this.anims.generateFrameNumbers("player", {
							start: 4,
							end: 7,
						}),
						frameRate: 10,
						repeat: -1,
					});
					this.anims.create({
						key: "jump",
						frames: [{ key: "player", frame: 8 }],
						frameRate: 1,
					});
					this.anims.create({
						key: "fall",
						frames: [{ key: "player", frame: 9 }],
						frameRate: 1,
					});
					this.anims.create({
						key: "spider-walk",
						frames: this.anims.generateFrameNumbers("spider", {
							start: 0,
							end: 2,
						}),
						frameRate: 8,
						repeat: -1,
					});
				}

				private setupEnemies() {
					this.enemies = [];
					const objectLayer =
						this.map.getObjectLayer("objectsLayer");
					if (!objectLayer) return;

					const spiderObjects = objectLayer.objects.filter(
						(obj) => obj.name === "Spider_1",
					);

					for (const enemyObj of spiderObjects) {
						if (
							enemyObj.x !== undefined &&
							enemyObj.y !== undefined
						) {
							const enemy = this.physics.add.sprite(
								enemyObj.x,
								enemyObj.y,
								"spider",
								0,
							) as EnemySprite;

							enemy.setDisplaySize(
								GAME_CONSTANTS.ENEMY.DISPLAY_WIDTH,
								GAME_CONSTANTS.ENEMY.DISPLAY_HEIGHT,
							);

							const enemyBody =
								enemy.body as Phaser.Physics.Arcade.Body;
							enemyBody.setSize(
								GAME_CONSTANTS.ENEMY.BODY_WIDTH,
								GAME_CONSTANTS.ENEMY.BODY_HEIGHT,
							);
							enemyBody.setOffset(
								GAME_CONSTANTS.ENEMY.OFFSET_X,
								GAME_CONSTANTS.ENEMY.OFFSET_Y,
							);
							enemyBody.setCollideWorldBounds(true);

							enemy.moveDirection =
								GAME_CONSTANTS.ENEMY.INITIAL_DIRECTION;
							enemy.setFlipX(false);
							enemy.play("spider-walk", true);

							this.physics.add.collider(
								enemy,
								this.platformLayer,
								() => {
									const body =
										enemy.body as Phaser.Physics.Arcade.Body;
									if (
										body.blocked.left ||
										body.blocked.right
									) {
										enemy.moveDirection *= -1;
										enemy.setFlipX(
											enemy.moveDirection > 0,
										);
									}
								},
							);

							this.enemies.push(enemy);
						}
					}
				}

				private setupInput() {
					if (this.input.keyboard) {
						this.cursors =
							this.input.keyboard.createCursorKeys();
					}
				}

				update() {
					if (!this.player?.body) return;

					const playerBody = this.player
						.body as Phaser.Physics.Arcade.Body;
					const deltaTime = this.game.loop.delta / 1000;

					this.handleJump(playerBody);
					this.handleMovement(playerBody, deltaTime);
					this.updateEnemies();
				}

				private updateEnemies() {
					for (const enemy of this.enemies) {
						const enemyBody =
							enemy.body as Phaser.Physics.Arcade.Body;

						if (enemy.moveDirection === undefined) {
							enemy.moveDirection =
								GAME_CONSTANTS.ENEMY.INITIAL_DIRECTION;
						}

						const { checkX, checkY } =
							this.getEnemySensorPosition(enemy, enemyBody);
						const hasFloor =
							this.checkEnemyFloor(checkX, checkY);
						const hitWall =
							enemyBody.blocked.left ||
							enemyBody.blocked.right;
						const isGake =
							!hasFloor && enemyBody.blocked.down;

						if (hitWall || isGake) {
							this.flipEnemy(enemy, enemyBody);
						}

						enemyBody.setVelocityX(
							GAME_CONSTANTS.ENEMY.SPEED_X * enemy.moveDirection,
						);

						if (!enemyBody.blocked.down) {
							enemyBody.setVelocityY(
								GAME_CONSTANTS.ENEMY.SPEED_Y,
							);
						}
					}
				}

				private getEnemySensorPosition(
					enemy: EnemySprite,
					enemyBody: Phaser.Physics.Arcade.Body,
				): { checkX: number; checkY: number } {
					const checkX =
						enemy.moveDirection > 0
							? enemyBody.right +
								GAME_CONSTANTS.ENEMY.SENSOR_DISTANCE
							: enemyBody.x -
								GAME_CONSTANTS.ENEMY.SENSOR_DISTANCE;
					const checkY =
						enemyBody.bottom +
						GAME_CONSTANTS.ENEMY.SENSOR_DISTANCE;
					return { checkX, checkY };
				}

				private checkEnemyFloor(
					checkX: number,
					checkY: number,
				): boolean {
					const tileAhead =
						this.platformLayer.getTileAtWorldXY(checkX, checkY);
					return (
						!!tileAhead &&
						((tileAhead.properties.collides as boolean) ||
							(tileAhead.properties.oneWay as boolean))
					);
				}

				private flipEnemy(
					enemy: EnemySprite,
					enemyBody: Phaser.Physics.Arcade.Body,
				) {
					enemy.moveDirection *= -1;
					enemy.setFlipX(enemy.moveDirection > 0);
					enemy.x +=
						enemy.moveDirection *
						GAME_CONSTANTS.ENEMY.FLIP_ADJUST;
					enemyBody.setVelocityY(0);
				}

				private handleJump(
					playerBody: Phaser.Physics.Arcade.Body,
				) {
					const onFloor =
						playerBody.touching.down || playerBody.blocked.down;
					const jumpInput =
						this.cursors.up.isDown || globalControls.up;
					const jumpJustPressed =
						jumpInput && !this.wasJumpPressed && onFloor;

					if (jumpJustPressed) {
						playerBody.setVelocityY(
							GAME_CONSTANTS.MOVEMENT.JUMP_VELOCITY,
						);
						this.player.play("jump", true);
					}

					if (
						!jumpInput &&
						this.wasJumpPressed &&
						playerBody.velocity.y < 0 &&
						!onFloor
					) {
						playerBody.setVelocityY(
							playerBody.velocity.y *
								GAME_CONSTANTS.MOVEMENT.JUMP_CANCEL_FACTOR,
						);
					}

					this.wasJumpPressed = jumpInput;
				}

				private handleMovement(
					playerBody: Phaser.Physics.Arcade.Body,
					deltaTime: number,
				) {
					const onFloor =
						playerBody.touching.down || playerBody.blocked.down;
					const leftInput =
						this.cursors.left.isDown || globalControls.left;
					const rightInput =
						this.cursors.right.isDown || globalControls.right;
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
						this.handleNoInput(
							playerBody,
							onFloor,
							currentVelocityX,
							deltaTime,
						);
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
							const decel =
								this.deceleration * deltaTime;
							if (currentVelocityX > 0) {
								playerBody.setVelocityX(
									Math.max(0, currentVelocityX - decel),
								);
							} else {
								playerBody.setVelocityX(
									Math.min(0, currentVelocityX + decel),
								);
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

			const parent = gameRef.current;
			if (!parent) return;

			const config: Phaser.Types.Core.GameConfig = {
				type: Phaser.AUTO,
				width: GAME_WIDTH,
				height: GAME_HEIGHT,
				parent,
				backgroundColor: "#2c3e50",
				scene: [GameScene],
				scale: {
					mode: Phaser.Scale.FIT,
					autoCenter: Phaser.Scale.CENTER_BOTH,
				},
				physics: {
					default: "arcade",
					arcade: {
						gravity: { x: 0, y: 600 },
						debug: false,
					},
				},
				pixelArt: true,
			};

			phaserGameRef.current = new Phaser.Game(config);
		});

		return () => {
			if (phaserGameRef.current) {
				try {
					phaserGameRef.current.destroy(true);
				} catch (error) {
					console.warn("Error destroying Phaser game:", error);
				}
				phaserGameRef.current = null;
			}
			if (gameRef.current) {
				while (gameRef.current.firstChild) {
					gameRef.current.removeChild(gameRef.current.firstChild);
				}
				gameRef.current.innerHTML = "";
			}
		};
	}, []);

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
		<div className="flex min-h-screen flex-col items-center justify-center bg-gray-900 p-4">
			<div ref={gameRef} style={{ width: GAME_WIDTH, height: GAME_HEIGHT }} />
			<div className="mt-4 flex items-center justify-center gap-4">
				<button
					type="button"
					onMouseDown={handleLeftDown}
					onMouseUp={handleLeftUp}
					onMouseLeave={handleLeftUp}
					onTouchStart={handleLeftDown}
					onTouchEnd={handleLeftUp}
					className={`flex h-16 w-16 select-none touch-none items-center justify-center rounded-full border-2 border-black shadow-md transition-all duration-75 ${
						buttonStates.left
							? "scale-95 bg-gray-200 shadow-inner"
							: "scale-100 bg-white"
					}`}
				>
					<svg width={32} height={32} viewBox="0 0 24 24" fill="black">
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
					className={`flex h-16 w-16 select-none touch-none items-center justify-center rounded-full border-2 border-black shadow-md transition-all duration-75 ${
						buttonStates.right
							? "scale-95 bg-gray-200 shadow-inner"
							: "scale-100 bg-white"
					}`}
				>
					<svg width={32} height={32} viewBox="0 0 24 24" fill="black">
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
					className={`ml-8 flex h-16 w-16 select-none touch-none items-center justify-center rounded-full border-2 border-black shadow-md transition-all duration-75 ${
						buttonStates.up
							? "scale-95 bg-gray-200 shadow-inner"
							: "scale-100 bg-white"
					}`}
				>
					<span className="text-xl font-bold text-black">A</span>
				</button>
			</div>
		</div>
	);
}
