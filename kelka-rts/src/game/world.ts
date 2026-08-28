import type { GroveId } from './almanac';
import type { Team, Vec2 } from './types';

export const TILE = 36;
export const GRID_COLS = 16;
export const GRID_ROWS = 20;
export const WORLD_WIDTH = GRID_COLS * TILE;
export const WORLD_HEIGHT = GRID_ROWS * TILE;

export function tileCenter(col: number, row: number): Vec2 {
  return { x: col * TILE + TILE / 2, y: row * TILE + TILE / 2 };
}

export interface PlotSlot {
  id: string;
  team: Team;
  grove: GroveId;
  pos: Vec2;
}

export interface BaseLayout {
  team: Team;
  heart: { pos: Vec2 };
  yard: { pos: Vec2 };
  plots: PlotSlot[];
}

// Player builds from the bottom edge upward; the AI's layout is the same template mirrored
// vertically so both sides have an identical, symmetric home base.
function buildLayout(team: Team): BaseLayout {
  const homeRow = team === 'player' ? GRID_ROWS - 1 : 0;
  const flip = team === 'player' ? (offset: number) => homeRow - offset : (offset: number) => homeRow + offset;

  const heartRow = flip(1);
  const fieldRow = flip(3);
  const groveRow = flip(4);

  const plots: PlotSlot[] = [];
  const fieldCols = [3, 4, 5, 6, 9, 10, 11, 12];
  fieldCols.forEach((col, i) => {
    plots.push({ id: `${team}-field-${i}`, team, grove: 'field', pos: tileCenter(col, fieldRow) });
  });
  const lunarCols = [3, 4, 5];
  lunarCols.forEach((col, i) => {
    plots.push({ id: `${team}-lunar-${i}`, team, grove: 'lunar', pos: tileCenter(col, groveRow) });
  });
  const solarCols = [10, 11];
  solarCols.forEach((col, i) => {
    plots.push({ id: `${team}-solar-${i}`, team, grove: 'solar', pos: tileCenter(col, groveRow) });
  });

  return {
    team,
    heart: { pos: tileCenter(7.5, heartRow) },
    yard: { pos: tileCenter(1.5, heartRow) },
    plots,
  };
}

export const PLAYER_LAYOUT = buildLayout('player');
export const AI_LAYOUT = buildLayout('ai');

export function layoutFor(team: Team): BaseLayout {
  return team === 'player' ? PLAYER_LAYOUT : AI_LAYOUT;
}
