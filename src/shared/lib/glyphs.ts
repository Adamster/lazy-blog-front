export const MATRIX_GLYPHS =
  "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!<>-_/\\[]{}=+*#%&".split("");

export const pick = (): string =>
  MATRIX_GLYPHS[Math.floor(Math.random() * MATRIX_GLYPHS.length)];
