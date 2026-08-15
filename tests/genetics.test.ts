import assert from "node:assert/strict";
import { test } from "node:test";
import {
  baseStat,
  breed,
  breedGene,
  breedGenomes,
  computeStats,
  createStarter,
  GENE,
  ivSum,
  MAX_GENE,
  randomGenome,
  rarityFromIvSum,
  rollShiny,
  toPhenotype,
} from "../src/game/genetics.js";
import { elementFromGene, ELEMENTS } from "../src/game/elements.js";
import { ABILITIES, MOVES } from "../src/game/data.js";
import { mulberry32 } from "../src/game/rng.js";
import type { Rng } from "../src/game/rng.js";
import type { Genome } from "../src/game/types.js";
import { GENOME_LENGTH } from "../src/game/types.js";

function seqRng(values: number[]): Rng {
  let i = 0;
  return () => values[Math.min(i++, values.length - 1)]!;
}

function genomeWith(values: Record<number, number>): Genome {
  const g = new Array<number>(GENOME_LENGTH).fill(0);
  for (const [idx, v] of Object.entries(values)) {
    g[Number(idx)] = v;
  }
  return g;
}

test("randomGenome produces 32 genes in range 0..15", () => {
  const g = randomGenome(mulberry32(1));
  assert.equal(g.length, GENOME_LENGTH);
  for (const gene of g) {
    assert.ok(gene >= 0 && gene <= MAX_GENE);
  }
});

test("baseStat maps gene to 30 + gene * 5", () => {
  assert.equal(baseStat(0), 30);
  assert.equal(baseStat(5), 55);
  assert.equal(baseStat(15), 105);
});

test("computeStats derives all six stats from genes", () => {
  const g = genomeWith({
    [GENE.HP]: 15,
    [GENE.ATK]: 0,
    [GENE.DEF]: 5,
    [GENE.SPA]: 10,
    [GENE.SPD]: 3,
    [GENE.SPE]: 12,
  });
  assert.deepEqual(computeStats(g), {
    hp: 105,
    atk: 30,
    def: 55,
    spa: 80,
    spd: 45,
    spe: 90,
  });
});

test("ivSum sums the six stat genes", () => {
  assert.equal(ivSum(genomeWith({})), 0);
  const g = genomeWith({
    [GENE.HP]: 15,
    [GENE.ATK]: 15,
    [GENE.DEF]: 15,
    [GENE.SPA]: 15,
    [GENE.SPD]: 15,
    [GENE.SPE]: 15,
  });
  assert.equal(ivSum(g), 90);
});

test("rarityFromIvSum uses correct thresholds", () => {
  assert.equal(rarityFromIvSum(0), "common");
  assert.equal(rarityFromIvSum(44), "common");
  assert.equal(rarityFromIvSum(45), "uncommon");
  assert.equal(rarityFromIvSum(59), "uncommon");
  assert.equal(rarityFromIvSum(60), "rare");
  assert.equal(rarityFromIvSum(74), "rare");
  assert.equal(rarityFromIvSum(75), "epic");
  assert.equal(rarityFromIvSum(89), "epic");
  assert.equal(rarityFromIvSum(90), "legendary");
});

test("toPhenotype maps genome to valid phenotype", () => {
  const g = genomeWith({ [GENE.TYPE_PRIMARY]: 0, [GENE.TYPE_SECONDARY]: 9 });
  const p = toPhenotype(g);
  assert.deepEqual(p.elements, ["fire", "dark"]);
  assert.equal(p.eggMoves.length, 3);
  assert.equal(p.appearance.length, 12);
  assert.ok(p.ability >= 0 && p.ability < ABILITIES.length);
  assert.ok(p.ivSum >= 0 && p.ivSum <= 90);
  assert.ok(Object.values(p.stats).every((s) => s >= 30 && s <= 105));
});

test("elementFromGene wraps around the element list", () => {
  assert.equal(elementFromGene(0), "fire");
  assert.equal(elementFromGene(9), "dark");
  assert.equal(elementFromGene(10), "fire");
  assert.equal(elementFromGene(15), "ice");
  assert.equal(ELEMENTS.length, 10);
});

test("breedGene dominance always takes the higher value (no mutation)", () => {
  const rng = seqRng([1, 1, 1]);
  assert.equal(breedGene(3, 12, rng, true), 12);
  assert.equal(breedGene(12, 3, rng, true), 12);
});

test("breedGene inherits from A, B, or mutates based on roll", () => {
  const fromA = seqRng([0.1]);
  const fromB = seqRng([0.6]);
  const mutate = seqRng([0.95, 0.5]);
  assert.equal(breedGene(5, 8, fromA, false), 5);
  assert.equal(breedGene(5, 8, fromB, false), 8);
  const mutated = breedGene(5, 8, mutate, false);
  assert.ok(mutated >= 0 && mutated <= 15);
});

test("breedGenomes passes the dominant flag only for type genes", () => {
  const gA = genomeWith({ [GENE.TYPE_PRIMARY]: 2, [GENE.HP]: 3 });
  const gB = genomeWith({ [GENE.TYPE_PRIMARY]: 14, [GENE.HP]: 11 });
  const rng = seqRng([1, 0.5]);
  const child = breedGenomes(gA, gB, rng);
  assert.equal(child[GENE.TYPE_PRIMARY], 14);
  assert.equal(child[GENE.HP], 11);
});

test("rollShiny is boosted when a parent is shiny", () => {
  assert.equal(rollShiny(() => 0.01, false), false);
  assert.equal(rollShiny(() => 0.01, true), true);
  assert.equal(rollShiny(() => 0, false), true);
});

test("breed combines parents and produces an outcome", () => {
  const a = createStarter(mulberry32(2));
  const b = createStarter(mulberry32(3));
  const outcome = breed(a, b, seqRng([0.5]));
  assert.equal(outcome.genome.length, GENOME_LENGTH);
  assert.equal(typeof outcome.shiny, "boolean");
});

test("MOVES and ABILITIES have 16 entries each", () => {
  assert.equal(MOVES.length, 16);
  assert.equal(ABILITIES.length, 16);
});
