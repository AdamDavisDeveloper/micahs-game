import React from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '../../store';
import { updateHealth, addItem } from '../../store/slices/player.slice';
import Player from '../../Player';

const Game = () => {
  const dispatch = useDispatch();
  const player = useSelector((state: RootState) => state.player.player1);

  // Player Handler Functions
  const handleAddItem = (item: string) => {
    dispatch(addItem({ playerId: 'player1', item }));
  };

  const handleUpdateHealth = (newHealth: number) => {
    dispatch(updateHealth({ playerId: 'player1', health: player.health + newHealth }));
  };

  return (
    <div className="Game">
      <Player
        id="player1"
        name="Adam"
        characterClass="paladin"
        health={player.health}
        attack={player.attack}
        charisma={player.charisma}
        speed={player.speed}
        inventory={player.inventory}
        companions={player.companions}
      />

      <button
        onClick={() => {
          handleAddItem('Red Katana');
        }}
      >
        Buy Red Katana
      </button>
      <button
        onClick={() => {
          handleUpdateHealth(5);
        }}
      >
        Use Potion of Healing
      </button>
    </div>
  );
};

export default Game;
