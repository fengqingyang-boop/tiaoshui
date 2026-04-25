import Phaser from 'phaser';
import { GAME_CONFIG, SCALE_FACTOR } from '../config/constants';

export class Pool {
  private scene: Phaser.Scene;
  private water: Phaser.GameObjects.Rectangle;
  private waterSurface: Phaser.Geom.Line;
  private surfaceY: number;
  private waterLevelMeters: number;
  private waterShimmer: Phaser.GameObjects.Graphics;
  private shimmerTween: Phaser.Tweens.Tween | null;
  private rippleGraphics: Phaser.GameObjects.Graphics;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;

    this.waterLevelMeters = GAME_CONFIG.pool.waterLevel;

    const gameHeight = this.scene.scale.height;
    const springboardY = gameHeight / 3;

    this.surfaceY = springboardY + this.waterLevelMeters * SCALE_FACTOR;

    const waterHeight = gameHeight - this.surfaceY + 100;

    this.water = this.scene.add.rectangle(
      this.scene.scale.width / 2,
      this.surfaceY + waterHeight / 2,
      this.scene.scale.width,
      waterHeight,
      0x1976d2
    );
    this.water.setAlpha(0.7);

    this.waterSurface = new Phaser.Geom.Line(
      0,
      this.surfaceY,
      this.scene.scale.width,
      this.surfaceY
    );

    this.waterShimmer = this.scene.add.graphics();
    this.createWaterShimmer();

    this.rippleGraphics = this.scene.add.graphics();

    this.shimmerTween = null;
    this.startShimmerAnimation();
  }

  private createWaterShimmer(): void {
    this.waterShimmer.clear();

    for (let i = 0; i < 5; i++) {
      const y = this.surfaceY + 20 + i * 30;
      const alpha = 0.1 - i * 0.015;

      this.waterShimmer.lineStyle(3, 0x4fc3f7, alpha);
      this.waterShimmer.beginPath();

      for (let x = 0; x <= this.scene.scale.width; x += 5) {
        const waveY = y + Math.sin(x * 0.02 + i * 0.5) * 5;
        if (x === 0) {
          this.waterShimmer.moveTo(x, waveY);
        } else {
          this.waterShimmer.lineTo(x, waveY);
        }
      }

      this.waterShimmer.strokePath();
    }

    this.waterShimmer.setDepth(0);
  }

  private startShimmerAnimation(): void {
    this.shimmerTween = this.scene.tweens.add({
      targets: {},
      duration: 3000,
      repeat: -1,
      onUpdate: () => {
        this.updateShimmer();
      },
    });
  }

  private updateShimmer(): void {
    this.waterShimmer.clear();

    const time = this.scene.time.now / 1000;

    for (let i = 0; i < 5; i++) {
      const y = this.surfaceY + 20 + i * 30;
      const alpha = 0.1 - i * 0.015;

      this.waterShimmer.lineStyle(3, 0x4fc3f7, alpha);
      this.waterShimmer.beginPath();

      for (let x = 0; x <= this.scene.scale.width; x += 5) {
        const waveY = y + Math.sin(x * 0.02 + time + i * 0.5) * 5;
        if (x === 0) {
          this.waterShimmer.moveTo(x, waveY);
        } else {
          this.waterShimmer.lineTo(x, waveY);
        }
      }

      this.waterShimmer.strokePath();
    }
  }

  public createEntryRipple(x: number, intensity: number): void {
    const maxRadius = 30 + intensity * 50;
    const duration = 800 + intensity * 400;

    for (let i = 0; i < 3; i++) {
      const delay = i * 100;

      this.scene.tweens.addCounter({
        from: 0,
        to: 1,
        duration: duration,
        delay: delay,
        onUpdate: (tween: Phaser.Tweens.Tween) => {
          const progressValue = tween.getValue();
          if (progressValue === null) return;
          
          const progress = progressValue as number;
          const currentRadius = Phaser.Math.Linear(10, maxRadius, progress);
          const alpha = (1 - progress) * 0.5;

          this.rippleGraphics.lineStyle(2, 0xffffff, alpha);
          this.rippleGraphics.beginPath();
          this.rippleGraphics.arc(x, this.surfaceY, currentRadius, 0, Math.PI * 2);
          this.rippleGraphics.strokePath();
        },
        onComplete: () => {
          this.rippleGraphics.clear();
        },
      });
    }
  }

  public getSurfaceY(): number {
    return this.surfaceY;
  }

  public getWaterSurface(): Phaser.Geom.Line {
    return this.waterSurface;
  }

  public getWaterLevelMeters(): number {
    return this.waterLevelMeters;
  }

  public reset(): void {
    this.rippleGraphics.clear();
  }

  public destroy(): void {
    if (this.shimmerTween) {
      this.shimmerTween.destroy();
    }
    this.waterShimmer.destroy();
    this.rippleGraphics.destroy();
    this.water.destroy();
  }
}
