import type { ClothingCard, Creature, TreasureCard, WeaponCard } from '../types/card.types';
import type { Player } from '../types/player.types';

function removeFirstById(items: readonly TreasureCard[], id: string): { next: readonly TreasureCard[]; removed?: TreasureCard } {
  const idx = items.findIndex((x) => x.id === id);
  if (idx === -1) return { next: items, removed: undefined };
  const copy = [...items];
  const [removed] = copy.splice(idx, 1);
  return { next: copy, removed };
}

function findCreatureById(dock: readonly Creature[], id: string): Creature | undefined {
  return dock.find((c) => c.id === id);
}

/**
 * InventorySystem is pure and dumb:
 * - it does not check turn phase (GameRules/GameState should do that)
 * - it does not roll dice
 * - it does not apply effects (EffectSystem does that)
 */
export class InventorySystem {
  static addItem(player: Player, item: TreasureCard): Player {
    return { ...player, inventory: [...player.inventory, item] };
  }

  static removeItem(player: Player, itemId: string): Player {
    return { ...player, inventory: player.inventory.filter((x) => x.id !== itemId) };
  }

  static equipWeapon(player: Player, weaponId: string): Player {
    const { next: invWithout, removed } = removeFirstById(player.inventory, weaponId);
    if (!removed || removed.kind !== 'treasure' || removed.treasureKind !== 'weapon') return player;

    const weapon = removed as WeaponCard;
    const returned = player.equippedWeapon ? [player.equippedWeapon] : [];

    return {
      ...player,
      inventory: [...invWithout, ...returned],
      equippedWeapon: weapon,
    };
  }

  static equipClothing(player: Player, clothingId: string): Player {
    const { next: invWithout, removed } = removeFirstById(player.inventory, clothingId);
    if (!removed || removed.kind !== 'treasure' || removed.treasureKind !== 'clothing') return player;

    const clothing = removed as ClothingCard;
    const returned = player.wornClothing ? [player.wornClothing] : [];

    return {
      ...player,
      inventory: [...invWithout, ...returned],
      wornClothing: clothing,
    };
  }

  static unequipWeapon(player: Player): Player {
    if (!player.equippedWeapon) return player;
    return {
      ...player,
      inventory: [...player.inventory, player.equippedWeapon],
      equippedWeapon: undefined,
    };
  }

  static unequipClothing(player: Player): Player {
    if (!player.wornClothing) return player;
    return {
      ...player,
      inventory: [...player.inventory, player.wornClothing],
      wornClothing: undefined,
    };
  }

  /**
   * Assigns a creature from dock to be the active companion.
   * Companion participates in combat (attack roll add + defense check).
   */
  static assignCompanion(player: Player, creatureId: string): Player {
    const creature = findCreatureById(player.creatureDock, creatureId);
    if (!creature) return player;
    return { ...player, companion: creature };
  }

  static removeCompanion(player: Player): Player {
    if (!player.companion) return player;
    return { ...player, companion: undefined };
  }
}
