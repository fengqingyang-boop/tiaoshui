import { GameConfig } from '../types/game';

export const GAME_CONFIG: GameConfig = {
  width: window.innerWidth,
  height: window.innerHeight,
  physics: {
    gravity: 1000,
    worldBounds: false,
  },
  springboard: {
    height: 20,
    width: 300,
    bounceForce: 400,
    maxCharges: 5,
  },
  pool: {
    depth: 150,
    waterLevel: 15,
  },
  athlete: {
    width: 30,
    height: 60,
    jumpForce: 300,
    maxJumpForce: 1200,
  },
} as const;

export const SCALE_FACTOR = 10;
