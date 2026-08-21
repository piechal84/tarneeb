# Tarneeb

A browser-based version of Tarneeb, the Lebanese trick-taking card game. You play South, partnered with North (AI) against East and West (AI).

## Rules implemented (v1)

- 4 players, 2 partnerships: You + North vs. East + West
- Standard 52-card deck, 13 cards dealt to each player
- Bidding: players bid 7-13 tricks or pass in turn; highest bid wins and picks trumps
  - If all four pass, the dealer is forced to bid the minimum (7) rather than redealing
- Play: must follow suit if able; trump beats any non-trump; highest card of the led suit wins if no trump is played
- Scoring: if the bidding team makes their bid, they score their tricks won; if they fail, they lose points equal to their bid. The defending team always scores the tricks they won. First team to 41 points wins.
- Basic heuristic AI for bidding and card play (no lookahead) - a good target for future tuning

## Running locally

```bash
npm install
npm run dev
```

Then open the printed local URL in your browser.

## Possible next steps

- Smarter AI (card counting, partnership signaling)
- No-trump bids
- Configurable winning score / bid range
- Persisted match history
