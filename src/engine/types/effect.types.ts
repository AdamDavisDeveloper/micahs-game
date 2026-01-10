export type ClassId = 'wiseman' | 'knight' | 'assassin' | 'paladin';
export type StatKey = 'attack' | 'charisma' | 'speed';

export type Condition = { kind: 'classIs'; classId: ClassId };

export type Effect =
  | { kind: 'hp.add'; amount: number }
  | { kind: 'stat.die.upgrade'; stat: StatKey; steps: number }
  | { kind: 'stat.modifier.add'; stat: StatKey; amount: number };

export type EffectRepeat = 'once' | 'eachTurnStart';

export type EffectSpec = {
  effect: Effect;
  repeat: EffectRepeat;
};

export type ConditionalEffectSpec = EffectSpec & {
  condition: Condition;
};

export function classIs(classId: ClassId): Condition {
  return { kind: 'classIs', classId };
}
