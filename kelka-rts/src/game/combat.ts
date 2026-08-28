import type { Building } from './buildings';
import { ENEMY_OF, type Vec2 } from './types';
import { distance, type Unit } from './units';

export interface WeatherCombatMods {
  dmgMult: number;
  speedMult: number;
  atkCdMult: number;
}

function moveToward(unit: Unit, target: Vec2, dt: number, speedMult: number) {
  const d = distance(unit.pos, target);
  if (d < 0.5) return;
  const step = unit.moveSpeedPx * speedMult * dt;
  const t = Math.min(1, step / d);
  unit.pos.x += (target.x - unit.pos.x) * t;
  unit.pos.y += (target.y - unit.pos.y) * t;
}

export function tickUnitCombat(unit: Unit, units: Unit[], buildings: Building[], dt: number, mods: WeatherCombatMods, aggroRangePx: number) {
  if (unit.hp <= 0) return;

  if (unit.attackTargetId != null) {
    const stillAlive = unit.attackTargetIsBuilding
      ? buildings.some((b) => b.id === unit.attackTargetId && b.hp > 0)
      : units.some((u) => u.id === unit.attackTargetId && u.hp > 0);
    if (!stillAlive) {
      unit.attackTargetId = null;
      if (unit.command === 'attack') unit.command = unit.dest ? 'move' : 'idle';
    }
  }

  if (unit.attackTargetId == null && unit.command !== 'move') {
    const enemyTeam = ENEMY_OF[unit.team];
    let bestId: number | null = null;
    let bestIsBuilding = false;
    let bestDist = aggroRangePx;
    for (const u of units) {
      if (u.team !== enemyTeam || u.hp <= 0) continue;
      const d = distance(unit.pos, u.pos);
      if (d < bestDist) {
        bestDist = d;
        bestId = u.id;
        bestIsBuilding = false;
      }
    }
    for (const b of buildings) {
      if (b.team !== enemyTeam || b.hp <= 0) continue;
      const d = distance(unit.pos, b.pos);
      if (d < bestDist) {
        bestDist = d;
        bestId = b.id;
        bestIsBuilding = true;
      }
    }
    if (bestId != null) {
      unit.attackTargetId = bestId;
      unit.attackTargetIsBuilding = bestIsBuilding;
      if (unit.command === 'idle') unit.command = 'attack';
    }
  }

  if (unit.attackTargetId != null) {
    const targetPos = unit.attackTargetIsBuilding
      ? buildings.find((b) => b.id === unit.attackTargetId)?.pos
      : units.find((u) => u.id === unit.attackTargetId)?.pos;
    if (!targetPos) return;
    const d = distance(unit.pos, targetPos);
    if (d > unit.rangePx) {
      moveToward(unit, targetPos, dt, mods.speedMult);
    } else {
      unit.atkTimer -= dt;
      if (unit.atkTimer <= 0) {
        const dmg = unit.attack * mods.dmgMult;
        unit.damageDealt += dmg;
        if (unit.attackTargetIsBuilding) {
          const b = buildings.find((b) => b.id === unit.attackTargetId);
          if (b) b.hp -= dmg;
        } else {
          const u2 = units.find((u) => u.id === unit.attackTargetId);
          if (u2) u2.hp -= dmg;
        }
        unit.atkTimer = unit.atkCooldown * mods.atkCdMult;
      }
    }
  } else if (unit.dest) {
    const d = distance(unit.pos, unit.dest);
    if (d < 4) {
      unit.dest = null;
      if (unit.command === 'move' || unit.command === 'attackMove') unit.command = 'idle';
    } else {
      moveToward(unit, unit.dest, dt, mods.speedMult);
    }
  }
}
