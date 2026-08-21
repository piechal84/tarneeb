import { dealHands } from './deck';
import { trickWinner } from './rules';
import type { Bid, Card, PlayedCard, Seat, Suit, Team } from './types';
import { MIN_BID, SEATS, TEAM_OF, WINNING_SCORE, nextSeat } from './types';

export type Phase =
  | 'bidding'
  | 'choosing-trump'
  | 'playing'
  | 'round-end'
  | 'game-over';

export interface RoundSummary {
  bidder: Seat;
  bidAmount: number;
  trump: Suit;
  bidTeamTricks: number;
  otherTeamTricks: number;
  bidTeamMadeIt: boolean;
  bidTeamDelta: number;
  otherTeamDelta: number;
}

export interface GameState {
  phase: Phase;
  dealer: Seat;
  roundNumber: number;
  hands: Record<Seat, Card[]>;
  bids: Bid[];
  turn: Seat | null;
  highestBid: { seat: Seat; amount: number } | null;
  trump: Suit | null;
  trick: PlayedCard[];
  trickComplete: boolean;
  pendingWinner: Seat | null;
  completedTricks: { trick: PlayedCard[]; winner: Seat }[];
  tricksWon: Record<Seat, number>;
  scores: Record<Team, number>;
  lastRoundSummary: RoundSummary | null;
  winner: Team | null;
  message: string;
}

function emptyTricksWon(): Record<Seat, number> {
  return { south: 0, west: 0, north: 0, east: 0 };
}

export function createNewGame(): GameState {
  const dealer: Seat = 'south';
  const hands = dealHands(dealer);
  return {
    phase: 'bidding',
    dealer,
    roundNumber: 1,
    hands,
    bids: [],
    turn: nextSeat(dealer),
    highestBid: null,
    trump: null,
    trick: [],
    trickComplete: false,
    pendingWinner: null,
    completedTricks: [],
    tricksWon: emptyTricksWon(),
    scores: { southNorth: 0, eastWest: 0 },
    lastRoundSummary: null,
    winner: null,
    message: `${nextSeat(dealer)} bids first.`,
  };
}

export type Action =
  | { type: 'NEW_GAME' }
  | { type: 'BID'; seat: Seat; amount: number | 'pass' }
  | { type: 'CHOOSE_TRUMP'; suit: Suit }
  | { type: 'PLAY_CARD'; seat: Seat; card: Card }
  | { type: 'ACK_TRICK' }
  | { type: 'ACK_ROUND' };

function trailingPasses(bids: Bid[]): number {
  let count = 0;
  for (let i = bids.length - 1; i >= 0; i--) {
    if (bids[i].amount === 'pass') count++;
    else break;
  }
  return count;
}

export function gameReducer(state: GameState, action: Action): GameState {
  switch (action.type) {
    case 'NEW_GAME':
      return createNewGame();

    case 'BID': {
      if (state.phase !== 'bidding' || state.turn !== action.seat) return state;
      const bids = [...state.bids, { seat: action.seat, amount: action.amount }];
      let highestBid = state.highestBid;
      if (action.amount !== 'pass' && (!highestBid || action.amount > highestBid.amount)) {
        highestBid = { seat: action.seat, amount: action.amount };
      }

      const allFourPassed = bids.length === 4 && bids.every((b) => b.amount === 'pass');
      if (allFourPassed) {
        // House rule: dealer is forced to bid the minimum rather than redeal forever.
        const forced = { seat: state.dealer, amount: MIN_BID };
        return {
          ...state,
          bids: [...bids, { seat: state.dealer, amount: MIN_BID }],
          highestBid: forced,
          phase: 'choosing-trump',
          turn: state.dealer,
          message: `Everyone passed - ${state.dealer} deals and must bid ${MIN_BID}.`,
        };
      }

      const auctionOver = highestBid !== null && trailingPasses(bids) >= 3;
      if (auctionOver && highestBid) {
        return {
          ...state,
          bids,
          highestBid,
          phase: 'choosing-trump',
          turn: highestBid.seat,
          message: `${highestBid.seat} won the bid at ${highestBid.amount} and picks trumps.`,
        };
      }

      const turn = nextSeat(action.seat);
      return {
        ...state,
        bids,
        highestBid,
        turn,
        message:
          action.amount === 'pass'
            ? `${action.seat} passes. ${turn} to bid.`
            : `${action.seat} bids ${action.amount}. ${turn} to bid.`,
      };
    }

    case 'CHOOSE_TRUMP': {
      if (state.phase !== 'choosing-trump' || !state.highestBid) return state;
      const leader = state.highestBid.seat;
      return {
        ...state,
        trump: action.suit,
        phase: 'playing',
        turn: leader,
        trick: [],
        message: `Trumps are ${action.suit}. ${leader} leads.`,
      };
    }

    case 'PLAY_CARD': {
      if (state.phase !== 'playing' || state.turn !== action.seat || state.trickComplete) {
        return state;
      }
      const hand = state.hands[action.seat];
      const cardIdx = hand.findIndex((c) => c.suit === action.card.suit && c.rank === action.card.rank);
      if (cardIdx === -1) return state;

      const newHand = [...hand.slice(0, cardIdx), ...hand.slice(cardIdx + 1)];
      const trick = [...state.trick, { seat: action.seat, card: action.card }];
      const hands = { ...state.hands, [action.seat]: newHand };

      if (trick.length < 4) {
        const turn = nextSeat(action.seat);
        return {
          ...state,
          hands,
          trick,
          turn,
          message: `${turn} to play.`,
        };
      }

      // Trick complete - resolve winner but leave the 4 cards visible until ACK_TRICK.
      const winner = trickWinner(trick, state.trump as Suit);
      return {
        ...state,
        hands,
        trick,
        trickComplete: true,
        pendingWinner: winner.seat,
        turn: null,
        message: `${winner.seat} wins the trick.`,
      };
    }

    case 'ACK_TRICK': {
      if (!state.trickComplete || !state.pendingWinner) return state;
      const winnerSeat = state.pendingWinner;
      const tricksWon = { ...state.tricksWon, [winnerSeat]: state.tricksWon[winnerSeat] + 1 };
      const completedTricks = [...state.completedTricks, { trick: state.trick, winner: winnerSeat }];
      const handsEmpty = state.hands[winnerSeat].length === 0;

      if (!handsEmpty) {
        return {
          ...state,
          tricksWon,
          completedTricks,
          trick: [],
          trickComplete: false,
          pendingWinner: null,
          turn: winnerSeat,
          message: `${winnerSeat} leads.`,
        };
      }

      // Round is over: score it.
      const bidderSeat = state.highestBid!.seat;
      const bidAmount = state.highestBid!.amount;
      const bidTeam = TEAM_OF[bidderSeat];
      const otherTeam: Team = bidTeam === 'southNorth' ? 'eastWest' : 'southNorth';
      const bidTeamTricks = SEATS.filter((s) => TEAM_OF[s] === bidTeam).reduce(
        (sum, s) => sum + tricksWon[s],
        0
      );
      const otherTeamTricks = 13 - bidTeamTricks;
      const bidTeamMadeIt = bidTeamTricks >= bidAmount;
      const bidTeamDelta = bidTeamMadeIt ? bidTeamTricks : -bidAmount;
      const otherTeamDelta = otherTeamTricks;

      const scores = {
        ...state.scores,
        [bidTeam]: state.scores[bidTeam] + bidTeamDelta,
        [otherTeam]: state.scores[otherTeam] + otherTeamDelta,
      };

      const summary: RoundSummary = {
        bidder: bidderSeat,
        bidAmount,
        trump: state.trump as Suit,
        bidTeamTricks,
        otherTeamTricks,
        bidTeamMadeIt,
        bidTeamDelta,
        otherTeamDelta,
      };

      const winner: Team | null =
        scores.southNorth >= WINNING_SCORE || scores.eastWest >= WINNING_SCORE
          ? scores.southNorth >= scores.eastWest
            ? 'southNorth'
            : 'eastWest'
          : null;

      return {
        ...state,
        tricksWon,
        completedTricks,
        trick: [],
        trickComplete: false,
        pendingWinner: null,
        turn: null,
        scores,
        lastRoundSummary: summary,
        phase: winner ? 'game-over' : 'round-end',
        winner,
        message: winner
          ? `${winner === 'southNorth' ? 'You & North' : 'East & West'} win the game!`
          : `Round ${state.roundNumber} complete.`,
      };
    }

    case 'ACK_ROUND': {
      if (state.phase !== 'round-end') return state;
      const dealer = nextSeat(state.dealer);
      const hands = dealHands(dealer);
      return {
        ...state,
        phase: 'bidding',
        dealer,
        roundNumber: state.roundNumber + 1,
        hands,
        bids: [],
        turn: nextSeat(dealer),
        highestBid: null,
        trump: null,
        trick: [],
        trickComplete: false,
        pendingWinner: null,
        completedTricks: [],
        tricksWon: emptyTricksWon(),
        lastRoundSummary: null,
        message: `Round ${state.roundNumber + 1}: ${nextSeat(dealer)} bids first.`,
      };
    }

    default:
      return state;
  }
}
