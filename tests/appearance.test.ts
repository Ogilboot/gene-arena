import assert from "node:assert/strict";
import { test } from "node:test";
import { computeAppearance } from "../src/game/appearance.js";
import { GENE, createCreature, createStarter } from "../src/game/genetics.js";
import { mulberry32 } from "../src/game/rng.js";
import type { Creature } from "../src/game/types.js";
import { GENOME_LENGTH } from "../src/game/types.js";

function withAppearance(values: Record<number, number>, shiny = false): Creature {
  const g = new Array<number>(GENOME_LENGTH).fill(0);
  for (const [key, value] of Object.entries(values)) {
    g[GENE.APPEARANCE_START + Number(key)] = value;
  }
  return createCreature(g, shiny, 1);
}

test("appearance is deterministic", () => {
  const c = createStarter(mulberry32(5));
  assert.deepEqual(computeAppearance(c), computeAppearance(c));
});

test("colors are valid hsl strings", () => {
  const a = computeAppearance(withAppearance({}));
  assert.match(a.bodyColor, /^hsl\(\d+, \d+%, \d+%\)$/);
  assert.match(a.bodyDark, /^hsl\(\d+, \d+%, \d+%\)$/);
  assert.match(a.eyeColor, /^hsl\(\d+, \d+%, \d+%\)$/);
});

test("shiny creatures use a gold accent and eye color", () => {
  const a = computeAppearance(withAppearance({}, true));
  assert.equal(a.accent, "#f5c542");
  assert.equal(a.eyeColor, "#f5c542");
  assert.equal(a.shiny, true);
});

test("different appearance genes produce different looks", () => {
  const a = computeAppearance(withAppearance({ 0: 0 }));
  const b = computeAppearance(withAppearance({ 0: 15 }));
  assert.notEqual(JSON.stringify(a), JSON.stringify(b));
  assert.notEqual(a.bodyW, b.bodyW);
});

test("leg count is always between 2 and 4", () => {
  for (let s = 0; s < 25; s++) {
    const a = computeAppearance(createStarter(mulberry32(s)));
    assert.ok(a.legCount >= 2 && a.legCount <= 4);
  }
});

test("body proportions stay within expected bounds", () => {
  for (let s = 0; s < 25; s++) {
    const a = computeAppearance(createStarter(mulberry32(100 + s)));
    assert.ok(a.bodyW >= 0.8 && a.bodyW <= 1.1);
    assert.ok(a.bodyH >= 0.7 && a.bodyH <= 1.075);
  }
});

test("appearance fields are all valid enums", () => {
  for (let s = 0; s < 25; s++) {
    const a = computeAppearance(createStarter(mulberry32(200 + s)));
    assert.ok(["none", "spots", "stripes"].includes(a.pattern));
    assert.ok(["none", "round", "pointed", "horns", "antennae"].includes(a.earType));
    assert.ok(a.eyeType >= 0 && a.eyeType <= 2);
    assert.ok(a.tailType >= 0 && a.tailType <= 3);
  }
});
