import express from "express";
import type { Request, Response, NextFunction } from "express";
import { hashPassword, verifyPassword, createSession, userIdForToken } from "./auth.js";
import { db } from "./db.js";
import { breed as breedCreatures, hatch, createStarter } from "../src/game/genetics.js";
import { mulberry32, randomSeed } from "../src/game/rng.js";
import {
  BATTLE_LOSS_COINS,
  BATTLE_WIN_COINS,
  BREED_COST,
  GYM_REWARD,
  STARTING_COINS,
  sellerPayout,
} from "../src/game/economy.js";
import { GYMS } from "../src/game/campaign.js";
import { creatureFromDto, creatureToDto } from "../src/game/serialize.js";
import type { CreatureDto } from "../src/game/serialize.js";
import type { Genome } from "../src/game/types.js";

declare global {
  namespace Express {
    interface Request {
      userId: number;
    }
  }
}

interface UserRow {
  id: number;
  username: string;
  password_hash: string;
  coins: number;
  gems: number;
  gym_progress: number;
}

interface CreatureRow {
  id: string;
  owner_id: number;
  genome: string;
  shiny: number;
  level: number;
  xp: number;
  generation: number;
  parent_a: string | null;
  parent_b: string | null;
}

interface ListingRow extends CreatureRow {
  listing_id: number;
  price: number;
  seller_name: string;
}

function rowToDto(row: CreatureRow): CreatureDto {
  return {
    id: row.id,
    genome: JSON.parse(row.genome) as Genome,
    shiny: row.shiny === 1,
    level: row.level,
    xp: row.xp,
    generation: row.generation,
    parents: [row.parent_a, row.parent_b],
  };
}

function insertCreature(dto: CreatureDto, ownerId: number): void {
  db.prepare(
    `INSERT INTO creatures (id, owner_id, genome, shiny, level, xp, generation, parent_a, parent_b, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
  ).run(
    dto.id,
    ownerId,
    JSON.stringify(dto.genome),
    dto.shiny ? 1 : 0,
    dto.level,
    dto.xp,
    dto.generation,
    dto.parents[0],
    dto.parents[1],
    Date.now(),
  );
}

function listUserCreatures(userId: number): CreatureDto[] {
  const rows = db
    .prepare("SELECT * FROM creatures WHERE owner_id = ? ORDER BY created_at")
    .all(userId) as unknown as CreatureRow[];
  return rows.map(rowToDto);
}

function getOwnedCreature(creatureId: string, userId: number): CreatureDto | null {
  const row = db
    .prepare("SELECT * FROM creatures WHERE id = ? AND owner_id = ?")
    .get(creatureId, userId) as unknown as CreatureRow | undefined;
  return row ? rowToDto(row) : null;
}

function getCoins(userId: number): number {
  const row = db
    .prepare("SELECT coins FROM users WHERE id = ?")
    .get(userId) as unknown as { coins: number } | undefined;
  return row?.coins ?? 0;
}

function getUser(
  userId: number,
): { id: number; username: string; coins: number; gems: number; gymProgress: number } | null {
  const row = db
    .prepare("SELECT id, username, coins, gems, gym_progress AS gymProgress FROM users WHERE id = ?")
    .get(userId) as unknown as
    | { id: number; username: string; coins: number; gems: number; gymProgress: number }
    | undefined;
  return row ?? null;
}

function buyListing(
  listingId: number,
  buyerId: number,
): { ok: true; coins: number; creature: CreatureDto } | { ok: false; error: string } {
  const listing = db
    .prepare("SELECT id, creature_id, seller_id, price, status FROM listings WHERE id = ?")
    .get(listingId) as unknown as
    | { id: number; creature_id: string; seller_id: number; price: number; status: string }
    | undefined;

  if (!listing || listing.status !== "active") {
    return { ok: false, error: "Listing not available" };
  }
  if (listing.seller_id === buyerId) {
    return { ok: false, error: "You cannot buy your own listing" };
  }
  if (getCoins(buyerId) < listing.price) {
    return { ok: false, error: "Not enough coins" };
  }

  db.exec("BEGIN IMMEDIATE");
  try {
    const payout = sellerPayout(listing.price);
    db.prepare("UPDATE users SET coins = coins - ? WHERE id = ?").run(listing.price, buyerId);
    db.prepare("UPDATE users SET coins = coins + ? WHERE id = ?").run(payout, listing.seller_id);
    db.prepare("UPDATE listings SET status = 'sold' WHERE id = ?").run(listing.id);
    db.prepare("UPDATE creatures SET owner_id = ? WHERE id = ?").run(buyerId, listing.creature_id);
    db.exec("COMMIT");
  } catch (err) {
    db.exec("ROLLBACK");
    throw err;
  }

  const creatureRow = db
    .prepare("SELECT * FROM creatures WHERE id = ?")
    .get(listing.creature_id) as unknown as CreatureRow | undefined;

  if (!creatureRow) {
    return { ok: false, error: "Creature not found" };
  }
  return { ok: true, coins: getCoins(buyerId), creature: rowToDto(creatureRow) };
}

function auth(req: Request, res: Response, next: NextFunction): void {
  const header = req.headers.authorization;
  const token = header?.startsWith("Bearer ") ? header.slice(7) : undefined;
  const userId = userIdForToken(token);
  if (userId === null) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  req.userId = userId;
  next();
}

export const app = express();

app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  if (req.method === "OPTIONS") {
    res.sendStatus(204);
    return;
  }
  next();
});

app.use(express.json());

app.post("/api/auth/register", (req, res) => {
  const { username, password } = req.body ?? {};
  if (
    typeof username !== "string" ||
    typeof password !== "string" ||
    username.trim().length < 3 ||
    password.length < 6
  ) {
    res.status(400).json({ error: "Username (3+ chars) and password (6+ chars) required" });
    return;
  }

  const name = username.trim();
  const existing = db.prepare("SELECT id FROM users WHERE username = ?").get(name);
  if (existing) {
    res.status(409).json({ error: "Username taken" });
    return;
  }

  const info = db
    .prepare("INSERT INTO users (username, password_hash, coins, gems, created_at) VALUES (?, ?, ?, ?, ?)")
    .run(name, hashPassword(password), STARTING_COINS, 0, Date.now());
  const userId = Number(info.lastInsertRowid);
  const token = createSession(userId);

  const rng = mulberry32(randomSeed());
  for (let i = 0; i < 6; i++) {
    insertCreature(creatureToDto(createStarter(rng)), userId);
  }

  res.json({ token, user: { id: userId, username: name, coins: STARTING_COINS, gems: 0, gymProgress: 0 } });
});

app.post("/api/auth/login", (req, res) => {
  const { username, password } = req.body ?? {};
  if (typeof username !== "string" || typeof password !== "string") {
    res.status(400).json({ error: "Username and password required" });
    return;
  }

  const row = db
    .prepare("SELECT id, username, password_hash, coins, gems, gym_progress FROM users WHERE username = ?")
    .get(username.trim()) as unknown as UserRow | undefined;

  if (!row || !verifyPassword(password, row.password_hash)) {
    res.status(401).json({ error: "Invalid credentials" });
    return;
  }

  const token = createSession(row.id);
  res.json({
    token,
    user: { id: row.id, username: row.username, coins: row.coins, gems: row.gems, gymProgress: row.gym_progress },
  });
});

app.get("/api/me", auth, (req, res) => {
  const user = getUser(req.userId);
  if (!user) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  res.json({ user, creatures: listUserCreatures(req.userId) });
});

app.post("/api/breed", auth, (req, res) => {
  const { parentAId, parentBId } = req.body ?? {};
  if (
    typeof parentAId !== "string" ||
    typeof parentBId !== "string" ||
    parentAId === parentBId
  ) {
    res.status(400).json({ error: "Two distinct parents are required" });
    return;
  }

  const a = getOwnedCreature(parentAId, req.userId);
  const b = getOwnedCreature(parentBId, req.userId);
  if (!a || !b) {
    res.status(404).json({ error: "You must own both parents" });
    return;
  }
  if (getCoins(req.userId) < BREED_COST) {
    res.status(402).json({ error: "Not enough coins to breed" });
    return;
  }

  const outcome = breedCreatures(
    creatureFromDto(a),
    creatureFromDto(b),
    mulberry32(randomSeed()),
  );
  const child = hatch(outcome, Math.max(a.generation, b.generation) + 1, [a.id, b.id]);
  const childDto = creatureToDto(child);

  db.prepare("UPDATE users SET coins = coins - ? WHERE id = ?").run(BREED_COST, req.userId);
  insertCreature(childDto, req.userId);

  res.json({ child: childDto, coins: getCoins(req.userId) });
});

app.get("/api/market", auth, (req, res) => {
  const rows = db
    .prepare(
      `SELECT l.id AS listing_id, l.price, u.username AS seller_name,
              c.id, c.owner_id, c.genome, c.shiny, c.level, c.xp, c.generation, c.parent_a, c.parent_b
       FROM listings l
       JOIN users u ON u.id = l.seller_id
       JOIN creatures c ON c.id = l.creature_id
       WHERE l.status = 'active'
       ORDER BY l.created_at DESC`,
    )
    .all() as unknown as ListingRow[];

  res.json({
    listings: rows.map((r) => ({
      id: r.listing_id,
      price: r.price,
      sellerName: r.seller_name,
      creature: rowToDto(r),
    })),
  });
});

app.post("/api/market", auth, (req, res) => {
  const { creatureId, price } = req.body ?? {};
  if (typeof creatureId !== "string" || !Number.isInteger(price) || price < 1) {
    res.status(400).json({ error: "A creature and a positive price are required" });
    return;
  }

  const creature = getOwnedCreature(creatureId, req.userId);
  if (!creature) {
    res.status(404).json({ error: "You must own the creature" });
    return;
  }

  const existing = db
    .prepare("SELECT id FROM listings WHERE creature_id = ? AND status = 'active'")
    .get(creatureId);
  if (existing) {
    res.status(409).json({ error: "This creature is already listed" });
    return;
  }

  db.prepare(
    "INSERT INTO listings (creature_id, seller_id, price, status, created_at) VALUES (?, ?, ?, 'active', ?)",
  ).run(creatureId, req.userId, price, Date.now());
  res.json({ ok: true });
});

app.post("/api/market/:id/buy", auth, (req, res) => {
  const listingId = Number(req.params.id);
  if (!Number.isInteger(listingId)) {
    res.status(400).json({ error: "Invalid listing" });
    return;
  }
  const result = buyListing(listingId, req.userId);
  if (!result.ok) {
    res.status(400).json({ error: result.error });
    return;
  }
  res.json({ coins: result.coins, creature: result.creature });
});

app.post("/api/market/:id/cancel", auth, (req, res) => {
  const listingId = Number(req.params.id);
  const listing = db
    .prepare("SELECT id, seller_id, status FROM listings WHERE id = ?")
    .get(listingId) as unknown as { id: number; seller_id: number; status: string } | undefined;

  if (!listing || listing.seller_id !== req.userId) {
    res.status(404).json({ error: "Listing not found" });
    return;
  }
  if (listing.status !== "active") {
    res.status(409).json({ error: "Listing is not active" });
    return;
  }

  db.prepare("UPDATE listings SET status = 'cancelled' WHERE id = ?").run(listingId);
  res.json({ ok: true });
});

app.post("/api/campaign/beat", auth, (req, res) => {
  const { gymId } = req.body ?? {};
  if (!Number.isInteger(gymId) || gymId < 0 || gymId >= GYMS.length) {
    res.status(400).json({ error: "Invalid gym" });
    return;
  }

  const user = getUser(req.userId);
  if (!user) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  if (gymId !== user.gymProgress) {
    res.status(400).json({ error: "You must challenge the next gym" });
    return;
  }

  db.prepare("UPDATE users SET gym_progress = gym_progress + 1, coins = coins + ? WHERE id = ?").run(
    GYM_REWARD,
    req.userId,
  );
  res.json({ progress: user.gymProgress + 1, coins: getCoins(req.userId) });
});

app.post("/api/battle/report", auth, (req, res) => {
  const { won, team } = req.body ?? {};
  if (typeof won !== "boolean" || !Array.isArray(team)) {
    res.status(400).json({ error: "Invalid battle report" });
    return;
  }

  for (const member of team) {
    const id = member.id;
    const level = member.level;
    const xp = member.xp;
    if (
      typeof id !== "string" ||
      typeof level !== "number" ||
      typeof xp !== "number" ||
      !Number.isInteger(level) ||
      !Number.isInteger(xp)
    ) {
      res.status(400).json({ error: "Invalid team data" });
      return;
    }
    if (!getOwnedCreature(id, req.userId)) {
      res.status(404).json({ error: "Creature not owned" });
      return;
    }
    db.prepare("UPDATE creatures SET level = ?, xp = ? WHERE id = ?").run(level, xp, id);
  }

  const reward = won ? BATTLE_WIN_COINS : BATTLE_LOSS_COINS;
  db.prepare("UPDATE users SET coins = coins + ? WHERE id = ?").run(reward, req.userId);
  res.json({ coins: getCoins(req.userId) });
});

app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  res.status(500).json({ error: err.message ?? "Server error" });
});
