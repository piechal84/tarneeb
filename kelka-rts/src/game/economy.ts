import { cropById, MUTATIONS, type GroveId, type MutationId } from './almanac';
import type { Team, Vec2 } from './types';
import type { PlotSlot } from './world';

export interface Plot {
  id: string;
  team: Team;
  grove: GroveId;
  pos: Vec2;
  cropId: string | null;
  progress: number; // 0..1
  ready: boolean;
  mutation: MutationId | null;
}

export function createPlot(slot: PlotSlot): Plot {
  return { id: slot.id, team: slot.team, grove: slot.grove, pos: slot.pos, cropId: null, progress: 0, ready: false, mutation: null };
}

// Planting an empty plot always works. Replanting an occupied one only works once it's
// matured (ready) — that's a deliberate "swap in a better crop" upgrade, not an accidental
// interruption of a still-growing one. Returns whether it actually planted, so the caller
// (which charges the seed cost) knows whether to spend the coins.
export function plantCrop(plot: Plot, cropId: string): boolean {
  const def = cropById(cropId);
  if (def.grove !== plot.grove) return false;
  if (plot.cropId && !plot.ready) return false;
  plot.cropId = cropId;
  plot.progress = 0;
  plot.ready = false;
  plot.mutation = null;
  return true;
}

export function tickPlotGrowth(plot: Plot, dt: number, dayNightMultiplier: number, currentMutation: MutationId | null) {
  if (!plot.cropId || plot.ready) return;
  const def = cropById(plot.cropId);
  const rate = (1 / def.growSeconds) * dayNightMultiplier;
  plot.progress = Math.min(1, plot.progress + rate * dt);
  if (plot.progress >= 1) {
    plot.ready = true;
    if (!plot.mutation) plot.mutation = currentMutation;
  }
}

export interface IncomeTick {
  coins: number;
  diamonds: number;
}

// A mature plot pays out continuously — no harvest click needed. incomeBonus folds in
// every companion ability that used to apply at the point of sale (Chick/Fox/Panda/Unicorn).
export function plotIncomeThisTick(plot: Plot, dt: number, incomeBonus: number): IncomeTick {
  if (!plot.cropId || !plot.ready) return { coins: 0, diamonds: 0 };
  const def = cropById(plot.cropId);
  const mult = (plot.mutation ? MUTATIONS[plot.mutation].multiplier : 1) * incomeBonus * dt;
  return { coins: def.coinsPerSec * mult, diamonds: (def.diamondsPerSec ?? 0) * mult };
}

export function hasteCrop(plot: Plot, currentMutation: MutationId | null): boolean {
  if (!plot.cropId || plot.ready) return false;
  plot.progress = 1;
  plot.ready = true;
  if (!plot.mutation) plot.mutation = currentMutation;
  return true;
}
