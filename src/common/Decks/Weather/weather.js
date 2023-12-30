//import CharacterEffects.js for funcs below

// function addHealth(amount) {

// }

// function addCharisma(amount) {
    
// }

// function addAttack(amount) {
    
// }

// function reduceSpeed(amount) {
    
// }

// function reduceHealth(amount) {

// }

export default {
    sunny: {
        name: "Sunny",
        effects: [
            { effect: addHealth,     amount: 1, repeat: 0 }, // 0 means repeate every turn
            { effect: addCharisma,   amount: 1, repeat: 1 },
        ],
        conditionals: [
            { effect: addCharisma,    condition: "wiseman", amount: 3, repeat: 1 },
            { effect: reduceHealth,   condition: "paladin", amount: 1, repeat: 1 }
        ]
    },
    foggy: {
        name: "Foggy",
        effects: [
            { effect: reduceSpeed, amount: 2, repeat: 1 },
        ],
        conditionals: [
            { effect: addAttack, condition: "assasin", amount: 1, repeat: 1 },
        ]
    },
    storming: {
        name: "Storming",
        effects: [],
        conditionals: []
    },
    snowing: {
        name: "Snowy",
        effects: [
            { effect: reduceHealth,     amount: 1, repeat: 0 },
        ],
        conditionals: [
            { effect: reduceSpeed,   condition: "assasin", amount: 2, repeat: 1 }
        ]
    },
};