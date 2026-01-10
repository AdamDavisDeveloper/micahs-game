import type { EncounterCard, WeatherCard } from '../types/card.types';
import type { GameSnapshot } from '../types/game.types';
import type { Player, PlayerId } from '../types/player.types';
import type { DeckEntry } from '../utils/deck';
import { buildDeck, shuffle } from '../utils/deck';
import { TurnManager } from './TurnManager';
import { EffectSystem } from '../systems/EffectSystem';
import { InventorySystem } from '../systems/InventorySystem';

type Shuffler<T> = (cards: readonly T[]) => readonly T[];

function replacePlayer(players: readonly Player[], updated: Player): readonly Player[] {
  const idx = players.findIndex((p) => p.id === updated.id);
  if (idx === -1) throw new Error(`Player not found: ${updated.id}`);
  const copy = [...players];
  copy[idx] = updated;
  return copy;
}

export type GameStateInit = {
  players: readonly Player[];

  // Allow either style (handy while content is still early)
  encounterDeck?: readonly EncounterCard[];
  encounterDeckSpec?: readonly DeckEntry<EncounterCard>[];

  weather?: WeatherCard;
  shuffler?: Shuffler<EncounterCard>;
  rng?: () => number; // Used only for initial shuffle of deckSpec (tests can pass deterministic rng)
};

export class GameState {
  private readonly players: readonly Player[];
  private readonly turn: TurnManager;

  private readonly weather?: WeatherCard;

  private readonly activeEncounter?: EncounterCard;
  private readonly encounterDeck: readonly EncounterCard[];
  private readonly graveyard: readonly EncounterCard[];

  private readonly shuffler: Shuffler<EncounterCard>;

  private constructor(args: {
    players: readonly Player[];
    turn: TurnManager;
    weather?: WeatherCard;
    activeEncounter?: EncounterCard;
    encounterDeck: readonly EncounterCard[];
    graveyard: readonly EncounterCard[];
    shuffler: Shuffler<EncounterCard>;
  }) {
    this.players = args.players;
    this.turn = args.turn;
    this.weather = args.weather;
    this.activeEncounter = args.activeEncounter;
    this.encounterDeck = args.encounterDeck;
    this.graveyard = args.graveyard;
    this.shuffler = args.shuffler;
  }

  static create(init: GameStateInit): GameState {
    if (init.players.length === 0) throw new Error('Game must have at least one player');

    const rng = init.rng ?? Math.random;
    const encounterDeck =
      init.encounterDeck ??
      (init.encounterDeckSpec ? shuffle(buildDeck(init.encounterDeckSpec), rng) : []);

    // Default shuffler is identity (stable) so nothing “random” happens unless you opt in.
    const shuffler = init.shuffler ?? ((cards) => [...cards]);

    // Turn order for now is the provided player list order.
    // Later I can replace this with custom ordering
    const order = init.players.map((p) => p.id);
    const turn = TurnManager.create(order);

    return new GameState({
      players: [...init.players],
      turn,
      weather: init.weather,
      activeEncounter: undefined,
      encounterDeck,
      graveyard: [],
      shuffler,
    });
  }

  /** A plain snapshot for UI/Redux/devtools. */
  snapshot(): GameSnapshot {
    return {
      players: this.players,
      activePlayerId: this.turn.getCurrentPlayerId(),
      phase: this.turn.getPhase(),
      weather: this.weather,
      activeEncounter: this.activeEncounter,
    };
  }

  // ----- Basic getters (helpful in tests / rules) -----

  getActivePlayerId(): PlayerId {
    return this.turn.getCurrentPlayerId();
  }

  getActivePlayer(): Player {
    const id = this.getActivePlayerId();
    const p = this.players.find((x) => x.id === id);
    if (!p) throw new Error(`Active player not found: ${id}`);
    return p;
  }

  getPhase() {
    return this.turn.getPhase();
  }

  getActiveEncounter(): EncounterCard | undefined {
    return this.activeEncounter;
  }

  // ----- State transitions -----

  setWeather(weather?: WeatherCard): GameState {
    return new GameState({
      ...this.cloneArgs(),
      weather,
    });
  }

  updatePlayer(updated: Player): GameState {
    return new GameState({
      ...this.cloneArgs(),
      players: replacePlayer(this.players, updated),
    });
  }

  /**
   * Draws the top encounter and enters encounter phase.
   * - Preparation actions are allowed only when no encounter is active.
   * - Drawing an encounter ends preparation immediately.
   */
  drawEncounter(): GameState {
    if (this.turn.getPhase() !== 'preparation') throw new Error('Can only draw encounter during preparation');
    if (this.activeEncounter) throw new Error('Cannot draw: an encounter is already active');
    if (this.encounterDeck.length === 0) throw new Error('Encounter deck exhausted (win condition or reshuffle rule)');

    const [top, ...rest] = this.encounterDeck;

    return new GameState({
      ...this.cloneArgs(),
      activeEncounter: top,
      encounterDeck: rest,
      turn: this.turn.nextPhase(), // preparation -> encounter
    });
  }

  /**
   * Completes the encounter and moves into resolution phase.
   * We keep the rewards/damage out of here for now
   */
  resolveEncounterToGraveyard(): GameState {
    if (this.turn.getPhase() !== 'encounter') throw new Error('Can only resolve during encounter phase');
    if (!this.activeEncounter) throw new Error('No active encounter to resolve');

    return new GameState({
      ...this.cloneArgs(),
      activeEncounter: undefined,
      graveyard: [...this.graveyard, this.activeEncounter],
      turn: this.turn.nextPhase(), // encounter -> resolution
    });
  }

  /**
   * Encounter Failure Flow
   * - encounter is shuffled back into the encounter deck unless specified otherwise
   */
  resolveEncounterAndShuffleBack(): GameState {
    if (this.turn.getPhase() !== 'encounter') throw new Error('Can only resolve during encounter phase');
    if (!this.activeEncounter) throw new Error('No active encounter to resolve');

    const newDeck = this.shuffler([...this.encounterDeck, this.activeEncounter]);

    return new GameState({
      ...this.cloneArgs(),
      activeEncounter: undefined,
      encounterDeck: [...newDeck],
      turn: this.turn.nextPhase(), // encounter -> resolution
    });
  }

  /**
   * Starts the active player's turn.
   * - Start-of-turn effects occur before drawing an encounter.
   */
  startTurn(): GameState {
    if (this.turn.getPhase() !== 'preparation') throw new Error('Can only start turn during preparation');
    if (this.activeEncounter) throw new Error('Cannot start turn with an active encounter');

    const active = this.getActivePlayer();
    const updated = EffectSystem.applyTurnStart(active, this.weather);

    if (updated === active) return this; // If nothing changed, return this (makes tests nicer)
    return this.updatePlayer(updated);
  }

  /**
   * Ends the active player's turn.
   * - turns end after the encounter resolves (unless a card says draw again later).
   */
  endTurn(): GameState {
    if (this.turn.getPhase() !== 'resolution') throw new Error('Can only end turn during resolution');
    if (this.activeEncounter) throw new Error('Cannot end turn with an active encounter');

    return new GameState({
      ...this.cloneArgs(),
      turn: this.turn.nextTurn(),
    });
  }

  resolveEncounterCleared(): GameState {
    if (this.turn.getPhase() !== 'encounter') throw new Error('Can only resolve during encounter phase');
    if (!this.activeEncounter) throw new Error('No active encounter to resolve');

    return new GameState({
      ...this.cloneArgs(),
      activeEncounter: undefined,
      turn: this.turn.nextPhase(), // encounter -> resolution (end turn + pass next)
    });
  }

   equipWeaponFromInventory(weaponId: string): GameState {
    if (this.turn.getPhase() !== 'preparation') throw new Error('Can only equip during preparation');
    if (this.activeEncounter) throw new Error('Cannot equip with an active encounter');

    const player = this.getActivePlayer();
    const equipped = InventorySystem.equipWeapon(player, weaponId);

    if (equipped === player || !equipped.equippedWeapon) return this;

    const weapon = equipped.equippedWeapon;
    const afterEffects = EffectSystem.applyOnce(equipped, weapon.effects.standard, weapon.effects.conditional);

    return this.updatePlayer(afterEffects);
  }

  equipClothingFromInventory(clothingId: string): GameState {
    if (this.turn.getPhase() !== 'preparation') throw new Error('Can only equip during preparation');
    if (this.activeEncounter) throw new Error('Cannot equip with an active encounter');

    const player = this.getActivePlayer();
    const equipped = InventorySystem.equipClothing(player, clothingId);

    if (equipped === player || !equipped.wornClothing) return this;

    const clothing = equipped.wornClothing;
    const afterEffects = EffectSystem.applyOnce(equipped, clothing.effects);

    return this.updatePlayer(afterEffects);
  }

  // ----- internal -----

  private cloneArgs() {
    return {
      players: this.players,
      turn: this.turn,
      weather: this.weather,
      activeEncounter: this.activeEncounter,
      encounterDeck: this.encounterDeck,
      graveyard: this.graveyard,
      shuffler: this.shuffler,
    };
  }
}
