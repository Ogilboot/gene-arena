import assert from "node:assert/strict";
import { test } from "node:test";
import { BREED_COST, feeAmount, sellerPayout, STARTING_COINS } from "../src/game/economy.js";
import { createStarter } from "../src/game/genetics.js";
import { mulberry32 } from "../src/game/rng.js";
import { creatureFromDto, creatureToDto } from "../src/game/serialize.js";

test("economy constants are sensible", () => {
  assert.equal(STARTING_COINS, 1000);
  assert.equal(BREED_COST, 100);
});

test("sellerPayout applies a 10% fee and floors", () => {
  assert.equal(sellerPayout(100), 90);
  assert.equal(feeAmount(100), 10);
  assert.equal(sellerPayout(1), 0);
  assert.equal(sellerPayout(105), 94);
});

test("creature DTO round-trips to an equivalent creature", () => {
  const original = createStarter(mulberry32(1));
  const restored = creatureFromDto(creatureToDto(original));
  assert.equal(restored.id, original.id);
  assert.deepEqual(restored.genome, original.genome);
  assert.equal(restored.shiny, original.shiny);
  assert.equal(restored.level, original.level);
  assert.equal(restored.xp, original.xp);
  assert.deepEqual(restored.phenotype, original.phenotype);
});
