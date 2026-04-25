export enum GameState {
  READY = 'ready',
  CHARGING = 'charging',
  DIVING = 'diving',
  LANDED = 'landed',
  GAME_OVER = 'game_over',
}

export interface GameConfig {
  readonly width: number;
  readonly height: number;
  readonly physics: {
    readonly gravity: number;
    readonly worldBounds: boolean;
  };
  readonly springboard: {
    readonly height: number;
    readonly width: number;
    readonly bounceForce: number;
    readonly maxCharges: number;
  };
  readonly pool: {
    readonly depth: number;
    readonly waterLevel: number;
  };
  readonly athlete: {
    readonly width: number;
    readonly height: number;
    readonly jumpForce: number;
    readonly maxJumpForce: number;
  };
}

export interface PlayerState {
  isCharging: boolean;
  chargeCount: number;
  jumpPower: number;
  velocityY: number;
  isOnSpringboard: boolean;
}

export interface WaterSplashConfig {
  readonly velocity: number;
  readonly x: number;
  readonly y: number;
}
