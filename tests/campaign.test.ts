import assert from "node:assert/strict";
import { test } from "node:test";
import { GYMS, createThemedCreature } from "../src/game/campaign.js";
import { creatureName } from "../src/game/name.js";
import { createStarter } from "../src/game/genetics.js";
import { ELEMENTS } from "../src/game/elements.js";
import { mulberry32 } from "../src/game/rng.js";

test("creatureName is deterministic and non-empty", () => {
  const c = createStarter(mulberry32(1));
  assert.equal(creatureName(c), creatureName(c));
  assert.ok(creatureName(c).length >= 4);
});

test("GYMS has 8 gyms with valid elements and increasing levels", () => {
  assert.equal(GYMS.length, 8);
  for (let i = 0; i < GYMS.length; i++) {
    const g = GYMS[i]!;
    assert.equal(g.id, i);
    assert.ok(ELEMENTS.includes(g.element));
  }
  for (let i = 1; i < GYMS.length; i++) {
    assert.ok(GYMS[i]!.level > GYMS[i - 1]!.level);
  }
});

test("createThemedCreature uses the gym element and level", () => {
  const c = createThemedCreature("water", 15, mulberry32(2));
  assert.equal(c.phenotype.elements[0], "water");
  assert.equal(c.level, 15);
});
