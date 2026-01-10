import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import type { GameSnapshot, Intention } from '../../engine/types/game.types';
import type { Player } from '../../engine/types/player.types';
import type { WeatherCard, EncounterCard } from '../../engine/types/card.types';
import type { ResolutionOutcome } from '../../engine/game/ActionResolver';

/**
 * Game slice state - stores a snapshot of the game engine state.
 * This is kept in sync with the GameState instance (which lives outside Redux).
 * Note: We use mutable arrays here because Immer/Redux Toolkit requires mutable types.
 */
type GameState = {
  // Core game state from GameSnapshot
  players: Player[];
  activePlayerId: string;
  phase: GameSnapshot['phase'];
  weather?: WeatherCard;
  activeEncounter?: EncounterCard;

  // UI-specific state (not in engine)
  selectedIntention?: Intention;
  lastRollResult?: ResolutionOutcome;
  isGameActive: boolean;
};

const initialState: GameState = {
  players: [],
  activePlayerId: '',
  phase: 'preparation',
  weather: undefined,
  activeEncounter: undefined,
  selectedIntention: undefined,
  lastRollResult: undefined,
  isGameActive: false,
};

export const gameSlice = createSlice({
  name: 'game',
  initialState,
  reducers: {
    /**
     * Initialize game with a snapshot from the engine.
     * Called whenever GameState changes.
     */
    syncGameState: (state, action: PayloadAction<GameSnapshot>) => {
      const snapshot = action.payload;
      // Convert readonly arrays to mutable arrays for Immer
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      state.players = [...snapshot.players] as any;
      state.activePlayerId = snapshot.activePlayerId;
      state.phase = snapshot.phase;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      state.weather = snapshot.weather ? ({ ...snapshot.weather } as any) : undefined;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      state.activeEncounter = snapshot.activeEncounter
        ? ({ ...snapshot.activeEncounter } as any)
        : undefined;
      state.isGameActive = true;
    },

    /**
     * Start a new game.
     * The actual game initialization happens in the engine,
     * then syncGameState is called with the result.
     */
    startGame: (state) => {
      state.isGameActive = true;
      state.phase = 'preparation';
      state.selectedIntention = undefined;
      state.lastRollResult = undefined;
    },

    /**
     * End the current game.
     */
    endGame: (state) => {
      state.isGameActive = false;
      state.activeEncounter = undefined;
      state.selectedIntention = undefined;
      state.lastRollResult = undefined;
    },

    /**
     * Player selects their intention for the encounter.
     */
    setIntention: (state, action: PayloadAction<Intention>) => {
      if (state.phase !== 'encounter') {
        // Intention can only be set during encounter phase
        return;
      }
      state.selectedIntention = action.payload;
    },

    /**
     * Clear the selected intention (e.g., if player changes mind before rolling).
     */
    clearIntention: (state) => {
      state.selectedIntention = undefined;
    },

    /**
     * Store the result of a dice roll/resolution.
     * This is for UI display purposes.
     */
    setRollResult: (state, action: PayloadAction<ResolutionOutcome>) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      state.lastRollResult = { ...action.payload } as any;
    },

    /**
     * Clear the last roll result (e.g., when starting a new turn).
     */
    clearRollResult: (state) => {
      state.lastRollResult = undefined;
    },
  },
});

export const {
  syncGameState,
  startGame,
  endGame,
  setIntention,
  clearIntention,
  setRollResult,
  clearRollResult,
} = gameSlice.actions;

export default gameSlice.reducer;
