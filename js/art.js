// ---------- Art ----------
const M = { steel: '#d3dae2', steelD: '#7c8794', steelX: '#4b535c', gold: '#e8c25e', goldD: '#9a7a32', wood: '#9a6436', woodD: '#5e3b1f', leather: '#8f5c35', leatherD: '#5a3920', bone: '#ece0c4', ink: '#120d09' };
const hi = (d, o = 0.38) => `<path d="${d}" fill="#fff" opacity="${o}"/>`;
const DRAW = {
  sword: t => `<path d="M32 5l3 3-17 17-3-3z" fill="${M.steel}"/>${hi('M32 5l3 3-9 9z')}<path d="M10 21l9 9 2-2-9-9z" fill="${M.gold}"/><path d="M14 26l2 2-7 7-2-2z" fill="${M.woodD}"/><circle cx="7" cy="34" r="2.6" fill="${t}"/>`,
  greatsword: t => `<circle cx="27" cy="13" r="10" fill="${t}" opacity=".18"/><path d="M33 3l5 5-20 20-5-5z" fill="${M.steel}"/>${hi('M33 3l5 5-11 11z')}<path d="M18 22l3 3" stroke="${M.steelD}" stroke-width="1"/><path d="M8 19l13 13 2.5-2.5-13-13z" fill="${M.gold}"/><circle cx="16" cy="25" r="2" fill="${t}"/><path d="M13 27l2.5 2.5-7 7-2.5-2.5z" fill="${M.leatherD}"/><circle cx="6.5" cy="35" r="2.8" fill="${M.gold}"/>`,
  cutlass: t => `<path d="M34 4c1 9-6 16-16 21l-3-3c8-4 15-9 19-18z" fill="${M.steel}"/>${hi('M34 4c0 4-2 8-5 11l-2-1c3-3 5-6 7-10z', 0.5)}<path d="M11 20c3 1 7 5 8 9l-2 1c-1-3-4-6-7-7z" fill="${t}"/><path d="M14 26l2 2-7 7-2-2z" fill="${M.woodD}"/><circle cx="7" cy="34" r="2.4" fill="${M.gold}"/>`,
  club: t => `<path d="M30 5c4 0 6 3 5 7L17 29l-5-5L27 8c1-2 2-3 3-3z" fill="${M.wood}"/>${hi('M30 6c2 0 3 1 3 2L20 22l-1-1z', 0.25)}<circle cx="29" cy="11" r="1.6" fill="${M.steelD}"/><circle cx="24" cy="16" r="1.6" fill="${M.steelD}"/><circle cx="32" cy="14" r="1.6" fill="${M.steelD}"/><path d="M12 24l4 4-8 8-4-4z" fill="${M.woodD}"/><path d="M11 25l4 4" stroke="${t}" stroke-width="2"/>`,
  staff: t => `<path d="M9 36l-3-3L26 13l3 3z" fill="${M.wood}"/><path d="M14 28l3 3M19 23l3 3" stroke="${M.gold}" stroke-width="1.5"/><circle cx="30" cy="10" r="8" fill="${t}" opacity=".25"/><path d="M24 13l2-6M27 16l6-2" stroke="${M.gold}" stroke-width="1.6" fill="none"/><circle cx="30" cy="10" r="4.6" fill="${t}"/><circle cx="28.4" cy="8.4" r="1.6" fill="#fff" opacity=".75"/>`,
  wand: t => `<circle cx="28" cy="12" r="9" fill="${t}" opacity=".22"/><path d="M12 32l-3-3 13-13 3 3z" fill="${M.woodD}"/><path d="M17 23l3 3" stroke="${M.gold}" stroke-width="2"/><path d="M25 9l7-2-2 7-5 3-3-3z" fill="${t}"/>${hi('M25 9l7-2-6 6z', 0.5)}`,
  bow: t => `<path d="M9 5c15 2 25 12 26 26" stroke="${M.wood}" stroke-width="3.6" fill="none" stroke-linecap="round"/><path d="M9 5c15 2 25 12 26 26" stroke="#fff" stroke-width="1" fill="none" opacity=".25"/><path d="M9 5L35 31" stroke="${t}" stroke-width="1.1"/><path d="M23 11l5 5" stroke="${M.leatherD}" stroke-width="4" stroke-linecap="round"/><path d="M4 30l20-20" stroke="${M.bone}" stroke-width="1.4"/><path d="M24 10l-4 0 4-4z" fill="${M.steel}"/><path d="M4 30l3 3-1-4-3-1z" fill="${t}"/>`,
  mace: t => `<path d="M8 35l-3-3 15-15 3 3z" fill="${M.woodD}"/><path d="M11 30l3 3" stroke="${M.gold}" stroke-width="2"/><g stroke="${t}" stroke-width="3" stroke-linecap="round">${[0, 60, 120, 180, 240, 300].map(a => `<path d="M24.5 5.5v3" transform="rotate(${a} 24.5 14.5)"/>`).join('')}</g><circle cx="24.5" cy="14.5" r="6.5" fill="${t}"/>${hi('M21 11a5 5 0 0 1 6-1l-5 5z', 0.45)}<circle cx="24.5" cy="14.5" r="2" fill="${M.ink}" opacity=".5"/>`,
  cap: t => `<path d="M7 27c0-11 6-17 13-17s13 6 13 17z" fill="${M.leather}"/>${hi('M12 18c2-4 5-6 8-6v4c-3 0-5 1-8 2z', 0.2)}<path d="M5 26h30v5H5z" fill="${M.leatherD}"/><path d="M8 28.5h24" stroke="${t}" stroke-width="1" stroke-dasharray="2 2"/><path d="M20 10v16" stroke="${M.leatherD}" stroke-width="1.2"/>`,
  hood: t => `<path d="M20 5c9 0 14 9 14 19v11h-7c0-6-2-11-7-11s-7 5-7 11H6V24C6 14 11 5 20 5z" fill="${t}"/>${hi('M20 5c-6 0-10 5-11 12 2-5 6-8 11-8z', 0.25)}<path d="M13 35c0-7 3-11 7-11s7 4 7 11z" fill="${M.ink}"/><circle cx="17.5" cy="29" r="1" fill="#e8c25e"/><circle cx="22.5" cy="29" r="1" fill="#e8c25e"/><path d="M8 13l-3-6 7 3M32 13l3-6-7 3" fill="${t}"/>`,
  helm: t => `<path d="M7 25c0-11 6-18 13-18s13 7 13 18v9H7z" fill="${M.steel}"/>${hi('M10 20c1-6 5-11 10-12v6c-4 1-7 3-10 6z', 0.3)}<path d="M7 25h26v3H7z" fill="${M.steelD}"/><path d="M11 20h18v2.4H11z" fill="${M.ink}"/><path d="M19 7h2v13h-2z" fill="${t}"/><path d="M20 3c6 0 9 3 10 7-3-2-6-3-10-3z" fill="${t}"/>`,
  circlet: t => `<ellipse cx="20" cy="24" rx="14" ry="6.5" fill="none" stroke="${M.gold}" stroke-width="3.2"/><ellipse cx="20" cy="24" rx="14" ry="6.5" fill="none" stroke="#fff" stroke-width=".8" opacity=".35"/><circle cx="20" cy="17" r="7" fill="${t}" opacity=".2"/><path d="M20 11l4.5 6-4.5 6-4.5-6z" fill="${t}"/>${hi('M20 11l2.2 3h-4.4z', 0.6)}`,
  crown: t => `<circle cx="20" cy="20" r="15" fill="${t}" opacity=".12"/><path d="M6 31V13l7 8 7-12 7 12 7-8v18z" fill="${M.gold}"/>${hi('M6 13l7 8 7-12v6l-7 9-7-6z', 0.25)}<path d="M6 27h28v5H6z" fill="${M.goldD}"/><circle cx="20" cy="24" r="2.6" fill="${t}"/><circle cx="12" cy="25" r="1.8" fill="${t}"/><circle cx="28" cy="25" r="1.8" fill="${t}"/><circle cx="6" cy="12" r="1.5" fill="${M.gold}"/><circle cx="20" cy="8" r="1.5" fill="${M.gold}"/><circle cx="34" cy="12" r="1.5" fill="${M.gold}"/>`,
  tunic: t => `<path d="M13 6l7 3 7-3 8 7-5 5-2-2v19H12V16l-2 2-5-5z" fill="${t}"/>${hi('M13 6l7 3v26h-8V16l-2 2-5-5z', 0.12)}<path d="M20 9v10" stroke="${M.gold}" stroke-width="1.2"/><path d="M18 11h4M18 14h4M18 17h4" stroke="${M.leatherD}" stroke-width="1"/><path d="M12 24h16v3H12z" fill="${M.leatherD}"/><rect x="18.5" y="24" width="3" height="3" fill="${M.gold}"/>`,
  robe: t => `<path d="M14 5l6 3 6-3 7 7-4 4-2-1 3 20H10l3-20-2 1-4-4z" fill="${t}"/>${hi('M14 5l6 3v27H10l3-20-2 1-4-4z', 0.12)}<path d="M20 8v27" stroke="${M.gold}" stroke-width="1.6"/><path d="M13 19h14v2.6H13z" fill="${M.gold}"/><path d="M10 35h20" stroke="${M.gold}" stroke-width="1.6"/>`,
  mail: t => `<path d="M13 6l7 3 7-3 8 7-5 5-2-2v19H12V16l-2 2-5-5z" fill="${M.steelD}"/><g stroke="${M.steel}" stroke-width="1.3" stroke-dasharray="1.4 1.2">${[12, 15, 18, 21, 24, 27, 30, 33].map(y => `<path d="M${y < 17 ? 9 : 13} ${y}H${y < 17 ? 31 : 27}"/>`).join('')}</g><path d="M12 24h16v3H12z" fill="${M.leatherD}"/><rect x="18.5" y="24" width="3" height="3" fill="${t}"/>`,
  plate: t => `<circle cx="20" cy="20" r="15" fill="${t}" opacity=".14"/><path d="M11 9l9 3 9-3 3 9-3 2v14H11V20l-3-2z" fill="${t}"/><path d="M20 12v22" stroke="#fff" stroke-width="1.4" opacity=".4"/><path d="M11 20h18" stroke="${M.ink}" stroke-width="1" opacity=".4"/><circle cx="8.5" cy="11" r="5" fill="${M.steelD}"/><circle cx="31.5" cy="11" r="5" fill="${M.steelD}"/>${hi('M5 10a4 4 0 0 1 6-3l-3 4z', 0.4)}<path d="M15 26h10v2H15z" fill="${M.gold}"/>`,
  apron: t => `<path d="M14 8h12v6l4 3v18H10V17l4-3z" fill="${M.leatherD}"/><path d="M14 8l-3-4M26 8l3-4" stroke="${M.leather}" stroke-width="2"/><rect x="14" y="21" width="12" height="7" fill="${M.steelD}"/><circle cx="16" cy="23" r=".8" fill="${M.steel}"/><circle cx="24" cy="23" r=".8" fill="${M.steel}"/><path d="M10 31h20" stroke="${t}" stroke-width="1.2" stroke-dasharray="2 2"/>`,
  charm: t => `<path d="M9 5c4 8 18 8 22 0" stroke="${M.leatherD}" stroke-width="1.5" fill="none"/><path d="M20 10v5" stroke="${M.leatherD}" stroke-width="1.5"/><circle cx="20" cy="25" r="10" fill="${t}"/><circle cx="20" cy="25" r="7" fill="none" stroke="${M.ink}" stroke-width="1" opacity=".35"/><path d="M20 19l1.8 3.8 4.2.4-3.2 2.7 1 4.1-3.8-2.2-3.8 2.2 1-4.1-3.2-2.7 4.2-.4z" fill="${M.ink}" opacity=".35"/>${hi('M13 21a8 8 0 0 1 7-5v3a5 5 0 0 0-5 4z', 0.35)}`,
  compass: t => `<circle cx="20" cy="21" r="14" fill="${M.gold}"/><circle cx="20" cy="21" r="11" fill="${M.ink}"/><circle cx="20" cy="21" r="11" fill="none" stroke="${M.goldD}" stroke-width="1"/><path d="M20 11l3 10-3 2-3-2z" fill="${t}"/><path d="M20 31l3-10h-6z" fill="${M.bone}"/><circle cx="20" cy="21" r="1.4" fill="${M.gold}"/><rect x="18" y="4" width="4" height="4" rx="1" fill="${M.gold}"/>${hi('M8 17a13 13 0 0 1 9-9v3a10 10 0 0 0-6 6z', 0.3)}`,
  hourglass: t => `<rect x="9" y="4" width="22" height="4" rx="1" fill="${M.wood}"/><rect x="9" y="32" width="22" height="4" rx="1" fill="${M.wood}"/><path d="M11 8v4 M29 8v24 M11 28v4" stroke="${M.woodD}" stroke-width="2"/><path d="M13 8h14c0 7-5 9-5 12s5 5 5 12H13c0-7 5-9 5-12s-5-5-5-12z" fill="#fff" opacity=".15"/><path d="M15 12h10c-1 3-3 5-5 6-2-1-4-3-5-6zM20 22l1 2c3 1 5 3 5 8H14c0-5 2-7 5-8z" fill="${t}"/><path d="M20 18v4" stroke="${t}" stroke-width="1"/>`,
  gem: t => `<circle cx="20" cy="20" r="15" fill="${t}" opacity=".2"/><path d="M20 5l12 10-12 20L8 15z" fill="${t}"/><path d="M8 15h24" stroke="#fff" stroke-width=".8" opacity=".5"/><path d="M20 5l5 10h-10z" fill="#fff" opacity=".4"/><path d="M8 15h24L20 35z" fill="#000" opacity=".22"/><path d="M15 15l5 20 5-20" stroke="#fff" stroke-width=".6" fill="none" opacity=".35"/>`,
  talisman: t => `<path d="M10 4c3 6 17 6 20 0" stroke="${M.leatherD}" stroke-width="1.4" fill="none"/><circle cx="20" cy="15" r="7" fill="none" stroke="${M.bone}" stroke-width="3"/><path d="M14 21l-3 6M26 21l3 6M20 22v3" stroke="${M.leatherD}" stroke-width="1.2"/><circle cx="11" cy="29" r="2" fill="${M.bone}"/><circle cx="29" cy="29" r="2" fill="${M.bone}"/><path d="M20 25l4 5-4 6-4-6z" fill="${t}"/>${hi('M20 25l2 2.5h-4z', 0.6)}`,
  fang: t => `<circle cx="21" cy="20" r="15" fill="${t}" opacity=".16"/><path d="M13 5c9 0 16 5 16 12 0 9-7 15-16 19 4-7 5-13 3-19-1-4-3-7-3-12z" fill="${M.bone}"/>${hi('M15 7c6 1 10 4 11 9-3-4-6-6-11-7z', 0.6)}<path d="M13 5c5 1 9 2 11 4" stroke="${M.leatherD}" stroke-width="3"/><path d="M14 9l2 2M18 8l1 2.5" stroke="${t}" stroke-width="1.4"/>`,
  // quest + class art
  boot: () => `<path d="M11 5h11v17l9 3c3 1 4 3 4 6v3H8V5z" fill="${M.leather}"/>${hi('M11 5h4v25H8z', 0.15)}<path d="M8 30h27v5H8z" fill="${M.leatherD}"/><path d="M12 10h9M12 14h9M12 18h9" stroke="${M.gold}" stroke-width="1.3"/><path d="M8 4h15v3H8z" fill="${M.leatherD}"/>`,
  dumbbell: () => `<path d="M10 18h20v4H10z" fill="${M.steelD}"/><rect x="5" y="10" width="7" height="20" rx="1.6" fill="${M.steel}"/><rect x="28" y="10" width="7" height="20" rx="1.6" fill="${M.steel}"/><rect x="2" y="14" width="3" height="12" rx="1" fill="${M.steelD}"/><rect x="35" y="14" width="3" height="12" rx="1" fill="${M.steelD}"/>${hi('M5 11h3v18H5z', 0.4)}${hi('M28 11h3v18h-3z', 0.4)}`,
  lotus: () => `<circle cx="20" cy="20" r="15" fill="#c98ae8" opacity=".15"/><path d="M20 7c4 5 5 11 0 20-5-9-4-15 0-20z" fill="#e7a7ee"/><path d="M8 13c6 1 10 6 12 14-8-1-12-6-12-14zM32 13c-6 1-10 6-12 14 8-1 12-6 12-14z" fill="#c983dd"/><path d="M4 22c6-1 12 2 16 5-6 3-12 2-16-5zM36 22c-6-1-12 2-16 5 6 3 12 2 16-5z" fill="#a965c4"/><path d="M8 32c8-3 16-3 24 0" stroke="#5fc9ea" stroke-width="1.6" fill="none" opacity=".7"/>`,
  droplet: () => `<path d="M20 4c6 9 12 15 12 22a12 12 0 0 1-24 0c0-7 6-13 12-22z" fill="#4aa6ea"/><path d="M20 4c6 9 12 15 12 22a12 12 0 0 1-12 12z" fill="#2f7fc4"/>${hi('M13 25c0-4 2-7 5-11-1 4-2 7-2 11z', 0.55)}`,
  apple: () => `<path d="M20 12c-3-3-13-2-13 9 0 8 6 15 10 15 2 0 2-1 3-1s1 1 3 1c4 0 10-7 10-15 0-11-10-12-13-9z" fill="#5fbf44"/><path d="M20 12c3-3 13-2 13 9 0 8-6 15-10 15-2 0-2-1-3-1z" fill="#3f9a2e"/><path d="M20 12c0-4 1-7 3-8" stroke="${M.woodD}" stroke-width="2" fill="none"/><path d="M22 8c3-4 8-4 10-2-3 3-7 3-10 2z" fill="#7fd45a"/>${hi('M11 18c1-3 3-4 5-4-2 2-3 4-3 7z', 0.5)}`,
  flask: () => `<circle cx="20" cy="25" r="15" fill="#f2a33a" opacity=".15"/><path d="M17 7h6v7.4A11 11 0 1 1 17 14.4z" fill="#cfe6ef" fill-opacity=".2" stroke="#cfe6ef" stroke-width="1.4"/><path d="M9 25h22a11 11 0 0 1-22 0z" fill="#f2a33a"/><path d="M12 30a8 8 0 0 0 7 5" stroke="#ffd98a" stroke-width="1.4" fill="none" opacity=".7"/><circle cx="24" cy="29" r="1.5" fill="#ffe3a8"/><circle cx="18.5" cy="32" r="1" fill="#ffe3a8"/><rect x="15.5" y="3" width="9" height="5" rx="1.2" fill="${M.wood}"/>${hi('M12.5 20a9 9 0 0 1 4.5-3.5v3a6 6 0 0 0-2.5 2.5z', 0.5)}`,
  warrior: () => `<path d="M20 4l13 5v10c0 9-6 15-13 18C13 34 7 28 7 19V9z" fill="${M.steelX}" stroke="${M.gold}" stroke-width="2"/><path d="M12 28L28 10M28 28L12 10" stroke="${M.steel}" stroke-width="2.6" stroke-linecap="round"/><path d="M10 25l5 5M30 25l-5 5" stroke="${M.gold}" stroke-width="2.4" stroke-linecap="round"/>`,
  mage: () => `<circle cx="20" cy="22" r="13" fill="#ff7a3a" opacity=".18"/><path d="M20 4c2 6 10 9 10 19a10 10 0 0 1-20 0c0-5 3-8 5-10 0 4 2 6 3 6 0-6-1-10 2-15z" fill="#ff8c3a"/><path d="M20 15c1 4 6 6 6 11a6 6 0 0 1-12 0c0-3 2-5 3-6 0 2 1 3 2 3 0-3-1-5 1-8z" fill="#ffd46a"/><circle cx="20" cy="28" r="2.4" fill="#fff6d0"/>`,
  ranger: () => `<path d="M20 5c9 4 13 13 10 24-7-1-13-6-14-14 0-4 2-7 4-10z" fill="#4f9a45"/><path d="M20 5c-2 9 0 17 10 24" stroke="#2d6227" stroke-width="1.4" fill="none"/><path d="M5 35L28 12" stroke="${M.bone}" stroke-width="2"/><path d="M28 12l-5 1 4-5z" fill="${M.steel}"/><path d="M5 35l2-5 2 3zM8 34l-1-4 3 2z" fill="${M.gold}"/>`,
  priest: () => `<g stroke="${M.gold}" stroke-width="2.2" stroke-linecap="round">${[0, 45, 90, 135, 180, 225, 270, 315].map(a => `<path d="M20 4v6" transform="rotate(${a} 20 20)"/>`).join('')}</g><circle cx="20" cy="20" r="8" fill="${M.gold}"/><circle cx="20" cy="20" r="8" fill="none" stroke="#fff6d0" stroke-width="1.2"/><path d="M20 14v12M15 19h10" stroke="#7a5a12" stroke-width="2"/>`,
};
const art = (kind, t = '#8fd0ff') => `<svg viewBox="0 0 40 40" aria-hidden="true">${DRAW[kind](t)}</svg>`;
const ICONS = {
  w0w: ['sword', '#8a6a4a'], w0m: ['staff', '#9aa3ad'], w0r: ['bow', '#bbb'], w0p: ['mace', '#9aa3ad'],
  oakclub: ['club', '#b98a4e'], ashstaff: ['staff', '#8fd0ff'], huntbow: ['bow', '#e8e0c8'], sunmace: ['mace', '#e8c25e'],
  leathercap: ['cap', '#e8c25e'], jerkin: ['tunic', '#8f5c35'], charm: ['charm', '#c27a43'],
  ironsword: ['greatsword', '#8bd16f'], emberwand: ['wand', '#ff7a3a'], windbow: ['bow', '#9be3c8'], dawnmace: ['mace', '#ffe08a'],
  squirehelm: ['helm', '#c0392b'], circlet: ['circlet', '#7fd3ff'], hauberk: ['mail', '#e8c25e'], robe: ['robe', '#3f6fb5'], brigandine: ['tunic', '#3e6b3a'],
  compass: ['compass', '#e2604f'], hourglass: ['hourglass', '#7fb8ff'], dawnblade: ['greatsword', '#ffd36a'], starscepter: ['staff', '#c7a6ff'], galebow: ['bow', '#7ff0d0'],
  mountainheart: ['gem', '#e0503c'], watchcrown: ['crown', '#6fd0ff'],
  d1: ['hood', '#7d7f86'], d2: ['apron', '#c9a25a'], d3: ['talisman', '#57d16f'], d4: ['cutlass', '#c0392b'], d5: ['crown', '#9ef0c0'],
  d6: ['plate', '#c8582a'], d7: ['fang', '#9fdcff'], d8: ['plate', '#6b3aa0'],
};
const itemArt = id => art(...(ICONS[id] || ['gem', '#888']));
const QUEST_ART = { steps: 'boot', exercise: 'dumbbell', meditate: 'lotus', water: 'droplet', vitamins: 'flask', nojunk: 'apple' };

// Zone banners: layered hills + a motif per zone, seeded so they never change
const ZART = {
  z1: { sky: ['#1f3a4a', '#d98b54'], far: '#2c4a45', near: '#13261f', orb: '#ffd28a', orbY: 70 },
  z2: { sky: ['#3a2d4f', '#e0a25a'], far: '#5a4a3a', near: '#2a2016', orb: '#ffe0a0', orbY: 62 },
  z3: { sky: ['#14251f', '#4f6b4a'], far: '#22382c', near: '#0d1a14', orb: '#cfe8a0', orbY: 30 },
  z4: { sky: ['#4a2a1f', '#e07a3a'], far: '#5a3a2a', near: '#24150f', orb: '#ffc070', orbY: 75 },
  z5: { sky: ['#0f1424', '#2f3f5a'], far: '#1f2838', near: '#0b0e16', orb: '#bfe8d0', orbY: 28 },
  z6: { sky: ['#1a0d0a', '#3a1a10'], far: '#2a140d', near: '#120806', orb: null },
  z7: { sky: ['#5a7aa0', '#d8e6f2'], far: '#8aa2bc', near: '#e8f0f6', orb: '#ffffff', orbY: 30 },
  z8: { sky: ['#1a0808', '#9a2a14'], far: '#3a1410', near: '#120606', orb: '#ff8a3a', orbY: 40 },
};
function zoneArt(z) {
  const P = ZART[z.id];
  let seed = [...z.id].reduce((a, ch) => a * 31 + ch.charCodeAt(0), 7) % 2147483647 || 1;
  const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  const ridge = (base, amp, step, sharp) => {
    let d = `M0 110L0 ${base}`;
    for (let x = 0; x <= 360; x += step) {
      const y = base + (rnd() - 0.5) * amp;
      d += sharp ? `L${x} ${y.toFixed(1)}` : `Q${x - step / 2} ${(y - amp * 0.3).toFixed(1)} ${x} ${y.toFixed(1)}`;
    }
    return d + 'L360 110Z';
  };
  const id = 'sky-' + z.id;
  let motif = '';
  const pine = (x, y, s, c) => `<path d="M${x} ${y - 22 * s}l${7 * s} ${12 * s}h${-3 * s}l${6 * s} ${10 * s}h${-20 * s}l${6 * s} ${-10 * s}h${-3 * s}z" fill="${c}"/>`;
  switch (z.id) {
    case 'z1': for (let i = 0; i < 16; i++) motif += pine(rnd() * 370 - 5, 96 + rnd() * 10, 0.7 + rnd() * 0.7, '#0b1a14'); break;
    case 'z2': motif = `<rect x="0" y="92" width="360" height="18" fill="#6a5022"/><path d="M0 96h360" stroke="#c9a24a" stroke-width="2" stroke-dasharray="3 4" opacity=".6"/><rect x="236" y="56" width="34" height="40" fill="#1e160e"/><path d="M230 58l23-18 23 18z" fill="#140e08"/><g transform="translate(253 52)" stroke="#140e08" stroke-width="3">${[0, 90].map(a => `<path d="M-26 0H26" transform="rotate(${a + 20})"/>`).join('')}</g><rect x="248" y="78" width="9" height="18" fill="#e0a25a" opacity=".7"/>`; break;
    case 'z3': motif = `<rect x="0" y="84" width="360" height="26" fill="#0f2a24"/><path d="M0 92h360M30 100h120M200 98h140" stroke="#cfe8a0" stroke-width="1" opacity=".18"/>` + Array.from({ length: 22 }, () => { const x = rnd() * 360; return `<path d="M${x} 90q${(rnd() - 0.5) * 8} -12 ${(rnd() - 0.5) * 6} -${16 + rnd() * 14}" stroke="#0a1510" stroke-width="2" fill="none"/>`; }).join('') + `<path d="M90 86l2-30-10-12M92 62l12-10M91 48l-6-8" stroke="#0a1510" stroke-width="3.5" fill="none" stroke-linecap="round"/>`; break;
    case 'z4': motif = `<path d="M0 104C80 96 140 102 200 92S320 86 360 90" stroke="#7a5030" stroke-width="5" fill="none"/><circle cx="110" cy="96" r="7" fill="#ffb050" opacity=".35"/><path d="M107 99l3-7 3 7z" fill="#ffd070"/><path d="M60 70l14-26 14 26z" fill="#2a170f"/>`; break;
    case 'z5': motif = Array.from({ length: 9 }, (_, i) => { const x = 20 + i * 38 + rnd() * 10, h = 10 + rnd() * 8; return `<path d="M${x} 104v-${h}a6 6 0 0 1 12 0v${h}z" fill="#2a3242" transform="rotate(${(rnd() - 0.5) * 12} ${x + 6} 104)"/>`; }).join('') + `<path d="M150 104V62l30-16 30 16v42z" fill="#141a26"/><path d="M158 104V70M170 104V70M190 104V70M202 104V70" stroke="#2a3242" stroke-width="4"/><path d="M174 104v-20h12v20z" fill="#9ef0c0" opacity=".35"/>`; break;
    case 'z6': motif = `<path d="M0 0h360v14` + Array.from({ length: 18 }, (_, i) => `L${i * 20 + 10} ${14 + 8 + rnd() * 24}L${i * 20 + 20} 14`).join('') + `V0z" fill="#0c0504"/><path d="M0 98C60 90 120 104 180 96S300 92 360 98V110H0z" fill="#ff6a1a"/><path d="M0 100C60 94 120 106 180 99S300 96 360 100" stroke="#ffd060" stroke-width="2" fill="none" opacity=".8"/><rect x="0" y="60" width="360" height="40" fill="url(#glow-z6)"/>`; break;
    case 'z7': motif = Array.from({ length: 40 }, () => `<circle cx="${(rnd() * 360).toFixed(0)}" cy="${(rnd() * 100).toFixed(0)}" r="${(0.6 + rnd()).toFixed(1)}" fill="#fff" opacity=".8"/>`).join(''); break;
    case 'z8': motif = `<path d="M200 104V58h10v-8h8v8h8V40h-4l10-14 10 14h-4v18h8v-8h8v8h10v46z" fill="#0a0303"/><path d="M150 104V74h8v-6h6v6h6v30z" fill="#0a0303"/><rect x="241" y="62" width="4" height="7" fill="#ff8a3a"/><rect x="220" y="76" width="4" height="7" fill="#ff8a3a" opacity=".7"/>` + Array.from({ length: 24 }, () => `<circle cx="${(rnd() * 360).toFixed(0)}" cy="${(rnd() * 100).toFixed(0)}" r="1" fill="#ffb060" opacity="${(0.3 + rnd() * 0.6).toFixed(2)}"/>`).join(''); break;
  }
  const orbX = (60 + rnd() * 240).toFixed(0);
  return `<svg viewBox="0 0 360 112" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
    <defs><linearGradient id="${id}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${P.sky[0]}"/><stop offset="1" stop-color="${P.sky[1]}"/></linearGradient>
    <linearGradient id="glow-z6" x1="0" y1="1" x2="0" y2="0"><stop offset="0" stop-color="#ff6a1a" stop-opacity=".55"/><stop offset="1" stop-color="#ff6a1a" stop-opacity="0"/></linearGradient></defs>
    <rect width="360" height="112" fill="url(#${id})"/>
    ${P.orb ? `<circle cx="${orbX}" cy="${P.orbY}" r="26" fill="${P.orb}" opacity=".18"/><circle cx="${orbX}" cy="${P.orbY}" r="11" fill="${P.orb}" opacity=".9"/>` : ''}
    <path d="${ridge(z.id === 'z7' ? 52 : 66, z.id === 'z4' || z.id === 'z7' ? 40 : 22, z.id === 'z4' || z.id === 'z7' ? 28 : 45, z.id === 'z4' || z.id === 'z7')}" fill="${P.far}"/>
    ${z.id === 'z7' ? `<path d="${ridge(70, 30, 36, true)}" fill="#b8c8d8"/>` : ''}
    <path d="${ridge(88, 14, 60, false)}" fill="${P.near}"/>
    ${motif}
  </svg>`;
}
