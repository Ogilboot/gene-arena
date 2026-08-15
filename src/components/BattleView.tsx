import { useState } from "react";
import {
  createBattle,
  createStarter,
  moveById,
  mulberry32,
  randomSeed,
  runBattle,
} from "../game";
import type { BattleEvent, Creature, Side } from "../game";
import { creatureLabel } from "../format";

interface Result {
  log: BattleEvent[];
  winner: Side | null;
}

function describe(e: BattleEvent): string {
  switch (e.type) {
    case "move": {
      const who = e.side === 0 ? "Your" : "Enemy";
      return `${who} creature used ${moveById(e.moveId).name} — ${e.damage} damage (${e.targetHp} HP left)`;
    }
    case "faint":
      return `${e.side === 0 ? "Your" : "Enemy"} creature #${e.index + 1} fainted`;
    case "switch":
      return `${e.side === 0 ? "You" : "Enemy"} sent out creature #${e.index + 1}`;
    case "win":
      return e.side === 0 ? "You win!" : "Enemy wins!";
  }
}

export function BattleView({ creatures }: { creatures: Creature[] }) {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [result, setResult] = useState<Result | null>(null);

  const toggle = (id: string) => {
    setSelectedIds((prev) => {
      if (prev.includes(id)) return prev.filter((x) => x !== id);
      if (prev.length >= 3) return prev;
      return [...prev, id];
    });
  };

  const start = () => {
    const team = selectedIds
      .map((id) => creatures.find((c) => c.id === id))
      .filter((c): c is Creature => c !== undefined);

    const enemy = Array.from({ length: 3 }, () => createStarter(mulberry32(randomSeed())));
    const state = createBattle(team, enemy, 50);
    runBattle(state, undefined, mulberry32(randomSeed()));
    setResult({ log: state.log, winner: state.winner });
  };

  return (
    <div>
      <p className="section-title">Select up to 3 creatures ({selectedIds.length}/3)</p>
      <div className="select-list">
        {creatures.map((c) => (
          <button
            key={c.id}
            className={selectedIds.includes(c.id) ? "chip selected" : "chip"}
            onClick={() => toggle(c.id)}
          >
            {creatureLabel(c)}
          </button>
        ))}
      </div>
      <button disabled={selectedIds.length < 1} onClick={start}>
        Start Battle
      </button>

      {result ? (
        <div className="battle-log">
          <h2 className="section-title">
            {result.winner === 0 ? "Victory" : result.winner === 1 ? "Defeat" : "Draw"}
          </h2>
          <ol>
            {result.log.map((e, i) => (
              <li key={i}>{describe(e)}</li>
            ))}
          </ol>
        </div>
      ) : null}
    </div>
  );
}
