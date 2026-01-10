import type { DiceFormula, DicePool, DiceTerm, RollDetail, RollResult } from '../types/dice.types';
import { upgradeDicePool } from '../utils/helpers';

type Rng = () => number;

export class DiceSystem {
  static rollDie(sides: number, rng: Rng = Math.random): number {
    if (!Number.isFinite(sides) || sides <= 0) throw new Error(`Invalid die sides: ${sides}`);
    return Math.floor(rng() * sides) + 1;
  }

  static rollDice(diceSides: readonly number[], rng: Rng = Math.random): RollResult {
    const rolls: RollDetail[] = diceSides.map((sides) => ({
      dieSides: sides,
      value: DiceSystem.rollDie(sides, rng),
    }));
    const total = rolls.reduce((sum, r) => sum + r.value, 0);
    return { total, rolls, staticBonus: 0 };
  }

  static rollDicePool(pool: DicePool, rng: Rng = Math.random): RollResult {
    const base = DiceSystem.rollDice(pool.dice, rng);
    const staticBonus = pool.modifier ?? 0;
    return {
      ...base,
      total: base.total + staticBonus,
      staticBonus,
    };
  }

  static rollFormula(formula: DiceFormula, rng: Rng = Math.random): RollResult {
    let staticBonus = 0;
    const dice: number[] = [];

    for (const term of formula.terms) {
      if (term.kind === 'static') staticBonus += term.value;
      else dice.push(term.sides);
    }

    const base = DiceSystem.rollDice(dice, rng);
    return {
      ...base,
      total: base.total + staticBonus,
      staticBonus,
    };
  }

  static upgradePool(pool: DicePool, steps: number): DicePool {
    return upgradeDicePool(pool, steps);
  }

  static toFormula(term: DiceTerm): DiceFormula {
    return { terms: [term] };
  }
}
