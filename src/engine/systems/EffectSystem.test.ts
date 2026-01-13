import { EffectSystem } from './EffectSystem';
import type { Player } from '../types/player.types';
import type { WeatherCard } from '../types/card.types';

test('EffectSystem: weather eachTurnStart applies hp.add', () => {
  const player: Player = {
    id: 'p1',
    name: 'P1',
    classId: 'wiseman',
    hp: 35,
    maxHp: 45,
    coin: 0,
    stats: { attack: { dice: [4] }, charisma: { dice: [8] }, speed: { dice: [6] } },
    inventory: [],
  };

  const weather: WeatherCard = {
    cardClass: 'weather',
    id: 'sunny',
    name: 'Sunny',
    effects: [{ effect: { kind: 'hp.add', amount: 1 }, repeat: 'eachTurnStart' }],
    conditionals: [],
  };

  const next = EffectSystem.applyWeatherTurnStart(player, weather);
  expect(next.hp).toBe(36);
});
