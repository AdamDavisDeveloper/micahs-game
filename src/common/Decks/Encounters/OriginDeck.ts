import type { , EncounterCard, Creature } from '../../engine/types/card.types';
import type { DeckEntry } from '../../../engine/utils/deck.ts';

export const OriginDeck: DeckEntry<EncounterCard>[] = [
  {
    cardClass: 'encounter',
    kind: 'Creature',
    id: 'grumpy-goose',
    name: 'Grumpy Goose',
    targets: {
      defense: 6,
      charm: 5,
      escape: 2,
    },
    attack: { kind: 'dice', sides: 4, modifier: 0 },
    reward: { kind: 'treasure', amount: 1 },
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
    count: 3,
  },

  {
    cardClass: 'encounter',
    kind: 'Creature',
    id: 'small-swamp-troll',
    name: 'Small Swamp Troll',
    targets: {
      charm: 3,
      defense: 3,
      escape: 0,
    },
    attack: { kind: 'dice', sides: 4, modifier: 0 },
    reward: { kind: 'coin', amount: 3 },
    charm: {
      creature: {
        id: 'small-swamp-troll',
        name: 'Small Swamp Troll',
        attackDice: [4],
        defense: 3,
      } as Creature,
      reward: { kind: 'none' },
    },
    count: 5,
  },

  {
    cardClass: 'encounter',
    id: 'jubjub',
    name: 'Jub Jub',
    targets: {
      defense: 1,
      escape: 2,
    },
    attack: { kind: 'dice', sides: 4, modifier: 0 },
    reward: { kind: 'coin', amount: 5 },
    count: 1,
  },

  {
    cardClass: 'encounter',
    id: 'also-jubjub',
    name: 'Also Jubjub',
    targets: {
      charm: 10,
      defense: 1,
      escape: 2,
    },
    attack: { kind: 'dice', sides: 4, modifier: 0 },
    reward: { kind: 'coin', amount: 6 },
    charm: {
      creature: {
        id: '',
        name: '',
        attackDice: [4],
        defense: 0,
      } as Creature,
      reward: { kind: 'none' },
    },
    count: 1,
  },

  {
    cardClass: 'encounter',
    kind: 'Traveller',
    id: 'ronen',
    name: 'Ronen',
    targets: {
      defense: { kind: 'dice'; sides: 10 },
      // Note: Ronen's card says you need to outspeed Ronen (D10)
      // But we don't have a standard concept of speed on Encounters
      // So we'll set his "defense" to D10 and just show "Speed" on the
      // Ronen card UI.
      escape: 0,
    },
    attack: { kind: 'dice', sides: 4, modifier: 0 },
    reward: { kind: 'treasure', amount: 1 },
    // Ronen's reward is the Odachi Blade which is treated as an item
    // So we'll need a way to give specific treasures as well as random ones
    count: 0,
  },

  {
    cardClass: 'encounter',
    kind: 'Creature',
    id: 'armoured-mouse',
    name: 'Armoured Mouse',
    targets: {
      charm: 5,
      defense: 4,
      escape: 8,
    },
    attack: { kind: 'dice', sides: 4, modifier: 0 },
    reward: { kind: 'coin', amount: 3 },
    charm: {
      creature: {
        id: '',
        name: '',
        attackDice: [4],
        defense: 0,
        effects: [{ effect: { kind: 'stat.die.upgrade', stat: 'charisma', steps: 1 }, repeat: 'once' }],
      } as Creature,
      reward: { kind: 'none' },
    },
    count: 1,
  },

  {
    cardClass: 'encounter',
    id: 'horseback-honora',
    name: 'Horseback Honora',
    targets: {
      charm: 7, // Or pay 9 coin (need to put that in game engine)
      defense: 11,
      escape: 16,
    },
    attack: { kind: 'dice', sides: 6, modifier: 0 },
    reward: { kind: 'coin', amount: 8 },
    charm: {
      creature: {
        id: 'horseback-honora',
        name: 'Horseback Honora',
        attackDice: [6],
        defense: 11,
        effects: [{ effect: { kind: 'stat.die.upgrade', stat: 'speed', steps: 3 }, repeat: 'once' }],
      } as Creature,
      reward: { kind: 'none' },
    },
    count: 1,
  },

  {
    cardClass: 'encounter',
    id: 'horseback-honora',
    name: 'Horseback Honora',
    targets: {
      charm: 7, // Or pay 9 coin (need to put that in game engine)
      defense: 11,
      escape: 16,
    },
    attack: { kind: 'dice', sides: 6, modifier: 0 },
    reward: { kind: 'coin', amount: 8 },
    charm: {
      creature: {
        id: 'horseback-honora',
        name: 'Horseback Honora',
        attackDice: [6],
        defense: 11,
        effects: [{ effect: { kind: 'stat.die.upgrade', stat: 'speed', steps: 3 }, repeat: 'once' }],
      } as Creature,
      reward: { kind: 'none' },
    },
    count: 1,
  },

  {
    cardClass: 'encounter',
    id: 'siren',
    name: 'Siren',
    targets: {
      defense: 6,
      charm: 10,
      escape: 4,
    },
    attack: { kind: 'dice', sides: 6, modifier: 1 },
    reward: { kind: 'treasure', amount: 1 },
    weatherChange: 'foggy',
    charm: {
      creature: {
        id: 'horseback-honora',
        name: 'Horseback Honora',
        attackDice: [6],
        defense: 11,
        effects: [{ effect: { kind: 'stat.die.upgrade', stat: 'speed', steps: 3 }, repeat: 'once' }],
        // Siren has effect of modifying +4 to the total dice damage of Player attacks
        // when an Encounter is a Traveller type.
      } as Creature,
      reward: { kind: 'none' },
    },
    count: 3,
  },

];
