import assert from "node:assert/strict";
import { test } from "node:test";
import type { Move, MoveCategory } from "../src/game/data.js";
import type { Element } from "../src/game/elements.js";
import {
  activeCombatant,
  calcDamage,
  createBattle,
  createCombatant,
  effectiveStat,
  resolveTurn,
  runBattle,
  speedOf,
  typeMultiplier,
} from "../src/game/battle.js";
import { GENE, STAT_GENES, createCreature } from "../src/game/genetics.js";
import type { Rng } from "../src/game/rng.js";
import type { Creature, StatKey } from "../src/game/types.js";
import { GENOME_LENGTH } from "../src/game/types.js";

function seqRng(values: number[]): Rng {
  let i = 0;
  return () => values[Math.min(i++, values.length - 1)]!;
}

function makeCreature(opts: {
  stats?: Partial<Record<StatKey, number>>;
  ability?: number;
  elements?: [number, number];
  moves?: [number, number, number];
}): Creature {
  const g = new Array<number>(GENOME_LENGTH).fill(0);
  for (const [key, value] of Object.entries(opts.stats ?? {})) {
    g[STAT_GENES[key as StatKey]] = value;
  }
  if (opts.ability !== undefined) g[GENE.ABILITY] = opts.ability;
  if (opts.elements) {
    g[GENE.TYPE_PRIMARY] = opts.elements[0];
    g[GENE.TYPE_SECONDARY] = opts.elements[1];
  }
  if (opts.moves) {
    g[GENE.MOVE_1] = opts.moves[0];
    g[GENE.MOVE_2] = opts.moves[1];
    g[GENE.MOVE_3] = opts.moves[2];
  }
  return createCreature(g, false, 1);
}

function testMove(
  element: Element,
  power = 50,
  category: MoveCategory = "physical",
): Move {
  return { id: 999, name: "Test", element, power, category, accuracy: 100 };
}

test("effectiveStat scales base by level", () => {
  assert.equal(effectiveStat(105, 50), 110);
  assert.equal(effectiveStat(30, 50), 35);
  assert.equal(effectiveStat(105, 100), 215);
  assert.equal(effectiveStat(105, 1), 7);
  assert.equal(effectiveStat(30, 1), 5);
});

test("typeMultiplier multiplies effectiveness across dual types", () => {
  assert.equal(typeMultiplier("fire", ["grass", "grass"]), 4);
  assert.equal(typeMultiplier("fire", ["water", "water"]), 0.25);
  assert.equal(typeMultiplier("fire", ["grass", "water"]), 1);
  assert.equal(typeMultiplier("fire", ["dark", "dark"]), 1);
});

test("calcDamage applies the damage formula on a neutral hit", () => {
  const attacker = createCombatant(makeCreature({ stats: { atk: 13 } }), 50);
  const defender = createCombatant(makeCreature({ stats: { def: 3 } }), 50);
  assert.equal(calcDamage(attacker, defender, testMove("wind"), 1), 46);
});

test("calcDamage uses special stats for special moves", () => {
  const attacker = createCombatant(makeCreature({ stats: { spa: 13 } }), 50);
  const defender = createCombatant(makeCreature({ stats: { spd: 3 } }), 50);
  assert.equal(calcDamage(attacker, defender, testMove("wind", 50, "special"), 1), 46);
});

test("calcDamage applies STAB when the move matches the attacker's type", () => {
  const attacker = createCombatant(makeCreature({ stats: { atk: 13 }, elements: [6, 6] }), 50);
  const defender = createCombatant(makeCreature({ stats: { def: 3 } }), 50);
  assert.equal(calcDamage(attacker, defender, testMove("wind"), 1), 69);
});

test("calcDamage applies type effectiveness", () => {
  const attacker = createCombatant(makeCreature({ stats: { atk: 13 }, elements: [9, 9] }), 50);
  const defender = createCombatant(makeCreature({ stats: { def: 3 }, elements: [2, 9] }), 50);
  assert.equal(calcDamage(attacker, defender, testMove("fire"), 1), 92);
});

test("calcDamage always deals at least 1", () => {
  const attacker = createCombatant(makeCreature({ stats: { atk: 0 } }), 50);
  const defender = createCombatant(makeCreature({ stats: { def: 15 } }), 50);
  assert.ok(calcDamage(attacker, defender, testMove("wind", 40), 1) >= 1);
});

test("Fierce boosts physical damage", () => {
  const attacker = createCombatant(makeCreature({ stats: { atk: 13 }, ability: 2 }), 50);
  const defender = createCombatant(makeCreature({ stats: { def: 3 } }), 50);
  assert.equal(calcDamage(attacker, defender, testMove("wind"), 1), 50);
});

test("Guardian reduces incoming damage", () => {
  const attacker = createCombatant(makeCreature({ stats: { atk: 13 } }), 50);
  const defender = createCombatant(makeCreature({ stats: { def: 3 }, ability: 6 }), 50);
  assert.equal(calcDamage(attacker, defender, testMove("wind"), 1), 41);
});

test("Herald doubles STAB", () => {
  const attacker = createCombatant(makeCreature({ stats: { atk: 13 }, elements: [6, 6], ability: 10 }), 50);
  const defender = createCombatant(makeCreature({ stats: { def: 3 } }), 50);
  assert.equal(calcDamage(attacker, defender, testMove("wind"), 1), 92);
});

test("Quickfoot raises speed by 20%", () => {
  const c = createCombatant(makeCreature({ stats: { spe: 15 }, ability: 7 }), 50);
  assert.equal(speedOf(c), 132);
});

test("faster combatant acts first", () => {
  const slow = makeCreature({ stats: { spe: 0, hp: 15, spd: 15 } });
  const fast = makeCreature({ stats: { spe: 15, hp: 15, spd: 15 } });
  const state = createBattle([slow], [fast]);
  resolveTurn(state, 0, 0, seqRng([0.5, 0.5, 0.5, 0.5]));
  const first = state.log.find((e) => e.type === "move");
  assert.equal(first?.side, 1);
  assert.equal(state.winner, null);
});

test("a fainted combatant does not act that turn", () => {
  const victim = makeCreature({ stats: { hp: 0, def: 0, spd: 0, spe: 0 } });
  const sweeper = makeCreature({ stats: { spa: 15, spe: 15 } });
  const state = createBattle([victim], [sweeper]);
  resolveTurn(state, 0, 11, seqRng([0.5, 0.5, 0.5, 0.5]));
  assert.equal(state.winner, 1);
  const moves = state.log.filter((e) => e.type === "move");
  assert.equal(moves.length, 1);
  assert.equal(moves[0]?.side, 1);
});

test("fainting switches to the next teammate", () => {
  const sweeper = makeCreature({ stats: { spa: 15, spe: 15 } });
  const weak1 = makeCreature({ stats: { hp: 0, spd: 0, spe: 0 } });
  const weak2 = makeCreature({ stats: { hp: 0, spd: 0, spe: 0 } });
  const state = createBattle([sweeper], [weak1, weak2]);
  resolveTurn(state, 11, 0, seqRng([0.5, 0.5, 0.5, 0.5]));
  assert.equal(state.teams[1].activeIndex, 1);
  assert.equal(state.winner, null);
  assert.ok(state.log.some((e) => e.type === "switch" && e.side === 1));
});

test("runBattle plays to completion and declares a winner", () => {
  const strong = [
    makeCreature({ stats: { spa: 15, spe: 15, hp: 15 } }),
    makeCreature({ stats: { spa: 15, spe: 15, hp: 15 } }),
    makeCreature({ stats: { spa: 15, spe: 15, hp: 15 } }),
  ];
  const weak = [
    makeCreature({ stats: { hp: 0, spd: 0, spe: 0 } }),
    makeCreature({ stats: { hp: 0, spd: 0, spe: 0 } }),
    makeCreature({ stats: { hp: 0, spd: 0, spe: 0 } }),
  ];
  const state = createBattle(strong, weak);
  runBattle(state, undefined, seqRng([0.5]));
  assert.equal(state.winner, 0);
  const faints = state.log.filter((e) => e.type === "faint" && e.side === 1);
  assert.equal(faints.length, 3);
});

test("a low-accuracy move can miss", () => {
  const attacker = createCombatant(makeCreature({ stats: { atk: 13, spe: 15 }, ability: 12 }), 50);
  const defender = createCombatant(makeCreature({ stats: { def: 3, spe: 0 } }), 50);
  const state = createBattle([attacker.creature], [defender.creature]);
  resolveTurn(state, 4, 4, seqRng([0.95, 0.95, 0.95, 0.95]));
  const side0Move = state.log.find((e) => e.type === "move" && e.side === 0);
  assert.ok(side0Move && side0Move.type === "move");
  assert.equal(side0Move.damage, 0);
});

test("activeCombatant returns the currently active creature", () => {
  const a = makeCreature({});
  const state = createBattle([a], [a]);
  assert.equal(activeCombatant(state, 0).creature, state.teams[0].combatants[0]?.creature);
});
