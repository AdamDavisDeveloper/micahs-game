import type { DicePool } from '../types/dice.types';

export function assertNonNegativeInt(value: number, name: string): void {
  if (!Number.isInteger(value) || value < 0) throw new Error(`${name} must be a non-negative integer`);
}

export function assertValidDicePool(pool: DicePool): void {
  if (pool.dice.length === 0) throw new Error('DicePool must have at least one die');
  pool.dice.forEach((s) => {
    if (![4, 6, 8, 10, 12, 20].includes(s)) throw new Error(`Invalid DieSides: ${s}`);
  });
}
