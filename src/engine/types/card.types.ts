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

export type EncounterTarget = {
  attack?: number;
  charm?: number;
  escape?: number;
};

export type EncounterReward =
  | { kind: 'coin'; amount: number }
  | { kind: 'none' };

export type EncounterCard = {
  kind: 'encounter';
  id: CardId;
  name: string;

  // Enemy attack used on failure
  attack?: { kind: 'dice'; sides: number; modifier?: number } | { kind: 'static'; value: number };

  /**
   * Targets are per-intention.
   * If a target is omitted, treat it as "not supported" (ActionResolver will throw).
   */
  targets: EncounterTarget;

  /**
   * Minimal, safe reward model for now: coin only.
   * Later I'll add treasure draws, weather changes, special effects, etc.
   */
  reward?: EncounterReward;
};
