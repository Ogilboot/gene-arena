import type { Element } from "./elements.js";

export interface Ability {
  id: number;
  name: string;
}

export const ABILITIES: Ability[] = [
  { id: 0, name: "Swift" },
  { id: 1, name: "Resilient" },
  { id: 2, name: "Fierce" },
  { id: 3, name: "Insightful" },
  { id: 4, name: "Sturdy" },
  { id: 5, name: "Reckless" },
  { id: 6, name: "Guardian" },
  { id: 7, name: "Quickfoot" },
  { id: 8, name: "Venom" },
  { id: 9, name: "Static" },
  { id: 10, name: "Herald" },
  { id: 11, name: "Regenerate" },
  { id: 12, name: "Focused" },
  { id: 13, name: "Opportunist" },
  { id: 14, name: "Bulwark" },
  { id: 15, name: "Flux" },
];

export type MoveCategory = "physical" | "special";

export interface Move {
  id: number;
  name: string;
  element: Element;
  power: number;
  category: MoveCategory;
  accuracy: number;
}

export const MOVES: Move[] = [
  { id: 0, name: "Ember", element: "fire", power: 40, category: "special", accuracy: 100 },
  { id: 1, name: "Torrent", element: "water", power: 40, category: "special", accuracy: 100 },
  { id: 2, name: "Vine Whip", element: "grass", power: 45, category: "physical", accuracy: 100 },
  { id: 3, name: "Spark", element: "electric", power: 40, category: "physical", accuracy: 100 },
  { id: 4, name: "Rock Throw", element: "rock", power: 50, category: "physical", accuracy: 90 },
  { id: 5, name: "Frostbite", element: "ice", power: 40, category: "special", accuracy: 100 },
  { id: 6, name: "Gust", element: "wind", power: 40, category: "special", accuracy: 100 },
  { id: 7, name: "Tremor", element: "ground", power: 50, category: "physical", accuracy: 100 },
  { id: 8, name: "Glint", element: "light", power: 40, category: "special", accuracy: 100 },
  { id: 9, name: "Shadow Strike", element: "dark", power: 45, category: "physical", accuracy: 100 },
  { id: 10, name: "Blaze", element: "fire", power: 65, category: "special", accuracy: 95 },
  { id: 11, name: "Hydro Pump", element: "water", power: 70, category: "special", accuracy: 90 },
  { id: 12, name: "Leaf Blade", element: "grass", power: 70, category: "physical", accuracy: 95 },
  { id: 13, name: "Thunderbolt", element: "electric", power: 65, category: "special", accuracy: 100 },
  { id: 14, name: "Boulder Crash", element: "rock", power: 70, category: "physical", accuracy: 90 },
  { id: 15, name: "Nightfall", element: "dark", power: 65, category: "special", accuracy: 95 },
];

export function abilityById(id: number): Ability {
  return ABILITIES[id] ?? ABILITIES[0]!;
}

export function moveById(id: number): Move {
  return MOVES[id] ?? MOVES[0]!;
}
