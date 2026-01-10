import type { DicePool, DieSides } from '../types/dice.types';

const PROGRESSION: readonly DieSides[] = [4, 6, 8, 10, 12, 20] as const;

export function nextDieSides(current: DieSides): DieSides {
  const idx = PROGRESSION.indexOf(current);
  if (idx < 0) return 4;
  return PROGRESSION[Math.min(idx + 1, PROGRESSION.length - 1)];
}

/**
 * Upgrade rules
 * - Upgrade the "smallest" die that isn't D20
 * - If all dice are D20, add a new die starting at D4
 * This produces results like D20 + D20 + D6 over time.
 */
export function upgradeDicePool(pool: DicePool, steps: number): DicePool {
  let dice = [...pool.dice];

  for (let i = 0; i < steps; i += 1) {
    const smallestIdx = dice
      .map((sides, idx) => ({ sides, idx }))
      .filter((d) => d.sides !== 20)
      .sort((a, b) => a.sides - b.sides)[0]?.idx;

    if (smallestIdx === undefined) {
      dice.push(4);
    } else {
      dice[smallestIdx] = nextDieSides(dice[smallestIdx]);
    }
  }

  // Keep a stable ordering (largest to smallest) for readability
  dice.sort((a, b) => b - a);
  return { ...pool, dice };
}
