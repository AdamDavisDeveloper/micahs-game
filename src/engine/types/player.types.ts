import type { DicePool, DieSides } from './dice.types';
import type { ClassId, StatKey } from './effect.types';
import type { TreasureCard } from './card.types';

export type PlayerId = string;

export type PlayerStats = Record<StatKey, DicePool>;

export type Player = {
  id: PlayerId;
  name: string;
  classId: ClassId;

  hp: number;
  maxHp: number;

  coin: number;

  stats: PlayerStats;

  inventory: readonly TreasureCard[];

  // Minimal placeholder for now
  companion?: {
    id: string;
    name: string;
    attackDice: readonly DieSides[];
    defense: number;
  };
};
