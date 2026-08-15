import { useState } from "react";
import { battleXp, createStarter, gainXp, mulberry32, randomSeed } from "../game";
import type { Creature } from "../game";
import { creatureLabel } from "../format";
import { BattleArena } from "./BattleArena";

interface LevelUp {
  label: string;
  level: number;
}

interface Result {
  won: boolean;
  xp: number;
  levelUps: LevelUp[];
}

interface Props {
  creatures: Creature[];
  onReportBattle: (
    won: boolean,
    team: { id: string; level: number; xp: number }[],
  ) => Promise<void>;
}

export function BattleView({ creatures, onReportBattle }: Props) {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [team, setTeam] = useState<Creature[] | null>(null);
  const [enemy, setEnemy] = useState<Creature[] | null>(null);
  const [result, setResult] = useState<Result | null>(null);

  const toggle = (id: string) => {
    setSelectedIds((prev) => {
      if (prev.includes(id)) return prev.filter((x) => x !== id);
      if (prev.length >= 3) return prev;
      return [...prev, id];
    });
  };

  const start = () => {
    const t = selectedIds
      .map((id) => creatures.find((c) => c.id === id))
      .filter((c): c is Creature => c !== undefined)
      .map((c) => ({ ...c }));
    const e = Array.from({ length: 3 }, () => createStarter(mulberry32(randomSeed())));
    setTeam(t);
    setEnemy(e);
    setResult(null);
  };

  const handleFinish = async (won: boolean) => {
    if (!team || !enemy) return;
    const xp = battleXp(enemy, won);
    const levelUps = team
      .map((c) => {
        const before = c.level;
        const label = creatureLabel(c);
        gainXp(c, xp);
        return c.level > before ? { label, level: c.level } : null;
      })
      .filter((x): x is LevelUp => x !== null);
    const report = team.map((c) => ({ id: c.id, level: c.level, xp: c.xp }));

    try {
      await onReportBattle(won, report);
    } catch {
      // server sync failed; still show the local result
    }
    setResult({ won, xp, levelUps });
  };

  const reset = () => {
    setTeam(null);
    setEnemy(null);
    setResult(null);
    setSelectedIds([]);
  };

  if (team && enemy) {
    return (
      <div>
        <BattleArena playerTeam={team} enemyTeam={enemy} onFinish={handleFinish} />
        {result ? (
          <div className="battle-log">
            <h2 className="section-title">{result.won ? "Victory" : "Defeat"}</h2>
            <p>
              Your creatures gained {result.xp} XP.
              {result.levelUps.length > 0 ? " Level up!" : ""}
            </p>
            {result.levelUps.map((l) => (
              <p key={l.label}>
                {l.label} → Lv {l.level}
              </p>
            ))}
            <button onClick={reset}>New battle</button>
          </div>
        ) : null}
      </div>
    );
  }

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
    </div>
  );
}
