"use client";

import { useEffect, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { MagnifyingGlassIcon } from "@heroicons/react/24/outline";
import { Spinner } from "@/shared/ui";
import { prefersReducedMotion } from "@/shared/lib/prefers-reduced-motion";
import {
  fetchTrending,
  searchMedia,
  type GifResult,
  type MediaKind,
} from "../lib/klipy";

const focusRing =
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--m-accent)]";

/** A bare status line in the brutalist label scale (loading / empty / error). */
function StatusLine({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-40 items-center justify-center text-center text-[11px] font-medium tracking-[0.12em] text-[var(--m-muted2)] uppercase">
      {children}
    </div>
  );
}

interface GifPickerProps {
  /** Fired with the validated GIF/sticker when a result is chosen. */
  onPick: (gif: GifResult) => void;
  /** Which KLIPY media to browse — `gif` or `sticker`. */
  kind: MediaKind;
}

/**
 * GIF tab — a labelled debounced search input over the KLIPY CDN with a results
 * grid. Trending GIFs show by default; typing searches (300ms debounce). All
 * three async states are designed: a spinner while loading, an empty line when a
 * search returns nothing, and an error line on failure. Thumbnails lazy-load;
 * under reduced-motion the static first frame is shown instead of the animated
 * thumbnail.
 */
export function GifPicker({ onPick, kind }: GifPickerProps) {
  const [query, setQuery] = useState("");
  const [debounced, setDebounced] = useState("");
  const reduced = useReducedMotion();
  const noun = kind === "sticker" ? "stickers" : "GIFs";

  // Debounce the query → only the settled value drives the request.
  useEffect(() => {
    const id = setTimeout(() => setDebounced(query.trim()), 300);
    return () => clearTimeout(id);
  }, [query]);

  const { data, isPending, isError, refetch } = useQuery({
    queryKey: ["klipy", kind, debounced || "trending"],
    queryFn: ({ signal }) =>
      debounced
        ? searchMedia(kind, debounced, signal)
        : fetchTrending(kind, signal),
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    retry: 1,
  });

  return (
    // pt-4/pb-4 frame the panel (16px top gap from the tabs, matching the emoji
    // grid + the px-4 side inset). The horizontal inset (px-4 — matching the
    // tabs) is applied PER-ELEMENT (search wrapper + grid), NOT on this root, so
    // the scroll area runs full-width and the brutalist scrollbar sits in its own
    // right gutter OUTSIDE the GIF grid (no scrollbar-over-GIF overlap); the
    // search + GIFs still align with the tab text at 16px.
    <div className="pt-4 pb-4">
      {/* Search — a 36px underline field (no fill), inset px-4 to align with the
          tabs + the GIF grid. */}
      <div className="px-4">
        <div className="flex h-9 items-center gap-2.5 border-b-2 border-[var(--m-dim)] transition-colors focus-within:border-[var(--m-accent)]">
          <MagnifyingGlassIcon
            className="size-3.5 shrink-0 text-[var(--m-muted2)]"
            aria-hidden="true"
          />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            aria-label={`Search ${noun}`}
            placeholder={`Search ${noun}`}
            autoComplete="off"
            className="h-full w-full border-0 bg-transparent text-[14px] leading-none text-[var(--m-fg)] caret-[var(--m-accent)] outline-none placeholder:text-[var(--m-muted2)]"
            style={{ fontFamily: "var(--font-mono)" }}
          />
        </div>
      </div>

      <div className="mono-scrollbar mt-3 h-48 overflow-y-auto">
        {isPending ? (
          <StatusLine>
            <Spinner className="text-[14px] text-[var(--m-accent)]" />
          </StatusLine>
        ) : isError ? (
          <StatusLine>
            <button
              type="button"
              onClick={() => refetch()}
              className={`tracking-[0.12em] text-[var(--m-error)] uppercase transition-colors hover:text-[var(--m-fg)] ${focusRing}`}
            >
              {`Couldn't load ${noun} · Retry`}
            </button>
          </StatusLine>
        ) : data.length === 0 ? (
          <StatusLine>{`No ${noun} found`}</StatusLine>
        ) : (
          <div className="grid grid-cols-3 gap-[2px] pr-[5px] pl-4">
            {data.map((gif) => (
              <button
                key={gif.id}
                type="button"
                aria-label={`Insert ${gif.title}`}
                onClick={() => onPick(gif)}
                className={`group relative flex aspect-[4/3] items-center justify-center overflow-hidden bg-[var(--m-card)] transition-opacity hover:opacity-80 ${focusRing}`}
              >
                {/* Plain <img>: KLIPY hosts aren't in next.config remotePatterns
                    (owner can't edit Vercel config), and the GIF must animate. */}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={reduced ? gif.stillUrl : gif.thumbUrl}
                  alt=""
                  loading="lazy"
                  className="h-full w-full object-contain"
                />
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

/** Client-only reduced-motion flag (SSR-safe: starts `false`, syncs on mount). */
function useReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false);
  const raf = useRef<number | undefined>(undefined);
  useEffect(() => {
    // Defer the setState out of the effect body (repo lint rule).
    raf.current = requestAnimationFrame(() =>
      setReduced(prefersReducedMotion())
    );
    return () => {
      if (raf.current !== undefined) cancelAnimationFrame(raf.current);
    };
  }, []);
  return reduced;
}
