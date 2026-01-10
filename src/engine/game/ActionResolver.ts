import type { Intention } from '../types/game.types';
import type { EncounterCard } from '../types/card.types';
import type { Player } from '../types/player.types';
import type { RollResult } from '../types/dice.types';
import { DiceSystem } from '../systems/DiceSystem';
import { GameState } from './GameState';

type Rng = () => number;

export type ResolutionOutcome = {
  intention: Intention;
  playerRoll: RollResult;
  companionRoll?: RollResult;
  total: number;
  target: number;
  success: boolean;

  // Only present on failure when encounter attacks
  encounterAttackRoll?: RollResult;
  damageTaken?: number;
  companionDied?: boolean;
};

function getTarget(encounter: EncounterCard, intention: Intention): number {
  const t = encounter.targets[intention];
  if (t === undefined) throw new Error(`Encounter ${encounter.id} has no target for intention: ${intention}`);
  return t;
}

function rollEncounterAttack(encounter: EncounterCard, rng: Rng): RollResult {
  const atk = encounter.attack;
  if (!atk) return { total: 0, rolls: [], staticBonus: 0 };

  if (atk.kind === 'static') return { total: atk.value, rolls: [], staticBonus: 0 };

  // dice
  const die = DiceSystem.rollDie(atk.sides, rng);
  const staticBonus = atk.modifier ?? 0;
  return {
    total: die + staticBonus,
    rolls: [{ dieSides: atk.sides, value: die }],
    staticBonus,
  };
}

function rollForIntention(player: Player, intention: Intention, rng: Rng): { playerRoll: RollResult; companionRoll?: RollResult; total: number } {
  const stat =
    intention === 'attack' ? 'attack' : intention === 'charm' ? 'charisma' : 'speed';

  const playerRoll = DiceSystem.rollDicePool(player.stats[stat], rng);

  if (intention !== 'attack' || !player.companion) {
    return { playerRoll, total: playerRoll.total };
  }

  const companionRoll = DiceSystem.rollDice(player.companion.attackDice, rng);
  return { playerRoll, companionRoll, total: playerRoll.total + companionRoll.total };
}

function applyReward(player: Player, reward: EncounterCard['reward']): Player {
  if (!reward || reward.kind === 'none') return player;

  switch (reward.kind) {
    case 'coin':
      return { ...player, coin: player.coin + reward.amount };
    default: {
      const _exhaustive: never = reward;
      return _exhaustive;
    }
  }
}

export class ActionResolver {
  /**
   * Resolves the active encounter with the chosen intention.
   */
  static resolveActiveEncounter(state: GameState, intention: Intention, rng: Rng = Math.random): { state: GameState; outcome: ResolutionOutcome } {
    const encounter = state.getActiveEncounter();
    if (!encounter) throw new Error('No active encounter');
    if (state.getPhase() !== 'encounter') throw new Error('Must be in encounter phase to resolve');

    const player = state.getActivePlayer();
    const target = getTarget(encounter, intention);

    const { playerRoll, companionRoll, total } = rollForIntention(player, intention, rng);
    const success = total >= target;

    // Escape is special: success means you just leave and the card returns.
    if (intention === 'escape' && success) {
      const nextState = state.resolveEncounterAndShuffleBack();
      return {
        state: nextState,
        outcome: { intention, playerRoll, companionRoll, total, target, success },
      };
    }

    if (success) {
      const rewardedPlayer = applyReward(player, encounter.reward);
      const nextState =
        rewardedPlayer === player
          ? state.resolveEncounterToGraveyard()
          : state.updatePlayer(rewardedPlayer).resolveEncounterToGraveyard();

      return {
        state: nextState,
        outcome: { intention, playerRoll, companionRoll, total, target, success },
      };
    }

    // Failure: encounter attacks (binary damage, no mitigation yet)
    const encounterAttackRoll = rollEncounterAttack(encounter, rng);
    const damageTaken = encounterAttackRoll.total;

    let nextPlayer: Player = { ...player, hp: Math.max(0, player.hp - damageTaken) };

    // Companion death rule: if encounter atk meets or exceeds companion defense, companion dies.
    let companionDied = false;
    if (player.companion && encounterAttackRoll.total >= player.companion.defense) {
      companionDied = true; // tragedy!! :c
      nextPlayer = { ...nextPlayer, companion: undefined };
    }

    // Update player, then shuffle encounter back and advance to resolution
    const nextState = state.updatePlayer(nextPlayer).resolveEncounterAndShuffleBack();

    return {
      state: nextState,
      outcome: {
        intention,
        playerRoll,
        companionRoll,
        total,
        target,
        success,
        encounterAttackRoll,
        damageTaken,
        companionDied,
      },
    };
  }
}
