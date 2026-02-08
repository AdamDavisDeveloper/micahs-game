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
  }, [diceCount]);

  const handleRoll = () => setRollKey((prev) => prev + 1);

  return (
    <div className="AnimLab">
      <div className="animlab-controls">
        <button type="button" onClick={handleRoll}>
          Roll Dice
        </button>
        <button
          type="button"
          onClick={() => {
            setDiceSides((prev) => [...prev, 4]);
            setPerDieSounds((prev) => [...prev, prev[prev.length - 1] ?? diceHitOneUrl]);
            setDiceCount((prev) => prev + 1);
          }}
        >
          Add D4
        </button>
        <button
          type="button"
          onClick={() => {
            setDiceSides((prev) => [...prev, 6]);
            setPerDieSounds((prev) => [...prev, prev[prev.length - 1] ?? diceHitOneUrl]);
            setDiceCount((prev) => prev + 1);
          }}
        >
          Add D6
        </button>
        <button
          type="button"
          onClick={() => {
            setDiceSides((prev) => [...prev, 8]);
            setPerDieSounds((prev) => [...prev, prev[prev.length - 1] ?? diceHitOneUrl]);
            setDiceCount((prev) => prev + 1);
          }}
        >
          Add D8
        </button>
        <button
          type="button"
          onClick={() => {
            setDiceSides((prev) => [...prev, 10]);
            setPerDieSounds((prev) => [...prev, prev[prev.length - 1] ?? diceHitOneUrl]);
            setDiceCount((prev) => prev + 1);
          }}
        >
          Add D10
        </button>
        <button
          type="button"
          onClick={() => {
            setDiceSides((prev) => [...prev, 12]);
            setPerDieSounds((prev) => [...prev, prev[prev.length - 1] ?? diceHitOneUrl]);
            setDiceCount((prev) => prev + 1);
          }}
        >
          Add D12
        </button>
        <button
          type="button"
          onClick={() => {
            setDiceSides((prev) => [...prev, 20]);
            setPerDieSounds((prev) => [...prev, prev[prev.length - 1] ?? diceHitOneUrl]);
            setDiceCount((prev) => prev + 1);
          }}
        >
          Add D20
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
          <div key={`die-sound-${index}`} className="animlab-sound-select">
            <div className="animlab-sound-header">
              <span>Die {index + 1}</span>
              <button
                type="button"
                className="animlab-remove"
                onClick={() => {
                  if (diceSides.length <= 1) return;
                  setPerDieSounds((prev) => prev.filter((_, i) => i !== index));
                  setDiceSides((prev) => prev.filter((_, i) => i !== index));
                  setDiceCount((prev) => Math.max(prev - 1, 1));
                }}
                aria-label={`Remove die ${index + 1}`}
              >
                ✕
              </button>
            </div>
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
          </div>
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
        autoRollOnSetup={false}
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

