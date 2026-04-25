import Phaser from 'phaser';
import { GAME_CONFIG } from '../config/constants';

export class Springboard {
  private scene: Phaser.Scene;
  private platform: Phaser.GameObjects.Rectangle;
  private support: Phaser.GameObjects.Rectangle;
  private body: Phaser.Physics.Arcade.StaticBody | null;
  private springTween: Phaser.Tweens.Tween | null;
  private isSpringing: boolean;

  constructor(scene: Phaser.Scene, x: number, y: number) {
    this.scene = scene;
    this.springTween = null;
    this.isSpringing = false;

    const config = GAME_CONFIG.springboard;

    this.support = this.scene.add.rectangle(
      x,
      y + config.height / 2 + 30,
      20,
      60,
      0x795548
    );

    this.platform = this.scene.add.rectangle(
      x,
      y,
      config.width,
      config.height,
      0x8d6e63
    );

    this.platform.setStrokeStyle(2, 0x5d4037);
    this.support.setStrokeStyle(2, 0x3e2723);

    this.scene.physics.world.enable(this.platform, Phaser.Physics.Arcade.STATIC_BODY);
    this.body = this.platform.body as Phaser.Physics.Arcade.StaticBody;

    if (this.body) {
      this.body.setSize(config.width, config.height);
      this.body.setOffset(
        (this.platform.width - config.width) / 2,
        (this.platform.height - config.height) / 2
      );
      this.body.immovable = true;
    }
  }

  public spring(compressionAmount: number = 1): void {
    if (this.isSpringing) return;

    this.isSpringing = true;

    const compression = 5 + compressionAmount * 5;

    this.springTween = this.scene.tweens.add({
      targets: this.platform,
      scaleY: 0.9,
      y: this.platform.y + compression,
      duration: 100,
      yoyo: true,
      repeat: 0,
      ease: 'Power2.in',
      onComplete: () => {
        this.isSpringing = false;
      },
    });
  }

  public getPhysicsObject(): Phaser.Physics.Arcade.StaticBody {
    if (!this.body) {
      throw new Error('Springboard physics body not initialized');
    }
    return this.body;
  }

  public getPlatform(): Phaser.GameObjects.Rectangle {
    return this.platform;
  }

  public getSupport(): Phaser.GameObjects.Rectangle {
    return this.support;
  }

  public reset(): void {
    if (this.springTween) {
      this.springTween.destroy();
      this.springTween = null;
    }
    this.isSpringing = false;
    this.platform.setScale(1);
    this.platform.y = this.platform.y;
  }

  public destroy(): void {
    if (this.springTween) {
      this.springTween.destroy();
    }
    if (this.body) {
      this.body.destroy();
    }
    this.platform.destroy();
    this.support.destroy();
  }
}
