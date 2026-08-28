import { cropById, MERGE_TIER_NAME, MUTATIONS, companionById } from '../game/almanac';
import type { Building, BuildingKind } from '../game/buildings';
import type { Plot } from '../game/economy';
import type { GameState } from '../game/state';
import type { Unit } from '../game/units';
import { GRID_COLS, GRID_ROWS, TILE, WORLD_HEIGHT, WORLD_WIDTH } from '../game/world';
import { BUILDING_IMAGES, isImageReady } from './buildingImages';

const TEAM_COLOR = { player: '#3fae57', ai: '#c9463d' };
const GROVE_COLOR = { field: '#5b4327', lunar: '#2c2a5e', solar: '#8a5a12' };
export const BUILDING_EMOJI: Record<BuildingKind, string> = { heart: '💚', yard: '🏗️', incubator: '🥚', powerplant: '🔋' };
export const BUILDING_NAME: Record<BuildingKind, string> = { heart: 'Garden Heart', yard: 'Construction Yard', incubator: 'Kelka Egg Incubator', powerplant: 'Power Plant' };

export interface DragBox {
  x0: number;
  y0: number;
  x1: number;
  y1: number;
}

export function drawWorld(ctx: CanvasRenderingContext2D, state: GameState, dragBox: DragBox | null) {
  ctx.clearRect(0, 0, WORLD_WIDTH, WORLD_HEIGHT);
  drawBackground(ctx, state);
  drawGrid(ctx);
  for (const plot of state.plots) drawPlot(ctx, plot);
  for (const b of state.buildings) drawBuilding(ctx, b, b.id === state.selectedBuilding);
  for (const u of state.units) drawUnit(ctx, u);
  if (dragBox) drawDragBox(ctx, dragBox);
}

function drawBackground(ctx: CanvasRenderingContext2D, state: GameState) {
  const isDay = state.dayNight.isDay;
  const sky = isDay ? '#1f3a24' : '#0d1720';
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, WORLD_WIDTH, WORLD_HEIGHT);

  const bandH = (GRID_ROWS / 2) * TILE;
  const aiGrad = ctx.createLinearGradient(0, 0, 0, bandH);
  aiGrad.addColorStop(0, 'rgba(201,70,61,0.16)');
  aiGrad.addColorStop(1, 'rgba(201,70,61,0)');
  ctx.fillStyle = aiGrad;
  ctx.fillRect(0, 0, WORLD_WIDTH, bandH);

  const playerGrad = ctx.createLinearGradient(0, WORLD_HEIGHT - bandH, 0, WORLD_HEIGHT);
  playerGrad.addColorStop(0, 'rgba(63,174,87,0)');
  playerGrad.addColorStop(1, 'rgba(63,174,87,0.16)');
  ctx.fillStyle = playerGrad;
  ctx.fillRect(0, WORLD_HEIGHT - bandH, WORLD_WIDTH, bandH);
}

function drawGrid(ctx: CanvasRenderingContext2D) {
  ctx.strokeStyle = 'rgba(255,255,255,0.04)';
  ctx.lineWidth = 1;
  for (let c = 0; c <= GRID_COLS; c++) {
    ctx.beginPath();
    ctx.moveTo(c * TILE, 0);
    ctx.lineTo(c * TILE, WORLD_HEIGHT);
    ctx.stroke();
  }
  for (let r = 0; r <= GRID_ROWS; r++) {
    ctx.beginPath();
    ctx.moveTo(0, r * TILE);
    ctx.lineTo(WORLD_WIDTH, r * TILE);
    ctx.stroke();
  }
}

function drawPlot(ctx: CanvasRenderingContext2D, plot: Plot) {
  const size = TILE - 6;
  const x = plot.pos.x - size / 2;
  const y = plot.pos.y - size / 2;
  ctx.fillStyle = GROVE_COLOR[plot.grove];
  ctx.globalAlpha = 0.75;
  ctx.fillRect(x, y, size, size);
  ctx.globalAlpha = 1;

  ctx.strokeStyle = plot.ready ? '#ffe066' : 'rgba(255,255,255,0.25)';
  ctx.lineWidth = plot.ready ? 2 : 1;
  ctx.strokeRect(x, y, size, size);

  if (plot.cropId) {
    const def = cropById(plot.cropId);
    ctx.font = '18px serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(def.emoji, plot.pos.x, plot.pos.y);

    if (!plot.ready) {
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(plot.pos.x, plot.pos.y, size / 2 - 1, -Math.PI / 2, -Math.PI / 2 + plot.progress * Math.PI * 2);
      ctx.stroke();
    }
    if (plot.mutation) {
      ctx.font = '11px serif';
      ctx.fillText(MUTATIONS[plot.mutation].emoji, plot.pos.x + size / 2 - 4, plot.pos.y - size / 2 + 4);
    }
    // A mature (golden-bordered) plot earns passively — show the live rate as feedback
    // since there's no harvest click to confirm it's working.
    if (plot.ready) {
      const mult = plot.mutation ? MUTATIONS[plot.mutation].multiplier : 1;
      const label = def.diamondsPerSec ? `+${(def.diamondsPerSec * mult).toFixed(2)}💎/s` : `+${(def.coinsPerSec * mult).toFixed(1)}/s`;
      ctx.font = '9px sans-serif';
      ctx.fillStyle = '#ffe066';
      ctx.fillText(label, plot.pos.x, plot.pos.y + size / 2 + 9);
    }
  }
}

function drawHpBar(ctx: CanvasRenderingContext2D, cx: number, top: number, width: number, hp: number, maxHp: number, color: string) {
  const h = 4;
  const x = cx - width / 2;
  ctx.fillStyle = 'rgba(0,0,0,0.5)';
  ctx.fillRect(x, top, width, h);
  ctx.fillStyle = color;
  ctx.fillRect(x, top, width * Math.max(0, hp / maxHp), h);
}

function drawBuilding(ctx: CanvasRenderingContext2D, b: Building, selected: boolean) {
  const size = TILE * 1.7;
  const img = BUILDING_IMAGES[b.kind];
  const imgReady = isImageReady(img);
  // Wider than the old plain circle so the illustration reads clearly; a fixed aspect ratio
  // (matching the source art) rather than a square keeps it from looking stretched.
  const artW = TILE * 2.6;
  const artH = artW * (img.naturalHeight / img.naturalWidth || 0.55);

  if (selected) {
    ctx.strokeStyle = '#ffe066';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.ellipse(b.pos.x, b.pos.y, artW / 2 + 6, artH / 2 + 6, 0, 0, Math.PI * 2);
    ctx.stroke();
  }

  // A soft team-colored backdrop keeps player/AI structures visually distinguishable even
  // though both sides use the same artwork.
  ctx.fillStyle = TEAM_COLOR[b.team];
  ctx.globalAlpha = 0.25;
  ctx.beginPath();
  ctx.ellipse(b.pos.x, b.pos.y, artW / 2, artH / 2, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalAlpha = 1;
  ctx.strokeStyle = TEAM_COLOR[b.team];
  ctx.lineWidth = 2;
  ctx.stroke();

  if (imgReady) {
    ctx.drawImage(img, b.pos.x - artW / 2, b.pos.y - artH / 2, artW, artH);
  } else {
    // Fallback for the brief window before the image finishes its first load.
    ctx.font = `${Math.round(size * 0.55)}px serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(BUILDING_EMOJI[b.kind], b.pos.x, b.pos.y);
  }

  drawHpBar(ctx, b.pos.x, b.pos.y - artH / 2 - 10, artW, b.hp, b.maxHp, TEAM_COLOR[b.team]);

  if (b.constructing) {
    const pct = 1 - b.constructing.timeLeft / b.constructing.totalTime;
    ctx.strokeStyle = '#ffe066';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.ellipse(b.pos.x, b.pos.y, artW / 2 - 1, artH / 2 - 1, 0, -Math.PI / 2, -Math.PI / 2 + pct * Math.PI * 2);
    ctx.stroke();
  }

  if (b.hatching) {
    const pct = 1 - b.hatching.timeLeft / b.hatching.totalTime;
    ctx.font = '10px sans-serif';
    ctx.fillStyle = '#fff';
    ctx.fillText(`${companionById(b.hatching.companionId).emoji} ${Math.round(pct * 100)}%`, b.pos.x, b.pos.y + artH / 2 + 12);
  }

  if (b.repairing) {
    ctx.strokeStyle = '#6ec6ff';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.ellipse(b.pos.x, b.pos.y, artW / 2 - 1, artH / 2 - 1, 0, 0, Math.PI * 2);
    ctx.stroke();
    ctx.font = '12px sans-serif';
    ctx.fillText('🔧', b.pos.x + artW / 2 - 6, b.pos.y - artH / 2 + 6);
  }
}

function drawUnit(ctx: CanvasRenderingContext2D, u: Unit) {
  if (u.hp <= 0) return;
  const def = companionById(u.companionId);
  const radius = 13 + u.mergeTier * 2;

  if (u.selected) {
    ctx.strokeStyle = '#ffe066';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(u.pos.x, u.pos.y, radius + 4, 0, Math.PI * 2);
    ctx.stroke();
  }

  ctx.fillStyle = TEAM_COLOR[u.team];
  ctx.globalAlpha = 0.85;
  ctx.beginPath();
  ctx.arc(u.pos.x, u.pos.y, radius, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalAlpha = 1;

  ctx.font = `${Math.round(radius * 1.3)}px serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(def.emoji, u.pos.x, u.pos.y);

  if (u.mergeTier > 0) {
    ctx.font = '10px serif';
    ctx.fillText(u.mergeTier === 2 ? '🔥' : '✨', u.pos.x + radius - 2, u.pos.y - radius + 2);
  }

  drawHpBar(ctx, u.pos.x, u.pos.y - radius - 8, radius * 2, u.hp, u.maxHp, TEAM_COLOR[u.team]);
}

function drawDragBox(ctx: CanvasRenderingContext2D, box: DragBox) {
  const x = Math.min(box.x0, box.x1);
  const y = Math.min(box.y0, box.y1);
  const w = Math.abs(box.x1 - box.x0);
  const h = Math.abs(box.y1 - box.y0);
  ctx.strokeStyle = '#ffe066';
  ctx.fillStyle = 'rgba(255,224,102,0.12)';
  ctx.lineWidth = 1;
  ctx.fillRect(x, y, w, h);
  ctx.strokeRect(x, y, w, h);
}

export function unitTierLabel(u: Unit): string {
  return MERGE_TIER_NAME[u.mergeTier];
}
