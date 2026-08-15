import type { Element } from "./elements.js";
import { GENE } from "./genetics.js";
import type { Creature } from "./types.js";

const ELEMENT_NAMES: Record<Element, string[]> = {
  fire: ["Ember", "Pyro", "Blaze"],
  water: ["Aqua", "Ripple", "Tide"],
  grass: ["Verd", "Leaf", "Moss"],
  electric: ["Volt", "Spark", "Zap"],
  rock: ["Geo", "Boulder", "Crag"],
  ice: ["Frost", "Glac", "Chill"],
  wind: ["Gale", "Zephyr", "Sky"],
  ground: ["Terra", "Dune", "Clay"],
  light: ["Lumen", "Sol", "Rad"],
  dark: ["Umbra", "Shade", "Nyx"],
};

const SUFFIXES = [
  "ling",
  "wing",
  "claw",
  "horn",
  "tail",
  "fang",
  "spark",
  "maw",
  "whisk",
  "root",
  "pebble",
  "flare",
  "shade",
  "stride",
  "breeze",
  "prism",
];

export function creatureName(c: Creature): string {
  const [primary] = c.phenotype.elements;
  const prefixes = ELEMENT_NAMES[primary] ?? ["Myst"];
  const a = GENE.APPEARANCE_START;
  const prefix = prefixes[(c.genome[a + 0] ?? 0) % prefixes.length]!;
  const suffix = SUFFIXES[(c.genome[a + 1] ?? 0) % SUFFIXES.length]!;
  return prefix + suffix;
}
