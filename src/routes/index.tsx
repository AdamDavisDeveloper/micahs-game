import React, { FunctionComponent, lazy, Suspense } from 'react';
// import { Spin } from 'antd';
import { Routes, Route } from 'react-router-dom';

import Home from './Home';

const Game = lazy(() => import('./Game'));

const Router: FunctionComponent = () => (
  <Routes>
    <Route path="/" element={<Home />} />
    <Route
      path="/game"
      element={
        <Suspense fallback={<div>Loading game...</div>}>
          <Game />
        </Suspense>
      }
    />
  </Routes>
);

export default Router;
