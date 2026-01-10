import type { PlayerId } from '../types/player.types';
import { GameState } from './GameState';

export type GameAction =
  | { kind: 'drawEncounter' }
  | { kind: 'resolveEncounterToGraveyard' }
  | { kind: 'resolveEncounterAndShuffleBack' }
  | { kind: 'endTurn' }
  // Preparation stage (stubbed; I’ll flesh these out later)
  | { kind: 'shop' }
  | { kind: 'sellItem' }
  | { kind: 'equipItem' }
  | { kind: 'useItem' }
  | { kind: 'assignCompanion' };

export class GameRules {
  /**
   * Rules are “read-only”: they don’t change state.
   * They exist so UI/AI/etc can ask “is this allowed?” without duplicating logic.
   */
  static canPerformAction(playerId: PlayerId, action: GameAction, state: GameState): boolean {
    // Only the active player can act (spectators are read-only).
    if (playerId !== state.getActivePlayerId()) return false;

    const phase = state.getPhase();
    const hasEncounter = Boolean(state.getActiveEncounter());

    switch (action.kind) {
      case 'drawEncounter':
        return phase === 'preparation' && !hasEncounter;

      case 'resolveEncounterToGraveyard':
      case 'resolveEncounterAndShuffleBack':
        return phase === 'encounter' && hasEncounter;

      case 'endTurn':
        return phase === 'resolution' && !hasEncounter;

      // Preparation-only actions:
      case 'shop':
      case 'sellItem':
      case 'equipItem':
      case 'useItem':
      case 'assignCompanion':
        return phase === 'preparation' && !hasEncounter;

      default: {
        // Exhaustiveness check (if TS ever sees an unhandled action kind, I’ll get an error).
        const _exhaustive: never = action;
        return _exhaustive;
      }
    }
  }
}
