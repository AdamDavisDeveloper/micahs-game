import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface PlayerState {
  [key: string]: {
    // key is the player's unique ID
    health: number;
    attack: number;
    charisma: number;
    speed: number;
    inventory: any[]; // object - later
    companions: any[]; // object - later
  };
}

const initialState: PlayerState = {
  player1: {
    health: 100,
    attack: 10,
    charisma: 10,
    speed: 10,
    inventory: [],
    companions: [],
  },
};

// Exports
export const playerSlice = createSlice({
  name: 'players',
  initialState,
  reducers: {
    updateHealth: (state, action: PayloadAction<{ playerId: string; health: number }>) => {
      const { playerId, health } = action.payload;
      if (state[playerId]) {
        state[playerId].health = health;
      }
    },
    addItem: (state, action: PayloadAction<{ playerId: string; item: string }>) => {
      const { playerId, item } = action.payload;
      if (state[playerId]) {
        state[playerId].inventory.push(item);
      }
    },
    // Add other reducers for different actions l8r! :D
  },
});
export const { updateHealth, addItem } = playerSlice.actions;
export default playerSlice.reducer;
