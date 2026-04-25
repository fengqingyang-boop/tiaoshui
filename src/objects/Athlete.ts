import Phaser from 'phaser';
import { PlayerState, GameState } from '../types/game';
import { GAME_CONFIG } from '../config/constants';

export class Athlete extends Phaser.Physics.Arcade.Sprite {
  private playerState: PlayerState;
  private currentGameState: GameState;
  private graphics: Phaser.GameObjects.Graphics;
  private bodyShape: Phaser.Geom.Rectangle;
  private headShape: Phaser.Geom.Circle;
  private rotationSpeed: number;
  private chargeTween: Phaser.Tweens.Tween | null;
  private springboardY: number;
  private isChargingInternal: boolean;
  private chargeBounceCount: number;

  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y, '');

    this.springboardY = y;
    this.chargeTween = null;
    this.isChargingInternal = false;
    this.chargeBounceCount = 0;

    this.scene.physics.world.enable(this);
    this.setImmovable(false);
    this.setCollideWorldBounds(false);

    const athleteConfig = GAME_CONFIG.athlete;
    this.setSize(athleteConfig.width, athleteConfig.height);
    this.setDisplaySize(athleteConfig.width, athleteConfig.height);

    this.bodyShape = new Phaser.Geom.Rectangle(
      -athleteConfig.width / 2,
      -athleteConfig.height / 4,
      athleteConfig.width,
      athleteConfig.height * 0.75
    );

    this.headShape = new Phaser.Geom.Circle(0, -athleteConfig.height / 2 + 8, 10);

    this.graphics = this.scene.add.graphics({ x: x, y: y });
    this.graphics.setScrollFactor(0, 0);
    this.drawAthlete();

    this.playerState = {
      isCharging: false,
      chargeCount: 0,
      jumpPower: 0,
      velocityY: 0,
      isOnSpringboard: true,
    };

    this.currentGameState = GameState.READY;
    this.rotationSpeed = 0;

    if (this.body) {
      (this.body as Phaser.Physics.Arcade.Body).allowGravity = false;
      this.setVelocity(0, 0);
    }

    this.scene.add.existing(this);
  }

  private drawAthlete(): void {
    this.graphics.clear();

    this.graphics.fillStyle(0x3498db, 1);
    this.graphics.fillRectShape(this.bodyShape);

    this.graphics.fillStyle(0xf1c40f, 1);
    this.graphics.fillCircleShape(this.headShape);

    this.graphics.lineStyle(2, 0x2c3e50);
    this.graphics.strokeRectShape(this.bodyShape);
    this.graphics.strokeCircleShape(this.headShape);
  }

  public update(_time: number, delta: number): void {
    if (this.graphics) {
      this.graphics.x = this.x;
      this.graphics.y = this.y;
      this.graphics.rotation = this.rotation;
    }

    if (this.currentGameState === GameState.DIVING) {
      this.rotation += this.rotationSpeed * delta / 1000;
    }

    if (this.body) {
      this.playerState.velocityY = this.body.velocity.y;
    }
  }

  public startCharging(): void {
    if (this.currentGameState !== GameState.READY) return;

    this.currentGameState = GameState.CHARGING;
    this.playerState.isCharging = true;
    this.playerState.chargeCount = 0;
    this.playerState.jumpPower = GAME_CONFIG.athlete.jumpForce;
    this.isChargingInternal = true;
    this.chargeBounceCount = 0;

    if (this.body) {
      (this.body as Phaser.Physics.Arcade.Body).allowGravity = false;
      this.setVelocity(0, 0);
    }

    this.startChargeBounce();
  }

  private startChargeBounce(): void {
    if (!this.isChargingInternal) return;

    this.chargeBounceCount++;

    if (this.chargeBounceCount > GAME_CONFIG.springboard.maxCharges) {
      this.stopCharging(true);
      this.endGame();
      return;
    }

    this.playerState.chargeCount = this.chargeBounceCount;
    this.playerState.jumpPower = Math.min(
      GAME_CONFIG.athlete.jumpForce + (this.chargeBounceCount - 1) * GAME_CONFIG.springboard.bounceForce,
      GAME_CONFIG.athlete.maxJumpForce
    );

    const bounceHeight = 20 + (this.chargeBounceCount - 1) * 20;

    if (this.chargeTween) {
      this.chargeTween.destroy();
    }

    this.chargeTween = this.scene.tweens.add({
      targets: this,
      y: {
        from: this.springboardY,
        to: this.springboardY - bounceHeight,
      },
      scaleY: {
        from: 1,
        to: 1.1,
      },
      duration: 300,
      ease: 'Sine.easeOut',
      yoyo: true,
      hold: 0,
      repeat: 0,
      onYoyo: () => {
        this.setScale(1);
      },
      onComplete: () => {
        if (this.isChargingInternal) {
          this.scene.time.delayedCall(150, () => {
            this.startChargeBounce();
          });
        }
      },
    });
  }

  public stopCharging(isGameOver: boolean = false): void {
    if (!this.playerState.isCharging) return;

    this.playerState.isCharging = false;
    this.isChargingInternal = false;

    if (this.chargeTween) {
      this.chargeTween.stop();
      this.chargeTween.destroy();
      this.chargeTween = null;
    }

    this.setScale(1);
    this.y = this.springboardY;

    if (!isGameOver) {
      this.launch();
    }
  }

  private launch(): void {
    this.currentGameState = GameState.DIVING;
    this.playerState.isOnSpringboard = false;

    if (this.body) {
      (this.body as Phaser.Physics.Arcade.Body).allowGravity = true;
      const launchPower = this.playerState.jumpPower;
      const velocityY = -launchPower;
      const velocityX = launchPower * 0.4;

      this.setVelocity(velocityX, velocityY);
      this.rotationSpeed = 270 * (this.playerState.chargeCount + 1);
    }
  }

  public enterWater(): void {
    if (this.currentGameState !== GameState.DIVING) return;

    this.currentGameState = GameState.LANDED;
    this.setVelocity(0, 0);
    this.setAcceleration(0, 0);
    this.rotationSpeed = 0;

    if (this.body) {
      (this.body as Phaser.Physics.Arcade.Body).allowGravity = false;
    }
  }

  private endGame(): void {
    this.currentGameState = GameState.GAME_OVER;
    this.setVelocity(0, 0);
    this.rotationSpeed = 0;

    if (this.body) {
      (this.body as Phaser.Physics.Arcade.Body).allowGravity = false;
    }
  }

  public reset(): void {
    if (this.chargeTween) {
      this.chargeTween.destroy();
      this.chargeTween = null;
    }

    this.setPosition(this.scene.scale.width / 2, this.springboardY);
    this.setVelocity(0, 0);
    this.setAcceleration(0, 0);
    this.setRotation(0);
    this.setScale(1);

    this.playerState = {
      isCharging: false,
      chargeCount: 0,
      jumpPower: 0,
      velocityY: 0,
      isOnSpringboard: true,
    };

    this.currentGameState = GameState.READY;
    this.rotationSpeed = 0;
    this.isChargingInternal = false;
    this.chargeBounceCount = 0;

    if (this.body) {
      (this.body as Phaser.Physics.Arcade.Body).allowGravity = false;
      this.setVelocity(0, 0);
    }
  }

  public getGameState(): GameState {
    return this.currentGameState;
  }

  public getChargeCount(): number {
    return this.playerState.chargeCount;
  }

  public getVelocityY(): number {
    return this.playerState.velocityY;
  }

  public setGameState(state: GameState): void {
    this.currentGameState = state;
  }

  public destroy(fromScene?: boolean): void {
    if (this.graphics) {
      this.graphics.destroy();
    }
    if (this.chargeTween) {
      this.chargeTween.destroy();
    }
    super.destroy(fromScene);
  }
}
