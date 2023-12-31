import React from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Link } from 'react-router-dom';
import Router from './routes';
import { RootState } from './store';
import { updateHealth, addItem } from './store/slices/player.slice';
// Styles
import './styles/globals.scss';
// Components
import Player from './Player';

const App = () => {
  const dispatch = useDispatch();
  const player = useSelector((state: RootState) => state.player.player1);

  // Player Handler Functions
  const handleAddItem = (item: string) => {
    dispatch(addItem({ playerId: 'player1', item }));
  };

  const handleUpdateHealth = (newHealth: number) => {
    dispatch(updateHealth({ playerId: 'player1', health: newHealth }));
  };

  return (
    <main>
      <Player
        id={0}
        name="Adam"
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
          handleUpdateHealth(90);
        }}
      >
        Use Potion of Healing
      </button>

      <nav>
        <ul>
          <li>
            <Link to="/">Home</Link>
          </li>
          <li>
            <Link to="/game">Game</Link>
          </li>
        </ul>
      </nav>
      <Router />
    </main>
  );
};
export default App;
