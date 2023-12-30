import React from 'react';

type PlayerProps = {
    id: number;
    name: string;
    health: number;
    attack: number;
    charisma: number;
    speed: number;
    inventory: string[];
    companions: string[];
    // ... Add other properties like weather effects, etc.
};

const Player: React.FC<PlayerProps> = ({
    id,
    name,
    health,
    attack,
    charisma,
    speed,
    inventory,
    companions
    // ... include other props
}) => {
    return (
        <div className="player-container" key={id}>
            <h2>{name}</h2>
            <div className="stats">
                <p>Health: {health}</p>
                <p>Charisma: {charisma}</p>
                <p>Attack: {attack}</p>
                <p>Speed: {speed}</p>
            </div>
            <div className="inventory">
                <h4>Inventory:</h4>
                {/* List items */}
                {inventory.map((item, index) => (
                    <p key={index}>{item}</p>
                ))}
            </div>
            <div className="companions">
                <h4>Companions:</h4>
                {/* List companions */}
                {companions.map((companion, index) => (
                    <p key={index}>{companion}</p>
                ))}
            </div>
        </div>
    );
};

export default Player;
