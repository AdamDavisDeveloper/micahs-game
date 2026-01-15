import React from 'react';
import { Link } from 'react-router-dom';
import Router from './routes';
// Styles
import './styles/globals.scss';

const App = () => (
  <main>
    <nav>
      <ul>
        <li>
          <Link to="/">Home</Link>
        </li>
        <li>
          <Link to="/game">Game</Link>
        </li>
        <li>
          <Link to="/AnimLab">Animation Lab</Link>
        </li>
      </ul>
    </nav>
    <Router />
  </main>
);

export default App;
