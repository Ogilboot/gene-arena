import assert from "node:assert/strict";
import { test } from "node:test";
import { chance, mulberry32, pick, randInt } from "../src/game/rng.js";

test("mulberry32 is deterministic for a given seed", () => {
  const a = mulberry32(1234);
  const b = mulberry32(1234);
  for (let i = 0; i < 100; i++) {
    assert.equal(a(), b());
  }
});

test("mulberry32 returns values in [0, 1)", () => {
  const rng = mulberry32(42);
  for (let i = 0; i < 1000; i++) {
    const v = rng();
    assert.ok(v >= 0 && v < 1);
  }
});

test("randInt respects bounds", () => {
  const rng = mulberry32(7);
  for (let i = 0; i < 1000; i++) {
    const v = randInt(rng, 0, 15);
    assert.ok(v >= 0 && v <= 15);
  }
});

test("pick returns an element of the array", () => {
  const rng = mulberry32(9);
  const arr = ["a", "b", "c"];
  for (let i = 0; i < 100; i++) {
    assert.ok(arr.includes(pick(rng, arr)));
  }
});

test("chance is true when roll is under the probability", () => {
  assert.equal(chance(() => 0.1, 0.5), true);
  assert.equal(chance(() => 0.9, 0.5), false);
});
