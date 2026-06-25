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
 * ============================ RABBIT TYPE SYSTEM ============================
 *
 * Six rabbit kinds drive scoring + growth. TWO are ALWAYS-PRESENT BASE rabbits — the
 * WHITE staple food and the red-eyed LAUGHER (a −10 penalty) — each respawns the
 * instant it's eaten, so the board always carries both (the owner's "effectively two
 * base rabbits"). The other FOUR are transient SPECIALS that appear/leave on a
 * CAPTURE cadence (NOT a move/time/frame timer — see {@link SnakeEngine.captures}):
 * a special is spawned ON the capture whose running count hits its cadence, and
 * lingers exactly until the next bite (a one-capture lifetime). At most ONE of each
 * type on the board at a time. Driving spawns off captures (the owner's "a move = when you ATE
 * a rabbit") means rabbits ONLY ever change in response to the player eating — they
 * never flicker on a clock independent of play.
 *
 * BALANCE GUARDS baked into this table + the engine (the level-design verdict):
 *  - SCORE is CLAMPED at >= 0 (see {@link SCORE_FLOOR}) — penalties cost you
 *    progress, never a meaningless negative trophy / negative leaderboard.
 *  - LENGTH: every eat grows the snake by EXACTLY +1 cell (kinds differ ONLY in
 *    score) — nothing ever shrinks. Death = walls/self, PLUS the fully-RED body
 *    (eating it is INSTANT DEATH, resolved before any length change); the old
 *    touch-to-die hazard is GONE.
 *  - At most one of each kind = max 6 rabbits on the board (2 always-present base —
 *    white + laugher — plus the 4 transient one-bite specials), so the field stays
 *    readable, never a swarm.
 *  - Each type is distinguished by COLOR ZONE *and* MOTION (two channels) so the
 *    near-identical white variants are still instantly separable (see the render
 *    section + {@link RabbitKind}).
 */
type RabbitKind =
  | "white" // staple food
  | "laugher" // white + RED EYES — the old trickster, now a SCORE penalty
  | "greenEars" // white + GREEN ears — a calm bonus
  | "redEars" // white + RED ears — a jiggling penalty
  | "green" // fully GREEN body — the high-value prize (+30)
  | "red"; // fully RED body — INSTANT DEATH (lethal, like a self-hit; see step())

/** Per-type payload: the SCORE delta (the only thing that differs by kind). Score
 *  is clamped >=0 after applying it (so a penalty never underflows). LENGTH is NOT
 *  per-kind — every eat grows the snake by exactly +1 cell (see {@link step}). */
interface RabbitSpec {
  score: number;
}
const RABBIT_SPEC: Record<RabbitKind, RabbitSpec> = {
  white: { score: 10 },
  laugher: { score: -10 },
  greenEars: { score: 20 },
  redEars: { score: -20 },
  green: { score: 30 }, // fully-green body — the high-value lime prize
  red: { score: -50 }, // fully-red body — INSTANT DEATH (see step())
};

/**
 * SCORE FLOOR — the running score can never read below this. A penalty that would
 * push it negative just pins it here. Rationale: a negative score is a
 * demoralizing, meaningless trophy and breaks the leaderboard / sparkline (which
 * assume non-negative). The penalty's real teeth are the LENGTH loss + lost
 * speed-accel progress, not a sub-zero number.
 */
const SCORE_FLOOR = 0;

/**
 * SPECIAL SPAWN CADENCE (in CAPTURES) + LIFETIME (in CAPTURES), per type. The
 * cadence is the owner's original intent: a "move" = a CAPTURE (eating ANY rabbit),
 * so a special spawns ON the capture whose running count is a multiple of its
 * `every` (e.g. `every: 3` → the 3rd, 6th, 9th… rabbit eaten brings the laugher),
 * AND that type isn't already on the board AND there's a free cell. This is the
 * old trickster's capture-keyed model generalised to all five — NOT a move/step/
 * frame/wall-clock timer, so the rabbits only ever change when the player eats and
 * never "flicker on a clock".
 *
 * LIFETIME is ALSO in captures. For the EARS + BODY specials it is ONE capture-
 * window: an uneaten special despawns on the VERY NEXT capture after it spawned. A
 * special spawned on capture N gets `despawnAtCapture = N + 1`, and
 * `despawnExpiredSpecials` (run on each eat, after `captures++`) clears it once
 * `captures >= N + 1` — i.e. the next rabbit you eat. So those specials are a single
 * "until your next bite" window: grab it now or it's gone — it goes stale by play,
 * not by a clock, and never lingers across multiple grabs. (The spawn that sets it
 * runs AFTER the despawn check on the same capture, so it is never cleared on the
 * capture it appeared.)
 *
 *  - laugher (−10): the SECOND BASE rabbit — ALWAYS on the board alongside the
 *    white staple (owner's "effectively two base rabbits"). It is NOT on a sparse
 *    cadence and NOT on a one-bite lifetime: its `every` is 1 (so it re-spawns on
 *    the very next capture after it's eaten, the way the white respawns) and its
 *    lifetime is {@link NEVER_DESPAWN} (a sentinel = "never auto-despawn"), so the
 *    despawn pass NEVER clears it. It is ALWAYS-PRESENT (it only ever leaves the
 *    board by being eaten, then respawns at a fresh free cell on that capture) — but
 *    its CELL now RE-RANDOMIZES on EVERY capture via {@link
 *    SnakeEngine.reshuffleRabbits} (the owner's "any eat reshuffles the whole
 *    field"), so it relocates on each bite rather than staying put. So the board
 *    always carries white + laugher, both jumping to fresh cells on every eat.
 *  - greenEars (+20) / redEars (−20): a matched bonus/penalty PAIR, same cadence
 *    (every 7th) — risk/reward symmetry. Distinguished by ear color + (decisively)
 *    motion: green-ears STATIC (safe), red-ears JIGGLES (danger).
 *  - green (+30) / red (LETHAL): the high-stakes pair, rarer (every 12th) — a
 *    one-window "chase it / dodge it" event, gone if you don't act on the next bite.
 *    The green (+30) is the prize; the fully-red body is INSTANT DEATH (eating it
 *    ends the run, like a self-hit — see {@link SnakeEngine.step}), so the "dodge
 *    it" is now literal: brush past the red or the run is over.
 */
/**
 * Sentinel lifetime = "this special NEVER auto-despawns". A special stamped with
 * this `despawnAtCapture` is skipped by {@link SnakeEngine.despawnExpiredSpecials}
 * (the comparison `captures >= Infinity` is never true), so the despawn pass leaves
 * it on the board forever — it only ever leaves by being eaten. Used by the laugher
 * so it behaves like a SECOND BASE rabbit (a stable fixture, like the white), not a
 * transient special. Reads cleaner than a magic huge number.
 */
const NEVER_DESPAWN = Infinity;
// The laugher is a BASE rabbit now: `every: 1` = it re-spawns on the very next
// capture whenever it's off the board (the way the white respawns the instant it's
// eaten), and its lifetime is NEVER_DESPAWN so the despawn pass never clears it —
// it persists in place until eaten, then respawns at a fresh cell. Always present.
const LAUGHER_EVERY = 1;
const LAUGHER_LIFE = NEVER_DESPAWN;
const GREEN_EARS_EVERY = 7;
const GREEN_EARS_LIFE = 1;
const RED_EARS_EVERY = 7;
const RED_EARS_LIFE = 1;
const GREEN_EVERY = 12;
const GREEN_LIFE = 1;
const RED_EVERY = 12;
const RED_LIFE = 1;

/** The five non-white kinds + their CAPTURE cadence/lifetime, in spawn-resolution
 *  order (penalties first so a bonus can't crowd a penalty off a tight board —
 *  though the cap is per-type so order rarely matters). `every`/`life` are both in
 *  CAPTURES. Drives the generic capture-keyed spawn loop — including the LAUGHER's
 *  always-present respawn (`every: 1` / `life: NEVER_DESPAWN`): it's listed here so
 *  the one spawn pass also re-places it the capture after it's eaten. */
const SPECIAL_SCHEDULE: {
  kind: RabbitKind;
  every: number;
  life: number;
}[] = [
  { kind: "laugher", every: LAUGHER_EVERY, life: LAUGHER_LIFE },
  { kind: "redEars", every: RED_EARS_EVERY, life: RED_EARS_LIFE },
  { kind: "greenEars", every: GREEN_EARS_EVERY, life: GREEN_EARS_LIFE },
  { kind: "red", every: RED_EVERY, life: RED_LIFE },
  { kind: "green", every: GREEN_EVERY, life: GREEN_LIFE },
];

/**
 * Fairness: cells a PENALTY rabbit may NEVER spawn into, measured from the snake
 * head. `HEAD_AHEAD` blocks the next N cells the head will step through on its
 * current heading (zero-reaction-time grabs) and `HEAD_RADIUS` blocks a small
 * Chebyshev ring around the head (a penalty materialising right beside the head
 * is just as unfair). Applied to the penalty specials (laugher / redEars / red)
 * so a −score/−length grab is always AVOIDABLE — never an unavoidable −50. Bonus
 * specials + white skip the exclusion (a free reward on your path is fine).
 */
const HEAD_AHEAD = 3;
const HEAD_RADIUS = 2;

/** Which kinds are penalties → get the head-path spawn exclusion (never land on
 *  the player's unavoidable next cells). */
const PENALTY_KINDS = new Set<RabbitKind>(["laugher", "redEars", "red"]);

/**
 * LAUGHER "laughing" bob — INTERMITTENT, not a constant wobble: the sprite bobs in
 * BURSTS separated by a still pause, looping, like laughter. Driven off the shared
 * render-frame counter so it free-runs the whole time the rabbit is on the board.
 * Every {@link SPECIAL_ANIM_CYCLE} frames the first {@link SPECIAL_ANIM_BURST}
 * frames animate (a sine off the IN-BURST phase so it starts AND ends near zero —
 * no snap when it stops), then hold still. Frozen entirely under reduced motion
 * (static legible frame — the color zone alone still distinguishes the type).
 *  - BOB: vertical offset, amplitude {@link LAUGH_BOB_AMP} of a cell.
 */
const LAUGH_BOB_AMP = 0.12;
const LAUGH_BOB_FREQ = 0.45;
const SPECIAL_ANIM_CYCLE = 100;
const SPECIAL_ANIM_BURST = 35;

/**
 * RED-EARS "danger" jiggle — the agitated shake tell on the −20 penalty. Unlike
 * the laugher's INTERMITTENT bob, this is a CONTINUOUS shake that runs the WHOLE
 * time the rabbit is on the board (owner: it must "unmistakably jiggle the whole
 * time", never sit still mid-pause) — a still red-ears bunny would be
 * indistinguishable from the static SAFE green-ears, defeating the safe-vs-danger
 * motion channel. A {@link AXIS_JIGGLE_DEG}° rotate-wobble about the sprite's OWN
 * centre (the nav-bar `mono-jiggle` feel), at a wide enough amplitude (14°, up
 * from the old ±9° burst-gated version that read as "not moving") that the crisp
 * pixel bunny visibly SHAKES at any cell size. Runs at {@link AXIS_JIGGLE_FREQ}
 * (a brisk, agitated shake). Frozen under reduced motion (deg → 0 → the static
 * legible red-eared frame; the red ears alone then carry the "penalty" read).
 */
const AXIS_JIGGLE_DEG = 14;
const AXIS_JIGGLE_FREQ = 0.7;

/**
 * Dangerous PULSE (the fully-RED body only) — a fast agitated size-breathing throb
 * so the LETHAL red reads as "alive / dangerous" (eating it is INSTANT DEATH, so the
 * agitated throb is an earned warning, not bluff). MOTION encodes safe-vs-danger:
 * the SAFE rabbits (white, green-ears, AND the +30 GREEN body) are all STATIC, only
 * the threats move — so ONLY the red body pulses (the green prize had a calm
 * pulse, now removed: it's a still, solid-lime bunny, told apart from the green
 * snake glyph stream by SHAPE — a solid silhouette vs the churning stream — not by
 * motion). Frozen to scale 1 under reduced motion (then the shape carries it).
 */
const RED_PULSE_AMP = 0.14;
const RED_PULSE_FREQ = 0.22;

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
/** Red rabbit / red tint — `--m-error` (dark theme): the penalty color, never a
 *  reward. Used for the fully-red body, the red ears, and the laugher's red eyes. */
const RABBIT_RED = "#ff6b6b";
/**
 * GREEN rabbit / green tint — the site's lime accent (`--m-accent`, dark theme),
 * mirrored here as a literal because the canvas can't read CSS vars. Owner request:
 * the bonus rabbits use the SITE green so they match the colour scheme. NOTE this
 * is the SAME lime as the snake ({@link ACCENT}) — bonuses were originally gold
 * specifically to stay distinct from the creature; on the owner's call they're now
 * green, so the player separates bonus-rabbit from snake purely by SHAPE (a solid
 * bunny silhouette vs the snake's glyph-rain stream), NOT by colour and NOT by
 * motion (the green prize is STATIC now — all safe rabbits are still). Used for the
 * fully-green body and the green ears.
 */
const RABBIT_GREEN = ACCENT;
/** Laugher's eye color (the old trickster) — the penalty red, on a white body. */
const LAUGHER_EYE = RABBIT_RED;
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

// ---- explosion ("ouch" punch / death) particle burst ----
// Fires on a SURVIVABLE PENALTY-rabbit GRAB (the laugher −10, red-ears −20) as a
// punchy "ouch", AND — the original use — as the big DEATH burst when the snake
// eats the LETHAL fully-red body (−50 worth of spray, the most chips). The spray
// INTENSITY scales with the magnitude: the bigger the minus, the more chips fly, so
// the red death is the fullest burst. Death from a WALL/SELF hit stays silent (no
// burst — only the red body explodes on death). Purely cosmetic; frozen under
// reduced motion (the hook passes `animate = false`), where the static game-over /
// score overlay carries the end-state instead.

/** Explosion chip palette — the penalty red + the lime accent + white. */
const EXPLOSION_COLORS = [RABBIT_RED, ACCENT, "#ffffff"] as const;
/** Chips for the BIGGEST penalty (the −50 red) — the full punchy spray, unchanged
 *  from the original red burst. Smaller penalties scale DOWN from this anchor. */
const EXPLOSION_COUNT_MAX = 26;
/** The −50 red is the reference penalty; chip count scales `abs(delta) / 50`. */
const PENALTY_REF = 50;
/** Floor so even the smallest penalty (−10) still reads as a real little burst,
 *  not one or two stray chips. −10 → ~max(6, 26·10/50 = ~5) = 6 chips. */
const EXPLOSION_COUNT_MIN = 6;
/** Burst lifetime (ms): ~0.7s of gravity + fade, then it self-clears. */
const EXPLOSION_MS = 700;

/**
 * Map a penalty magnitude (`abs(score delta)`) → chip count, scaled linearly off
 * the −50 anchor and floored so a small penalty still reads as a burst:
 *   −10 → 6 (fewest) · −20 → ~10 (medium) · −50 → 26 (most, the full red spray).
 * Bonuses / white never call this (only negative deltas explode).
 */
function explosionCountFor(penaltyMagnitude: number): number {
  const scaled = Math.round(
    (EXPLOSION_COUNT_MAX * penaltyMagnitude) / PENALTY_REF
  );
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
 * EYE-MARKED bunny bitmap — the same big-eared 7×9 silhouette as
 * {@link RABBIT_SPRITE}, but the eye row's two body `1` pixels (cols 1 & 5 of the
 * `1011101` row) are marked `E` = an EYE pixel (tinted by the resolver). `1` →
 * body fill, `E` → eye tint, `0` → transparent. Used by the LAUGHER (white body,
 * RED eyes) — only the eyes differ from the plain food, so the body still reads
 * "white rabbit" while the red eyes + laughing bob flag the penalty.
 */
const EYES_SPRITE = [
  "0100010",
  "0100010",
  "0100010",
  "1111111",
  "1E111E1", // eyes (cols 1 & 5) → tinted
  "1110111",
  "1111111",
  "0111110",
  "0100010",
] as const;

/**
 * EAR-MARKED bunny bitmap — the same silhouette, but the two tall EAR pixels
 * (cols 1 & 5, rows 0–2 — the `0R00R0` rows) are marked `R` = an EAR pixel
 * (tinted by the resolver). `1` → body fill (white), `R` → ear tint, `0` →
 * transparent. Used by GREEN-EARS (+20, green ears, static) and RED-EARS (−20, red
 * ears, axis-jiggle) — same bitmap, the resolver supplies the ear color and the
 * motion tell decides the rest.
 */
const EARS_SPRITE = [
  "0R000R0",
  "0R000R0",
  "0R000R0",
  "1111111",
  "1011101",
  "1110111",
  "1111111",
  "0111110",
  "0100010",
] as const;

/** Resolve an EYE-marked cell: `1` = white body, `E` = the eye tint, else
 *  transparent. */
function eyesColor(eye: string): (ch: string) => string | null {
  return (ch) => (ch === "1" ? RABBIT_WHITE : ch === "E" ? eye : null);
}

/** Resolve an EAR-marked cell: `1` = white body, `R` = the ear tint, else
 *  transparent. */
function earsColor(ear: string): (ch: string) => string | null {
  return (ch) => (ch === "1" ? RABBIT_WHITE : ch === "R" ? ear : null);
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
 * hunting rabbits. TWO BASE rabbits are ALWAYS on the board: the staple WHITE
 * rabbit (+10/+1) and the red-eyed LAUGHER (−10/+1, a penalty that laughs) — each
 * respawns the instant it's eaten, so the field always carries both. FOUR more
 * SPECIAL rabbits appear/leave on a CAPTURE cadence (a "move" = eating any rabbit;
 * at most one of each, one-bite capture lifetimes): GREEN-EARS (+20) / RED-EARS
 * (−20) every 7th, and a fully-GREEN prize (+30) / fully-RED body every 12th. They
 * change ONLY when the player eats — never on a clock. MOTION encodes
 * safe-vs-danger: every SAFE (positive) rabbit is STATIC (white, green-ears, the
 * green prize), only the threats move (the laugher bobs, red-ears jiggles, the
 * red body throbs). Score is clamped ≥0; every eat grows the snake by exactly +1.
 * LETHAL = the walls (off when wrapping), the snake's own body, AND the fully-RED
 * body rabbit (eating it is INSTANT DEATH — the high-stakes "dodge it"). The
 * red-EARS (−20) and the LAUGHER (−10) are SURVIVABLE penalties, never lethal.
 * ("Follow the white rabbit.")
 */
export class SnakeEngine {
  private snake: Cell[] = [];

  private dir: Cell = { x: 1, y: 0 };
  private nextDir: Cell = { x: 1, y: 0 };
  /** The white rabbit (the always-present staple food). */
  private pellet: Cell | null = null;
  /**
   * The five SPECIAL rabbits currently on the board, keyed by kind — at most ONE
   * of each. Each entry carries its grid cell + the CAPTURE count at which it
   * despawns if not eaten (its lifetime ceiling, in captures). A missing key =
   * that special is not on the board; it'll re-appear on its next qualifying
   * capture (when {@link captures} next hits a multiple of its cadence).
   */
  private specials = new Map<
    RabbitKind,
    { cell: Cell; despawnAtCapture: number }
  >();
  /**
   * CAPTURE COUNTER — the running number of rabbits eaten this run (a "move" in the
   * owner's sense: a move = when you ATE a rabbit). This is the MASTER cadence for
   * every special's SPAWN (a special appears on the capture whose count is a
   * multiple of its `every`) AND its capture-based lifetime. There is NO step/time/
   * frame timer for spawning anymore — rabbits only ever change in response to the
   * player eating, so they never flicker on a clock. Distinct from {@link frame}
   * (render frames, ~60fps), which drives the draw pulses/bobs only.
   */
  private captures = 0;

  private stepMs = SPEED_MS.classic;
  private frame = 0;

  private score = 0;

  /** Live explosion chips. Empty unless a penalty GRAB (laugher / red-ears) or the
   *  lethal red-body DEATH just fired the burst; they animate out + down and fade,
   *  then clear (the death burst plays out on the game-over screen). */
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
    // The initial board carries the TWO BASE rabbits — the white staple + the
    // always-present laugher (the owner's "effectively two base rabbits"). The
    // EARS/BODY specials still start OFF the board; each first appears on the
    // capture whose count hits its cadence (greenEars/redEars on the 7th, green/red
    // on the 12th) — so the opening is calm and those specials fade in as the
    // player actually plays, never on a clock.
    this.specials.clear();
    this.captures = 0;
    this.chips = [];
    this.explosionCell = null;
    this.explosionStart = 0;
    this.spawnPellet();
    this.spawnLaugher();
  }

  /**
   * Place the always-present LAUGHER (the second base rabbit) on a fresh free cell
   * with the {@link NEVER_DESPAWN} sentinel lifetime, so the despawn pass never
   * clears it — it only ever leaves the board by being eaten (then its cell is
   * re-randomized every capture by {@link reshuffleRabbits}). Called on {@link
   * reset} (so the board opens with both base rabbits) and again whenever it's been
   * eaten (via the `every: 1` spawn in {@link resolveSpecialSpawns}). It's a PENALTY
   * (−10), so it honours the head-path exclusion — a base penalty must still be
   * avoidable, never materialising on the head's unavoidable next cells.
   */
  private spawnLaugher() {
    const cell = this.freeCell(this.rabbitCells(), this.headExclusion());
    this.specials.set("laugher", { cell, despawnAtCapture: NEVER_DESPAWN });
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

  /** All currently-occupied rabbit cells (white + every live special) — passed as
   *  `extra` exclusions so no two rabbits ever overlap. */
  private rabbitCells(): Cell[] {
    const cells: Cell[] = [];
    if (this.pellet) cells.push(this.pellet);
    for (const s of this.specials.values()) cells.push(s.cell);
    return cells;
  }

  /** Spawn a fresh white staple on a free cell, avoiding the snake + every live
   *  special. (Specials avoid the white the same way — no two rabbits overlap.)
   *  The OLD white cell is being replaced, so only the specials are excluded. */
  private spawnPellet() {
    const specialCells = [...this.specials.values()].map((s) => s.cell);
    this.pellet = this.freeCell(specialCells);
  }

  /**
   * Resolve the SPECIAL spawns triggered BY this capture. Called once per capture
   * (after {@link captures} is incremented), NOT per step/frame — so a special can
   * only ever appear ON a rabbit-eaten event. For each scheduled kind whose `every`
   * divides the new capture count, if it isn't already on the board, place ONE on a
   * free cell (PENALTY kinds also avoid the {@link headExclusion} so a −score grab
   * is always avoidable; bonuses skip it). This is the path that RESPAWNS the always-
   * present LAUGHER: its `every` is 1, so on the very next capture after it's eaten
   * it's off the board and gets re-placed (and stamped {@link NEVER_DESPAWN} via
   * `captures + Infinity`), exactly mirroring how the white staple respawns; while
   * it's still on the board the `has(kind)` guard skips RE-SPAWNING it here. (Its
   * CELL is still re-randomized every capture by {@link reshuffleRabbits}, which runs
   * AFTER this pass — the owner's "any eat reshuffles the whole field"; the
   * always-present laugher no longer stays put.) The 7th/12th specials get a finite
   * `captures + life` ceiling and despawn on the next bite. At most one of each kind
   * → max 6 rabbits.
   */
  private resolveSpecialSpawns() {
    for (const { kind, every, life } of SPECIAL_SCHEDULE) {
      // Cadence is in CAPTURES: spawn only on the capture whose running count is a
      // multiple of `every`. (`captures` is > 0 here — this runs post-eat.)
      if (this.captures % every !== 0) continue;
      if (this.specials.has(kind)) continue; // already on the board → skip
      const blocked = PENALTY_KINDS.has(kind)
        ? this.headExclusion()
        : undefined;
      const cell = this.freeCell(this.rabbitCells(), blocked);
      this.specials.set(kind, {
        cell,
        despawnAtCapture: this.captures + life,
      });
    }
  }

  /**
   * RESHUFFLE the WHOLE rabbit field — relocate every rabbit still on the board
   * (the white staple + every live special, incl. the always-present laugher) to a
   * fresh free cell. Called ONCE per capture in {@link step}, AFTER the eaten rabbit
   * is resolved and the capture-keyed despawn/spawn has run — so it moves whatever
   * remains: the freshly-respawned white, the persistent laugher, and any cadence
   * special still on the board. The owner's rule: ANY eat of ANY rabbit regenerates
   * EVERY rabbit's position — the white moves on every eat (not only when white is
   * eaten), and the laugher now RELOCATES on every eat too (reversing its old
   * stay-put behaviour; it stays always-present, only its CELL is re-randomized).
   *
   * Each rabbit is relocated in sequence off the LIVE board state: every placement
   * reuses {@link freeCell}, excluding the snake + every OTHER rabbit's current cell
   * (so no two rabbits ever overlap, and a rabbit isn't blocked by its OWN old cell
   * it's vacating). PENALTY kinds (laugher / redEars / red) keep honouring the
   * {@link headExclusion} exactly as on spawn — the now-LETHAL red and the −score
   * penalties can never land on the head's unavoidable next cells. The penalty
   * exclusion is computed ONCE up front (the head doesn't move during a reshuffle).
   */
  private reshuffleRabbits() {
    const headBlock = this.headExclusion();
    // Relocate a rabbit's cell to a fresh free spot, excluding every OTHER live
    // rabbit cell (`others`) so the field never overlaps, plus the head-path block
    // for penalty kinds. `others` reads the CURRENT cells (mutated in place as we
    // go), and skips the cell being replaced so it isn't blocked by itself.
    const relocate = (current: Cell, isPenalty: boolean): Cell => {
      const others = this.rabbitCells().filter(
        (c) => !(c.x === current.x && c.y === current.y)
      );
      return this.freeCell(others, isPenalty ? headBlock : undefined);
    };

    // White staple (a safe kind — no head exclusion).
    if (this.pellet) this.pellet = relocate(this.pellet, false);

    // Every live special, incl. the laugher — re-randomize each cell in place.
    for (const [kind, s] of this.specials) {
      s.cell = relocate(s.cell, PENALTY_KINDS.has(kind));
    }
  }

  /** Despawn any special whose CAPTURE-based lifetime ceiling has been reached
   *  (uneaten — `life` captures have passed since it spawned). Run once per
   *  capture so the board self-cleans on play cadence, never on a clock. The
   *  always-present LAUGHER is stamped {@link NEVER_DESPAWN} (= Infinity), so
   *  `captures >= Infinity` is never true and it is NEVER cleared here — it only
   *  ever leaves the board by being eaten (then respawns via the spawn pass). */
  private despawnExpiredSpecials() {
    for (const [kind, s] of this.specials) {
      if (this.captures >= s.despawnAtCapture) this.specials.delete(kind);
    }
  }

  /**
   * The set of cells a PENALTY rabbit is forbidden to spawn into, keyed `"x,y"`:
   * the next {@link HEAD_AHEAD} cells straight ahead of the head on its current
   * heading (the unavoidable path) PLUS a {@link HEAD_RADIUS} Chebyshev ring
   * around the head. Both are wrap-corrected (cells that fall off an edge re-enter
   * the opposite side) because walls are pass-through, so the "path ahead"
   * genuinely continues across the seam. This is what guarantees no unavoidable
   * −50 / −20 / −10.
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
   * `animate` (default true) gates EVERY EXPLOSION burst — the survivable
   * penalty-grab "ouch" (laugher / red-ears) AND the big DEATH burst on eating the
   * lethal fully-red body — under reduced motion the hook passes `false`, so the
   * grab/death is silent (no particles) and the static overlay carries it, matching
   * the project's reduced-motion contract. Death from a WALL/SELF hit is silent
   * regardless (only the red body explodes on death).
   */
  step(animate = true): StepResult {
    this.dir = this.nextDir;
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
    // rabbit per cell (spawn exclusions guarantee no overlap), so this resolves
    // to a single kind. Specials are checked first, then the white staple.
    let eaten: RabbitKind | null = null;
    for (const [kind, s] of this.specials) {
      if (s.cell.x === nx && s.cell.y === ny) {
        eaten = kind;
        break;
      }
    }
    if (!eaten && this.pellet && nx === this.pellet.x && ny === this.pellet.y) {
      eaten = "white";
    }

    // Self-collision. The new head must miss the body that will REMAIN this step.
    // The tail FREES UP only when the snake does NOT grow: on an eat the snake
    // grows +1 (the tail stays put — its last cell is still occupied and IS a
    // collision); on a normal move the tail pops one cell — that freed cell is a
    // legal landing. So we exclude the trailing cell from the check on a plain move,
    // and check the whole body on an eat.
    const bodyToCheck = eaten
      ? this.snake
      : this.snake.slice(0, this.snake.length - 1);
    if (bodyToCheck.some((s) => s.x === nx && s.y === ny)) {
      return this.dead();
    }

    this.snake.unshift({ x: nx, y: ny });

    // LETHAL RED BODY — the fully-RED (−50) rabbit is INSTANT DEATH, exactly like
    // hitting yourself (owner: "death on the red rabbit, like before"). It is
    // routed to the game-over path HERE — BEFORE any score/capture/growth
    // bookkeeping — so its −50 / +1 are moot (the run ends). The new head was just
    // unshifted onto the red cell, so we fire the BIG death EXPLOSION burst right
    // at that cell (the full red spray; this is what the explosion originally
    // marked — death, not a survivable grab) and return {@link dead}. The burst is
    // gated by `animate` like every other burst, so under reduced motion the grab
    // is silent and the static game-over overlay carries the end-state (the
    // project's reduced-motion contract). The hook sees `dead: true`, flips the
    // screen to "over" (the `onGameOver` score-submit fires once with the final
    // score), and the over-screen draw still plays the seeded burst out.
    //
    // ONLY the full red BODY is lethal — the red-EARS (−20) and the LAUGHER (−10)
    // stay SURVIVABLE penalties (they fall through to the score/shrink path below).
    // Lethal = walls (off when wrapping), self, and the red body. The head-path
    // spawn EXCLUSION ({@link headExclusion} / {@link PENALTY_KINDS}) still covers
    // `red`, so a now-LETHAL red can never materialise on the head's unavoidable
    // next cells — an unavoidable instant death is the cardinal sin.
    if (eaten === "red") {
      if (animate) {
        this.explodeAt(
          { x: nx, y: ny },
          explosionCountFor(-RABBIT_SPEC.red.score)
        );
      }
      return this.dead();
    }

    // Apply the eaten rabbit's payload (score clamped ≥0, length floored). The
    // surviving penalties (laugher / red-ears) fire the "ouch" burst; the white
    // still accelerates the step timer (the staple cadence reward). All surviving
    // specials are removed on eat. EATING IS THE ONE EVENT that advances the
    // special cadence: each eat (any kind, white included) is one CAPTURE — the
    // owner's "a move = when you ATE a rabbit". So we bump {@link captures} here and
    // (below) run the capture-keyed spawn/despawn. Nothing about the specials
    // changes on a non-eating step, so they never flicker on a clock.
    if (eaten) {
      const spec = RABBIT_SPEC[eaten];
      this.score = Math.max(SCORE_FLOOR, this.score + spec.score);
      this.captures++;
      if (eaten === "white") {
        // White staple: accelerate + respawn a fresh staple immediately so there
        // is always exactly one white on the board to hunt.
        this.stepMs = Math.max(STEP_FLOOR, this.stepMs - STEP_ACCEL);
        this.spawnPellet();
      } else {
        // A special was eaten → clear it (its slot frees up; it can re-appear on a
        // later qualifying capture). EVERY penalty special (negative score delta)
        // fires the "ouch" burst, with the chip count scaled to the penalty size —
        // −10 small, −20 medium, −50 the full spray. Bonuses don't explode.
        this.specials.delete(eaten);
        if (spec.score < 0 && animate) {
          this.explodeAt({ x: nx, y: ny }, explosionCountFor(-spec.score));
        }
      }
    }

    // Resolve length. The new head was already unshifted above, so we only manage
    // the TAIL: on an eat the snake grows +1 (keep the tail), on a normal move the
    // length holds (pop one tail cell). Every eat grows by exactly +1 — there is no
    // shrink path (the lethal red body returned `dead` above before reaching here).
    if (!eaten) this.snake.pop();

    // Capture-keyed special housekeeping — runs ONLY on an eat (the `captures` bump
    // above), NEVER on a plain step/frame/clock, so rabbits change only in response
    // to the player eating. Despawn the stale ones first (free their slots — and
    // the just-eaten special was already deleted above), then resolve the spawns
    // this capture triggers (reads the just-advanced head for the penalty
    // head-exclusion, so a fresh penalty never lands on the player's next cells).
    // FINALLY reshuffle the WHOLE remaining rabbit field to fresh cells — the
    // owner's rule that ANY eat regenerates EVERY rabbit's position (white moves on
    // every eat, the laugher relocates on every eat too). Run LAST so it moves
    // whatever the despawn/spawn left on the board, honouring the same overlap +
    // penalty head exclusions as spawning.
    if (eaten) {
      this.despawnExpiredSpecials();
      this.resolveSpecialSpawns();
      this.reshuffleRabbits();
    }

    return {
      dead: false,
      ate: eaten !== null,
      score: this.score,
      length: this.snake.length,
    };
  }

  /** Seed an explosion burst centred on `cell` (chips spray out + fall). `count`
   *  is the chip count for this burst, scaled to the penalty magnitude by the
   *  caller ({@link explosionCountFor}) — the bigger the minus, the more chips. The
   *  draw loop animates and clears it; under reduced motion it never seeds. */
  private explodeAt(cell: Cell, count: number) {
    this.explosionCell = cell;
    this.explosionStart = 0; // stamped on the first draw frame
    this.chips = Array.from({ length: count }, () => {
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
   * snake head; `scale` (default 1) lets the green/red rabbits pulse.
   *
   * `yOffsetCells` (default 0) shifts the WHOLE figure vertically by a fraction
   * of a cell — used ONLY by the laugher's laughing bob, so food / specials /
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
    xOffsetCells = 0,
    // AXIS-JIGGLE: a small rotation (degrees) about the sprite's own centre — the
    // nav-bar `mono-jiggle` feel on the canvas, used ONLY by the red-ears penalty
    // rabbit (its "danger" motion tell). Rotating the canvas resamples slightly,
    // but `imageSmoothingEnabled=false` keeps the pixel edges hard, and the wobble
    // is small + intermittent, so it reads as a crisp shaking bunny, not a blur.
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
   * Plain single-fill rabbit (white staple / fully-green / fully-red body) — the
   * base {@link RABBIT_SPRITE} silhouette painted in one `color`; `scale` lets the
   * green/red bodies breathe their value/danger pulse. Thin wrapper over the
   * generic {@link drawSprite}.
   */
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
   * Intermittent "burst" animation envelope shared by the laughing bob + the
   * axis-jiggle: returns a sine value that runs for the first
   * {@link SPECIAL_ANIM_BURST} frames of each {@link SPECIAL_ANIM_CYCLE}-frame
   * cycle and is 0 (held still) the rest of the time — so the motion reads as
   * rhythmic bursts (a "ha-ha-ha" / a shimmy) with still pauses between, like
   * laughter. Driven off the shared render-frame counter so it free-runs the whole
   * time the rabbit is on the board. Returns 0 when `animate` is false (reduced
   * motion → a static legible frame; the color zone alone still tells the type).
   */
  private burstWave(animate: boolean, freq: number): number {
    if (!animate) return 0;
    const phase = this.frame % SPECIAL_ANIM_CYCLE;
    if (phase >= SPECIAL_ANIM_BURST) return 0;
    return Math.sin(phase * freq);
  }

  /**
   * Draw ONE special rabbit by kind, applying its color zone + motion tell. MOTION
   * encodes SAFE-vs-DANGER: every SAFE (positive-score) rabbit is STATIC, only the
   * PENALTIES animate —
   *  - laugher (−10, PENALTY): white body + RED eyes, laughing vertical BOB.
   *  - greenEars (+20, SAFE): white body + GREEN ears, STATIC.
   *  - redEars (−20, PENALTY): white body + RED ears, AXIS-JIGGLE (danger wobble).
   *  - green (+30, SAFE): fully GREEN body, STATIC — a still solid-lime prize.
   *  - red (LETHAL): fully RED body, fast AGITATED pulse — eating it is INSTANT
   *    DEATH, so the dangerous throb is an earned warning (it draws the same; the
   *    lethality is enforced in {@link step}, not here).
   * All motion degrades to a static frame under reduced motion (see
   * {@link burstWave}); the white staple isn't routed here (it's a plain
   * {@link drawRabbit}). Sprites stay pixel-crisp; only the red-ears jiggle uses
   * a canvas rotation (small, intermittent — see {@link drawSprite}'s `rotateDeg`).
   */
  private drawSpecial(
    ctx: CanvasRenderingContext2D,
    cell: number,
    dpr: number,
    at: Cell,
    kind: RabbitKind,
    animate: boolean
  ) {
    switch (kind) {
      case "laugher": {
        const bob = LAUGH_BOB_AMP * this.burstWave(animate, LAUGH_BOB_FREQ);
        this.drawSprite(
          ctx,
          cell,
          dpr,
          at,
          EYES_SPRITE,
          eyesColor(LAUGHER_EYE),
          1,
          bob
        );
        return;
      }
      case "greenEars": {
        // STATIC — a SAFE (+20) bonus; all safe rabbits are still (safe = static).
        this.drawSprite(
          ctx,
          cell,
          dpr,
          at,
          EARS_SPRITE,
          earsColor(RABBIT_GREEN)
        );
        return;
      }
      case "redEars": {
        // Axis-jiggle (the `mono-jiggle` feel) — the "danger" motion tell.
        const deg = AXIS_JIGGLE_DEG * this.burstWave(animate, AXIS_JIGGLE_FREQ);
        this.drawSprite(
          ctx,
          cell,
          dpr,
          at,
          EARS_SPRITE,
          earsColor(RABBIT_RED),
          1,
          0,
          0,
          false,
          0,
          deg
        );
        return;
      }
      case "green": {
        // STATIC — the +30 prize is a SAFE rabbit, and "all safe ones are static"
        // (owner). Motion now encodes safe-vs-danger: a still bunny = safe, a moving
        // one = threat. So the green prize sits perfectly still (its solid lime fill
        // + the bunny silhouette carry it, telling it apart from the green snake
        // glyph stream by SHAPE, not by a pulse). No GREEN_PULSE_* anymore.
        this.drawRabbit(ctx, cell, dpr, at, RABBIT_GREEN);
        return;
      }
      case "red": {
        // Fast agitated throb — "dangerous".
        const pulse = animate
          ? 1 + RED_PULSE_AMP * Math.sin(this.frame * RED_PULSE_FREQ)
          : 1;
        this.drawRabbit(ctx, cell, dpr, at, RABBIT_RED, pulse);
        return;
      }
      default:
        return;
    }
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

    // Rabbits — the always-present white staple FOOD + every live SPECIAL (at most
    // one of each of the five). ALWAYS the bunny-silhouette SPRITES, in BOTH render
    // modes (owner preference — the pixel bunnies read better than glyph rabbits,
    // even when the snake itself is the green matrix-rain glyph stream). Each
    // special carries its own COLOR ZONE + MOTION tell (see {@link drawSpecial}) so
    // the near-identical white variants stay instantly distinct — readability is
    // non-negotiable. The white staple is plain + static; the specials are drawn
    // AFTER it so an overlap (there is none — spawn exclusions) would favour them.
    if (this.pellet) {
      this.drawRabbit(ctx, cell, dpr, this.pellet, RABBIT_WHITE);
    }
    for (const [kind, s] of this.specials) {
      this.drawSpecial(ctx, cell, dpr, s.cell, kind, animate);
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

    // Explosion chips (a penalty "ouch" grab, or the lethal red-body death) draw on
    // top of the snake. Only ever non-empty when a penalty/red was eaten and motion
    // is allowed (the engine gates seeding on the `animate` flag → reduced motion =
    // no burst).
    this.drawExplosion(ctx, cell);
  }
}
