import type { Creature } from '../types/card.types';
import type { Player } from '../types/player.types';
import { InventorySystem } from './InventorySystem';

test('InventorySystem: assignCompanion selects creature from dock', () => {
  const c1: Creature = { id: 'c1', name: 'Buddy', attackDice: [4], defense: 4 };
  const c2: Creature = { id: 'c2', name: 'Goose', attackDice: [4], defense: 1 };

  const player: Player = {
    id: 'p1',
    name: 'P1',
    classId: 'wiseman',
    hp: 10,
    maxHp: 10,
    coin: 0,
    stats: { attack: { dice: [4] }, charisma: { dice: [8] }, speed: { dice: [6] } },
    inventory: [],
    creatureDock: [c1, c2],
  };

  const next = InventorySystem.assignCompanion(player, 'c2');
  expect(next.companion?.id).toBe('c2');
});
