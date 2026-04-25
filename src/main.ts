import Phaser from 'phaser';
import { GAME_CONFIG } from './config/constants';
import { GameScene } from './scenes/GameScene';

const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  width: GAME_CONFIG.width,
  height: GAME_CONFIG.height,
  parent: 'game-container',
  backgroundColor: '#87CEEB',
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { x: 0, y: GAME_CONFIG.physics.gravity },
      debug: false,
    },
  },
  scene: [GameScene],
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
};

export class DivingGame extends Phaser.Game {
  constructor() {
    super(config);
  }
}

let game: DivingGame;

window.addEventListener('load', () => {
  game = new DivingGame();
});

window.addEventListener('resize', () => {
  game.scale.resize(window.innerWidth, window.innerHeight);
});
