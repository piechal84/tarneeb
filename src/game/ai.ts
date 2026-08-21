import type { Card, PlayedCard, Suit } from './types';
import { MAX_BID, SUITS } from './types';
import { legalMoves } from './rules';

const RANK_POINTS: Record<number, number> = { 14: 4, 13: 3, 12: 2, 11: 1 };

function handStrength(hand: Card[]): { total: number; bySuit: Record<Suit, number> } {
  const bySuit: Record<Suit, number> = { S: 0, H: 0, D: 0, C: 0 };
  let total = 0;
  for (const card of hand) {
    const pts = RANK_POINTS[card.rank] ?? 0;
    bySuit[card.suit] += pts;
    total += pts;
  }
  for (const suit of SUITS) {
    const length = hand.filter((c) => c.suit === suit).length;
    if (length >= 5) bySuit[suit] += (length - 4) * 1.5;
  }
  return { total, bySuit };
}

export function bestTrumpSuit(hand: Card[]): Suit {
  const { bySuit } = handStrength(hand);
  return SUITS.reduce((best, s) => (bySuit[s] > bySuit[best] ? s : best), SUITS[0]);
}

// Returns a bid amount (>= currentHighest+1, capped at MAX_BID) or 'pass'.
export function aiBid(hand: Card[], currentHighest: number): number | 'pass' {
  const { total, bySuit } = handStrength(hand);
  const bestSuitPts = Math.max(...SUITS.map((s) => bySuit[s]));
  const estimate = Math.round(6 + total / 4 + bestSuitPts / 6);
  const capped = Math.min(MAX_BID, estimate);
  if (capped > currentHighest) {
    return Math.max(currentHighest + 1, Math.min(capped, MAX_BID));
  }
  return 'pass';
}

// Choose a card to play for the given seat given the current trick so far.
export function aiChooseCard(
  hand: Card[],
  trick: PlayedCard[],
  trump: Suit,
  partnerIsWinning: boolean
): Card {
  const ledSuit = trick.length > 0 ? trick[0].card.suit : null;
  const options = legalMoves(hand, ledSuit);

  if (options.length === 1) return options[0];

  if (!ledSuit) {
    // Leading: play the highest card from our longest/strongest side suit.
    const nonTrump = options.filter((c) => c.suit !== trump);
    const pool = nonTrump.length > 0 ? nonTrump : options;
    const bySuit: Record<string, Card[]> = {};
    for (const c of pool) {
      bySuit[c.suit] = bySuit[c.suit] ?? [];
      bySuit[c.suit].push(c);
    }
    const longestSuit = Object.values(bySuit).reduce((a, b) => (b.length > a.length ? b : a));
    return longestSuit.reduce((best, c) => (c.rank > best.rank ? c : best));
  }

  const currentWinner = currentTrickWinner(trick, trump);
  const highestOnTable = currentWinner.card;

  const canFollow = options.some((c) => c.suit === ledSuit);

  if (canFollow) {
    const followers = options.filter((c) => c.suit === ledSuit);
    const winners = followers.filter((c) =>
      highestOnTable.suit === ledSuit ? c.rank > highestOnTable.rank : true
    );
    if (partnerIsWinning) {
      // Duck: play our lowest card, no need to win over our own partner.
      return followers.reduce((low, c) => (c.rank < low.rank ? c : low));
    }
    if (winners.length > 0) {
      // Win as cheaply as possible.
      return winners.reduce((low, c) => (c.rank < low.rank ? c : low));
    }
    // Can't win: play lowest to conserve strength.
    return followers.reduce((low, c) => (c.rank < low.rank ? c : low));
  }

  // Void in led suit.
  const trumps = options.filter((c) => c.suit === trump);
  if (trumps.length > 0 && !partnerIsWinning) {
    const alreadyTrumped = highestOnTable.suit === trump;
    const winningTrumps = trumps.filter((c) => (alreadyTrumped ? c.rank > highestOnTable.rank : true));
    if (winningTrumps.length > 0) {
      return winningTrumps.reduce((low, c) => (c.rank < low.rank ? c : low));
    }
  }

  // Discard: shed our lowest card from our shortest non-trump suit.
  const discardable = options.filter((c) => c.suit !== trump);
  const pool = discardable.length > 0 ? discardable : options;
  const bySuit: Record<string, Card[]> = {};
  for (const c of pool) {
    bySuit[c.suit] = bySuit[c.suit] ?? [];
    bySuit[c.suit].push(c);
  }
  const shortestSuit = Object.values(bySuit).reduce((a, b) => (b.length < a.length ? b : a));
  return shortestSuit.reduce((low, c) => (c.rank < low.rank ? c : low));
}

function currentTrickWinner(trick: PlayedCard[], trump: Suit): PlayedCard {
  if (trick.length === 0) throw new Error('no cards played yet');
  const ledSuit = trick[0].card.suit;
  const trumpsPlayed = trick.filter((p) => p.card.suit === trump);
  const pool = trumpsPlayed.length > 0 ? trumpsPlayed : trick.filter((p) => p.card.suit === ledSuit);
  return pool.reduce((best, p) => (p.card.rank > best.card.rank ? p : best), pool[0]);
}
