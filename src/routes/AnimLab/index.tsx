import React, { useEffect, useState } from 'react';
import PhysicsDice from '../../animations/lab/PhysicsDice';
import diceHitOneUrl from '../../animations/assets/sounds/dice-hit-1.ogg';
import diceHitTwoUrl from '../../animations/assets/sounds/dice-hit-2.ogg';
import diceHitThreeUrl from '../../animations/assets/sounds/dice-hit-3.ogg';
import './AnimLab.scss';

type SoundOption = {
  label: string;
  url: string;
};

const AnimLab = () => {
  const [diceCount, setDiceCount] = useState(2);
  const [rollKey, setRollKey] = useState(0);
  const [results, setResults] = useState<number[]>([]);
  const [collisionVolume, setCollisionVolume] = useState(0.6);
  const [perDieSounds, setPerDieSounds] = useState<string[]>(Array(2).fill(diceHitOneUrl));
  const [diceSides, setDiceSides] = useState<number[]>(Array(2).fill(6));

  const soundOptions: SoundOption[] = [
    { label: 'Dice hit 1', url: diceHitOneUrl },
    { label: 'Dice hit 2', url: diceHitTwoUrl },
    { label: 'Dice hit 3', url: diceHitThreeUrl },
  ];

  useEffect(() => {
    setPerDieSounds((prev) => {
      const next = Array.from({ length: diceCount }, (_, index) => prev[index] ?? diceHitOneUrl);
      return next;
    });
    setDiceSides((prev) => {
      const next = Array.from({ length: diceCount }, (_, index) => prev[index] ?? 6);
      return next;
    });
  }, [diceCount]);

  const handleRoll = () => setRollKey((prev) => prev + 1);

  return (
    <div className="AnimLab">
      <div className="animlab-controls">
        <button type="button" onClick={handleRoll}>
          Roll Dice
        </button>
        <button type="button" onClick={() => setDiceSides(Array(diceCount).fill(4))}>
          D4
        </button>
        <button type="button" onClick={() => setDiceSides(Array(diceCount).fill(6))}>
          D6
        </button>
        <button type="button" onClick={() => setDiceSides(Array(diceCount).fill(8))}>
          D8
        </button>
        <button type="button" onClick={() => setDiceSides(Array(diceCount).fill(10))}>
          D10
        </button>
        <button type="button" onClick={() => setDiceSides(Array(diceCount).fill(12))}>
          D12
        </button>
        <button type="button" onClick={() => setDiceSides(Array(diceCount).fill(20))}>
          D20
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
      <div className="animlab-controls">
        <label className="animlab-volume">
          Volume
          <input
            type="range"
            min={0}
            max={1}
            step={0.05}
            value={collisionVolume}
            onChange={(event) => setCollisionVolume(Number(event.target.value))}
          />
        </label>
      </div>
      <div className="animlab-sounds">
        {perDieSounds.map((sound, index) => (
          <label key={`die-sound-${index}`} className="animlab-sound-select">
            Die {index + 1}
            <select
              value={sound}
              onChange={(event) => {
                const next = [...perDieSounds];
                next[index] = event.target.value;
                setPerDieSounds(next);
              }}
            >
              {soundOptions.map((option) => (
                <option key={option.url} value={option.url}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
        ))}
      </div>
      <PhysicsDice
        diceSides={diceSides}
        diceCount={diceCount}
        rollKey={rollKey}
        collisionSoundUrls={perDieSounds}
        collisionVolume={collisionVolume}
        tableHalfSize={5}
        tableWallHeight={2.4}
        tableCeilingHeight={6}
        results={results}
        onResults={setResults}
      />
      {results.length > 0 && (
        <div className="animlab-results">
          Result: {results.join(', ')} (Total {results.reduce((sum, value) => sum + value, 0)})
        </div>
      )}
    </div>
  );
};

export default AnimLab;

