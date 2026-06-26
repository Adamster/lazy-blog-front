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

/**
 * ============================ RABBIT VALUE SYSTEM ============================
 *
 * "Follow the Rabbit" core loop (owner spec): the board ALWAYS carries EXACTLY FOUR
 * rabbits — ONE POSITIVE (a bonus that ADDS points), TWO NEGATIVE penalties, and ONE
 * KILLER (always present, its own dedicated slot — NOT a rare escalation). Eating ANY
 * of the four RE-GENERATES the WHOLE field: fresh cells for all four (the killer
 * relocates too) AND freshly-rolled ranks for the positive + the two negatives.
 * Nothing is on a clock — the field only ever changes the instant the player eats.
 *
 * THE THREE "AVOID" RABBITS are the two negatives + the killer (eating the killer is
 * death; eating a negative costs score). Only the positive is safe to chase.
 *
 * VISUAL MODEL (the final scheme — NO stripes on the bonus):
 *  - POSITIVE = a PLAIN WHITE bunny, no stripes, no rank — and a FIXED +10 (it is NOT
 *    rolled by magnitude). It's the prize the player chases; white = good.
 *  - NEGATIVE = a white bunny with `rank + 1` RED ear stripes ({@link stripeColor} +
 *    {@link RABBIT_RED}) → 1 / 2 / 3 stripes for −10 / −20 / −30, PLUS RED eyes. So the
 *    count of RED stripes reads the size of the penalty at a glance.
 *  - KILLER = the SAME white bunny silhouette filled SOLID RED, no stripes, with BLACK
 *    eyes (red eyes would vanish on the red body) in the SAME cells as the negatives'
 *    eyes — solid red = death. So the read is dead simple: white = good, red stripes
 *    (1–3) = penalty, all-red = death; and the "dangerous" rabbits (negatives + killer)
 *    share visible eyes in one spot (red on white, black on red).
 * Body silhouette + size are IDENTICAL across all four (the killer shares the exact
 * {@link RABBIT_PLAIN} geometry). The MOTION is the subtler second tell: the white +10
 * TWITCHES about its axis (the nav-bar `.mono-jiggle`), the negatives BOB + laugh-
 * SHAKE, the killer slowly MENACE-pulses.
 *
 * NEGATIVE MAGNITUDES are {@link RABBIT_VALUES} (10/20/30 — a 3-tier penalty ladder,
 * the old −50 is GONE), rolled by {@link RABBIT_VALUE_WEIGHTS} where bigger = rarer.
 * The two negative slots roll INDEPENDENTLY and MAY COINCIDE (two −10 at once is fine;
 * there is no de-dup between them). The positive is a fixed +10 (no roll); the killer
 * has no magnitude (lethal, not scored) and no roll — it's simply always there.
 *
 * BALANCE GUARDS:
 *  - SCORE is CLAMPED at >= 0 ({@link SCORE_FLOOR}) — a penalty costs progress, never
 *    a meaningless negative trophy / negative leaderboard.
 *  - LENGTH: every NON-lethal eat (the +10 or a negative) grows the snake by EXACTLY
 *    +1 cell — nothing shrinks. The KILLER never grows it (eating it ends the run).
 *  - LETHALITY: exactly ONE kind is lethal — the KILLER. Eating it is INSTANT game
 *    over, like a wall/self hit. The walls (when not wrapping) and the snake's own
 *    body are still the other death causes; the +10 and the negatives are never lethal.
 *  - AVOIDABILITY: all THREE avoid rabbits (the two negatives AND the killer) honour
 *    the head-path spawn exclusion ({@link headExclusion}) so a −score grab — or an
 *    instant DEATH — can never materialise on the head's unavoidable next cells. The
 *    +10 is a free target (no exclusion) — it may appear anywhere, even in your lap.
 */

/** The FIXED score of the positive rabbit — always +10 (no per-magnitude roll). */
const POSITIVE_VALUE = 10;

/**
 * The NEGATIVE penalty MAGNITUDES — a 3-tier ladder (10/20/30; the old −50 is gone).
 * The array index is the negative's RANK (0..2), which maps to its RED EAR-STRIPE
 * COUNT (`rank + 1` → 1 / 2 / 3 stripes). Only the negatives use this; the positive is
 * a fixed {@link POSITIVE_VALUE}.
 */
const RABBIT_VALUES = [10, 20, 30] as const;

/**
 * WEIGHTED magnitude roll for a NEGATIVE — index-aligned with {@link RABBIT_VALUES},
 * monotonically DECREASING so the bigger the penalty the RARER it appears (the level-
 * design call). Read as ~percentages (they sum to 100): −10 lands ~60% of negative
 * rolls, −20 ~30%, and the worst −30 only ~10%. The two negative slots each draw from
 * this table INDEPENDENTLY (they may land the same rank — no de-dup). The positive +
 * killer are not rolled.
 */
const RABBIT_VALUE_WEIGHTS = [60, 30, 10] as const;

/** Exactly one positive (fixed +10) + two negative rabbits (rolled) each field; the
 *  killer is the always-present, un-rolled 4th slot (see {@link SnakeEngine.spawnField}). */
const POSITIVE_COUNT = 1;
const NEGATIVE_COUNT = 2;

/**
 * SCORE FLOOR — the running score can never read below this. A penalty that would
 * push it negative just pins it here. Rationale: a negative score is a
 * demoralizing, meaningless trophy and breaks the leaderboard / sparkline (which
 * assume non-negative). The penalty's real teeth are the lost points + the extra
 * (unwanted) length + the speed-accel progress a +10 grab would have given.
 */
const SCORE_FLOOR = 0;

/**
 * Pick a NEGATIVE's RANK (an index into {@link RABBIT_VALUES}) by the weighted table —
 * a standard cumulative-weight roll. Bigger magnitudes have smaller weights, so the
 * draw is biased toward −10 (the −30 is rare). Called once per negative slot, each an
 * INDEPENDENT draw (the two may coincide). The positive is fixed +10, never rolled.
 */
function pickRank(): number {
  const total = RABBIT_VALUE_WEIGHTS.reduce((a, b) => a + b, 0);
  let r = Math.random() * total;
  for (let i = 0; i < RABBIT_VALUE_WEIGHTS.length; i++) {
    r -= RABBIT_VALUE_WEIGHTS[i];
    if (r < 0) return i;
  }
  return RABBIT_VALUE_WEIGHTS.length - 1;
}

/**
 * Fairness: cells an "AVOID" rabbit (a negative OR the lethal killer) may NEVER spawn
 * into, measured from the snake head. `HEAD_AHEAD` blocks the next N cells the head
 * will step through on its current heading (zero-reaction-time grabs) and
 * `HEAD_RADIUS` blocks a small Chebyshev ring around the head (a hazard materialising
 * right beside the head is just as unfair). Applied to all THREE avoid rabbits so a
 * −score grab — or an instant DEATH on the killer — is always AVOIDABLE. The single
 * +10 positive skips the exclusion (a free target — it may appear in your lap).
 */
const HEAD_AHEAD = 3;
const HEAD_RADIUS = 2;

/**
 * POSITIVE rabbit "twitch around its own axis" — the SAME wobble the nav-bar
 * white-rabbit easter-egg plays on hover (`@keyframes mono-jiggle` in
 * `tailwind.css`), ported to the canvas so the prize jerks on its axis with the
 * exact same character. The CSS keyframes (phase → degrees) ARE reproduced verbatim
 * in {@link NAVBAR_TWITCH_KEYS}; {@link sampleTwitch} eases between the stops the way
 * the CSS `ease-in-out` does. The CSS loop is 0.4s (~{@link TWITCH_DUR_FRAMES} frames
 * at ~60fps); we play that wobble, then HOLD STILL for the rest of a
 * {@link TWITCH_PERIOD_FRAMES} cycle, so it reads as a periodic TWITCH (a jerk, then
 * a beat of stillness) rather than a constant spin. Frozen under reduced motion
 * (deg → 0 → a static plain-white bunny; the white body alone then says "chase me").
 */
const NAVBAR_TWITCH_KEYS: { t: number; deg: number }[] = [
  { t: 0, deg: 0 },
  { t: 0.2, deg: -7 },
  { t: 0.4, deg: 6 },
  { t: 0.6, deg: -4 },
  { t: 0.8, deg: 3 },
  { t: 1, deg: 0 },
];
const TWITCH_DUR_FRAMES = 24; // the 0.4s mono-jiggle loop at ~60fps
const TWITCH_PERIOD_FRAMES = 78; // wobble (24) + ~0.9s still beat between jerks

/**
 * NEGATIVE rabbit motion — the penalties "laugh": a CONTINUOUS gentle vertical BOB
 * (up/down, never a rotation — owner spec) PLUS an INTERMITTENT horizontal SHAKE in
 * "ha-ha-ha" bursts so the silhouette visibly trembles with laughter. The bob runs
 * the whole time (so a negative never sits perfectly still and is always told from
 * the twitching positive); the laugh-shake fires in bursts via {@link burstWave}.
 * Both freeze under reduced motion (a static striped bunny; the RED ear stripes then
 * carry the "dodge me"). The two negatives are de-phased by their cell so they don't
 * bob in lockstep (see {@link drawNegative}).
 *  - BOB:   vertical offset, amplitude {@link NEG_BOB_AMP} of a cell, continuous.
 *  - SHAKE: horizontal jitter, amplitude {@link LAUGH_SHAKE_AMP} of a cell, bursty.
 */
const NEG_BOB_AMP = 0.1;
const NEG_BOB_FREQ = 0.18;
const LAUGH_SHAKE_AMP = 0.06;
const LAUGH_SHAKE_FREQ = 0.9;
/** The "ha-ha-ha" laugh-burst envelope: animate the first {@link SPECIAL_ANIM_BURST}
 *  frames of each {@link SPECIAL_ANIM_CYCLE}-frame cycle, hold still the rest (see
 *  {@link burstWave}) — rhythmic shaking bursts with still pauses, like laughter. */
const SPECIAL_ANIM_CYCLE = 100;
const SPECIAL_ANIM_BURST = 35;

/**
 * KILLER "menace" pulse — the lethal red bunny slowly BREATHES (a size throb) so it
 * reads as alive + dangerous, NOT a joke (it never "laughs"). A slow, ominous swell
 * rather than the negatives' jittery bob. Frozen to scale 1 under reduced motion (a
 * static solid-red silhouette — the colour alone then carries the "death").
 */
const KILLER_PULSE_AMP = 0.1;
const KILLER_PULSE_FREQ = 0.12;

/** Cubic smoothstep — a cheap stand-in for CSS `ease-in-out` between twitch stops. */
function easeInOut(t: number): number {
  return t * t * (3 - 2 * t);
}

/**
 * Sample the nav-bar twitch curve at phase `p` in [0,1] → degrees. Walks
 * {@link NAVBAR_TWITCH_KEYS} (the verbatim `mono-jiggle` keyframes) and eases
 * between the bracketing stops, so the canvas twitch traces the exact same
 * wobble path as the header rabbit.
 */
function sampleTwitch(p: number): number {
  for (let i = 1; i < NAVBAR_TWITCH_KEYS.length; i++) {
    const a = NAVBAR_TWITCH_KEYS[i - 1];
    const b = NAVBAR_TWITCH_KEYS[i];
    if (p <= b.t) {
      const local = (p - a.t) / (b.t - a.t);
      return a.deg + (b.deg - a.deg) * easeInOut(local);
    }
  }
  return 0;
}

// ---- canvas palette (literal hex — the 2D context can't resolve CSS vars) ----

/**
 * Board field — a fixed dark gray, painted OPAQUE every frame on EVERY theme. (A
 * transparent / theme-following canvas was tried and reverted: the game palette
 * is dark-tuned, so the board just stays this gray everywhere.) The head's
 * direction notch is punched back to this same gray.
 */
const BOARD_BG = "#141414";
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
/** Red rabbit / red tint — `--m-error` (dark theme): the penalty/danger colour.
 *  Used for the negatives' RED ear stripes (1–3, the only stripe colour now), the
 *  solid-RED killer body, and the red explosion chips. (The positive has NO stripes —
 *  it's a plain white bunny — so there is no longer a bonus-stripe colour at all.) */
const RABBIT_RED = "#ff6b6b";
/**
 * Faint cell grid — a SEMI-TRANSPARENT white so it adapts to whatever theme bg
 * shows through the transparent canvas (dark `--m-bg #141414`, neo's slightly
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
 * Faint cell-BACKGROUND wash behind each glyph snake segment (glyph mode only) —
 * a subtle accent-green fill on the cell so the body reads more clearly on the
 * dark {@link BOARD_BG}, WITHOUT competing with the glyphs (which still paint at
 * full strength on top). The wash's OPACITY tapers head→tail: brightest at the
 * head, fading to ~transparent at the tail, so the snake visibly dissolves into
 * its wake (the owner's "from first to last cell the opacity decreases so it
 * fades out").
 *
 *  - {@link GLYPH_BG} is the wash colour (the lime {@link ACCENT}, mirroring
 *    `--m-accent` on the dark theme — the canvas can't read CSS vars).
 *  - {@link GLYPH_BG_HEAD_ALPHA} → {@link GLYPH_BG_TAIL_ALPHA} are the alpha
 *    endpoints, LERPED linearly across the body by each segment's head→tail
 *    position. Head sits at the high end (~0.18), the tail floor is ~0
 *    (transparent), so the fill genuinely fades out.
 *  - The wash fills a slightly INSET rect (a {@link GLYPH_BG_INSET}-cell margin
 *    each side) so the squares read as a soft body trail, not a hard grid of
 *    full cells; the inset is snapped to the device-pixel grid (no blur).
 */
const GLYPH_BG = ACCENT;
const GLYPH_BG_HEAD_ALPHA = 0.18;
const GLYPH_BG_TAIL_ALPHA = 0;
/** Per-side inset of the wash rect, as a fraction of a cell (keeps the fill off
 *  the grid lines so adjacent segments read as a trail, not a solid block). */
const GLYPH_BG_INSET = 0.08;
/**
 * Churn cadence — how many render frames a stream POSITION holds its glyph
 * before re-rolling (the rain flicker). The HEAD re-rolls faster (it's the live
 * leading glyph). Bigger = calmer/more readable; smaller = busier shimmer. Kept
 * slow enough to read, never a strobe. Frozen entirely under reduced motion.
 */
const GLYPH_CHURN_FRAMES = 16;
const GLYPH_HEAD_CHURN_FRAMES = 7;

// ---- RED-SPARK ("ouch" / death) particle burst ----
// Fires on EVERY NEGATIVE grab AND on the KILLER death (nothing else explodes —
// the +10 never does; a wall/self death stays silent). The chips are ALWAYS pure RED
// ({@link RABBIT_RED} / `--m-error`) — never any accent/white mix (owner rule: a
// penalty sparks red, full stop). The MAGNITUDE maps to one thing only: the COUNT of
// red chips — bigger minus → MORE red sparks (−10 = few, −30 = more, the KILLER = the
// maximal blast at {@link KILLER_SPARK_MAGNITUDE}). Size/spread keep a light scale so
// a big hit reads bigger, but the COLOUR is 100% red at every magnitude. Purely
// cosmetic; frozen under reduced motion (the hook passes `animate = false`, so the
// engine never seeds a burst — no info is motion-only).

/** Chips for the MAXIMAL blast (the killer) — the full punchy spray. Penalties scale
 *  DOWN from this anchor. */
const EXPLOSION_COUNT_MAX = 26;
/** The spark-intensity reference (count = `magnitude / PENALTY_REF`). Held at 50 —
 *  ABOVE the worst penalty (−30) on purpose, so the negative ladder (−10/−20/−30)
 *  scales BELOW the cap and the KILLER (passing {@link KILLER_SPARK_MAGNITUDE}) is the
 *  strictly biggest burst, not tied with −30. */
const PENALTY_REF = 50;
/** The KILLER death-burst magnitude — the reference (50), so it yields the maximal
 *  red blast (full count + widest spread); the killer is the biggest "ouch" there is. */
const KILLER_SPARK_MAGNITUDE = PENALTY_REF;
/** Floor so even the smallest penalty (−10) still reads as a real little burst,
 *  not one or two stray chips. −10 → ~max(6, 26·10/50 = ~5) = 6 chips. */
const EXPLOSION_COUNT_MIN = 6;
/** Burst lifetime (ms): ~0.7s of gravity + fade, then it self-clears. */
const EXPLOSION_MS = 700;
/** Extra spray spread + chip size at the killer vs the −10 (a bigger blast throws
 *  chips a touch wider/larger — colour is unaffected, always red). */
const SPARK_SPEED_BOOST = 0.6;

/** Normalised penalty intensity in [0,1]: 0 at the smallest magnitude (10), 1 at
 *  the reference (50 = the killer). Drives the light size/spread scale (NOT colour). */
function penaltyIntensity(magnitude: number): number {
  const lo = RABBIT_VALUES[0];
  return Math.min(1, Math.max(0, (magnitude - lo) / (PENALTY_REF - lo)));
}

/**
 * Map a magnitude (`abs(score delta)`) → red-chip COUNT, scaled linearly off the
 * PENALTY_REF anchor and floored so a small penalty still reads as a burst:
 *   −10 → 6 (fewest) · −20 → ~10 · −30 → ~16 · killer (50) → 26 (most). Every chip is
 * red; only the count grows. The +10 never calls this (only negatives + the killer
 * explode).
 */
function explosionCountFor(magnitude: number): number {
  const scaled = Math.round((EXPLOSION_COUNT_MAX * magnitude) / PENALTY_REF);
  return Math.max(EXPLOSION_COUNT_MIN, Math.min(EXPLOSION_COUNT_MAX, scaled));
}

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

/** Sprite occupies this fraction of the cell (a touch smaller, centered). */
const SPRITE_FILL = 0.85;
/** Body + tail render a touch larger — `scale` lifts their effective fill to ~0.9
 *  of the cell (owner request); the snake HEAD stays at the 0.85 default. */
const BODY_TAIL_SCALE = 0.9 / SPRITE_FILL;
/** Every rabbit renders at this effective cell-fill — a hair larger than the base so
 *  the thin EAR STRIPES stay legible at game cell size. IDENTICAL for ALL four (owner:
 *  same body size — the plain-white +10 and the red-striped negatives are the same
 *  bunny, and the KILLER stands out ONLY by its solid-red fill + menace pulse, NEVER by
 *  size). `scale` is relative to {@link SPRITE_FILL}. */
const RABBIT_BODY_SCALE = 0.96 / SPRITE_FILL;

/**
 * IN-GAME rabbit bitmap — ALL four rabbits share ONE WHITE-bodied bunny silhouette of
 * identical geometry/size; only the colouring differs. A 7-wide × 13-tall bunny: two
 * long ears (rows 0–6) over a white head/body (rows 7–12; the eyes are the transparent
 * `0` gaps, neutral). {@link stripedRabbit} builds the NEGATIVE variant per RANK,
 * colouring `rank + 1` RED stripe bands across BOTH ears, bottom-anchored on
 * alternating rows so 1..3 stay countable. The POSITIVE (+10) and the KILLER use the
 * un-striped {@link RABBIT_PLAIN} (the same bitmap with NO `C` bands), filled white and
 * solid-red respectively.
 *
 *  - `1` = white body ({@link RABBIT_WHITE}).
 *  - `C` = a STRIPE pixel — RED ({@link RABBIT_RED}), the penalty colour, supplied at
 *    draw time by {@link stripeColor}. (Only negatives have stripes now.)
 *  - `.` = transparent (board shows through).
 *
 * The ear columns (1–2 and 4–5) are filled every row so each ear reads as a solid
 * white blade; a stripe row just recolours those ear pixels. Because stripes live IN
 * the bitmap, the existing sprite transforms (bob / shake / twitch) carry them along
 * automatically — no separate overlay to keep in sync.
 */
const RABBIT_EAR_WHITE = ".11.11.";
const RABBIT_EAR_STRIPE = ".CC.CC.";
/** Stripe SLOT rows on the 7-row ear region, bottom → top — THREE slots now (the
 *  ladder tops out at 3 stripes / −30). A rank lights the first `rank + 1` of these,
 *  so rank 0 shows the single lowest band and rank 2 all three; the alternating gap
 *  rows (5/3) keep the bands visually separate at cell size, and the top ear rows
 *  (0/1) stay white tips. */
const RABBIT_STRIPE_SLOTS = [6, 4, 2] as const;
const RABBIT_EAR_ROWS = 7;
/** The white head/body/feet beneath the ears, eye row PLAIN — the eyes are the `0`
 *  gaps (transparent sockets), nose = the `0`. Used by {@link RABBIT_PLAIN} (the
 *  POSITIVE +10 and the KILLER), so neither gets coloured eyes. */
const RABBIT_FACE = [
  "1111111",
  "1011101",
  "1110111",
  "1111111",
  "0111110",
  "0100010",
] as const;

/** The SAME face but with RED-marked eyes. Each eye is **2px wide** (`EE` at cols
 *  1–2 and 4–5 of the eye row — a touch bigger than a 1px dot so the red eyes read,
 *  but still restrained, the silhouette unchanged) and sits directly UNDER the red ear
 *  stripes (same cols 1–2 / 4–5), so the red eyes line up with the red ears. Used by
 *  {@link stripedRabbit} — the NEGATIVE rabbits get RED eyes bundled with their red
 *  stripes (owner). The positive/killer keep the plain {@link RABBIT_FACE} (transparent
 *  sockets). Footprint is identical to {@link RABBIT_FACE} (same 7×6 grid). */
const RABBIT_FACE_EYES = [
  "1111111",
  "1EE1EE1", // eyes (cols 1–2 & 4–5, 2px wide) → red on the negative variant
  "1110111",
  "1111111",
  "0111110",
  "0100010",
] as const;

/** Build the striped (NEGATIVE) bunny bitmap for `rank` (0..2): `rank + 1` RED-`C`
 *  stripe bands across both ears (bottom-anchored), then the RED-EYED white face. */
function stripedRabbit(rank: number): string[] {
  const lit = new Set<number>(RABBIT_STRIPE_SLOTS.slice(0, rank + 1));
  const rows: string[] = [];
  for (let r = 0; r < RABBIT_EAR_ROWS; r++) {
    rows.push(lit.has(r) ? RABBIT_EAR_STRIPE : RABBIT_EAR_WHITE);
  }
  for (const f of RABBIT_FACE_EYES) rows.push(f);
  return rows;
}

/**
 * The POSITIVE (+10) bunny silhouette — the EXACT same geometry/size as
 * {@link stripedRabbit} (the same 7-row white ears + the plain {@link RABBIT_FACE})
 * but with NO stripe bands. Filled white ({@link RABBIT_WHITE}) via {@link solidColor}
 * it's the plain white prize, its eyes left as transparent sockets (same as in-game).
 * All four rabbits are PIXEL-FOR-PIXEL the same silhouette + size — only the colouring
 * differs (plain white / white + red stripes + red eyes / solid red + black eyes). The
 * killer reuses the same ears + an eye-face ({@link RABBIT_KILLER}); there is no second
 * geometry. Exported so the header easter-egg ({@link RabbitMark}) renders this EXACT
 * silhouette as its SVG icon, 1:1 with the in-game white (+10) rabbit (`1` = a body
 * pixel; `0`/`.` = transparent — the eye sockets + outline gaps).
 */
export const RABBIT_PLAIN: readonly string[] = [
  ...Array.from({ length: RABBIT_EAR_ROWS }, () => RABBIT_EAR_WHITE),
  ...RABBIT_FACE,
];

/** Resolve a striped (NEGATIVE) rabbit cell: `1` = white body, `C` = the RED stripe
 *  colour, `E` = a RED eye (always {@link RABBIT_RED} — the red eyes ride along with
 *  the red stripes), else transparent. */
function stripeColor(stripe: string): (ch: string) => string | null {
  return (ch) =>
    ch === "1"
      ? RABBIT_WHITE
      : ch === "C"
        ? stripe
        : ch === "E"
          ? RABBIT_RED
          : null;
}

/** Resolve a single-fill silhouette ({@link RABBIT_PLAIN}): `1` = the fill, else
 *  transparent. Used by the POSITIVE (filled white, transparent eye sockets). */
function solidColor(fill: string): (ch: string) => string | null {
  return (ch) => (ch === "1" ? fill : null);
}

/** KILLER eye colour — pure BLACK. The killer body is solid {@link RABBIT_RED}, so a
 *  red eye would vanish on it; black reads with hard contrast (~6:1+ on the red) and
 *  gives the lethal bunny a menacing stare. */
const KILLER_EYE = "#000000";

/**
 * The KILLER bitmap — the EXACT same geometry/size as {@link RABBIT_PLAIN} (same white
 * ears + the {@link RABBIT_FACE_EYES} face), so its silhouette/footprint is identical
 * to every other rabbit. The difference is purely colour, via {@link killerColor}: the
 * whole body (`1`) fills solid red and the eye cells (`E`, the SAME 2px cols 1–2 / 4–5
 * as the negatives' red eyes) fill BLACK. So the "dangerous" rabbits — the negatives
 * and the killer — all carry visible eyes in the same spot (red on white, black on
 * red), reading as one family. No extra geometry: it reuses the shared ear + eye-face.
 */
const RABBIT_KILLER: readonly string[] = [
  ...Array.from({ length: RABBIT_EAR_ROWS }, () => RABBIT_EAR_WHITE),
  ...RABBIT_FACE_EYES,
];

/** Resolve a KILLER cell: `1` = the solid-red body, `E` = a BLACK eye, else
 *  transparent. */
function killerColor(ch: string): string | null {
  return ch === "1" ? RABBIT_RED : ch === "E" ? KILLER_EYE : null;
}

/**
 * Sentinel HEAD sprite — the owner's hand-decoded 7×8 Matrix-"sentinel" bitmap,
 * AUTHORED FACING UP (the spiky `.M.M.M.` antennae/sensor row is at the TOP =
 * the creature's FRONT; the rounded `.MMMMM.` / `..MMM..` chin is at the BOTTOM
 * = the back, where the body trails off). `M` = the creature's body pixel (the
 * bright lime accent — kept identical to the body so head + body read as ONE
 * creature, and so the sentinel stays VISIBLE on the dark `#141414` field; it is
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

/** What a rabbit IS: the plain-white bonus (+10), a red-striped penalty, or the
 *  lethal (solid-red) killer. */
type RabbitKind = "positive" | "negative" | "killer";

/**
 * One of the four live rabbits. `kind` drives behaviour + render; `value` is the
 * SIGNED score delta (`+10` for the positive, `−10/−20/−30` for a negative; 0 and
 * unused for the killer — eating it ends the run before any scoring); `rank` (0..2,
 * index into {@link RABBIT_VALUES}) drives the RED ear-stripe COUNT for a NEGATIVE
 * (unused for the positive, which has no stripes, and the killer, which has none).
 */
interface Rabbit {
  cell: Cell;
  kind: RabbitKind;
  value: number;
  rank: number;
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
 * hunting rabbits. The board ALWAYS carries EXACTLY FOUR rabbits: ONE POSITIVE (a
 * PLAIN WHITE bunny, fixed +10, NO stripes) + TWO NEGATIVE penalties (white bunnies
 * with 1–3 RED ear stripes + RED eyes = −10/−20/−30; the two roll independently and may
 * match) + ONE always-present KILLER (the same bunny filled SOLID RED with BLACK eyes,
 * no stripes — INSTANT DEATH to eat). All four are the same silhouette + size; only the
 * colouring differs (white = good · red stripes 1–3 = penalty · solid red = death).
 * Eating ANY of the
 * four RE-GENERATES the WHOLE field (fresh cells for all four — the killer relocates
 * too — and fresh ranks for the two negatives; the +10 needs no roll). MOTION is the
 * subtler tell: the +10 TWITCHES about its axis (the nav-bar rabbit wobble), the
 * negatives BOB + laugh-SHAKE, the killer slowly MENACE-pulses. Score is clamped ≥0;
 * every non-lethal eat grows the snake by exactly +1. Death is a wall hit (when not
 * wrapping), a self-hit, OR the killer. ("Follow the white rabbit.")
 */
export class SnakeEngine {
  private snake: Cell[] = [];

  private dir: Cell = { x: 1, y: 0 };
  /** Buffered direction changes (FIFO). step() consumes one per tick, so two
   *  quick turns within a single tick (e.g. up→left around a corner) BOTH
   *  register instead of the second being dropped or mis-rejected as a reverse. */
  private dirQueue: Cell[] = [];
  /** Max buffered turns; extra inputs within one tick are ignored. */
  private readonly dirQueueMax = 2;
  /**
   * The FOUR live rabbits — always exactly one POSITIVE, two NEGATIVE, and one
   * KILLER (see {@link Rabbit}). The whole array is replaced on EVERY eat by
   * {@link spawnField} (every rabbit, the killer included, relocates).
   */
  private rabbits: Rabbit[] = [];

  private stepMs = SPEED_MS.classic;
  private frame = 0;

  private score = 0;

  /** Live red-spark chips. Empty unless a NEGATIVE grab or the KILLER death just
   *  fired the burst; they animate out + down and fade, then clear. The positive
   *  never seeds chips. */
  private chips: Chip[] = [];
  /** Grid cell the explosion is centred on (chip offsets are relative to it). */
  private explosionCell: Cell | null = null;
  /** `performance.now()` the explosion started; 0 = no active explosion. */
  private explosionStart = 0;

  constructor(
    private speed: Speed = "classic",
    // Wrap-walls is the ACTIVE behavior: edges are pass-through (exit one edge,
    // re-enter the opposite). With wrapping the run ends from a self-hit OR eating
    // the lethal KILLER rabbit — never from a wall. The outer frame stays as the
    // visual board edge.
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

  /** Reset to a fresh run (centre snake + a fresh trio of rabbits). */
  reset() {
    const cx = Math.floor(GRID_W / 2);
    const cy = Math.floor(GRID_H / 2);
    this.snake = [
      { x: cx, y: cy },
      { x: cx - 1, y: cy },
      { x: cx - 2, y: cy },
    ];
    this.dir = { x: 1, y: 0 };
    this.dirQueue = [];
    this.stepMs = SPEED_MS[this.speed];
    this.score = 0;
    this.chips = [];
    this.explosionCell = null;
    this.explosionStart = 0;
    // The board ALWAYS opens with the full field — 1 positive + 2 negative + the
    // always-present killer, the +10 fixed + the two negatives' ranks freshly rolled.
    this.spawnField();
  }

  /**
   * RE-GENERATE the whole rabbit field: place a brand-new FOUR — ONE positive (fixed
   * +10) + TWO negative (freshly-rolled ranks) + the always-present KILLER — on fresh
   * free cells. Called on {@link reset} and on EVERY eat (the owner's "any eaten rabbit
   * regenerates everything", killer included — it relocates on every bite).
   *
   * The single POSITIVE is placed FIRST with no head-path exclusion (a free target on
   * your path is fair) and is a FIXED {@link POSITIVE_VALUE} (no roll). The three AVOID
   * rabbits — both NEGATIVES (INDEPENDENT weighted ranks; they may land the SAME rank,
   * no de-dup) and the KILLER — are then placed avoiding the snake, the already-placed
   * rabbits, AND the {@link headExclusion}, so neither a −score grab nor an instant
   * DEATH can land on the head's unavoidable next cells. Each placement re-reads the
   * live {@link rabbitCells} so the four never overlap (nor sit on the snake); the
   * head-path block is computed ONCE (the head is fixed during a respawn).
   */
  private spawnField() {
    this.rabbits = [];
    const headBlock = this.headExclusion();
    for (let i = 0; i < POSITIVE_COUNT; i++) {
      const cell = this.freeCell(this.rabbitCells());
      this.rabbits.push({
        cell,
        kind: "positive",
        value: POSITIVE_VALUE,
        rank: 0, // unused — the +10 has no stripes
      });
    }
    for (let i = 0; i < NEGATIVE_COUNT; i++) {
      // Each negative rolls its rank INDEPENDENTLY (the two may coincide — no de-dup).
      const rank = pickRank();
      const cell = this.freeCell(this.rabbitCells(), headBlock);
      this.rabbits.push({
        cell,
        kind: "negative",
        value: -RABBIT_VALUES[rank],
        rank,
      });
    }
    // The KILLER — the always-present 4th slot. An "avoid" rabbit, so it honours the
    // same head-path exclusion (an instant death must never be unavoidable) and the
    // no-overlap placement; it relocates here on every eat like the rest.
    this.rabbits.push({
      cell: this.freeCell(this.rabbitCells(), headBlock),
      kind: "killer",
      value: 0,
      rank: 0,
    });
  }

  /** Queue a direction change. Validates against the LAST queued turn (or the
   *  live direction when the queue is empty), so a 180° reverse is rejected and
   *  an identical repeat is a no-op; buffers up to {@link dirQueueMax} turns so
   *  fast successive presses aren't lost. */
  steer(x: number, y: number) {
    const ref = this.dirQueue.length
      ? this.dirQueue[this.dirQueue.length - 1]
      : this.dir;
    if (x === ref.x && y === ref.y) return;
    if (x === -ref.x && y === -ref.y) return;
    if (this.dirQueue.length >= this.dirQueueMax) return;
    this.dirQueue.push({ x, y });
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

  /** All currently-occupied rabbit cells — passed as `extra` exclusions so no two
   *  of the four rabbits ever overlap. */
  private rabbitCells(): Cell[] {
    return this.rabbits.map((r) => r.cell);
  }

  /**
   * The set of cells an "AVOID" rabbit (a negative OR the lethal killer) is forbidden
   * to spawn into, keyed `"x,y"`: the next {@link HEAD_AHEAD} cells straight ahead of
   * the head on its current heading (the unavoidable path) PLUS a {@link HEAD_RADIUS}
   * Chebyshev ring around the head. Both are wrap-corrected (cells that fall off an
   * edge re-enter the opposite side) because walls are pass-through, so the "path
   * ahead" genuinely continues across the seam. This is what guarantees no unavoidable
   * −score grab — and, crucially, no unavoidable instant DEATH on the killer.
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
    for (let dy = -HEAD_RADIUS; dy <= HEAD_RADIUS; dy++) {
      for (let dx = -HEAD_RADIUS; dx <= HEAD_RADIUS; dx++) {
        add(head.x + dx, head.y + dy);
      }
    }
    // The reaction-zero path directly ahead on the current heading.
    for (let i = 1; i <= HEAD_AHEAD; i++) {
      add(head.x + this.dir.x * i, head.y + this.dir.y * i);
    }
    return blocked;
  }

  /**
   * Advance one tick. Returns the outcome for the hook to project to state.
   * `animate` (default true) gates EVERY red-spark burst — the survivable NEGATIVE
   * grab "ouch" AND the KILLER death-burst — so under reduced motion the hook passes
   * `false` and both are silent (the static overlay carries it), matching the
   * project's reduced-motion contract. Death from a WALL (not wrapping) or a SELF hit
   * is always silent; the KILLER rabbit is the one lethal-on-eat hazard.
   */
  step(animate = true): StepResult {
    if (this.dirQueue.length) this.dir = this.dirQueue.shift()!;
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

    // Which rabbit (if any) is on the cell the head is stepping into? At most one
    // rabbit per cell (spawn exclusions guarantee no overlap), so this resolves to
    // a single rabbit. `-1` = an empty cell (a plain move).
    let eatenIndex = -1;
    for (let i = 0; i < this.rabbits.length; i++) {
      const c = this.rabbits[i].cell;
      if (c.x === nx && c.y === ny) {
        eatenIndex = i;
        break;
      }
    }
    const ate = eatenIndex >= 0;

    // Self-collision. The new head must miss the body that will REMAIN this step.
    // The tail FREES UP only when the snake does NOT grow: on an eat the snake
    // grows +1 (the tail stays put — its last cell is still occupied and IS a
    // collision); on a normal move the tail pops one cell — that freed cell is a
    // legal landing. So we exclude the trailing cell from the check on a plain move,
    // and check the whole body on an eat.
    const bodyToCheck = ate
      ? this.snake
      : this.snake.slice(0, this.snake.length - 1);
    if (bodyToCheck.some((s) => s.x === nx && s.y === ny)) {
      return this.dead();
    }

    this.snake.unshift({ x: nx, y: ny });

    if (ate) {
      const r = this.rabbits[eatenIndex];

      // KILLER — eating the lethal red bunny is INSTANT game over, exactly like a
      // wall/self hit. Resolved HERE, BEFORE any scoring/growth/respawn (its `value`
      // is moot — the run ends). Fire the BIG red death-burst at the head cell (the
      // maximal spray, gated by `animate` like every burst → reduced motion = silent,
      // the static game-over overlay carries it) and return dead. The head was just
      // unshifted onto the killer cell, so the burst centres there. The hook flips to
      // "over" and fires `onGameOver` once with the final score (leaderboard intact).
      if (r.kind === "killer") {
        if (animate) this.explodeAt({ x: nx, y: ny }, KILLER_SPARK_MAGNITUDE);
        return this.dead();
      }

      // Apply the signed payload, clamped ≥0 (a penalty never underflows the floor).
      this.score = Math.max(SCORE_FLOOR, this.score + r.value);
      if (r.value > 0) {
        // The POSITIVE is the reward → it ramps the step timer (the classic
        // per-pellet accel). Negatives give no speed reward (eating one is a mistake).
        this.stepMs = Math.max(STEP_FLOOR, this.stepMs - STEP_ACCEL);
      } else if (animate) {
        // A NEGATIVE grab sparks a pure-red "ouch" whose chip COUNT scales with the
        // magnitude (the lone non-lethal thing that explodes).
        this.explodeAt({ x: nx, y: ny }, -r.value);
      }
      // ANY non-lethal eat RE-GENERATES the whole field — fresh cells for all four
      // (the killer relocates too) + fresh weighted ranks (the owner's "any eaten
      // rabbit regenerates everything"). Runs AFTER the head advanced, so the avoid
      // rabbits' head-path exclusion reads the new head.
      this.spawnField();
    } else {
      // Plain move: pop the tail (length holds). Every non-lethal EAT keeps the tail
      // (+1 growth) — positive AND negative; nothing ever shrinks the snake.
      this.snake.pop();
    }

    return {
      dead: false,
      ate,
      score: this.score,
      length: this.snake.length,
    };
  }

  /**
   * Seed a RED-SPARK burst centred on `cell` for a NEGATIVE grab (or the KILLER
   * death) of magnitude `magnitude`. Every chip is pure {@link RABBIT_RED} — the
   * magnitude maps ONLY to the chip COUNT ({@link explosionCountFor}): bigger →
   * more red sparks (the killer passes {@link KILLER_SPARK_MAGNITUDE} for the
   * maximal blast). A light size/spread scale ({@link SPARK_SPEED_BOOST}) lets a
   * bigger hit read bigger, but the colour is 100% red at every magnitude. The draw
   * loop animates + clears it; under reduced motion it never seeds (caller gates).
   */
  private explodeAt(cell: Cell, magnitude: number) {
    const count = explosionCountFor(magnitude);
    const intensity = penaltyIntensity(magnitude);
    const speedScale = 1 + SPARK_SPEED_BOOST * intensity;
    this.explosionCell = cell;
    this.explosionStart = 0; // stamped on the first draw frame
    this.chips = Array.from({ length: count }, () => {
      const ang = Math.random() * Math.PI * 2;
      const spd = (0.04 + Math.random() * 0.1) * speedScale; // cell-units / frame
      return {
        ox: 0,
        oy: 0,
        vx: Math.cos(ang) * spd,
        vy: Math.sin(ang) * spd - 0.05, // a touch of initial lift
        // Bigger blasts throw slightly bigger chips too (colour stays red).
        size: (0.12 + Math.random() * 0.16) * (0.9 + 0.3 * intensity),
        color: RABBIT_RED, // ALWAYS red — no accent/white mix (owner rule)
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
   * snake head; `scale` (default 1) lets the killer pulse + sizes the rabbits.
   *
   * `yOffsetCells` (default 0) shifts the WHOLE figure vertically by a fraction
   * of a cell — used by the negatives' laughing BOB, so the other sprites (head /
   * body / tail) stay dead-centred. The offset is converted to device px and snapped
   * to the device-pixel grid (alongside the centring round) so the sprite stays crisp
   * even mid-bob.
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
    xOffsetCells = 0,
    // AXIS-TWITCH: a small rotation (degrees) about the sprite's own centre — the
    // nav-bar `mono-jiggle` feel on the canvas, used ONLY by the POSITIVE rabbit (its
    // "chase me" twitch). Rotating the canvas resamples slightly, but
    // `imageSmoothingEnabled=false` keeps the pixel edges hard, and the wobble is
    // small + intermittent, so it reads as a crisp twitching bunny, not a blur.
    // 0 = no rotation (every other sprite stays axis-aligned + pixel-exact).
    rotateDeg = 0
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
    // AXIS-JIGGLE: rotate the canvas about the figure's centre (in CSS px, since
    // the ctx is pre-scaled by dpr) before painting the blocks, then restore.
    // Only the red-ears rabbit passes a non-zero angle; the save/rotate is skipped
    // entirely otherwise so every other sprite paints on the untouched transform.
    const jiggling = rotateDeg !== 0;
    if (jiggling) {
      const cxCss = (leftDev + spriteWdev / 2) / dpr;
      const cyCss = (topDev + spriteHdev / 2) / dpr;
      ctx.save();
      ctx.translate(cxCss, cyCss);
      ctx.rotate((rotateDeg * Math.PI) / 180);
      ctx.translate(-cxCss, -cyCss);
    }
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
    if (jiggling) ctx.restore();
  }

  /**
   * Intermittent "ha-ha-ha" laugh-burst envelope (the negatives' shake): returns a
   * sine that runs for the first {@link SPECIAL_ANIM_BURST} frames of each
   * {@link SPECIAL_ANIM_CYCLE}-frame cycle and is 0 (held still) the rest of the time
   * — so the shake reads as rhythmic bursts with still pauses, like laughter. Driven
   * off the shared render-frame counter so it free-runs the whole time the rabbit is
   * on the board. Returns 0 when `animate` is false (reduced motion → no shake).
   */
  private burstWave(animate: boolean, freq: number): number {
    if (!animate) return 0;
    const phase = this.frame % SPECIAL_ANIM_CYCLE;
    if (phase >= SPECIAL_ANIM_BURST) return 0;
    return Math.sin(phase * freq);
  }

  /**
   * Draw the single POSITIVE rabbit: a PLAIN WHITE bunny — the un-striped
   * {@link RABBIT_PLAIN} silhouette filled {@link RABBIT_WHITE}, no stripes, no rank
   * (it's the fixed +10 prize) — that TWITCHES about its own axis (the nav-bar
   * `.mono-jiggle` wobble ported to canvas, {@link sampleTwitch}, fired in periodic
   * jerks by {@link twitchDeg}). Same silhouette + size as every other rabbit; it's
   * the ONLY all-white one, so white = the thing to chase. Told apart from the snake by
   * SHAPE (a solid bunny vs a churning glyph stream). Frozen to a static white bunny
   * under reduced motion (deg → 0; the plain white body alone then says "chase me").
   */
  private drawPositive(
    ctx: CanvasRenderingContext2D,
    cell: number,
    dpr: number,
    at: Cell,
    animate: boolean
  ) {
    const deg = this.twitchDeg(animate);
    this.drawSprite(
      ctx,
      cell,
      dpr,
      at,
      RABBIT_PLAIN,
      solidColor(RABBIT_WHITE),
      RABBIT_BODY_SCALE,
      0,
      0,
      false,
      0,
      deg
    );
  }

  /**
   * Draw ONE of the two NEGATIVE rabbits: a WHITE bunny with `rank+1` RED ear stripes
   * (1–3 for −10/−20/−30) — the SAME silhouette + size as the plain-white +10, so the
   * ONLY difference is the RED stripes and their COUNT. It "laughs": a continuous
   * vertical BOB (never a rotation) plus an intermittent horizontal laugh-SHAKE (the
   * {@link burstWave} "ha-ha-ha"). The two negatives are DE-PHASED by their cell so they
   * never bob/shake in lockstep. Frozen to a static striped bunny under reduced motion
   * (the red stripes then carry the "dodge me").
   */
  private drawNegative(
    ctx: CanvasRenderingContext2D,
    cell: number,
    dpr: number,
    at: Cell,
    rank: number,
    animate: boolean
  ) {
    // De-phase per cell so the two negatives aren't synchronised.
    const phase = (at.x * 1.3 + at.y * 0.7) % (Math.PI * 2);
    const bob = animate
      ? NEG_BOB_AMP * Math.sin(this.frame * NEG_BOB_FREQ + phase)
      : 0;
    const shake = LAUGH_SHAKE_AMP * this.burstWave(animate, LAUGH_SHAKE_FREQ);
    this.drawSprite(
      ctx,
      cell,
      dpr,
      at,
      stripedRabbit(rank),
      stripeColor(RABBIT_RED),
      RABBIT_BODY_SCALE,
      bob,
      0,
      false,
      shake
    );
  }

  /**
   * Draw the KILLER: literally the white rabbit's OWN bunny — the SAME {@link
   * RABBIT_KILLER} geometry (identical to {@link RABBIT_PLAIN} / {@link stripedRabbit})
   * at the SAME {@link RABBIT_BODY_SCALE} — but the WHOLE body fills solid {@link
   * RABBIT_RED} with a pair of BLACK eyes ({@link killerColor}) in the SAME 2px cells
   * (cols 1–2 / 4–5) where the negatives carry their red eyes. So it is pixel-for-pixel
   * the same silhouette + size; the ONLY difference is the colour (solid red body +
   * black eyes). The black eyes make it read as one "dangerous" family with the
   * red-eyed negatives, while the solid red still screams death. Its standout is purely
   * that colour + a slow MENACE-pulse (a size throb about its own scale, NOT the
   * negatives' jittery laugh — a threat, not a joke), never a different shape or
   * footprint. Frozen to a static frame under reduced motion (the colour carries it).
   */
  private drawKiller(
    ctx: CanvasRenderingContext2D,
    cell: number,
    dpr: number,
    at: Cell,
    animate: boolean
  ) {
    const pulse = animate
      ? 1 + KILLER_PULSE_AMP * Math.sin(this.frame * KILLER_PULSE_FREQ)
      : 1;
    this.drawSprite(
      ctx,
      cell,
      dpr,
      at,
      RABBIT_KILLER,
      killerColor,
      RABBIT_BODY_SCALE * pulse
    );
  }

  /**
   * The positive's axis-TWITCH angle (degrees) this frame: play the nav-bar wobble
   * curve over the first {@link TWITCH_DUR_FRAMES} of each {@link TWITCH_PERIOD_FRAMES}
   * cycle, then HOLD at 0 — a periodic jerk, not a constant spin. 0 under reduced
   * motion (a static bunny).
   */
  private twitchDeg(animate: boolean): number {
    if (!animate) return 0;
    const phase = this.frame % TWITCH_PERIOD_FRAMES;
    if (phase >= TWITCH_DUR_FRAMES) return 0;
    return sampleTwitch(phase / TWITCH_DUR_FRAMES);
  }

  // ---------- glyph (matrix-rain) renderer (SNAKE_RENDER === "glyph") ----------

  /**
   * Draw ONE matrix glyph centred in cell `at`, in `color`, with an optional
   * vertical bob (`yOffsetCells`, fraction of a cell — kept for symmetry with the
   * sprite path's bob). The font is sized to {@link GLYPH_FILL} of the cell and the draw
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
   * Paint the faint inset cell-BACKGROUND wash behind one glyph snake segment
   * (glyph mode), at `alpha` (the head→tail-faded opacity). A slightly inset
   * square of {@link GLYPH_BG} so the body trail reads on the dark field; the
   * inset + box are snapped to the device-pixel grid so the fill stays crisp
   * (no blur), matching the sprite rasteriser's discipline. No-op at alpha ≤ 0
   * (the tail end), so the very end of the snake costs nothing and is invisible.
   */
  private drawGlyphBg(
    ctx: CanvasRenderingContext2D,
    cell: number,
    dpr: number,
    at: Cell,
    alpha: number
  ) {
    if (alpha <= 0) return;
    const cellDev = cell * dpr;
    const insetDev = Math.round(GLYPH_BG_INSET * cellDev);
    const leftDev = Math.round(at.x * cellDev) + insetDev;
    const topDev = Math.round(at.y * cellDev) + insetDev;
    const sizeDev = Math.round(cellDev) - insetDev * 2;
    if (sizeDev <= 0) return;
    ctx.globalAlpha = alpha;
    ctx.fillStyle = GLYPH_BG;
    // Device px → CSS px (the ctx is pre-scaled by `dpr`).
    ctx.fillRect(leftDev / dpr, topDev / dpr, sizeDev / dpr, sizeDev / dpr);
    ctx.globalAlpha = 1;
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
      // Faint cell-background wash UNDER the glyph, opacity tapering head→tail:
      // `t` is 0 at the head, 1 at the tail, so the alpha lerps from the bright
      // head endpoint down to the (transparent) tail floor — the body fades out.
      // Painted first so the full-strength glyph always lands on top.
      const t = len <= 1 ? 0 : i / (len - 1);
      const bgAlpha =
        GLYPH_BG_HEAD_ALPHA + (GLYPH_BG_TAIL_ALPHA - GLYPH_BG_HEAD_ALPHA) * t;
      this.drawGlyphBg(ctx, cell, dpr, seg, bgAlpha);
      if (i === 0) {
        // HEAD — bright leading glyph, fast flicker.
        this.drawGlyph(ctx, cell, dpr, seg, glyphFor(0, headEpoch), GLYPH_HEAD);
      } else {
        // Body fades from bright green just behind the head to deep green at the
        // tail (eased so most of the stream stays clearly green and only the
        // last cells go dim).
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
   * Draw the live game: clear field → rabbit trio → body → head → sparks. `dpr` is
   * the canvas device-pixel ratio (the ctx is pre-scaled by it); the rabbit sprites
   * need it to rasterise on whole device pixels (see {@link drawSprite}).
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

    // Rabbits — the field of FOUR (1 positive + 2 negative + the always-present
    // killer), ALWAYS the bunny-silhouette SPRITES in BOTH render modes (owner
    // preference — the pixel bunnies read better than glyph rabbits). All four are the
    // SAME white bunny silhouette + size; only the colour differs: the +10 is plain
    // WHITE (no stripes), a negative is white with 1–3 RED ear stripes + RED eyes
    // (= −10/−20/−30), the killer is SOLID RED with BLACK eyes. The motion tell (twitch
    // / laugh-bob / menace-pulse) is the subtler second channel. Readability is
    // non-negotiable — the player must LOOK.
    for (const r of this.rabbits) {
      if (r.kind === "killer") this.drawKiller(ctx, cell, dpr, r.cell, animate);
      else if (r.kind === "positive")
        this.drawPositive(ctx, cell, dpr, r.cell, animate);
      else this.drawNegative(ctx, cell, dpr, r.cell, r.rank, animate);
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

    // Red-spark chips (a NEGATIVE "ouch" grab or the KILLER death) draw on top of the
    // snake. Only ever non-empty when a negative/killer was eaten and motion is
    // allowed (the engine gates seeding on `animate` → reduced motion = no burst).
    this.drawExplosion(ctx, cell);
  }
}
