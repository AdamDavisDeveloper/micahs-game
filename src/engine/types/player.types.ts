import type { DicePool } from './dice.types';
import type { ClassId, StatKey } from './effect.types';
import type { ClothingCard, Creature, TreasureCard, WeaponCard } from './card.types';

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

  equippedWeapon?: WeaponCard;
  wornClothing?: ClothingCard;

  // player's charmed creatures
  creatureDock: readonly Creature[];

  // companion is an actively selected creature from dock
  companion?: Creature;
};
