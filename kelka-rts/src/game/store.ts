import type { Difficulty } from './almanac';
import { tick } from './engine';
import {
  cancelPendingAction,
  cmdAttackMove,
  cmdBuyTool,
  cmdHaste,
  cmdMergeSelection,
  cmdMove,
  cmdPlant,
  cmdResearch,
  cmdSelectBuilding,
  cmdSelectUnits,
  cmdStartBuild,
  cmdStartHatch,
  cmdToggleRepair,
  createInitialState,
  setPendingBuild,
  setPendingHaste,
  setPendingHatch,
  setPendingPlant,
  type ConstructibleKind,
  type GameState,
} from './state';
import type { EntityId, Vec2 } from './types';
import { playHatchSound, playMergeSound, playPlantSound } from './sound';

type Listener = () => void;

class KelkaStore {
  difficulty: Difficulty = 'medium';
  state: GameState = createInitialState(this.difficulty);
  private listeners = new Set<Listener>();
  private rafId: number | null = null;
  private lastTs: number | null = null;

  constructor() {
    this.loop = this.loop.bind(this);
    this.start();
  }

  start() {
    if (this.rafId != null) return;
    this.lastTs = null;
    this.rafId = requestAnimationFrame(this.loop);
  }

  stop() {
    if (this.rafId != null) cancelAnimationFrame(this.rafId);
    this.rafId = null;
  }

  private loop(ts: number) {
    if (this.lastTs != null) {
      const dt = Math.min(0.1, (ts - this.lastTs) / 1000);
      tick(this.state, dt);
    }
    this.lastTs = ts;
    this.rafId = requestAnimationFrame(this.loop);
    this.notify();
  }

  private notify() {
    for (const l of this.listeners) l();
  }

  subscribeHud = (listener: Listener) => {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  };

  getHudSnapshot = () => this.state.hudVersion;

  restart() {
    this.state = createInitialState(this.difficulty);
    this.notify();
  }

  setDifficulty(level: Difficulty) {
    this.difficulty = level;
    this.restart();
  }

  // ---- commands ----
  setPendingPlant(cropId: string | null) {
    setPendingPlant(this.state, cropId);
  }
  setPendingHatch(companionId: string | null) {
    setPendingHatch(this.state, companionId);
  }
  setPendingHaste(value: boolean) {
    setPendingHaste(this.state, value);
  }
  setPendingBuild(kind: ConstructibleKind | null) {
    setPendingBuild(this.state, kind);
  }
  startBuild(pos: Vec2) {
    if (!this.state.pendingBuild) return;
    cmdStartBuild(this.state, 'player', this.state.pendingBuild, pos);
  }
  research() {
    cmdResearch(this.state, 'player');
  }
  plant(plotId: string) {
    if (!this.state.pendingPlant) return;
    const before = this.state.resources.player.coins;
    cmdPlant(this.state, 'player', plotId, this.state.pendingPlant);
    if (this.state.resources.player.coins < before) playPlantSound();
  }
  haste(plotId: string) {
    cmdHaste(this.state, 'player', plotId);
    this.state.pendingHaste = false;
  }
  startHatch(buildingId: EntityId) {
    if (!this.state.pendingHatch) return;
    const before = this.state.resources.player.coins;
    cmdStartHatch(this.state, 'player', buildingId, this.state.pendingHatch);
    if (this.state.resources.player.coins < before) playHatchSound();
  }
  selectUnits(ids: EntityId[]) {
    cmdSelectUnits(this.state, ids);
  }
  moveSelection(dest: Vec2) {
    cmdMove(this.state, this.state.selection, dest);
  }
  attackMoveSelection(dest: Vec2, targetId: EntityId | null, targetIsBuilding: boolean) {
    cmdAttackMove(this.state, this.state.selection, dest, targetId, targetIsBuilding);
  }
  mergeSelection() {
    const before = this.state.nextId;
    cmdMergeSelection(this.state, 'player', this.state.selection);
    if (this.state.nextId !== before) playMergeSound();
  }
  buyTool(toolId: string) {
    cmdBuyTool(this.state, 'player', toolId);
  }
  selectBuilding(id: EntityId) {
    cmdSelectBuilding(this.state, id);
  }
  toggleRepair(id: EntityId) {
    cmdToggleRepair(this.state, id);
  }
  cancelPendingAction() {
    return cancelPendingAction(this.state);
  }
}

export const kelkaStore = new KelkaStore();

if (import.meta.env.DEV) {
  (window as unknown as { kelkaStore: KelkaStore }).kelkaStore = kelkaStore;
}
