import type { Card, PlayedCard, Suit } from './types';

export function legalMoves(hand: Card[], ledSuit: Suit | null): Card[] {
  if (!ledSuit) return hand;
  const followers = hand.filter((c) => c.suit === ledSuit);
  return followers.length > 0 ? followers : hand;
}

export function isLegalMove(hand: Card[], ledSuit: Suit | null, card: Card): boolean {
  return legalMoves(hand, ledSuit).some((c) => c.suit === card.suit && c.rank === card.rank);
}

// Determine the winner of a completed trick (4 played cards).
export function trickWinner(trick: PlayedCard[], trump: Suit): PlayedCard {
  const ledSuit = trick[0].card.suit;
  const trumpsPlayed = trick.filter((p) => p.card.suit === trump);
  const pool = trumpsPlayed.length > 0 ? trumpsPlayed : trick.filter((p) => p.card.suit === ledSuit);
  return pool.reduce((best, p) => (p.card.rank > best.card.rank ? p : best), pool[0]);
}
