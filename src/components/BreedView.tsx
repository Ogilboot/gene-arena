import { useState } from "react";
import { BREED_COST } from "../game";
import type { Creature } from "../game";
import { creatureLabel } from "../format";
import { CreatureCard } from "./CreatureCard";

interface Props {
  creatures: Creature[];
  onBreed: (aId: string, bId: string) => Promise<Creature>;
}

export function BreedView({ creatures, onBreed }: Props) {
  const [aId, setAId] = useState("");
  const [bId, setBId] = useState("");
  const [result, setResult] = useState<Creature | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const a = creatures.find((c) => c.id === aId);
  const b = creatures.find((c) => c.id === bId);
  const canBreed = a !== undefined && b !== undefined && a.id !== b.id;

  const handleBreed = async () => {
    if (!a || !b) return;
    setError("");
    setBusy(true);
    try {
      setResult(await onBreed(a.id, b.id));
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div>
      <p className="section-title">Breeding costs {BREED_COST} coins</p>
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
        <button disabled={!canBreed || busy} onClick={handleBreed}>
          Breed
        </button>
      </div>

      {error ? <p className="error">{error}</p> : null}

      {result ? (
        <div className="breed-result">
          <h2 className="section-title">Offspring</h2>
          <CreatureCard creature={result} />
        </div>
      ) : null}
    </div>
  );
}
