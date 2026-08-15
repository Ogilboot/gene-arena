import assert from "node:assert/strict";
import { after, before, test } from "node:test";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import type { AddressInfo } from "node:net";
import type { Server } from "node:http";

const dir = mkdtempSync(join(tmpdir(), "gene-arena-"));
process.env.DB_PATH = join(dir, "test.db");

let server: Server;
let base: string;

before(async () => {
  const { app } = await import("../server/app.js");
  server = await new Promise<Server>((resolve) => {
    const s = app.listen(0, () => resolve(s));
  });
  base = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
});

after(() => {
  server.close();
});

async function json(
  path: string,
  opts: { method?: string; token?: string; body?: unknown } = {},
): Promise<{ status: number; data: any }> {
  const res = await fetch(`${base}${path}`, {
    method: opts.method ?? "GET",
    headers: {
      "Content-Type": "application/json",
      ...(opts.token ? { Authorization: `Bearer ${opts.token}` } : {}),
    },
    body: opts.body !== undefined ? JSON.stringify(opts.body) : undefined,
  });
  const data = await res.json();
  return { status: res.status, data };
}

test("full marketplace flow", async () => {
  const uniq = Date.now();
  const alice = (await json("/api/auth/register", { method: "POST", body: { username: `alice${uniq}`, password: "secret123" } })).data;
  const bob = (await json("/api/auth/register", { method: "POST", body: { username: `bob${uniq}`, password: "secret123" } })).data;

  const meA = (await json("/api/me", { token: alice.token })).data;
  assert.equal(meA.creatures.length, 6);
  assert.equal(meA.user.coins, 1000);

  const c0 = meA.creatures[0];
  const c1 = meA.creatures[1];

  const breed = (await json("/api/breed", { method: "POST", token: alice.token, body: { parentAId: c0.id, parentBId: c1.id } })).data;
  assert.equal(breed.coins, 900);
  assert.ok(breed.child.id);
  assert.equal(breed.child.generation, 2);

  const list = await json("/api/market", { method: "POST", token: alice.token, body: { creatureId: c0.id, price: 200 } });
  assert.equal(list.status, 200);

  const market = (await json("/api/market", { token: bob.token })).data;
  assert.equal(market.listings.length, 1);
  const listing = market.listings[0];
  assert.equal(listing.price, 200);
  assert.equal(listing.sellerName, `alice${uniq}`);

  const buy = (await json(`/api/market/${listing.id}/buy`, { method: "POST", token: bob.token })).data;
  assert.equal(buy.coins, 800);

  const meB = (await json("/api/me", { token: bob.token })).data;
  assert.equal(meB.creatures.length, 7);
  assert.ok(meB.creatures.some((c: { id: string }) => c.id === c0.id));

  const aliceAfter = (await json("/api/me", { token: alice.token })).data;
  assert.equal(aliceAfter.user.coins, 1080);
});

test("rejects bad credentials and unauthorized access", async () => {
  const uniq = Date.now() + 1;
  await json("/api/auth/register", { method: "POST", body: { username: `bad${uniq}`, password: "secret123" } });

  const badLogin = await json("/api/auth/login", { method: "POST", body: { username: `bad${uniq}`, password: "wrongpass" } });
  assert.equal(badLogin.status, 401);

  const noAuth = await json("/api/me");
  assert.equal(noAuth.status, 401);
});

test("campaign progress advances on beating the next gym", async () => {
  const uniq = Date.now() + 2;
  const user = (await json("/api/auth/register", { method: "POST", body: { username: `gym${uniq}`, password: "secret123" } })).data;
  const me = (await json("/api/me", { token: user.token })).data;
  assert.equal(me.user.gymProgress, 0);

  const beat = (await json("/api/campaign/beat", { method: "POST", token: user.token, body: { gymId: 0 } })).data;
  assert.equal(beat.progress, 1);
  assert.equal(beat.coins, 1200);

  const again = await json("/api/campaign/beat", { method: "POST", token: user.token, body: { gymId: 0 } });
  assert.equal(again.status, 400);
});
