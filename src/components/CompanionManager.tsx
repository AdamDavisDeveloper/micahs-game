import React from "react";
import type { Creature } from "../../engine/types/card.types";
import type { Player } from "../../engine/types/player.types";

type CompanionManagerProps = {
  player: Player;
  onAssignCompanion: (creatureId: string) => void;
  onRemoveCompanion: () => void;
  canModify: boolean;
};

export function CompanionManager({
  player,
  onAssignCompanion,
  onRemoveCompanion,
  canModify,
}: CompanionManagerProps) {
  const hasCompanion = Boolean(player.companion);
  const hasCreatures = player.creatureDock.length > 0;

  if (!hasCompanion && !hasCreatures) {
    return (
      <div className="companion-manager">
        <h3>Companion</h3>
        <p>No creatures in dock</p>
      </div>
    );
  }

  return (
    <div className="companion-manager">
      <h3>Companion</h3>

      {hasCompanion && (
        <div className="current-companion">

          <h4>Active Companion</h4>

          <div className="companion-card">
            <div className="companion-name">{player.companion!.name}</div>
            <div className="companion-stats">
              <div>Attack: {player.companion!.attackDice.join(", ")}</div>
              <div>Defense: {player.companion!.defense}</div>

              {player.companion!.effects && player.companion!.effects.length > 0 && (
                <div className="companion-effects">
                  Effects: {player.companion!.effects.map((e, i) => (
                    <span key={i}>{e.kind}</span>
                  )).join(", ")}
                </div>
              )}
            </div>

            {canModify && (
              <button
                onClick={onRemoveCompanion}
                className="remove-companion-btn"
              >
                Remove Companion
              </button>
            )}
          </div>
        </div>
      )}

      {hasCreatures && (
        <div className="creature-dock">

          <h4>Creature Dock</h4>

          <div className="creature-list">
            {player.creatureDock.map((creature) => (
              <div key={creature.id} className="creature-card">
                <div className="creature-name">{creature.name}</div>
                <div className="creature-stats">
                  <div>Attack: {creature.attackDice.join(", ")}</div>
                  <div>Defense: {creature.defense}</div>

                  {creature.effects && creature.effects.length > 0 && (
                    <div className="creature-effects">
                      Effects: {creature.effects.map((e, i) => (
                        <span key={i}>{e.kind}</span>
                      )).join(", ")}
                    </div>
                  )}
                </div>

                {canModify && (
                  <button
                    onClick={() => onAssignCompanion(creature.id)}
                    className="assign-companion-btn"
                    disabled={hasCompanion && player.companion?.id === creature.id}
                  >
                    {hasCompanion && player.companion?.id === creature.id
                      ? "Active"
                      : "Assign as Companion"}
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
