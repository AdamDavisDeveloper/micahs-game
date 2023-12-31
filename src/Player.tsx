import React from 'react';

type PlayerProps = {
  id: string;
  name: string;
  characterClass: string;
  health: number;
  attack: number;
  charisma: number;
  speed: number;
  inventory: any[]; // object - replace with Inventory[]
  companions: any[]; // object - replace with Companions[]
  // ... Add other properties like weather effects, etc.
};

const Player: React.FC<PlayerProps> = ({
  id,
  name,
  characterClass,
  health,
  attack,
  charisma,
  speed,
  inventory,
  companions,
  // ... include other props
}) => (
  <div className="player-container">
    <h2>{name}</h2>
    <h3>{id}</h3>
    <h4>{characterClass}</h4>
    <div className="stats">
      <p>Health: {health}</p>
      <p>Charisma: {charisma}</p>
      <p>Attack: {attack}</p>
      <p>Speed: {speed}</p>
    </div>
    <div className="inventory">
      <h4>Inventory:</h4>
      {/* List items */}
      {inventory.map((item) => (
        <p key={item.id}>{item}</p>
      ))}
    </div>
    <div className="companions">
      <h4>Companions:</h4>
      {/* List companions */}
      {companions.map((companion) => (
        <p key={companion.id}>{companion}</p>
      ))}
    </div>
  </div>
);

export default Player;
