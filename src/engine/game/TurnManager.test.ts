import { TurnManager } from './TurnManager';

test('TurnManager: phase cycles and nextTurn advances player', () => {
  const tm1 = TurnManager.create(['p1', 'p2']);
  expect(tm1.getCurrentPlayerId()).toBe('p1');
  expect(tm1.getPhase()).toBe('preparation');

  const tm2 = tm1.nextPhase();
  expect(tm2.getPhase()).toBe('encounter');

  const tm3 = tm2.nextPhase();
  expect(tm3.getPhase()).toBe('resolution');

  const tm4 = tm3.nextTurn();
  expect(tm4.getPhase()).toBe('preparation');
  expect(tm4.getCurrentPlayerId()).toBe('p2');
});
