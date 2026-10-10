// Shared colour legend used by every hand-drawn pixel sprite and tile.
// Each character maps to a hex colour. Sprites may override individual keys.
export const PALETTE: Record<string, string> = {
  '.': 'transparent',
  ' ': 'transparent',

  // outline / neutrals
  k: '#181820',
  K: '#000000',
  w: '#ffffff',
  f: '#f8f8f8',
  W: '#d8d8e0',
  g: '#b8b8c0',
  G: '#70707c',

  // reds
  r: '#e85040',
  R: '#a82820',
  q: '#f8a0a0',

  // oranges / browns
  o: '#f8a83c',
  O: '#d06818',
  n: '#a86038',
  N: '#6c381c',
  m: '#f8c088',
  M: '#e0a060',

  // yellows
  y: '#f8d838',
  Y: '#d8a818',
  z: '#fff0a0',

  // greens
  e: '#78c850',
  E: '#489028',
  l: '#b8e888',
  d: '#2c6818',

  // blues / cyans
  c: '#68a8f8',
  C: '#3060c0',
  b: '#78d8f8',
  B: '#2888c0',
  a: '#c8f0f8',

  // pinks / purples
  p: '#f8a8c0',
  P: '#d06890',
  v: '#a868c8',
  V: '#6840a0',
  u: '#c8a0e0',

  // skin
  t: '#f0c890',
  T: '#d09860',
  s: '#f8d8b0',

  // hair
  h: '#583818',
  H: '#302010',
};

export function hexToInt(hex: string): number {
  return parseInt(hex.slice(1), 16);
}

/** Resolve a sprite pixel character to a hex colour (or null when transparent). */
export function colorOf(ch: string, legend: Record<string, string> = {}): string | null {
  if (ch === '.' || ch === ' ') return null;
  const v = legend[ch] ?? PALETTE[ch];
  if (!v || v === 'transparent') return null;
  return v;
}

export type Legend = Record<string, string>;
export declare type SpriteDef = {
  data: string[];
  legend?: Legend;
};
