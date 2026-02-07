import React, { useState } from 'react';
import PhysicsDice from '../../animations/lab/PhysicsDice';
import './AnimLab.scss';

const AnimLab = () => {
  const [diceCount, setDiceCount] = useState(2);
  const [rollKey, setRollKey] = useState(0);
  const [results, setResults] = useState<number[]>([]);

  const handleRoll = () => setRollKey((prev) => prev + 1);

  return (
    <div className="AnimLab">
      <div className="animlab-controls">
        <button type="button" onClick={handleRoll}>
          Roll Dice
        </button>
        <button type="button" onClick={() => setDiceCount(1)}>
          1 Die
        </button>
        <button type="button" onClick={() => setDiceCount(2)}>
          2 Dice
        </button>
        <button type="button" onClick={() => setDiceCount(3)}>
          3 Dice
        </button>
        <button type="button" onClick={() => setDiceCount(4)}>
          4 Dice
        </button>
      </div>
      <PhysicsDice diceCount={diceCount} rollKey={rollKey} onResults={setResults} />
      {results.length > 0 && (
        <div className="animlab-results">
          Result: {results.join(', ')} (Total {results.reduce((sum, value) => sum + value, 0)})
        </div>
      )}
    </div>
  );
};

export default AnimLab;

