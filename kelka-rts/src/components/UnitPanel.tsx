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

  // Group the selection by companion+tier so a big mixed-army drag-select can merge every
  // complete quartet it contains in one click, instead of requiring exactly 4 units picked
  // by hand each time.
  const mergeGroups: { companionId: string; mergeTier: 0 | 1; count: number; batches: number }[] = [];
  for (const u of selected) {
    if (u.mergeTier >= 2) continue;
    const existing = mergeGroups.find((g) => g.companionId === u.companionId && g.mergeTier === u.mergeTier);
    if (existing) existing.count++;
    else mergeGroups.push({ companionId: u.companionId, mergeTier: u.mergeTier as 0 | 1, count: 1, batches: 0 });
  }
  for (const g of mergeGroups) g.batches = Math.floor(g.count / 4);
  const eligibleGroups = mergeGroups.filter((g) => g.batches > 0);

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
      {eligibleGroups.map((g) => {
        const def = companionById(g.companionId);
        return (
          <button key={`${g.companionId}:${g.mergeTier}`} className="primary merge-btn" onClick={() => kelkaStore.mergeGroup(g.companionId, g.mergeTier)}>
            ⚗️ Merge {def.emoji} {def.name} → {MERGE_TIER_NAME[g.mergeTier + 1]} {g.batches > 1 ? `(×${g.batches})` : ''}
          </button>
        );
      })}
    </div>
  );
}
