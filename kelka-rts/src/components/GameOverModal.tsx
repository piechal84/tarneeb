import { companionById, MERGE_TIER_NAME } from '../game/almanac';
import { kelkaStore } from '../game/store';

const ROWS: { label: string; key: 'buildingsBuilt' | 'buildingsLost' | 'unitsBuilt' | 'unitsLost' }[] = [
  { label: 'Buildings Built', key: 'buildingsBuilt' },
  { label: 'Buildings Lost', key: 'buildingsLost' },
  { label: 'Units Built', key: 'unitsBuilt' },
  { label: 'Units Lost', key: 'unitsLost' },
];

export default function GameOverModal() {
  const state = kelkaStore.state;
  const winner = state.winner;
  if (!winner) return null;
  const playerWon = winner === 'player';
  const { player, ai } = state.stats;
  const mvp = state.mvp;

  return (
    <div className="modal-overlay">
      <div className="modal stats-modal">
        <h2>{playerWon ? '🏆 Victory!' : '💀 Defeat'}</h2>
        <p>{playerWon ? "The rival garden's Heart has withered." : 'Your Garden Heart has withered.'}</p>

        <table className="stats-table">
          <thead>
            <tr>
              <th></th>
              <th>You</th>
              <th>AI</th>
            </tr>
          </thead>
          <tbody>
            {ROWS.map((row) => (
              <tr key={row.key}>
                <td>{row.label}</td>
                <td>{player[row.key]}</td>
                <td>{ai[row.key]}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {mvp && (
          <div className="mvp-callout">
            🏅 MVP: {companionById(mvp.companionId).emoji} {companionById(mvp.companionId).name} ({MERGE_TIER_NAME[mvp.mergeTier]}) —{' '}
            {mvp.team === 'player' ? 'your' : "the AI's"} team — {Math.round(mvp.damageDealt).toLocaleString()} damage dealt
          </div>
        )}

        <button className="primary" onClick={() => kelkaStore.restart()}>
          Play Again
        </button>
      </div>
    </div>
  );
}
