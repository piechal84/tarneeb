# Kelka Frontlines

A browser real-time strategy game set in the Grow a Garden universe. Grow crops, hatch and merge Kelka companions, and send them to destroy the rival garden's Heart before yours falls.

The crop grow times, sell values, weather mutations, day/night cycle, companion abilities, and the Merge Rite are all taken from the Kelka Almanac. Combat (unit HP/attack, the Garden Heart, attack-move, the AI's assaults) is new — the Almanac has no military layer, so this is a "what if" take on that world rather than a strict simulation of it.

## Running locally

```bash
npm install
npm run dev
```

Then open the printed local URL in your browser.

## How to play

- **Power**: every building draws power just by existing — even your Construction Yard — and only a Power Plant generates any. That makes it the first thing you have to build: at kickoff you're already running a deficit, and no other building (the Incubator included) can be *started* until a Power Plant brings you back into the black. Once you're up and running, a deficit doesn't block anything outright — it just makes hatching, research, construction, and repair run **three times slower** until you fix it. Watch the ⚡ chip.
- **Research**: open the Build tab and spend coins to climb Tech Tiers 1→4 at your Construction Yard. Higher-rarity crops and companions are locked until you research your way up — the Solar Grove itself doesn't unlock until Tier 3.
- **Build**: still in the Build tab, pick a Power Plant or Kelka Egg Incubator (up to 2), then click an empty tile near your Construction Yard to place it. It fills in over its build time.
- **Plant**: pick a crop in the left panel (this costs a seed price up front, on top of its grow time) then click one of your empty plots (bottom of the map) that matches its grove (Field / Lunar / Solar) and tech tier. Locked entries show a 🔒 and the tier they need. You can't fill your whole garden at once — running out of coins means waiting for income before you can plant more. The crop stays selected after each planting so you can click through several plots in a row — right-click (or pick something else) to cancel it.
- **Income**: there's no harvest step — once a plot's border turns gold it's matured and starts paying coins (or diamonds for Solar Grove crops) into your treasury automatically, every second, for as long as it stays planted. The small "+X/s" label under a mature plot shows its live rate. Clicking a mature plot with a different crop selected replaces it (paying that crop's seed price) if you want to upgrade it later.
- **Hatch**: pick a companion in the Hatch tab, then click one of your Incubators to start hatching it.
- **Repair**: click one of your own buildings to select it — a damaged one shows a Repair button in the right panel. Repairing drains coins per HP restored (rate throttled the same way as everything else under a power deficit) and switches off automatically once full or unaffordable.
- **Merge**: drag-select exactly 4 identical, un-merged companions and click "Merge" in the right panel to fuse them into their next tier (Empowered ×2.5, Tenacious ×5 stats).
- **Move / Attack**: drag-select your companions, then right-click open ground to move, or right-click an enemy unit or building to attack it. Right-click also cancels whatever's currently selected/pending (a crop, a companion to hatch, a building to place, a repair panel) if there's nothing to move.
- **Haste**: spend Kelka Crystals (earned automatically over time, standing in for completed quests) to instantly finish a growing crop.
- **Difficulty**: Easy / Medium / Hard buttons in the top bar restart the match with a slower- or faster-acting AI.
- **Win condition**: destroy the AI's Garden Heart (top of the map) before it destroys yours.

## What's implemented (v1 / MVP)

- Real-time day/night cycle (4 min day at 2x growth, 1 min night) and independent temperature/sky weather rolls every 90s that can lock in a value-boosting income multiplier on a crop for as long as it stays planted.
- Passive-income economy across all three growing grounds (Fields, Lunar Grove, Solar Grove): planting costs a seed price, then a matured plot pays out coins/diamonds automatically every second — no harvest click, and no way to fund a whole garden faster than your coins allow. Rates track each crop's Almanac value divided by its grow time (same total value, delivered smoothly), except the Solar Grove's raw numbers — tuned for an idle mobile game measured in hours — are hand-capped so its best crop tops out at a reasonable multiple of the Lunar Grove instead of printing infinite money in seconds.
- A 4-tier tech tree: crops are gated by their grove's unlock tier *and* their position on that grove's own rarity ladder (a grove's "Common" crop isn't a global power level — Solar Grove's is worth more than Field's endgame); companions are gated by the shared rarity ladder in pairs. Both the player and the AI have to climb it — nothing is available at Tier 1 except Field crops and Chick/Bunny.
- Kelka Construction Yard (starting building, draws power but generates none) + Kelka Power Plant (the only generator, and effectively mandatory since the Yard's own draw starts every match at a deficit). A deficit throttles hatching, research, construction, and repair to a third speed rather than blocking them outright — except starting a *new* building, which is hard-blocked until you're back in the black (a Power Plant is always buildable regardless, so there's always a way out).
- All 8 companions with their documented passive abilities (scaled by merge tier) plus new combat stats. Fox's Almanac ability ("Auto-harvests 1 ready crop/min") no longer has anything to harvest, so it's adapted into a flat Income bonus instead.
- The Merge Rite (4 → 1, twice).
- Kelka Egg Incubator (now player-constructed, up to 2) and Garden Heart (win condition) buildings. Any building can be repaired for coins once damaged.
- A scripted AI opponent that climbs the same tech/power/construction ladder as the player, farms, hatches, and merges one plot/unit at a time rather than in bursts (paced by difficulty, same as a human would), and launches attack waves — tuned by an Easy/Medium/Hard difficulty preset (decision pacing, mistake chance, and aggression).
- The Watering Can tool (5 levels, cuts grow time). Fertilizer Bag, Garden Expansion, Reclaimer, and Trowel are stubbed in the Tools tab for a future update.

## Possible next steps

- Contested Grove tiles in the neutral middle strip instead of each side owning a fixed cluster.
- The Kitsune Shrine and the three Historic-tier Kitsune fusions as a late-game power spike (Tier 4+).
- Finish the remaining Kelka tools (Fertilizer Bag, Garden Expansion, Reclaimer, Trowel).
- Smarter AI (reacting to the player's army composition, retreating instead of always suiciding into the Heart, defending its own base while it's under attack).
- Sound effects for combat, construction, and research — currently only plant/harvest/hatch/merge have SFX.
