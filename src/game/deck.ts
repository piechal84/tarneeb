import type { Card, Seat } from './types';
import { SUITS, SEATS } from './types';

export function createDeck(): Card[] {
  const deck: Card[] = [];
  for (const suit of SUITS) {
    for (let rank = 2; rank <= 14; rank++) {
      deck.push({ suit, rank });
    }
  }
  return deck;
}

export function shuffle<T>(items: T[]): T[] {
  const arr = [...items];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

export function dealHands(dealer: Seat): Record<Seat, Card[]> {
  const deck = shuffle(createDeck());
  const hands: Record<Seat, Card[]> = {
    south: [],
    west: [],
    north: [],
    east: [],
  };

  // Deal starting to the left of the dealer, one card at a time, 13 each.
  const dealerIdx = SEATS.indexOf(dealer);
  const order = [1, 2, 3, 0].map((offset) => SEATS[(dealerIdx + offset) % SEATS.length]);

  for (let i = 0; i < deck.length; i++) {
    const seat = order[i % 4];
    hands[seat].push(deck[i]);
  }

  for (const seat of SEATS) {
    hands[seat].sort(sortCards);
  }

  return hands;
}

const SUIT_ORDER = ['S', 'H', 'D', 'C'];

export function sortCards(a: Card, b: Card): number {
  const suitDiff = SUIT_ORDER.indexOf(a.suit) - SUIT_ORDER.indexOf(b.suit);
  if (suitDiff !== 0) return suitDiff;
  return b.rank - a.rank;
}
