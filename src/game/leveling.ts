import type { Creature } from "./types.js";

export function xpToNext(level: number): number {
  return level * 50;
}

export function gainXp(creature: Creature, amount: number): { leveledUp: boolean } {
  creature.xp += amount;
  let leveledUp = false;
  while (creature.xp >= xpToNext(creature.level)) {
    creature.xp -= xpToNext(creature.level);
    creature.level += 1;
    leveledUp = true;
  }
  return { leveledUp };
}

export function battleXp(enemyTeam: Creature[], won: boolean): number {
  const base = enemyTeam.reduce((sum, c) => sum + 20 + c.level * 10, 0);
  return won ? base * 2 : base;
}
