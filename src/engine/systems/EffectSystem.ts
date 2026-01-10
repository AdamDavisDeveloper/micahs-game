import type { ConditionalEffectSpec, Condition, Effect, EffectSpec, EffectRepeat } from '../types/effect.types';
import type { DicePool } from '../types/dice.types';
import type { Player } from '../types/player.types';
import type { WeatherCard } from '../types/card.types';
import { upgradeDicePool } from '../utils/helpers';

export type EffectContext = {
  when: 'applyOnce' | 'turnStart';
};

function matchesCondition(player: Player, condition: Condition): boolean {
  switch (condition.kind) {
    case 'classIs':
      return player.classId === condition.classId;
    default: {
      const _exhaustive: never = condition;
      return _exhaustive;
    }
  }
}

function repeatMatches(context: EffectContext, repeat: EffectRepeat): boolean {
  if (context.when === 'turnStart') return repeat === 'eachTurnStart';
  return repeat === 'once';
}

function clampHp(hp: number, maxHp: number): number {
  return Math.max(0, Math.min(maxHp, hp));
}

function applyDiceUpgrade(pool: DicePool, steps: number): DicePool {
  return upgradeDicePool(pool, steps);
}

function applyEffect(player: Player, effect: Effect): Player {
  switch (effect.kind) {
    case 'hp.add': {
      const nextHp = clampHp(player.hp + effect.amount, player.maxHp);
      return { ...player, hp: nextHp };
    }

    case 'stat.die.upgrade': {
      const prev = player.stats[effect.stat];
      const next = applyDiceUpgrade(prev, effect.steps);
      return { ...player, stats: { ...player.stats, [effect.stat]: next } };
    }

    case 'stat.modifier.add': {
      const prev = player.stats[effect.stat];
      const prevMod = prev.modifier ?? 0;
      const next = { ...prev, modifier: prevMod + effect.amount };
      return { ...player, stats: { ...player.stats, [effect.stat]: next } };
    }

    default: {
      const _exhaustive: never = effect;
      return _exhaustive;
    }
  }
}

function applySpec(player: Player, spec: EffectSpec, ctx: EffectContext): Player {
  if (!repeatMatches(ctx, spec.repeat)) return player;
  return applyEffect(player, spec.effect);
}

function applyConditionalSpec(player: Player, spec: ConditionalEffectSpec, ctx: EffectContext): Player {
  if (!matchesCondition(player, spec.condition)) return player;
  return applySpec(player, spec, ctx);
}

export class EffectSystem {
  /**
   * Applies weather effects that trigger at the start of the active player's turn.
   * (weather effects apply only if active at start of your turn.)
   */
  static applyWeatherTurnStart(player: Player, weather?: WeatherCard): Player {
    if (!weather) return player;

    const ctx: EffectContext = { when: 'turnStart' };

    let next = player;
    for (const s of weather.effects) next = applySpec(next, s, ctx);
    for (const s of weather.conditionals) next = applyConditionalSpec(next, s, ctx);

    return next;
  }

  /**
   * Applies “one-time” effects (e.g. item purchased, weather on-set bonus, etc.)
   * We don't track "already applied" in state yet — caller controls when to call this.
   */
  static applyOnce(player: Player, specs: readonly EffectSpec[], conditional: readonly ConditionalEffectSpec[] = []): Player {
    const ctx: EffectContext = { when: 'applyOnce' };

    let next = player;
    for (const s of specs) next = applySpec(next, s, ctx);
    for (const s of conditional) next = applyConditionalSpec(next, s, ctx);

    return next;
  }
}
