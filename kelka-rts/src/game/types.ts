export type Team = 'player' | 'ai';

export const ENEMY_OF: Record<Team, Team> = { player: 'ai', ai: 'player' };

export type EntityId = number;

export interface Vec2 {
  x: number;
  y: number;
}

export interface Resources {
  coins: number;
  diamonds: number;
  crystals: number;
}
