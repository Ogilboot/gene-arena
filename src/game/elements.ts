export const ELEMENTS = [
  "fire",
  "water",
  "grass",
  "electric",
  "rock",
  "ice",
  "wind",
  "ground",
  "light",
  "dark",
] as const;

export type Element = (typeof ELEMENTS)[number];

export function elementFromGene(gene: number): Element {
  return ELEMENTS[gene % ELEMENTS.length]!;
}

export const TYPE_CHART: Record<Element, Partial<Record<Element, number>>> = {
  fire: { grass: 2, ice: 2, fire: 0.5, water: 0.5, rock: 0.5 },
  water: { fire: 2, rock: 2, ground: 2, water: 0.5, grass: 0.5, electric: 0.5 },
  grass: { water: 2, ground: 2, rock: 2, grass: 0.5, fire: 0.5, ice: 0.5, wind: 0.5 },
  electric: { water: 2, wind: 2, electric: 0.5, grass: 0.5, ground: 0.5 },
  rock: { fire: 2, ice: 2, wind: 2, rock: 0.5, water: 0.5, grass: 0.5, ground: 0.5 },
  ice: { grass: 2, ground: 2, wind: 2, ice: 0.5, fire: 0.5, water: 0.5, rock: 0.5 },
  wind: { grass: 2, light: 2, wind: 0.5, electric: 0.5, rock: 0.5, ice: 0.5 },
  ground: { fire: 2, electric: 2, rock: 2, ground: 0.5, water: 0.5, grass: 0.5, ice: 0.5 },
  light: { dark: 2, ground: 2, light: 0.5, rock: 0.5, wind: 0.5 },
  dark: { light: 2, electric: 2, dark: 0.5, fire: 0.5, ground: 0.5 },
};

export function typeEffectiveness(attack: Element, defend: Element): number {
  return TYPE_CHART[attack][defend] ?? 1;
}
