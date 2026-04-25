import Phaser from 'phaser';
import { WaterSplashConfig } from '../types/game';

export class WaterSplash {
  private scene: Phaser.Scene;
  private splashGraphics: Phaser.GameObjects.Graphics[];

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    this.splashGraphics = [];
  }

  public createSplash(config: WaterSplashConfig): void {
    const { velocity, x, y } = config;
    const intensity = Math.min(Math.abs(velocity) / 300, 2);

    this.clearSplash();

    this.createWaterParticles(x, y, intensity);
    this.createSplashSpray(x, y, intensity);
    this.createRipple(x, y, intensity);
    this.createSplashSound(intensity);
  }

  private createWaterParticles(x: number, y: number, intensity: number): void {
    const particleCount = Math.floor(20 + intensity * 30);
    const speed = 100 + intensity * 200;
    const gravityY = 600 + intensity * 200;
    const maxScale = 0.2 + intensity * 0.3;

    for (let i = 0; i < particleCount; i++) {
      const speedX = (Math.random() - 0.5) * speed * 2;
      const speedY = -Math.random() * speed - speed * 0.3;

      const particleX = x;
      const particleY = y;
      const radius = (Math.random() * 4 + 2) * (maxScale * 2);

      const particle = {
        x: particleX,
        y: particleY,
        vx: speedX,
        vy: speedY,
        gravity: gravityY,
        radius: radius,
        alpha: 0.8,
        life: 1.0,
      };

      const graphics = this.scene.add.graphics();
      this.splashGraphics.push(graphics);

      this.animateParticle(graphics, particle, x);
    }
  }

  private animateParticle(
    graphics: Phaser.GameObjects.Graphics,
    particle: {
      x: number;
      y: number;
      vx: number;
      vy: number;
      gravity: number;
      radius: number;
      alpha: number;
      life: number;
    },
    originX: number
  ): void {
    const duration = 1000 + Math.random() * 500;
    const startTime = this.scene.time.now;

    const updateParticle = () => {
      const elapsed = this.scene.time.now - startTime;
      const progress = Math.min(elapsed / duration, 1);

      particle.vy += particle.gravity * 0.016;
      particle.x += particle.vx * 0.016;
      particle.y += particle.vy * 0.016;
      particle.life = 1 - progress;
      particle.alpha = 0.8 * particle.life;

      graphics.clear();
      graphics.fillStyle(0x4fc3f7, particle.alpha);
      graphics.fillCircle(particle.x - originX, particle.y, particle.radius * particle.life);
      graphics.x = originX;

      if (progress < 1) {
        this.scene.time.delayedCall(16, updateParticle);
      } else {
        graphics.clear();
      }
    };

    updateParticle();
  }

  private createSplashSpray(x: number, y: number, intensity: number): void {
    const sprayCount = Math.floor(10 + intensity * 15);
    const spraySpeed = 200 + intensity * 300;

    for (let i = 0; i < sprayCount; i++) {
      const angle = (Math.random() - 0.5) * Math.PI / 3 - Math.PI / 2;
      const speed = Math.random() * spraySpeed * 0.5 + spraySpeed * 0.5;

      const vx = Math.cos(angle) * speed;
      const vy = Math.sin(angle) * speed;

      const radius = Math.random() * 3 + 1;

      const graphics = this.scene.add.graphics();
      this.splashGraphics.push(graphics);

      const particle = {
        x: x,
        y: y,
        vx: vx,
        vy: vy,
        gravity: 800,
        radius: radius,
        alpha: 0.9,
        life: 1.0,
      };

      const duration = 800 + Math.random() * 400;
      const startTime = this.scene.time.now;

      const updateSpray = () => {
        const elapsed = this.scene.time.now - startTime;
        const progress = Math.min(elapsed / duration, 1);

        particle.vy += particle.gravity * 0.016;
        particle.x += particle.vx * 0.016;
        particle.y += particle.vy * 0.016;
        particle.life = 1 - progress;
        particle.alpha = 0.9 * particle.life;

        graphics.clear();
        graphics.fillStyle(0x81d4fa, particle.alpha);
        graphics.fillCircle(particle.x - x, particle.y, particle.radius * particle.life);
        graphics.x = x;

        if (progress < 1) {
          this.scene.time.delayedCall(16, updateSpray);
        } else {
          graphics.clear();
        }
      };

      updateSpray();
    }
  }

  private createRipple(x: number, y: number, intensity: number): void {
    const rippleCount = 3;
    const maxRadius = 50 + intensity * 80;
    const duration = 1000 + intensity * 500;

    for (let i = 0; i < rippleCount; i++) {
      const delay = i * 150;
      const startRadius = 10 + i * 10;
      const endRadius = maxRadius - i * 10;

      const graphics = this.scene.add.graphics();
      this.splashGraphics.push(graphics);

      this.scene.tweens.addCounter({
        from: 0,
        to: 1,
        duration: duration,
        delay: delay,
        onUpdate: (tween: Phaser.Tweens.Tween) => {
          const progressValue = tween.getValue();
          if (progressValue === null) return;
          
          const progress = progressValue as number;
          const currentRadius = Phaser.Math.Linear(startRadius, endRadius, progress);
          const alpha = (1 - progress) * 0.5;

          graphics.clear();
          graphics.lineStyle(2, 0x4fc3f7, alpha);
          graphics.beginPath();
          graphics.arc(0, 0, currentRadius, 0, Math.PI * 2);
          graphics.strokePath();
          graphics.x = x;
          graphics.y = y;
        },
        onComplete: () => {
          graphics.clear();
        },
      });
    }
  }

  private createSplashSound(intensity: number): void {
    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const duration = 0.3 + intensity * 0.3;
      const volume = 0.1 + intensity * 0.2;

      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);

      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(400 - intensity * 100, audioContext.currentTime);
      oscillator.frequency.exponentialRampToValueAtTime(
        200 - intensity * 50,
        audioContext.currentTime + duration
      );

      gainNode.gain.setValueAtTime(volume, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + duration);

      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + duration);
    } catch (e) {
    }
  }

  private clearSplash(): void {
    this.splashGraphics.forEach(graphics => {
      graphics.clear();
      graphics.destroy();
    });
    this.splashGraphics = [];
  }

  public destroy(): void {
    this.clearSplash();
  }
}
