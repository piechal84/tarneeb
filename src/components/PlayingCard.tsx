import type { CSSProperties } from 'react';
import type { Card } from '../game/types';
import { rankLabel, SUIT_SYMBOL } from '../game/types';

interface Props {
  card: Card;
  onClick?: () => void;
  disabled?: boolean;
  small?: boolean;
  style?: CSSProperties;
}

const RED_SUITS = new Set(['H', 'D']);

// Face cards get a distinct pictorial glyph in the center instead of a plain suit pip.
const FACE_ICON: Record<number, string> = { 11: '♞', 12: '♛', 13: '♚' };

export default function PlayingCard({ card, onClick, disabled, small, style }: Props) {
  const isRed = RED_SUITS.has(card.suit);
  const faceIcon = FACE_ICON[card.rank];
  const isAce = card.rank === 14;
  const classes = ['playing-card'];
  if (isRed) classes.push('red');
  if (onClick && !disabled) classes.push('clickable');
  if (disabled) classes.push('disabled');
  if (small) classes.push('small');
  if (faceIcon) classes.push('face-card');

  const pipClasses = ['pip'];
  if (faceIcon) pipClasses.push('face');
  if (isAce) pipClasses.push('ace');

  return (
    <button
      type="button"
      className={classes.join(' ')}
      onClick={onClick}
      disabled={!onClick || disabled}
      style={style}
    >
      <span className="corner top">
        {rankLabel(card.rank)}
        <br />
        {SUIT_SYMBOL[card.suit]}
      </span>
      <span className={pipClasses.join(' ')}>{faceIcon ?? SUIT_SYMBOL[card.suit]}</span>
      <span className="corner bottom">
        {rankLabel(card.rank)}
        <br />
        {SUIT_SYMBOL[card.suit]}
      </span>
    </button>
  );
}

export function CardBack({ style }: { style?: CSSProperties }) {
  return <div className="playing-card back" style={style} />;
}
