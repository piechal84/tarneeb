export type Suit = 'S' | 'H' | 'D' | 'C';

export const SUITS: Suit[] = ['S', 'H', 'D', 'C'];

export const SUIT_SYMBOL: Record<Suit, string> = {
  S: '♠',
  H: '♥',
  D: '♦',
  C: '♣',
};

export const SUIT_NAME: Record<Suit, string> = {
  S: 'Spades',
  H: 'Hearts',
  D: 'Diamonds',
  C: 'Clubs',
};

// 2-10 map directly, 11=J, 12=Q, 13=K, 14=A
export type Rank = number;

export const RANK_LABEL: Record<number, string> = {
  11: 'J',
  12: 'Q',
  13: 'K',
  14: 'A',
};

export function rankLabel(rank: Rank): string {
  return RANK_LABEL[rank] ?? String(rank);
}

export interface Card {
  suit: Suit;
  rank: Rank;
}

export function cardId(card: Card): string {
  return `${card.suit}${card.rank}`;
}

// Seating is fixed clockwise: south -> west -> north -> east -> south
// South/North are partners; East/West are partners.
export type Seat = 'south' | 'west' | 'north' | 'east';

export const SEATS: Seat[] = ['south', 'west', 'north', 'east'];

export const SEAT_LABEL: Record<Seat, string> = {
  south: 'You',
  west: 'West',
  north: 'North (Partner)',
  east: 'East',
};

export type Team = 'southNorth' | 'eastWest';

export const TEAM_OF: Record<Seat, Team> = {
  south: 'southNorth',
  north: 'southNorth',
  west: 'eastWest',
  east: 'eastWest',
};

export const TEAM_LABEL: Record<Team, string> = {
  southNorth: 'You & North',
  eastWest: 'East & West',
};

export function nextSeat(seat: Seat): Seat {
  const idx = SEATS.indexOf(seat);
  return SEATS[(idx + 1) % SEATS.length];
}

export const MIN_BID = 7;
export const MAX_BID = 13;
export const WINNING_SCORE = 41;

export interface Bid {
  seat: Seat;
  amount: number | 'pass';
}

export interface PlayedCard {
  seat: Seat;
  card: Card;
}
