import { useState } from "react";
import {
  battleXp,
  createThemedCreature,
  gainXp,
  GYMS,
  mulberry32,
  randomSeed,
} from "../game";
import type { Creature, Gym } from "../game";
import { capitalize, creatureLabel } from "../format";
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

interface Challenge {
  gym: Gym;
  playerTeam: Creature[];
  enemy: Creature[];
}

interface Props {
  gymProgress: number;
  creatures: Creature[];
  onReportBattle: (
    won: boolean,
    team: { id: string; level: number; xp: number }[],
  ) => Promise<void>;
  onBeatGym: (gymId: number) => Promise<void>;
}

export function CampaignView({ gymProgress, creatures, onReportBattle, onBeatGym }: Props) {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [challenge, setChallenge] = useState<Challenge | null>(null);
  const [result, setResult] = useState<Result | null>(null);

  const nextGym = GYMS.find((g) => g.id === gymProgress);

  const toggle = (id: string) => {
    setSelectedIds((prev) => {
      if (prev.includes(id)) return prev.filter((x) => x !== id);
      if (prev.length >= 3) return prev;
      return [...prev, id];
    });
  };

  const startChallenge = () => {
    if (!nextGym) return;
    const team = selectedIds
      .map((id) => creatures.find((c) => c.id === id))
      .filter((c): c is Creature => c !== undefined)
      .map((c) => ({ ...c }));
    const rng = mulberry32(randomSeed());
    const enemy = Array.from({ length: 3 }, () =>
      createThemedCreature(nextGym.element, nextGym.level, rng),
    );
    setChallenge({ gym: nextGym, playerTeam: team, enemy });
    setResult(null);
  };

  const handleFinish = async (won: boolean) => {
    if (!challenge) return;
    const xp = battleXp(challenge.enemy, won);
    const levelUps = challenge.playerTeam
      .map((c) => {
        const before = c.level;
        const label = creatureLabel(c);
        gainXp(c, xp);
        return c.level > before ? { label, level: c.level } : null;
      })
      .filter((x): x is LevelUp => x !== null);
    const report = challenge.playerTeam.map((c) => ({ id: c.id, level: c.level, xp: c.xp }));

    try {
      await onReportBattle(won, report);
      if (won) await onBeatGym(challenge.gym.id);
    } catch {
      // server sync failed; still show the local result
    }
    setResult({ won, xp, levelUps });
  };

  const reset = () => {
    setChallenge(null);
    setResult(null);
    setSelectedIds([]);
  };

  if (challenge) {
    return (
      <div>
        <p className="section-title">
          {challenge.gym.name} — Leader {challenge.gym.leader} ({capitalize(challenge.gym.element)}, Lv{" "}
          {challenge.gym.level})
        </p>
        <BattleArena
          playerTeam={challenge.playerTeam}
          enemyTeam={challenge.enemy}
          onFinish={handleFinish}
        />
        {result ? (
          <div className="battle-log">
            <h2 className="section-title">{result.won ? "Victory!" : "Defeat"}</h2>
            <p>
              Your creatures gained {result.xp} XP.
              {result.levelUps.length > 0 ? " Level up!" : ""}
            </p>
            {result.levelUps.map((l) => (
              <p key={l.label}>
                {l.label} → Lv {l.level}
              </p>
            ))}
            <button onClick={reset}>Back</button>
          </div>
        ) : null}
      </div>
    );
  }

  return (
    <div>
      <div className="gym-grid">
        {GYMS.map((g) => {
          const beaten = g.id < gymProgress;
          const next = g.id === gymProgress;
          const locked = g.id > gymProgress;
          return (
            <div
              key={g.id}
              className={`gym ${beaten ? "beaten" : ""} ${next ? "next" : ""} ${locked ? "locked" : ""}`}
            >
              <div className="gym-name">{g.name}</div>
              <div className="gym-sub">
                {capitalize(g.element)} · Lv {g.level}
              </div>
              <div className="gym-leader">Leader {g.leader}</div>
              <div className="gym-status">{beaten ? "Beaten" : next ? "Next" : "Locked"}</div>
            </div>
          );
        })}
      </div>

      {nextGym ? (
        <div className="challenge">
          <p className="section-title">
            Challenge {nextGym.name} — select up to 3 creatures ({selectedIds.length}/3)
          </p>
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
          <button disabled={selectedIds.length < 1} onClick={startChallenge}>
            Battle leader
          </button>
        </div>
      ) : (
        <p className="section-title">You have defeated every gym. Champion!</p>
      )}
    </div>
  );
}
