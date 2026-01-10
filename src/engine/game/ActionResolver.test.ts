import type { EncounterCard } from '../types/card.types';
import type { Player } from '../types/player.types';
import { GameState } from './GameState';
import { ActionResolver } from './ActionResolver';

function makeRng(sequence: number[]) {
  // Returns numbers in order; if you call too many times, it throws (catches test mistakes).
  let i = 0;
  return () => {
    if (i >= sequence.length) throw new Error('RNG sequence exhausted');
    const v = sequence[i];
    i += 1;
    return v;
  };
}

function basePlayer(overrides: Partial<Player> = {}): Player {
  return {
    id: 'p1',
    name: 'P1',
    classId: 'wiseman',
    hp: 10,
    maxHp: 10,
    coin: 0,
    stats: { attack: { dice: [4] }, charisma: { dice: [8] }, speed: { dice: [6] } },
    inventory: [],
    ...overrides,
  };
}

test('ActionResolver (attack): success sends encounter to graveyard and enters resolution', () => {
  const encounter: EncounterCard = {
    kind: 'encounter',
    id: 'e1',
    name: 'Training Dummy',
    targets: { attack: 6, charm: 6, escape: 2 },
    reward: { kind: 'coin', amount: 3 },
  };

  const state = GameState.create({
    players: [
      basePlayer({
        companion: { id: 'c1', name: 'Buddy', attackDice: [4], defense: 4 },
      }),
    ],
    encounterDeck: [encounter],
  })
    .drawEncounter(); // preparation -> encounter

  // D4 roll mapping: floor(rng * 4) + 1
  // 0.999 -> 4
  const rng = makeRng([0.999, 0.999]); // player attack=4, companion attack=4

  const { state: next, outcome } = ActionResolver.resolveActiveEncounter(state, 'attack', rng);

  expect(outcome.success).toBe(true);
  expect(outcome.total).toBe(8);
  expect(next.snapshot().players[0].coin).toBe(3);
  expect(next.getPhase()).toBe('resolution');
  expect(next.getActiveEncounter()).toBeUndefined();
});

test('ActionResolver (attack): failure deals damage, shuffles back, companion lives on tie (exceeds rule)', () => {
  const encounter: EncounterCard = {
    kind: 'encounter',
    id: 'e2',
    name: 'Mean Creature',
    targets: { attack: 6 },
    attack: { kind: 'dice', sides: 4 }, // uses RNG
  };

  const state = GameState.create({
    players: [
      basePlayer({
        hp: 10,
        companion: { id: 'c1', name: 'Buddy', attackDice: [4], defense: 4 },
      }),
    ],
    encounterDeck: [encounter],
    // Keep shuffle deterministic: just put the failed encounter back on top in this test
    shuffler: (cards) => cards,
  }).drawEncounter();

  // player D4=1, companion D4=1 (fail), encounter attack D4=4 (damage)
  const rng = makeRng([0.0, 0.0, 0.999]);

  const { state: next, outcome } = ActionResolver.resolveActiveEncounter(state, 'attack', rng);

  expect(outcome.success).toBe(false);
  expect(outcome.damageTaken).toBe(3);
  expect(next.getPhase()).toBe('resolution');
  expect(next.getActiveEncounter()).toBeUndefined();

  // Companion should live because 3 is not greater than or equal to defense 4
  expect(outcome.companionDied).toBe(false);
});
