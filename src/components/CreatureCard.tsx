import { abilityById, moveById, STAT_KEYS, xpToNext } from "../game";
import type { Creature, StatKey } from "../game";
import { capitalize } from "../format";
import { CreatureSprite } from "./CreatureSprite";

const STAT_LABELS: Record<StatKey, string> = {
  hp: "HP",
  atk: "ATK",
  def: "DEF",
  spa: "SpA",
  spd: "SpD",
  spe: "SPD",
};

interface Props {
  creature: Creature;
  selected?: boolean;
  onSelect?: () => void;
}

export function CreatureCard({ creature, selected = false, onSelect }: Props) {
  const p = creature.phenotype;
  const ability = abilityById(p.ability);
  const moves = p.eggMoves.map((id) => moveById(id).name);
  const xpPct = Math.min(100, Math.round(((creature.xp ?? 0) / xpToNext(creature.level)) * 100));

  return (
    <div
      className={`card${selected ? " selected" : ""}${creature.shiny ? " shiny" : ""}`}
      onClick={onSelect}
    >
      <div className="card-sprite">
        <CreatureSprite creature={creature} size={120} />
      </div>
      <div className="card-head">
        <span className="elements">{p.elements.map(capitalize).join(" / ")}</span>
        <span className={`rarity ${p.rarity}`}>{p.rarity}</span>
        {creature.shiny ? <span className="shiny-star">★</span> : null}
      </div>
      <div className="stat-grid">
        {STAT_KEYS.map((k) => (
          <div key={k} className="stat">
            <span className="stat-label">{STAT_LABELS[k]}</span>
            <span>{p.stats[k]}</span>
          </div>
        ))}
      </div>
      <div className="card-meta">
        <div>Ability: {ability.name}</div>
        <div>Moves: {moves.join(", ")}</div>
        <div>
          Lv {creature.level} · IV {p.ivSum} · Gen {creature.generation}
        </div>
        <div className="xp-bar">
          <div className="xp-fill" style={{ width: `${xpPct}%` }} />
        </div>
      </div>
    </div>
  );
}
