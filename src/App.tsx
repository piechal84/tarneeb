import type { CSSProperties } from 'react';
import { useEffect, useReducer, useState } from 'react';
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

function renderTrickPile(count: number) {
  return (
    <div className="trick-pile" title={`${count} trick${count === 1 ? '' : 's'} won this round`}>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="mini-back" style={{ '--i': i } as CSSProperties} />
      ))}
      {count === 0 && <span className="trick-pile-empty">0 tricks</span>}
    </div>
  );
}

const TRICK_PAUSE = 650; // how long the completed trick sits on the table
const TRICK_COLLECT = 380; // how long the collect-away animation takes

// Deal cascades one card at a time, round-robin south -> west -> north -> east, like a real deal.
const DEAL_SEAT_SLOT: Record<Seat, number> = { south: 0, west: 1, north: 2, east: 3 };
const DEAL_STEP_MS = 65;
const DEAL_CARD_ANIM_MS = 420;
const DEAL_DURATION = 13 * 4 * DEAL_STEP_MS + DEAL_CARD_ANIM_MS + 200;

function dealDelay(seat: Seat, indexInHand: number): CSSProperties {
  const step = indexInHand * 4 + DEAL_SEAT_SLOT[seat];
  return { animationDelay: `${step * DEAL_STEP_MS}ms` };
}

export default function App() {
  const [state, dispatch] = useReducer(gameReducer, undefined, createNewGame);
  const [collecting, setCollecting] = useState(false);
  const [dealing, setDealing] = useState(true);

  // Show the dealing animation at the start of every round, blocking play until it finishes.
  useEffect(() => {
    setDealing(true);
    const timer = setTimeout(() => setDealing(false), DEAL_DURATION);
    return () => clearTimeout(timer);
  }, [state.roundNumber]);

  // Drive AI turns and pacing.
  useEffect(() => {
    if (dealing) return;

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
      const pauseTimer = setTimeout(() => setCollecting(true), TRICK_PAUSE);
      const ackTimer = setTimeout(() => {
        setCollecting(false);
        dispatch({ type: 'ACK_TRICK' });
      }, TRICK_PAUSE + TRICK_COLLECT);
      return () => {
        clearTimeout(pauseTimer);
        clearTimeout(ackTimer);
      };
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
  }, [state, dealing]);

  const humanHand = state.hands.south;
  const ledSuit = state.trick.length > 0 ? state.trick[0].card.suit : null;
  const humanTurnToPlay = !dealing && state.phase === 'playing' && !state.trickComplete && state.turn === 'south';
  const humanTurnToBid = !dealing && state.phase === 'bidding' && state.turn === 'south';
  const humanChoosesTrump = !dealing && state.phase === 'choosing-trump' && state.highestBid?.seat === 'south';

  const southNorthTricks = state.tricksWon.south + state.tricksWon.north;
  const eastWestTricks = state.tricksWon.west + state.tricksWon.east;

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
          {renderTrickPile(southNorthTricks)}
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
          {renderTrickPile(eastWestTricks)}
        </div>
      </header>

      <div className="message-bar">{dealing ? 'Dealing...' : state.message}</div>

      <div className="table">
        <div className="seat seat-north">
          <div className={`seat-label${state.turn === 'north' ? ' active-turn' : ''}`}>
            {SEAT_LABEL.north}
          </div>
          <div className="hand-back">
            {state.hands.north.map((_, i) => (
              <CardBack key={i} style={dealDelay('north', i)} />
            ))}
          </div>
        </div>

        <div className="seat seat-west">
          <div className={`seat-label${state.turn === 'west' ? ' active-turn' : ''}`}>
            {SEAT_LABEL.west}
          </div>
          <div className="hand-back vertical">
            {state.hands.west.map((_, i) => (
              <CardBack key={i} style={dealDelay('west', i)} />
            ))}
          </div>
        </div>

        {dealing && (
          <div className="deal-deck">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="mini-back" />
            ))}
          </div>
        )}

        <div className={`trick-area${collecting ? ' collecting' : ''}`}>
          {(['north', 'west', 'south', 'east'] as Seat[]).map((seat) =>
            trickBySeat[seat] ? (
              <div
                key={seat}
                className={`trick-card trick-${seat}${
                  state.trickComplete && !collecting && state.pendingWinner === seat ? ' winning' : ''
                }`}
              >
                <PlayingCard card={trickBySeat[seat]!} />
              </div>
            ) : null
          )}
        </div>

        <div className="seat seat-east">
          <div className={`seat-label${state.turn === 'east' ? ' active-turn' : ''}`}>
            {SEAT_LABEL.east}
          </div>
          <div className="hand-back vertical">
            {state.hands.east.map((_, i) => (
              <CardBack key={i} style={dealDelay('east', i)} />
            ))}
          </div>
        </div>

        <div className="seat seat-south">
          <div className={`seat-label${state.turn === 'south' ? ' active-turn' : ''}`}>
            {SEAT_LABEL.south}
          </div>
          <div className="hand-front">
            {humanHand.map((card, i) => {
              const legal = humanTurnToPlay && isLegalMove(humanHand, ledSuit, card);
              const mid = (humanHand.length - 1) / 2;
              const fanStyle = { '--fan-i': i - mid, ...dealDelay('south', i) } as CSSProperties;
              return (
                <PlayingCard
                  key={`${card.suit}${card.rank}`}
                  card={card}
                  disabled={!humanTurnToPlay || !legal}
                  style={fanStyle}
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
