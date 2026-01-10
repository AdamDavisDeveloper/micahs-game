# Micah's Game General Information

I'll do my best to explain everything i know about this game.

## Win Conditions
1. All of the Encounter cards have been exhausted. (All remaining players win together).
2. You are the last remaining player alive.
3. You and any number of other players elect to challenge the Final Boss (entirely optional) and the Boss dies before you do. (EXTREMELY CHALLENGING)

## Known Loss Conditions
1. Your remaining HP reaches 0. (Your charmed creatures are "freed" but effectively put in the graveyard, items go to merchant).
2. You choose to leave the adventure. (Your charmed creatures are put in the graveyard and your items go to the merchant).

## Standard Gameplay Loop (casual example)
Players: 3
P1: Adam, Wiseman
P2: Micah, Assassin
P3: Tanya, Paladin

### Turn 1 - P1
Adam takes his first turn. He has no item cards or Coin, so he draws an Encounter card. The encounter is a Grumpy Goose creature card.
He is a Wiseman class which is geared toward the Charming feature of the game. Since the Grumpy Goose "becomes Silly Goose when charmed"
(as is written on the card) and Silly Goose gives the player +1 Coin per turn, Adam sets his Intention to Charm. Then he rolls is D8 die
(D8 is the base die for Wiseman's Charisma stat) and he needs to roll a 5 or higher to charm the Grumpy Goose. He lands a 7 which means 
he now owns the card and will begin receiving +1 Coin each turn starting on the next turn until he releases the Silly Goose from his Creature
dock, or it dies in an Encounter. Since Adam values the extra coin per turn and Silly Goose has low attack stat, he'll keep it out of battle
for the rest of the game. All turns end at the end of an Encounter unless the drawn Encounter card specifies to draw another Encounter card.

### Turn 2 - P2
Micah draws an Encounter card and he meets the Goblin King! This is unfortunate because Micah is far too weak on his first turn to take on the Goblin King
even if his class has a higher base attack stat (D8). The Assassin class also has a boosted base Speed stat (D10), so he's more than likely going to be able to get
away unscathed. He sets his Intention to Escape and the Goblin King requires him to roll a 2 or higher. He rolls a 4 and narrowly escapes. The Goblin
King returns to the Encounter stack and Micah's turn is over.

### Turn 3 - P3
Tanya draws an Encounter card and meets the Yeti. The card says the "It is snowing when Yeti is revealed," so the Weather changes instantly.
(Weather effects don't apply unless they are in effect at the start of your turn -- so before you choose to Encounter (Storming exempt). Meaning that for Snowing,
the effect of "-1 Health every turn" will only apply to turns after this one until the weather is cancelled or changed).
Tanya has a higher base attack stat than Wiseman and Assassin at D10 and the Yeti's Defense stat is 5, so she chooses to attack it. She rolls a 
perfect D10 and the Yeti goes into the Graveyard. Tanya recieves the Bounty written on the card (6 Coin in this case) and then her turn ends.

Alternatively, if she had failed the dice roll with a 2, the Yeti would then attack her. Yeti has an attack of "D4 + 2" and it rolls a 3. Tanya would
then take -5 HP and her turn would end as the Creature would be shuffled back into the Encounter deck.


### (Further examples) Turn 23 - P1
Adam has earned 26 Coin and Charmed a few creatures, the weather is now Sunny. He recieves +1 Health due to the weather. 
He decides to shop from the Merchant who always has 6 randomly selected items available at one time. He spots a Confidence Boost upgrade 
card (can be stacked limitlessly to your character) which costs 12 Coin. He buys it and applies it right away, giving him +1 Die 
to his Charisma stat. Since he already applied a Confidence Boost earlier in the game, he now has +2 Charisma Die. Wiseman's base Charisma is
D8, and his Die was upgraded twice, putting him now at a D12 Charisma. Now for Adam, charming more useful Charmables will be possible and easier Charmables will be more likely.
He sells a "Suspicious Remedy" item card to the Merchant for 6 Coin, then he draws an Encounter. (and he finishes the turn out, but we'll move on).



# Micah’s Game — Formal Gameplay Structure (Implementation-Oriented)

This document formalizes the practical gameplay loop described in the narrative “feel” section.  
Its purpose is to make rules, state transitions, and resolution logic explicit and unambiguous for implementation, while preserving the intended speed and simplicity of play.

---

## 1. Turn Structure

Each player’s turn consists of **three distinct phases**.

---

### 1.1 Start-of-Turn Phase (Preparation)

At the beginning of their turn, **before drawing or resolving any Encounter**, a player may perform any number of the following actions, in any order:

- Shop from the Merchant
- Sell items to the Merchant
- Trade with other players
- Change equipped weapon
- Change worn clothing
- Assign or remove a Charmed creature to/from the **Companion** state
- Use non-combat items
- Rearrange inventory

**Restrictions**
- These actions may only occur while **no Encounter is active**.
- Once an Encounter card is drawn, the Preparation Phase immediately ends.

---

### 1.2 Encounter Phase

#### 1.2.1 Encounter Reveal
- The active player draws the top card from the Encounter deck.
- Any **“on reveal” effects** (such as Weather changes) trigger immediately.
- Weather effects only apply if they are active at the **start of a future turn**, unless otherwise specified.

---

#### 1.2.2 Intention Selection
After the Encounter is revealed, the player must choose **exactly one Intention**:

- **Attack**
- **Charm**
- **Escape**

Rules:
- Intentions are mutually exclusive.
- Intention is chosen **after** the Encounter is revealed.
- Once dice are rolled, the Intention **cannot be changed**.
- Only one Intention may be chosen per Encounter.

---

#### 1.2.3 Standard Intention Resolution

- The player rolls the die or dice associated with the chosen stat.
- If the player has an active **Companion**, the Companion rolls its own attack die (if applicable).
- Dice results are resolved simultaneously.

**Dice Resolution Rules**
- Encounter intentions are resolved in **a single roll cycle**.
- Static modifiers (e.g. `+3`) are applied after the roll.
- When multiple dice are present, all dice are rolled and summed unless otherwise specified.

---

### 1.2.4 Alternative Intention Resolution Conditions

While most Encounters resolve using standard stat checks, **Encounter cards may define alternative resolution logic** that replaces the default rules.

These alternative conditions are fully defined by the Encounter card text and are treated as first-class mechanics.

#### 1.2.4.1 Card-Defined Resolution Logic

An Encounter may specify that an Intention resolves using:
- Non-standard dice
- Multiple dice
- Pattern-based outcomes (e.g. matching values)
- Non-damage effects
- Conditional or puzzle-like success states

When present, the card’s resolution rules **override** standard Intention resolution for that Encounter.

---

#### 1.2.4.2 Examples

**Example: Dice Game (Attack Intention)**
- Instead of dealing damage:
  - The Encounter rolls a **D4**
  - The player loses that many items at random from their inventory
- This replaces standard damage and Companion damage rules unless explicitly stated otherwise.

**Example: Escape — Roll Doubles**
- The player must roll **two dice**
- Escape succeeds only if both dice show the same value
- Failure triggers the Encounter’s defined failure effect

---

#### 1.2.4.3 General Rules for Alternative Conditions
- Alternative resolution may:
  - Ignore stat dice entirely
  - Require additional dice
  - Introduce custom win/loss checks
- If no alternative condition is specified, standard Intention resolution applies.

---

#### 1.2.4.4 Core Design Principle

> **Intentions are consistent; resolution is flexible.**

The player always:
1. Reveals an Encounter  
2. Chooses exactly one Intention  
3. Resolves that Intention using either standard or card-defined logic  
4. Applies the outcome  
5. Ends their turn  

---

## 2. Companions (Charmed Creatures)

### 2.1 Companion Assignment
- Charmed creatures may be assigned to the **Companion** state only during the Start-of-Turn Phase.
- Only Companions participate in combat.

---

### 2.2 Companion Combat Behavior

**When Attacking**
- The Companion rolls its attack stat.
- The result is **added to the player’s attack total**.

**When Defending (on failed Intention)**
- The Companion and Player are both attacked by the Encounter.
- If the Encounter’s attack value exceeds the Companion’s Defense stat, the Companion is placed in the Graveyard.

---

## 3. Outcome Resolution

### 3.1 Success
If the player meets or satisfies the Encounter’s success condition:
- Rewards and effects are applied
- The Encounter card is placed in the appropriate zone (Graveyard, Creature Dock, etc.)

---

### 3.2 Failure
If the player fails:
- The Encounter’s failure effect is applied
- The player takes damage equal to the Encounter’s attack value (if non-zero)
- Damage is binary (no partial mitigation)
- The Encounter is shuffled back into the Encounter deck unless otherwise specified

---

### 3.3 Encounter Duration
- All Encounters (except the Final Boss) end immediately after resolution.
- Turns end automatically once the Encounter resolves.

---

## 4. Stats and Dice Progression

### 4.1 Base Stats
- Each Class begins with predefined base stats and dice.

---

### 4.2 Die Upgrade Progression
D4 → D6 → D8 → D10 → D12 → D20
- A modifier such as **“+1 Attack Die”** upgrades the die one step.
- Once a stat reaches **D20**, further upgrades add an additional die starting at **D4**.
- All dice are rolled independently and summed.

**Example**
Attack Dice: D20 + D20 + D6

---

### 4.3 Static Modifiers
- Modifiers such as `D10 +3` add the static value after the roll.

---

## 5. Enemy Dice Usage

- Enemies may roll dice for any of their numerical attributes.
- Aside from Class base stats, **any in-game numeric value may be rolled**.
- Creative dice usage is expected and supported.

---

## 6. Multiplayer Interaction

### 6.1 Trading
- Players may trade items freely.
- Trades may be initiated during any player’s turn as long as no Encounter is active.
- Trades are non-blocking and do not interrupt turn flow unless players choose to engage.

---

### 6.2 Encounter Spectating
- Other players may not interfere with Encounters.
- All Encounters are spectated only.

---

### 6.3 PvP (Future / Optional)
- PvP exists conceptually but is disabled by default.
- PvP mechanics are experimental and may be enabled as a separate game mode in the future.

---

## 7. Merchant System

### 7.1 Inventory
- The Merchant maintains a **global inventory** shared by all players.
- The Merchant always displays **6 items**.

---

### 7.2 Purchasing
- When an item is purchased, it is immediately replaced by a random item from the Treasure deck.

---

### 7.3 Selling
- Selling prices are fixed and printed on item cards.
- Merchant purchase prices are always higher than sell values.

---

### 7.4 Deck Exhaustion
- If the Treasure deck is exhausted:
  - The used Treasure pile is reshuffled to form a new Treasure deck
- The Merchant can never be empty.

---

## 8. Final Boss (High-Level)

- Challenging the Final Boss is optional.
- Any number of players may elect to participate.
- The Final Boss operates under separate encounter rules and is not covered in this document.

---

## Closing Note

This rules abstraction is designed so that:
- Most turns require **one player decision**
- Encounters resolve quickly and deterministically after dice are rolled
- Complexity scales through card content rather than turn overhead







## Misc. ideas
We could have defeated players be able to spectate the rest of the match and maybe have some cards which allow them to participate in the game as "ghosts" or something.
