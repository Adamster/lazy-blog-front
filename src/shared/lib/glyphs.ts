/**
 * The Brutalist-Mono glyph set — the alphabet the "matrix decode" / scramble
 * effects cycle through. Single source for {@link MatrixText}, the canvas
 * {@link MatrixRain} and the /brand LAB toys, so every scramble draws from the
 * same characters (no drift between surfaces).
 */
export const MATRIX_GLYPHS =
  "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!<>-_/\\[]{}=+*#%&".split("");

/** One random glyph from {@link MATRIX_GLYPHS}. */
export const pick = (): string =>
  MATRIX_GLYPHS[Math.floor(Math.random() * MATRIX_GLYPHS.length)];
