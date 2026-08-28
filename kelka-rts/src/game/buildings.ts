import {
  GARDEN_HEART_HP,
  INCUBATOR_HP,
  INCUBATOR_POWER_DRAW,
  POWER_PLANT_HP,
  POWER_PLANT_POWER,
  YARD_HP,
  YARD_POWER_DRAW,
} from './almanac';
import type { EntityId, Team, Vec2 } from './types';

export type BuildingKind = 'heart' | 'yard' | 'incubator' | 'powerplant';

export interface HatchJob {
  companionId: string;
  timeLeft: number;
  totalTime: number;
}

export interface ConstructionJob {
  timeLeft: number;
  totalTime: number;
}

export interface Building {
  id: EntityId;
  team: Team;
  kind: BuildingKind;
  pos: Vec2;
  hp: number;
  maxHp: number;
  hatching: HatchJob | null;
  constructing: ConstructionJob | null;
  repairing: boolean;
}

const MAX_HP: Record<BuildingKind, number> = {
  heart: GARDEN_HEART_HP,
  yard: YARD_HP,
  incubator: INCUBATOR_HP,
  powerplant: POWER_PLANT_HP,
};

export function createBuilding(id: EntityId, team: Team, kind: BuildingKind, pos: Vec2, underConstruction = false, buildSeconds = 0): Building {
  const maxHp = MAX_HP[kind];
  return {
    id,
    team,
    kind,
    pos,
    hp: underConstruction ? 0 : maxHp,
    maxHp,
    hatching: null,
    constructing: underConstruction ? { timeLeft: buildSeconds, totalTime: buildSeconds } : null,
    repairing: false,
  };
}

// Power generated (positive) or drawn (negative) by a fully-built structure of this kind.
// Every building draws power just by existing except the Garden Heart, which has no
// operations of its own to run.
export function powerFor(kind: BuildingKind): number {
  switch (kind) {
    case 'yard':
      return -YARD_POWER_DRAW;
    case 'powerplant':
      return POWER_PLANT_POWER;
    case 'incubator':
      return -INCUBATOR_POWER_DRAW;
    default:
      return 0;
  }
}
