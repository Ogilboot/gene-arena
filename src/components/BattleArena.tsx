import { useRef, useState } from "react";
import {
  activeCombatant,
  chooseBestMove,
  createBattle,
  moveById,
  mulberry32,
  randomSeed,
  resolveTurn,
} from "../game";
import type { BattleState, Creature, Side } from "../game";
import { creatureName } from "../game";
import { capitalize } from "../format";
import { CreatureSprite } from "./CreatureSprite";

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

type FloatKind = "damage" | "miss" | "status";

interface FloatFx {
  id: number;
  side: Side;
  text: string;
  kind: FloatKind;
}

interface Props {
  playerTeam: Creature[];
  enemyTeam: Creature[];
  onFinish: (won: boolean) => void;
}

function TeamStrip({ state, side }: { state: BattleState; side: Side }) {
  const team = state.teams[side];
  return (
    <div className="team-strip">
      {team.combatants.map((c, i) => (
        <div
          key={i}
          className={`team-slot ${c.hp <= 0 ? "fainted" : ""} ${i === team.activeIndex ? "active" : ""}`}
        >
          <CreatureSprite creature={c.creature} size={42} />
        </div>
      ))}
    </div>
  );
}

function CombatantPanel({
  side,
  state,
  attacker,
  floats,
}: {
  side: Side;
  state: BattleState;
  attacker: boolean;
  floats: FloatFx[];
}) {
  const c = activeCombatant(state, side);
  const pct = Math.max(0, Math.round((c.hp / c.maxHp) * 100));
  const lungeClass = attacker ? (side === 0 ? "attacking-up" : "attacking-down") : "";

  return (
    <div className="arena-side">
      <TeamStrip state={state} side={side} />
      <div className={`sprite-wrap ${lungeClass}`}>
        <CreatureSprite creature={c.creature} size={150} />
        {floats.map((f) => (
          <div key={f.id} className={`float-text ${f.kind}`}>
            {f.text}
          </div>
        ))}
      </div>
      <div className="arena-name">
        {creatureName(c.creature)}{" "}
        <span className="arena-sub">
          Lv {c.level} · {c.creature.phenotype.elements.map(capitalize).join(" / ")}
        </span>
      </div>
      <div className="hp-track">
        <div className={`hp-fill ${pct <= 25 ? "low" : ""}`} style={{ width: `${pct}%` }} />
      </div>
      <div className="hp-label">
        {c.hp} / {c.maxHp}
      </div>
      {c.status ? <span className={`status-badge ${c.status}`}>{c.status}</span> : null}
    </div>
  );
}

export function BattleArena({ playerTeam, enemyTeam, onFinish }: Props) {
  const [state, setState] = useState<BattleState>(() => createBattle(playerTeam, enemyTeam, 50));
  const [busy, setBusy] = useState(false);
  const [over, setOver] = useState(false);
  const [attacker, setAttacker] = useState<Side | null>(null);
  const [floats, setFloats] = useState<FloatFx[]>([]);
  const rngRef = useRef(mulberry32(randomSeed()));
  const fxId = useRef(0);

  const playerActive = activeCombatant(state, 0);
  const moves = [...new Set(playerActive.creature.phenotype.eggMoves)];

  const pushFloat = (side: Side, text: string, kind: FloatKind) => {
    const id = ++fxId.current;
    setFloats((f) => [...f, { id, side, text, kind }]);
    setTimeout(() => setFloats((f) => f.filter((x) => x.id !== id)), 900);
  };

  const useMove = async (moveId: number) => {
    if (busy || over) return;
    setBusy(true);

    const before = state.log.length;
    const enemyMove = chooseBestMove(activeCombatant(state, 1), activeCombatant(state, 0));
    resolveTurn(state, moveId, enemyMove, rngRef.current);
    const events = state.log.slice(before);
    setState({ ...state });

    for (const e of events) {
      if (e.type === "move") {
        setAttacker(e.side);
        pushFloat(e.target, e.damage === 0 ? "Miss!" : `-${e.damage}`, e.damage === 0 ? "miss" : "damage");
        await sleep(650);
        setAttacker(null);
      } else if (e.type === "status") {
        if (e.status === "paralyze") pushFloat(e.side, "Paralyzed", "status");
        else pushFloat(e.side, `-${e.amount}`, "status");
        await sleep(650);
      } else if (e.type === "faint" || e.type === "switch") {
        await sleep(450);
      }
    }

    if (state.winner !== null) {
      setOver(true);
      onFinish(state.winner === 0);
    }
    setBusy(false);
  };

  return (
    <div className="arena">
      <CombatantPanel
        side={1}
        state={state}
        attacker={attacker === 1}
        floats={floats.filter((f) => f.side === 1)}
      />

      <div className="arena-divider" />

      <CombatantPanel
        side={0}
        state={state}
        attacker={attacker === 0}
        floats={floats.filter((f) => f.side === 0)}
      />

      <div className="move-bar">
        {over ? (
          <div className="arena-over">{state.winner === 0 ? "Victory!" : "Defeat"}</div>
        ) : (
          <>
            <div className="arena-hint">Choose a move</div>
            {moves.map((id) => {
              const move = moveById(id);
              return (
                <button key={id} className="move-btn" disabled={busy} onClick={() => useMove(id)}>
                  <span className="move-name">{move.name}</span>
                  <span className="move-power">
                    {capitalize(move.element)} · {move.power} · {move.category}
                  </span>
                </button>
              );
            })}
          </>
        )}
      </div>
    </div>
  );
}
