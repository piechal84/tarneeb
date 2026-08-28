import { AGGRO_RANGE_TILES, KELKA_QUEST_REWARD, KELKA_QUEST_SECONDS, REPAIR_COST_PER_HP, REPAIR_RATE_HP_PER_SEC } from './almanac';
import { aiTick } from './ai';
import { tickUnitCombat } from './combat';
import { activeMutation, combatAtkCooldownMultiplier, combatDamageMultiplier, combatSpeedMultiplier, tickDayNight, tickWeather } from './weather';
import { hasteCrop, plotIncomeThisTick, tickPlotGrowth } from './economy';
import { addResources, productionSpeedMultiplier, teamBonuses, type GameState } from './state';
import type { Team } from './types';
import { createUnit } from './units';
import { TILE } from './world';

const HUD_INTERVAL = 0.15;
const AGGRO_RANGE_PX = AGGRO_RANGE_TILES * TILE;

// Baby Dragon is the one companion ability left that still needs a per-tick timer — Fox's
// old "auto-harvest" was folded into a flat Income% bonus in almanac.ts since a mature plot
// now earns on its own with nothing left to harvest.
function tickCompanionAbilities(state: GameState, dt: number) {
  for (const u of state.units) {
    if (u.hp <= 0 || u.companionId !== 'babydragon') continue;
    u.abilityTimer += dt;
    if (u.abilityTimer >= 60) {
      u.abilityTimer -= 60;
      const plot = state.plots.find((p) => p.team === u.team && p.cropId && !p.ready);
      if (plot) hasteCrop(plot, activeMutation(state.weather));
    }
  }
}

function tickPlotIncome(state: GameState, dt: number, playerIncomeBonus: number, aiIncomeBonus: number) {
  for (const plot of state.plots) {
    const bonus = plot.team === 'player' ? playerIncomeBonus : aiIncomeBonus;
    const { coins, diamonds } = plotIncomeThisTick(plot, dt, bonus);
    if (coins > 0 || diamonds > 0) addResources(state, plot.team, coins, diamonds);
  }
}

function tickBuildings(state: GameState, dt: number, playerIncubatorMult: number, aiIncubatorMult: number) {
  for (const b of state.buildings) {
    if (b.hp <= 0 || b.constructing || !b.hatching) continue;
    const mult = b.team === 'player' ? playerIncubatorMult : aiIncubatorMult;
    b.hatching.timeLeft -= dt * mult;
    if (b.hatching.timeLeft <= 0) {
      const pos = { x: b.pos.x, y: b.pos.y + TILE };
      state.units.push(createUnit(state.nextId++, b.team, b.hatching.companionId, 0, pos));
      b.hatching = null;
    }
  }
}

// A building under construction starts at 0 HP and fills up as its timer counts down, the
// same way a growing crop fills its progress ring. HP is incremented rather than recomputed
// from scratch each tick so combat damage taken mid-construction (which can still destroy
// it — see the plain hp>0 check in the buildings filter below) isn't erased by this.
function tickConstruction(state: GameState, dt: number, playerMult: number, aiMult: number) {
  for (const b of state.buildings) {
    if (!b.constructing) continue;
    const mult = b.team === 'player' ? playerMult : aiMult;
    const prevRemaining = Math.max(0, b.constructing.timeLeft);
    b.constructing.timeLeft -= dt * mult;
    const newRemaining = Math.max(0, b.constructing.timeLeft);
    b.hp = Math.min(b.maxHp, b.hp + (b.maxHp * (prevRemaining - newRemaining)) / b.constructing.totalTime);
    if (b.constructing.timeLeft <= 0) b.constructing = null;
  }
}

function tickResearch(state: GameState, dt: number, team: Team) {
  const job = state.researching[team];
  if (!job) return;
  job.timeLeft -= dt * productionSpeedMultiplier(state, team);
  if (job.timeLeft <= 0) {
    state.tech[team] = job.tier;
    state.researching[team] = null;
  }
}

// Repairing costs coins per HP restored, draining as fast as the team can afford it up to
// REPAIR_RATE_HP_PER_SEC (itself cut to a third under a power deficit, same as every other
// building output) — it throttles itself down further (rather than pausing outright) when
// coins run low, and switches off automatically once full or unaffordable.
function tickRepairs(state: GameState, dt: number, playerMult: number, aiMult: number) {
  for (const b of state.buildings) {
    if (!b.repairing || b.hp >= b.maxHp) {
      if (b.hp >= b.maxHp) b.repairing = false;
      continue;
    }
    const mult = b.team === 'player' ? playerMult : aiMult;
    const desiredHeal = Math.min(REPAIR_RATE_HP_PER_SEC * mult * dt, b.maxHp - b.hp);
    const affordableHeal = Math.min(desiredHeal, state.resources[b.team].coins / REPAIR_COST_PER_HP);
    if (affordableHeal <= 0) {
      b.repairing = false;
      continue;
    }
    b.hp += affordableHeal;
    state.resources[b.team].coins -= affordableHeal * REPAIR_COST_PER_HP;
  }
}

function checkWin(state: GameState) {
  const playerHeart = state.buildings.find((b) => b.team === 'player' && b.kind === 'heart');
  const aiHeart = state.buildings.find((b) => b.team === 'ai' && b.kind === 'heart');
  if (playerHeart && playerHeart.hp <= 0) state.winner = 'ai';
  else if (aiHeart && aiHeart.hp <= 0) state.winner = 'player';
}

export function tick(state: GameState, dt: number) {
  if (state.winner) return;
  state.time += dt;

  tickDayNight(state.dayNight, dt);
  tickWeather(state.weather, dt);

  const mutation = activeMutation(state.weather);
  const playerBonus = teamBonuses(state, 'player');
  const aiBonus = teamBonuses(state, 'ai');

  for (const plot of state.plots) {
    const bonus = plot.team === 'player' ? playerBonus : aiBonus;
    tickPlotGrowth(plot, dt, state.dayNight.growthMultiplier * bonus.growSpeedBonus, mutation);
  }

  tickCompanionAbilities(state, dt);
  tickPlotIncome(state, dt, playerBonus.incomeBonus, aiBonus.incomeBonus);
  const playerPowerMult = productionSpeedMultiplier(state, 'player');
  const aiPowerMult = productionSpeedMultiplier(state, 'ai');
  const playerHatchMult = playerBonus.incubatorSpeedBonus * playerPowerMult;
  const aiHatchMult = aiBonus.incubatorSpeedBonus * aiPowerMult;
  tickBuildings(state, dt, playerHatchMult, aiHatchMult);
  tickConstruction(state, dt, playerPowerMult, aiPowerMult);
  tickRepairs(state, dt, playerPowerMult, aiPowerMult);
  tickResearch(state, dt, 'player');
  tickResearch(state, dt, 'ai');

  const mods = {
    dmgMult: combatDamageMultiplier(state.weather),
    speedMult: combatSpeedMultiplier(state.weather),
    atkCdMult: combatAtkCooldownMultiplier(state.weather),
  };
  for (const u of state.units) {
    if (u.hp <= 0) continue;
    tickUnitCombat(u, state.units, state.buildings, dt, mods, AGGRO_RANGE_PX);
  }
  state.units = state.units.filter((u) => u.hp > 0);
  state.selection = state.selection.filter((id) => state.units.some((u) => u.id === id));
  state.buildings = state.buildings.filter((b) => b.hp > 0 || b.kind === 'heart');
  if (state.selectedBuilding != null && !state.buildings.some((b) => b.id === state.selectedBuilding)) {
    state.selectedBuilding = null;
  }

  aiTick(state, dt);

  state.questTimer -= dt;
  if (state.questTimer <= 0) {
    state.questTimer += KELKA_QUEST_SECONDS;
    state.resources.player.crystals += KELKA_QUEST_REWARD;
  }

  const wasWinnerSet = state.winner != null;
  checkWin(state);

  // tick() short-circuits on every call once a winner is set, so this is the only chance to
  // bump hudVersion for that final frame — without the OR, the game-over modal could stay
  // hidden forever if the win happened to land between two throttled HUD updates.
  state.hudAccumulator += dt;
  if (state.hudAccumulator >= HUD_INTERVAL || (state.winner != null && !wasWinnerSet)) {
    state.hudAccumulator -= HUD_INTERVAL;
    state.hudVersion++;
  }
}
