import {
  DAY_GROWTH_MULTIPLIER,
  DAY_SECONDS,
  NIGHT_GROWTH_MULTIPLIER,
  NIGHT_SECONDS,
  SKY_ROLLS,
  TEMP_ROLLS,
  WEATHER_ROLL_SECONDS,
  type MutationId,
} from './almanac';

const CYCLE_SECONDS = DAY_SECONDS + NIGHT_SECONDS;

export interface DayNightState {
  cyclePos: number;
  isDay: boolean;
  growthMultiplier: number;
}

export function createDayNight(): DayNightState {
  return { cyclePos: 0, isDay: true, growthMultiplier: DAY_GROWTH_MULTIPLIER };
}

export function tickDayNight(state: DayNightState, dt: number) {
  state.cyclePos = (state.cyclePos + dt) % CYCLE_SECONDS;
  state.isDay = state.cyclePos < DAY_SECONDS;
  state.growthMultiplier = state.isDay ? DAY_GROWTH_MULTIPLIER : NIGHT_GROWTH_MULTIPLIER;
}

export interface WeatherState {
  temp: MutationId | null;
  sky: MutationId | null;
  timer: number;
}

function rollOne(pool: MutationId[]): MutationId | null {
  // Slightly-better-than-half chance of "clear" so mutations feel earned, not constant.
  if (Math.random() < 0.45) return null;
  return pool[Math.floor(Math.random() * pool.length)];
}

export function createWeather(): WeatherState {
  return { temp: rollOne(TEMP_ROLLS), sky: rollOne(SKY_ROLLS), timer: WEATHER_ROLL_SECONDS };
}

export function tickWeather(state: WeatherState, dt: number) {
  state.timer -= dt;
  if (state.timer <= 0) {
    state.timer += WEATHER_ROLL_SECONDS;
    state.temp = rollOne(TEMP_ROLLS);
    state.sky = rollOne(SKY_ROLLS);
  }
}

// Sky mutations (Wet/Charged/Lunar/Rainbow) take priority over temperature ones when a
// crop finishes growing under both at once — Rainbow being the rarest deserves to win out.
export function activeMutation(state: WeatherState): MutationId | null {
  return state.sky ?? state.temp ?? null;
}

export function combatDamageMultiplier(state: WeatherState): number {
  return state.temp === 'scorched' ? 1.15 : 1;
}

export function combatSpeedMultiplier(state: WeatherState): number {
  return state.temp === 'frozen' ? 0.75 : 1;
}

export function combatAtkCooldownMultiplier(state: WeatherState): number {
  return state.sky === 'charged' ? 0.8 : 1;
}
