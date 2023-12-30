//import PolyDice.js for D func below

function D(value) {
    return Math.floor(Math.random() * value) + 1;
}

export default {
    wiseman: {
        name: "Wiseman",
        health: 45,
        charisma: 8,
        attack: 4,
        speed: 6,
    },
    knight: {
        name: "Knight",
        health: 50,
        charisma: 6,
        attack: 6,
        speed: 6,
    },
    assassin: {
        name: "Assassin",
        health: 40,
        charisma: 4,
        attack: 8,
        speed: 10,
    },
    paladin: {
        name: "Paladin",
        health: 70,
        charisma: 4,
        attack: 10,
        speed: 4,
    },
}