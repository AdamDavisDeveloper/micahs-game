import { DiceSystem } from '../systems/DiceSystem';
import type { EncounterCard } from '../types/card.types';
import { GameState } from './GameState';
import type { Intention } from '../types/game.types';
import type { Player } from '../types/player.types';
import type { RollResult } from '../types/dice.types';

type Rng = () => number;

export type ResolutionOutcome = {
  intention: Intention;
  playerRoll: RollResult;
  companionRoll?: RollResult;
  total: number;
  target: number;
  success: boolean;

  // Defense roll (only present for attack intention when defense is a dice roll)
  defenseRoll?: RollResult;

  // Only present on failure when encounter attacks
  encounterAttackRoll?: RollResult;
  damageTaken?: number;
  companionDied?: boolean;
};

function rollEncounterDefense(encounter: EncounterCard, rng: Rng): RollResult {
  const { defense } = encounter.targets;
  if (!defense) {
    throw new Error(`Encounter ${encounter.id} has no defense target`);
  }

  if (typeof defense === 'number') {
    // Static value (backward compatibility)
    return { total: defense, rolls: [], staticBonus: 0 };
  }

  if (defense.kind === 'static') {
    return { total: defense.value, rolls: [], staticBonus: 0 };
  }

  // dice
  const die = DiceSystem.rollDie(defense.sides, rng);
  const staticBonus = defense.modifier ?? 0;
  return {
    total: die + staticBonus,
    rolls: [{ dieSides: defense.sides, value: die }],
    staticBonus,
  };
}

function getTarget(encounter: EncounterCard, intention: Intention): number {
  if (intention === 'attack') {
    if (encounter.targets.defense === undefined) {
      throw new Error(`Encounter ${encounter.id} has no defense target for attack intention`);
    }
    // If it's a static number, return it directly
    if (typeof encounter.targets.defense === 'number') {
      return encounter.targets.defense;
    }
    // If it's a dice roll, we'll handle it in resolveActiveEncounter
    // For now, throw an error (this will be handled by rolling in resolveActiveEncounter)
    throw new Error('Defense dice rolls must be handled in resolveActiveEncounter');
  }

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

function applyReward(player: Player, rewards: EncounterCard['reward']): Player {
  if (!rewards || rewards.length === 0) return player;

  let updatedPlayer = player;

  for (const reward of rewards) {
    if (reward.kind === 'none') continue;

    switch (reward.kind) {
      case 'coin':
        updatedPlayer = { ...updatedPlayer, coin: updatedPlayer.coin + reward.amount };
        break;
      case 'treasure':
        // TODO: Implement treasure card drawing logic
        // For now, just continue (player unchanged for treasure)
        // You'll need to add treasure cards to player's inventory
        break;
      default: {
        const _exhaustive: never = reward;
        return _exhaustive;
      }
    }
  }

  return updatedPlayer;
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

    // For attack intention, roll defense if it's a dice roll
    let target: number;
    let defenseRoll: RollResult | undefined;

    if (intention === 'attack') {
      if (encounter.targets.defense === undefined) {
        throw new Error(`Encounter ${encounter.id} has no defense target for attack intention`);
      }

      if (typeof encounter.targets.defense === 'number') {
        // Static defense value
        target = encounter.targets.defense;
      } else {
        // Dice roll defense
        defenseRoll = rollEncounterDefense(encounter, rng);
        target = defenseRoll.total;
      }
    } else {
      target = getTarget(encounter, intention);
    }

    const { playerRoll, companionRoll, total } = rollForIntention(player, intention, rng);
    const success = total >= target;

    // Escape is special: success means you just leave and the card returns.
    if (intention === 'escape' && success) {
      const nextState = state.resolveEncounterAndShuffleBack();
      return {
        state: nextState,
        outcome: { intention, playerRoll, companionRoll, total, target, success, defenseRoll },
      };
    }

   if (success) {
      // Charm success: convert into a creature (if defined), clear encounter (not graveyard)
      if (intention === 'charm') {
        if (!encounter.charm) throw new Error(`Encounter ${encounter.id} does not support charm`);

        const withCreature: Player = {
          ...player,
          creatureDock: [...player.creatureDock, encounter.charm.creature],
        };

        // Only apply reward if charm has a specific reward defined
        const charmReward = encounter.charm.reward ? [encounter.charm.reward] : undefined;
        const rewarded = applyReward(withCreature, charmReward);
        const nextState = state.updatePlayer(rewarded).resolveEncounterCleared();

        return {
          state: nextState,
          outcome: { intention, playerRoll, companionRoll, total, target, success, defenseRoll },
        };
      }

      // Attack success (and any other future "non-charm" success): to graveyard + reward
      const rewardedPlayer = applyReward(player, encounter.reward);
      const nextState =
        rewardedPlayer === player
          ? state.resolveEncounterToGraveyard()
          : state.updatePlayer(rewardedPlayer).resolveEncounterToGraveyard();

      return {
        state: nextState,
        outcome: { intention, playerRoll, companionRoll, total, target, success, defenseRoll },
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
      const deadCompanionId = player.companion.id;
      nextPlayer = {
        ...nextPlayer,
        companion: undefined,
        creatureDock: nextPlayer.creatureDock.filter((creature) => creature.id !== deadCompanionId),
      };
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
        defenseRoll,
        encounterAttackRoll,
        damageTaken,
        companionDied,
      },
    };
  }
}
