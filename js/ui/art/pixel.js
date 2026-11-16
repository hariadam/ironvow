// Pixel-art building blocks. All art in the game is squares on a whole-number grid, written as SVG.
// Sprites are authored as rows of characters: '.' is empty, every other character is a key into a palette.

// One <path> per colour, one rectangle per horizontal run of that colour. colorAt(x, y) returns a colour or null.
export function gridPaths(width, height, colorAt) {
  const byColor = new Map();
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width;) {
      const color = colorAt(x, y);
      if (!color) { x++; continue; }
      let run = 1;
      while (x + run < width && colorAt(x + run, y) === color) run++;
      byColor.set(color, (byColor.get(color) || '') + `M${x} ${y}h${run}v1h-${run}z`);
      x += run;
    }
  }
  return [...byColor].map(([color, d]) => `<path d="${d}" fill="${color}"/>`).join('');
}

// A sprite as an SVG string. `scale` is how many CSS px one sprite pixel covers; keep it a whole number.
// With a label the sprite is announced as an image; without one it is decoration.
export function spriteSvg(rows, palette, scale, label) {
  const width = rows[0].length;
  const height = rows.length;
  const paths = gridPaths(width, height, (x, y) => palette[rows[y][x]] || null);
  const a11y = label ? `role="img" aria-label="${label}"` : 'aria-hidden="true"';
  return `<svg class="px" width="${width * scale}" height="${height * scale}" viewBox="0 0 ${width} ${height}" shape-rendering="crispEdges" ${a11y}>${paths}</svg>`;
}

// A drawing surface for larger pictures (zone scenes). Drawing outside it is ignored.
export function createCanvas(width, height) {
  const cells = new Array(width * height).fill(null);
  const set = (x, y, color) => { if (x >= 0 && x < width && y >= 0 && y < height) cells[y * width + x] = color; };
  return {
    width, height, set,
    rect(x, y, w, h, color) { for (let j = y; j < y + h; j++) for (let i = x; i < x + w; i++) set(i, j, color); },
    // Draws a sprite (rows + palette) with its top-left corner at x, y.
    stamp(x, y, rows, palette) {
      rows.forEach((row, j) => { for (let i = 0; i < row.length; i++) if (palette[row[i]]) set(x + i, y + j, palette[row[i]]); });
    },
    paths: () => gridPaths(width, height, (x, y) => cells[y * width + x]),
  };
}
