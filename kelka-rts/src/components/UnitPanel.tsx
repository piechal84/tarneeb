import { companionById, MERGE_TIER_NAME, REPAIR_COST_PER_HP } from '../game/almanac';
import { kelkaStore } from '../game/store';
import { BUILDING_EMOJI, BUILDING_NAME } from '../render/draw';

export default function UnitPanel() {
  const state = kelkaStore.state;
  const building = state.selectedBuilding != null ? state.buildings.find((b) => b.id === state.selectedBuilding) : undefined;

  if (building) {
    const damaged = building.hp < building.maxHp;
    return (
      <div className="unit-panel">
        <div className="panel-title">
          {BUILDING_EMOJI[building.kind]} {BUILDING_NAME[building.kind]}
        </div>
        <div className="unit-row">
          <span>HP</span>
          <span className="item-meta">
            {Math.ceil(building.hp)}/{building.maxHp}
          </span>
        </div>
        {building.constructing ? (
          <div className="hint">Under construction…</div>
        ) : damaged ? (
          <button className="primary merge-btn" onClick={() => kelkaStore.toggleRepair(building.id)}>
            🔧 {building.repairing ? 'Repairing… (click to stop)' : `Repair (${REPAIR_COST_PER_HP}🪙/HP)`}
          </button>
        ) : (
          <div className="hint">Fully repaired.</div>
        )}
      </div>
    );
  }

  const selected = state.units.filter((u) => state.selection.includes(u.id) && u.hp > 0);

  const canMerge =
    selected.length === 4 &&
    selected[0].mergeTier < 2 &&
    selected.every((u) => u.companionId === selected[0].companionId && u.mergeTier === selected[0].mergeTier);

  return (
    <div className="unit-panel">
      <div className="panel-title">Selection</div>
      {selected.length === 0 && <div className="hint">Drag-select your companions. Right-click to move or attack.</div>}
      <div className="panel-scroll">
        {selected.map((u) => {
          const def = companionById(u.companionId);
          return (
            <div key={u.id} className="unit-row">
              <span>
                {def.emoji} {def.name} <em>{MERGE_TIER_NAME[u.mergeTier]}</em>
              </span>
              <span className="item-meta">
                {Math.ceil(u.hp)}/{u.maxHp} HP
              </span>
            </div>
          );
        })}
      </div>
      {canMerge && (
        <button className="primary merge-btn" onClick={() => kelkaStore.mergeSelection()}>
          ⚗️ Merge into {MERGE_TIER_NAME[selected[0].mergeTier + 1]}
        </button>
      )}
    </div>
  );
}
