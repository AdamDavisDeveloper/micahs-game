import type { ClothingCard } from '../../../engine/types/card.types';

export const clothing: readonly ClothingCard[] = [
  {
    cardClass: 'treasure',
    treasureKind: 'clothing',
    id: 'clothing:placeholder',
    name: 'Placeholder Clothing',
    effects: [],
    sellValue: 0,
    merchantPrice: 9,
  },

  {
    cardClass: 'treasure',
    treasureKind: 'clothing',
    id: 'clothing:jetpack',
    name: 'Jetpack',
    effects: [{ kind: 'stat.die.upgrade', stat: 'Speed', steps: 2 }],
    merchantPrice: 11,
    sellValue: 7,
  },
];
