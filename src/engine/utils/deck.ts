export type DeckEntry<TCard> = {
  card: TCard;
  count: number;
};

export type Rng = () => number;

/**
 * Fisher–Yates shuffle.
 * - Correct randomness distribution
 * - Deterministic in tests if you pass a custom rng
 */
export function shuffle<T>(items: readonly T[], rng: Rng = Math.random): readonly T[] {
  const arr = [...items];
  for (let i = arr.length - 1; i > 0; i -= 1) {
    const j = Math.floor(rng() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

/**
 * Expand a quantity-based deck spec into a flat array.
 * This is for deck tuning and variations
 */
export function buildDeck<TCard>(spec: readonly DeckEntry<TCard>[]): readonly TCard[] {
  const deck: TCard[] = [];

  for (const entry of spec) {
    if (!Number.isInteger(entry.count) || entry.count < 0) {
      throw new Error(`Invalid count for deck entry: ${entry.count}`);
    }
    for (let i = 0; i < entry.count; i += 1) {
      deck.push(entry.card);
    }
  }

  return deck;
}
