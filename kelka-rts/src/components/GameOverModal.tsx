import { kelkaStore } from '../game/store';

export default function GameOverModal() {
  const winner = kelkaStore.state.winner;
  if (!winner) return null;
  const playerWon = winner === 'player';

  return (
    <div className="modal-overlay">
      <div className="modal">
        <h2>{playerWon ? '🏆 Victory!' : '💀 Defeat'}</h2>
        <p>{playerWon ? "The rival garden's Heart has withered." : 'Your Garden Heart has withered.'}</p>
        <button className="primary" onClick={() => kelkaStore.restart()}>
          Play Again
        </button>
      </div>
    </div>
  );
}
