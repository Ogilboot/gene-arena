import type { Creature } from "./game";

const KEY = "gene-arena.creatures.v1";

export function saveCreatures(creatures: Creature[]): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(creatures));
  } catch {
    localStorage.clear();
  }
}

export function loadCreatures(): Creature[] | null {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return null;
    const creatures = parsed as Creature[];
    if (creatures.some((c) => !c || !Array.isArray(c.genome) || !c.phenotype)) return null;
    return creatures.map((c) => ({ ...c, xp: c.xp ?? 0, level: c.level ?? 1 }));
  } catch {
    return null;
  }
}
