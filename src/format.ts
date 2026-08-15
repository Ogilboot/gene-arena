import type { Creature } from "./game";

export function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

export function creatureLabel(c: Creature): string {
  const [primary, secondary] = c.phenotype.elements;
  return `${capitalize(primary)} / ${capitalize(secondary)} · ${c.phenotype.rarity}${c.shiny ? " ★" : ""}`;
}
