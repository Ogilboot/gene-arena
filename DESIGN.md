# Design Doc — "Gene Arena" *(working title)*

A free-to-play browser game where you breed procedurally-unique creatures, battle
them in 3v3 turn-based combat, and trade them on a player-driven marketplace.

## 1. Elevator Pitch
Depth-first collectible game aimed at competitive adults. Breed genetically unique
creatures, battle in 3v3 turn-based combat, and trade them on a player-driven
marketplace. Monetized through cosmetics, convenience, and a small cut of every trade.

## 2. Decisions
| Decision | Choice |
|---|---|
| Theme | Generic fantasy creatures (placeholder) |
| Platform | Web browser first |
| Audience | Competitive adults |
| Monetization | F2P + IAP + 5–10% marketplace fee |
| Battle format | 3v3 team battles |
| Unique visuals | Procedural / parts-based (genome-driven) |

## 3. Core Game Loop
```
Onboard (free starter) → Breed selectively → Train (PvE) →
Compete (ranked PvP) → Trade on marketplace → repeat
```
Core principle: **genes are inheritable; training (levels/EVs) is not.** This makes
breeding endlessly deep and grounds trade value in function.

## 4. The Creature & Genetics Model
**Genome:** 32 genes, each `0–15`.

| Genes (index) | Trait | Mapping |
|---|---|---|
| 0–1 | Elemental type (primary/secondary) | value → type |
| 2–7 | Base stats (HP, ATK, DEF, SpA, SpD, SPD) | `base = 30 + value × 5` |
| 8 | Passive ability | value → ability |
| 9–11 | Egg moves (inheritable) | value → move |
| 12–23 | Appearance (body, head, pattern, color, eyes…) | drives procedural art |
| 24 | Shiny potential (reserved) | cosmetic |
| 25–31 | Lineage / species / reserved | identity + future |

## 5. Breeding System
Per gene slot, child inherits:
- **45%** parent A, **45%** parent B, **10%** mutation (random 0–15).

Modifiers:
- **Dominance:** type genes (0–1) pass the higher value — achievable breeding goals.
- **Discovery mutations (~1/256):** a slot unlocks a brand-new trait — the chase moment.

**Shiny:** rolled at birth (1/256; boosted to 1/64 if a parent is shiny).

**Rarity (IV sum of 6 stat genes, max 90):**
```
0–44 Common · 45–59 Uncommon · 60–74 Rare · 75–89 Epic · 90 Legendary
```

## 6. Battle System (3v3, turn-based)
- 10 types: Fire, Water, Grass, Electric, Rock, Ice, Wind, Ground, Light, Dark.
- Type effectiveness: 0.5× / 1× / 2×.
- Stats: HP, ATK, DEF, SpA, SpD, SPD. Effective stat ≈ `floor(base × level / 50) + 5`.
- Moves: learnable (level-up) vs egg moves (from genes — the tradable ones).
- Damage:
```
damage = floor( ((2×level/5 + 2) × power × (ATK/DEF)) / 50 + 2 )
        × STAB × type_effectiveness × random(0.85–1.0)
```
- STAB = 1.5× if move type matches the creature's type.
- Abilities: passive effects.

## 7. Progression & Meta
- PvE campaign ("gyms") + daily training battles.
- Ranked PvP with seasonal ladders.
- Seasonal balance patches shift the meta → demand for new breeds.

## 8. Marketplace & Economy
- Player listings with ask/bid order book.
- Soft currency ("Coins", earned) + hard currency ("Gems", purchased).
- 5–10% marketplace fee on every sale.
- Value drivers: rarity tier, stat spread, egg moves/abilities, shiny, lineage.

## 9. Monetization (target: £12k/yr ≈ ~1,000 payers)
1. Marketplace fee. 2. Cosmetic IAP. 3. Convenience IAP (cooldown skips, slots).
4. Seasonal battle pass.

## 10. Procedural Art System
- Creatures assembled from layered parts (body, head, limbs, pattern, palette, eyes).
- Parts hand-authored, combined procedurally; appearance genes drive the look.
- Shiny = rare palette/fx override.

## 11. Technical Architecture (browser)
- Frontend: React + TypeScript + PixiJS (2D, GPU-accelerated).
- Backend: Node.js + PostgreSQL (creatures are data, not contracts).
- Real-time battles: WebSockets.
- Auth: email/Google OAuth, custodial accounts.
- Hybrid-ready: creatures can later be optionally minted as NFTs without a rebuild.

## 12. MVP Scope & Roadmap
- **MVP (months 1–3):** genome + breeding engine, 3v3 battle engine, ranch UI
  (procedural art v1), marketplace, auth + currencies + IAP.
- **v2 (months 4–6):** PvE campaign, ranked PvP, battle pass.
- **v3 (6+):** polish, balance seasons, community features.
- **Optional later:** creature mint/export layer.

## 13. Success Metrics
- D7 retention > 20%, D30 > 8%.
- % players who breed ≥ 1 time > 40%.
- Marketplace volume/month + fee revenue.
- Ranked PvP queue health (match < 60s).

## 14. Key Risks
1. Distribution (finding ~1,000 engaged players is harder than building it).
2. Economy balance (inflation / dead marketplace).
3. Meta stagnation (without patches, trade demand dies).
4. Art pipeline (procedural parts must look good enough to want).
