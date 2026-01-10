import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import type { GameSnapshot } from '../../engine/types/game.types';
import type { Intention } from '../../engine/types/game.types';
import type { WeatherCard } from '../../engine/types/card.types';
import type { ResolutionOutcome } from '../../engine/game/ActionResolver';

/**
 * Game slice state - stores a snapshot of the game engine state.
 * This is kept in sync with the GameState instance (which lives outside Redux).
 */
type GameState = {
  // Core game state from GameSnapshot
  players: readonly GameSnapshot['players'];
  activePlayerId: string;
  phase: GameSnapshot['phase'];
  weather?: WeatherCard;
  activeEncounter?: GameSnapshot['activeEncounter'];

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
      state.players = snapshot.players;
      state.activePlayerId = snapshot.activePlayerId;
      state.phase = snapshot.phase;
      state.weather = snapshot.weather;
      state.activeEncounter = snapshot.activeEncounter;
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
      state.lastRollResult = action.payload;
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
