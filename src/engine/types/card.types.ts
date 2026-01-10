import type { ClassId, ConditionalEffectSpec, EffectSpec } from './effect.types';

export type CardId = string;

export type WeatherId = 'sunny' | 'foggy' | 'storming' | 'snowing';

export type WeatherCard = {
  kind: 'weather';
  id: WeatherId;
  name: string;
  effects: readonly EffectSpec[];
  conditionals: readonly ConditionalEffectSpec[];
};

export type TreasureKind = 'weapon' | 'clothing' | 'singleUse';

export type TreasureCardBase = {
  kind: 'treasure';
  treasureKind: TreasureKind;
  id: CardId;
  name: string;
  sellValue: number;
  merchantPrice: number;
};

export type WeaponCard = TreasureCardBase & {
  treasureKind: 'weapon';
  effects: {
    standard: readonly EffectSpec[];
    conditional: readonly (ConditionalEffectSpec & { condition: { kind: 'classIs'; classId: ClassId } })[];
  };
};

export type ClothingCard = TreasureCardBase & {
  treasureKind: 'clothing';
  effects: readonly EffectSpec[];
};

export type SingleUseCard = TreasureCardBase & {
  treasureKind: 'singleUse';
  effects: readonly EffectSpec[];
};

export type TreasureCard = WeaponCard | ClothingCard | SingleUseCard;

export type EncounterCard = {
  kind: 'encounter';
  id: CardId;
  name: string;

  // Minimal for Day 1-2; you’ll flesh this out later (Day 3-4)
  attack?: { kind: 'dice'; sides: number; modifier?: number } | { kind: 'static'; value: number };
  defenseTarget?: number; // target number to beat for Attack (example)
};
