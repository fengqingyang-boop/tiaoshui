import Phaser from 'phaser';
import { Athlete } from '../objects/Athlete';
import { Springboard } from '../objects/Springboard';
import { Pool } from '../objects/Pool';
import { WaterSplash } from '../effects/WaterSplash';
import { GameState } from '../types/game';
import { GAME_CONFIG } from '../config/constants';

export class GameScene extends Phaser.Scene {
  private athlete: Athlete | null;
  private springboard: Springboard | null;
  private pool: Pool | null;
  private waterSplash: WaterSplash | null;
  private isSpaceDown: boolean;
  private uiText: Phaser.GameObjects.Text;
  private chargeIndicator: Phaser.GameObjects.Graphics;
  private gameStateText: Phaser.GameObjects.Text;
  private waterEntryY: number;
  private hasEnteredWater: boolean;
  private lastTime: number;

  constructor() {
    super({ key: 'GameScene' });
    this.athlete = null;
    this.springboard = null;
    this.pool = null;
    this.waterSplash = null;
    this.isSpaceDown = false;
    this.uiText = null as unknown as Phaser.GameObjects.Text;
    this.chargeIndicator = null as unknown as Phaser.GameObjects.Graphics;
    this.gameStateText = null as unknown as Phaser.GameObjects.Text;
    this.waterEntryY = 0;
    this.hasEnteredWater = false;
    this.lastTime = 0;
  }

  public preload(): void {
  }

  public create(): void {
    this.createBackground();
    this.createUI();
    this.createGameObjects();
    this.setupInput();
    this.setupPhysics();

    this.hasEnteredWater = false;
    this.lastTime = 0;

    this.gameStateText.setText('按空格键开始蓄力！最多蓄力5次');
  }

  private createBackground(): void {
    const gradient = this.textures.createCanvas('gradient', 1, this.scale.height);
    
    if (!gradient) {
      const bg = this.add.rectangle(
        this.scale.width / 2,
        this.scale.height / 2,
        this.scale.width,
        this.scale.height,
        0x87CEEB
      );
      bg.setDepth(0);
      this.addClouds();
      return;
    }

    const ctx = gradient.getContext();
    if (!ctx) {
      const bg = this.add.rectangle(
        this.scale.width / 2,
        this.scale.height / 2,
        this.scale.width,
        this.scale.height,
        0x87CEEB
      );
      bg.setDepth(0);
      this.addClouds();
      return;
    }

    const gradientFill = ctx.createLinearGradient(0, 0, 0, this.scale.height);
    gradientFill.addColorStop(0, '#87CEEB');
    gradientFill.addColorStop(0.3, '#B0E0E6');
    gradientFill.addColorStop(1, '#4682B4');

    ctx.fillStyle = gradientFill;
    ctx.fillRect(0, 0, 1, this.scale.height);

    gradient.refresh();

    const bg = this.add.image(0, 0, 'gradient');
    bg.setOrigin(0, 0);
    bg.setDisplaySize(this.scale.width, this.scale.height);
    bg.setDepth(0);

    this.addClouds();
  }

  private addClouds(): void {
    const cloudColors = [0xffffff, 0xf0f0f0, 0xe8e8e8];

    for (let i = 0; i < 5; i++) {
      const x = Phaser.Math.Between(50, this.scale.width - 50);
      const y = Phaser.Math.Between(30, this.scale.height / 4);
      const color = cloudColors[Phaser.Math.Between(0, cloudColors.length - 1)];

      this.createCloud(x, y, color);
    }
  }

  private createCloud(x: number, y: number, color: number): void {
    const cloud = this.add.graphics();
    cloud.fillStyle(color, 0.6);

    const circles = [
      { x: -30, y: 0, radius: 25 },
      { x: 0, y: -5, radius: 35 },
      { x: 30, y: 0, radius: 30 },
      { x: 15, y: 15, radius: 20 },
    ];

    circles.forEach(circle => {
      cloud.fillCircle(circle.x, circle.y, circle.radius);
    });

    cloud.x = x;
    cloud.y = y;

    this.tweens.add({
      targets: cloud,
      x: x + 50,
      duration: Phaser.Math.Between(8000, 15000),
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });
  }

  private createUI(): void {
    this.uiText = this.add.text(
      20,
      20,
      '跳水游戏\n按空格键蓄力，松开跳跃',
      {
        fontFamily: 'Arial',
        fontSize: '24px',
        color: '#ffffff',
        stroke: '#000000',
        strokeThickness: 3,
      }
    );
    this.uiText.setDepth(100);

    this.gameStateText = this.add.text(
      this.scale.width / 2,
      80,
      '',
      {
        fontFamily: 'Arial',
        fontSize: '28px',
        color: '#ffffff',
        stroke: '#000000',
        strokeThickness: 4,
        align: 'center',
      }
    );
    this.gameStateText.setOrigin(0.5, 0.5);
    this.gameStateText.setDepth(100);

    this.chargeIndicator = this.add.graphics();
    this.chargeIndicator.setDepth(100);
  }

  private createGameObjects(): void {
    const centerX = this.scale.width / 2;
    const springboardY = this.scale.height / 3;

    this.springboard = new Springboard(this, centerX, springboardY);

    this.pool = new Pool(this);
    this.waterEntryY = this.pool.getSurfaceY();

    this.waterSplash = new WaterSplash(this);

    const athleteY = springboardY - GAME_CONFIG.athlete.height / 2 - GAME_CONFIG.springboard.height / 2;
    this.athlete = new Athlete(this, centerX, athleteY);
  }

  private setupInput(): void {
    this.input.keyboard?.on('keydown-SPACE', () => {
      this.onSpaceDown();
    });

    this.input.keyboard?.on('keyup-SPACE', () => {
      this.onSpaceUp();
    });
  }

  private onSpaceDown(): void {
    if (this.athlete && this.athlete.getGameState() === GameState.READY) {
      this.isSpaceDown = true;
      this.athlete.startCharging();
      this.gameStateText.setText(`蓄力中... 第 ${this.athlete.getChargeCount() + 1} 次`);
    }
  }

  private onSpaceUp(): void {
    if (this.isSpaceDown && this.athlete) {
      const currentState = this.athlete.getGameState();

      if (currentState === GameState.CHARGING) {
        this.isSpaceDown = false;
        this.athlete.stopCharging(false);
        this.gameStateText.setText(`出发！蓄力 ${this.athlete.getChargeCount()} 次`);
        this.updateChargeIndicator(0);
      } else if (currentState === GameState.GAME_OVER || currentState === GameState.LANDED) {
        this.restartGame();
      }
    }
  }

  private setupPhysics(): void {
  }

  private updateChargeIndicator(chargeCount: number): void {
    this.chargeIndicator.clear();

    if (!this.athlete) return;

    const centerX = this.scale.width / 2;
    const y = this.scale.height - 80;
    const barWidth = 300;
    const barHeight = 30;
    const segmentWidth = barWidth / GAME_CONFIG.springboard.maxCharges;

    this.chargeIndicator.lineStyle(2, 0xffffff);
    this.chargeIndicator.strokeRect(centerX - barWidth / 2, y, barWidth, barHeight);

    const colors = [
      0x4caf50,
      0x8bc34a,
      0xcddc39,
      0xffeb3b,
      0xf44336,
    ];

    for (let i = 0; i < chargeCount; i++) {
      const color = colors[Math.min(i, colors.length - 1)];
      this.chargeIndicator.fillStyle(color, 0.8);
      this.chargeIndicator.fillRect(
        centerX - barWidth / 2 + i * segmentWidth,
        y,
        segmentWidth - 2,
        barHeight
      );
    }

    this.chargeIndicator.fillStyle(0xffffff);
    const chargeText = this.add.text(centerX, y - 25, '蓄力次数', {
      fontSize: '18px',
      color: '#ffffff',
      stroke: '#000000',
      strokeThickness: 2,
    });
    chargeText.setOrigin(0.5, 1);
    chargeText.on('destroy', () => chargeText.destroy());
  }

  public update(time: number, delta: number): void {
    if (!this.athlete || !this.pool) return;

    this.athlete.update(time, delta);

    const currentState = this.athlete.getGameState();

    if (currentState === GameState.CHARGING) {
      this.updateChargeIndicator(this.athlete.getChargeCount());

      if (this.athlete.getChargeCount() >= GAME_CONFIG.springboard.maxCharges) {
        this.gameStateText.setText('游戏结束！蓄力次数过多');
        this.showGameOver();
        return;
      }
    }

    if (currentState === GameState.DIVING && !this.hasEnteredWater) {
      const athleteY = this.athlete.y;
      const athleteHeight = GAME_CONFIG.athlete.height;
      const athleteBottomY = athleteY + athleteHeight / 2;

      if (athleteBottomY >= this.waterEntryY) {
        this.hasEnteredWater = true;
        this.onWaterEntry();
      }
    }

    if (this.lastTime === 0) {
      this.lastTime = time;
    }
    this.lastTime = time;
  }

  private onWaterEntry(): void {
    if (!this.athlete || !this.waterSplash || !this.pool) return;

    const velocityY = this.athlete.getVelocityY();
    const entryX = this.athlete.x;

    this.waterSplash.createSplash({
      velocity: velocityY,
      x: entryX,
      y: this.waterEntryY,
    });

    const intensity = Math.min(Math.abs(velocityY) / 300, 2);
    this.pool.createEntryRipple(entryX, intensity);

    this.athlete.enterWater();

    this.showScore(velocityY, intensity);
  }

  private showScore(velocityY: number, intensity: number): void {
    const speedKmh = (Math.abs(velocityY) * 3.6) / 1000;
    const waterLevel = GAME_CONFIG.pool.waterLevel;

    let score = 0;
    let scoreText = '';

    if (intensity < 0.5) {
      score = 100;
      scoreText = '完美！几乎无水花！';
    } else if (intensity < 1.0) {
      score = 85;
      scoreText = '很好！水花很小';
    } else if (intensity < 1.5) {
      score = 70;
      scoreText = '不错！水花一般';
    } else {
      score = 50;
      scoreText = '需要改进！水花太大';
    }

    const displayText = `入水速度: ${speedKmh.toFixed(1)} km/h\n跳水高度: ${waterLevel} 米\n得分: ${score}\n${scoreText}\n\n按空格键重新开始`;

    this.gameStateText.setText(displayText);
    this.gameStateText.setFontSize('22px');
  }

  private showGameOver(): void {
    if (!this.athlete) return;

    this.athlete.setGameState(GameState.GAME_OVER);
    this.isSpaceDown = false;

    this.gameStateText.setText(
      '游戏结束！\n蓄力超过5次，运动员掉落\n\n按空格键重新开始'
    );
    this.gameStateText.setFontSize('24px');
  }

  private restartGame(): void {
    this.hasEnteredWater = false;
    this.isSpaceDown = false;

    if (this.athlete) {
      this.athlete.destroy();
      this.athlete = null;
    }

    if (this.springboard) {
      this.springboard.destroy();
      this.springboard = null;
    }

    if (this.pool) {
      this.pool.destroy();
      this.pool = null;
    }

    if (this.waterSplash) {
      this.waterSplash.destroy();
      this.waterSplash = null;
    }

    this.chargeIndicator.clear();

    const centerX = this.scale.width / 2;
    const springboardY = this.scale.height / 3;

    this.springboard = new Springboard(this, centerX, springboardY);
    this.pool = new Pool(this);
    this.waterEntryY = this.pool.getSurfaceY();
    this.waterSplash = new WaterSplash(this);

    const athleteY = springboardY - GAME_CONFIG.athlete.height / 2 - GAME_CONFIG.springboard.height / 2;
    this.athlete = new Athlete(this, centerX, athleteY);

    this.setupPhysics();

    this.gameStateText.setText('按空格键开始蓄力！最多蓄力5次');
    this.gameStateText.setFontSize('28px');
  }
}
