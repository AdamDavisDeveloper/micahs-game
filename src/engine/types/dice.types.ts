export const DIE_SIDES = [4, 6, 8, 10, 12, 20] as const;
export type DieSides = (typeof DIE_SIDES)[number];

export type DiceTerm =
  | { kind: 'die'; sides: number } // supports any numeric die sides (enemy dice too)
  | { kind: 'static'; value: number };

export type DiceFormula = {
  terms: readonly DiceTerm[];
};

export type DicePool = {
  // For stats: multiple dice are rolled and summed
  dice: readonly DieSides[];
  modifier?: number; // static +N
};

export type RollDetail = {
  dieSides: number;
  value: number;
};

export type RollResult = {
  total: number;
  rolls: readonly RollDetail[];
  staticBonus: number;
};
