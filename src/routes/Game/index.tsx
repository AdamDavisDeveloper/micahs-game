import React, { useEffect, useState, useRef } from 'react';
import { useGameActions } from '../../hooks/useGame';
import { createPlayerFromClass } from '../../engine/utils/playerFactory';
import { classes } from '../../common/Decks/Characters/classes';
import type { EncounterCard, Creature } from '../../engine/types/card.types';
import type { Intention } from '../../engine/types/game.types';

/**
 * Mock encounter card for testing
 */
const mockGrumpyGoose: EncounterCard = {
  kind: 'encounter',
  id: 'grumpy-goose',
  name: 'Grumpy Goose',
  targets: {
    charm: 5,
    escape: 2,
    attack: 8,
  },
  attack: { kind: 'dice', sides: 4, modifier: 1 }, // D4 + 1
  reward: { kind: 'none' },
  charm: {
    creature: {
      id: 'silly-goose',
      name: 'Silly Goose',
      attackDice: [4],
      defense: 2,
      effects: [{ effect: { kind: 'coin.add', amount: 1 }, repeat: 'eachTurnStart' }],
    } as Creature,
    reward: { kind: 'none' },
  },
};

/**
 * Basic Game UI Component
 *
 * This is an extremely minimal implementation to test the game loop.
 * No styling applied - just functional buttons and text display.
 *
 * TODO: Replace with proper UI design later
 */
const Game = () => {
  const {
    phase,
    activeEncounter,
    weather,
    currentPlayer,
    selectedIntention,
    lastRollResult,
    isGameActive,
    selectIntention,
    rollDiceAndResolve,
    initializeGame,
    startTurn,
    drawEncounter,
    endTurn,
  } = useGameActions();

  const [error, setError] = useState<string | null>(null);
  const initializedRef = useRef(false);

  // Initialize game on mount (single player for now)
  useEffect(() => {
    // Only initialize once
    if (initializedRef.current) return;

    if (!isGameActive) {
      try {
        initializedRef.current = true;
        const player = createPlayerFromClass({
          id: 'player1',
          name: 'Test Player',
          classDef: classes.wiseman,
        });

        initializeGame({
          players: [player],
          encounterDeck: [mockGrumpyGoose],
        });

        // Start the first turn
        startTurn();
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to initialize game');
        initializedRef.current = false; // Allow retry on error
      }
    }
  }, []); // Empty dependency array - only run on mount
  const handleDrawEncounter = () => {
    try {
      setError(null);
      drawEncounter();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to draw encounter');
    }
  };  const handleSelectIntention = (intention: Intention) => {
    try {
      setError(null);
      selectIntention(intention);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to select intention');
    }
  };

  const handleRollDice = () => {
    if (!selectedIntention) {
      setError('Please select an intention first');
      return;
    }

    try {
      setError(null);
      rollDiceAndResolve(selectedIntention);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to resolve encounter');
    }
  };

  const handleEndTurn = () => {
    try {
      setError(null);
      endTurn();
      // Start next turn automatically
      startTurn();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to end turn');
    }
  };

  if (!isGameActive || !currentPlayer) {
    return (
      <div>
        <h2>Game</h2>
        <p>Initializing game...</p>
        {error && <div style={{ color: 'red' }}>Error: {error}</div>}
      </div>
    );
  }

  const formatDicePool = (dice: readonly number[]) => {
    if (dice.length === 0) return 'None';
    if (dice.length === 1) return `D${dice[0]}`;
    return dice.map((d) => `D${d}`).join(' + ');
  };

  const formatStat = (statName: string, dice: readonly number[]) =>
    `${statName}: ${formatDicePool(dice)}`;

  return (
    <div>
      <h2>Game</h2>

      {error && (
        <div
          style={{
            color: 'red',
            padding: '10px',
            border: '1px solid red',
            marginBottom: '10px',
          }}
        >
          Error: {error}
        </div>
      )}

      {/* Current Player Info */}
      <div style={{ border: '1px solid #ccc', padding: '10px', marginBottom: '10px' }}>
        <h3>
          Current Player: {currentPlayer.name} ({classes[currentPlayer.classId].name})
        </h3>
        <p>
          HP: {currentPlayer.hp} / {currentPlayer.maxHp}
        </p>
        <p>Coin: {currentPlayer.coin}</p>
        <p>
          {formatStat('Attack', currentPlayer.stats.attack.dice)} |{' '}
          {formatStat('Charisma', currentPlayer.stats.charisma.dice)} |{' '}
          {formatStat('Speed', currentPlayer.stats.speed.dice)}
        </p>
        {currentPlayer.companion && <p>Companion: {currentPlayer.companion.name}</p>}
        {currentPlayer.creatureDock.length > 0 && (
          <p>Creature Dock: {currentPlayer.creatureDock.map((c) => c.name).join(', ')}</p>
        )}
      </div>

      {/* Turn Phase */}
      <div style={{ border: '1px solid #ccc', padding: '10px', marginBottom: '10px' }}>
        <h3>Turn Phase: {phase.toUpperCase()}</h3>
        {weather && <p>Weather: {weather.name}</p>}
      </div>

      {/* Active Encounter */}
      {activeEncounter && (
        <div style={{ border: '1px solid #ccc', padding: '10px', marginBottom: '10px' }}>
          <h3>Encounter: {activeEncounter.name}</h3>
          <p>
            Targets - Attack: {activeEncounter.targets.attack ?? 'N/A'} | Charm:{' '}
            {activeEncounter.targets.charm ?? 'N/A'} | Escape:{' '}
            {activeEncounter.targets.escape ?? 'N/A'}
          </p>
          {activeEncounter.charm && (
            <p>✨ Charmable: Becomes {activeEncounter.charm.creature.name} when charmed</p>
          )}
        </div>
      )}

      {/* Action Buttons */}
      <div style={{ border: '1px solid #ccc', padding: '10px', marginBottom: '10px' }}>
        <h3>Actions</h3>

        {phase === 'preparation' && (
          <div>
            <button onClick={handleDrawEncounter} disabled={!!activeEncounter}>
              Draw Encounter
            </button>
            <p style={{ fontSize: '12px', color: '#666' }}>
              (Preparation Phase: You can shop, trade, equip items here. For now, just draw an
              encounter.)
            </p>
          </div>
        )}

        {phase === 'encounter' && activeEncounter && (
          <div>
            <h4>Select Intention:</h4>
            {activeEncounter.targets.attack !== undefined && (
              <button
                onClick={() => handleSelectIntention('attack')}
                disabled={selectedIntention === 'attack'}
                style={{ marginRight: '10px' }}
              >
                Attack (target: {activeEncounter.targets.attack})
              </button>
            )}
            {activeEncounter.targets.charm !== undefined && (
              <button
                onClick={() => handleSelectIntention('charm')}
                disabled={selectedIntention === 'charm'}
                style={{ marginRight: '10px' }}
              >
                Charm (target: {activeEncounter.targets.charm})
              </button>
            )}
            {activeEncounter.targets.escape !== undefined && (
              <button
                onClick={() => handleSelectIntention('escape')}
                disabled={selectedIntention === 'escape'}
                style={{ marginRight: '10px' }}
              >
                Escape (target: {activeEncounter.targets.escape})
              </button>
            )}

            {selectedIntention && (
              <div style={{ marginTop: '10px' }}>
                <button onClick={handleRollDice}>Roll Dice & Resolve</button>
                <p style={{ fontSize: '12px', color: '#666' }}>
                  Selected: {selectedIntention.toUpperCase()}
                </p>
              </div>
            )}
          </div>
        )}

        {phase === 'resolution' && (
          <div>
            <button onClick={handleEndTurn}>End Turn</button>
            <p style={{ fontSize: '12px', color: '#666' }}>
              (Resolution Phase: Turn will end and move to next player)
            </p>
          </div>
        )}
      </div>

      {/* Dice Roll Results */}
      {lastRollResult && (
        <div style={{ border: '1px solid #ccc', padding: '10px', marginBottom: '10px' }}>
          <h3>Last Roll Result</h3>
          <p>Intention: {lastRollResult.intention.toUpperCase()}</p>
          <p>
            Roll: {lastRollResult.playerRoll.rolls.map((r) => r.value).join(' + ') || 'N/A'}
            {lastRollResult.playerRoll.staticBonus > 0 &&
              ` + ${lastRollResult.playerRoll.staticBonus}`}
            = {lastRollResult.total}
          </p>
          {lastRollResult.companionRoll && (
            <p>
              Companion Roll: {lastRollResult.companionRoll.rolls.map((r) => r.value).join(' + ')} ={' '}
              {lastRollResult.companionRoll.total}
            </p>
          )}
          <p>Target: {lastRollResult.target}</p>
          <p style={{ fontWeight: 'bold', color: lastRollResult.success ? 'green' : 'red' }}>
            {lastRollResult.success ? '✓ SUCCESS' : '✗ FAILURE'}
          </p>
          {!lastRollResult.success && lastRollResult.damageTaken !== undefined && (
            <p style={{ color: 'red' }}>Damage Taken: {lastRollResult.damageTaken}</p>
          )}
          {lastRollResult.companionDied && <p style={{ color: 'red' }}>💀 Companion Died!</p>}
        </div>
      )}
    </div>
  );
};

export default Game;
