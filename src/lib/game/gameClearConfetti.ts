/// <reference types="phaser" />

const CONFETTI_COLOR_RED = 0xed1a3d;
const CONFETTI_COLOR_YELLOW = 0xffeb3d;
const CONFETTI_MAX_LIFE = 1000;
const CONFETTI_SIZE_MIN = 8;
const CONFETTI_SIZE_MAX = 10;
const CONFETTI_VX_MIN = 1;
const CONFETTI_VX_MAX = 3;
const CONFETTI_VY_MIN = 2;
const CONFETTI_VY_MAX = 4;

interface ConfettiParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: number;
  degree: number;
  size: number;
  life: number;
  maxLife: number;
}

function getRandom(min: number, max: number): number {
  return Math.random() * (max - min) + min;
}

export interface GameClearConfetti {
  update(): void;
  destroy(): void;
}

/**
 * ゲームクリア画面用の紙吹雪（コンフェetti）演出。
 * CodePen https://codepen.io/hana4525/pen/poYBPpr の背景アニメーションを参考にした。
 */
export function createGameClearConfetti(
  scene: Phaser.Scene,
  width: number,
  height: number,
): GameClearConfetti {
  const graphics = scene.add.graphics();
  graphics.setScrollFactor(0);
  graphics.setDepth(2000);

  const particles: ConfettiParticle[] = [];
  let frameCount = 0;

  function spawnParticle(color: number) {
    const x = getRandom(0, width);
    const y = -height / 2;
    const vx = getRandom(CONFETTI_VX_MIN, CONFETTI_VX_MAX) * (Math.random() > 0.5 ? 1 : -1);
    const vy = getRandom(CONFETTI_VY_MIN, CONFETTI_VY_MAX);
    particles.push({
      x,
      y,
      vx,
      vy,
      color,
      degree: getRandom(0, 360),
      size: Math.floor(getRandom(CONFETTI_SIZE_MIN, CONFETTI_SIZE_MAX)),
      life: 0,
      maxLife: CONFETTI_MAX_LIFE,
    });
  }

  function update() {
    frameCount++;
    if (frameCount % 5 === 0) {
      spawnParticle(
        frameCount % 10 === 0 ? CONFETTI_COLOR_RED : CONFETTI_COLOR_YELLOW,
      );
    }

    graphics.clear();

    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.degree += 1;
      p.vx *= 0.99;
      p.vy *= 0.999;
      p.x += p.vx + Math.cos((p.degree * Math.PI) / 600);
      p.y += p.vy;
      const rectHeight = Math.cos((p.degree * Math.PI) / 40) * p.size;
      p.life++;
      if (p.life >= p.maxLife) {
        particles.splice(i, 1);
        continue;
      }
      graphics.fillStyle(p.color, 1);
      graphics.fillRect(p.x, p.y, p.size, rectHeight);
    }
  }

  function destroy() {
    graphics.destroy();
  }

  return { update, destroy };
}
