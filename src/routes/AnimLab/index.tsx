import React, { useState } from 'react';
import Dice from '../../animations/lab/Dice';

const randomDiceValues = (): number[] => {
  const values = [1, 2, 3, 4, 5, 6];
  return values.sort(() => Math.random() - 0.5);
};

const AnimLab = () => {
  const [animationName, setAnimationName] = useState<'diceRotate1' | 'diceRotate2' | 'diceRotate3'>('diceRotate1');
  const [animationKey, setAnimationKey] = useState(0);
  const [diceValues, setDiceValues] = useState<number[]>(randomDiceValues());

  const handleAnimate = () => {
    setDiceValues(randomDiceValues());
    setAnimationKey((prev) => prev + 1);
  };

  return (
    <div className="AnimLab">
      <div className="animlab-controls">
        <button type="button" onClick={() => setAnimationName('diceRotate1')}>
          Type 1
        </button>
        <button type="button" onClick={() => setAnimationName('diceRotate2')}>
          Type 2
        </button>
        <button type="button" onClick={() => setAnimationName('diceRotate3')}>
          Type 3
        </button>
        <button type="button" onClick={handleAnimate}>
          Roll Dice
        </button>
      </div>
      <Dice animationDuration={1.3} animationName={animationName} animationKey={animationKey} diceValues={diceValues} />
    </div>
  );
};

export default AnimLab;

