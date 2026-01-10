import type { WeaponCard } from '../../../engine/types/card.types';
import { classIs } from '../../../engine/types/effect.types';

export const weapons: readonly WeaponCard[] = [
  {
    kind: 'treasure',
    treasureKind: 'weapon',
    id: 'weapon:red-katana',
    name: 'Red Katana',
    effects: {
      standard: [{ effect: { kind: 'stat.die.upgrade', stat: 'attack', steps: 1 }, repeat: 'once' }],
      conditional: [
        {
          effect: { kind: 'stat.die.upgrade', stat: 'attack', steps: 1 },
          repeat: 'once',
          condition: classIs('assassin'),
        },
      ],
    },
    sellValue: 0,
    merchantPrice: 9,
  },
];
