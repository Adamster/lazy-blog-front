# StatusBadge stamp redesign

## Goal

Replace the filled-pill `StatusBadge` with a rotated, double-outline "print stamp" look (reference: user-provided screenshot of a rotated accent frame around `LATEST DROP` text). Same treatment covers the admin-featured post marker.

## Changes

1. **Rename status value:** `Status = "LATEST DROP" | "PINNED"` → `"LATEST DROP" | "FEATURED"`.
   - `src/shared/ui/feedback/status-badge.tsx`
   - `src/shared/ui/feedback/status-badge.test.tsx`
   - `src/app/brand/design-guide.tsx`

2. **`StatusBadge` visual rewrite** (`status-badge.tsx`):
   - Drop the filled `--m-dim` pill and the Bolt/MapPin icon.
   - Outer `inline-block rotate-6`, transparent background.
   - Double contour: two stacked `absolute inset-0 border-2 border-[var(--m-accent)]` layers, inner one at `inset-1` (4px offset) — the stamp-ring look.
   - Text: 11px/700/`tracking-[0.06em]` uppercase, `text-[var(--m-accent)]`, `px-2.5 py-2` padding inside the inner border (same padding as the old pill).
   - `className` prop still forwarded for absolute positioning by call sites.

3. **`home-page.tsx`:** no structural change — `StatusBadge` already sits as an absolute sibling of the cover `Link`, unaffected by clipping. Visual swap only.

4. **`post-view.tsx`:**
   - Remove `StatusBadge` from the inline header row next to `Category`.
   - Wrap the cover in an outer `relative` div (no `overflow-hidden`), keeping the existing `overflow-hidden` image div nested inside it.
   - Render `{status && <StatusBadge status={status} className="absolute top-5 right-5 z-[var(--m-z-content)]" />}` as a sibling of that inner div. `status` stays hardcoded `null` (no backend field yet) — this only relocates the future mount point onto the cover.

5. **`design-guide.tsx` showcase:** rename the `"PINNED"` state to `"FEATURED"`; verify the panel backdrop still reads the transparent-bordered stamp clearly (adjust demo backdrop if needed).

## Out of scope

- No backend field for admin-featured posts yet — `post-view.tsx` status stays `null`.
- `PostCard` grid items untouched (badge only applies to hero/full post cover, not feed-card thumbnails).
