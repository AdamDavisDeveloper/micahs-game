import type { ClothingCard, TreasureCard, WeaponCard } from '../types/card.types';
import type { Player } from '../types/player.types';

function removeFirstById(items: readonly TreasureCard[], id: string): { next: readonly TreasureCard[]; removed?: TreasureCard } {
  const idx = items.findIndex((x) => x.id === id);
  if (idx === -1) return { next: items, removed: undefined };
  const copy = [...items];
  const [removed] = copy.splice(idx, 1);
  return { next: copy, removed };
}

export class InventorySystem {
  static addItem(player: Player, item: TreasureCard): Player {
    return { ...player, inventory: [...player.inventory, item] };
  }

  static removeItem(player: Player, itemId: string): Player {
    return { ...player, inventory: player.inventory.filter((x) => x.id !== itemId) };
  }

  /**
   * Equip weapon by id from inventory:
   * - removes it from inventory
   * - swaps current equipped weapon back into inventory (if any)
   */
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
}
