---
name: Game Engine Foundation
overview: Build the core game engine foundation over 5 days, focusing on type safety, dice mechanics, turn management, effect system, and basic game state management. This will create a playable single-player game loop without multiplayer infrastructure.
todos:
  - id: day1-types
    content: Create core type definitions (dice, player, card, effect, game types) and convert game data files to TypeScript with proper types
    status: pending
  - id: day2-dice
    content: Implement DiceSystem with die rolling, multiple dice support, and static modifiers. Create utility functions for validators and helpers
    status: pending
    dependencies:
      - day1-types
  - id: day3-turn-state
    content: Build TurnManager for turn order and phases, create GameState class for game state management, and implement GameRules for action validation
    status: pending
    dependencies:
      - day1-types
      - day2-dice
  - id: day4-effects
    content: Implement EffectSystem for weather/item effects, create ActionResolver for intention outcomes, and build InventorySystem for item/companion management
    status: pending
    dependencies:
      - day1-types
      - day2-dice
      - day3-turn-state
  - id: day5-integration
    content: Create game Redux slice, enhance player slice with proper types, build game hooks, create basic playable UI, and write unit tests
    status: pending
    dependencies:
      - day1-types
      - day2-dice
      - day3-turn-state
      - day4-effects
---

# Game Engine Foundation - 5 Day Plan

## Overview

This plan implements the core game engine following **Option A (Game Engine First)** from the engineering report. The goal is to create a playable single-player game loop with turn management, dice rolling, and effect resolution. Multiplayer infrastructure will be added later.

## Architecture Overview

```
src/
├── engine/                    # NEW: Pure game logic (no React dependencies)
│   ├── types/                # Type definitions
│   ├── systems/              # Core game systems
│   ├── game/                 # Game state management
│   └── utils/                # Helper functions
├── types/                    # NEW: Game data type definitions
│   └── game/
├── store/slices/             # Enhanced Redux slices
└── common/Decks/             # Game data (will be enhanced)
```

---

## Day 1-2: Foundation & Type System

### Day 1: Type Definitions & Data Structure

**Goal:** Establish comprehensive TypeScript types for all game entities.

**Tasks:**

1. **Create core type definitions** (`src/engine/types/`)

   - `dice.types.ts` - Dice types (D4, D6, D8, D10, D12, D20) and roll results
   - `player.types.ts` - Player state with stats, inventory, companions
   - `card.types.ts` - Base card types (Encounter, Treasure, Weather)
   - `effect.types.ts` - Effect system types (stat modifiers, conditional effects)
   - `game.types.ts` - Game state, turn phases, intentions

2. **Convert and enhance game data** (`src/types/game/`)

   - `Character.ts` - Convert `classes.ts` to typed Character class definitions
   - `Weather.ts` - Convert `weather.ts` with proper effect function types
   - `Treasure.ts` - Type definitions for weapons, clothing, single-use items
   - `Encounter.ts` - Base encounter type (will be populated later)

3. **Define effect function signatures**

   - Create effect function types in `effect.types.ts`
   - Functions: `upgradeAttack`, `addHealth`, `addCharisma`, `reduceSpeed`, `reduceHealth`, etc.

**Key Files to Create:**

- `src/engine/types/dice.types.ts`
- `src/engine/types/player.types.ts`
- `src/engine/types/card.types.ts`
- `src/engine/types/effect.types.ts`
- `src/engine/types/game.types.ts`
- `src/types/game/Character.ts`
- `src/types/game/Weather.ts`
- `src/types/game/Treasure.ts`
- `src/types/game/Encounter.ts`

**Key Files to Modify:**

- `src/common/Decks/Characters/classes.ts` - Add proper types
- `src/common/Decks/Weather/weather.ts` - Fix effect function references
- `src/common/Decks/Treasure/*.ts` - Add proper types

### Day 2: Dice System & Basic Utilities

**Goal:** Implement dice rolling mechanics and helper utilities.

**Tasks:**

1. **Create DiceSystem** (`src/engine/systems/DiceSystem.ts`)

   - `rollDie(sides: number): number` - Roll a single die
   - `rollDice(dice: DieType[]): number` - Roll multiple dice and sum
   - `rollStat(stat: StatWithDice): number` - Roll a stat (handles die upgrades)
   - Support for die progression: D4 → D6 → D8 → D10 → D12 → D20
   - Support for multiple dice (D20 + D20 + D6)
   - Static modifiers (D10 + 3)

2. **Create utility functions** (`src/engine/utils/`)

   - `validators.ts` - Game action validation functions
   - `helpers.ts` - General game logic helpers (die upgrade logic, stat calculations)

3. **Update existing code**

   - Remove the `D()` function from `classes.ts` (use DiceSystem instead)
   - Ensure all dice operations go through DiceSystem

**Key Files to Create:**

- `src/engine/systems/DiceSystem.ts`
- `src/engine/utils/validators.ts`
- `src/engine/utils/helpers.ts`

---

## Day 3-4: Core Game Systems

### Day 3: Turn Management & Game State

**Goal:** Implement turn structure and game state management.

**Tasks:**

1. **Create TurnManager** (`src/engine/game/TurnManager.ts`)

   - `initializeTurnOrder(players: Player[]): string[]` - Determine turn order
   - `getCurrentPlayer(): string` - Get active player ID
   - `nextTurn(): void` - Advance to next player
   - `getTurnPhase(): TurnPhase` - Get current phase (Preparation, Encounter, Resolution)
   - Support for turn phases: Preparation → Encounter → Resolution

2. **Create GameState class** (`src/engine/game/GameState.ts`)

   - Manage game state: players, current turn, weather, encounter deck, graveyard
   - `addPlayer(player: Player): void`
   - `startGame(): void`
   - `getCurrentEncounter(): Encounter | null`
   - `drawEncounter(): Encounter`
   - `setWeather(weather: Weather): void`
   - Immutable state updates (return new GameState instances)

3. **Create GameRules** (`src/engine/game/GameRules.ts`)

   - `canPerformAction(playerId: string, action: GameAction, state: GameState): boolean`
   - Validate player actions (can't attack if no encounter, etc.)
   - Validate turn phase requirements

**Key Files to Create:**

- `src/engine/game/TurnManager.ts`
- `src/engine/game/GameState.ts`
- `src/engine/game/GameRules.ts`

### Day 4: Effect System & Action Resolution

**Goal:** Implement effect application and action resolution.

**Tasks:**

1. **Create EffectSystem** (`src/engine/systems/EffectSystem.ts`)

   - `applyWeatherEffects(player: Player, weather: Weather): Player` - Apply weather effects
   - `applyItemEffects(player: Player, item: Treasure): Player` - Apply item effects
   - `applyStatModifier(player: Player, modifier: StatModifier): Player` - Apply stat changes
   - Handle conditional effects (class-specific bonuses)
   - Handle repeat effects (every turn vs. one-time)
   - Support for die upgrades (D4 → D6 → D8, etc.)

2. **Create ActionResolver** (`src/engine/game/ActionResolver.ts`)

   - `resolveIntention(intention: Intention, player: Player, encounter: Encounter, diceRoll: number): ActionResult`
   - Handle Attack, Charm, Escape intentions
   - Support card-defined alternative resolution logic
   - Apply success/failure outcomes
   - Update game state based on results

3. **Create InventorySystem** (`src/engine/systems/InventorySystem.ts`)

   - `addItem(player: Player, item: Treasure): Player`
   - `removeItem(player: Player, itemId: string): Player`
   - `equipWeapon(player: Player, weapon: Weapon): Player`
   - `equipClothing(player: Player, clothing: Clothing): Player`
   - `assignCompanion(player: Player, creature: Creature): Player`

**Key Files to Create:**

- `src/engine/systems/EffectSystem.ts`
- `src/engine/game/ActionResolver.ts`
- `src/engine/systems/InventorySystem.ts`

---

## Day 5: Redux Integration & Basic UI

**Goal:** Connect game engine to Redux and create basic playable UI.

**Tasks:**

1. **Create game Redux slice** (`src/store/slices/game.slice.ts`)

   - Game state: current turn, phase, weather, active encounter
   - Actions: `startGame`, `endTurn`, `setIntention`, `resolveEncounter`, `setWeather`
   - Selectors for current player, turn phase, etc.

2. **Enhance player slice** (`src/store/slices/player.slice.ts`)

   - Replace `any[]` with proper types
   - Add actions for: `updateStats`, `addCompanion`, `removeCompanion`, `applyEffect`
   - Support for die upgrades in stats

3. **Create game hooks** (`src/store/hooks.ts` or new `src/hooks/useGame.ts`)

   - `useGameEngine()` - Access to game engine instance
   - `useCurrentPlayer()` - Get current active player
   - `useGameActions()` - Actions for player interactions
   - `useDiceRoll()` - Roll dice and get results

4. **Create basic game UI** (`src/routes/Game/index.tsx`)

   - Display current player's turn
   - Show turn phase (Preparation/Encounter)
   - Encounter card display
   - Intention selection (Attack/Charm/Escape)
   - Dice roll button and result display
   - Basic player stats display
   - Simple merchant UI (placeholder)

5. **Write unit tests** (optional but recommended)

   - Test DiceSystem with various die types
   - Test TurnManager turn progression
   - Test EffectSystem stat modifications
   - Test ActionResolver intention outcomes

**Key Files to Create:**

- `src/store/slices/game.slice.ts`
- `src/hooks/useGame.ts` (or add to existing hooks)
- `src/routes/Game/index.tsx` (enhance existing)

**Key Files to Modify:**

- `src/store/slices/player.slice.ts` - Add proper types and actions
- `src/store/index.ts` - Add game slice to store

---

## Implementation Notes

### Type Safety Priority

- All game data must be fully typed
- No `any` types in game engine code
- Use discriminated unions for game states and actions

### Game Engine Principles

- **Pure functions** - Game engine has no React dependencies
- **Immutable updates** - State changes return new instances
- **Testable** - All game logic can be unit tested independently

### Turn Structure Implementation

Based on `GameInfo.md`, turns have three phases:

1. **Preparation Phase** - Shop, trade, equip items, assign companions
2. **Encounter Phase** - Draw encounter, choose intention, roll dice, resolve
3. **Resolution Phase** - Apply outcomes, end turn

### Dice System Requirements

- Support die progression: D4 → D6 → D8 → D10 → D12 → D20
- Multiple dice: D20 + D20 + D6 (roll independently, sum results)
- Static modifiers: D10 + 3
- Enemy dice: Any numeric value can be rolled

### Effect System Requirements

- Weather effects apply at start of turn (except Storming)
- Item effects can be one-time or repeat
- Conditional effects based on character class
- Die upgrades follow progression rules

---

## Success Criteria

By the end of Day 5, you should be able to:

1. ✅ Create a game with multiple players
2. ✅ Progress through turns with proper turn order
3. ✅ Draw encounter cards (mock data for now)
4. ✅ Select intentions (Attack/Charm/Escape)
5. ✅ Roll dice and resolve encounters
6. ✅ Apply weather effects
7. ✅ Apply item effects
8. ✅ Update player stats based on outcomes
9. ✅ See game state in Redux DevTools
10. ✅ Play a complete turn cycle in the UI

---

## Dependencies to Add

No new npm packages required for this phase. All functionality will use existing dependencies:

- TypeScript (already installed)
- Redux Toolkit (already installed)
- React (already installed)

Optional but recommended:

- Consider adding `zod` for runtime validation (Day 1-2)
- Consider adding test utilities if writing tests (Day 5)

---

## Next Steps (After Day 5)

Once this foundation is complete:

- Add encounter card data
- Implement merchant system
- Add companion combat logic
- Create proper game UI components
- Add game win/loss conditions
- Begin multiplayer infrastructure (backend + WebSocket)
