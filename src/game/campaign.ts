import type { Element } from "./elements.js";
import { ELEMENTS } from "./elements.js";
import { GENE, createCreature, randomGenome, rollShiny } from "./genetics.js";
import type { Rng } from "./rng.js";
import type { Creature } from "./types.js";

export interface Gym {
  id: number;
  name: string;
  element: Element;
  leader: string;
  level: number;
}

export const GYMS: Gym[] = [
  { id: 0, name: "Cinder Gym", element: "fire", leader: "Blaze", level: 10 },
  { id: 1, name: "Tide Gym", element: "water", leader: "Marina", level: 15 },
  { id: 2, name: "Verdant Gym", element: "grass", leader: "Fern", level: 20 },
  { id: 3, name: "Volt Gym", element: "electric", leader: "Tesla", level: 25 },
  { id: 4, name: "Crag Gym", element: "rock", leader: "Granite", level: 30 },
  { id: 5, name: "Frost Gym", element: "ice", leader: "Glacier", level: 35 },
  { id: 6, name: "Gale Gym", element: "wind", leader: "Zephyr", level: 40 },
  { id: 7, name: "Umbral Gym", element: "dark", leader: "Nox", level: 45 },
];

export function createThemedCreature(element: Element, level: number, rng: Rng): Creature {
  const genome = randomGenome(rng);
  genome[GENE.TYPE_PRIMARY] = ELEMENTS.indexOf(element);
  const creature = createCreature(genome, rollShiny(rng, false), 1);
  creature.level = level;
  return creature;
}
