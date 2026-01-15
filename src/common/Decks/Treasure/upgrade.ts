import type { UpgradeCard } from '../../../engine/types/card.types';

export const upgrade: readonly UpgradeCard[] = [
  {
    cardClass: 'treasure',
    treasureKind: 'upgrade',
    id: 'upgrade:confidence-bost',
    name: 'Confidence Boost',
    effects: [{ kind: 'stat.die.upgrade', stat: 'Charisma', steps: 1 }],
    merchantPrice: 12,
    sellValue: 8,
  },
];



