import { useState } from "react";
import type { Creature } from "../game";
import { creatureLabel } from "../format";
import { CreatureCard } from "./CreatureCard";

interface Props {
  creatures: Creature[];
  onBreed: (a: Creature, b: Creature) => Creature;
}

export function BreedView({ creatures, onBreed }: Props) {
  const [aId, setAId] = useState("");
  const [bId, setBId] = useState("");
  const [result, setResult] = useState<Creature | null>(null);

  const a = creatures.find((c) => c.id === aId);
  const b = creatures.find((c) => c.id === bId);
  const canBreed = a !== undefined && b !== undefined && a.id !== b.id;

  const handleBreed = () => {
    if (!a || !b) return;
    setResult(onBreed(a, b));
  };

  return (
    <div>
      <div className="breed-pickers">
        <label>
          Parent A
          <select value={aId} onChange={(e) => setAId(e.target.value)}>
            <option value="">Select…</option>
            {creatures.map((c) => (
              <option key={c.id} value={c.id}>
                {creatureLabel(c)}
              </option>
            ))}
          </select>
        </label>
        <label>
          Parent B
          <select value={bId} onChange={(e) => setBId(e.target.value)}>
            <option value="">Select…</option>
            {creatures.map((c) => (
              <option key={c.id} value={c.id}>
                {creatureLabel(c)}
              </option>
            ))}
          </select>
        </label>
        <button disabled={!canBreed} onClick={handleBreed}>
          Breed
        </button>
      </div>

      {result ? (
        <div className="breed-result">
          <h2 className="section-title">Offspring</h2>
          <CreatureCard creature={result} />
        </div>
      ) : null}
    </div>
  );
}
