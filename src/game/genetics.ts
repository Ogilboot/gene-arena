import { elementFromGene } from "./elements.js";
import type { Rng } from "./rng.js";
import { randInt } from "./rng.js";
import type {
  Creature,
  Genome,
  Phenotype,
  Rarity,
  StatKey,
  Stats,
} from "./types.js";
import { GENOME_LENGTH, STAT_KEYS } from "./types.js";

export const GENE = {
  TYPE_PRIMARY: 0,
  TYPE_SECONDARY: 1,
  HP: 2,
  ATK: 3,
  DEF: 4,
  SPA: 5,
  SPD: 6,
  SPE: 7,
  ABILITY: 8,
  MOVE_1: 9,
  MOVE_2: 10,
  MOVE_3: 11,
  APPEARANCE_START: 12,
  APPEARANCE_END: 23,
  SHINY: 24,
  LINEAGE_START: 25,
} as const;

export const MAX_GENE = 15;

export const STAT_GENES: Record<StatKey, number> = {
  hp: GENE.HP,
  atk: GENE.ATK,
  def: GENE.DEF,
  spa: GENE.SPA,
  spd: GENE.SPD,
  spe: GENE.SPE,
};

const APPEARANCE_COUNT = GENE.APPEARANCE_END - GENE.APPEARANCE_START + 1;

const DOMINANT_GENES: ReadonlySet<number> = new Set([
  GENE.TYPE_PRIMARY,
  GENE.TYPE_SECONDARY,
]);

const MUTATION_RATE = 0.1;
const DOMINANT_MUTATION_RATE = 0.05;
const SHINY_RATE = 1 / 256;
const SHINY_RATE_PARENT = 1 / 64;

export function randomGenome(rng: Rng): Genome {
  return Array.from({ length: GENOME_LENGTH }, () => randInt(rng, 0, MAX_GENE));
}

export function baseStat(gene: number): number {
  return 30 + gene * 5;
}

export function computeStats(genome: Genome): Stats {
  const result = {} as Stats;
  for (const key of STAT_KEYS) {
    result[key] = baseStat(genome[STAT_GENES[key]] ?? 0);
  }
  return result;
}

export function ivSum(genome: Genome): number {
  let sum = 0;
  for (const key of STAT_KEYS) {
    sum += genome[STAT_GENES[key]] ?? 0;
  }
  return sum;
}

export function rarityFromIvSum(sum: number): Rarity {
  if (sum >= 90) return "legendary";
  if (sum >= 75) return "epic";
  if (sum >= 60) return "rare";
  if (sum >= 45) return "uncommon";
  return "common";
}

export function toPhenotype(genome: Genome): Phenotype {
  const sum = ivSum(genome);
  return {
    elements: [
      elementFromGene(genome[GENE.TYPE_PRIMARY] ?? 0),
      elementFromGene(genome[GENE.TYPE_SECONDARY] ?? 0),
    ],
    stats: computeStats(genome),
    ability: genome[GENE.ABILITY] ?? 0,
    eggMoves: [
      genome[GENE.MOVE_1] ?? 0,
      genome[GENE.MOVE_2] ?? 0,
      genome[GENE.MOVE_3] ?? 0,
    ],
    appearance: genome.slice(GENE.APPEARANCE_START, GENE.APPEARANCE_START + APPEARANCE_COUNT),
    shinyPotential: genome[GENE.SHINY] ?? 0,
    ivSum: sum,
    rarity: rarityFromIvSum(sum),
  };
}

export function breedGene(a: number, b: number, rng: Rng, dominant: boolean): number {
  if (dominant) {
    if (rng() < DOMINANT_MUTATION_RATE) return randInt(rng, 0, MAX_GENE);
    return Math.max(a, b);
  }
  const roll = rng();
  if (roll < 0.45) return a;
  if (roll < 0.9) return b;
  return randInt(rng, 0, MAX_GENE);
}

export function breedGenomes(a: Genome, b: Genome, rng: Rng): Genome {
  return a.map((geneA, i) => breedGene(geneA, b[i] ?? 0, rng, DOMINANT_GENES.has(i)));
}

export function rollShiny(rng: Rng, parentsShiny: boolean): boolean {
  return rng() < (parentsShiny ? SHINY_RATE_PARENT : SHINY_RATE);
}

export interface BreedOutcome {
  genome: Genome;
  shiny: boolean;
}

export function breed(parentA: Creature, parentB: Creature, rng: Rng): BreedOutcome {
  const genome = breedGenomes(parentA.genome, parentB.genome, rng);
  const shiny = rollShiny(rng, parentA.shiny || parentB.shiny);
  return { genome, shiny };
}

let idCounter = 0;

export function createCreature(
  genome: Genome,
  shiny: boolean,
  generation: number,
  parents: [string | null, string | null] = [null, null],
): Creature {
  return {
    id: `creature-${++idCounter}`,
    genome,
    phenotype: toPhenotype(genome),
    shiny,
    level: 1,
    generation,
    parents,
  };
}

export function hatch(
  outcome: BreedOutcome,
  generation: number,
  parents: [string, string],
): Creature {
  return createCreature(outcome.genome, outcome.shiny, generation, parents);
}

export function createStarter(rng: Rng): Creature {
  return createCreature(randomGenome(rng), rollShiny(rng, false), 1);
}
