import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface PlayerState {
  health: number;
  attack: number;
  charisma: number;
  speed: number;
  inventory: any[]; // object - later
  companions: any[]; // object - later
}

const initialState: PlayerState = {
  health: 100,
  attack: 10,
  charisma: 10,
  speed: 10,
  inventory: [],
  companions: [],
};

// Exports
export const playerSlice = createSlice({
  name: 'player',
  initialState,
  reducers: {
    updateHealth: (state, action: PayloadAction<number>) => {
      state.health = action.payload;
    },
    addItem: (state, action: PayloadAction<string>) => {
      state.inventory.push(action.payload);
    },
    // Add other reducers for different actions l8r! :D
  },
});
export const { updateHealth, addItem } = playerSlice.actions;
export default playerSlice.reducer;
