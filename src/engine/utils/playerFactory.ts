import type { Player } from '../types/player.types';
import type { ClassDefinition } from '../../common/Decks/Characters/classes';

/**
 * Converts class data (maxHp + base dice) into a full Player object.
 */
export function createPlayerFromClass(args: {
  id: string;
  name: string;
  classDef: ClassDefinition;
}): Player {
  const { id, name, classDef } = args;

  return {
    id,
    name,
    classId: classDef.id,

    hp: classDef.maxHp,
    maxHp: classDef.maxHp,

    coin: 0,

    stats: {
      attack: { dice: [classDef.attack] },
      charisma: { dice: [classDef.charisma] },
      speed: { dice: [classDef.speed] },
    },

    inventory: [],
  };
}
