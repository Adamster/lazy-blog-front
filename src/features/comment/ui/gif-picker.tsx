"use client";

import { useEffect, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { MagnifyingGlassIcon } from "@heroicons/react/24/outline";
import { Spinner } from "@/shared/ui";
import { prefersReducedMotion } from "@/shared/lib/prefers-reduced-motion";
import { fetchTrendingGifs, searchGifs, type GifResult } from "../lib/giphy";

const focusRing =
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--m-accent)]";

/** A bare status line in the brutalist label scale (loading / empty / error). */
function StatusLine({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-40 items-center justify-center px-4 text-center text-[11px] font-medium tracking-[0.12em] text-[var(--m-muted2)] uppercase">
      {children}
    </div>
  );
}

interface GifPickerProps {
  /** Fired with the validated GIF when a result is chosen. */
  onPick: (gif: GifResult) => void;
}

/**
 * GIF tab — a labelled debounced search input over the Giphy CDN with a results
 * grid. Trending GIFs show by default; typing searches (300ms debounce). All
 * three async states are designed: a spinner while loading, an empty line when a
 * search returns nothing, and an error line on failure (incl. the beta-key 429
 * rate limit). Thumbnails lazy-load; under reduced-motion the static first frame
 * is shown instead of the animated thumbnail.
 */
export function GifPicker({ onPick }: GifPickerProps) {
  const [query, setQuery] = useState("");
  const [debounced, setDebounced] = useState("");
  const reduced = useReducedMotion();

  // Debounce the query → only the settled value drives the request.
  useEffect(() => {
    const id = setTimeout(() => setDebounced(query.trim()), 300);
    return () => clearTimeout(id);
  }, [query]);

  const { data, isPending, isError, refetch } = useQuery({
    queryKey: ["giphy", debounced || "trending"],
    queryFn: ({ signal }) =>
      debounced ? searchGifs(debounced, signal) : fetchTrendingGifs(signal),
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    retry: 1,
  });

  return (
    <div>
      <div className="flex items-center gap-2.5 border-b-2 border-[var(--m-dim)] bg-[var(--m-card)] px-3">
        <MagnifyingGlassIcon
          className="size-3.5 shrink-0 text-[var(--m-muted2)]"
          aria-hidden="true"
        />
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          aria-label="Search GIFs"
          placeholder="Search GIFs"
          autoComplete="off"
          className={`w-full border-0 bg-transparent py-2.5 text-[14px] leading-[1.6] text-[var(--m-fg)] caret-[var(--m-accent)] outline-none placeholder:text-[var(--m-muted2)] ${focusRing}`}
          style={{ fontFamily: "var(--font-mono)" }}
        />
      </div>

      <div className="mono-scrollbar h-56 overflow-y-auto bg-[var(--m-dim)]">
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
              Couldn&apos;t load GIFs · Retry
            </button>
          </StatusLine>
        ) : data.length === 0 ? (
          <StatusLine>No GIFs found</StatusLine>
        ) : (
          <div className="grid grid-cols-2 gap-[2px]">
            {data.map((gif) => (
              <button
                key={gif.id}
                type="button"
                aria-label={`Insert ${gif.title}`}
                onClick={() => onPick(gif)}
                className={`group relative flex aspect-[4/3] items-center justify-center overflow-hidden bg-[var(--m-card)] transition-opacity hover:opacity-80 ${focusRing}`}
              >
                {/* Plain <img>: Giphy hosts aren't in next.config remotePatterns
                    (owner can't edit Vercel config), and the GIF must animate. */}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={reduced ? gif.stillUrl : gif.thumbUrl}
                  alt=""
                  loading="lazy"
                  className="h-full w-full object-cover"
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
