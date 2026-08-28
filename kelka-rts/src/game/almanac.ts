// The Kelka Almanac — static reference data transcribed from the world's field guide.
// Crop grow times, sell values, mutation multipliers, companion abilities and the Merge
// Rite are all taken verbatim from the lore doc. Combat stats (hp/attack/range/speed) and
// hatch costs are new — the Almanac has no military layer, so those are hand-authored here
// to fit a real-time match instead of an idle-game economy.

export type Rarity =
  | 'Common'
  | 'Uncommon'
  | 'Rare'
  | 'Epic'
  | 'Mythic'
  | 'Legendary'
  | 'Divine'
  | 'Celestial';

export const RARITY_ORDER: Rarity[] = [
  'Common',
  'Uncommon',
  'Rare',
  'Epic',
  'Mythic',
  'Legendary',
  'Divine',
  'Celestial',
];

export type GroveId = 'field' | 'lunar' | 'solar';

export const GROVE_NAME: Record<GroveId, string> = {
  field: 'The Common Fields',
  lunar: 'The Lunar Grove',
  solar: 'The Solar Grove',
};

export interface CropDef {
  id: string;
  name: string;
  emoji: string;
  rarity: Rarity;
  grove: GroveId;
  growSeconds: number;
  coinValue: number;
  diamondValue?: number;
  persistent?: boolean;
  // Once a plot matures it earns passively forever instead of needing a manual harvest —
  // these are the actual gameplay rates. They track coinValue/growSeconds (the same total
  // value, just delivered as a smooth trickle) EXCEPT for the Solar Grove, whose raw
  // Almanac numbers were tuned for an idle mobile game measured in hours; taken literally
  // as a rate they'd hit 3,000/sec and print infinite money in seconds, so they're hand-capped
  // here to top out at a reasonable multiple of the Lunar Grove instead. coinValue/diamondValue
  // above are kept as the canonical Almanac figures for reference/flavor only.
  coinsPerSec: number;
  diamondsPerSec?: number;
  // Seed cost, paid up front when planting (or replanting) — roughly half of what the crop
  // earns back over one full grow cycle, so a garden can't be filled with high-tier crops
  // faster than the coins to pay for them come in.
  plantCost: number;
}

export const CROPS: CropDef[] = [
  // The Common Fields
  { id: 'cucumber', name: 'Cucumber', emoji: '🥒', rarity: 'Common', grove: 'field', growSeconds: 15, coinValue: 16, coinsPerSec: 1, plantCost: 8 },
  { id: 'tomato', name: 'Tomato', emoji: '🍅', rarity: 'Uncommon', grove: 'field', growSeconds: 25, coinValue: 48, coinsPerSec: 2, plantCost: 25 },
  { id: 'carrot', name: 'Carrot', emoji: '🥕', rarity: 'Rare', grove: 'field', growSeconds: 35, coinValue: 100, coinsPerSec: 3, plantCost: 53 },
  { id: 'corn', name: 'Corn', emoji: '🌽', rarity: 'Epic', grove: 'field', growSeconds: 45, coinValue: 200, coinsPerSec: 5, plantCost: 113 },
  { id: 'strawberry', name: 'Strawberry', emoji: '🍓', rarity: 'Mythic', grove: 'field', growSeconds: 60, coinValue: 420, persistent: true, coinsPerSec: 7, plantCost: 210 },
  { id: 'watermelon', name: 'Watermelon', emoji: '🍉', rarity: 'Legendary', grove: 'field', growSeconds: 90, coinValue: 850, persistent: true, coinsPerSec: 9, plantCost: 405 },
  { id: 'grapes', name: 'Grapes', emoji: '🍇', rarity: 'Divine', grove: 'field', growSeconds: 120, coinValue: 1800, persistent: true, coinsPerSec: 15, plantCost: 900 },
  { id: 'dragonfruit', name: 'Dragon Fruit', emoji: '🐉', rarity: 'Celestial', grove: 'field', growSeconds: 180, coinValue: 4800, persistent: true, coinsPerSec: 25, plantCost: 2250 },
  // The Lunar Grove
  { id: 'moondew', name: 'Moondew Melon', emoji: '🍈', rarity: 'Common', grove: 'lunar', growSeconds: 40, coinValue: 150, coinsPerSec: 4, plantCost: 80 },
  { id: 'lunargrape', name: 'Lunar Grape', emoji: '🍇', rarity: 'Uncommon', grove: 'lunar', growSeconds: 55, coinValue: 400, coinsPerSec: 7, plantCost: 193 },
  { id: 'crescentmango', name: 'Crescent Mango', emoji: '🥭', rarity: 'Rare', grove: 'lunar', growSeconds: 75, coinValue: 900, persistent: true, coinsPerSec: 12, plantCost: 450 },
  { id: 'eclipsekiwi', name: 'Eclipse Kiwi', emoji: '🥝', rarity: 'Epic', grove: 'lunar', growSeconds: 100, coinValue: 2200, persistent: true, coinsPerSec: 22, plantCost: 1100 },
  { id: 'nebulacherry', name: 'Nebula Cherry', emoji: '🍒', rarity: 'Mythic', grove: 'lunar', growSeconds: 140, coinValue: 6000, persistent: true, coinsPerSec: 40, plantCost: 2800 },
  { id: 'moonblossom', name: 'Moon Blossom', emoji: '🌙', rarity: 'Legendary', grove: 'lunar', growSeconds: 200, coinValue: 20000, persistent: true, coinsPerSec: 65, plantCost: 6500 },
  // The Solar Grove
  { id: 'solsticepeach', name: 'Solstice Peach', emoji: '🍑', rarity: 'Common', grove: 'solar', growSeconds: 40, coinValue: 23000, coinsPerSec: 40, plantCost: 800 },
  { id: 'radiantlemon', name: 'Radiant Lemon', emoji: '🍋', rarity: 'Uncommon', grove: 'solar', growSeconds: 55, coinValue: 55000, coinsPerSec: 70, plantCost: 1925 },
  { id: 'blazingpineapple', name: 'Blazing Pineapple', emoji: '🍍', rarity: 'Rare', grove: 'solar', growSeconds: 75, coinValue: 120000, persistent: true, coinsPerSec: 110, plantCost: 4125 },
  { id: 'coronaorange', name: 'Corona Orange', emoji: '🍊', rarity: 'Epic', grove: 'solar', growSeconds: 100, coinValue: 300000, persistent: true, coinsPerSec: 180, plantCost: 9000 },
  { id: 'phoenixsunflower', name: 'Phoenix Sunflower', emoji: '🌻', rarity: 'Mythic', grove: 'solar', growSeconds: 140, coinValue: 0, diamondValue: 1, persistent: true, coinsPerSec: 0, diamondsPerSec: 0.02, plantCost: 3000 },
  { id: 'sunblossom', name: 'Sun Blossom', emoji: '☀️', rarity: 'Legendary', grove: 'solar', growSeconds: 200, coinValue: 0, diamondValue: 2, persistent: true, coinsPerSec: 0, diamondsPerSec: 0.03, plantCost: 8000 },
];

export function cropById(id: string): CropDef {
  const c = CROPS.find((c) => c.id === id);
  if (!c) throw new Error(`Unknown crop ${id}`);
  return c;
}

// ---- Tech tree ----
//
// A crop's `rarity` label is scoped to its own grove, not a global power level — Solar
// Grove's "Common" Solstice Peach (23,000 coins) is nowhere near as weak as Field's Common
// Cucumber (16 coins). So crops are gated by TWO things: whether their whole grove is
// unlocked yet, and how far up that grove's own list they sit. Companions genuinely do
// share one universal ladder in the lore, so they're gated by RARITY_ORDER alone.
export type TechTier = 1 | 2 | 3 | 4;

export const TECH_TIERS: TechTier[] = [1, 2, 3, 4];

export const GROVE_UNLOCK_TIER: Record<GroveId, TechTier> = {
  field: 1,
  lunar: 2,
  solar: 3,
};

export const RESEARCH_COST: Record<2 | 3 | 4, { coins: number; seconds: number }> = {
  2: { coins: 300, seconds: 20 },
  3: { coins: 4000, seconds: 40 },
  4: { coins: 40000, seconds: 60 },
};

// Tier N unlocks list-positions 2*(N-1) and 2*(N-1)+1 within that crop's own grove list.
export function cropListTier(crop: CropDef): TechTier {
  const list = CROPS.filter((c) => c.grove === crop.grove);
  const idx = list.findIndex((c) => c.id === crop.id);
  return Math.min(4, Math.floor(idx / 2) + 1) as TechTier;
}

export function cropRequiredTier(crop: CropDef): TechTier {
  return Math.max(GROVE_UNLOCK_TIER[crop.grove], cropListTier(crop)) as TechTier;
}

// Tier1 = Common/Uncommon, Tier2 = Rare/Epic, Tier3 = Mythic/Legendary, Tier4 = Divine/Celestial.
export function companionRequiredTier(def: CompanionDef): TechTier {
  return (Math.floor(RARITY_ORDER.indexOf(def.rarity) / 2) + 1) as TechTier;
}

export const MERGE_TIER_NAME = ['Base', 'Empowered', 'Tenacious'] as const;
export const MERGE_TIER_MULTIPLIER = [1, 2.5, 5] as const;

export interface CompanionDef {
  id: string;
  name: string;
  emoji: string;
  rarity: Rarity;
  ability: string;
  hatchCost: number;
  hp: number;
  attack: number;
  range: number; // tiles
  atkCooldown: number; // seconds
  moveSpeed: number; // tiles/sec
}

export const COMPANIONS: CompanionDef[] = [
  { id: 'chick', name: 'Chick', emoji: '🐥', rarity: 'Common', ability: 'Income +3%', hatchCost: 40, hp: 20, attack: 3, range: 1, atkCooldown: 1.2, moveSpeed: 1.4 },
  { id: 'bunny', name: 'Bunny', emoji: '🐰', rarity: 'Uncommon', ability: 'Incubator Speed +3%', hatchCost: 120, hp: 26, attack: 4, range: 1, atkCooldown: 1.1, moveSpeed: 1.8 },
  { id: 'fox', name: 'Fox', emoji: '🦊', rarity: 'Rare', ability: 'Income +8%', hatchCost: 300, hp: 40, attack: 8, range: 1, atkCooldown: 1.0, moveSpeed: 1.6 },
  { id: 'owl', name: 'Owl', emoji: '🦉', rarity: 'Epic', ability: 'Incubator Speed +6%', hatchCost: 800, hp: 34, attack: 6, range: 3, atkCooldown: 1.3, moveSpeed: 1.3 },
  { id: 'panda', name: 'Panda', emoji: '🐼', rarity: 'Mythic', ability: 'Income +10%', hatchCost: 2500, hp: 70, attack: 10, range: 1, atkCooldown: 1.4, moveSpeed: 1.0 },
  { id: 'phoenixchick', name: 'Phoenix Chick', emoji: '🐣', rarity: 'Legendary', ability: 'Grow Speed +10%', hatchCost: 8000, hp: 55, attack: 9, range: 3, atkCooldown: 1.0, moveSpeed: 1.5 },
  { id: 'unicorn', name: 'Unicorn', emoji: '🦄', rarity: 'Divine', ability: 'Income +18%. In rain: 18% chance per planting to grant Rainbow.', hatchCost: 30000, hp: 90, attack: 14, range: 1, atkCooldown: 0.9, moveSpeed: 1.7 },
  { id: 'babydragon', name: 'Baby Dragon', emoji: '🐲', rarity: 'Celestial', ability: 'Grow Speed +18%. Instantly finishes growing one crop/min.', hatchCost: 100000, hp: 160, attack: 28, range: 2, atkCooldown: 0.8, moveSpeed: 1.4 },
];

export function companionById(id: string): CompanionDef {
  const c = COMPANIONS.find((c) => c.id === id);
  if (!c) throw new Error(`Unknown companion ${id}`);
  return c;
}

// Percentage abilities (Income / Incubator Speed / Grow Speed) scale with merge tier like
// any other stat. Fox's ability was originally "Auto-harvests 1 ready crop/min" in the
// Almanac, but a mature plot now earns passively on its own with nothing to harvest — it's
// adapted here into a flat Income bonus, the closest equivalent to "helps the money flow."
export const COMPANION_PERCENT_ABILITIES: Record<string, { income?: number; incubator?: number; grow?: number }> = {
  chick: { income: 3 },
  bunny: { incubator: 3 },
  fox: { income: 8 },
  owl: { incubator: 6 },
  panda: { income: 10 },
  phoenixchick: { grow: 10 },
  unicorn: { income: 18 },
  babydragon: { grow: 18 },
};

export function hatchSeconds(def: CompanionDef): number {
  return 6 + RARITY_ORDER.indexOf(def.rarity) * 3;
}

export const MERGE_SECONDS = 5;

export type MutationId = 'scorched' | 'frozen' | 'wet' | 'charged' | 'lunar' | 'rainbow';

export interface MutationDef {
  id: MutationId;
  name: string;
  emoji: string;
  multiplier: number;
  axis: 'temp' | 'sky';
}

export const MUTATIONS: Record<MutationId, MutationDef> = {
  scorched: { id: 'scorched', name: 'Scorched', emoji: '🔥', multiplier: 1.5, axis: 'temp' },
  frozen: { id: 'frozen', name: 'Frozen', emoji: '❄️', multiplier: 1.8, axis: 'temp' },
  wet: { id: 'wet', name: 'Wet', emoji: '💧', multiplier: 1.3, axis: 'sky' },
  charged: { id: 'charged', name: 'Charged', emoji: '⚡', multiplier: 2.2, axis: 'sky' },
  lunar: { id: 'lunar', name: 'Lunar', emoji: '🌙', multiplier: 1.2, axis: 'sky' },
  rainbow: { id: 'rainbow', name: 'Rainbow', emoji: '🌈', multiplier: 2.8, axis: 'sky' },
};

export const TEMP_ROLLS: MutationId[] = ['scorched', 'frozen'];
export const SKY_ROLLS: MutationId[] = ['wet', 'charged', 'lunar', 'rainbow'];

export const WEATHER_ROLL_SECONDS = 90;
export const DAY_SECONDS = 240;
export const NIGHT_SECONDS = 60;
export const DAY_GROWTH_MULTIPLIER = 2;
export const NIGHT_GROWTH_MULTIPLIER = 1;

export interface ToolDef {
  id: string;
  name: string;
  emoji: string;
  maxLevel: number;
  description: string;
  costForLevel: (level: number) => number; // cost to buy this level (1-based)
  implemented: boolean;
  // What the CURRENT level is actually doing, in concrete terms — a 7% grow-time cut per
  // level is real but easy to miss next to the day/night (2x) and weather (up to 2.8x)
  // swings, so the UI shows this instead of leaving the player to infer it from "Lv.3/5".
  effectLabel?: (level: number) => string;
}

export const TOOLS: ToolDef[] = [
  {
    id: 'wateringcan',
    name: 'Watering Can',
    emoji: '💧',
    maxLevel: 5,
    description: 'Boosts income from your planted crops by 7% per level (up to +35%).',
    costForLevel: (level) => 80 * level * level,
    implemented: true,
    effectLabel: (level) => (level === 0 ? 'no bonus yet' : `+${Math.round(WATERING_CAN_PER_LEVEL * level * 100)}% crop income now`),
  },
  {
    id: 'fertilizer',
    name: 'Fertilizer Bag',
    emoji: '🧪',
    maxLevel: 5,
    description: 'Boosts sale price. Coming soon.',
    costForLevel: (level) => 80 * level * level,
    implemented: false,
  },
  {
    id: 'expansion',
    name: 'Garden Expansion',
    emoji: '🟫',
    maxLevel: 8,
    description: 'Extends the plot by one row. Coming soon.',
    costForLevel: (level) => 200 * level,
    implemented: false,
  },
  {
    id: 'reclaimer',
    name: 'Reclaimer',
    emoji: '🧲',
    maxLevel: 1,
    description: 'Dig up a planted seed without losing it. Coming soon.',
    costForLevel: () => 500,
    implemented: false,
  },
  {
    id: 'trowel',
    name: 'Trowel',
    emoji: '🛠️',
    maxLevel: 1,
    description: 'Relocate a planting without resetting growth. Coming soon.',
    costForLevel: () => 500,
    implemented: false,
  },
];

export function toolById(id: string): ToolDef {
  const t = TOOLS.find((t) => t.id === id);
  if (!t) throw new Error(`Unknown tool ${id}`);
  return t;
}

export const WATERING_CAN_PER_LEVEL = 0.07;

export const GARDEN_HEART_HP = 500;
export const INCUBATOR_HP = 150;
export const YARD_HP = 400;
export const POWER_PLANT_HP = 120;

export const KELKA_QUEST_SECONDS = 60;
export const KELKA_QUEST_REWARD = 5;
export const HASTE_COST_CRYSTALS = 3;

export const AGGRO_RANGE_TILES = 3;

export const REPAIR_COST_PER_HP = 1;
export const REPAIR_RATE_HP_PER_SEC = 20;

// ---- Power & Construction ----
//
// New military-era layer, styled after classic base-builders. The Construction Yard is
// where new buildings go up, but generates no power of its own — every building (including
// the Yard itself) draws power just by existing, and the Power Plant is the only generator.
// That makes it mandatory: at kickoff the Yard's own draw already puts you at a deficit, and
// building anything else (the Incubator included) is blocked until a Power Plant clears it.
export const YARD_POWER_DRAW = 15;
export const POWER_PLANT_POWER = 100;
export const POWER_PLANT_COST = 300;
export const POWER_PLANT_BUILD_SECONDS = 15;
export const INCUBATOR_COST = 250;
export const INCUBATOR_BUILD_SECONDS = 12;
export const INCUBATOR_POWER_DRAW = 25;
export const RESEARCH_POWER_DRAW = 25;
export const MAX_INCUBATORS = 2;
export const CONSTRUCTION_RANGE_TILES = 6;
// A lost Construction Yard would otherwise be a dead end — every other building needs one
// to build from — so it's rebuildable too, anchored off the Garden Heart instead (the one
// structure that survives until the match actually ends), and exempt from the power gate
// below like the Power Plant is, so a deficit can't lock the recovery path either.
export const YARD_COST = 400;
export const YARD_BUILD_SECONDS = 20;
// "3 times slower" under a power deficit — applied to hatching, research, construction, and
// repair alike.
export const LOW_POWER_THROTTLE = 1 / 3;

// ---- AI difficulty ----
export type Difficulty = 'easy' | 'medium' | 'hard';

export interface DifficultyConfig {
  decisionInterval: number;
  skipChance: number;
  attackThresholdBase: number;
  attackCooldown: number;
}

export const AI_DIFFICULTY: Record<Difficulty, DifficultyConfig> = {
  easy: { decisionInterval: 6, skipChance: 0.35, attackThresholdBase: 220, attackCooldown: 40 },
  medium: { decisionInterval: 3, skipChance: 0.1, attackThresholdBase: 120, attackCooldown: 25 },
  hard: { decisionInterval: 1.5, skipChance: 0, attackThresholdBase: 70, attackCooldown: 15 },
};
