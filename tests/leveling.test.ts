import assert from "node:assert/strict";
import { test } from "node:test";
import { battleXp, gainXp, xpToNext } from "../src/game/leveling.js";
import { createCreature, randomGenome } from "../src/game/genetics.js";
import { mulberry32 } from "../src/game/rng.js";

test("xpToNext grows with level", () => {
  assert.equal(xpToNext(1), 50);
  assert.equal(xpToNext(5), 250);
});

test("gainXp levels up when the threshold is crossed", () => {
  const c = createCreature(randomGenome(mulberry32(1)), false, 1);
  const result = gainXp(c, 60);
  assert.equal(result.leveledUp, true);
  assert.equal(c.level, 2);
  assert.equal(c.xp, 10);
});

test("gainXp does not level up under the threshold", () => {
  const c = createCreature(randomGenome(mulberry32(2)), false, 1);
  const result = gainXp(c, 10);
  assert.equal(result.leveledUp, false);
  assert.equal(c.level, 1);
  assert.equal(c.xp, 10);
});

test("gainXp can level up multiple times", () => {
  const c = createCreature(randomGenome(mulberry32(3)), false, 1);
  gainXp(c, 200);
  assert.equal(c.level, 3);
  assert.equal(c.xp, 50);
});

test("battleXp rewards more for winning", () => {
  const enemy = Array.from({ length: 3 }, () => createCreature(randomGenome(mulberry32(4)), false, 1));
  assert.equal(battleXp(enemy, false), 90);
  assert.equal(battleXp(enemy, true), 180);
});
