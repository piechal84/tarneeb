import { useEffect, useReducer } from 'react';
import './App.css';
import PlayingCard, { CardBack } from './components/PlayingCard';
import { aiBid, aiChooseCard, bestTrumpSuit } from './game/ai';
import { createNewGame, gameReducer } from './game/engine';
import { isLegalMove, trickWinner } from './game/rules';
import type { Seat, Suit } from './game/types';
import {
  MAX_BID,
  MIN_BID,
  SEAT_LABEL,
  SUIT_NAME,
  SUIT_SYMBOL,
  SUITS,
  TEAM_LABEL,
  TEAM_OF,
} from './game/types';

const AI_DELAY = 900;

function partnerIsWinning(trick: { seat: Seat; card: { suit: Suit; rank: number } }[], seat: Seat, trump: Suit): boolean {
  if (trick.length === 0) return false;
  const winner = trickWinner(trick, trump);
  return TEAM_OF[winner.seat] === TEAM_OF[seat];
}

export default function App() {
  const [state, dispatch] = useReducer(gameReducer, undefined, createNewGame);

  // Drive AI turns and pacing.
  useEffect(() => {
    if (state.phase === 'bidding' && state.turn && state.turn !== 'south') {
      const seat = state.turn;
      const timer = setTimeout(() => {
        const amount = aiBid(state.hands[seat], state.highestBid?.amount ?? MIN_BID - 1);
        dispatch({ type: 'BID', seat, amount });
      }, AI_DELAY);
      return () => clearTimeout(timer);
    }

    if (state.phase === 'choosing-trump' && state.highestBid && state.highestBid.seat !== 'south') {
      const seat = state.highestBid.seat;
      const timer = setTimeout(() => {
        dispatch({ type: 'CHOOSE_TRUMP', suit: bestTrumpSuit(state.hands[seat]) });
      }, AI_DELAY);
      return () => clearTimeout(timer);
    }

    if (state.phase === 'playing' && state.trickComplete) {
      const timer = setTimeout(() => dispatch({ type: 'ACK_TRICK' }), AI_DELAY);
      return () => clearTimeout(timer);
    }

    if (state.phase === 'playing' && !state.trickComplete && state.turn && state.turn !== 'south') {
      const seat = state.turn;
      const timer = setTimeout(() => {
        const card = aiChooseCard(
          state.hands[seat],
          state.trick,
          state.trump as Suit,
          partnerIsWinning(state.trick, seat, state.trump as Suit)
        );
        dispatch({ type: 'PLAY_CARD', seat, card });
      }, AI_DELAY);
      return () => clearTimeout(timer);
    }
  }, [state]);

  const humanHand = state.hands.south;
  const ledSuit = state.trick.length > 0 ? state.trick[0].card.suit : null;
  const humanTurnToPlay = state.phase === 'playing' && !state.trickComplete && state.turn === 'south';
  const humanTurnToBid = state.phase === 'bidding' && state.turn === 'south';
  const humanChoosesTrump = state.phase === 'choosing-trump' && state.highestBid?.seat === 'south';

  const minBidNow = Math.max(MIN_BID, (state.highestBid?.amount ?? MIN_BID - 1) + 1);
  const bidOptions = [];
  for (let b = minBidNow; b <= MAX_BID; b++) bidOptions.push(b);

  const trickBySeat: Record<Seat, { suit: Suit; rank: number } | undefined> = {
    south: undefined,
    west: undefined,
    north: undefined,
    east: undefined,
  };
  for (const p of state.trick) trickBySeat[p.seat] = p.card;

  return (
    <div className="table-root">
      <header className="scoreboard">
        <div className="score-team">
          <span className="team-name">{TEAM_LABEL.southNorth}</span>
          <span className="team-score">{state.scores.southNorth}</span>
        </div>
        <div className="round-info">
          <div>Round {state.roundNumber}</div>
          <div>Dealer: {SEAT_LABEL[state.dealer]}</div>
          {state.trump && (
            <div className="trump-chip">
              Trump: {SUIT_SYMBOL[state.trump]} {SUIT_NAME[state.trump]}
            </div>
          )}
        </div>
        <div className="score-team">
          <span className="team-name">{TEAM_LABEL.eastWest}</span>
          <span className="team-score">{state.scores.eastWest}</span>
        </div>
      </header>

      <div className="message-bar">{state.message}</div>

      <div className="table">
        <div className="seat seat-north">
          <div className="seat-label">{SEAT_LABEL.north}</div>
          <div className="hand-back">
            {state.hands.north.map((_, i) => (
              <CardBack key={i} />
            ))}
          </div>
        </div>

        <div className="seat seat-west">
          <div className="seat-label">{SEAT_LABEL.west}</div>
          <div className="hand-back vertical">
            {state.hands.west.map((_, i) => (
              <CardBack key={i} />
            ))}
          </div>
        </div>

        <div className="trick-area">
          {(['north', 'west', 'south', 'east'] as Seat[]).map((seat) =>
            trickBySeat[seat] ? (
              <div key={seat} className={`trick-card trick-${seat}`}>
                <PlayingCard card={trickBySeat[seat]!} />
              </div>
            ) : null
          )}
        </div>

        <div className="seat seat-east">
          <div className="seat-label">{SEAT_LABEL.east}</div>
          <div className="hand-back vertical">
            {state.hands.east.map((_, i) => (
              <CardBack key={i} />
            ))}
          </div>
        </div>

        <div className="seat seat-south">
          <div className="seat-label">{SEAT_LABEL.south}</div>
          <div className="hand-front">
            {humanHand.map((card) => {
              const legal = humanTurnToPlay && isLegalMove(humanHand, ledSuit, card);
              return (
                <PlayingCard
                  key={`${card.suit}${card.rank}`}
                  card={card}
                  disabled={!humanTurnToPlay || !legal}
                  onClick={
                    humanTurnToPlay && legal
                      ? () => dispatch({ type: 'PLAY_CARD', seat: 'south', card })
                      : undefined
                  }
                />
              );
            })}
          </div>
        </div>
      </div>

      {humanTurnToBid && (
        <div className="panel bidding-panel">
          <div className="panel-title">Your bid (current high: {state.highestBid?.amount ?? 'none'})</div>
          <div className="panel-buttons">
            <button onClick={() => dispatch({ type: 'BID', seat: 'south', amount: 'pass' })}>Pass</button>
            {bidOptions.map((b) => (
              <button key={b} onClick={() => dispatch({ type: 'BID', seat: 'south', amount: b })}>
                {b}
              </button>
            ))}
          </div>
        </div>
      )}

      {humanChoosesTrump && (
        <div className="panel trump-panel">
          <div className="panel-title">Choose trump suit</div>
          <div className="panel-buttons">
            {SUITS.map((s) => (
              <button key={s} onClick={() => dispatch({ type: 'CHOOSE_TRUMP', suit: s })}>
                {SUIT_SYMBOL[s]} {SUIT_NAME[s]}
              </button>
            ))}
          </div>
        </div>
      )}

      {state.phase === 'round-end' && state.lastRoundSummary && (
        <div className="modal-overlay">
          <div className="modal">
            <h2>Round {state.roundNumber} Summary</h2>
            <p>
              {SEAT_LABEL[state.lastRoundSummary.bidder]} bid {state.lastRoundSummary.bidAmount} in{' '}
              {SUIT_SYMBOL[state.lastRoundSummary.trump]}
            </p>
            <p>
              Bidding team took {state.lastRoundSummary.bidTeamTricks} tricks (
              {state.lastRoundSummary.bidTeamMadeIt ? 'made it' : 'set!'}) &rarr;{' '}
              {state.lastRoundSummary.bidTeamDelta >= 0 ? '+' : ''}
              {state.lastRoundSummary.bidTeamDelta} points
            </p>
            <p>
              Other team took {state.lastRoundSummary.otherTeamTricks} tricks &rarr; +
              {state.lastRoundSummary.otherTeamDelta} points
            </p>
            <p className="modal-scores">
              {TEAM_LABEL.southNorth}: {state.scores.southNorth} &nbsp;|&nbsp; {TEAM_LABEL.eastWest}:{' '}
              {state.scores.eastWest}
            </p>
            <button className="primary" onClick={() => dispatch({ type: 'ACK_ROUND' })}>
              Continue
            </button>
          </div>
        </div>
      )}

      {state.phase === 'game-over' && state.winner && (
        <div className="modal-overlay">
          <div className="modal">
            <h2>Game Over</h2>
            <p className="winner-line">{TEAM_LABEL[state.winner]} win!</p>
            <p className="modal-scores">
              {TEAM_LABEL.southNorth}: {state.scores.southNorth} &nbsp;|&nbsp; {TEAM_LABEL.eastWest}:{' '}
              {state.scores.eastWest}
            </p>
            <button className="primary" onClick={() => dispatch({ type: 'NEW_GAME' })}>
              New Game
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
