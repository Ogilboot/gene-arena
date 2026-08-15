import { useEffect, useState } from "react";
import { breed, createStarter, hatch, mulberry32, randomSeed } from "./game";
import type { Creature } from "./game";
import { loadCreatures, saveCreatures } from "./storage";
import { RanchView } from "./components/RanchView";
import { BreedView } from "./components/BreedView";
import { BattleView } from "./components/BattleView";

type Tab = "ranch" | "breed" | "battle";

const TABS: { id: Tab; label: string }[] = [
  { id: "ranch", label: "Ranch" },
  { id: "breed", label: "Breed" },
  { id: "battle", label: "Battle" },
];

function starterCreatures(): Creature[] {
  const rng = mulberry32(randomSeed());
  return Array.from({ length: 6 }, () => createStarter(rng));
}

export default function App() {
  const [creatures, setCreatures] = useState<Creature[]>(
    () => loadCreatures() ?? starterCreatures(),
  );
  const [tab, setTab] = useState<Tab>("ranch");

  useEffect(() => {
    saveCreatures(creatures);
  }, [creatures]);

  const handleBreed = (a: Creature, b: Creature): Creature => {
    const rng = mulberry32(randomSeed());
    const outcome = breed(a, b, rng);
    const child = hatch(outcome, Math.max(a.generation, b.generation) + 1, [a.id, b.id]);
    setCreatures((prev) => [...prev, child]);
    return child;
  };

  const updateCreatures = (updated: Creature[]) => {
    setCreatures((prev) => {
      const map = new Map(updated.map((c) => [c.id, c]));
      return prev.map((c) => map.get(c.id) ?? c);
    });
  };

  const reset = () => {
    setCreatures(starterCreatures());
  };

  return (
    <div className="app">
      <header>
        <h1>Gene Arena</h1>
        <nav>
          {TABS.map((t) => (
            <button
              key={t.id}
              className={tab === t.id ? "active" : ""}
              onClick={() => setTab(t.id)}
            >
              {t.label}
              {t.id === "ranch" ? ` (${creatures.length})` : ""}
            </button>
          ))}
        </nav>
        <button className="reset" onClick={reset}>
          Reset save
        </button>
      </header>
      <main>
        {tab === "ranch" && <RanchView creatures={creatures} />}
        {tab === "breed" && <BreedView creatures={creatures} onBreed={handleBreed} />}
        {tab === "battle" && (
          <BattleView creatures={creatures} onUpdateCreatures={updateCreatures} />
        )}
      </main>
    </div>
  );
}
