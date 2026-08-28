import {
  AI_DIFFICULTY,
  companionById,
  companionRequiredTier,
  COMPANION_PERCENT_ABILITIES,
  CONSTRUCTION_RANGE_TILES,
  cropById,
  cropRequiredTier,
  hatchSeconds,
  HASTE_COST_CRYSTALS,
  INCUBATOR_BUILD_SECONDS,
  INCUBATOR_COST,
  KELKA_QUEST_SECONDS,
  LOW_POWER_THROTTLE,
  MAX_INCUBATORS,
  MERGE_TIER_MULTIPLIER,
  POWER_PLANT_BUILD_SECONDS,
  POWER_PLANT_COST,
  RESEARCH_COST,
  RESEARCH_POWER_DRAW,
  toolById,
  WATERING_CAN_PER_LEVEL,
  type Difficulty,
  type TechTier,
} from './almanac';
import { createBuilding, powerFor, type Building } from './buildings';

export type ConstructibleKind = 'incubator' | 'powerplant';
import { createDayNight, createWeather, type DayNightState, type WeatherState } from './weather';
import { createPlot, hasteCrop, plantCrop, type Plot } from './economy';
import { createUnit, distance, type Unit } from './units';
import { AI_LAYOUT, PLAYER_LAYOUT, TILE } from './world';
import type { EntityId, Resources, Team, Vec2 } from './types';

export interface ResearchJob {
  tier: 2 | 3 | 4;
  timeLeft: number;
  totalTime: number;
}

export interface GameState {
  time: number;
  nextId: number;
  dayNight: DayNightState;
  weather: WeatherState;
  resources: Record<Team, Resources>;
  tools: Record<Team, Record<string, number>>;
  tech: Record<Team, TechTier>;
  researching: Record<Team, ResearchJob | null>;
  plots: Plot[];
  buildings: Building[];
  units: Unit[];
  selection: EntityId[];
  selectedBuilding: EntityId | null;
  pendingPlant: string | null;
  pendingHatch: string | null;
  pendingHaste: boolean;
  pendingBuild: ConstructibleKind | null;
  questTimer: number;
  message: string | null;
  winner: Team | null;
  hudVersion: number;
  hudAccumulator: number;
  difficulty: Difficulty;
  aiState: { plantCooldown: number; mergeCooldown: number; decisionCooldown: number; attackCooldown: number; attackThreshold: number };
}

function initialResources(): Resources {
  return { coins: 200, diamonds: 0, crystals: 0 };
}

function initialTools(): Record<string, number> {
  return { wateringcan: 0, fertilizer: 0, expansion: 0, reclaimer: 0, trowel: 0 };
}

export function createInitialState(difficulty: Difficulty = 'medium'): GameState {
  const state: GameState = {
    time: 0,
    nextId: 1,
    dayNight: createDayNight(),
    weather: createWeather(),
    resources: { player: initialResources(), ai: initialResources() },
    tools: { player: initialTools(), ai: initialTools() },
    tech: { player: 1, ai: 1 },
    researching: { player: null, ai: null },
    plots: [],
    buildings: [],
    units: [],
    selection: [],
    selectedBuilding: null,
    pendingPlant: null,
    pendingHatch: null,
    pendingHaste: false,
    pendingBuild: null,
    questTimer: KELKA_QUEST_SECONDS,
    message: null,
    winner: null,
    hudVersion: 0,
    hudAccumulator: 0,
    difficulty,
    aiState: { plantCooldown: 2, mergeCooldown: 3, decisionCooldown: 1, attackCooldown: 20, attackThreshold: AI_DIFFICULTY[difficulty].attackThresholdBase },
  };

  for (const layout of [PLAYER_LAYOUT, AI_LAYOUT]) {
    for (const slot of layout.plots) state.plots.push(createPlot(slot));
    state.buildings.push(createBuilding(state.nextId++, layout.team, 'heart', layout.heart.pos));
    state.buildings.push(createBuilding(state.nextId++, layout.team, 'yard', layout.yard.pos));
  }

  return state;
}

export function findPlot(state: GameState, plotId: string): Plot | undefined {
  return state.plots.find((p) => p.id === plotId);
}

export function findBuilding(state: GameState, id: EntityId): Building | undefined {
  return state.buildings.find((b) => b.id === id);
}

export function teamUnits(state: GameState, team: Team): Unit[] {
  return state.units.filter((u) => u.team === team && u.hp > 0);
}

export function teamBonuses(state: GameState, team: Team) {
  // Watering Can boosts income on whatever's currently planted, rather than grow speed —
  // that way it stays useful (and visible) for the whole match instead of only mattering
  // during the increasingly small window before a plot matures.
  let incomeBonus = 1 + WATERING_CAN_PER_LEVEL * (state.tools[team].wateringcan ?? 0);
  let incubatorSpeedBonus = 1;
  let growSpeedBonus = 1;
  for (const u of teamUnits(state, team)) {
    const abilities = COMPANION_PERCENT_ABILITIES[u.companionId];
    if (!abilities) continue;
    const mult = MERGE_TIER_MULTIPLIER[u.mergeTier];
    if (abilities.income) incomeBonus += (abilities.income * mult) / 100;
    if (abilities.incubator) incubatorSpeedBonus += (abilities.incubator * mult) / 100;
    if (abilities.grow) growSpeedBonus += (abilities.grow * mult) / 100;
  }
  return { incomeBonus, incubatorSpeedBonus, growSpeedBonus };
}

export function addResources(state: GameState, team: Team, coins: number, diamonds: number) {
  state.resources[team].coins += coins;
  state.resources[team].diamonds += diamonds;
}

export function teamBuildings(state: GameState, team: Team): Building[] {
  return state.buildings.filter((b) => b.team === team && b.hp > 0);
}

// Only fully-built structures contribute power; one under construction draws nothing yet.
export function computePower(state: GameState, team: Team): number {
  let net = teamBuildings(state, team)
    .filter((b) => !b.constructing)
    .reduce((sum, b) => sum + powerFor(b.kind), 0);
  if (state.researching[team]) net -= RESEARCH_POWER_DRAW;
  return net;
}

export function productionSpeedMultiplier(state: GameState, team: Team): number {
  return computePower(state, team) < 0 ? LOW_POWER_THROTTLE : 1;
}

// ---- Commands ----

export function setPendingPlant(state: GameState, cropId: string | null) {
  state.pendingPlant = cropId;
  state.pendingHatch = null;
  state.pendingHaste = false;
  state.pendingBuild = null;
}

export function setPendingHatch(state: GameState, companionId: string | null) {
  state.pendingHatch = companionId;
  state.pendingPlant = null;
  state.pendingHaste = false;
  state.pendingBuild = null;
}

export function setPendingHaste(state: GameState, value: boolean) {
  state.pendingHaste = value;
  if (value) {
    state.pendingPlant = null;
    state.pendingHatch = null;
    state.pendingBuild = null;
  }
}

export function setPendingBuild(state: GameState, kind: ConstructibleKind | null) {
  state.pendingBuild = kind;
  if (kind) {
    state.pendingPlant = null;
    state.pendingHatch = null;
    state.pendingHaste = false;
  }
}

export function cmdPlant(state: GameState, team: Team, plotId: string, cropId: string) {
  const plot = findPlot(state, plotId);
  if (!plot || plot.team !== team) return;
  const def = cropById(cropId);
  if (cropRequiredTier(def) > state.tech[team]) return;
  if (state.resources[team].coins < def.plantCost) return;
  const planted = plantCrop(plot, cropId);
  if (!planted) return;
  state.resources[team].coins -= def.plantCost;
  // Unicorn: 18% chance per planting to grant Rainbow while it's raining (Wet sky).
  if (state.weather.sky === 'wet') {
    const hasUnicorn = teamUnits(state, team).some((u) => u.companionId === 'unicorn');
    if (hasUnicorn && Math.random() < 0.18) plot.mutation = 'rainbow';
  }
  // Deliberately left selected — planting a whole row shouldn't require reselecting the
  // crop after every click. Cleared only by picking something else or right-clicking.
}

export function cmdHaste(state: GameState, team: Team, plotId: string) {
  const plot = findPlot(state, plotId);
  if (!plot || plot.team !== team) return;
  if (state.resources[team].crystals < HASTE_COST_CRYSTALS) return;
  if (hasteCrop(plot, state.weather.sky ?? state.weather.temp)) {
    state.resources[team].crystals -= HASTE_COST_CRYSTALS;
  }
}

export function cmdStartHatch(state: GameState, team: Team, buildingId: EntityId, companionId: string) {
  const building = findBuilding(state, buildingId);
  if (!building || building.team !== team || building.kind !== 'incubator' || building.constructing) return;
  if (building.hatching) return;
  const def = companionById(companionId);
  if (companionRequiredTier(def) > state.tech[team]) return;
  if (state.resources[team].coins < def.hatchCost) return;
  state.resources[team].coins -= def.hatchCost;
  building.hatching = { companionId, timeLeft: hatchSeconds(def), totalTime: hatchSeconds(def) };
  if (team === 'player') state.pendingHatch = null;
}

export function cmdResearch(state: GameState, team: Team) {
  if (state.researching[team]) return;
  const nextTier = (state.tech[team] + 1) as 2 | 3 | 4;
  if (nextTier > 4) return;
  const yard = teamBuildings(state, team).find((b) => b.kind === 'yard' && !b.constructing);
  if (!yard) return;
  const cost = RESEARCH_COST[nextTier];
  if (state.resources[team].coins < cost.coins) return;
  state.resources[team].coins -= cost.coins;
  state.researching[team] = { tier: nextTier, timeLeft: cost.seconds, totalTime: cost.seconds };
}

export function cmdStartBuild(state: GameState, team: Team, kind: ConstructibleKind, pos: Vec2) {
  const yard = teamBuildings(state, team).find((b) => b.kind === 'yard' && !b.constructing);
  if (!yard) return;
  // A Power Plant is the one thing you can always build — it's the way out of a deficit.
  // Everything else needs the grid already in the black, which is what makes the Power
  // Plant mandatory: the Yard's own draw alone starts a match at a deficit.
  if (kind !== 'powerplant' && computePower(state, team) < 0) return;
  if (distance(pos, yard.pos) > CONSTRUCTION_RANGE_TILES * TILE) return;

  const overlapsPlot = state.plots.some((p) => distance(p.pos, pos) < TILE);
  const overlapsBuilding = state.buildings.some((b) => b.hp > 0 && distance(b.pos, pos) < TILE * 1.6);
  if (overlapsPlot || overlapsBuilding) return;

  if (kind === 'incubator') {
    const count = teamBuildings(state, team).filter((b) => b.kind === 'incubator').length;
    if (count >= MAX_INCUBATORS) return;
  }

  const cost = kind === 'incubator' ? INCUBATOR_COST : POWER_PLANT_COST;
  const buildSeconds = kind === 'incubator' ? INCUBATOR_BUILD_SECONDS : POWER_PLANT_BUILD_SECONDS;
  if (state.resources[team].coins < cost) return;
  state.resources[team].coins -= cost;
  state.buildings.push(createBuilding(state.nextId++, team, kind, pos, true, buildSeconds));
  if (team === 'player') state.pendingBuild = null;
}

export function cmdMergeSelection(state: GameState, team: Team, unitIds: EntityId[]) {
  if (unitIds.length !== 4) return;
  const units = unitIds.map((id) => state.units.find((u) => u.id === id)).filter((u): u is Unit => !!u && u.hp > 0 && u.team === team);
  if (units.length !== 4) return;
  const companionId = units[0].companionId;
  const tier = units[0].mergeTier;
  if (tier >= 2) return;
  if (!units.every((u) => u.companionId === companionId && u.mergeTier === tier)) return;

  const cx = units.reduce((s, u) => s + u.pos.x, 0) / 4;
  const cy = units.reduce((s, u) => s + u.pos.y, 0) / 4;
  for (const u of units) u.hp = 0; // mark dead, cleaned up by engine tick
  const newUnit = createUnit(state.nextId++, team, companionId, (tier + 1) as 1 | 2, { x: cx, y: cy });
  state.units.push(newUnit);
  state.selection = state.selection.filter((id) => !unitIds.includes(id));
}

// Merges every complete quartet of the given companion/tier found within the CURRENT
// selection — so drag-selecting a big mixed army and hitting one button levels up as much
// of it as qualifies, rather than requiring the player to hand-pick exactly 4 at a time.
export function cmdMergeGroup(state: GameState, team: Team, companionId: string, mergeTier: 0 | 1) {
  const eligible = state.selection
    .map((id) => state.units.find((u) => u.id === id))
    .filter((u): u is Unit => !!u && u.hp > 0 && u.team === team && u.companionId === companionId && u.mergeTier === mergeTier);
  const batches = Math.floor(eligible.length / 4);
  for (let i = 0; i < batches; i++) {
    cmdMergeSelection(
      state,
      team,
      eligible.slice(i * 4, i * 4 + 4).map((u) => u.id)
    );
  }
}

export function cmdSelectUnits(state: GameState, ids: EntityId[]) {
  for (const u of state.units) u.selected = false;
  const valid = ids.filter((id) => state.units.some((u) => u.id === id && u.team === 'player' && u.hp > 0));
  for (const id of valid) {
    const u = state.units.find((u) => u.id === id);
    if (u) u.selected = true;
  }
  state.selection = valid;
  state.selectedBuilding = null;
}

export function cmdSelectBuilding(state: GameState, buildingId: EntityId) {
  const building = findBuilding(state, buildingId);
  if (!building || building.team !== 'player') return;
  cmdSelectUnits(state, []);
  state.selectedBuilding = buildingId;
}

export function cmdToggleRepair(state: GameState, buildingId: EntityId) {
  const building = findBuilding(state, buildingId);
  if (!building || building.team !== 'player' || building.constructing) return;
  if (building.hp >= building.maxHp) {
    building.repairing = false;
  } else {
    building.repairing = !building.repairing;
  }
}

// Right-click (or any other "back out" gesture) cancels whatever the player is mid-way
// through, rather than falling through to a move/attack command.
export function cancelPendingAction(state: GameState): boolean {
  const hadPending = !!(state.pendingPlant || state.pendingHatch || state.pendingBuild || state.pendingHaste || state.selectedBuilding);
  state.pendingPlant = null;
  state.pendingHatch = null;
  state.pendingBuild = null;
  state.pendingHaste = false;
  state.selectedBuilding = null;
  return hadPending;
}

export function cmdMove(state: GameState, unitIds: EntityId[], dest: Vec2) {
  for (const id of unitIds) {
    const u = state.units.find((u) => u.id === id && u.team === 'player');
    if (!u) continue;
    u.command = 'move';
    u.dest = dest;
    u.attackTargetId = null;
  }
}

export function cmdAttackMove(state: GameState, unitIds: EntityId[], dest: Vec2, targetId: EntityId | null, targetIsBuilding: boolean) {
  for (const id of unitIds) {
    const u = state.units.find((u) => u.id === id && u.team === 'player');
    if (!u) continue;
    if (targetId != null) {
      u.command = 'attack';
      u.attackTargetId = targetId;
      u.attackTargetIsBuilding = targetIsBuilding;
      u.dest = null;
    } else {
      u.command = 'attackMove';
      u.dest = dest;
      u.attackTargetId = null;
    }
  }
}

export function cmdBuyTool(state: GameState, team: Team, toolId: string) {
  const def = toolById(toolId);
  if (!def.implemented) return;
  const level = state.tools[team][toolId] ?? 0;
  if (level >= def.maxLevel) return;
  const cost = def.costForLevel(level + 1);
  if (state.resources[team].coins < cost) return;
  state.resources[team].coins -= cost;
  state.tools[team][toolId] = level + 1;
}

export function cropDefSafe(id: string | null) {
  return id ? cropById(id) : null;
}
