import React, { useEffect, useRef, useState } from 'react';
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

// Thumbnails now rendered live from the 3D scene.

const AnimLab = () => {
  const [diceCount, setDiceCount] = useState(0);
  const [rollKey, setRollKey] = useState(0);
  const [results, setResults] = useState<number[]>([]);
  const [rollingResults, setRollingResults] = useState<number[]>([]);
  const [perDieSounds, setPerDieSounds] = useState<string[]>([]);
  const [diceSides, setDiceSides] = useState<number[]>([]);
  const [diceColor, setDiceColor] = useState('#ffffff');
  const [diceRoughness, setDiceRoughness] = useState(0.005);
  const [diceMetalness, setDiceMetalness] = useState(0.1);
  const [diceColors, setDiceColors] = useState<string[]>([]);
  const [diceRoughnesses, setDiceRoughnesses] = useState<number[]>([]);
  const [diceMetalnesses, setDiceMetalnesses] = useState<number[]>([]);
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
  const [highlightTextColors, setHighlightTextColors] = useState<string[]>([]);
  const [textColors, setTextColors] = useState<string[]>([]);
  const [editingDieIndex, setEditingDieIndex] = useState<number | null>(null);
  const thumbnailRefs = useRef<Array<HTMLCanvasElement | null>>([]);

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

  const handleRoll = () => {
    setResults([]);
    setRollingResults([]);
    setRollKey((prev) => prev + 1);
  };
  useEffect(() => {
    if (results.length > 0) {
      setRollingResults([]);
    }
  }, [results]);

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
            setDiceColors((prev) => [...prev, diceColor]);
            setDiceRoughnesses((prev) => [...prev, diceRoughness]);
            setDiceMetalnesses((prev) => [...prev, diceMetalness]);
            setHighlightTextColors((prev) => [...prev, highlightTextColor]);
            setTextColors((prev) => [...prev, textColor]);
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
            setDiceColors((prev) => [...prev, diceColor]);
            setDiceRoughnesses((prev) => [...prev, diceRoughness]);
            setDiceMetalnesses((prev) => [...prev, diceMetalness]);
            setHighlightTextColors((prev) => [...prev, highlightTextColor]);
            setTextColors((prev) => [...prev, textColor]);
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
            setDiceColors((prev) => [...prev, diceColor]);
            setDiceRoughnesses((prev) => [...prev, diceRoughness]);
            setDiceMetalnesses((prev) => [...prev, diceMetalness]);
            setHighlightTextColors((prev) => [...prev, highlightTextColor]);
            setTextColors((prev) => [...prev, textColor]);
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
            setDiceColors((prev) => [...prev, diceColor]);
            setDiceRoughnesses((prev) => [...prev, diceRoughness]);
            setDiceMetalnesses((prev) => [...prev, diceMetalness]);
            setHighlightTextColors((prev) => [...prev, highlightTextColor]);
            setTextColors((prev) => [...prev, textColor]);
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
            setDiceColors((prev) => [...prev, diceColor]);
            setDiceRoughnesses((prev) => [...prev, diceRoughness]);
            setDiceMetalnesses((prev) => [...prev, diceMetalness]);
            setHighlightTextColors((prev) => [...prev, highlightTextColor]);
            setTextColors((prev) => [...prev, textColor]);
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
            setDiceColors((prev) => [...prev, diceColor]);
            setDiceRoughnesses((prev) => [...prev, diceRoughness]);
            setDiceMetalnesses((prev) => [...prev, diceMetalness]);
            setHighlightTextColors((prev) => [...prev, highlightTextColor]);
            setTextColors((prev) => [...prev, textColor]);
            setDiceCount((prev) => prev + 1);
          }}
        >
          Add D20
        </button>
      </div>
      <div className="animlab-sounds">
        {perDieSounds.map((_, index) => (
          <div key={`die-sound-${index}`} className="animlab-sound-select">
            <div className="animlab-sound-header">
              <span className="animlab-die-label">
                <span className="animlab-die-thumb" aria-hidden="true">
                  <canvas
                    className="animlab-die-canvas"
                    width={192}
                    height={192}
                    ref={(el) => {
                      thumbnailRefs.current[index] = el;
                    }}
                  />
                </span>
                <span>
                  Die {index + 1} (D{diceSides[index] ?? 6})
                </span>
              </span>
              <div className="animlab-sound-actions">
                <button
                  type="button"
                  className="animlab-edit"
                  onClick={() => setEditingDieIndex(index)}
                  aria-label={`Edit die ${index + 1}`}
                >
                  ✎
                </button>
                <button
                  type="button"
                  className="animlab-remove"
                  onClick={() => {
                    setPerDieSounds((prev) => prev.filter((_, i) => i !== index));
                    setDiceSides((prev) => prev.filter((_, i) => i !== index));
                    setDiceColors((prev) => prev.filter((_, i) => i !== index));
                    setDiceRoughnesses((prev) => prev.filter((_, i) => i !== index));
                    setDiceMetalnesses((prev) => prev.filter((_, i) => i !== index));
                    setHighlightTextColors((prev) => prev.filter((_, i) => i !== index));
                    setTextColors((prev) => prev.filter((_, i) => i !== index));
                    setDiceCount((prev) => Math.max(prev - 1, 0));
                    setEditingDieIndex((prev) => (prev === index ? null : prev));
                  }}
                  aria-label={`Remove die ${index + 1}`}
                >
                  ✕
                </button>
              </div>
            </div>
            {typeof results[index] !== 'undefined' ? (
              <div className="animlab-die-result">Result: {results[index]}</div>
            ) : typeof rollingResults[index] !== 'undefined' ? (
              <div className="animlab-die-result">Result: {rollingResults[index]}</div>
            ) : null}
          </div>
        ))}
      </div>
      {editingDieIndex !== null && (
        <div className="animlab-modal">
          <div className="animlab-modal__backdrop" onClick={() => setEditingDieIndex(null)} />
          <div className="animlab-modal__content" role="dialog" aria-modal="true">
            <div className="animlab-modal__header">
              <span>Die {editingDieIndex + 1} Settings</span>
              <button type="button" onClick={() => setEditingDieIndex(null)}>
                ✕
              </button>
            </div>
            <div className="animlab-modal__section">
              <label className="animlab-material-control">
                <span>Hit Sound</span>
                <select
                  value={perDieSounds[editingDieIndex] ?? diceHitOneUrl}
                  onChange={(event) => {
                    const next = [...perDieSounds];
                    next[editingDieIndex] = event.target.value;
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
            </div>
            <div className="animlab-modal__section">
              <label className="animlab-material-control">
                <span>Dice Color</span>
                <input
                  type="color"
                  value={diceColors[editingDieIndex] ?? diceColor}
                  onChange={(event) => {
                    const next = [...diceColors];
                    next[editingDieIndex] = event.target.value;
                    setDiceColors(next);
                  }}
                />
              </label>
              <label className="animlab-material-control">
                <span>Roughness</span>
                <input
                  type="range"
                  min={0}
                  max={1}
                  step={0.005}
                  value={diceRoughnesses[editingDieIndex] ?? diceRoughness}
                  onChange={(event) => {
                    const next = [...diceRoughnesses];
                    next[editingDieIndex] = Number(event.target.value);
                    setDiceRoughnesses(next);
                  }}
                />
                <span className="animlab-material-value">
                  {(diceRoughnesses[editingDieIndex] ?? diceRoughness).toFixed(3)}
                </span>
              </label>
              <label className="animlab-material-control">
                <span>Metalness</span>
                <input
                  type="range"
                  min={0}
                  max={1}
                  step={0.005}
                  value={diceMetalnesses[editingDieIndex] ?? diceMetalness}
                  onChange={(event) => {
                    const next = [...diceMetalnesses];
                    next[editingDieIndex] = Number(event.target.value);
                    setDiceMetalnesses(next);
                  }}
                />
                <span className="animlab-material-value">
                  {(diceMetalnesses[editingDieIndex] ?? diceMetalness).toFixed(3)}
                </span>
              </label>
              <label className="animlab-material-control">
                <span>Win Value Color</span>
                <input
                  type="color"
                  value={highlightTextColors[editingDieIndex] ?? highlightTextColor}
                  onChange={(event) => {
                    const next = [...highlightTextColors];
                    next[editingDieIndex] = event.target.value;
                    setHighlightTextColors(next);
                  }}
                />
              </label>
              <label className="animlab-material-control">
                <span>Text Color</span>
                <input
                  type="color"
                  value={textColors[editingDieIndex] ?? textColor}
                  onChange={(event) => {
                    const next = [...textColors];
                    next[editingDieIndex] = event.target.value;
                    setTextColors(next);
                  }}
                />
              </label>
            </div>
          </div>
        </div>
      )}
      <div className="animlab-card">
        <div className="animlab-card__title">Lighting</div>
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
      </div>
      <PhysicsDice
        diceSides={diceSides}
        diceCount={diceCount}
        rollKey={rollKey}
        collisionSoundUrls={perDieSounds}
        diceColor={diceColor}
        diceRoughness={diceRoughness}
        diceMetalness={diceMetalness}
        diceColors={diceColors}
        diceRoughnesses={diceRoughnesses}
        diceMetalnesses={diceMetalnesses}
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
        highlightTextColors={highlightTextColors}
        textColors={textColors}
        thumbnailCanvases={thumbnailRefs.current}
        tableHalfSize={5}
        tableWallHeight={2.4}
        tableCeilingHeight={6}
        results={results}
        autoRollOnSetup={false}
        onResults={setResults}
        onRollingResults={setRollingResults}
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

