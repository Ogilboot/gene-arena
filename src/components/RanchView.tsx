import type { Creature } from "../game";
import { CreatureCard } from "./CreatureCard";

export function RanchView({ creatures }: { creatures: Creature[] }) {
  if (creatures.length === 0) {
    return <p className="empty">No creatures yet.</p>;
  }

  return (
    <div className="grid">
      {creatures.map((c) => (
        <CreatureCard key={c.id} creature={c} />
      ))}
    </div>
  );
}
