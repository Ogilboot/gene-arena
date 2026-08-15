import type { Element } from "./elements.js";

export type Gene = number;

export const GENOME_LENGTH = 32;

export type Genome = Gene[];

export const STAT_KEYS = ["hp", "atk", "def", "spa", "spd", "spe"] as const;

export type StatKey = (typeof STAT_KEYS)[number];

export type Stats = Record<StatKey, number>;

export type Rarity = "common" | "uncommon" | "rare" | "epic" | "legendary";

export interface Phenotype {
  elements: [Element, Element];
  stats: Stats;
  ability: number;
  eggMoves: number[];
  appearance: number[];
  shinyPotential: number;
  ivSum: number;
  rarity: Rarity;
}

export interface Creature {
  id: string;
  genome: Genome;
  phenotype: Phenotype;
  shiny: boolean;
  level: number;
  xp: number;
  generation: number;
  parents: [string | null, string | null];
}
