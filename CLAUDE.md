# Ironvow — project guide for Claude

Ironvow is a single-player fantasy RPG with a classic-MMO feel (quest givers, "!" markers, gear rarities, levelling, zones) where the **quests are the player's real daily habits**. Doing real things (walking, training, meditating, drinking water, skipping junk food) earns XP, gold, energy and stats. Energy is spent on adventures that give loot.

The owner builds this **only from an iPhone**, using Claude for all coding. Keep that in mind:
- The game must work well in iPhone Safari and as a Home Screen app (portrait, touch, safe areas, no hover-only UI).
- Explain anything the owner has to do in plain, step-by-step phone terms (GitHub in Safari, the Claude app).
- After a change, tell the owner what to try in the game to see it.
- The owner will keep expanding this for a long time. Leave no dead code, no unused exports, no "for later" scaffolding. If something is not used by the game today, do not add it.

## Where the game is heading (the owner's brief)

The current game is the first slice of a bigger design. Build toward it; do not invent the undecided parts.

- Core loops: killing mobs gives XP, money and loot. Crafting gives gear and consumables. Gathering gives crafting ingredients.
- The game exists to help the player keep real-life habits. A **premium currency can only be earned by completing real habits**, and is needed for best-in-slot crafts, item upgrades and other power or quality-of-life features.
- Single player now, real multiplayer possibly later. Until then multiplayer is simulated: leaderboard rankings, dungeon groups, trade offers from simulated players.
- **Architecture rule: game rules stay separate from the screens, so the rules can move to a server later.** See "How the code is organised".

**Not decided yet. Ask the owner before building any of these, and never fill them in silently:**
balance numbers for the bigger design (XP curves, prices, drop rates, stat values); how crafting and gathering work; how simulated players behave; the premium currency's name, icon, screen and rates; more item slots (boots, gloves) and their sprite rules; which items belong to item sets; hand-designed sprites for boss drops; an item inspect view (the design calls for 96px sprites there).

Today habits still pay XP, gold, energy and stats directly (the numbers below). Moving to "habits pay the premium currency" is a rules change the owner has to decide.

## Running, testing and publishing

- No build step, no npm, no frameworks. Plain HTML, CSS and JavaScript (ES modules).
- Hosted on GitHub Pages from the `main` branch root. Pushing to `main` publishes within a minute or two.
- To play locally: `python3 -m http.server` in the repo, open `http://localhost:8000`. (Modules do not load from a `file://` page.)
- **Before every push, run both:**
  - `node --test` — rules, saves, content and screen tests (about a second).
  - `node tools/smoke.js` — plays the real game in headless Chromium at iPhone sizes, fails on any error or sideways scrolling, and writes screenshots to `screenshots/` (ignored by git). **Look at the screenshots.**
- `sw.js` is network-first and always re-checks the game's own files with the server, so players get new versions on the next load while online and never a mix of old and new modules. Bump `CACHE` in `sw.js` only if the caching rules change.
- If the game fails to start or crashes, `js/boot-guard.js` puts the error text on screen with a Reload button, because the owner has no developer console. If the owner sends you that text, it is a stack trace.

## How the code is organised

Dependencies only point downward in this list. A file may import from layers below it, never above.

| Layer | Folder | What lives there | Must not |
|---|---|---|---|
| Screens | `js/ui/` | Drawing, taps, toasts, sound, pixel art | hold game rules or change the save by hand |
| Saves | `js/save/` | Save versions and upgrades, save codes, localStorage | touch the DOM (only `storage.js` touches localStorage) |
| Rules | `js/rules/` | Everything that decides what happens in the game | use the DOM, storage, timers, the clock or `Math.random` |
| Content | `js/content/` | Data: classes, items, zones, quests, balance numbers | contain logic |
| Library | `js/lib/pixel-items.js` | The item sprite generator from the design handoff | be edited (see "Item sprites") |

**Rules (`js/rules/`)**: every function takes the save (`hero`) first. Functions that change it return a list of events (`{ type: 'questCompleted', ... }`); an empty list means nothing happened. Dice are passed in (`venture(hero, zoneId, rng)`), and "today" is always `hero.day`, moved only by `rollDay(hero, calendarDay)`. This is what makes the rules testable and movable to a server. The screens decide how an event looks and sounds in `js/ui/feedback.js` (`REACTIONS`).

**Screens (`js/ui/`)**:
- `session.js` holds `session.hero` (the save) and `session.ui` (what the interface is doing; never saved). `commit(events)` saves and shows feedback.
- `app.js` redraws the whole page from `session` after every tap. Screens return HTML strings and never patch the DOM to show state.
- A tap on `data-a="name"` runs the action `name` with `data-v` as its value. Each screen file exports `render()` and its own `actions`. Two screens using the same action name is an error at startup.
- `data-enter="name"` on an input runs that action on Enter. `data-keep` (with an `id`) keeps typed text across redraws.
- `parts.js` has the shared pieces (`button`, `lockedButton`, `chip`, `money`, `blocks`, `itemRow`). `format.js` is text only (numbers, coins, units, dates).
- `art/` is all the pixel art: `pixel.js` (helpers), `icons.js` (small sprites), `items.js` (item sprites), `scenes.js` (zone scenes).

### Recipes

- **New item:** add it to `ITEMS` in `js/content/items.js` with a `look: [kind, seed]`, add its id to `SHIPPED.items` in `tests/content.test.js`. Kinds: `sword`, `axe`, `staff`, `helm`, `chest` (generator) and `bow`, `mace`, `club`, `coin`, `gem`, `fang`, `hourglass` (stand-ins). Try a few seeds and look at the screenshot.
- **New zone:** add it to `ZONES` (keep level order), give it a drop item, paint a scene in `js/ui/art/scenes.js`, add the id to `SHIPPED.zones`.
- **New quest:** add it to `QUESTS` in `js/content/quests.js` with an icon in `icons.js`, add the id to `SHIPPED.quests`. Goals, totals, the Hero tab's goal form and the Champion's Cache count pick it up on their own. A new unit also needs an entry in `UNITS` in `js/ui/format.js`.
- **New tab:** follow the note at the top of `js/ui/app.js`.
- **New rule or system:** write it in `js/rules/` returning events, add tests in `tests/rules.test.js`, add its feedback to `REACTIONS`, then build the screen. If it needs new save fields, see the next section.
- **Changing a number:** only in `js/content/balance.js` (or the content file), then update the tables below.

## Save data — never break a save

The player's hero is real progress built over months. Losing it is the worst possible bug.

- The save is one JSON object in localStorage under `ironvow-save-v1` (this key never changes). Its shape is `newHero()` in `js/rules/hero.js`.
- `v` inside the save is its version; `SAVE_VERSION` in `js/save/migrate.js` is the current one (**1**).
- **Adding a field with a simple default:** add it to `newHero()`. Old saves get it automatically (`fillDefaults`). No version bump.
- **Renaming, moving or changing the meaning of a field:** raise `SAVE_VERSION`, add the step to `MIGRATIONS` in `js/save/migrate.js`, and add a test in `tests/save.test.js` that feeds it an old save. The header of `migrate.js` spells this out.
- Never remove or reinterpret existing fields without a migration. Never reset progress as part of an update.
- Save codes (`IRONVOW1:` + base64 JSON) are how players back up and move heroes. Old codes must keep importing; `tests/save.test.js` holds a version 1 save and code to prove it.
- Item, zone, quest, class and slot **ids are stored in saves** — never rename or delete an id. Retire content by hiding it (`sold: false`, remove it from drops). `tests/content.test.js` fails if a shipped id disappears. The rules already cope with ids they do not know.
- A save that cannot be read (damaged, or from a newer version) is **never overwritten**: the game shows a recovery screen (`js/ui/screens/recover.js`). Whenever a save is replaced or deleted, the old text is first copied to `ironvow-save-prev`.
- A battle is settled and saved the moment Venture is tapped; the story on screen is a replay. Keep new timed sequences the same way: change the save first, animate after.

## Game design (current numbers)

**Core loop:** daily habit quests → XP, gold, energy, +1 stat → buy gear / venture into zones → stronger hero → harder zones.

**Daily quests** (reset at local midnight, `QUESTS` in `js/content/quests.js`):
| Quest | Habit | Default goal | Stat | XP | Gold |
|---|---|---|---|---|---|
| The Long Road | Steps | 10,000 | Agility | 60 | 35s |
| Trial of Strength | Exercise | 30 min | Strength | 70 | 40s |
| Stillness of Mind | Meditation | 10 min | Intellect | 50 | 30s |
| Waters of the Spring | Water | 2 L | Spirit | 40 | 25s |
| The Alchemist's Tonic | Vitamins (checkbox) | — | Stamina | 30 | 20s |
| Vow of the Clean Hearth | No junk food (checkbox) | — | Stamina | 60 | 30s |

- Checkbox quests set `doLabel` / `undoLabel` for their two buttons.
- Players enter values by hand (+chips or "Set total"); the browser cannot read Apple Health. Goals are editable on the Hero tab.
- Completing a quest: XP, gold, +1 energy (cap 10), +1 permanent trained stat. Un-completing reverses all of it.
- **Streaks:** consecutive days on the same quest give +10% rewards per day, up to +50%.
- **Champion's Cache:** all 6 quests in a day → +150 XP, 1 gold, +2 energy.
- Day history (quests done per day) is kept for 60 days; lifetime totals for steps, minutes, water.
- The quest day only moves forward: if the phone's clock jumps back, today's progress is kept.

**Units:** metric only (litres, millilitres, minutes, km if distance is added). Currency is copper; 100c = 1s, 100s = 1g.

**Levels:** XP to go from level L to L+1 is `100 × L^1.5`. Max level 60. A day of all quests (~460 XP with cache) gets a new hero to level 10 in about 3–4 weeks.

**Classes:** Warrior, Mage, Ranger, Priest. Each has base stats, per-level growth, and stat weights that turn stats into **battle power**. Stats = base + growth × (level − 1) + trained + gear.

**Gear:** 4 slots (weapon, head, chest, trinket). Rarities common → uncommon → rare → epic → legendary (no legendary items exist yet). Vendor sells shop items; zone bosses drop unique items (18% on a win, once each). Sell price is ¼ of value.

**Adventure:** 8 zones, level-gated. Each venture costs 1 energy. Win chance = `0.75 × power / zone power`, clamped 5–95%. Win: zone XP + random gold + drop roll. Loss: 25% XP.

## Look: chunky pixel art with a dusk palette

The approved reference is `docs/adventure-reference.html` (a fixed 390×844 mockup). Every screen follows it. Everything is drawn in code; there are no image files except the app icons.

**Rules for the whole UI**
- Hard edges only: no rounded corners, no blur, no gradients (the background dither is the one exception).
- No emoji. Every icon is a pixel sprite from `js/ui/art/icons.js`.
- Touch targets at least 44px. Body text contrast at least 4.5:1. Inputs use 16px text so iPhone Safari does not zoom.
- Nothing is drawn as a fake phone status bar.
- Colours and fonts are tokens on `:root` in `css/style.css`. Do not write literal colours below the token block.
- Original fantasy world. **Do not use names, logos, art, text or UI copied from World of Warcraft or any other real game.**
- Writing is short and plain. Flavour text can be playful, UI labels must be clear.

**Fonts (Google Fonts):** Press Start 2P for headings, zone names, numbers that matter, buttons and level tags (always uppercase; 18px screen title, 14px hero name, 12px card titles and the primary button, 9–10px tags and other buttons). Pixelify Sans 400/600 for everything else, 13–15px. Fallback for both: `'Courier New', monospace`.

**Colours:** background `#1A1630` with a 4px checker in `#1F1A3A`; panel `#2A2550`; raised chip `#3B3470`; outline and tab bar `#0D0B1A`; text `#F4EFD8` / body `#E6E0F5` / secondary `#D5CFF0`; accent `#FFCF4A` (lip `#B8862A`, text on it `#1A1630`); XP and energy `#4FE0C2`; positive values `#8CE06A`; danger `#FF7A59`.

**Components** (all in `css/style.css`)
- Pixel border: four hard `box-shadow`s (`--border`), which leaves notched corners. Never a CSS border with radius.
- Primary button: gold, 40px tall, 4px lip; one per card. Other actions are "plain" buttons (gold text on a raised face); destructive ones are "danger".
- A button that cannot be pressed is a **locked button that says what is needed** ("Reach level 3 to enter", "Need gold"), in reading type.
- Meters are ten separate blocks (`blocks()`), not a smooth bar.
- Zone scenes: 120×22 pixels at 4 CSS px per pixel, cropped from the centre so pixels stay square on every phone. Keep the subject between columns 20 and 100. Locked zones use the automatic night palette with a padlock; zones beyond the next locked one are a short strip with a name tag.

### Item sprites

- 32×32, shown at 64px in lists. `look: [kind, seed]` plus the item's rarity is everything needed to redraw one.
- `js/lib/pixel-items.js` is the generator from the design handoff, **saved exactly as delivered. Do not edit it.** It still contains the design tool's unused `renderVals` helpers; trimming them is the owner's call, since the file would then no longer match the design chat's copy. It also builds five legendary item sets (`PixelItems.setItem`), which the game does not use yet.
- Bows, maces, clubs and trinkets are **stand-ins** drawn in `js/ui/art/items.js` by the same rules, because the generator has no shapes for them. Replace them when the design settles those shapes.
- **Rarity owns everything around the item:** frame, backdrop, aura, sparkles and the name colour (`PixelItems.RARITY`, turned into `.rar-0 … .rar-4` at startup). **The item (or its set) owns the colours inside the sprite.** Never use a sprite's metal colour to signal rarity.
- Rarity must read without colour: item rows spell the rarity out. Distinct frame shapes per rarity, and the legendary corner marks, are designed but not built (no legendary items exist yet).

**Known rough spots from the design chat:** common axes read like clubs; the legendary staff's rays are cut off; scenes use 4px pixels while item sprites use 2px (the design asked for one size everywhere eventually); no loot-drop fanfare for high rarities yet.

## Roadmap ideas (owner decides the order)

From the brief: the premium habit currency, crafting, gathering, simulated players (leaderboards, groups, trades), item sets and upgrades. Also: talent trees, more quest types and custom quests, weekly boss raids, achievements and titles, mounts and pets, a story questline, reputation with factions, an item inspect view, sound settings, cloud save.

## Working agreement

- One system per session. Keep changes focused, run `node --test` and `node tools/smoke.js`, look at the screenshots, then push.
- Update this file when you add a system or change numbers, so the next session knows.
- Commit messages: short and descriptive, e.g. `Add talent tree (save v2)`.
