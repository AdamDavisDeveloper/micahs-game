import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import type { Player, PlayerId } from '../../engine/types/player.types';
import type { DicePool } from '../../engine/types/dice.types';
import type { StatKey } from '../../engine/types/effect.types';
import type { Creature, TreasureCard } from '../../engine/types/card.types';

/**
 * Player slice state.
 *
 * NOTE: Player data is primarily managed through the game engine (GameState).
 * This slice can be used for:
 * - UI-specific player state that doesn't belong in the engine
 * - Direct player updates that bypass the game engine (for testing/debugging)
 * - Or we can sync it with game.players if needed
 *
 * For now, I'll keep a simple normalized lookup by player ID.
 */
type PlayerState = {
  byId: Record<PlayerId, Player>;
  allIds: readonly PlayerId[];
};

const initialState: PlayerState = {
  byId: {},
  allIds: [],
};

export const playerSlice = createSlice({
  name: 'players',
  initialState,
  reducers: {
    /**
     * Sync player data from game state snapshot.
     * Call this whenever game.players changes.
     */
    syncPlayers: (state, action: PayloadAction<readonly Player[]>) => {
      const players = action.payload;
      const byId: Record<PlayerId, Player> = {};
      const allIds: PlayerId[] = [];

      players.forEach((player) => {
        byId[player.id] = player;
        allIds.push(player.id);
      });

      state.byId = byId;
      state.allIds = allIds;
    },

    /**
     * Update a player's stats (health, coin, etc.).
     * NOTE: In normal gameplay, this should happen through GameState.updatePlayer().
     * This action is for direct updates if needed.
     */
    updatePlayer: (state, action: PayloadAction<Player>) => {
      const player = action.payload;
      state.byId[player.id] = player;
      if (!state.allIds.includes(player.id)) {
        state.allIds = [...state.allIds, player.id];
      }
    },

    /**
     * Update a player's health.
     */
    updateHealth: (
      state,
      action: PayloadAction<{ playerId: PlayerId; health: number; maxHp?: number }>,
    ) => {
      const { playerId, health, maxHp } = action.payload;
      const player = state.byId[playerId];
      if (player) {
        state.byId[playerId] = {
          ...player,
          hp: Math.max(0, Math.min(health, maxHp ?? player.maxHp)),
        };
      }
    },

    /**
     * Update a player's coin.
     */
    updateCoin: (state, action: PayloadAction<{ playerId: PlayerId; coin: number }>) => {
      const { playerId, coin } = action.payload;
      const player = state.byId[playerId];
      if (player) {
        state.byId[playerId] = {
          ...player,
          coin: Math.max(0, coin),
        };
      }
    },

    /**
     * Update a player's stat dice pool (attack, charisma, speed).
     * Used when stats are upgraded via items/effects.
     */
    updateStats: (
      state,
      action: PayloadAction<{ playerId: PlayerId; stats: Partial<Record<StatKey, DicePool>> }>,
    ) => {
      const { playerId, stats } = action.payload;
      const player = state.byId[playerId];
      if (player) {
        state.byId[playerId] = {
          ...player,
          stats: {
            ...player.stats,
            ...stats,
          },
        };
      }
    },

    /**
     * Add an item to a player's inventory.
     */
    addItem: (state, action: PayloadAction<{ playerId: PlayerId; item: TreasureCard }>) => {
      const { playerId, item } = action.payload;
      const player = state.byId[playerId];
      if (player) {
        state.byId[playerId] = {
          ...player,
          inventory: [...player.inventory, item],
        };
      }
    },

    /**
     * Remove an item from a player's inventory.
     */
    removeItem: (state, action: PayloadAction<{ playerId: PlayerId; itemId: string }>) => {
      const { playerId, itemId } = action.payload;
      const player = state.byId[playerId];
      if (player) {
        state.byId[playerId] = {
          ...player,
          inventory: player.inventory.filter((item) => item.id !== itemId),
        };
      }
    },

    /**
     * Add a charmed creature to a player's creature dock.
     */
    addCompanion: (state, action: PayloadAction<{ playerId: PlayerId; creature: Creature }>) => {
      const { playerId, creature } = action.payload;
      const player = state.byId[playerId];
      if (player) {
        // Check if creature already exists (shouldn't happen, but be safe)
        const exists = player.creatureDock.some((c) => c.id === creature.id);
        if (!exists) {
          state.byId[playerId] = {
            ...player,
            creatureDock: [...player.creatureDock, creature],
          };
        }
      }
    },

    /**
     * Remove a creature from a player's dock (moved to graveyard or released).
     */
    removeCompanion: (state, action: PayloadAction<{ playerId: PlayerId; creatureId: string }>) => {
      const { playerId, creatureId } = action.payload;
      const player = state.byId[playerId];
      if (player) {
        state.byId[playerId] = {
          ...player,
          creatureDock: player.creatureDock.filter((c) => c.id !== creatureId),
          // Also remove from companion slot if it's the active companion
          companion: player.companion?.id === creatureId ? undefined : player.companion,
        };
      }
    },

    /**
     * Set a player's active companion (from their creature dock).
     */
    setCompanion: (state, action: PayloadAction<{ playerId: PlayerId; creature?: Creature }>) => {
      const { playerId, creature } = action.payload;
      const player = state.byId[playerId];
      if (player) {
        // Verify creature is in dock before setting as companion
        if (creature && !player.creatureDock.some((c) => c.id === creature.id)) {
          // Silently fail - creature must be in dock to be set as companion
          return;
        }
        state.byId[playerId] = {
          ...player,
          companion: creature,
        };
      }
    },
  },
});

export const {
  syncPlayers,
  updatePlayer,
  updateHealth,
  updateCoin,
  updateStats,
  addItem,
  removeItem,
  addCompanion,
  removeCompanion,
  setCompanion,
} = playerSlice.actions;

export default playerSlice.reducer;
