import type { ClassId } from '../../../engine/types/effect.types';
import type { DieSides } from '../../../engine/types/dice.types';

export type ClassDefinition = {
  id: ClassId;
  name: string;

  maxHp: number;

  attack: DieSides;
  charisma: DieSides;
  speed: DieSides;
};

export const classes: Record<ClassId, ClassDefinition> = {
  wiseman: { id: 'wiseman', name: 'Wiseman', maxHp: 45, charisma: 8, attack: 4, speed: 6 },
  knight: { id: 'knight', name: 'Knight', maxHp: 50, charisma: 6, attack: 6, speed: 6 },
  assassin: { id: 'assassin', name: 'Assassin', maxHp: 40, charisma: 4, attack: 8, speed: 10 },
  paladin: { id: 'paladin', name: 'Paladin', maxHp: 70, charisma: 4, attack: 10, speed: 4 },
};
