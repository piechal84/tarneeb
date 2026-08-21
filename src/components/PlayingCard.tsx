import type { Card } from '../game/types';
import { rankLabel, SUIT_SYMBOL } from '../game/types';

interface Props {
  card: Card;
  onClick?: () => void;
  disabled?: boolean;
  small?: boolean;
}

const RED_SUITS = new Set(['H', 'D']);

export default function PlayingCard({ card, onClick, disabled, small }: Props) {
  const isRed = RED_SUITS.has(card.suit);
  const classes = ['playing-card'];
  if (isRed) classes.push('red');
  if (onClick && !disabled) classes.push('clickable');
  if (disabled) classes.push('disabled');
  if (small) classes.push('small');

  return (
    <button
      type="button"
      className={classes.join(' ')}
      onClick={onClick}
      disabled={!onClick || disabled}
    >
      <span className="corner top">
        {rankLabel(card.rank)}
        <br />
        {SUIT_SYMBOL[card.suit]}
      </span>
      <span className="pip">{SUIT_SYMBOL[card.suit]}</span>
      <span className="corner bottom">
        {rankLabel(card.rank)}
        <br />
        {SUIT_SYMBOL[card.suit]}
      </span>
    </button>
  );
}

export function CardBack() {
  return <div className="playing-card back" />;
}
