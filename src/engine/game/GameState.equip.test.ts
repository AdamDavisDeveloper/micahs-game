import type { WeaponCard } from '../types/card.types';
import type { Player } from '../types/player.types';
import { GameState } from './GameState';

const weapon: WeaponCard = {
  cardClass: 'treasure',
  treasureKind: 'weapon',
  id: 'weapon:test',
  name: 'Test Sword',
  sellValue: 0,
  merchantPrice: 1,
  effects: {
    standard: [{ effect: { kind: 'stat.die.upgrade', stat: 'attack', steps: 1 }, repeat: 'once' }],
    conditional: [],
  },
};

test('GameState: equipWeaponFromInventory applies weapon effects once', () => {
  const player: Player = {
    id: 'p1',
    name: 'P1',
    classId: 'wiseman',
    hp: 10,
    maxHp: 10,
    coin: 0,
    stats: { attack: { dice: [4] }, charisma: { dice: [8] }, speed: { dice: [6] } },
    inventory: [weapon],
    creatureDock: [],
  };

  const state1 = GameState.create({ players: [player], encounterDeck: [] });

  const state2 = state1.equipWeaponFromInventory('weapon:test');
  const snap = state2.snapshot();
  const p2 = snap.players[0];

  // Attack die should upgrade D4 -> D6
  expect(p2.stats.attack.dice[0]).toBe(6);
  expect(p2.equippedWeapon?.id).toBe('weapon:test');
});
