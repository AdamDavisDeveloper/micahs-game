import { useRef, useCallback } from 'react';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { GameState } from '../engine/game/GameState';
import { ActionResolver } from '../engine/game/ActionResolver';
import { DiceSystem } from '../engine/systems/DiceSystem';
import type { GameStateInit } from '../engine/game/GameState';
import type { Intention } from '../engine/types/game.types';
import type { Player } from '../engine/types/player.types';
import type { WeatherCard } from '../engine/types/card.types';
import type { ResolutionOutcome } from '../engine/game/ActionResolver';
import {
  syncGameState,
  setIntention,
  setRollResult,
  clearRollResult,
  clearIntention,
  startGame,
  endGame,
} from '../store/slices/game.slice';
import { syncPlayers } from '../store/slices/player.slice';

/**
 * Hook to access and interact with the game engine.
 *
 * This hook manages a GameState instance and syncs it with Redux.
 * The GameState instance persists across renders using useRef.
 */
export function useGameEngine() {
  const dispatch = useAppDispatch();
  const gameStateRef = useRef<GameState | null>(null);

  /**
   * Initialize a new game.
   */
  const initializeGame = useCallback(
    (init: GameStateInit) => {
      const newGameState = GameState.create(init);
      gameStateRef.current = newGameState;

      // Sync to Redux
      dispatch(startGame());
      dispatch(syncGameState(newGameState.snapshot()));
      dispatch(syncPlayers(newGameState.snapshot().players));
    },
    [dispatch],
  );

  /**
   * Sync Redux with current game state.
   * Call this after any game state mutation.
   */
  const syncToRedux = useCallback(() => {
    const state = gameStateRef.current;
    if (!state) return;

    dispatch(syncGameState(state.snapshot()));
    dispatch(syncPlayers(state.snapshot().players));
  }, [dispatch]);

  /**
   * Start the active player's turn (applies turn-start effects).
   */
  const startTurn = useCallback(() => {
    const state = gameStateRef.current;
    if (!state) throw new Error('Game not initialized');

    const newState = state.startTurn();
    gameStateRef.current = newState;
    syncToRedux();
  }, [syncToRedux]);

  /**
   * Draw an encounter card (moves from preparation to encounter phase).
   */
  const drawEncounter = useCallback(() => {
    const state = gameStateRef.current;
    if (!state) throw new Error('Game not initialized');

    const newState = state.drawEncounter();
    gameStateRef.current = newState;
    syncToRedux();
  }, [syncToRedux]);

  /**
   * Resolve an encounter with the selected intention.
   * Rolls dice, applies outcomes, and updates game state.
   */
  const resolveEncounter = useCallback(
    (intention: Intention, rng: () => number = Math.random) => {
      const state = gameStateRef.current;
      if (!state) throw new Error('Game not initialized');

      const { state: newState, outcome } = ActionResolver.resolveActiveEncounter(
        state,
        intention,
        rng,
      );
      gameStateRef.current = newState;

      // Store roll result in Redux for UI display
      dispatch(setRollResult(outcome));

      syncToRedux();

      return outcome;
    },
    [dispatch, syncToRedux],
  );

  /**
   * End the current turn (moves to next player).
   */
  const endTurn = useCallback(() => {
    const state = gameStateRef.current;
    if (!state) throw new Error('Game not initialized');

    const newState = state.endTurn();
    gameStateRef.current = newState;

    // Clear roll result and intention when ending turn
    dispatch(clearRollResult());
    dispatch(clearIntention());

    syncToRedux();
  }, [dispatch, syncToRedux]);

  /**
   * Update a player (for inventory, equipment, etc.).
   * This is a lower-level method - prefer using specific game actions when possible.
   */
  const updatePlayer = useCallback(
    (updated: Player) => {
      const state = gameStateRef.current;
      if (!state) throw new Error('Game not initialized');

      const newState = state.updatePlayer(updated);
      gameStateRef.current = newState;
      syncToRedux();
    },
    [syncToRedux],
  );

  /**
   * Set weather.
   */
  const setWeather = useCallback(
    (weather: WeatherCard | undefined) => {
      const state = gameStateRef.current;
      if (!state) throw new Error('Game not initialized');

      const newState = state.setWeather(weather);
      gameStateRef.current = newState;
      syncToRedux();
    },
    [syncToRedux],
  );

  /**
   * Get the current game state instance (for advanced usage).
   */
  const getGameState = useCallback(() => gameStateRef.current, []);

  /**
   * End the game.
   */
  const quitGame = useCallback(() => {
    gameStateRef.current = null;
    dispatch(endGame());
  }, [dispatch]);

  return {
    initializeGame,
    startTurn,
    drawEncounter,
    resolveEncounter,
    endTurn,
    updatePlayer,
    setWeather,
    getGameState,
    quitGame,
  };
}

/**
 * Hook to get the current active player.
 * This reads from Redux state (which is synced from the game engine).
 */
export function useCurrentPlayer(): Player | null {
  const gameState = useAppSelector((state) => state.game);
  const players = useAppSelector((state) => state.player.byId);

  if (!gameState.activePlayerId || !players[gameState.activePlayerId]) {
    return null;
  }

  return players[gameState.activePlayerId];
}

/**
 * Hook to get game actions and current game state.
 * This combines useGameEngine with Redux selectors for convenience.
 */
export function useGameActions() {
  const engine = useGameEngine();
  const dispatch = useAppDispatch();
  const gameState = useAppSelector((state) => state.game);
  const currentPlayer = useCurrentPlayer();

  /**
   * Select an intention for the current encounter.
   */
  const selectIntention = useCallback(
    (intention: Intention) => {
      if (gameState.phase !== 'encounter') {
        throw new Error('Can only select intention during encounter phase');
      }
      dispatch(setIntention(intention));
      return intention;
    },
    [dispatch, gameState.phase],
  );

  /**
   * Roll dice for the current encounter with the selected intention.
   */
  const rollDiceAndResolve = useCallback(
    (intention: Intention, rng?: () => number) => engine.resolveEncounter(intention, rng),
    [engine],
  );

  return {
    // Engine methods
    ...engine,

    // Convenience methods
    selectIntention,
    rollDiceAndResolve,

    // Current state
    phase: gameState.phase,
    activeEncounter: gameState.activeEncounter,
    weather: gameState.weather,
    currentPlayer,
    selectedIntention: gameState.selectedIntention,
    lastRollResult: gameState.lastRollResult as ResolutionOutcome | undefined,
    isGameActive: gameState.isGameActive,
  };
}

/**
 * Hook to access dice roll functionality.
 * Note: Most dice rolling is handled internally by ActionResolver.
 * This hook is for utility purposes or custom dice operations.
 */
export function useDiceRoll() {
  const rollDie = useCallback(
    (sides: number, rng: () => number = Math.random) => DiceSystem.rollDie(sides, rng),
    [],
  );

  return {
    rollDie,
  };
}
