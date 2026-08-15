import assert from "node:assert/strict";
import { test } from "node:test";
import { calcDamage, createBattle, createCombatant, resolveTurn, speedOf } from "../src/game/battle.js";
import type { Move, MoveCategory } from "../src/game/data.js";
import type { Element } from "../src/game/elements.js";
import { GENE, STAT_GENES, createCreature } from "../src/game/genetics.js";
import type { Rng } from "../src/game/rng.js";
import type { Creature, StatKey, Status } from "../src/game/types.js";
import { GENOME_LENGTH } from "../src/game/types.js";

function seqRng(values: number[]): Rng {
  let i = 0;
  return () => values[Math.min(i++, values.length - 1)]!;
}

function makeCreature(opts: { stats?: Partial<Record<StatKey, number>>; ability?: number }): Creature {
  const g = new Array<number>(GENOME_LENGTH).fill(0);
  for (const [key, value] of Object.entries(opts.stats ?? {})) {
    g[STAT_GENES[key as StatKey]] = value;
  }
  if (opts.ability !== undefined) g[GENE.ABILITY] = opts.ability;
  return createCreature(g, false, 1);
}

function testMove(
  element: Element,
  power = 50,
  category: MoveCategory = "physical",
  status?: Status,
  statusChance?: number,
): Move {
  return { id: 99, name: "Test", element, power, category, accuracy: 100, status, statusChance };
}

test("burn halves physical damage", () => {
  const attacker = createCombatant(makeCreature({ stats: { atk: 13 } }), 50);
  attacker.status = "burn";
  const defender = createCombatant(makeCreature({ stats: { def: 3 } }), 50);
  assert.equal(calcDamage(attacker, defender, testMove("wind"), 1), 24);
});

test("burn does not affect special damage", () => {
  const attacker = createCombatant(makeCreature({ stats: { spa: 13 } }), 50);
  attacker.status = "burn";
  const defender = createCombatant(makeCreature({ stats: { spd: 3 } }), 50);
  assert.equal(calcDamage(attacker, defender, testMove("wind", 50, "special"), 1), 46);
});

test("paralyze halves speed", () => {
  const c = createCombatant(makeCreature({ stats: { spe: 15 } }), 50);
  c.status = "paralyze";
  assert.equal(speedOf(c), 55);
});

test("a status move can poison the target", () => {
  const attacker = makeCreature({ stats: { atk: 13, spe: 15 }, ability: 12 });
  const defender = makeCreature({ stats: { hp: 15, def: 15, spe: 0 } });
  const state = createBattle([attacker], [defender]);
  resolveTurn(state, 9, 0, seqRng([0.5, 0.1, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5]));
  assert.equal(state.teams[1].combatants[0]!.status, "poison");
});

test("Bulwark prevents status effects", () => {
  const attacker = makeCreature({ stats: { atk: 13, spe: 15 }, ability: 12 });
  const defender = makeCreature({ stats: { hp: 15, def: 15, spe: 0 }, ability: 14 });
  const state = createBattle([attacker], [defender]);
  resolveTurn(state, 9, 0, seqRng([0.5, 0.1, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5]));
  assert.equal(state.teams[1].combatants[0]!.status, null);
});

test("poison ticks residual damage at end of turn", () => {
  const a = makeCreature({ stats: { hp: 15, def: 15 } });
  const b = makeCreature({ stats: { hp: 15, def: 15 } });
  const state = createBattle([a], [b]);
  state.teams[0].combatants[0]!.status = "poison";
  resolveTurn(state, 0, 0, seqRng([0.5, 0.5, 0.5, 0.5, 0.5, 0.5]));
  const poisonEvent = state.log.find((e) => e.type === "status" && e.status === "poison");
  assert.ok(poisonEvent && poisonEvent.type === "status");
  assert.equal(poisonEvent.amount, 13);
});

test("paralyze can prevent a creature from acting", () => {
  const a = makeCreature({ stats: { spe: 15 } });
  const b = makeCreature({ stats: { spe: 0 } });
  const state = createBattle([a], [b]);
  state.teams[0].combatants[0]!.status = "paralyze";
  resolveTurn(state, 0, 0, seqRng([0.1, 0.5, 0.5, 0.5, 0.5]));
  const skip = state.log.find(
    (e) => e.type === "status" && e.status === "paralyze" && e.side === 0,
  );
  assert.ok(skip);
});
