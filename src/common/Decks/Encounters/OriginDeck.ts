import type { EncounterCard, Creature } from '../../engine/types/card.types';
import type { DeckEntry } from '../../../engine/utils/deck.ts';

export const OriginDeck: DeckEntry<EncounterCard>[] = [
  {
    card: {
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
      reward: [{ kind: 'treasure', amount: 1 }],
      charm: {
        creature: {
          id: 'silly-goose',
          name: 'Silly Goose',
          attackDice: [4],
          defense: 2,
          effects: [{ effect: { kind: 'coin.add', amount: 1 }, repeat: 'eachTurnStart' }],
        } as Creature,
      },
    },
    count: 3,
  },

  {
    card: {
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
      reward: [{ kind: 'coin', amount: 3 }],
      charm: {
        creature: {
          id: 'small-swamp-troll',
          name: 'Small Swamp Troll',
          attackDice: [4],
          defense: 3,
        } as Creature,
      },
    },
    count: 5,
  },

  {
    card: {
      cardClass: 'encounter',
      id: 'jubjub',
      name: 'Jub Jub',
      targets: {
        defense: 1,
        escape: 2,
      },
      attack: { kind: 'dice', sides: 4, modifier: 0 },
      reward: [{ kind: 'coin', amount: 5 }],
    },
    count: 1,
  },

  {
    card: {
      cardClass: 'encounter',
      id: 'also-jubjub',
      name: 'Also Jubjub',
      targets: {
        charm: 10,
        defense: 1,
        escape: 2,
      },
      attack: { kind: 'dice', sides: 4, modifier: 0 },
      reward: [{ kind: 'coin', amount: 6 }],
      charm: {
        creature: {
          id: '',
          name: '',
          attackDice: [4],
          defense: 0,
        } as Creature,
      },
    },
    count: 1,
  },

  {
    card: {
      cardClass: 'encounter',
      kind: 'Traveller',
      id: 'ronen',
      name: 'Ronen',
      targets: {
        defense: { kind: 'dice', sides: 10 },
        // Note: Ronen's card says you need to outspeed Ronen (D10)
        // But we don't have a standard concept of speed on Encounters
        // So we'll set his "defense" to D10 and just show "Speed" on the
        // Ronen card UI.
        escape: 0,
      },
      attack: { kind: 'dice', sides: 4, modifier: 0 },
      reward: [{ kind: 'treasure', amount: 1 }],
      // Ronen's reward is the Odachi Blade which is treated as an item
      // So we'll need a way to give specific treasures as well as random ones
    },
    count: 0, // Setting to 0 since this card can't be played with the current engine
  },

  {
    card: {
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
      reward: [{ kind: 'coin', amount: 3 }],
      charm: {
        creature: {
          id: 'armoured-mouse',
          name: 'Armoured Mouse',
          attackDice: [4],
          defense: 4,
          effects: [{ effect: { kind: 'stat.die.upgrade', stat: 'charisma', steps: 1 }, repeat: 'once' }],
        } as Creature,
      },
    },
    count: 2,
  },

  {
    card: {
      cardClass: 'encounter',
      id: 'horseback-honora',
      name: 'Horseback Honora',
      targets: {
        charm: 7, // Or pay 9 coin (need to put that in game engine)
        defense: 11,
        escape: 16,
      },
      attack: { kind: 'dice', sides: 6, modifier: 0 },
      reward: [{ kind: 'coin', amount: 8 }],
      charm: {
        creature: {
          id: 'horseback-honora',
          name: 'Horseback Honora',
          attackDice: [6],
          defense: 11,
          effects: [{ effect: { kind: 'stat.die.upgrade', stat: 'speed', steps: 3 }, repeat: 'once' }],
        } as Creature,
      },
    },
    count: 1,
  },

  {
    card: {
      cardClass: 'encounter',
      kind: 'Creature',
      id: 'siren',
      name: 'Siren',
      targets: {
        defense: 6,
        charm: 10,
        escape: 4,
      },
      attack: { kind: 'dice', sides: 6, modifier: 1 },
      reward: [{ kind: 'treasure', amount: 1 }],
      weatherChange: 'foggy',
      charm: {
        creature: {
          id: 'siren',
          name: 'Siren',
          attackDice: [6],
          defense: 6,
          effects: [{ effect: { kind: 'stat.die.upgrade', stat: 'speed', steps: 3 }, repeat: 'once' }],
          // TODO:
          // Siren has effect of modifying +4 to the total dice damage of Player attacks
          // when an Encounter is a Traveller type.
          // Also charm becomes instant (0) when Encounter is Traveller
        } as Creature,
      },
    },
    count: 4,
  },

  {
    card: {
      cardClass: 'encounter',
      kind: 'Traveller',
      id: 'physician',
      name: 'Physician',
      targets: {
        defense: 2,
        charm: 5, // or pay 6 coin
        escape: 2,
      },
      attack: { kind: 'static', value: 2 },
      reward: [{ kind: 'coin', amount: 4 }],
      charm: {
        creature: {
          id: 'physician',
          name: 'Physician',
          attackDice: [6], // needs to be a static attack of -> 2
          defense: 2,
          effects: [{ effect: { kind: 'hp.add', amount: 2 }, repeat: 'eachTurnStart' }],
        } as Creature,
      },
    },
    count: 3,
  },

  {
    card: {
      cardClass: 'encounter',
      kind: 'Creature',
      id: 'goblin',
      name: 'Goblin',
      targets: {
        defense: 6,
        charm: 6,
        escape: 3,
      },
      attack: { kind: 'dice', sides: 6 },
      reward: [{ kind: 'coin', amount: 2 }, { kind: 'treasure', amount: 1 }],
      charm: {
        creature: {
          id: 'goblin',
          name: 'Goblin',
          attackDice: [6],
          defense: 6,
        } as Creature,
      },
    },
    count: 4,
  },

  {
    card: {
      cardClass: 'encounter',
      kind: 'Uncharmable',
      id: 'mechanical-mantis',
      name: 'Mechanical Mantis',
      targets: {
        defense: 14,
        escape: 6,
      },
      attack: { kind: 'dice', sides: 12 },
      reward: [{ kind: 'coin', amount: 10 }],
    },
    count: 1,
  },

  {
    card: {
      cardClass: 'encounter',
      kind: 'Creature',
      id: 'static-cat',
      name: 'Static Cat',
      targets: {
        defense: 3, // 5 when Storming
        charm: 6,
        escape: 4, // 7 when Storming
      },
      attack: { kind: 'dice', sides: 4 }, // D10 when Storming
      reward: [{ kind: 'coin', amount: 6 }],
      charm: {
        creature: {
          id: 'static-cat',
          name: 'Static Cat',
          attackDice: [4],
          defense: 3,
        } as Creature,
      },
    },
    count: 2,
  },

  {
    card: {
      cardClass: 'encounter',
      kind: 'Creature',
      id: 'treant',
      name: 'Treant',
      targets: {
        defense: 15, // +2 Defense when Sunny
        charm: 16,
        escape: 2,
      },
      attack: { kind: 'dice', sides: 10, modifier: 2 },
      reward: [{ kind: 'treasure', amount: 3 }],
      weatherChange: 'sunny',
      charm: {
        creature: {
          id: 'treant',
          name: 'Treant',
          attackDice: [10],
          defense: 15,
        } as Creature,
      },
    },
    count: 2,
  },

  {
    card: {
      cardClass: 'encounter',
      kind: "Creature",
      id: 'lone-wolf',
      name: 'Lone Wolf',
      targets: {
        charm: 4,
        defense: 4,
        escape: 5,
      },
      attack: { kind: 'dice', sides: 6 },
      reward: [{ kind: 'coin', amount: 3 }],
      charm: {
        creature: {
          id: 'lone-wolf',
          name: 'Lone Wolf',
          attackDice: [6],
          defense: 4,
        } as Creature,
      },
    },
    count: 3,
  },

  {
    card: {
      cardClass: 'encounter',
      kind: "Trap",
      id: 'pitfall',
      name: 'Pitfall',
      targets: {
        defense: 0, // No defense, must escape
        escape: 10,
      },
      attack: { kind: 'effect', type: 'endTurn' }, // add way to have "effect" attack
      reward: [{ kind: 'effect', type: 'drawAgain' }], // add way to have "effect" reward
      charm: {
        creature: {
          id: 'lone-wolf',
          name: 'Lone Wolf',
          attackDice: [6],
          defense: 4,
        } as Creature,
      },
    },
    count: 0, // Setting to 0 since this card can't be played with the current engine
  },
];
