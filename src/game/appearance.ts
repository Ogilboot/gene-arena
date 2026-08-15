import type { Element } from "./elements.js";
import { GENE } from "./genetics.js";
import type { Creature } from "./types.js";

export type Pattern = "none" | "spots" | "stripes";
export type EarType = "none" | "round" | "pointed" | "horns" | "antennae";

export interface CreatureAppearance {
  bodyColor: string;
  bodyDark: string;
  accent: string;
  eyeColor: string;
  bodyW: number;
  bodyH: number;
  pattern: Pattern;
  earType: EarType;
  eyeType: number;
  legCount: number;
  tailType: number;
  shiny: boolean;
}

const ELEMENT_HUES: Record<Element, number> = {
  fire: 14,
  water: 210,
  grass: 125,
  electric: 52,
  rock: 28,
  ice: 190,
  wind: 175,
  ground: 24,
  light: 48,
  dark: 268,
};

const EAR_TYPES: EarType[] = ["none", "round", "pointed", "horns", "antennae"];

const GOLD = "#f5c542";

function hue(h: number): number {
  return ((h % 360) + 360) % 360;
}

function hsl(h: number, s: number, l: number): string {
  return `hsl(${hue(h)}, ${Math.round(s * 100)}%, ${Math.round(l * 100)}%)`;
}

export function computeAppearance(c: Creature): CreatureAppearance {
  const g = c.genome;
  const [primary] = c.phenotype.elements;
  const a = GENE.APPEARANCE_START;

  const baseHue = ELEMENT_HUES[primary] ?? 0;
  const hueOffset = ((g[a + 2] ?? 0) - 7) * 10;
  const bodyHue = c.shiny ? 45 : baseHue + hueOffset;
  const sat = 0.5 + (g[a + 3] ?? 0) * 0.028;
  const accentHue = bodyHue + ((g[a + 5] ?? 0) - 7) * 14;
  const eyeHue = ((g[a + 8] ?? 0) - 7) * 12;

  const patternGene = g[a + 4] ?? 0;
  const pattern: Pattern = patternGene < 5 ? "none" : patternGene < 11 ? "spots" : "stripes";
  const earType = EAR_TYPES[(g[a + 6] ?? 0) % EAR_TYPES.length]!;

  return {
    bodyColor: hsl(bodyHue, sat, 0.62),
    bodyDark: hsl(bodyHue, sat, 0.44),
    accent: c.shiny ? GOLD : hsl(accentHue, sat, 0.55),
    eyeColor: c.shiny ? GOLD : hsl(eyeHue, 0.7, 0.35),
    bodyW: 0.8 + (g[a + 0] ?? 0) * 0.02,
    bodyH: 0.7 + (g[a + 1] ?? 0) * 0.025,
    pattern,
    earType,
    eyeType: (g[a + 7] ?? 0) % 3,
    legCount: 2 + ((g[a + 9] ?? 0) % 3),
    tailType: (g[a + 10] ?? 0) % 4,
    shiny: c.shiny,
  };
}
