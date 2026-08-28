import { companionById, MERGE_TIER_MULTIPLIER, type CompanionDef } from './almanac';
import { TILE } from './world';
import type { EntityId, Team, Vec2 } from './types';

export type UnitCommand = 'idle' | 'move' | 'attackMove' | 'attack';

export interface Unit {
  id: EntityId;
  team: Team;
  companionId: string;
  mergeTier: 0 | 1 | 2;
  hp: number;
  maxHp: number;
  attack: number;
  rangePx: number;
  atkCooldown: number;
  atkTimer: number;
  moveSpeedPx: number;
  pos: Vec2;
  dest: Vec2 | null;
  attackTargetId: EntityId | null;
  attackTargetIsBuilding: boolean;
  command: UnitCommand;
  selected: boolean;
  abilityTimer: number;
}

export function unitDef(unit: Unit): CompanionDef {
  return companionById(unit.companionId);
}

export function createUnit(id: EntityId, team: Team, companionId: string, mergeTier: 0 | 1 | 2, pos: Vec2): Unit {
  const def = companionById(companionId);
  const statMult = MERGE_TIER_MULTIPLIER[mergeTier];
  return {
    id,
    team,
    companionId,
    mergeTier,
    hp: def.hp * statMult,
    maxHp: def.hp * statMult,
    attack: def.attack * statMult,
    rangePx: def.range * TILE,
    atkCooldown: def.atkCooldown,
    atkTimer: 0,
    moveSpeedPx: def.moveSpeed * TILE,
    pos: { ...pos },
    dest: null,
    attackTargetId: null,
    attackTargetIsBuilding: false,
    command: 'idle',
    selected: false,
    abilityTimer: 0,
  };
}

export function distance(a: Vec2, b: Vec2): number {
  return Math.hypot(a.x - b.x, a.y - b.y);
}
