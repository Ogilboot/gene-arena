import { moveById } from "./data.js";
import type { Move } from "./data.js";
import { typeEffectiveness } from "./elements.js";
import type { Element } from "./elements.js";
import type { Rng } from "./rng.js";
import type { Creature, Stats, Status } from "./types.js";
import { STAT_KEYS } from "./types.js";

export interface Combatant {
  creature: Creature;
  level: number;
  stats: Stats;
  maxHp: number;
  hp: number;
  status: Status | null;
}

export interface Team {
  combatants: Combatant[];
  activeIndex: number;
}

export type Side = 0 | 1;

export type BattleEvent =
  | { type: "move"; side: Side; target: Side; moveId: number; damage: number; targetHp: number }
  | { type: "faint"; side: Side; index: number }
  | { type: "switch"; side: Side; index: number }
  | { type: "win"; side: Side }
  | { type: "status"; side: Side; status: Status; amount: number };

export interface BattleState {
  teams: [Team, Team];
  turn: number;
  winner: Side | null;
  log: BattleEvent[];
}

const MAX_TURNS = 200;

export function effectiveStat(base: number, level: number): number {
  return Math.floor((base * level) / 50) + 5;
}

export function effectiveStats(creature: Creature, level: number): Stats {
  const result = {} as Stats;
  for (const key of STAT_KEYS) {
    result[key] = effectiveStat(creature.phenotype.stats[key], level);
  }
  return result;
}

export function createCombatant(creature: Creature, level = creature.level): Combatant {
  const stats = effectiveStats(creature, level);
  return { creature, level, stats, maxHp: stats.hp, hp: stats.hp, status: null };
}

export function createBattle(teamA: Creature[], teamB: Creature[], level = 50): BattleState {
  return {
    teams: [
      { combatants: teamA.map((c) => createCombatant(c, level)), activeIndex: 0 },
      { combatants: teamB.map((c) => createCombatant(c, level)), activeIndex: 0 },
    ],
    turn: 0,
    winner: null,
    log: [],
  };
}

export function activeCombatant(state: BattleState, side: Side): Combatant {
  return state.teams[side].combatants[state.teams[side].activeIndex]!;
}

export function typeMultiplier(attack: Element, defender: [Element, Element]): number {
  return typeEffectiveness(attack, defender[0]) * typeEffectiveness(attack, defender[1]);
}

function hasStab(c: Combatant, move: Move): boolean {
  return c.creature.phenotype.elements.includes(move.element);
}

function stabMultiplier(c: Combatant): number {
  return c.creature.phenotype.ability === 10 ? 2 : 1.5;
}

function offensiveMultiplier(attacker: Combatant, defender: Combatant, move: Move): number {
  let m = 1;
  switch (attacker.creature.phenotype.ability) {
    case 2:
      if (move.category === "physical") m *= 1.1;
      break;
    case 3:
      if (move.category === "special") m *= 1.1;
      break;
    case 5:
      m *= 1.15;
      break;
    case 13:
      if (defender.hp * 2 < defender.maxHp) m *= 1.2;
      break;
  }
  return m;
}

function defensiveMultiplier(defender: Combatant, typeMult: number): number {
  let m = 1;
  switch (defender.creature.phenotype.ability) {
    case 1:
      if (typeMult > 1) m *= 0.8;
      break;
    case 5:
      m *= 1.1;
      break;
    case 6:
      m *= 0.9;
      break;
  }
  return m;
}

export function calcDamage(
  attacker: Combatant,
  defender: Combatant,
  move: Move,
  variance = 1,
): number {
  const burnMod = move.category === "physical" && attacker.status === "burn" ? 0.5 : 1;
  const atk = (move.category === "physical" ? attacker.stats.atk : attacker.stats.spa) * burnMod;
  const def = move.category === "physical" ? defender.stats.def : defender.stats.spd;
  const levelFactor = (2 * attacker.level) / 5 + 2;
  const base = (levelFactor * move.power * (atk / def)) / 50 + 2;
  const typeMult = typeMultiplier(move.element, defender.creature.phenotype.elements);
  const stab = hasStab(attacker, move) ? stabMultiplier(attacker) : 1;
  const off = offensiveMultiplier(attacker, defender, move);
  const defM = defensiveMultiplier(defender, typeMult);
  return Math.max(1, Math.floor(base * stab * typeMult * off * defM * variance));
}

export function speedOf(c: Combatant): number {
  let s = c.stats.spe;
  switch (c.creature.phenotype.ability) {
    case 7:
      s *= 1.2;
      break;
    case 0:
      if (c.hp * 2 <= c.maxHp) s = 100000;
      break;
  }
  if (c.status === "paralyze") s *= 0.5;
  return s;
}

export function chooseBestMove(c: Combatant, opponent: Combatant): number {
  const moves = c.creature.phenotype.eggMoves;
  let best = moves[0] ?? 0;
  let bestDamage = -1;
  for (const id of moves) {
    const dmg = calcDamage(c, opponent, moveById(id), 1);
    if (dmg > bestDamage) {
      bestDamage = dmg;
      best = id;
    }
  }
  return best;
}

function tryApplyStatus(
  state: BattleState,
  targetSide: Side,
  status: Status,
  chancePct: number,
  rng: Rng,
): void {
  const target = activeCombatant(state, targetSide);
  if (target.status !== null) return;
  if (target.creature.phenotype.ability === 14) return;
  if (rng() * 100 < chancePct) target.status = status;
}

function handleFaint(state: BattleState, side: Side): void {
  const team = state.teams[side];
  state.log.push({ type: "faint", side, index: team.activeIndex });
  const next = team.combatants.findIndex((c, i) => i > team.activeIndex && c.hp > 0);
  if (next === -1) {
    state.winner = side === 0 ? 1 : 0;
    state.log.push({ type: "win", side: state.winner });
  } else {
    team.activeIndex = next;
    state.log.push({ type: "switch", side, index: next });
  }
}

function applyDamage(
  state: BattleState,
  attackerSide: Side,
  targetSide: Side,
  moveId: number,
  damage: number,
): void {
  const team = state.teams[targetSide];
  const target = team.combatants[team.activeIndex]!;

  let finalDamage = damage;
  if (
    target.creature.phenotype.ability === 4 &&
    target.hp === target.maxHp &&
    finalDamage >= target.hp
  ) {
    finalDamage = target.hp - 1;
  }

  target.hp = Math.max(0, target.hp - finalDamage);
  state.log.push({
    type: "move",
    side: attackerSide,
    target: targetSide,
    moveId,
    damage: finalDamage,
    targetHp: target.hp,
  });

  if (target.hp <= 0) handleFaint(state, targetSide);
}

function applyHpChange(state: BattleState, side: Side, delta: number): void {
  const team = state.teams[side];
  const target = team.combatants[team.activeIndex]!;
  target.hp = Math.max(0, Math.min(target.maxHp, target.hp + delta));
  if (target.hp <= 0) handleFaint(state, side);
}

export function resolveTurn(
  state: BattleState,
  moveA: number,
  moveB: number,
  rng: Rng,
): BattleState {
  if (state.winner !== null) return state;

  const actorA = activeCombatant(state, 0);
  const actorB = activeCombatant(state, 1);
  const order: Side[] = speedOf(actorA) >= speedOf(actorB) ? [0, 1] : [1, 0];

  for (const side of order) {
    if (state.winner !== null) break;
    const actor = side === 0 ? actorA : actorB;
    if (actor.hp <= 0) continue;

    if (actor.status === "paralyze" && rng() < 0.25) {
      state.log.push({ type: "status", side, status: "paralyze", amount: 0 });
      continue;
    }

    const targetSide = (1 - side) as Side;
    const defender = activeCombatant(state, targetSide);
    const move = moveById(side === 0 ? moveA : moveB);
    const variance = actor.creature.phenotype.ability === 12 ? 1 : 0.85 + rng() * 0.15;
    const hit = rng() * 100 < move.accuracy;
    const damage = hit ? calcDamage(actor, defender, move, variance) : 0;
    applyDamage(state, side, targetSide, move.id, damage);

    if (hit) {
      if (move.status && move.statusChance) {
        tryApplyStatus(state, targetSide, move.status, move.statusChance, rng);
      }
      if (actor.creature.phenotype.ability === 8 && move.category === "physical") {
        tryApplyStatus(state, targetSide, "poison", 10, rng);
      }
      if (defender.creature.phenotype.ability === 9 && move.category === "physical") {
        tryApplyStatus(state, side, "paralyze", 10, rng);
      }
    }
  }

  for (const side of [0, 1] as Side[]) {
    if (state.winner !== null) break;
    const c = activeCombatant(state, side);
    if (c.status === "poison") {
      const amount = Math.max(1, Math.floor(c.maxHp / 8));
      state.log.push({ type: "status", side, status: "poison", amount });
      applyHpChange(state, side, -amount);
    } else if (c.status === "burn") {
      const amount = Math.max(1, Math.floor(c.maxHp / 16));
      state.log.push({ type: "status", side, status: "burn", amount });
      applyHpChange(state, side, -amount);
    }
    const alive = activeCombatant(state, side);
    if (alive.creature.phenotype.ability === 11 && alive.hp > 0 && alive.hp < alive.maxHp) {
      applyHpChange(state, side, Math.floor(alive.maxHp / 20));
    }
  }

  state.turn += 1;
  return state;
}

function totalHp(state: BattleState, side: Side): number {
  return state.teams[side].combatants.reduce((sum, c) => sum + Math.max(0, c.hp), 0);
}

export function runBattle(
  state: BattleState,
  chooseMove: (combatant: Combatant, opponent: Combatant) => number = chooseBestMove,
  rng: Rng,
): BattleState {
  while (state.winner === null && state.turn < MAX_TURNS) {
    const a = activeCombatant(state, 0);
    const b = activeCombatant(state, 1);
    const moveA = chooseMove(a, b);
    const moveB = chooseMove(b, a);
    resolveTurn(state, moveA, moveB, rng);
  }

  if (state.winner === null) {
    state.winner = totalHp(state, 0) >= totalHp(state, 1) ? 0 : 1;
    state.log.push({ type: "win", side: state.winner });
  }

  return state;
}
