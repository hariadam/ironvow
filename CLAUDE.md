# Ironvow — project guide for Claude

Ironvow is a single-player fantasy RPG with a classic-MMO feel (quest givers, "!" markers, gear rarities, levelling, zones) where the **quests are the player's real daily habits**. Doing real things (walking, training, meditating, drinking water, skipping junk food) earns XP, gold, energy and stats. Energy is spent on adventures that give loot.

The owner builds this **only from an iPhone**, using Claude for all coding. Keep that in mind:
- The game must work well in iPhone Safari and as a Home Screen app (portrait, touch, safe areas, no hover-only UI).
- Explain anything the owner has to do in plain, step-by-step phone terms (GitHub in Safari, the Claude app).
- After a change, tell the owner what to try in the game to see it.

## Running and publishing

- No build step, no npm, no frameworks. Plain HTML, CSS and JavaScript.
- Hosted on GitHub Pages from the `main` branch root. Pushing to `main` publishes within a minute or two.
- To test locally: `python3 -m http.server` in the repo, open `http://localhost:8000`. Headless Chromium + Playwright is a good way to screenshot at 390×844 (iPhone size) before pushing.
- `sw.js` is network-first, so players get new versions on the next load while online. Bump `CACHE` in `sw.js` only if caching itself changes.

## Files

| File | What lives there |
|---|---|
| `index.html` | Page shell, meta tags for Home Screen app, loads scripts in order |
| `css/style.css` | All styles. Colours/fonts are tokens on `:root` |
| `js/data.js` | Game content: classes, items, zones, quests, constants |
| `js/util.js` | Formatting helpers (money, dates, XP curve), sound effects |
| `js/art.js` | All art, drawn as inline SVG in code: item icons, quest icons, class emblems, zone banners |
| `js/save.js` | `state`, `ui`, saving to localStorage, save versioning + migrations, export/import codes |
| `js/game.js` | Rules: stats, power, quest completion, rewards, chest, combat, vendor, toasts/level-up |
| `js/ui.js` | Rendering each tab as HTML strings + one delegated click handler (`data-a` actions) |
| `js/main.js` | Day rollover, boot, service worker registration |

Scripts are **classic scripts sharing top-level names** (not ES modules), loaded in the order in `index.html`. A top-level `const`/`let`/`function` in one file is visible in the files after it. Keep that order when adding files, and avoid name clashes.

Rendering is simple: `render()` rebuilds the whole screen from `state` + `ui`. Actions are buttons with `data-a="action"` (and `data-v` for a value) handled in the click `switch` in `ui.js`. Call `persist()` after any change to `state` (the switch does this unless `changed = false`).

## Save data — never break a save

The player's hero is real progress built over months. Losing it is the worst possible bug.

- `state` is one JSON object saved in localStorage under `ironvow-save-v1` (this key never changes).
- `state.v` is the save version; `SAVE_VERSION` in `save.js` is the current one.
- **When you add, rename or restructure fields:** bump `SAVE_VERSION` and add a step in `migrate()` that upgrades older saves. New fields with simple defaults are also filled automatically from `newHero()`, but renames and restructures need an explicit migration.
- Never remove or reinterpret existing fields without a migration. Never reset progress as part of an update.
- Save codes (`IRONVOW1:` + base64 JSON) are how players back up and move heroes. Old codes must keep importing.
- Item, zone and quest **ids are stored in saves** — never rename or delete an id. Retire content by hiding it instead.

## Game design (current numbers)

**Core loop:** daily habit quests → XP, gold, energy, +1 stat → buy gear / venture into zones → stronger hero → harder zones.

**Daily quests** (reset at local midnight, `QUESTS` in data.js):
| Quest | Habit | Default goal | Stat | XP | Gold |
|---|---|---|---|---|---|
| The Long Road | Steps | 10,000 | Agility | 60 | 35s |
| Trial of Strength | Exercise | 30 min | Strength | 70 | 40s |
| Stillness of Mind | Meditation | 10 min | Intellect | 50 | 30s |
| Waters of the Spring | Water | 2 L | Spirit | 40 | 25s |
| The Alchemist's Tonic | Vitamins (checkbox) | — | Stamina | 30 | 20s |
| Vow of the Clean Hearth | No junk food (checkbox) | — | Stamina | 60 | 30s |

- Checkbox quests can set `doLabel` / `undoLabel` for their buttons (default "Vow kept today" / "I broke the vow").
- Players enter values by hand (+chips or "Set total"); the browser cannot read Apple Health. Goals are editable on the Hero tab.
- Completing a quest: XP, gold, +1 energy (cap 10), +1 permanent trained stat. Un-completing reverses all of it.
- **Streaks:** consecutive days on the same quest give +10% rewards per day, up to +50%.
- **Champion's Cache:** all 6 quests in a day → +150 XP, 1 gold, +2 energy.
- Day history (quests done per day) is kept for 60 days; lifetime totals for steps, minutes, water.

**Units:** metric only (litres, millilitres, minutes, km if distance is added). Currency is copper; 100c = 1s, 100s = 1g.

**Levels:** XP to go from level L to L+1 is `100 × L^1.5`. Max level 60. A day of all quests (~460 XP with cache) gets a new hero to level 10 in about 3–4 weeks.

**Classes:** Warrior, Mage, Ranger, Priest. Each has base stats, per-level growth, and stat weights that turn stats into **battle power**. Stats = base + growth × (level − 1) + trained + gear.

**Gear:** 4 slots (weapon, head, chest, trinket). Rarities poor (grey) → common (white) → uncommon (green) → rare (blue) → epic (purple). Vendor sells shop items; zone bosses drop unique items (18% on a win, once each). Sell price is ¼ of value.

**Adventure:** 8 zones, level-gated. Each venture costs 1 energy. Win chance = `0.75 × power / zone power`, clamped 5–95%. Win: zone XP + random gold + drop roll. Loss: 25% XP.

## Style and tone

- Original fantasy world with a classic-MMO vibe. **Do not use names, logos, art, text or UI copied from World of Warcraft or any other real game.** Invent names in the same spirit.
- Dark torchlit stone and gold trim, Cinzel display font, Alegreya Sans body. Single dark theme on purpose.
- Rarity colours are part of the language; keep them consistent.
- Art is vector SVG drawn in `art.js` (no image files yet). New items need an icon entry in `ICONS`. Image files in an `img/` folder are fine later if the owner generates art.
- Writing is short and plain. Flavour text can be playful, UI labels must be clear.

## Roadmap ideas (owner decides the order)

Talent trees, more quest types and custom quests, weekly boss raids, achievements and titles, professions/crafting with materials from adventures, mounts and pets, a story questline, reputation with factions, a character paper-doll, better combat log, sound/music settings, cloud save.

## Working agreement

- One system per session. Keep changes focused, test on a phone-sized screenshot, then push.
- Update this file when you add a system or change numbers, so the next session knows.
- Commit messages: short and descriptive, e.g. `Add talent tree (save v2)`.
