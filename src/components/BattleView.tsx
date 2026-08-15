import { useState } from "react";
import {
  battleXp,
  createBattle,
  createStarter,
  gainXp,
  moveById,
  mulberry32,
  randomSeed,
  runBattle,
} from "../game";
import type { BattleEvent, Creature, Side } from "../game";
import { creatureLabel } from "../format";

interface LevelUp {
  label: string;
  level: number;
}

interface Result {
  log: BattleEvent[];
  winner: Side | null;
  xp: number;
  levelUps: LevelUp[];
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

interface Props {
  creatures: Creature[];
  onUpdateCreatures: (updated: Creature[]) => void;
}

export function BattleView({ creatures, onUpdateCreatures }: Props) {
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
      .filter((c): c is Creature => c !== undefined)
      .map((c) => ({ ...c }));

    const enemy = Array.from({ length: 3 }, () => createStarter(mulberry32(randomSeed())));
    const state = createBattle(team, enemy, 50);
    runBattle(state, undefined, mulberry32(randomSeed()));

    const won = state.winner === 0;
    const xp = battleXp(enemy, won);
    const levelUps = team
      .map((c) => {
        const before = c.level;
        const label = creatureLabel(c);
        gainXp(c, xp);
        return c.level > before ? { label, level: c.level } : null;
      })
      .filter((x): x is LevelUp => x !== null);

    onUpdateCreatures(team);
    setResult({ log: state.log, winner: state.winner, xp, levelUps });
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
          <p>
            Your creatures gained {result.xp} XP.
            {result.levelUps.length > 0 ? " Level up!" : ""}
          </p>
          {result.levelUps.map((l) => (
            <p key={l.label}>
              {l.label} → Lv {l.level}
            </p>
          ))}
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
