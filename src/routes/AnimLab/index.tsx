import React, { useEffect, useState } from 'react';
import PhysicsDice from '../../animations/lab/PhysicsDice';
import diceHitOneUrl from '../../animations/assets/sounds/dice-hit-1.ogg';
import diceHitTwoUrl from '../../animations/assets/sounds/dice-hit-2.mp3';
import diceHitThreeUrl from '../../animations/assets/sounds/dice-hit-3.ogg';
import diceHitFourUrl from '../../animations/assets/sounds/dice-hit-4.mp3';
import diceHitFiveUrl from '../../animations/assets/sounds/dice-hit-5.mp3';
import './AnimLab.scss';

type SoundOption = {
  label: string;
  url: string;
};

const AnimLab = () => {
  const [diceCount, setDiceCount] = useState(2);
  const [rollKey, setRollKey] = useState(0);
  const [results, setResults] = useState<number[]>([]);
  const [perDieSounds, setPerDieSounds] = useState<string[]>(Array(2).fill(diceHitOneUrl));
  const [diceSides, setDiceSides] = useState<number[]>(Array(2).fill(6));
  const [diceColor, setDiceColor] = useState('#ffffff');
  const [diceRoughness, setDiceRoughness] = useState(0.005);
  const [diceMetalness, setDiceMetalness] = useState(0.1);
  const [lightHeight, setLightHeight] = useState(10);
  const [lightEastWest, setLightEastWest] = useState(6);
  const [lightNorthSouth, setLightNorthSouth] = useState(4);
  const [lightTargetLeftRight, setLightTargetLeftRight] = useState(0);
  const [lightTargetUpDown, setLightTargetUpDown] = useState(0);
  const [ambientLightColor, setAmbientLightColor] = useState('#ffffff');
  const [ambientLightIntensity, setAmbientLightIntensity] = useState(0.85);
  const [keyLightColor, setKeyLightColor] = useState('#ffffff');
  const [keyLightIntensity, setKeyLightIntensity] = useState(1.45);
  const [fillLightColor, setFillLightColor] = useState('#ffffff');
  const [fillLightIntensity, setFillLightIntensity] = useState(0.75);
  const [highlightTextColor, setHighlightTextColor] = useState('#800080');
  const [textColor, setTextColor] = useState('#000000');

  const adjustValue = (
    setter: React.Dispatch<React.SetStateAction<number>>,
    delta: number
  ) => {
    setter((prev) => Number((prev + delta).toFixed(2)));
  };

  const soundOptions: SoundOption[] = [
    { label: 'Hit Sound Opt1', url: diceHitOneUrl },
    { label: 'Hit Sound Opt2', url: diceHitTwoUrl },
    { label: 'Hit Sound Opt3', url: diceHitThreeUrl },
    { label: 'Hit Sound Opt4', url: diceHitFourUrl },
    { label: 'Hit Sound Opt5', url: diceHitFiveUrl },
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
      <div className="animlab-sounds">
        {perDieSounds.map((sound, index) => (
          <div key={`die-sound-${index}`} className="animlab-sound-select">
            <div className="animlab-sound-header">
              <span>
                Die {index + 1} (D{diceSides[index] ?? 6})
              </span>
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
      <div className="animlab-materials">
        <label className="animlab-material-control">
          <span>Dice Color</span>
          <input
            type="color"
            value={diceColor}
            onChange={(event) => setDiceColor(event.target.value)}
          />
        </label>
        <label className="animlab-material-control">
          <span>Roughness</span>
          <input
            type="range"
            min={0}
            max={1}
            step={0.005}
            value={diceRoughness}
            onChange={(event) => setDiceRoughness(Number(event.target.value))}
          />
          <span className="animlab-material-value">{diceRoughness.toFixed(3)}</span>
        </label>
        <label className="animlab-material-control">
          <span>Metalness</span>
          <input
            type="range"
            min={0}
            max={1}
            step={0.005}
            value={diceMetalness}
            onChange={(event) => setDiceMetalness(Number(event.target.value))}
          />
          <span className="animlab-material-value">{diceMetalness.toFixed(3)}</span>
        </label>
      </div>
      <div className="animlab-lighting">
        <div className="animlab-lighting-group">
          <div className="animlab-lighting-title">Light Position</div>
          <div className="animlab-lighting-row">
            <button type="button" onClick={() => adjustValue(setLightNorthSouth, 0.5)}>
              North +
            </button>
            <button type="button" onClick={() => adjustValue(setLightNorthSouth, -0.5)}>
              South -
            </button>
            <span>NS: {lightNorthSouth.toFixed(2)}</span>
          </div>
          <div className="animlab-lighting-row">
            <button type="button" onClick={() => adjustValue(setLightEastWest, 0.5)}>
              East +
            </button>
            <button type="button" onClick={() => adjustValue(setLightEastWest, -0.5)}>
              West -
            </button>
            <span>EW: {lightEastWest.toFixed(2)}</span>
          </div>
          <div className="animlab-lighting-row">
            <button type="button" onClick={() => adjustValue(setLightHeight, 0.5)}>
              Up +
            </button>
            <button type="button" onClick={() => adjustValue(setLightHeight, -0.5)}>
              Down -
            </button>
            <span>H: {lightHeight.toFixed(2)}</span>
          </div>
        </div>
        <div className="animlab-lighting-group">
          <div className="animlab-lighting-title">Light Aim</div>
          <div className="animlab-lighting-row">
            <button type="button" onClick={() => adjustValue(setLightTargetLeftRight, 0.25)}>
              Right +
            </button>
            <button type="button" onClick={() => adjustValue(setLightTargetLeftRight, -0.25)}>
              Left -
            </button>
            <span>LR: {lightTargetLeftRight.toFixed(2)}</span>
          </div>
          <div className="animlab-lighting-row">
            <button type="button" onClick={() => adjustValue(setLightTargetUpDown, 0.25)}>
              Up +
            </button>
            <button type="button" onClick={() => adjustValue(setLightTargetUpDown, -0.25)}>
              Down -
            </button>
            <span>UD: {lightTargetUpDown.toFixed(2)}</span>
          </div>
        </div>
      </div>
      <div className="animlab-lighting animlab-lighting--colors">
        <div className="animlab-lighting-group">
          <div className="animlab-lighting-title">Ambient</div>
          <label className="animlab-material-control">
            <span>Color</span>
            <input
              type="color"
              value={ambientLightColor}
              onChange={(event) => setAmbientLightColor(event.target.value)}
            />
          </label>
          <label className="animlab-material-control">
            <span>Intensity</span>
            <input
              type="range"
              min={0}
              max={2}
              step={0.01}
              value={ambientLightIntensity}
              onChange={(event) => setAmbientLightIntensity(Number(event.target.value))}
            />
            <span className="animlab-material-value">{ambientLightIntensity.toFixed(2)}</span>
          </label>
        </div>
        <div className="animlab-lighting-group">
          <div className="animlab-lighting-title">Key Light</div>
          <label className="animlab-material-control">
            <span>Color</span>
            <input
              type="color"
              value={keyLightColor}
              onChange={(event) => setKeyLightColor(event.target.value)}
            />
          </label>
          <label className="animlab-material-control">
            <span>Intensity</span>
            <input
              type="range"
              min={0}
              max={3}
              step={0.01}
              value={keyLightIntensity}
              onChange={(event) => setKeyLightIntensity(Number(event.target.value))}
            />
            <span className="animlab-material-value">{keyLightIntensity.toFixed(2)}</span>
          </label>
        </div>
        <div className="animlab-lighting-group">
          <div className="animlab-lighting-title">Fill Light</div>
          <label className="animlab-material-control">
            <span>Color</span>
            <input
              type="color"
              value={fillLightColor}
              onChange={(event) => setFillLightColor(event.target.value)}
            />
          </label>
          <label className="animlab-material-control">
            <span>Intensity</span>
            <input
              type="range"
              min={0}
              max={2}
              step={0.01}
              value={fillLightIntensity}
              onChange={(event) => setFillLightIntensity(Number(event.target.value))}
            />
            <span className="animlab-material-value">{fillLightIntensity.toFixed(2)}</span>
          </label>
        </div>
      </div>
      <div className="animlab-materials">
        <label className="animlab-material-control">
          <span>Win Value Color</span>
          <input
            type="color"
            value={highlightTextColor}
            onChange={(event) => setHighlightTextColor(event.target.value)}
          />
        </label>
        <label className="animlab-material-control">
          <span>Text Color</span>
          <input
            type="color"
            value={textColor}
            onChange={(event) => setTextColor(event.target.value)}
          />
        </label>
      </div>
      <PhysicsDice
        diceSides={diceSides}
        diceCount={diceCount}
        rollKey={rollKey}
        collisionSoundUrls={perDieSounds}
        diceColor={diceColor}
        diceRoughness={diceRoughness}
        diceMetalness={diceMetalness}
        keyLightPosition={{ x: lightEastWest, y: lightHeight, z: lightNorthSouth }}
        keyLightTarget={{ x: lightTargetLeftRight, y: lightTargetUpDown, z: 0 }}
        ambientLightColor={ambientLightColor}
        ambientLightIntensity={ambientLightIntensity}
        keyLightColor={keyLightColor}
        keyLightIntensity={keyLightIntensity}
        fillLightColor={fillLightColor}
        fillLightIntensity={fillLightIntensity}
        highlightTextColor={highlightTextColor}
        textColor={textColor}
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

