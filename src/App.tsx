import React from 'react';
// import { useSelector, useDispatch } from 'react-redux';
import { Link } from 'react-router-dom';
import Router from './routes';
// import { RootState } from './store';
// import { updateHealth, addItem } from './store/slices/player.slice';
// Styles
// import './styles/vendors.scss';
// Components
import Player from './Player';

const App = () => (
  // const dispatch = useDispatch(); // uncomment for dispatching
  // const player = useSelector((state: RootState) => state.player);

  // Example function to handle item addition
  // const handleAddItem = (item: string) => {
  //   dispatch(addItem(item));
  // };

  <main>
    <p>App Works!</p>
    <Player
      id={0}
      name=""
      health={0}
      attack={0}
      charisma={0}
      speed={0}
      inventory={[]}
      companions={[]}
    />
    <ul>
      <li>
        <Link to="/">Home</Link>
      </li>
      <li>
        <Link to="/game">Game</Link>
      </li>
    </ul>
    <Router />
  </main>
);
export default App;
