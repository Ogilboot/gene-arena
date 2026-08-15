import { randomBytes, scryptSync, timingSafeEqual } from "node:crypto";
import { db } from "./db.js";

export function hashPassword(password: string): string {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

export function verifyPassword(password: string, stored: string): boolean {
  const [salt, hash] = stored.split(":");
  if (!salt || !hash) return false;
  const candidate = scryptSync(password, salt, 64);
  const expected = Buffer.from(hash, "hex");
  return candidate.length === expected.length && timingSafeEqual(candidate, expected);
}

export function createSession(userId: number): string {
  const token = randomBytes(32).toString("hex");
  db.prepare("INSERT INTO sessions (token, user_id, created_at) VALUES (?, ?, ?)").run(
    token,
    userId,
    Date.now(),
  );
  return token;
}

export function userIdForToken(token: string | undefined): number | null {
  if (!token) return null;
  const row = db.prepare("SELECT user_id AS userId FROM sessions WHERE token = ?").get(token) as
    | { userId: number }
    | undefined;
  return row?.userId ?? null;
}
