import type { EncounterCard } from '../types/card.types';
import { GameState } from './GameState';

const e1: EncounterCard = { kind: 'encounter', id: 'e1', name: 'Test Encounter' };

test('GameState: draw -> resolve -> endTurn works', () => {
  const state1 = GameState.create({
    players: [
      {
        id: 'p1',
        name: 'P1',
        classId: 'wiseman',
        hp: 45,
        maxHp: 45,
        coin: 0,
        stats: { attack: { dice: [4] }, charisma: { dice: [8] }, speed: { dice: [6] } },
        inventory: [],
      },
    ],
    encounterDeck: [e1],
  });

  const state2 = state1.drawEncounter();
  expect(state2.getPhase()).toBe('encounter');
  expect(state2.getActiveEncounter()?.id).toBe('e1');

  const state3 = state2.resolveEncounterToGraveyard();
  expect(state3.getPhase()).toBe('resolution');
  expect(state3.getActiveEncounter()).toBeUndefined();

  const state4 = state3.endTurn();
  expect(state4.getPhase()).toBe('preparation');
});
