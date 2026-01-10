import type { PlayerId } from '../types/player.types';
import type { TurnPhase } from '../types/game.types';

export type TurnManagerState = {
  order: readonly PlayerId[];
  activeIndex: number;
  phase: TurnPhase;
};

/**
 * TurnManager is intentionally narrow:
 * - It does NOT know about encounters, weather, etc.
 * - It only knows "whose turn is it?" and "what phase are we in?"
 * This keeps it reusable and easy to test.
 */
export class TurnManager {
  private readonly state: TurnManagerState;

  private constructor(state: TurnManagerState) {
    if (state.order.length === 0) throw new Error('Turn order cannot be empty');
    if (state.activeIndex < 0 || state.activeIndex >= state.order.length) {
      throw new Error('activeIndex out of bounds');
    }
    this.state = state;
  }

  static create(order: readonly PlayerId[]): TurnManager {
    return new TurnManager({ order: [...order], activeIndex: 0, phase: 'preparation' });
  }

  snapshot(): TurnManagerState {
    // Return a copy so callers don’t accidentally mutate internal arrays.
    return { ...this.state, order: [...this.state.order] };
  }

  getCurrentPlayerId(): PlayerId {
    return this.state.order[this.state.activeIndex];
  }

  getPhase(): TurnPhase {
    return this.state.phase;
  }

  /**
   * Preparation -> Encounter -> Resolution
   */
  nextPhase(): TurnManager {
    const phase: TurnPhase =
      this.state.phase === 'preparation'
        ? 'encounter'
        : this.state.phase === 'encounter'
          ? 'resolution'
          : 'preparation';

    return new TurnManager({ ...this.state, phase });
  }

  /**
   * Ends the turn:
   * - advances active player
   * - resets phase to preparation
   */
  nextTurn(): TurnManager {
    const nextIndex = (this.state.activeIndex + 1) % this.state.order.length;
    return new TurnManager({
      order: [...this.state.order],
      activeIndex: nextIndex,
      phase: 'preparation',
    });
  }
}
