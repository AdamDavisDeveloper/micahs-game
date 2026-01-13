import type { ClassId, ConditionalEffectSpec, EffectSpec } from './effect.types';

import type { DieSides } from './dice.types';

export type CardId = string;

export type WeatherId = 'sunny' | 'foggy' | 'storming' | 'snowing';

export type WeatherCard = {
  cardClass: 'weather';
  kind?: string; // Sub-class of weather card (e.g., "Sunny", "Stormy", etc.)
  id: WeatherId;
  name: string;
  description?: string;
  effects: readonly EffectSpec[];
  conditionals: readonly ConditionalEffectSpec[];
};

export type Creature = {
  id: CardId;
  name: string;
  kind?: string; // Sub-class of creature (e.g., "Creature", "Traveler", "Uncharmable", etc.)
  description?: string;
  attackDice: readonly DieSides[];
  defense: number;

  effects?: readonly EffectSpec[]; // Optional passive effects (ex: +1 coin each turn start)
};

export type TreasureKind = 'weapon' | 'clothing' | 'singleUse';

export type TreasureCardBase = {
  cardClass: 'treasure';
  treasureKind: TreasureKind;
  kind?: string; // Sub-class of treasure card (e.g., "Weapon", "Armor", etc.)
  id: CardId;
  name: string;
  description?: string;
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
  defense?: number | { kind: 'dice'; sides: number; modifier?: number } | { kind: 'static'; value: number };
  charm?: number;
  escape?: number;
};

export type EncounterReward =
  | { kind: 'coin'; amount: number }
  | { kind: 'treasure', amount: number }
  | { kind: 'none' }

export type EncounterCard = {
  cardClass: 'encounter';
  kind?: string; // Sub-class of encounter (e.g., "Creature", "Traveler", "Uncharmable", etc.)
  id: CardId;
  name: string;
  description?: string;

  // Enemy attack used on failure
  attack?: { kind: 'dice'; sides: number; modifier?: number } | { kind: 'static'; value: number };

  /**
   * Targets are per-intention.
   * - `defense` is required and used for attack intention (player's attack must meet/exceed this)
   *   - Can be a static number or a dice roll (e.g., { kind: 'dice', sides: 10 })
   * - `charm` and `escape` are optional and used for their respective intentions
   * - If a target is omitted for a supported intention, ActionResolver will throw.
   */
  targets: EncounterTarget;

  /**
   * Minimal, safe reward model for now: coin only.
   * Later I'll add treasure draws, weather changes, special effects, etc.
   */
  reward?: EncounterReward;

  /**
   * If present, this encounter supports Charm:
   * - on Charm success: add creature to player's dock, clear the encounter
   */
  charm?: {
    creature: Creature;
    reward?: EncounterReward;
  };

  /**
   * If present, changes the weather when this encounter is revealed.
   * Only specific encounters have this effect (e.g., Siren triggers Fog).
   */
  weatherChange?: WeatherId;
};
