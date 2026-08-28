import {
  AI_DIFFICULTY,
  companionRequiredTier,
  COMPANIONS,
  cropRequiredTier,
  CROPS,
  RESEARCH_COST,
  type DifficultyConfig,
  type GroveId,
} from './almanac';
import {
  cmdMergeSelection,
  cmdPlant,
  cmdResearch,
  cmdStartBuild,
  cmdStartHatch,
  computePower,
  teamBuildings,
  teamUnits,
  type GameState,
} from './state';
import type { Building } from './buildings';
import { PLAYER_LAYOUT, TILE, WORLD_HEIGHT, WORLD_WIDTH } from './world';

// Half a building's own footprint, so a placed building can't be clipped by the map edge.
const BUILD_MARGIN = TILE;

// A diamond is treated as worth ~20,000 coins purely so the AI can rank Solar Grove crops
// (which pay in diamonds) against each other and against coin crops on one scale. Only
// crops the AI can actually afford to plant right now are considered.
function bestUnlockedCropFor(state: GameState, grove: GroveId): string | null {
  const options = CROPS.filter((c) => c.grove === grove && cropRequiredTier(c) <= state.tech.ai && c.plantCost <= state.resources.ai.coins);
  if (options.length === 0) return null;
  let best = options[0];
  let bestRate = -Infinity;
  for (const c of options) {
    const rate = c.coinsPerSec + (c.diamondsPerSec ?? 0) * 20000;
    if (rate > bestRate) {
      bestRate = rate;
      best = c;
    }
  }
  return best.id;
}

// COMPANIONS is already ordered from Common to Celestial, so the strongest affordable and
// unlocked option is simply the last match.
function bestAffordableUnlockedCompanion(state: GameState): string | null {
  const options = COMPANIONS.filter((c) => companionRequiredTier(c) <= state.tech.ai && c.hatchCost <= state.resources.ai.coins);
  return options.length > 0 ? options[options.length - 1].id : null;
}

// Tries a ring of candidate spots around the Construction Yard until one is free. The Yard
// sits close to the map's top/bottom edge, so a naive 360° ring can propose a spot off the
// canvas entirely — the building would still get built there, just invisibly. Candidates
// outside the playable area are skipped rather than attempted.
function tryBuild(state: GameState, yard: Building, kind: 'incubator' | 'powerplant'): boolean {
  for (let ring = 1; ring <= 4; ring++) {
    for (let angle = 0; angle < 360; angle += 45) {
      const rad = (angle * Math.PI) / 180;
      const pos = {
        x: yard.pos.x + Math.cos(rad) * ring * TILE * 1.5,
        y: yard.pos.y + Math.sin(rad) * ring * TILE * 1.5,
      };
      if (pos.x < BUILD_MARGIN || pos.x > WORLD_WIDTH - BUILD_MARGIN || pos.y < BUILD_MARGIN || pos.y > WORLD_HEIGHT - BUILD_MARGIN) continue;
      const before = state.buildings.length;
      cmdStartBuild(state, 'ai', kind, pos);
      if (state.buildings.length > before) return true;
    }
  }
  return false;
}

// The "strategic" calls a human takes time to think about: what to build, when to research,
// which companion to hatch. Gated by the difficulty's decision interval + skip chance so
// Easy/Medium AIs visibly lag a human-paced player instead of reacting every tick.
function runStrategicDecision(state: GameState) {
  const yard = teamBuildings(state, 'ai').find((b) => b.kind === 'yard' && !b.constructing);
  if (!yard) return;

  // A Power Plant is the one thing buildable at a deficit, so it has to come first — the
  // Yard's own draw means the AI starts in the hole just like the player does.
  if (computePower(state, 'ai') < 0) {
    tryBuild(state, yard, 'powerplant');
    return;
  }

  const incubators = teamBuildings(state, 'ai').filter((b) => b.kind === 'incubator');
  if (incubators.length === 0) {
    tryBuild(state, yard, 'incubator');
    return;
  }

  if (state.tech.ai < 4 && !state.researching.ai) {
    const nextTier = (state.tech.ai + 1) as 2 | 3 | 4;
    const cost = RESEARCH_COST[nextTier];
    // Keep a coin buffer so research doesn't starve the AI's ability to keep hatching.
    if (state.resources.ai.coins >= cost.coins * 1.5) {
      cmdResearch(state, 'ai');
      return;
    }
  }

  const idleIncubator = incubators.find((b) => !b.hatching && !b.constructing);
  if (idleIncubator) {
    const pick = bestAffordableUnlockedCompanion(state);
    if (pick) cmdStartHatch(state, 'ai', idleIncubator.id, pick);
  }
}

export function aiTick(state: GameState, dt: number) {
  const cfg: DifficultyConfig = AI_DIFFICULTY[state.difficulty];
  const ai = state.aiState;
  // A human plants and merges one thing at a time, not a whole field in one instant — pace
  // scales with difficulty (medium's decisionInterval is the 1x baseline) same as the
  // strategic decisions below, so Easy is visibly slower to fill its farm than Hard.
  const pace = cfg.decisionInterval / 3;

  ai.plantCooldown -= dt;
  if (ai.plantCooldown <= 0) {
    ai.plantCooldown = 2 * pace;
    const plot = state.plots.find((p) => p.team === 'ai' && !p.cropId);
    if (plot) {
      const crop = bestUnlockedCropFor(state, plot.grove);
      if (crop) cmdPlant(state, 'ai', plot.id, crop);
    }
  }

  ai.mergeCooldown -= dt;
  if (ai.mergeCooldown <= 0) {
    ai.mergeCooldown = 3 * pace;
    const groups = new Map<string, number[]>();
    for (const u of teamUnits(state, 'ai')) {
      if (u.mergeTier >= 2) continue;
      const key = `${u.companionId}:${u.mergeTier}`;
      const arr = groups.get(key) ?? [];
      arr.push(u.id);
      groups.set(key, arr);
    }
    for (const ids of groups.values()) {
      if (ids.length >= 4) {
        cmdMergeSelection(state, 'ai', ids.slice(0, 4));
        break;
      }
    }
  }

  ai.decisionCooldown -= dt;
  if (ai.decisionCooldown <= 0) {
    ai.decisionCooldown = cfg.decisionInterval;
    if (Math.random() >= cfg.skipChance) runStrategicDecision(state);
  }

  ai.attackCooldown -= dt;
  if (ai.attackCooldown <= 0) {
    const army = teamUnits(state, 'ai');
    const power = army.reduce((s, u) => s + u.hp + u.attack * 5, 0);
    if (power >= ai.attackThreshold && army.length > 0) {
      for (const u of army) {
        u.command = 'attackMove';
        u.dest = PLAYER_LAYOUT.heart.pos;
        u.attackTargetId = null;
      }
      ai.attackThreshold *= 1.4;
      ai.attackCooldown = cfg.attackCooldown;
    } else {
      ai.attackCooldown = 3;
    }
  }
}
