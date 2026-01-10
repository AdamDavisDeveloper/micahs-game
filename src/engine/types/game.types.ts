import type { EncounterCard, WeatherCard } from './card.types';
import type { Player, PlayerId } from './player.types';

export type TurnPhase = 'preparation' | 'encounter' | 'resolution';
export type Intention = 'attack' | 'charm' | 'escape';

/**
 * A plain-data snapshot of game state.
 */
export type GameSnapshot = {
  players: readonly Player[];
  activePlayerId: PlayerId;
  phase: TurnPhase;

  weather?: WeatherCard;
  activeEncounter?: EncounterCard;
};
