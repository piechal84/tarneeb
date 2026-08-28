import { useEffect, useRef } from 'react';
import { kelkaStore } from '../game/store';
import type { Building } from '../game/buildings';
import type { Plot } from '../game/economy';
import type { GameState } from '../game/state';
import type { Unit } from '../game/units';
import type { Vec2 } from '../game/types';
import { TILE, WORLD_HEIGHT, WORLD_WIDTH } from '../game/world';
import { drawWorld, type DragBox } from './draw';

function plotAt(state: GameState, p: Vec2): Plot | undefined {
  const half = (TILE - 6) / 2;
  return state.plots.find((plot) => Math.abs(plot.pos.x - p.x) <= half && Math.abs(plot.pos.y - p.y) <= half);
}

function buildingAt(state: GameState, p: Vec2): Building | undefined {
  const r = (TILE * 1.7) / 2;
  return state.buildings.find((b) => Math.hypot(b.pos.x - p.x, b.pos.y - p.y) <= r);
}

function unitAt(state: GameState, p: Vec2): Unit | undefined {
  let best: Unit | undefined;
  let bestDist = 20;
  for (const u of state.units) {
    if (u.hp <= 0) continue;
    const d = Math.hypot(u.pos.x - p.x, u.pos.y - p.y);
    if (d <= bestDist) {
      bestDist = d;
      best = u;
    }
  }
  return best;
}

export default function GameCanvas() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const dragRef = useRef<DragBox | null>(null);
  const draggingRef = useRef(false);
  const dragStartRef = useRef<Vec2 | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    let raf = 0;
    const draw = () => {
      drawWorld(ctx, kelkaStore.state, dragRef.current);
      raf = requestAnimationFrame(draw);
    };
    raf = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(raf);
  }, []);

  function toWorld(e: React.MouseEvent): Vec2 {
    const canvas = canvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    return { x: (e.clientX - rect.left) * scaleX, y: (e.clientY - rect.top) * scaleY };
  }

  function handleMouseDown(e: React.MouseEvent) {
    const p = toWorld(e);
    const state = kelkaStore.state;

    if (e.button === 2) {
      // Right-click first backs out of whatever's pending (a selected crop/companion/building
      // to place, or a repair panel) rather than also issuing a move command in the same click.
      if (kelkaStore.cancelPendingAction()) return;
      if (state.selection.length === 0) return;
      const enemyUnit = unitAt(state, p);
      const enemyBuilding = buildingAt(state, p);
      if (enemyUnit && enemyUnit.team === 'ai') {
        kelkaStore.attackMoveSelection(p, enemyUnit.id, false);
      } else if (enemyBuilding && enemyBuilding.team === 'ai') {
        kelkaStore.attackMoveSelection(p, enemyBuilding.id, true);
      } else {
        kelkaStore.moveSelection(p);
      }
      return;
    }

    if (e.button !== 0) return;

    if (state.pendingBuild) {
      kelkaStore.startBuild(p);
      return;
    }
    if (state.pendingHaste) {
      const plot = plotAt(state, p);
      if (plot && plot.team === 'player' && plot.cropId && !plot.ready) kelkaStore.haste(plot.id);
      else kelkaStore.setPendingHaste(false);
      return;
    }
    if (state.pendingPlant) {
      const plot = plotAt(state, p);
      // Empty plots always accept a planting; an already-mature one can be replaced (an
      // upgrade to a better crop) but a still-growing one can't be interrupted.
      if (plot && plot.team === 'player' && (!plot.cropId || plot.ready)) kelkaStore.plant(plot.id);
      return;
    }
    if (state.pendingHatch) {
      const building = buildingAt(state, p);
      if (building && building.team === 'player' && building.kind === 'incubator') kelkaStore.startHatch(building.id);
      return;
    }

    const unit = unitAt(state, p);
    if (unit && unit.team === 'player') {
      kelkaStore.selectUnits([unit.id]);
      return;
    }

    const building = buildingAt(state, p);
    if (building && building.team === 'player') {
      kelkaStore.selectBuilding(building.id);
      return;
    }

    draggingRef.current = true;
    dragStartRef.current = p;
    dragRef.current = { x0: p.x, y0: p.y, x1: p.x, y1: p.y };
  }

  function handleMouseMove(e: React.MouseEvent) {
    if (!draggingRef.current || !dragStartRef.current) return;
    const p = toWorld(e);
    dragRef.current = { x0: dragStartRef.current.x, y0: dragStartRef.current.y, x1: p.x, y1: p.y };
  }

  function handleMouseUp() {
    if (draggingRef.current && dragRef.current) {
      const box = dragRef.current;
      const x0 = Math.min(box.x0, box.x1);
      const x1 = Math.max(box.x0, box.x1);
      const y0 = Math.min(box.y0, box.y1);
      const y1 = Math.max(box.y0, box.y1);
      if (Math.abs(x1 - x0) > 4 || Math.abs(y1 - y0) > 4) {
        const ids = kelkaStore.state.units
          .filter((u) => u.team === 'player' && u.hp > 0 && u.pos.x >= x0 && u.pos.x <= x1 && u.pos.y >= y0 && u.pos.y <= y1)
          .map((u) => u.id);
        kelkaStore.selectUnits(ids);
      }
    }
    draggingRef.current = false;
    dragStartRef.current = null;
    dragRef.current = null;
  }

  return (
    <canvas
      ref={canvasRef}
      width={WORLD_WIDTH}
      height={WORLD_HEIGHT}
      className="game-canvas"
      style={{ aspectRatio: `${WORLD_WIDTH} / ${WORLD_HEIGHT}` }}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onContextMenu={(e) => e.preventDefault()}
    />
  );
}
