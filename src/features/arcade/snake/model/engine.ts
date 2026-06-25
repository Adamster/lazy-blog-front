import { MATRIX_GLYPHS } from "@/shared/lib/glyphs";
import type { Cell, Speed } from "./types";

/**
 * RENDER MODE for the snake + rabbits — the ONE switch the owner flips.
 *
 *  - `"glyph"` (DEFAULT): the snake is drawn as a MATRIX-RAIN STREAM of glyphs
 *    bending along its body (bright near-white head → green {@link ACCENT} body
 *    dimming to {@link ACCENT_DIM} at the tail) — the on-theme "Matrix code"
 *    look, see {@link drawSnakeGlyphs}. The rabbits are ALWAYS the bunny-
 *    silhouette pixel SPRITES (owner preference — they read better than glyph
 *    rabbits), independent of this flag.
 *  - `"sprite"`: the ORIGINAL pixel-art look — the grey sentinel head/body/tail
 *    bitmaps (plus the same bunny rabbits). Flipping back to `"sprite"` restores
 *    today's behaviour EXACTLY (every sprite const, {@link drawSprite}, {@link
 *    rotateSprite} and the M/R colour maps are all still here, just gated by this
 *    flag). Only the SNAKE body changes between modes; the rabbits do not.
 *
 * Mechanics / collisions / spawns / teardown are IDENTICAL in both modes — this
 * is purely a render swap. To revert to the sprites, change this one line to
 * `"sprite"`. (HMR won't re-instantiate the engine, so a HARD REFRESH is needed
 * to see a flag flip.)
 */
const SNAKE_RENDER: "glyph" | "sprite" = "glyph";

/**
 * Play-field grid, in cells. The board is a LANDSCAPE rectangle (wider than
 * tall) so its height lands near the high-scores leaderboard column; cells stay
 * SQUARE because the board element's aspect ratio is pinned to `GRID_W / GRID_H`
 * (see `<SnakeBoard>`), so `cssW / GRID_W === cssH / GRID_H`.
 */
export const GRID_W = 30;
export const GRID_H = 18;

/** Per-preset step interval (ms). Accelerates per pellet down to STEP_FLOOR. */
export const SPEED_MS: Record<Speed, number> = {
  chill: 165,
  classic: 125,
  fast: 90,
};
const STEP_ACCEL = 1.5;
const STEP_FLOOR = 60;

/** +score per white-rabbit eaten. */
const SCORE_PER_EAT = 10;

/**
 * TRICKSTER cadence + lifetime + payload — a TWIN-DECOY troll, keyed to WHITE
 * CAPTURES (not a move-timer). The design intent: every {@link
 * TRICKSTER_EVERY_N_WHITE}th white rabbit you eat, the FRESH white that spawns to
 * replace it appears ALONGSIDE a near-identical white rabbit with RED EYES. The
 * two look the same except the eyes, so at a glance you can MISTAKE the troll for
 * the food and aim for the wrong one — that confusion IS the joke. Eating the
 * troll is a tempting-but-BAD outcome: +{@link TRICKSTER_GROWTH} LENGTH and ZERO
 * score (a longer snake with no points = a self-inflicted difficulty spike).
 *
 * Why keyed to WHITE captures, not a move-timer (the owner's steer; supersedes
 * the old every-18-MOVES design, which they found "too rare" and the wrong feel):
 *  - The whole gag is the DECOY PAIR — the troll only works if it shows up TOGETHER
 *    with a real white so the two can be confused. That binds its spawn to the
 *    white-spawn event by construction, which happens on a capture, so capture is
 *    the natural cadence. (The owner's earlier "seconds vs moves" worry is moot
 *    now: timing is keyed to neither — it's keyed to CAPTURES. Every Nth white you
 *    eat, the replacement white brings a twin troll. No clock, no move counter.)
 *  - Every Nth (not every) capture keeps it a RECURRING event, not constant
 *    clutter — frequent enough to keep catching you out, sparse enough to stay a
 *    "gotcha". N = 4 (~one troll every four pellets).
 *
 * Why it LINGERS until the next white is eaten (longer life than the old 10-move
 * despawn, per the owner's "longer so it actually interferes"):
 *  - The pair spawns together; the troll's job is to sit there as a confusable
 *    obstacle while you navigate to the REAL white. So it lives exactly until you
 *    resolve the pair — i.e. until the NEXT white capture (or until you eat the
 *    troll itself). Eating the real white clears its decoy twin (the gag is over,
 *    the round resets); that capture may itself be the Nth, re-spawning a new
 *    pair. So the troll lingers a full white-to-white round — long enough to
 *    genuinely interfere with movement, never permanent clutter.
 *  - Bonus: it ALSO despawns on the rare safety net {@link TRICKSTER_LIFE_CAP}
 *    (a hard move-count ceiling) so a troll can't haunt the board forever if the
 *    player simply never eats another white.
 *
 * The initial board has NO trickster (it needs a capture to appear, and the very
 * first qualifying capture is the Nth white).
 *
 * To make the gag MORE frequent, lower {@link TRICKSTER_EVERY_N_WHITE}; to let it
 * linger longer when the player stalls, raise {@link TRICKSTER_LIFE_CAP}.
 */
const TRICKSTER_EVERY_N_WHITE = 4;
const TRICKSTER_LIFE_CAP = 60;
const TRICKSTER_GROWTH = 10;
/**
 * Trickster "laughing" bob — INTERMITTENT, not a constant wobble: it shakes in
 * BURSTS (a quick "ha-ha-ha" of a few vertical bobs) separated by a still pause,
 * looping, like laughter. The bob is driven off the trickster's OWN on-board AGE
 * (steps lived, sub-sampled per render frame), so the laugh literally IS its
 * lifetime — it giggles its whole brief life, and when the laugh stops it's
 * because it left. Every {@link TRICKSTER_BOB_CYCLE} frames the first {@link
 * TRICKSTER_BOB_BURST} frames jiggle (a sine driven off the IN-BURST phase so it
 * starts AND ends near zero — no snap when it stops), then it holds still.
 * Amplitude is a fraction of a cell (~0.12, a subtle giggle that never leaves the
 * cell). Frozen under reduced motion (rendered static).
 */
const TRICKSTER_BOB_AMP = 0.12;
const TRICKSTER_BOB_FREQ = 0.45;
/** Full laugh loop (frames) + the active jiggle window within it (~60fps:
 *  ~0.6s of "ha-ha-ha", then a ~1.1s pause, repeating). */
const TRICKSTER_BOB_CYCLE = 100;
const TRICKSTER_BOB_BURST = 35;
/**
 * Red-hazard cadence. The red HAZARD rabbit appears/relocates with EVERY white
 * capture — the initial board has NO red (only a white), and from the FIRST
 * capture onward a fresh white + the red are spawned TOGETHER, every pellet
 * (owner change; was an every-4th-spawn interval). The red is a DEADLY trap
 * (touching it ends the run), NOT a bonus — there is no red-score path. Because
 * the hazard now lands on the board on every single pellet, fairness leans on
 * the head-path exclusion below, not on a sparse cadence.
 */

/**
 * Fairness: cells the red hazard may NEVER spawn into, measured from the snake
 * head. `RED_AHEAD` blocks the next N cells the head will step through on its
 * current heading (zero-reaction-time deaths) and `RED_RADIUS` blocks a small
 * Chebyshev ring around the head (a hazard materialising right beside the head
 * is just as unfair). With red now respawning every capture this is what keeps
 * it from teleporting onto the player's unavoidable path.
 */
const RED_AHEAD = 3;
const RED_RADIUS = 2;

// ---- canvas palette (literal hex — the 2D context can't resolve CSS vars) ----

/**
 * Board field — a fixed dark gray, painted OPAQUE every frame on EVERY theme. (A
 * transparent / theme-following canvas was tried and reverted: the game palette
 * is dark-tuned, so the board just stays this gray everywhere.) The head's
 * direction notch is punched back to this same gray.
 */
const BOARD_BG = "#1a1a1a";
/** Snake head / fresh body — the lime accent (`--m-accent`, dark theme). */
const ACCENT = "#cdff48";
/** Tail-end body tint — a dimmer accent so the body reads with subtle depth. */
const ACCENT_DIM = "#5f7a23";
/**
 * The SENTINEL creature is metallic GREY (the Matrix machine reads grey-black on
 * screen, never lime): light at the head, dimming toward the tail. Light enough
 * to read on {@link BOARD_BG} and distinctly greyer than the white rabbit so the
 * two never blur.
 */
const SENTINEL = "#a8acb2";
const SENTINEL_DIM = "#565a60";
/** White rabbit (the food) — `--m-fg` on the dark theme. Exported so the hidden
 *  header easter-egg ({@link RabbitMark}) paints the food its exact game colour. */
export const RABBIT_WHITE = "#e6e6e6";
/** Red HAZARD rabbit — `--m-error` (dark theme): a deadly trap, never a reward. */
const RABBIT_RED = "#ff6b6b";
/**
 * TRICKSTER rabbit — a WHITE body with RED EYES. Body reuses the white food's
 * fill ({@link RABBIT_WHITE}); the two eye cells are painted the hazard red
 * ({@link RABBIT_RED}) so it reads "a white rabbit, but OFF / mischievous" — the
 * red eyes (plus the laughing bob) distinguish it at a glance from the plain
 * white food (transparent-gap eyes) AND the all-red hazard (no white body).
 */
const TRICKSTER_EYE = RABBIT_RED;
/**
 * Faint cell grid — a SEMI-TRANSPARENT white so it adapts to whatever theme bg
 * shows through the transparent canvas (dark `--m-bg #1a1a1a`, neo's slightly
 * different shade + rain bleed, light) instead of a fixed `#333` that only
 * suited one field. The low alpha keeps it quiet during active play (it must
 * not compete with the snake); the overlay-wash reduction (see `<SnakeBoard>`)
 * is what makes it read clearly on the menu / pause / game-over screens, so the
 * grid itself can stay muted. The outer frame ({@link FRAME_LINE}) is a touch
 * stronger to delineate the board edge on every screen.
 */
const GRID_LINE = "rgba(255,255,255,0.01)";
/** Outer board-edge frame — a stronger semi-transparent white than the inner
 *  grid so the board's rim always reads as a distinct field boundary. */
const FRAME_LINE = "rgba(255,255,255,0.22)";

// ---- glyph (matrix-rain) snake palette + cadence (SNAKE_RENDER === "glyph") ----

/**
 * GLYPH-MODE colours. The snake is a rain stream, so it goes GREEN — the
 * authentic Matrix-rain palette (the same lime `--m-accent` family the on-page
 * `MatrixRain` uses), NOT the sprite mode's grey sentinel. The HEAD is the
 * bright leading glyph (near-white, like a rain column's head); the body fades
 * head→tail from {@link ACCENT} (bright green) to {@link ACCENT_DIM} (deep
 * green). (Owner note: if you'd rather the stream be GREY to match the sprite
 * sentinel, swap {@link GLYPH_HEAD}/{@link GLYPH_BODY}/{@link GLYPH_TAIL} to
 * `#f4f6f8` / {@link SENTINEL} / {@link SENTINEL_DIM} — a one-line trio swap.)
 */
const GLYPH_HEAD = "#eaffc0"; // near-white lime — the bright rain head
const GLYPH_BODY = ACCENT; // bright green stream
const GLYPH_TAIL = ACCENT_DIM; // deep-green tail end
/**
 * Glyph cell coverage (fraction of the cell the glyph FONT is sized to). Sized
 * generously so the code reads, but under 1 so adjacent stream cells stay
 * legible as separate characters.
 */
const GLYPH_FILL = 0.5;
/**
 * Churn cadence — how many render frames a stream POSITION holds its glyph
 * before re-rolling (the rain flicker). The HEAD re-rolls faster (it's the live
 * leading glyph). Bigger = calmer/more readable; smaller = busier shimmer. Kept
 * slow enough to read, never a strobe. Frozen entirely under reduced motion.
 */
const GLYPH_CHURN_FRAMES = 16;
const GLYPH_HEAD_CHURN_FRAMES = 7;

// ---- explosion (red-hazard death) particle burst ----

/** Explosion chip palette — the hazard red + the lime accent + white. */
const EXPLOSION_COLORS = [RABBIT_RED, ACCENT, "#ffffff"] as const;
/** Chips per burst — a punchy-but-tasteful spray (square brutalist chips). */
const EXPLOSION_COUNT = 26;
/** Burst lifetime (ms): ~0.7s of gravity + fade, then it self-clears. */
const EXPLOSION_MS = 700;

/**
 * One explosion chip. Position/velocity are in CELL units (offset from the
 * explosion cell's centre), resolved to CSS px at draw time against the live
 * cell size — so the burst stays correct across a board resize. `size` is a
 * fraction of a cell.
 */
interface Chip {
  /** Offset from the explosion cell centre, in cell units (updated per frame). */
  ox: number;
  oy: number;
  /** Velocity in cell-units per frame. */
  vx: number;
  vy: number;
  /** Chip side as a fraction of a cell. */
  size: number;
  color: string;
}

// Big-eared front-facing bunny, decoded from the owner's bunny SVG → a 7×9
// bitmap (tall ears = 3 rows). `1` = a body pixel (rendered in the fill color),
// `0` = NOT drawn = the transparent canvas (so the theme-correct board bg shows
// through). Reading top→bottom: two tall ears (cols 1 & 5, rows 0–2), a wide
// head, two eyes (the `0` gaps in row 4 `1011101`), a nose (the `0` in row 5
// `1110111`), the body, and two feet (cols 1 & 5). The silhouette outline IS the
// board background showing behind it.
export const RABBIT_SPRITE = [
  "0100010",
  "0100010",
  "0100010",
  "1111111",
  "1011101",
  "1110111",
  "1111111",
  "0111110",
  "0100010",
] as const;
/** Sprite occupies this fraction of the cell (a touch smaller, centered). */
const SPRITE_FILL = 0.85;
/** Body + tail render a touch larger — `scale` lifts their effective fill to ~0.9
 *  of the cell (owner request); the head + rabbits stay at the 0.85 default. */
const BODY_TAIL_SCALE = 0.9 / SPRITE_FILL;

// The white/red rabbit is a single-fill bitmap: `1` = the fill color, `0` =
// transparent. A shared resolver lets the generic sprite rasteriser treat it the
// same way as the multi-color head below.
const RABBIT_COLORS: Record<string, string | null> = {
  "1": "_FILL_",
  "0": null,
};

/**
 * TRICKSTER bitmap — the same big-eared 7×9 bunny silhouette as
 * {@link RABBIT_SPRITE}, but the eye row's two body `1` pixels (cols 1 & 5 of the
 * `1011101` row) are replaced with `E` = a RED eye. `1` → white body, `E` → red
 * eye, `0` → transparent (board shows through, same silhouette as the food).
 * Only the eyes differ from the plain white food, so the body still reads "white
 * rabbit" while the red eyes flag it as the troll.
 */
const TRICKSTER_SPRITE = [
  "0100010",
  "0100010",
  "0100010",
  "1111111",
  "1E111E1", // eyes (cols 1 & 5) → red
  "1110111",
  "1111111",
  "0111110",
  "0100010",
] as const;
/** Resolve a TRICKSTER cell: `1` = white body, `E` = red eye, else transparent. */
function tricksterColor(ch: string): string | null {
  if (ch === "1") return RABBIT_WHITE;
  if (ch === "E") return TRICKSTER_EYE;
  return null;
}

/**
 * Sentinel HEAD sprite — the owner's hand-decoded 7×8 Matrix-"sentinel" bitmap,
 * AUTHORED FACING UP (the spiky `.M.M.M.` antennae/sensor row is at the TOP =
 * the creature's FRONT; the rounded `.MMMMM.` / `..MMM..` chin is at the BOTTOM
 * = the back, where the body trails off). `M` = the creature's body pixel (the
 * bright lime accent — kept identical to the body so head + body read as ONE
 * creature, and so the sentinel stays VISIBLE on the dark `#1a1a1a` field; it is
 * deliberately NOT black), `R` = a RED sensor/eye light (the hazard red — the
 * sentinel's menacing red ocelli), `.` = transparent (the board shows through).
 * The two `R` in row 3 (`MRMMMRM`) + the single `R` in row 4 (`MMMRMMM`) are the
 * sentinel's red eye-cluster. The spiky antennae row makes the head instantly
 * distinct from the smooth-rectangle body and the splaying-tentacle tail at a
 * glance. All three snake parts are 7×8 and render off a common reference
 * dimension ({@link SNAKE_REF_DIM}) so every pixel is one block size and the
 * figure reads continuous. At draw time the matrix is pre-rotated in 90° steps
 * to face {@link dir} (see {@link rotateSprite} / {@link headQuarters}) so the
 * spikes + eyes always point the way the creature moves.
 */
const HEAD_SPRITE = [
  ".M.M.M.",
  "MMMMMMM",
  "MMMRMMM",
  "MRMMMRM",
  "MMMRMMM",
  "MMMMMMM",
  ".MMMMM.",
  "..MMM..",
] as const;
/** Head pixel → fill: `M` = grey body, `R` = red sensor/eye, `.` = transparent. */
const HEAD_COLORS: Record<string, string | null> = {
  M: SENTINEL,
  R: RABBIT_RED,
  ".": null,
};

/**
 * Common reference dimension for the SNAKE parts (head + body + tail). All three
 * are rasterised off this single max-dimension so every snake pixel is the SAME
 * device-pixel block size, regardless of each sprite's own bounding box. With
 * the sentinel art the three parts share ONE 7-wide × 8-tall bounding box (head,
 * body and tail are each 7×8), so they ALL key off 8 and butt together into one
 * continuous creature — the head's spiky front, the smooth body tube with its
 * red seam, and the splaying tentacle tail all render at the same pixel pitch
 * (the previous narrower 5-wide body/tail are gone). Keeping the shared `refDim`
 * (rather than letting each part fit its own box, the rabbits' behaviour) is
 * what guarantees the block size matches across segments — a per-part fit would
 * desync the pixel size on parts whose bounding box differs. The rabbits keep
 * fitting their own cell (they pass no `refDim`).
 */
const SNAKE_REF_DIM = 8;

/**
 * Sentinel BODY sprite (middle segments) — the owner's hand-decoded 7×8 bitmap,
 * a smooth 5-wide tube (cols 1..5 filled, a 1px transparent gap each side) with
 * a RED SEAM band across it. Authored as a vertical tube running top→bottom
 * (`+y`). `M` = body pixel, `R` = the red seam, `.` = transparent.
 *
 * The seam is authored at ROW 3 (4th of 8) — slightly above centre — exactly as
 * in the source art. It runs PERPENDICULAR to the tube's flow, so on a straight
 * run it reads as a recurring red rib banding the creature (a sentinel "spinal
 * segment"), distinct from the head's red eye-cluster and the tail's bare
 * tentacles. At draw time the sprite is ROTATED so its long (flow) axis aligns
 * with the segment's direction of travel (see {@link bodyQuarters}) and it draws
 * in `fillToCell` so the long axis slightly overflows the cell — two consecutive
 * segments butt end-to-end into one continuous tube on straight runs; on a turn
 * the two perpendicular tubes overlap at the shared corner cell, minimising the
 * inner-corner seam. Rendered via {@link drawSprite} off {@link SNAKE_REF_DIM}
 * so the pixel block matches the head/tail (the figure reads as one creature).
 */
const BODY_SPRITE = [
  ".......",
  ".MMMMM.",
  ".MMMMM.",
  ".MMRMM.",
  ".MMRMM.",
  ".MMRMM.",
  ".MMMMM.",
  ".M...M.",
] as const;
/**
 * Clockwise 90° turns to align the tube-DOWN {@link BODY_SPRITE} with the
 * segment's flow `dir` (the toroidal step between this segment and the next).
 * The tube is authored running vertically (`+y`), so `+y` = 0 turns. A
 * horizontal flow rotates the narrow axis to run across the page, keeping the
 * tube thin in the perpendicular dimension while it fills the cell along travel.
 * (The body is rotationally symmetric except for the red seam, which is fine —
 * the seam just bands whichever way the segment flows.)
 */
function bodyQuarters(dir: Cell): number {
  if (dir.x === 1) return 3; // tube runs right
  if (dir.x === -1) return 1; // tube runs left
  if (dir.y === -1) return 2; // tube runs up
  return 0; // tube runs down (and the default)
}

/**
 * Sentinel TAIL sprite (the last segment) — the owner's hand-decoded 7×8 bitmap,
 * AUTHORED TIP-DOWN: a WIDE solid cap at the TOP (rows 0–1, 5–7 wide — matching
 * the body tube so the body→tail junction is seamless) that SPLAYS into a bunch
 * of metallic TENTACLES/tendrils dangling DOWN (rows 2–5, the alternating
 * `M.M.M.M` columns + the two outer strands). The tentacle tips trail off into
 * transparency at the bottom (rows 6–7 blank). `M` = body/tendril pixel, `.` =
 * transparent. It runs the full 8-row long axis (like the body) so, drawn in
 * `fillToCell`, its wide cap fills the cell pitch along travel and connects to
 * the preceding body segment; the lower rows splay into the multi-strand
 * tentacle bunch. The splaying tentacles make the tail instantly distinct from
 * the smooth body tube and the spiky head. At draw time the matrix is
 * pre-rotated in 90° steps (see {@link rotateSprite}) so the tentacles always
 * trail AWAY from the body — aimed along the tail's trailing direction (from
 * `snake[len-2]` toward `snake[len-1]`).
 */
const TAIL_SPRITE = [
  ".MMMMM.",
  "MMMMMMM",
  "M.M.M.M",
  "M.M.M.M",
  "M.M.M.M",
  ".......",
  ".......",
  ".......",
] as const;
/**
 * Bodyward nudge (fraction of a cell) applied to the tail when it draws in
 * `fillToCell`. The tail now runs the FULL 8-row long axis like the body, so it
 * already fills the cell pitch along travel and the wide end butts against the
 * preceding body segment without help — the nudge is 0 (kept as a named knob in
 * case the taper authoring changes and a small overlap is wanted again).
 */
const TAIL_CONNECT_SHIFT = 0;

/**
 * Resolve a BODY sprite character to a fill, given the segment's gradient color
 * `g` (the head→tail dim lerp applied per segment). `M` = that grey body pixel,
 * `R` = the sentinel's RED SEAM (a fixed hazard red, NOT lerped — the red rib
 * must stay vividly red on every segment so it reads as the sentinel's seam,
 * matching the head's red eyes and the red hazard rabbit), `.` = transparent.
 */
function bodyColors(g: string): (ch: string) => string | null {
  return (ch) => (ch === "M" ? g : ch === "R" ? RABBIT_RED : null);
}

/** Resolve a TAIL sprite character to a fill: `M` = the segment's grey tendril,
 *  else transparent. (The tail's tentacles are flat body-grey; no red here.) */
function tailColors(g: string): (ch: string) => string | null {
  return (ch) => (ch === "M" ? g : null);
}

/**
 * Clockwise 90° turns to aim the TIP-DOWN tail sprite along a trailing
 * direction `dir` (pointing from the body toward the tail tip — i.e. AWAY from
 * the snake). The tentacle tips are authored dangling DOWN (`{0,+1}` → 0 turns),
 * so this maps the trailing vector onto that rest pose. (The head is authored
 * facing UP and the tail tentacles DOWN — opposite ends of the creature — so the
 * two `*Quarters` mappings differ; see {@link headQuarters}.) Kept as its own
 * function for intent clarity.
 */
function tailQuarters(dir: Cell): number {
  if (dir.x === 1) return 3; // tip points right
  if (dir.x === -1) return 1; // tip points left
  if (dir.y === -1) return 2; // tip points up
  return 0; // tip points down (and the default)
}

/**
 * Rotate a bitmap (rows of equal-length strings) by `quarters` × 90° clockwise.
 * Used to aim the UP-authored sentinel head (and the tube-down body / tip-down
 * tail) at the snake's heading. Rotating the MATRIX (not the canvas) keeps every
 * "on" bit on an integer device-pixel block, so the sprite stays hard 8-bit
 * crisp at any angle — a canvas `rotate()` would resample and smear the pixels.
 * Square/non-square bitmaps both handled; the sentinel parts are 7×8, so a
 * 90°/270° turn yields an 8×7 matrix (the rasteriser fits the larger dim into
 * the cell, so it still centers cleanly).
 */
function rotateSprite(
  sprite: readonly string[],
  quarters: number
): readonly string[] {
  const q = ((quarters % 4) + 4) % 4;
  let rows: string[] = sprite.map((r) => r);
  for (let n = 0; n < q; n++) {
    const h = rows.length;
    const w = rows[0].length;
    // 90° clockwise: new[c][h-1-r] = old[r][c] → column-major read, bottom-up.
    const next: string[] = [];
    for (let c = 0; c < w; c++) {
      let line = "";
      for (let r = h - 1; r >= 0; r--) line += rows[r][c];
      next.push(line);
    }
    rows = next;
  }
  return rows;
}

/**
 * Clockwise 90° turns to map the UP-authored sentinel head sprite onto a
 * heading. The head bitmap's FRONT (the spiky `.M.M.M.` antennae row + the red
 * eye-cluster just below it) is at the TOP, so it is authored facing UP
 * (`{0,-1}`) → 0 turns. One CW turn takes "up" → "right", another → "down",
 * another → "left": `{1,0}` (right) → 1, `{0,+1}` (down) → 2, `{-1,0}` (left)
 * → 3. So the spikes + eyes always point the way the creature moves.
 */
function headQuarters(dir: Cell): number {
  if (dir.x === 1) return 1; // right
  if (dir.x === -1) return 3; // left
  if (dir.y === 1) return 2; // down
  return 0; // up (and the default)
}

/**
 * Unit step FROM cell `a` TO the adjacent cell `b`, wrap-corrected. Two
 * segments that are visually adjacent can sit on OPPOSITE edges of the board
 * once the snake crosses a wrap-wall seam (e.g. `a.x = GRID_W-1`, `b.x = 0`) —
 * the raw delta would be `+(GRID_W-1)` (a huge wrong vector). Each axis collapses
 * to the minimal toroidal step in {-1,0,+1}: if the raw delta's magnitude exceeds
 * half the grid, the real move went the SHORT way across the seam, so the sign is
 * flipped. Used to aim the tail tip along its true trailing direction.
 */
function wrapStep(a: Cell, b: Cell): Cell {
  const step = (d: number, span: number) => {
    if (d > span / 2) return d - span; // wrapped the short way (negative)
    if (d < -span / 2) return d + span; // wrapped the short way (positive)
    return d;
  };
  const dx = step(b.x - a.x, GRID_W);
  const dy = step(b.y - a.y, GRID_H);
  return { x: Math.sign(dx), y: Math.sign(dy) };
}

/** What a single `step()` produced — drives the hook's setState. */
export interface StepResult {
  dead: boolean;
  ate: boolean;
  score: number;
  length: number;
}

/**
 * Parse a color string to `[r,g,b]`. Accepts BOTH `#rrggbb` and the
 * `rgb(r,g,b)` form that {@link lerpHex} itself emits — so a lerp result can be
 * fed straight back into another lerp (the body's `S` scale darkens the
 * already-lerped per-segment `g`, see {@link bodyColors}).
 */
function parseColor(c: string): [number, number, number] {
  if (c[0] === "#") {
    const i = parseInt(c.slice(1), 16);
    return [(i >> 16) & 255, (i >> 8) & 255, i & 255];
  }
  const m = c.match(/-?\d+/g);
  return m ? [Number(m[0]), Number(m[1]), Number(m[2])] : [0, 0, 0];
}

/** Linear-interpolate two colors (`#rrggbb` or `rgb(...)`); `t` in [0,1]. */
function lerpHex(a: string, b: string, t: number): string {
  const [ar, ag, ab] = parseColor(a);
  const [br, bg, bb] = parseColor(b);
  const r = Math.round(ar + (br - ar) * t);
  const g = Math.round(ag + (bg - ag) * t);
  const bl = Math.round(ab + (bb - ab) * t);
  return `rgb(${r},${g},${bl})`;
}

/**
 * Deterministic glyph picker for the matrix-rain stream. Hashes the integer
 * inputs (a stream POSITION + a churn epoch, or a rabbit's cell + epoch) into an
 * index of {@link MATRIX_GLYPHS} — same inputs always yield the same glyph, so
 * the shimmer is reproducible (no `Math.random()` strobe, honoring the engine's
 * determinism intent). A cheap xorshift-style integer mix over a 2D-ish key;
 * `>>> 0` keeps it an unsigned 32-bit int before the modulo.
 */
function glyphFor(a: number, b: number): string {
  let h = (a * 73856093) ^ (b * 19349663);
  h = Math.imul(h ^ (h >>> 13), 0x5bd1e995);
  h ^= h >>> 15;
  return MATRIX_GLYPHS[(h >>> 0) % MATRIX_GLYPHS.length];
}

/**
 * The headless Snake engine — all mutable game state + the step + the canvas
 * draw, with NO React. The `useSnakeGame` hook owns one instance and drives it;
 * `<SnakeBoard>` only hosts the canvas. Keeping the simulation out of React
 * avoids per-frame re-renders (the canvas is imperative; React state changes
 * only on discrete events: eat / die / pause).
 *
 * The look is a minimal brutalist snake reskinned as a Matrix "sentinel": a
 * continuous lime pixel creature (a spiky-antennaed red-eyed HEAD over a
 * red-seamed BODY tube dimming gently toward a splaying multi-TENTACLE TAIL)
 * hunting small white rabbits — while a
 * red HAZARD rabbit appears as a deadly trap to route around (touching it
 * detonates the snake → game over), spawning fresh WITH every white capture
 * (the initial board is red-free) — on a clean dark field. Walls are
 * pass-through (wrap), so the run ends ONLY from a self-hit or the red hazard.
 * No matrix rain, no CRT scanlines, no glyph/letter aesthetic. ("Follow the
 * white rabbit.")
 */
export class SnakeEngine {
  private snake: Cell[] = [];

  private dir: Cell = { x: 1, y: 0 };
  private nextDir: Cell = { x: 1, y: 0 };
  /** The white rabbit (the staple food). */
  private pellet: Cell | null = null;
  /** The red HAZARD rabbit — a deadly trap; respawns with every white capture. */
  private redPellet: Cell | null = null;
  /**
   * The TRICKSTER rabbit (white body, red eyes) — a TWIN DECOY. Spawns TOGETHER
   * with a fresh white every {@link TRICKSTER_EVERY_N_WHITE}th capture and lingers
   * until the next white is eaten (or it's eaten, or the safety cap). At most one
   * at a time. `null` when none is on the board.
   */
  private trickster: Cell | null = null;
  /**
   * Safety-net step ceiling: the on-board trickster despawns no later than this
   * step even if the player never eats another white (so it can't haunt the board
   * forever). 0 = no active trickster. Set on spawn to `steps +
   * {@link TRICKSTER_LIFE_CAP}`; cleared on eat/despawn. The PRIMARY despawn is
   * "next white eaten" (see {@link step}); this is just the backstop.
   */
  private tricksterDespawnStep = 0;
  /**
   * Count of white rabbits eaten this run. Drives the trickster's capture-based
   * cadence (every {@link TRICKSTER_EVERY_N_WHITE}th white brings a decoy troll).
   */
  private whitesEaten = 0;
  /**
   * Total simulated steps (moves) this run. Used only for the trickster's
   * safety-cap ceiling now (cadence + primary despawn are capture-driven).
   * Distinct from {@link frame} (render frames, ~60fps), which drives draw pulses.
   */
  private steps = 0;
  /**
   * Outstanding "grow without points" debt. Set to {@link TRICKSTER_GROWTH} when
   * the trickster is eaten; each step skips the tail-pop and decrements, so the
   * snake grows one cell per step for N steps (the clean snake way — no instant
   * length jump, the tail just stops shrinking).
   */
  private pendingGrowth = 0;

  private stepMs = SPEED_MS.classic;
  private frame = 0;

  private score = 0;

  /** Live explosion chips. Empty unless a red-hazard death just fired; they
   *  animate out + down and fade, then clear. */
  private chips: Chip[] = [];
  /** Grid cell the explosion is centred on (chip offsets are relative to it). */
  private explosionCell: Cell | null = null;
  /** `performance.now()` the explosion started; 0 = no active explosion. */
  private explosionStart = 0;

  constructor(
    private speed: Speed = "classic",
    // Wrap-walls is the ACTIVE behavior: edges are pass-through (exit one edge,
    // re-enter the opposite). The run ends ONLY from a self-hit or the red
    // hazard — never from a wall. The outer frame stays as the visual board edge.
    private wrapWalls = true
  ) {}

  get stepInterval(): number {
    return this.stepMs;
  }

  setSpeed(speed: Speed) {
    this.speed = speed;
  }
  setWrap(wrap: boolean) {
    this.wrapWalls = wrap;
  }

  /** Reset to a fresh run (centre snake + a pellet). */
  reset() {
    const cx = Math.floor(GRID_W / 2);
    const cy = Math.floor(GRID_H / 2);
    this.snake = [
      { x: cx, y: cy },
      { x: cx - 1, y: cy },
      { x: cx - 2, y: cy },
    ];
    this.dir = { x: 1, y: 0 };
    this.nextDir = { x: 1, y: 0 };
    this.stepMs = SPEED_MS[this.speed];
    this.score = 0;
    // The initial board is red-FREE: only a white rabbit. Red first appears on
    // the FIRST capture, then with every capture thereafter. The trickster is
    // absent until the Nth white capture (it's CAPTURE-driven — a decoy twin of
    // the fresh white), so the initial board has none.
    this.redPellet = null;
    this.trickster = null;
    this.tricksterDespawnStep = 0;
    this.whitesEaten = 0;
    this.steps = 0;
    this.pendingGrowth = 0;
    this.chips = [];
    this.explosionCell = null;
    this.explosionStart = 0;
    this.spawnPellet();
  }

  /** Queue a direction change; no-op on a direct reverse. */
  steer(x: number, y: number) {
    if (x === -this.dir.x && y === -this.dir.y) return;
    this.nextDir = { x, y };
  }

  /**
   * Pick a random free cell, avoiding the snake, any `extra` cells (the other
   * rabbit), and any `blocked` keys (e.g. the head-path exclusion). Owner-
   * emphasized: rabbits never land on the snake or on each other. Guards the
   * retry loop so a near-full board can't spin forever — on exhaustion it falls
   * back to the last sampled cell (acceptable: the board is huge vs the snake).
   */
  private freeCell(extra: (Cell | null)[] = [], blocked?: Set<string>): Cell {
    const occupied = new Set(this.snake.map((s) => `${s.x},${s.y}`));
    for (const c of extra) if (c) occupied.add(`${c.x},${c.y}`);
    let x = 0;
    let y = 0;
    let guard = 0;
    do {
      x = (Math.random() * GRID_W) | 0;
      y = (Math.random() * GRID_H) | 0;
      guard++;
    } while (
      (occupied.has(`${x},${y}`) || blocked?.has(`${x},${y}`)) &&
      guard < 400
    );
    return { x, y };
  }

  /** Spawn a fresh white rabbit, avoiding the snake + the red hazard + the
   *  trickster. (The red hazard is spawned SEPARATELY, only on a capture — never
   *  at reset.) */
  private spawnPellet() {
    this.pellet = this.freeCell([this.redPellet, this.trickster]);
  }

  /**
   * Place (or reposition) the single red HAZARD rabbit on a free cell that
   * collides with neither the snake nor the white rabbit — AND is outside the
   * head-path exclusion zone, so the hazard can never materialise where the
   * player has zero reaction time (see {@link headExclusion}). Wrap-aware: the
   * exclusion wraps around edges, matching pass-through walls.
   */
  private spawnRed() {
    this.redPellet = this.freeCell(
      [this.pellet, this.trickster],
      this.headExclusion()
    );
  }

  /**
   * Place the single TRICKSTER rabbit (the decoy twin) on a free cell that
   * collides with neither the snake, the white food, nor the red hazard, and
   * stamp its safety-cap ceiling (`steps + TRICKSTER_LIFE_CAP`). It honors the
   * {@link headExclusion} zone so it never materialises right on the head (where
   * it'd be an unavoidable accidental grab). It is spawned AFTER the fresh white
   * (which `spawnPellet()` placed first), and excludes that white's cell, so the
   * two near-identical rabbits sit on DISTINCT cells — both on the board at once,
   * confusable at a glance but never overlapping. Only ONE at a time; the caller
   * only spawns when `trickster` is null.
   */
  private spawnTrickster() {
    this.trickster = this.freeCell(
      [this.pellet, this.redPellet],
      this.headExclusion()
    );
    this.tricksterDespawnStep = this.steps + TRICKSTER_LIFE_CAP;
  }

  /**
   * The set of cells the red hazard is forbidden to spawn into, keyed
   * `"x,y"`: the next {@link RED_AHEAD} cells straight ahead of the head on its
   * current heading (the unavoidable path) PLUS a {@link RED_RADIUS} Chebyshev
   * ring around the head. Both are wrap-corrected (cells that fall off an edge
   * re-enter the opposite side) because walls are now pass-through, so the
   * "path ahead" genuinely continues across the seam.
   */
  private headExclusion(): Set<string> {
    const head = this.snake[0];
    const blocked = new Set<string>();
    const add = (x: number, y: number) => {
      const wx = ((x % GRID_W) + GRID_W) % GRID_W;
      const wy = ((y % GRID_H) + GRID_H) % GRID_H;
      blocked.add(`${wx},${wy}`);
    };
    // Small radius around the head (includes the head itself).
    for (let dy = -RED_RADIUS; dy <= RED_RADIUS; dy++) {
      for (let dx = -RED_RADIUS; dx <= RED_RADIUS; dx++) {
        add(head.x + dx, head.y + dy);
      }
    }
    // The reaction-zero path directly ahead on the current heading.
    for (let i = 1; i <= RED_AHEAD; i++) {
      add(head.x + this.dir.x * i, head.y + this.dir.y * i);
    }
    return blocked;
  }

  /**
   * Advance one tick. Returns the outcome for the hook to project to state.
   * `animate` (default true) gates the red-hazard EXPLOSION burst — under
   * reduced motion the hook passes `false`, so the death is instant and silent
   * (no particles), matching the project's reduced-motion contract.
   */
  step(animate = true): StepResult {
    this.dir = this.nextDir;
    this.steps++;
    const head = this.snake[0];
    let nx = head.x + this.dir.x;
    let ny = head.y + this.dir.y;

    const out = nx < 0 || ny < 0 || nx >= GRID_W || ny >= GRID_H;
    if (out) {
      if (this.wrapWalls) {
        nx = (nx + GRID_W) % GRID_W;
        ny = (ny + GRID_H) % GRID_H;
      } else {
        return this.dead();
      }
    }

    // The red rabbit is a DEADLY HAZARD: touching it ends the run. Detonate at
    // the hazard cell and die with the white-rabbit score only (no red points).
    const hitRed =
      !!this.redPellet && nx === this.redPellet.x && ny === this.redPellet.y;
    if (hitRed) {
      if (animate) this.explodeAt({ x: nx, y: ny });
      this.redPellet = null;
      return this.dead();
    }

    // TRICKSTER (white body, red eyes): +length, ZERO score. Checked AFTER the
    // red death but BEFORE the white food, so the collision order is
    // red(death) → trickster(+len) → white(+score) → self.
    const ateTrickster =
      !!this.trickster && nx === this.trickster.x && ny === this.trickster.y;

    // The trickster + white never share a cell (spawn exclusion), and the
    // trickster is resolved first, so white only triggers when the trickster
    // didn't.
    const ateWhite =
      !ateTrickster &&
      !!this.pellet &&
      nx === this.pellet.x &&
      ny === this.pellet.y;

    // The snake grows this tick if it ate ANY rabbit OR if it still owes growth
    // debt from a past trickster bite — in all those cases the tail stays put, so
    // the tail cell is a legal landing and must NOT count as a self-collision.
    const growsThisStep = ateWhite || ateTrickster || this.pendingGrowth > 0;
    const bodyToCheck = growsThisStep ? this.snake : this.snake.slice(0, -1);
    if (bodyToCheck.some((s) => s.x === nx && s.y === ny)) {
      return this.dead();
    }

    this.snake.unshift({ x: nx, y: ny });

    if (ateTrickster) {
      // Troll bite: +length via growth debt (one cell/step over N steps), +0
      // score. Does NOT spawn a fresh white/red, does NOT touch best/rank — those
      // ride the score, which is unchanged. Clearing the trickster cancels its
      // safety cap; the next decoy is due on the next Nth white capture.
      this.pendingGrowth += TRICKSTER_GROWTH;
      this.trickster = null;
      this.tricksterDespawnStep = 0;
      // Grow this very step: skip the tail-pop, draw down one unit of debt.
      this.pendingGrowth--;
    } else if (ateWhite) {
      this.score += SCORE_PER_EAT;
      this.whitesEaten++;
      this.stepMs = Math.max(STEP_FLOOR, this.stepMs - STEP_ACCEL);
      // Eating the REAL white resolves any active decoy round: its twin troll has
      // done its job (you picked correctly), so clear it before the next pair can
      // form. The PRIMARY trickster despawn lives here — "lingers until the next
      // white is eaten" — not on a move-timer.
      this.trickster = null;
      this.tricksterDespawnStep = 0;
      // Every white capture spawns a fresh white AND (re)spawns the red hazard at
      // the SAME moment — they appear together on every pellet. Order matters: the
      // white first (so red avoids it), then red — which also honors the head-path
      // exclusion (it reads the just-advanced head + heading). At reset there is no
      // capture, so the initial board stays red-free.
      this.spawnPellet();
      this.spawnRed();
      // Every Nth white, the freshly-spawned white gets a confusable TWIN: a
      // red-eyed decoy troll, placed AFTER (and off of) the new white + red, so
      // the two near-identical white rabbits are on the board together. The decoy
      // then lingers until the NEXT white is eaten (cleared above) or the safety
      // cap (below).
      if (this.whitesEaten % TRICKSTER_EVERY_N_WHITE === 0) {
        this.spawnTrickster();
      }
    } else if (this.pendingGrowth > 0) {
      // Outstanding trickster debt: keep the tail (grow) and draw down the debt.
      this.pendingGrowth--;
    } else {
      this.snake.pop();
    }

    // TRICKSTER safety net: the decoy normally despawns when the next white is
    // eaten (see the ateWhite branch). This is the BACKSTOP — if the player simply
    // never eats another white, the troll still leaves at its life-cap ceiling so
    // it can't haunt the board forever. (Spawn + primary despawn are both
    // capture-driven; this is the only move-count touchpoint left.)
    if (this.trickster && this.steps >= this.tricksterDespawnStep) {
      this.trickster = null;
      this.tricksterDespawnStep = 0;
    }

    return {
      dead: false,
      ate: ateWhite || ateTrickster,
      score: this.score,
      length: this.snake.length,
    };
  }

  /** Seed an explosion burst centred on `cell` (chips spray out + fall). The
   *  draw loop animates and clears it; under reduced motion it never seeds. */
  private explodeAt(cell: Cell) {
    this.explosionCell = cell;
    this.explosionStart = 0; // stamped on the first draw frame
    this.chips = Array.from({ length: EXPLOSION_COUNT }, () => {
      const ang = Math.random() * Math.PI * 2;
      const spd = 0.04 + Math.random() * 0.1; // cell-units / frame
      return {
        ox: 0,
        oy: 0,
        vx: Math.cos(ang) * spd,
        vy: Math.sin(ang) * spd - 0.05, // a touch of initial lift
        size: 0.12 + Math.random() * 0.16, // fraction of a cell
        color: EXPLOSION_COLORS[(Math.random() * EXPLOSION_COLORS.length) | 0],
      };
    });
  }

  private dead(): StepResult {
    return {
      dead: true,
      ate: false,
      score: this.score,
      length: this.snake.length,
    };
  }

  // ---------- canvas draw ----------

  /** Faint muted cell grid so the player can gauge distance / line up moves.
   *  Internal lines only (no outer frame — the board stays borderless). */
  private drawGrid(ctx: CanvasRenderingContext2D, cssW: number, cssH: number) {
    const cell = cssW / GRID_W; // === cssH / GRID_H (square cells, pinned aspect)
    ctx.strokeStyle = GRID_LINE;
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (let i = 1; i < GRID_W; i++) {
      const p = Math.round(i * cell) + 0.5; // +0.5 → crisp 1px line
      ctx.moveTo(p, 0);
      ctx.lineTo(p, cssH);
    }
    for (let i = 1; i < GRID_H; i++) {
      const p = Math.round(i * cell) + 0.5;
      ctx.moveTo(0, p);
      ctx.lineTo(cssW, p);
    }
    ctx.stroke();
    // Outer frame — the board edges (the lines above are internal only, so the
    // canvas rim would otherwise be unbordered). A stronger line than the inner
    // grid so the field boundary always reads, on any theme bg.
    ctx.strokeStyle = FRAME_LINE;
    ctx.strokeRect(0.5, 0.5, cssW - 1, cssH - 1);
  }

  /**
   * Generic pixel-art sprite rasteriser — centers any bitmap in `at`'s cell and
   * paints it crisp at any cell size. `sprite` is rows of equal-length strings;
   * `resolve(ch)` maps each character to a fill color (or `null` = transparent,
   * board shows through). Serves the rabbits (single-fill) AND the multi-color
   * snake head; `scale` (default 1) lets the hazard rabbit pulse.
   *
   * `yOffsetCells` (default 0) shifts the WHOLE figure vertically by a fraction
   * of a cell — used ONLY by the trickster's laughing bob, so food / hazard /
   * head / body / tail stay dead-centred. The offset is converted to device px
   * and snapped to the device-pixel grid (alongside the centring round) so the
   * sprite stays crisp even mid-bob.
   *
   * `refDim` (default 0 = "fit this sprite's own larger dim") overrides the
   * dimension the per-bit block is sized against. The SNAKE parts pass
   * {@link SNAKE_REF_DIM} (= 8) so head/body/tail share ONE block size and keep
   * their authored relative proportions (wide head, narrow body, short tail) —
   * see {@link SNAKE_REF_DIM}. The rabbits pass nothing, so each still fits its
   * own bounding box into the cell.
   *
   * The sprite is rasterised on the **device-pixel** grid: one sprite bit = an
   * INTEGER block of `dpr`-scaled pixels (floored, but never below 1), and the
   * whole figure is snapped to a device-pixel origin. This is the crux of the
   * "no sprite" trap — sizing each bit as a fractional CSS value
   * (`cell·0.82/SPRITE_W`) at small cells falls below one device pixel, so
   * `Math.round` collapses most rects to zero width/height and the figure
   * fragments into nothing. Forcing an integer ≥1 device-pixel block guarantees
   * every "on" bit paints a crisp, smoothing-free square at any cell size — hard
   * 8-bit pixels, never a smooth blob. The ctx carries a `dpr` transform, so we
   * convert device units back to CSS units (÷`dpr`) before filling. The fill
   * loop groups by color and re-fits the box to the (possibly rotated) bitmap's
   * own dimensions, so a 90°-rotated head (8×7) still centers correctly.
   */
  private drawSprite(
    ctx: CanvasRenderingContext2D,
    cell: number,
    dpr: number,
    at: Cell,
    sprite: readonly string[],
    resolve: (ch: string) => string | null,
    scale = 1,
    yOffsetCells = 0,
    refDim = 0,
    // BODY/TAIL connection mode: size the per-bit block via ceil-to-cell so the
    // figure span always covers the cell pitch and segments butt up with no gap
    // (see the block calc below). Used by the body + tail; head/rabbits keep the
    // ~0.85 floor-fit so the head stays the proud leading wedge.
    fillToCell = false,
    // Horizontal companion to `yOffsetCells` (fraction of a cell). Used by the
    // TAIL to nudge its WIDE end flush against the body cell border (so the body
    // overflow overlaps it and the tube connects); 0 for everything else.
    xOffsetCells = 0
  ) {
    const sw = sprite[0].length;
    const sh = sprite.length;
    // Target figure box (square) in DEVICE pixels, then quantise to an integer
    // block per sprite bit (≥1) so the sprite is always crisp and never empty.
    const boxDev = cell * SPRITE_FILL * scale * dpr;
    // The block is sized against `refDim` when given (the snake parts share one
    // reference so every snake pixel is the same size and the authored
    // proportions hold), else against this sprite's OWN larger dim (rabbits fit
    // their own box into the cell). `refDim` is taken AFTER rotation-invariant
    // max(sw,sh) so a rotated 8×N snake part still keys off 8.
    const fitDim = refDim > 0 ? refDim : Math.max(sw, sh);
    // BODY: ceil(cell·dpr / refDim) so the span (block·refDim) is ALWAYS ≥ the
    // cell pitch — each segment slightly overflows its cell and connects to its
    // neighbours on every side (no staircase gap). Floor-fitting (the default)
    // would leave a sub-block gap. The overlap is invisible: adjacent body
    // segments share the lime fill.
    const block = fillToCell
      ? Math.max(1, Math.ceil((cell * dpr) / fitDim))
      : Math.max(1, Math.floor(boxDev / fitDim));
    const spriteWdev = block * sw;
    const spriteHdev = block * sh;
    // Center within the cell (in device px), snapped to a device-pixel origin.
    // The optional vertical bob is added (in device px) BEFORE the round, so the
    // shifted figure still lands on whole device pixels — crisp even mid-bob.
    const cellDev = cell * dpr;
    const yShiftDev = yOffsetCells * cellDev;
    const xShiftDev = xOffsetCells * cellDev;
    const leftDev = Math.round(
      at.x * cellDev + (cellDev - spriteWdev) / 2 + xShiftDev
    );
    const topDev = Math.round(
      at.y * cellDev + (cellDev - spriteHdev) / 2 + yShiftDev
    );

    ctx.imageSmoothingEnabled = false;
    const blockCss = block / dpr;
    for (let row = 0; row < sh; row++) {
      const bits = sprite[row];
      const yDev = topDev + row * block;
      for (let col = 0; col < sw; col++) {
        const color = resolve(bits[col]);
        if (!color) continue; // transparent → board shows through
        ctx.fillStyle = color;
        // Device px → CSS px (the ctx is pre-scaled by `dpr`).
        ctx.fillRect(
          (leftDev + col * block) / dpr,
          yDev / dpr,
          blockCss,
          blockCss
        );
      }
    }
  }

  /** Rabbit (white staple / red hazard) — a single-fill bitmap; `scale` pulses
   *  the hazard. Thin wrapper over the generic {@link drawSprite}. */
  private drawRabbit(
    ctx: CanvasRenderingContext2D,
    cell: number,
    dpr: number,
    at: Cell,
    color: string,
    scale = 1
  ) {
    this.drawSprite(
      ctx,
      cell,
      dpr,
      at,
      RABBIT_SPRITE,
      (ch) => (RABBIT_COLORS[ch] === "_FILL_" ? color : null),
      scale
    );
  }

  /**
   * TRICKSTER rabbit — white body + red eyes, bobbing vertically like it's
   * laughing. `animate` gates the bob: under reduced motion `bob` is 0, so it
   * renders as a legible STATIC red-eyed white rabbit (no jiggle). The bob is a
   * fast sine on the shared render-frame counter, amplitude {@link
   * TRICKSTER_BOB_AMP} cells, passed through {@link drawSprite}'s vertical-offset
   * path so ONLY the trickster moves. It laughs in intermittent "ha-ha-ha"
   * bursts the whole time it's on the board (a white-to-white round), so the
   * giggle reads as "this one is mocking you" — the visual tell, alongside the
   * red eyes, that this near-identical white is the decoy.
   */
  private drawTrickster(
    ctx: CanvasRenderingContext2D,
    cell: number,
    dpr: number,
    at: Cell,
    animate: boolean
  ) {
    // Laugh in bursts: jiggle for the first BURST frames of each CYCLE, hold
    // still for the rest. The sine runs off the in-burst phase so it starts and
    // ends near zero (no visible snap when the burst stops). It free-runs on the
    // render-frame counter; across the trickster's short life this is several
    // "ha-ha-ha" bursts, reading as continuous laughter for its whole stay.
    const phase = this.frame % TRICKSTER_BOB_CYCLE;
    const bob =
      animate && phase < TRICKSTER_BOB_BURST
        ? TRICKSTER_BOB_AMP * Math.sin(phase * TRICKSTER_BOB_FREQ)
        : 0;
    this.drawSprite(
      ctx,
      cell,
      dpr,
      at,
      TRICKSTER_SPRITE,
      tricksterColor,
      1,
      bob
    );
  }

  // ---------- glyph (matrix-rain) renderer (SNAKE_RENDER === "glyph") ----------

  /**
   * Draw ONE matrix glyph centred in cell `at`, in `color`, with an optional
   * vertical bob (`yOffsetCells`, fraction of a cell — used by the trickster
   * laugh). The font is sized to {@link GLYPH_FILL} of the cell and the draw
   * origin is snapped to the device-pixel grid (the ctx is `dpr`-scaled, so we
   * snap in device px then divide back) — keeping the glyph from blurring across
   * a half-pixel boundary even though text isn't a hard pixel grid. `textAlign`/
   * `textBaseline` are centred so the glyph sits dead-centre regardless of font
   * metrics.
   */
  private drawGlyph(
    ctx: CanvasRenderingContext2D,
    cell: number,
    dpr: number,
    at: Cell,
    glyph: string,
    color: string,
    yOffsetCells = 0
  ) {
    const sizeCss = cell * GLYPH_FILL;
    // Centre of the cell, in device px, snapped to a whole device pixel so the
    // glyph baseline lands crisply.
    const cellDev = cell * dpr;
    const cxDev = Math.round((at.x + 0.5) * cellDev);
    // `textBaseline:"middle"` centres on the em-box middle, which for these mono
    // glyphs sits a hair ABOVE the optical centre — nudge down ~6% of a cell so
    // the glyph reads centred in its square.
    const cyDev =
      Math.round((at.y + 0.5 + yOffsetCells) * cellDev) +
      Math.round(cellDev * 0.06);
    // The 2D context can't resolve CSS vars (same reason the palette is literal
    // hex), so `var(--font-mono)` made the whole font string invalid → it was
    // silently ignored and the weight never applied. Use a literal monospace
    // stack so the weight actually lands.
    ctx.font = `800 ${sizeCss}px ui-monospace, "JetBrains Mono", Menlo, monospace`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillStyle = color;
    ctx.fillText(glyph, cxDev / dpr, cyDev / dpr);
  }

  /**
   * Draw the snake as a MATRIX-RAIN STREAM that follows its body. Each cell is
   * one glyph; the HEAD is the bright leading glyph ({@link GLYPH_HEAD}) and the
   * body fades head→tail from {@link GLYPH_BODY} (bright green) to
   * {@link GLYPH_TAIL} (deep green), so the whole figure reads like a rain
   * column bent along the path — brightest where the creature is "now", dimming
   * into its wake.
   *
   * Glyph CHURN (the rain flicker): each STREAM POSITION (index from the head,
   * NOT the moving cell) re-rolls its glyph every {@link GLYPH_CHURN_FRAMES}
   * render frames; the head re-rolls faster ({@link GLYPH_HEAD_CHURN_FRAMES}).
   * The glyph is chosen by {@link glyphFor} from `(position, churnEpoch)` — fully
   * deterministic, so the shimmer is reproducible and never a random strobe.
   * Seeding by position-from-head (not by board cell) means the pattern reads as
   * a STABLE stream that flickers in place, the way a rain column does, rather
   * than scrambling on every move.
   *
   * Painted TAIL→HEAD so the brighter near-head glyphs land on top at any
   * overlap. `animate=false` (reduced motion) freezes the churn to epoch 0 — a
   * legible STATIC stream, no flicker.
   */
  private drawSnakeGlyphs(
    ctx: CanvasRenderingContext2D,
    cell: number,
    dpr: number,
    animate: boolean
  ) {
    const len = this.snake.length;
    const headEpoch = animate
      ? Math.floor(this.frame / GLYPH_HEAD_CHURN_FRAMES)
      : 0;
    const bodyEpoch = animate ? Math.floor(this.frame / GLYPH_CHURN_FRAMES) : 0;
    for (let i = len - 1; i >= 0; i--) {
      const seg = this.snake[i];
      if (i === 0) {
        // HEAD — bright leading glyph, fast flicker.
        this.drawGlyph(ctx, cell, dpr, seg, glyphFor(0, headEpoch), GLYPH_HEAD);
      } else {
        // Body fades from bright green just behind the head to deep green at the
        // tail (eased so most of the stream stays clearly green and only the
        // last cells go dim).
        const t = len <= 1 ? 0 : i / (len - 1);
        const color = lerpHex(GLYPH_BODY, GLYPH_TAIL, t * 0.9);
        this.drawGlyph(ctx, cell, dpr, seg, glyphFor(i, bodyEpoch), color);
      }
    }
  }

  /**
   * Advance + paint the explosion chip burst (square brutalist chips), centred
   * on {@link explosionCell}, in CSS-px space. Chips spray out, fall under
   * gravity and fade over {@link EXPLOSION_MS}; then the burst self-clears. Time
   * is read from `performance.now()` (the burst is decoupled from the step
   * timer, so it plays at a steady wall-clock rate). No-op once cleared.
   */
  private drawExplosion(ctx: CanvasRenderingContext2D, cell: number) {
    if (!this.explosionCell || this.chips.length === 0) return;
    const now = performance.now();
    if (this.explosionStart === 0) this.explosionStart = now;
    const life = (now - this.explosionStart) / EXPLOSION_MS;
    if (life >= 1) {
      this.chips = [];
      this.explosionCell = null;
      this.explosionStart = 0;
      return;
    }

    const cx = (this.explosionCell.x + 0.5) * cell;
    const cy = (this.explosionCell.y + 0.5) * cell;
    ctx.globalAlpha = 1 - life * life; // ease-out fade
    for (const c of this.chips) {
      c.vy += 0.008; // gravity (cell-units / frame²)
      c.ox += c.vx;
      c.oy += c.vy;
      const px = cx + c.ox * cell;
      const py = cy + c.oy * cell;
      const s = c.size * cell;
      ctx.fillStyle = c.color;
      ctx.fillRect(px - s / 2, py - s / 2, s, s); // square chips, no rotation
    }
    ctx.globalAlpha = 1;
  }

  /** Paint the opaque gray field + grid behind the overlay. */
  drawIdle(ctx: CanvasRenderingContext2D, cssW: number, cssH: number) {
    ctx.fillStyle = BOARD_BG;
    ctx.fillRect(0, 0, cssW, cssH);
    this.drawGrid(ctx, cssW, cssH);
  }

  /**
   * Draw the live game: clear field → pellet → body → head. `dpr` is the canvas
   * device-pixel ratio (the ctx is pre-scaled by it); the rabbit sprite needs it
   * to rasterise on whole device pixels (see {@link drawRabbit}).
   */
  drawGame(
    ctx: CanvasRenderingContext2D,
    cssW: number,
    cssH: number,
    dpr: number,
    animate: boolean
  ) {
    const cell = cssW / GRID_W; // === cssH / GRID_H (square cells)
    this.frame++;
    // Opaque gray field, repainted each frame, then the grid.
    ctx.fillStyle = BOARD_BG;
    ctx.fillRect(0, 0, cssW, cssH);
    this.drawGrid(ctx, cssW, cssH);

    // Rabbits — the white staple FOOD + (when present) the red HAZARD rabbit +
    // the white-bodied red-eyed TRICKSTER decoy. ALWAYS the bunny-silhouette
    // SPRITES, in BOTH render modes (owner preference — the pixel bunnies read
    // better than the glyph rabbits, even when the snake itself is the green
    // matrix-rain glyph stream). The red hazard breathes (a size/flicker pulse,
    // frozen under reduced motion) so the DANGER reads as alive and the trickster
    // laughs (a vertical bob), keeping all three apart at a glance — readability
    // is non-negotiable.
    if (this.pellet) {
      this.drawRabbit(ctx, cell, dpr, this.pellet, RABBIT_WHITE);
    }
    if (this.redPellet) {
      const pulse = animate ? 1 + 0.12 * Math.sin(this.frame * 0.16) : 1;
      this.drawRabbit(ctx, cell, dpr, this.redPellet, RABBIT_RED, pulse);
    }
    if (this.trickster) {
      this.drawTrickster(ctx, cell, dpr, this.trickster, animate);
    }

    // Snake — the matrix-rain GLYPH stream (glyph mode) follows the body in one
    // call (head/body fade + churn handled inside); skip the entire sprite path
    // below. Returns early after the head + explosion so the sprite head doesn't
    // double-draw.
    if (SNAKE_RENDER === "glyph") {
      this.drawSnakeGlyphs(ctx, cell, dpr, animate);
      this.drawExplosion(ctx, cell);
      return;
    }

    // Body + tail — sentinel pixel sprites, dimming from head toward the tail
    // (the lime gradient). Indices 1..len-2 use the BODY sprite; the LAST segment
    // uses the TAIL sprite. Both share the head's reference block
    // ({@link SNAKE_REF_DIM}) so every snake pixel is one size and the creature
    // reads continuous (head, body and tail are all 7×8).
    //
    // The body is the sentinel tube (5-wide of 7, a red seam banding it) drawn in
    // `fillToCell` mode and ROTATED to align its long/fill axis with the
    // segment's direction of travel. So consecutive segments butt end-to-end into
    // one continuous tube on straight runs (no gap); on a turn the two
    // perpendicular tubes overlap at the shared corner cell (a tiny inner seam is
    // accepted). The red seam recurs down the body like a spine.
    //
    // The TAIL is the splaying multi-tentacle end: it is rotated so its tentacles
    // trail AWAY from the body, and (so it connects to the last body segment) it
    // ALSO draws in `fillToCell` — its wide cap fills the cell while the authored
    // tentacles dangle off the trailing edge. Painted tail→neck so the segments
    // nearer the head overlap on top.
    const bodyLen = this.snake.length - 1;
    for (let j = bodyLen; j >= 1; j--) {
      const seg = this.snake[j];
      const t = bodyLen <= 1 ? 0 : (j - 1) / (bodyLen - 1);
      const g = lerpHex(SENTINEL, SENTINEL_DIM, t * 0.85);
      if (j === bodyLen) {
        // Trailing direction: from the previous segment toward the tail tip
        // (wrap-corrected so a seam-crossing pair doesn't read as a huge jump).
        const trail = wrapStep(this.snake[j - 1], seg);
        const tailSprite = rotateSprite(TAIL_SPRITE, tailQuarters(trail));
        // The tail draws in `fillToCell` (its wide cap fills the cell, the
        // tentacles splay off the trailing edge) and is nudged BODYWARD by
        // TAIL_CONNECT_SHIFT (in the −trail direction) so its wide cap sits flush
        // at the body's cell border — the last body segment's overflow then
        // overlaps it, so body→tail connects with no gap and the tentacles trail.
        this.drawSprite(
          ctx,
          cell,
          dpr,
          seg,
          tailSprite,
          tailColors(g),
          BODY_TAIL_SCALE,
          -trail.y * TAIL_CONNECT_SHIFT,
          SNAKE_REF_DIM,
          false,
          -trail.x * TAIL_CONNECT_SHIFT
        );
      } else {
        // Middle segment: the sentinel tube (5-wide of 7, red-seamed) ROTATED to
        // run along the segment's FLOW — the toroidal step from this segment
        // toward the next one nearer the HEAD (`snake[j-1]`). In `fillToCell` the
        // long (flow) axis overflows the cell so consecutive segments butt
        // end-to-end into one continuous tube; the seam bands across the flow.
        // On a turn the perpendicular neighbour overlaps at the corner cell,
        // minimising the inner seam.
        const flow = wrapStep(seg, this.snake[j - 1]);
        const bodySprite = rotateSprite(BODY_SPRITE, bodyQuarters(flow));
        this.drawSprite(
          ctx,
          cell,
          dpr,
          seg,
          bodySprite,
          bodyColors(g),
          BODY_TAIL_SCALE,
          0,
          SNAKE_REF_DIM,
          false
        );
      }
    }

    // Head — the pixel-art sentinel head sprite (lime body + red eye-cluster +
    // spiky antennae), pre-rotated in 90° steps to face the current heading so
    // the spikes/eyes always point the way the creature moves. Pre-rotating the
    // BITMAP (not the canvas) keeps the pixels axis-aligned and crisp. Same
    // device-pixel-block rasteriser + ~0.85 cell fill as the rabbits, so the head
    // reads as the bright leading segment, cohesive with the body tube.
    const h = this.snake[0];
    const headSprite = rotateSprite(HEAD_SPRITE, headQuarters(this.dir));
    this.drawSprite(
      ctx,
      cell,
      dpr,
      h,
      headSprite,
      (ch) => HEAD_COLORS[ch] ?? null,
      1,
      0,
      SNAKE_REF_DIM
    );

    // Explosion chips (red-hazard death) draw on top of the snake, under the
    // React game-over overlay. Only ever non-empty when a hazard death fired and
    // motion is allowed (the hook gates seeding on reduced motion).
    this.drawExplosion(ctx, cell);
  }
}
