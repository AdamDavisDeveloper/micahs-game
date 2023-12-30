export const weapons = [
    {
        name: "Red Katana",
        type: "Weapon",
        effects: {
            standard: [
                { 
                    text: "Upgrade Attack Die",
                    effect: upgradeAttack,
                    amount: 1,
                    repeat: 1,
                }
            ],
            conditional: [
                { 
                    text: "Upgrade Attack Die+",
                    effect: upgradeAttack,
                    condition: "assassin", // applies only to Assasssin players
                    amount: 1,
                    repeat: 1,
                }
            ],
        },
        sell_value: 0,
        merchant_price: 9,
    },
];