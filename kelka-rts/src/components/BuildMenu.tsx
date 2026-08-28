import { useState } from 'react';
import {
  companionRequiredTier,
  COMPANIONS,
  cropRequiredTier,
  CROPS,
  GROVE_NAME,
  INCUBATOR_BUILD_SECONDS,
  INCUBATOR_COST,
  MAX_INCUBATORS,
  POWER_PLANT_BUILD_SECONDS,
  POWER_PLANT_COST,
  RESEARCH_COST,
  TOOLS,
  type GroveId,
} from '../game/almanac';
import { computePower } from '../game/state';
import { kelkaStore } from '../game/store';

type Tab = 'plant' | 'hatch' | 'build' | 'tools';

const GROVES: GroveId[] = ['field', 'lunar', 'solar'];

export default function BuildMenu() {
  const [tab, setTab] = useState<Tab>('plant');
  const state = kelkaStore.state;
  const tier = state.tech.player;
  const incubatorCount = state.buildings.filter((b) => b.team === 'player' && b.kind === 'incubator').length;
  const power = computePower(state, 'player');
  const noPower = power < 0;

  return (
    <div className="build-menu">
      <div className="tab-row">
        <button className={tab === 'plant' ? 'tab active' : 'tab'} onClick={() => setTab('plant')}>
          🌱 Plant
        </button>
        <button className={tab === 'hatch' ? 'tab active' : 'tab'} onClick={() => setTab('hatch')}>
          🥚 Hatch
        </button>
        <button className={tab === 'build' ? 'tab active' : 'tab'} onClick={() => setTab('build')}>
          🏗️ Build
        </button>
        <button className={tab === 'tools' ? 'tab active' : 'tab'} onClick={() => setTab('tools')}>
          🛠️ Tools
        </button>
      </div>

      {tab === 'plant' && (
        <div className="panel-scroll">
          {GROVES.map((grove) => (
            <div key={grove} className="grove-group">
              <div className="grove-title">{GROVE_NAME[grove]}</div>
              {CROPS.filter((c) => c.grove === grove).map((c) => {
                const req = cropRequiredTier(c);
                const locked = req > tier;
                const unaffordable = state.resources.player.coins < c.plantCost;
                const rate = c.diamondsPerSec ? `+${c.diamondsPerSec}💎/s` : `+${c.coinsPerSec}🪙/s`;
                return (
                  <button
                    key={c.id}
                    className={`item-btn${state.pendingPlant === c.id ? ' active' : ''}`}
                    disabled={locked || unaffordable}
                    onClick={() => kelkaStore.setPendingPlant(state.pendingPlant === c.id ? null : c.id)}
                    title={locked ? `Requires Tech Tier ${req}` : `${c.rarity} — earns ${rate} once grown`}
                  >
                    <span>
                      {c.emoji} {c.name} {locked && `🔒 T${req}`}
                    </span>
                    <span className="item-meta">
                      🪙{c.plantCost.toLocaleString()} seed · ⏱ {c.growSeconds}s · {rate}
                    </span>
                  </button>
                );
              })}
            </div>
          ))}
        </div>
      )}

      {tab === 'hatch' && (
        <div className="panel-scroll">
          {COMPANIONS.map((c) => {
            const req = companionRequiredTier(c);
            const locked = req > tier;
            const affordable = state.resources.player.coins >= c.hatchCost;
            return (
              <button
                key={c.id}
                className={`item-btn${state.pendingHatch === c.id ? ' active' : ''}`}
                disabled={locked || !affordable}
                onClick={() => kelkaStore.setPendingHatch(state.pendingHatch === c.id ? null : c.id)}
                title={locked ? `Requires Tech Tier ${req}` : c.ability}
              >
                <span>
                  {c.emoji} {c.name} {locked && `🔒 T${req}`}
                </span>
                <span className="item-meta">🪙 {c.hatchCost.toLocaleString()}</span>
              </button>
            );
          })}
        </div>
      )}

      {tab === 'build' && (
        <div className="panel-scroll">
          <div className="grove-group">
            <div className="grove-title">Research</div>
            {(() => {
              const job = state.researching.player;
              if (tier >= 4) return <div className="hint">Tier 4 — fully researched.</div>;
              const nextTier = (tier + 1) as 2 | 3 | 4;
              const cost = RESEARCH_COST[nextTier];
              return (
                <button
                  className="item-btn"
                  disabled={!!job || state.resources.player.coins < cost.coins}
                  onClick={() => kelkaStore.research()}
                  title="Unlocks the next tech tier's crops and companions"
                >
                  <span>🔬 Research Tier {nextTier}</span>
                  <span className="item-meta">{job ? `${Math.round((1 - job.timeLeft / job.totalTime) * 100)}%` : `🪙 ${cost.coins.toLocaleString()}`}</span>
                </button>
              );
            })()}
          </div>
          <div className="grove-group">
            <div className="grove-title">Structures</div>
            <button
              className={`item-btn${state.pendingBuild === 'powerplant' ? ' active' : ''}`}
              onClick={() => kelkaStore.setPendingBuild(state.pendingBuild === 'powerplant' ? null : 'powerplant')}
              title="Generates power. Click an empty tile near your Construction Yard to place."
            >
              <span>🔋 Power Plant</span>
              <span className="item-meta">
                🪙 {POWER_PLANT_COST.toLocaleString()} · ⏱ {POWER_PLANT_BUILD_SECONDS}s
              </span>
            </button>
            <button
              className={`item-btn${state.pendingBuild === 'incubator' ? ' active' : ''}`}
              disabled={incubatorCount >= MAX_INCUBATORS || noPower}
              onClick={() => kelkaStore.setPendingBuild(state.pendingBuild === 'incubator' ? null : 'incubator')}
              title={noPower ? 'Needs a positive power supply — build a Power Plant first.' : 'Hatches and merges companions. Click an empty tile near your Construction Yard to place.'}
            >
              <span>
                🥚 Kelka Egg Incubator ({incubatorCount}/{MAX_INCUBATORS}) {noPower && '⚡🔒'}
              </span>
              <span className="item-meta">
                🪙 {INCUBATOR_COST.toLocaleString()} · ⏱ {INCUBATOR_BUILD_SECONDS}s
              </span>
            </button>
          </div>
        </div>
      )}

      {tab === 'tools' && (
        <div className="panel-scroll">
          {TOOLS.map((t) => {
            const level = state.tools.player[t.id] ?? 0;
            const maxed = level >= t.maxLevel;
            const cost = t.costForLevel(level + 1);
            return (
              <button
                key={t.id}
                className="item-btn"
                disabled={!t.implemented || maxed || state.resources.player.coins < cost}
                onClick={() => kelkaStore.buyTool(t.id)}
                title={t.description}
              >
                <span>
                  {t.emoji} {t.name} {t.implemented ? `Lv.${level}/${t.maxLevel}` : '(Coming soon)'}
                </span>
                {t.implemented && <span className="item-meta">{maxed ? 'MAX' : `🪙 ${cost.toLocaleString()}`}</span>}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
