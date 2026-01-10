import type { TreasureCard } from '../../../engine/types/card.types';
import { clothing } from './clothing';
import { weapons } from './weapons';
import { singleUse } from './singleuse';

export const allTreasure: readonly TreasureCard[] = [...clothing, ...weapons, ...singleUse];
