# Ironvow — project guide for Claude

Ironvow is a single-player fantasy RPG with a classic-MMO feel (quest givers, "!" markers, gear rarities, levelling, zones) where the **quests are the player's real daily habits**. Doing real things (walking, training, meditating, drinking water, skipping junk food) earns XP, gold, energy and stats. Real steps are spent walking a large world map; energy is spent fighting the mobs and dungeon bosses found there.

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
balance numbers for the bigger design (XP curves, prices, drop rates, stat values; the owner has said Claude may propose numbers, but they are still shown to the owner first); how crafting and gathering work; how simulated players behave; the premium currency's name, icon, screen and rates; more item slots (boots, gloves) and their sprite rules; which items belong to item sets; hand-designed sprites for boss drops; an item inspect view (the design calls for 96px sprites there).

Today habits still pay XP, gold, energy and stats directly (the numbers below). Moving to "habits pay the premium currency" is a rules change the owner has to decide.

### The world map plan (agreed with the owner, November 2026)

The Adventure tab is one large, procedurally generated world: the further from town, the higher the mob level. Built in steps, one per session:

1. **Done:** the map, fog that stays cleared, walking paid for with real steps, wild mobs visible inside the hero's view, the 8 old zones as dungeons.
2. HP combat. The owner wants **energy removed**: fights are free and cost HP, which comes back by waiting, eating or stats. Dying sends a ghost to the nearest graveyard, and the player walks back to the corpse (costing steps) to revive.
3. Loot tables: a mob rolls on a table for its level instead of one mob dropping one fixed item, with generated gear. This changes the save format (items become records, not ids).
4. Chests (guarded or not, with rarities that rise with the area's level, holding gear, materials, recipes, consumables) and rare elites (much stronger, always drop rare or better).
5. More dungeons placed by the same rules: common ones once per eighth of the world, special ones once per world with hints.
6. Generated towns with vendors and bounties. ("Quests" already means habits.)
7. Stats bought with habit points: view distance (20 up to 100 tiles), movement speed (fewer steps per tile, capped at about double), and combat stats.

Decided: one shared world (one seed); a tile is 10 steps; things on the map are rare. `docs/map-reference.html` is the approved mock, and holds the approved sprites and spawn numbers for chests, elites, graveyards and towns.
Respawn design: terrain, towns, graveyards and dungeons never change; mobs are rolled per day; chests are to be rolled per week and elites per day, with the save remembering only what was taken in the current period.

**Still open. Ask the owner these before building step 2** (asked in November 2026, not answered yet; Claude's recommendation in brackets):
1. **Graveyard revive:** may a dead hero also revive at the graveyard for a penalty, such as low HP, so a player who is out of steps is never locked out? [yes]
2. **Fights:** do they keep playing out on their own, or does the player pick abilities each round? [automatic first, abilities later]
3. **HP coming back:** slowly over real time, by eating food, by resting in a town, or a mix? [all three]
4. **What habits pay** once the habit currency exists (only the currency, or the currency plus today's XP, gold and +1 stat), and the currency's name and icon. [no recommendation: the owner's call]

Also for later steps: what a dungeon is (one boss fight, or a chain of fights), how hints to special dungeons work (a rumour in town, or a map item), and whether loot is generated or hand-made.

Ideas Claude raised that the owner has not answered yet: give mobs below the hero's level little XP, so progress means walking further out; tie resistances to biomes (frost in snow, poison in swamp); other stats to buy: HP regen, bag space, chest luck, a cheaper ghost run.

## Running, testing and publishing

- No build step, no npm, no frameworks. Plain HTML, CSS and JavaScript (ES modules).
- Hosted on GitHub Pages from the `main` branch root. Pushing to `main` publishes within a minute or two.
- To play locally: `python3 -m http.server` in the repo, open `http://localhost:8000`. (Modules do not load from a `file://` page.)
- **Before every push, run both:**
  - `node --test` — rules, saves, content and screen tests (about a second).
  - `node tools/smoke.js` — plays the real game in headless Chromium at iPhone sizes (creates a hero, does quests, walks the map to a mob and fights it), fails on any error or sideways scrolling, and writes screenshots to `screenshots/` (ignored by git). **Look at the screenshots.**
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

**Rules (`js/rules/`)**: every function takes the save (`hero`) first. Functions that change it return a list of events (`{ type: 'questCompleted', ... }`); an empty list means nothing happened. Dice are passed in (`fight(hero, rng)`), and "today" is always `hero.day`, moved only by `rollDay(hero, calendarDay)`. This is what makes the rules testable and movable to a server. The screens decide how an event looks and sounds in `js/ui/feedback.js` (`REACTIONS`).
- `world.js` is the one rules file whose functions take no hero: the world is the same for everyone and is worked out from `WORLD.seed`, never stored. `travel.js` is what a hero has done in it (position, steps walked, land uncovered); `adventure.js` is foes and fights.

**Screens (`js/ui/`)**:
- `session.js` holds `session.hero` (the save) and `session.ui` (what the interface is doing; never saved). `commit(events)` saves and shows feedback.
- `app.js` redraws the whole page from `session` after every tap. Screens return HTML strings and never patch the DOM to show state.
- **The one exception is the world map**, a `<canvas>` painted by `js/ui/map.js`. A tab may export `afterDraw()`, which `app.js` runs after every redraw; the Adventure tab uses it to call `mountMap()`, which paints the new canvas from `session`. Only dragging, pinching and the playback of a walk draw without a page redraw. What the map shows (camera, picked tile, route, walk being played) is `session.ui.map`.
- A tap on `data-a="name"` runs the action `name` with `data-v` as its value. Each screen file exports `render()` and its own `actions`. Two screens using the same action name is an error at startup.
- `data-enter="name"` on an input runs that action on Enter. `data-keep` (with an `id`) keeps typed text across redraws.
- `parts.js` has the shared pieces (`button`, `lockedButton`, `chip`, `money`, `blocks`, `itemRow`). `format.js` is text only (numbers, coins, units, dates).
- `art/` is all the pixel art: `pixel.js` (helpers), `icons.js` (small sprites), `items.js` (item sprites), `scenes.js` (dungeon scenes), `tiles.js` (8×8 map tiles, marks and mobs).

### Recipes

- **New item:** add it to `ITEMS` in `js/content/items.js` with a `look: [kind, seed]`, add its id to `SHIPPED.items` in `tests/content.test.js`. Kinds: `sword`, `axe`, `staff`, `helm`, `chest` (generator) and `bow`, `mace`, `club`, `coin`, `gem`, `fang`, `hourglass` (stand-ins). Try a few seeds and look at the screenshot.
- **New dungeon:** a dungeon is a zone. Add it to `ZONES` (keep level order), give it a drop item, paint a scene in `js/ui/art/scenes.js`, add the id to `SHIPPED.zones`. The world places it by its position in the list (`WORLD.dungeonSlices`); a ninth zone would share an eighth of the world with the first. Add its coordinates to the pinned list in `tests/rules.test.js`. Wild mobs take their strength and rewards from `ZONES` by level, so a new zone also changes mobs between its neighbours' levels.
- **New wild mob:** add it to `MOBS` in `js/content/mobs.js` with the biome it lives in, and an 8×8 sprite under the same id in `MOB_ART` (`js/ui/art/tiles.js`).
- **New kind of land:** add it to the END of `BIOMES` in `js/content/world.js` (positions are what the generator stores), a tile in `TERRAIN_ART`, and the rule that produces it in `biomeNumber` (`js/rules/world.js`). This reshapes the world: see the warning below.
- **New quest:** add it to `QUESTS` in `js/content/quests.js` with an icon in `icons.js`, add the id to `SHIPPED.quests`. Goals, totals, the Hero tab's goal form and the Champion's Cache count pick it up on their own. A new unit also needs an entry in `UNITS` in `js/ui/format.js`.
- **New tab:** follow the note at the top of `js/ui/app.js`.
- **New rule or system:** write it in `js/rules/` returning events, add tests in `tests/rules.test.js`, add its feedback to `REACTIONS`, then build the screen. If it needs new save fields, see the next section.
- **Changing a number:** only in `js/content/balance.js` (or the content file), then update the tables below.
- **The world must not move under the player.** `WORLD.seed`, the `TERRAIN` numbers, `tilesPerLevel`, `levelWobble`, the dungeon numbers, the mixing in `roll()` and the order of `BIOMES` decide where everything is. Changing any of them changes land players have already explored. `tests/rules.test.js` pins a sample of the world and fails if it moves; only the owner decides to reshape the world.

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
- A fight is settled and saved the moment Fight or Venture is tapped; the story on screen is a replay. A walk is settled and saved the moment Walk is tapped; the hero moving across the map is a replay. Keep new timed sequences the same way: change the save first, animate after.
- **The world map in the save** is `hero.map`: `x`, `y` (the hero's tile), `walked` (steps spent), `trail` and `slain` (the tiles whose mob was beaten on `slain.day`). The fog of war is not saved. It is rebuilt from `trail`: the walks that uncovered new land, as legs of `[start x, start y, moves]` with three moves packed per character (`js/rules/travel.js`). This keeps saves and save codes small. Never change how a trail is read, the size of the view it is replayed with (`WORLD.view`), or the shape of the view patch, without a migration: old trails would uncover different land. When view distance becomes a stat, each leg will need to carry the view it was walked with (a save version bump).

## Game design (current numbers)

**Core loop:** daily habit quests → XP, gold, energy, +1 stat, and steps to walk → explore the map, fight mobs and dungeon bosses, buy gear → stronger hero → travel further out to harder land.

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

**The world** (`js/content/world.js`, generated by `js/rules/world.js`): one seeded world, the same for every player, with town (Hearthford) at its centre. Six kinds of land: meadow, forest, hills and swamp can be walked; deep water and mountain peaks cannot and must be walked around. Mob level rises by 1 every 50 tiles (500 steps) from town, give or take 2, up to 60 at about 3,000 tiles (30,000 steps).

**Walking:** a tile costs 10 real steps. Steps to walk = 1,000 to start + every step ever logged on The Long Road − steps already walked. (Taking logged steps back takes the travel back.) The hero sees 20 tiles in every direction; land once seen stays uncovered for good. A walk goes only over uncovered land, by the shortest way.

**Wild mobs** (`js/content/mobs.js`): 8 kinds, two per walkable biome. Each day every tile of wild land has a 0.6% chance of holding one (about 6 in view at a time; none within 4 tiles of town). They are visible only inside the hero's view and move every night. A mob's level is its tile's level; it is as strong and pays as much as a zone of that level (numbers slide between the zones in `ZONES`, and keep climbing past the last). A hero can fight mobs up to 2 levels above their own. A beaten mob is gone until the next day. Mobs drop no items yet.

**Dungeons:** the 8 zones in `ZONES`, each on one tile of the map, in its own eighth of the world, at the ring where mobs are its level (the first is about 400 steps from town, the last about 14,700). The boss can be fought again and again, by a hero of the zone's level or higher. The Adventure tab lists them: found ones with distance and direction from the hero, the ones the hero is ready for (and the next) as a rumour from town, the rest by name only.

**Fights:** the hero fights the foe on the tile they stand on. Each fight costs 1 energy. Win chance = `0.75 × power / the foe's power`, clamped 5–95%. Win: the foe's XP + random gold + (bosses only) an 18% roll for the zone's unique item, once each. Loss: 25% XP.

**Gear:** 4 slots (weapon, head, chest, trinket). Rarities common → uncommon → rare → epic → legendary (no legendary items exist yet). Vendor sells shop items; dungeon bosses drop unique items. Sell price is ¼ of value.

## Look: chunky pixel art with a dusk palette

The approved reference is `docs/adventure-reference.html` (a fixed 390×844 mockup). Every screen follows it. The world map follows `docs/map-reference.html`, the mock the owner approved. Everything is drawn in code; there are no image files except the app icons.

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
- Dungeon scenes: 120×22 pixels at 4 CSS px per pixel, cropped from the centre so pixels stay square on every phone. Keep the subject between columns 20 and 100. A dungeon above the hero's level uses the automatic night palette with a padlock.

### The world map

- Tiles, marks, mobs and the hero are 8×8 sprites (`js/ui/art/tiles.js`). Each kind of land has two variants, flipped at random per tile.
- The map opens at 1 CSS px per sprite pixel (8px tiles), which fits the hero's whole view in the 328px-tall map. Zoom levels run from 8 down to 1/128. From 1 up, every tile is a sprite; below 1 the land is flat colour (each biome's `base`), like a paper map, and at the far end the whole world fits on the phone.
- Marks, mobs and the hero are never drawn smaller than 16px. When tiles are smaller than that, a tap near a mark picks the mark. Mobs are hidden once a tile is under 2px.
- Fog is the dark checker. Uncovered land outside the hero's view is 30% darker than the patch they can see now.
- One finger drags, two pinch, a tap picks a tile (its card shows under the map), a second tap on it walks there. FULL makes the map fill the phone, with the steps on top and the card at the bottom.

### Item sprites

- 32×32, shown at 64px in lists. `look: [kind, seed]` plus the item's rarity is everything needed to redraw one.
- `js/lib/pixel-items.js` is the generator from the design handoff, **saved exactly as delivered. Do not edit it.** It still contains the design tool's unused `renderVals` helpers; trimming them is the owner's call, since the file would then no longer match the design chat's copy. It also builds five legendary item sets (`PixelItems.setItem`), which the game does not use yet.
- Bows, maces, clubs and trinkets are **stand-ins** drawn in `js/ui/art/items.js` by the same rules, because the generator has no shapes for them. Replace them when the design settles those shapes.
- **Rarity owns everything around the item:** frame, backdrop, aura, sparkles and the name colour (`PixelItems.RARITY`, turned into `.rar-0 … .rar-4` at startup). **The item (or its set) owns the colours inside the sprite.** Never use a sprite's metal colour to signal rarity.
- Rarity must read without colour: item rows spell the rarity out. Distinct frame shapes per rarity, and the legendary corner marks, are designed but not built (no legendary items exist yet).

**Known rough spots from the design chat:** common axes read like clubs; the legendary staff's rays are cut off; scenes use 4px pixels while item sprites use 2px (the design asked for one size everywhere eventually); no loot-drop fanfare for high rarities yet.

**Known rough spots of the world map:** the map's four buttons cover its top right corner (drag the map to reach what is under them); the map cannot be used from a keyboard; a wild mob pays exactly what a dungeon boss of its level pays; a hero who logged many steps before the map existed starts with all of them to walk; the camera's zoom is forgotten when the game is closed.

## Roadmap ideas (owner decides the order)

First, the rest of the world map plan above (HP combat, loot tables, chests and elites, towns, bought stats). From the brief: the premium habit currency, crafting, gathering, simulated players (leaderboards, groups, trades), item sets and upgrades. Also: talent trees, more quest types and custom quests, weekly boss raids, achievements and titles, mounts and pets, a story questline, reputation with factions, an item inspect view, sound settings, cloud save.

## Working agreement

- One system per session. Keep changes focused, run `node --test` and `node tools/smoke.js`, look at the screenshots, then push.
- Update this file when you add a system or change numbers, so the next session knows.
- Commit messages: short and descriptive, e.g. `Add talent tree (save v2)`.
