// Dungeons, easiest first. Each stands on one tile of the world map (rules/world.js places them) and holds
// a boss that can be fought again and again. Zone ids are stored in saves: never rename or delete one.
// level: hero level needed to enter. power: battle power the zone is balanced for.
// copper: [least, most] won per victory. drop: the item id the boss can drop.
// scene: the pixel scene drawn for the zone, a name in ui/art/scenes.js.
// Wild mobs take their numbers from this list too: a mob of level L is as strong and pays as much as a
// zone of level L would (rules/adventure.js), so keep the levels in order and the numbers rising.

export const ZONES = [
  { id: 'z1', name: 'Wolfpine Hollow', level: 1, power: 15, xp: 30, copper: [800, 2000], foe: 'A pack of mangy wolves', arrive: 'circles out of the pines', drop: 'd1', scene: 'wolfpine' },
  { id: 'z2', name: 'Old Mill Cellars', level: 3, power: 40, xp: 60, copper: [1500, 3500], foe: 'A swarm of giant rats', arrive: 'pours out of the grain sacks', drop: 'd2', scene: 'mill' },
  { id: 'z3', name: 'Gloomfen Marsh', level: 6, power: 75, xp: 100, copper: [3000, 6000], foe: 'The Bog Witch', arrive: 'rises from the black water', drop: 'd3', scene: 'marsh' },
  { id: 'z4', name: 'Bandit Ridge', level: 10, power: 120, xp: 160, copper: [5000, 10000], foe: 'Redscar and his bandits', arrive: 'block the mountain road', drop: 'd4', scene: 'ridge' },
  { id: 'z5', name: 'Sunken Crypt', level: 14, power: 180, xp: 240, copper: [8000, 16000], foe: 'A restless cryptwarden', arrive: 'stirs in its tomb', drop: 'd5', scene: 'crypt' },
  { id: 'z6', name: 'Emberpeak Caverns', level: 18, power: 260, xp: 350, copper: [12000, 24000], foe: 'A molten forge-golem', arrive: 'lumbers out of the lava glow', drop: 'd6', scene: 'caverns' },
  { id: 'z7', name: 'Frostmaw Pass', level: 24, power: 360, xp: 500, copper: [20000, 40000], foe: 'Frostmaw, the white wyrm', arrive: 'descends from the peaks', drop: 'd7', scene: 'pass' },
  { id: 'z8', name: 'Citadel of the Ashen King', level: 30, power: 480, xp: 750, copper: [35000, 60000], foe: 'The Ashen King', arrive: 'rises from his smouldering throne', drop: 'd8', scene: 'citadel' },
];

export const ZONE_BY_ID = Object.fromEntries(ZONES.map(zone => [zone.id, zone]));
