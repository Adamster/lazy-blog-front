/** The two steps of the post composer: 1 = Setup, 2 = Write. */
export type ComposerStep = 1 | 2;

/** Fields that must be valid before advancing from Setup → Write. */
export const STEP1_FIELDS = ["title", "summary"] as const;
