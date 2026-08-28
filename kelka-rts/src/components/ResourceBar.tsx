import { DAY_SECONDS, HASTE_COST_CRYSTALS, MUTATIONS, NIGHT_SECONDS, type Difficulty } from '../game/almanac';
import { computePower, teamIncomeRate } from '../game/state';
import { kelkaStore } from '../game/store';
import { isMuted, setMuted } from '../game/sound';
import { useState } from 'react';

const DIFFICULTIES: { id: Difficulty; label: string }[] = [
  { id: 'easy', label: 'Easy' },
  { id: 'medium', label: 'Medium' },
  { id: 'hard', label: 'Hard' },
];

export default function ResourceBar() {
  const state = kelkaStore.state;
  const res = state.resources.player;
  const [muted, setMutedState] = useState(isMuted());

  const isDay = state.dayNight.isDay;
  const remaining = isDay ? DAY_SECONDS - state.dayNight.cyclePos : DAY_SECONDS + NIGHT_SECONDS - state.dayNight.cyclePos;
  const power = computePower(state, 'player');
  const income = teamIncomeRate(state, 'player');

  function toggleMuted() {
    const next = !muted;
    setMuted(next);
    setMutedState(next);
  }

  return (
    <div className="resource-bar">
      <div className="resource-group">
        <span className="chip" title="Current total coin income from all your mature plots">
          🪙 {Math.floor(res.coins).toLocaleString()} <em className="income-rate">(+{income.coins.toFixed(1)}/s)</em>
        </span>
        <span className="chip" title="Current total diamond income from all your mature plots">
          💎 {Math.floor(res.diamonds).toLocaleString()}
          {income.diamonds > 0 && <em className="income-rate"> (+{income.diamonds.toFixed(2)}/s)</em>}
        </span>
        <span className="chip">🔷 {Math.floor(res.crystals).toLocaleString()}</span>
        <span className={`chip${power < 0 ? ' chip-warn' : ''}`} title="Power generated minus power drawn by your buildings">
          {power < 0 ? '⚠️' : '⚡'} {power >= 0 ? '+' : ''}
          {power} {power < 0 && '(Low Power)'}
        </span>
        <span className="chip">Tier {state.tech.player}/4</span>
      </div>
      <div className="resource-group">
        <span className="chip">
          {isDay ? '☀️ Day' : '🌙 Night'} · {Math.ceil(remaining)}s
        </span>
        <span className="chip">
          {state.weather.temp ? `${MUTATIONS[state.weather.temp].emoji} ${MUTATIONS[state.weather.temp].name}` : '🌡️ Mild'}
        </span>
        <span className="chip">{state.weather.sky ? `${MUTATIONS[state.weather.sky].emoji} ${MUTATIONS[state.weather.sky].name}` : '⛅ Clear'}</span>
      </div>
      <div className="resource-group">
        {DIFFICULTIES.map((d) => (
          <button
            key={d.id}
            className={`chip-btn${kelkaStore.difficulty === d.id ? ' active' : ''}`}
            onClick={() => kelkaStore.setDifficulty(d.id)}
            title={`Restart on ${d.label} difficulty`}
          >
            {d.label}
          </button>
        ))}
      </div>
      <div className="resource-group">
        <button
          className={`chip-btn${state.pendingHaste ? ' active' : ''}`}
          disabled={res.crystals < HASTE_COST_CRYSTALS}
          onClick={() => kelkaStore.setPendingHaste(!state.pendingHaste)}
          title="Spend Kelka Crystals to instantly finish a growing crop"
        >
          ⏩ Haste ({HASTE_COST_CRYSTALS}🔷)
        </button>
        <button className="icon-btn" onClick={toggleMuted} title={muted ? 'Unmute' : 'Mute'}>
          {muted ? '🔇' : '🔊'}
        </button>
        <button className="icon-btn" onClick={() => kelkaStore.restart()} title="Restart match">
          ⟲
        </button>
      </div>
    </div>
  );
}
