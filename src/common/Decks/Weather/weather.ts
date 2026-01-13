import type { WeatherCard } from '../../../engine/types/card.types';
import { classIs } from '../../../engine/types/effect.types';

export const weather: Record<string, WeatherCard> = {
  sunny: {
    cardClass: 'weather',
    id: 'sunny',
    name: 'Sunny',
    effects: [
      { effect: { kind: 'hp.add', amount: 1 }, repeat: 'eachTurnStart' },
      { effect: { kind: 'stat.die.upgrade', stat: 'charisma', steps: 1 }, repeat: 'once' },
    ],
    conditionals: [
      { effect: { kind: 'stat.die.upgrade', stat: 'charisma', steps: 3 }, repeat: 'once', condition: classIs('wiseman') },
      { effect: { kind: 'hp.add', amount: -1 }, repeat: 'once', condition: classIs('paladin') },
    ],
  },

  foggy: {
    cardClass: 'weather',
    id: 'foggy',
    name: 'Foggy',
    effects: [{ effect: { kind: 'stat.modifier.add', stat: 'speed', amount: -2 }, repeat: 'once' }],
    conditionals: [{ effect: { kind: 'stat.die.upgrade', stat: 'attack', steps: 1 }, repeat: 'once', condition: classIs('assassin') }],
  },

  storming: {
    cardClass: 'weather',
    id: 'storming',
    name: 'Storming',
    effects: [],
    conditionals: [],
  },

  snowing: {
    cardClass: 'weather',
    id: 'snowing',
    name: 'Snowing',
    effects: [{ effect: { kind: 'hp.add', amount: -1 }, repeat: 'eachTurnStart' }],
    conditionals: [{ effect: { kind: 'stat.modifier.add', stat: 'speed', amount: -2 }, repeat: 'once', condition: classIs('assassin') }],
  },
};
