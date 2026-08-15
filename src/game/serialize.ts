import { toPhenotype } from "./genetics.js";
import type { Creature, Genome } from "./types.js";

export interface CreatureDto {
  id: string;
  genome: Genome;
  shiny: boolean;
  level: number;
  xp: number;
  generation: number;
  parents: [string | null, string | null];
}

export function creatureToDto(c: Creature): CreatureDto {
  return {
    id: c.id,
    genome: c.genome,
    shiny: c.shiny,
    level: c.level,
    xp: c.xp,
    generation: c.generation,
    parents: c.parents,
  };
}

export function creatureFromDto(d: CreatureDto): Creature {
  return {
    id: d.id,
    genome: d.genome,
    phenotype: toPhenotype(d.genome),
    shiny: d.shiny,
    level: d.level,
    xp: d.xp,
    generation: d.generation,
    parents: d.parents,
  };
}
